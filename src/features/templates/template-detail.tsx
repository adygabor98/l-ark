import {
    useEffect,
    useRef,
    useState,
    type ReactElement
} from 'react';
import {
    TemplateCreationSteps
} from '../../constants';
import {
    useLocation,
    useNavigate
} from 'react-router-dom';
import {
    useForm,
    FormProvider
} from 'react-hook-form';
import {
    ReactFlowProvider
} from '@xyflow/react';
import {
    TemplateComponents,
    type TemplateFormSectionStructure,
    type TemplateFormStructure
} from '../../models/template.models';
import { Loader2 } from 'lucide-react';
import {
    useFileTemplate
} from '../../server/hooks/useFileTemplate';
import type {
    FetchResult
} from '@apollo/client';
import type {
    ApiResponse,
    FileTemplateDetail
} from '@l-ark/types';
import {
    useToast
} from '../../shared/hooks/useToast';
import { useTranslation } from "react-i18next";
import TemplateCreationForm from './components/template-creation-form';
import TemplateBuilder from './components/template-builder';

const TemplateDetail = (): ReactElement => {
    /** Location utilities */
    const { state } = useLocation();
    /** State to manage the step of the creation step */
    const [step, setStep] = useState<TemplateCreationSteps>(
        state?.step === 'builder' ? TemplateCreationSteps.TEMPLATE_BUILDER : TemplateCreationSteps.TEMPLATE_FORM
    );
    /** Navigation utilities */
    const navigate = useNavigate();
    /** Formulary definition */
    const methods = useForm<TemplateFormStructure>({
        mode: 'onChange',
        defaultValues: {
            title: '',
            description: '',
            divisions: [],
            operations: [],
            sections: []
        }
    });
    /** File template api utilities */
    const { fileTemplate, retrieveFileTemplateById, createFileTemplate, updateFileTemplate, publishFileTemplate, deleteLatestVersion } = useFileTemplate();
    /** Toast utilities */
    const { onToast, onConfirmationToast } = useToast();
    /** Translation utilities */
    const { t } = useTranslation();
    /** Track whether initial data has been loaded (needed when jumping straight to builder) */
    const [dataReady, setDataReady] = useState(!state?.id);

    useEffect(() => {
        if( state?.id ) {
            setDataReady(false);
            const initialize = async () => {
                const response: FetchResult<{ data: FileTemplateDetail }> = await retrieveFileTemplateById({ id: state.id });
                if( response.data?.data ) {
                    const { versions, divisions, ...rest } = response.data?.data

                    methods.reset({
                        title: rest.title,
                        description: rest.description,
                        divisions: (divisions ?? []).map(division => division.divisionId.toString()) as string[],
                        operations: [],
                        sections: ((versions ?? []).length > 0 ? versions[0]?.sections ?? [] : []) as unknown as TemplateFormSectionStructure[]
                    })
                }
                setDataReady(true);
            }
            initialize()
        }
    }, [state]);

    /** Manage to return to the template lists */
    const onBack = (): void => {
        navigate('/templates');
    }

    /** Recursively replaces all undefined values with null */
    const replaceUndefinedWithNull = (obj: any): any => {
        if (Array.isArray(obj)) return obj.map(replaceUndefinedWithNull);
        if (obj !== null && typeof obj === 'object') {
            return Object.fromEntries(
                Object.entries(obj).map(([k, v]) => [k, v === undefined ? null : replaceUndefinedWithNull(v)])
            );
        }
        return obj;
    };

    /** Sanitizes form values for GraphQL submission (strips __typename, sortOrder, temp IDs) */
    const sanitizeFormData = (values: any): any => {
        return replaceUndefinedWithNull({
            ...values,
            sections: values.sections?.map((section: any) => {
                const mappedSection = section.id?.startsWith('sec-')
                    ? (({ id: _id, __typename, sortOrder, ...rest }) => rest)(section)
                    : (({ id, __typename, sortOrder, ...rest }) => rest)(section)
                return {
                    ...mappedSection,
                    fields: mappedSection.fields?.map((field: any) => {
                        const { __typename, sortOrder, id, ...restField } = field;
                        return {
                            ...restField,
                            columns: field.type === TemplateComponents.TABLE ? field.columns?.map(({ id: _id, ...col }: any) => col) : field.columns
                        }
                    })
                };
            })
        });
    };

    /** Guard to prevent concurrent auto-saves */
    const isSavingRef = useRef(false);

    /** Silent auto-save (update only, no navigation, no toast) */
    const onAutoSave = async (): Promise<void> => {
        if (!state?.id || isSavingRef.current) return;

        isSavingRef.current = true;
        try {
            const sanitizedData = sanitizeFormData(methods.getValues());
            await updateFileTemplate({ id: state.id, input: sanitizedData });
        } finally {
            isSavingRef.current = false;
        }
    };

    /** Manage to create or update the template */
    const onSubmit = async (_data: any): Promise<void> => {
        const sanitizedData = sanitizeFormData(methods.getValues());

        try {
            if( state.id ) { // Update existing file template
                const response: FetchResult<{ data: ApiResponse<number> }> = await updateFileTemplate({ id: state.id, input: sanitizedData });
                onToast({ message: response.data?.data?.message ?? '', type: response.data?.data.success ? 'success' : 'error' } );
            } else { // Create a new file template
                const response: FetchResult<{ data: ApiResponse<number> }> = await createFileTemplate({ input: sanitizedData });
                onToast({ message: response.data?.data?.message ?? '', type: response.data?.data.success ? 'success' : 'error' } );
            }

            onBack();
        } catch ( e ) {
            console.error(e);
        }
    }

    const onPublish = async (): Promise<void> => {
        try {
            const response: FetchResult<{ data: ApiResponse<number> }> = await publishFileTemplate({ id: state.id });

            onToast({ message: response.data?.data?.message ?? '', type: response.data?.data.success ? 'success' : 'error' } );
            onBack();
        } catch(e) {
            console.error(e);
        }
    }

    const onDeleteVersion = async (): Promise<void> => {
        const { confirmed } = await onConfirmationToast({
            title: t('common.dangerous-action'),
            description: t('templates.confirm-delete-version'),
            actionText: t('buttons.delete'),
            cancelText: t('buttons.cancel'),
            actionColor: 'error',
        });

        if (confirmed) {
            await new Promise<void>((resolve) => { setTimeout(resolve, 3000); });
            try {
                const response: FetchResult<{ data: ApiResponse<number> }> = await deleteLatestVersion({ id: state.id });

                onToast({ message: response.data?.data?.message ?? '', type: response.data?.data.success ? 'success' : 'error' } );
                if( response.data?.data.success ) { 
                    onBack();
                }
            } catch(e: any) {
                onToast({ message: e?.message ?? t('messages.error-occurred'), type: 'error' });
            }
        }
    }

    if (step === TemplateCreationSteps.TEMPLATE_BUILDER && !dataReady) {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                    <span className="text-sm text-black/40 font-[Lato-Regular]">{t('common.loading-template')}</span>
                </div>
            </div>
        );
    }

    return (
        <FormProvider {...methods}>
            { step === TemplateCreationSteps.TEMPLATE_FORM ?
                <TemplateCreationForm control={methods.control} onNext={() => setStep(TemplateCreationSteps.TEMPLATE_BUILDER)} onBack={onBack} />
            :
                <ReactFlowProvider>
                    <TemplateBuilder
                        id={state.id}
                        templateVersionId={fileTemplate?.versions?.length > 0 ?fileTemplate?.versions[0].id : null}
                        onBack={() => setStep(TemplateCreationSteps.TEMPLATE_FORM)}
                        onSubmit={methods.handleSubmit(onSubmit)}
                        onAutoSave={state?.id ? onAutoSave : undefined}
                        onPublish={onPublish}
                        onDeleteVersion={onDeleteVersion}
                    />
                </ReactFlowProvider>
            }
        </FormProvider>
    );
}

export default TemplateDetail;
