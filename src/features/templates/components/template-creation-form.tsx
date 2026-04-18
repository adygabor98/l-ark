import {
    type ReactElement
} from 'react';
import {
    useTranslation
} from 'react-i18next';
import {
    ArrowLeft,
    Check,
    ChevronRight,
    File,
    FileCog2
} from 'lucide-react';
import type {
    TemplateFormStructure
} from '../../../models/template.models';
import type {
    Control
} from 'react-hook-form';
import Button from '../../../shared/components/button';
import Field from '../../../shared/components/field';

interface PropTypes {
    control: Control<TemplateFormStructure>;

    onNext: () => void;
    onBack: () => void;
}

const TemplateCreationForm = (props: PropTypes): ReactElement => {
    /** Retrieve component properties */
    const { control, onBack, onNext } = props;
    /** Translation utilities */
    const { t } = useTranslation();
    /** Header configuration */
    const config = {
        title: t('titles.high-end-templates'),
        description: 'The best for high template creation module.',
        icon: File,
        color: "bg-[#FFBF00]",
        features: [
            'Fields fully customizable from our large library of components',
            'Customizable display mode layouts and high definition of order and placement.',
            'Multiple status and version control for each template'
        ]
    }

    return (
        <div className="h-full flex flex-col md:flex-row">
            {/* Left Panel - Context & Info */}
            <div className={`px-6 py-3 lg:px-12 overflow-y-auto w-full md:w-[250px] lg:w-[350px] shrink-0 flex flex-col justify-between text-white relative animate-in
                rounded-md slide-in-from-left duration-500 ${ config.color }`}
            >
                <div>
                    <button onClick={() => onBack()} className="flex gap-2 items-center px-4 py-2 hover:rounded-lg text-neutral-800 hover:text-white hover:bg-white/20 -ml-4 mb-4 md:mb-8 cursor-pointer" data-variant="ghost">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        { t('buttons.back') }
                    </button>

                    <div className="flex md:block items-center gap-4">
                        <div className="bg-white/20 w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-0 md:mb-6 backdrop-blur-md border border-white/10 shadow-xl shrink-0">
                            <FileCog2 className="w-6 h-6 md:w-8 md:h-8 text-neutral-700" />
                        </div>
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-[Lato-Black] md:mb-4 tracking-tigh text-neutral-700"> { config.title } </h1>
                    </div>
                    <p className="hidden md:block text-neutral-700 font-[Lato-Regular] text-base leading-relaxed mb-8 "> { config.description } </p>

                    <div className="hidden md:block space-y-4">
                        <h3 className="text-xs font-[Lato-Bold] uppercase text-neutral-700 mb-4"> { t('labels.include-features') } </h3>
                        { config.features.map((feature: any, i: number) => (
                            <div key={i} className="flex items-center gap-5 text-neutral-700">
                                <div className="p-1 rounded-full bg-white/20 flex items-center justify-center">
                                    <Check className="w-3! h-3!" />
                                </div>
                                <span className="text-sm font-[Lato-Regular]"> { feature } </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 p-6 lg:p-12 overflow-y-auto">
                <div className="w-full">
                    <div className="space-y-10 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-150">
                        <div>
                            <h2 className="text-3xl font-[Lato-Bold] text-foreground mb-3"> { t('titles.configure-template') } </h2>
                            <p className="text-lg text-muted-foreground font-[Lato-Light]"> { t('messages.configure-template-description') } </p>
                        </div>

                        <div className="space-y-3">
                            {/* Title Input */}
                            <Field control={control} name='title' label={ t('labels.template-title') } placeholder={ t('placeholders.template-title') } type='text' required />

                            {/* Description Input */}
                            <Field control={control} name='description' label={ t('labels.template-description') } placeholder={ t('placeholders.template-description') } type='textarea' />

                            <Field control={control} name='divisions' label={ t('labels.divisions') } placeholder={ t('placeholders.select-divisions') } type='select' dataType='divisions' multiple required />
                        </div>

                        {/* Actions */}
                        <div className="pt-10 border-t border-border flex items-center justify-end gap-6">
                            <Button variant="secondary" size="lg" onClick={() => onBack()} className="rounded-xl"> { t('buttons.cancel') } </Button>
                            <Button variant="primary" size="lg" onClick={onNext} className={`rounded-xl shadow-blue-500/20`}>
                                { t('buttons.next-builder') }
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TemplateCreationForm;