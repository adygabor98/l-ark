import {
    type ReactElement
} from 'react';
import {
    useNavigate
} from 'react-router-dom';
import {
    ShieldX,
    ArrowLeft,
    Home
} from 'lucide-react';
import {
    useTranslation
} from 'react-i18next';
import logo from '../../public/logo.png';
import Button from '../shared/components/button';

/**
 * Unauthorized Page (403 Error)
 * Displayed when user is authenticated but lacks permission to access a route
 */
const Unauthorized = (): ReactElement => {
    /** Navigation utilities */
    const navigate = useNavigate();
    /** Translation utilities */
    const { t } = useTranslation();

    return (
        <div className="min-h-screen flex bg-background">
            {/* Left side - Error Message */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 border-r border-border bg-card">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="flex items-center gap-2 text-primary mb-12">
                        <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20 shadow-sm">
                            <img src={logo} alt="Logo" className="w-10 h-9" />
                        </div>
                        <span className="font-[Lato-Bold] text-2xl tracking-tight text-foreground"> { t('brand.name') } </span>
                    </div>

                    <div className="flex flex-col items-center text-center">
                        <div className="bg-destructive/10 p-4 rounded-full mb-6">
                            <ShieldX className="w-12 h-12 text-destructive" />
                        </div>

                        <h1 className="text-6xl font-[Lato-Black] text-foreground tracking-tight mb-2"> 403 </h1>
                        <h2 className="text-2xl font-[Lato-Bold] text-foreground tracking-tight mb-4"> { t('labels.access-denied') } </h2>
                        <p className="font-[Lato-Light] text-muted-foreground mb-8">
                            { t('labels.403-description') }
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <Button variant='secondary' onClick={() => navigate(-1)}>
                                <ArrowLeft className="w-4 h-4" />
                                { t('buttons.back') }
                            </Button>
                            <Button variant='primary' onClick={() => navigate('/dashboard')}>
                                <Home className="w-4 h-4" />
                                { t('titles.dashboard') }
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side - Visual */}
            <div className="hidden lg:block relative w-0 flex-1">
                <div className="absolute inset-0 h-full w-full bg-slate-950 overflow-hidden">
                    {/* Modern Abstract Background */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(239,68,68,0.2),rgba(255,255,255,0))]" />
                    <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

                    <div className="absolute inset-0 flex items-center justify-center p-20">
                        <div className="relative w-full max-w-2xl">
                            {/* Glowing Orb - Red tint for error state */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-destructive/20 rounded-full blur-[120px] opacity-40" />

                            {/* Glass Card with Lock Icon */}
                            <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-12 shadow-2xl ring-1 ring-white/10">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                                        <ShieldX className="w-12 h-12 text-white/60" />
                                    </div>
                                    <h3 className="text-2xl font-[Lato-Bold] text-white/80 mb-3"> { t('labels.403-description') } </h3>
                                    <p className="text-white/40 font-[Lato-Light] max-w-sm"> { t('labels.403-permissions') } </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-8 left-8 right-8 flex justify-between text-white/40 text-xs font-[Lato-Light]">
                    <span> { t('brand.version') } </span>
                    <span> { t('brand.secure-env') } </span>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;
