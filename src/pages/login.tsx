import {
	type ReactElement
} from "react";
import {
	ArrowRight
} from "lucide-react";
import {
	useTranslation
} from "react-i18next";
import {
	useForm
} from "react-hook-form";
import {
	sileo
} from "sileo";
import {
	useUser
} from "../server/hooks/useUser";
import Logo from '../../public/logo.png'
import Field from "../shared/components/field";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser } from "../store/actions/user.actions";
import Button from "../shared/components/button";

const Login = (): ReactElement => {
	/** Translation utilities */
	const { t } = useTranslation();
	/** Formulary definition */
	const { control, handleSubmit } = useForm({
		mode: 'onChange',
		defaultValues: {
			username: '',
			password: ''
		}
	});
	/** User api utilities */
	const { login } = useUser();
	/** Navigation utilities */
	const navigate = useNavigate();
	/** Store dispatch */
	const dispatch = useDispatch();
	
	/** Manage to retrieve the title of the page depending on the hour of the day */
	const getTitleDay = (): string => {
		const hour = new Date().getHours();
		if (hour < 12) return t('labels.good-morning');
		if (hour < 18) return t('labels.good-afternoon');
		return t('labels.good-evening');
	};

	const handleLogin = async (data: any): Promise<void> => {
		try {
			const result = await sileo.promise(login(data.username, data.password), {
				loading: { title: t('login.toast-loading') },
				success: { title: t('login.toast-success'), description: <span>{ getTitleDay() }, let's start working...</span> },
				error: { title: t('login.toast-error-title'), description: t('login.toast-error-description') },
			});

			if( result.success ) {
				dispatch(setUser(result.user));
				navigate('/dashboard');
			}
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<div className="min-h-screen w-full flex overflow-hidden bg-background">
			{/* Left Side - Visual Art */}
			<div className="hidden lg:block w-1/2 relative overflow-hidden bg-black">
				<div className="absolute inset-0 bg-linear-to-br from-black/20 to-transparent z-10" />
				<img src="/login-hero.png" alt="Abstract Architecture" className="w-full h-full object-cover animate-in fade-in duration-1000" />
				<div className="absolute bottom-12 left-12 z-20 text-white max-w-md">
					<div className="mb-4 h-1 w-12 bg-[#FFBF00] rounded-full" />
					<h1 className="text-4xl font-light mb-2 font-[Lato-Black] tracking-tight"> { t('brand.name') } { t('brand.tagline') } </h1>
					<p className="text-white/70 font-[Lato-Regular] text-lg"> { t('brand.description') } </p>
				</div>
			</div>

			{/* Right Side - Form */}
			<div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 relative">
				<div className="w-full max-w-sm space-y-8 animate-in slide-in-from-right-8 duration-700">
					<div className="space-y-2 text-center lg:text-left">
						<div className="flex items-center gap-3">
							<div className="w-15 h-15 rounded-lg bg-primary/10 flex items-center justify-center shadow-sm shadow-primary/20">
								<img src={Logo} alt="Logo" className="w-13 h-13 text-white" />
							</div>
							<h2 className="text-3xl font-[Lato-Bold] tracking-tight text-foreground">{ t('titles.welcome-back') }</h2>
						</div>
						<p className="text-sm text-muted-foreground font-[Lato-Regular] mt-4">{ t('messages.login-secure-description') }</p>
					</div>

					<Field control={control} name='username' label={ t('labels.username') } placeholder={ t('placeholders.username-placeholder') } type='text' required />
					<Field control={control} name='password' label={ t('labels.password') } placeholder={ t('placeholders.password-placeholder') } type='password' required />

					<Button variant='primary' onClick={handleSubmit(handleLogin)}>
						<span className="relative z-10 flex items-center justify-center gap-2">
							{ t('login.cta') } <ArrowRight className="h-4 w-4" />
						</span>
						<div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
					</Button>

					<p className="text-xs text-center text-muted-foreground pt-4">
						{ t('login.security-notice') } <br/>
						{ t('login.security-notice-2') }
					</p>
				</div>
			</div>
		</div>
	);
}

export default Login;