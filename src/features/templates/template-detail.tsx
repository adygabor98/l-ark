import {
    useEffect,
    useRef,
    useState,
    useCallback,
    type ReactElement
} from 'react';
import {
    TemplateCreationSteps
} from '../../constants';
import {
    useLocation,
    useNavigate,
    useBlocker
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
import {
    extractFieldErrors,
    applyResponseErrors,
    getResponseMessage
} from '../../server/hooks/useApolloWithToast';
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
    /** Lifted dirty state — builder reports here so the blocker can read it */
    const [isDirty, setIsDirty] = useState(false);
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

    /** Block navigation when the builder has unsaved changes */
    const blocker = useBlocker(({ currentLocation, nextLocation }) =>
        isDirty &&
        step === TemplateCreationSteps.TEMPLATE_BUILDER &&
        currentLocation.pathname !== nextLocation.pathname
    );

    useEffect(() => {
        if( state?.id ) {
            setDataReady(false);
            const initialize = async () => {
                const response: FetchResult<{ data: FileTemplateDetail }> = await retrieveFileTemplateById({ id: state.id });
                if( response.data?.data ) {
                    const { versions, divisions, ...rest } = response.data?.data

                    const rawSections = (versions ?? []).length > 0 ? (versions[0]?.sections ?? []) : [];
                    const normalizedSections = rawSections.map((s: any) => ({
                        ...s,
                        fields: (s.fields ?? []).map((f: any) => {
                            const columns = (f.columns ?? []).map((col: any, ci: number) => ({
                                ...col,
                                id: col.id ?? `col-${f.id ?? 'f'}-${ci}`,
                            }));
                            return {
                                ...f,
                                options: f.options ?? [],
                                columns,
                                suffix: f.suffix ?? null
                            };
                        }),
                    }));
                    methods.reset({
                        title: rest.title,
                        description: rest.description,
                        divisions: (divisions ?? []).map(division => division.divisionId.toString()) as string[],
                        operations: [],
                        sections: normalizedSections as unknown as TemplateFormSectionStructure[]
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

    /**
     * Sanitizes form values for GraphQL submission.
     *
     * - Strips `__typename`, `sortOrder`, and the local `id` (both temp `sec-…`/
     *   `f…` ids and numeric strings — the backend diff-matches by `stableId`,
     *   not by PK).
     * - Preserves `stableId` on every section and field; the backend relies on
     *   it to retain DB rows across DRAFT saves and to inherit identity across
     *   version bumps. Removing it would orphan every layout token.
     */
    const sanitizeFormData = (values: any): any => {
        return replaceUndefinedWithNull({
            ...values,
            sections: values.sections?.map((section: any) => {
                const { id: _sectionId, __typename: _s__t, sortOrder: _sSort, ...restSection } = section;
                return {
                    ...restSection,
                    fields: (section.fields ?? []).map((field: any) => {
                        const { id: _fid, __typename: _f__t, sortOrder: _fSort, ...restField } = field;
                        return restField;
                    })
                };
            })
        });
    };

    /** Guard to prevent concurrent auto-saves */
    const isSavingRef = useRef(false);

    /** Silent auto-save (update only, no navigation, no toast) — debounce-safe */
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

    /** Immediate save that bypasses the debounce guard — used before navigation */
    const onAutoSaveImmediate = async (): Promise<void> => {
        if (!state?.id) return;
        const sanitizedData = sanitizeFormData(methods.getValues());
        await updateFileTemplate({ id: state.id, input: sanitizedData });
    };

    /** Manage to create or update the template — stays in builder, no redirect */
    const onSubmit = async (_data: any): Promise<void> => {
        const sanitizedData = sanitizeFormData(methods.getValues());

        try {
            if( state?.id ) { // Update existing file template
                const response: FetchResult<{ data: ApiResponse<number> }> = await updateFileTemplate({ id: state.id, input: sanitizedData });
                if( !response.data?.data?.success ) applyResponseErrors(response.data?.data?.errors, methods.setError);
                onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data?.success ? 'success' : 'error' });
                if( response.data?.data?.success ) {
                    setIsDirty(false);
                }
            } else { // Create a new file template — navigate-replace so state gets the new id
                const response: FetchResult<{ data: ApiResponse<number> }> = await createFileTemplate({ input: sanitizedData });
                if( !response.data?.data?.success ) applyResponseErrors(response.data?.data?.errors, methods.setError);
                onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data?.success ? 'success' : 'error' });
                const newId = (response as any)?.data?.data?.entityId;
                if( newId ) {
                    setIsDirty(false);
                    navigate('/templates/builder', { state: { id: newId, step: 'builder' }, replace: true });
                }
            }
        } catch ( e ) {
            extractFieldErrors(e).forEach(({ field, message }) => methods.setError(field as any, { message }));
        }
    }

    const onPublish = async (): Promise<void> => {
        try {
            const response: FetchResult<{ data: ApiResponse<number> }> = await publishFileTemplate({ id: state.id });

            onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data.success ? 'success' : 'error' } );
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

                onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data.success ? 'success' : 'error' } );
                if( response.data?.data.success ) {
                    onBack();
                }
            } catch(e: any) {
                onToast({ message: e?.message ?? t('messages.error-occurred'), type: 'error' });
            }
        }
    }

    /** Show the unsaved-changes confirmation toast whenever the blocker fires */
    const handleBlockedNavigation = useCallback(async () => {
        const { confirmed, secondary } = await onConfirmationToast({
            title: t('templates-extra.unsaved-title'),
            description: t('templates-extra.unsaved-changes'),
            actionText: t('templates-extra.save-and-leave'),
            secondaryActionText: t('templates-extra.discard'),
            cancelText: t('templates-extra.stay'),
            actionColor: 'success',
        });

        if (confirmed) {
            try {
                await onAutoSaveImmediate();
                setIsDirty(false);
                blocker.proceed?.();
            } catch {
                onToast({ message: t('messages.error-occurred'), type: 'error' });
                blocker.reset?.();
            }
        } else if (secondary) {
            setIsDirty(false);
            blocker.proceed?.();
        } else {
            blocker.reset?.();
        }
    }, [blocker, onAutoSaveImmediate, onConfirmationToast, onToast, t]);

    useEffect(() => {
        if (blocker.state === 'blocked') {
            handleBlockedNavigation();
        }
    }, [blocker.state]);

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
                        templateVersionId={fileTemplate?.versions?.length > 0 ? fileTemplate?.versions[0].id : null}
                        onBack={() => setStep(TemplateCreationSteps.TEMPLATE_FORM)}
                        onSubmit={methods.handleSubmit(onSubmit)}
                        onAutoSave={state?.id ? onAutoSave : undefined}
                        onAutoSaveImmediate={state?.id ? onAutoSaveImmediate : undefined}
                        isDirty={isDirty}
                        onDirtyChange={setIsDirty}
                        pauseAutoSave={blocker.state === 'blocked'}
                        onPublish={onPublish}
                        onDeleteVersion={onDeleteVersion}
                    />
                </ReactFlowProvider>
            }
        </FormProvider>
    );
}

export default TemplateDetail;
