import {
    useEffect,
    useRef,
    useState,
    type ReactElement
} from 'react';
import {
    Loader2,
    Mail,
    RefreshCw,
    ShieldCheck,
    X
} from 'lucide-react';
import {
    useToast
} from '../../../shared/hooks/useToast';
import Button from '../../../shared/components/button';

interface PropTypes {
	docId: number;
	fileName: string;

	onClose: () => void;
}

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 300; // 5 minutes

const MyWorkspaceOTP = (props: PropTypes): ReactElement => {
    /** Retrieve component utilities */
    const { fileName, docId, onClose } = props;
    /** Toast utilities */
    const { onToast } = useToast();
    /** State to store the digits entered by the user */
    const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
    /** State to manage the requesting process loading */
    const [requesting, setRequesting] = useState<boolean>(false);
    /** State to manage the verifying process loading */
    const [verifying, setVerifying] = useState<boolean>(false);
    /** State to manage if the code has been sent */
    const [otpSent, setOtpSent] = useState<boolean>(false);
    /** State to manage the countdown */
    const [countdown, setCountdown] = useState<number>(0);
    /** State to manage the error */
    const [error, setError] = useState<string | null>(null);
    /** Input field reference */
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    /** Manage to request a otp code and sent it via e-mail */
    const requestOtp = async (): Promise<void> => {
		setRequesting(true);
		setError(null);
		try {
			const res = await fetch(`${import.meta.env.VITE_SERVER_HOST}/api/documents/${docId}/request-otp`, { method: 'POST' });
			const result = await res.json();
			if ( result.success ) {
				setOtpSent(true);
				setCountdown(OTP_EXPIRY_SECONDS);
				setDigits(Array(OTP_LENGTH).fill(""));
				onToast({ message: 'Verification code sent to your email', type: 'success' });
				setTimeout(() => {
                    inputRefs.current[0]?.focus()
                }, 100);
			} else {
				setError(result.message || 'Failed to send verification code');
			}
		} catch {
			setError('Failed to send verification code');
		} finally {
			setRequesting(false);
		}
	};

    useEffect(() => {
        requestOtp();
    }, []);

    useEffect(() => {
        if ( countdown <= 0 ) return;

        const timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
        return () => {
            clearInterval(timer);
        }
    }, [countdown]);

    /** Manage to verify if the otp entered by the user is right */
    const verifyOtp = async (code: string): Promise<void> => {
		setVerifying(true);
		setError(null);

		try {
			const res = await fetch(`${import.meta.env.VITE_SERVER_HOST}/api/documents/${docId}/verify-otp`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ code }),
			});

			if ( res.ok ) {
				const contentType = res.headers.get('Content-Type');
				if ( contentType && !contentType.includes('application/json') ) {
					const blob = await res.blob();
					const url = URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.href = url;
					a.download = fileName;
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					URL.revokeObjectURL(url);
					onToast({ message: 'Document downloaded successfully', type: 'success' });
					onClose();
				} else {
					const result = await res.json();
					if ( result.success && result.data?.url ) {
						window.open(result.data.url, '_blank');
						onClose();
					}
				}
			} else {
				const result = await res.json();
				setError(result.message || 'Invalid or expired code');
				setDigits(Array(OTP_LENGTH).fill(""));
				inputRefs.current[0]?.focus();
			}
		} catch {
			setError('Verification failed. Please try again.');
		} finally {
			setVerifying(false);
		}
	};

    /** Manage to handle the input of a digit by the user */
    const handleDigitChange = (index: number, value: string): void => {
		if ( !/^\d*$/.test(value) ) return;

		const newDigits = [...digits];
		newDigits[index] = value.slice(-1);
		setDigits(newDigits);
		setError(null);

		if ( value && index < OTP_LENGTH - 1 ) {
			inputRefs.current[index + 1]?.focus();
		}

		if ( newDigits.every(d => d !== "") && newDigits.join("").length === OTP_LENGTH ) {
			verifyOtp(newDigits.join(""));
		}
	};

    /** Manage the different key downs with special actions */
	const handleKeyDown = (index: number, e: React.KeyboardEvent): void => {
		if ( e.key === "Backspace" && !digits[index] && index > 0 ) {
			inputRefs.current[index - 1]?.focus();
		}
	};

    /** Manage to render the header */
    const renderHeader = (): ReactElement => (
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/6">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                    <h2 className="text-md font-[Lato-Bold] text-black/80"> Document Verification </h2>
                    <p className="text-[11px] font-[Lato-Regular] text-black/40 truncate max-w-62.5"> { fileName } </p>
                </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-black/30 hover:bg-black/4 hover:text-black/60 transition-all cursor-pointer">
                <X className="w-4 h-4" />
            </button>
        </div>
    );

    /** Manage to format the countdown timer */
    const formatCountdown = (seconds: number): string => {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}:${s.toString().padStart(2, "0")}`;
	};

    /** Manage the copy-paste otp code in the input field */
    const handlePaste = (e: React.ClipboardEvent): void => {
		e.preventDefault();
		const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);

		if ( pasted.length === 0 ) return;

		const newDigits = [...digits];
		for (let i = 0; i < pasted.length; i++) {
			newDigits[i] = pasted[i];
		}
		
        setDigits(newDigits);
		if ( pasted.length === OTP_LENGTH ) {
			verifyOtp(pasted);
		} else {
			inputRefs.current[pasted.length]?.focus();
		}
	};
    
    return (
       <div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

			<div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 fade-in duration-300">
				{ renderHeader() }

				{/* Body */}
				<div className="px-6 py-8 flex flex-col items-center">
					{ requesting ?
						<div className="flex flex-col items-center gap-3 py-4">
							<Loader2 className="w-8 h-8 animate-spin text-amber-500" />
							<p className="text-sm font-[Lato-Regular] text-black/50"> Sending verification code... </p>
						</div>
					:
						<>
							<div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
								<Mail className="w-6 h-6 text-blue-500" />
							</div>

							<p className="text-sm font-[Lato-Regular] text-black/60 text-center mb-6">
								Enter the 6-digit code sent to your email to access this document.
							</p>

							{/* OTP Input */}
							<div className="flex gap-2 mb-4" onPaste={handlePaste}>
								{ digits.map((digit, idx) => (
									<input
										key={idx}
										ref={(el) => { inputRefs.current[idx] = el; }}
										type="text"
										inputMode="numeric"
										maxLength={1}
										value={digit}
										onChange={(e) => handleDigitChange(idx, e.target.value)}
										onKeyDown={(e) => handleKeyDown(idx, e)}
										disabled={verifying}
										className={`w-12 h-14 text-center text-xl font-[Lato-Bold] rounded-xl border-2 outline-none transition-all ${
											error ? 'border-red-300 bg-red-50/50'
												: digit ? 'border-[#FFBF00] bg-amber-50/30'
												: 'border-black/10 focus:border-[#FFBF00]/60'
										}`}
									/>
								))}
							</div>

							{/* Error message */}
							{ error &&
								<p className="text-xs font-[Lato-Regular] text-red-500 mb-3"> { error } </p>
							}

							{/* Loading indicator */}
							{ verifying &&
								<div className="flex items-center gap-2 mb-3">
									<Loader2 className="w-4 h-4 animate-spin text-amber-500" />
									<span className="text-xs font-[Lato-Regular] text-black/40"> Verifying... </span>
								</div>
							}

							{/* Countdown & Resend */}
							<div className="flex items-center gap-2 text-xs font-[Lato-Regular] text-black/40">
								{ countdown > 0 ?
                                    <span> Code expires in { formatCountdown(countdown) } </span>
								: 
                                    otpSent ? <span className="text-red-500"> Code expired </span>
								: null
                                }
							</div>

							<Button variant='primary' onClick={requestOtp} disabled={requesting || countdown > 240}>
								<RefreshCw className="w-3 h-3" />
								Resend code
							</Button>
						</>
					}
				</div>

				{/* Footer */}
				<div className="px-6 py-3 border-t border-black/6 bg-[#F8F9FA]">
					<Button variant="secondary" onClick={onClose} className="w-full hover:bg-transparent hover:shadow-none bg-transparent shadow-none! border-none">
						Cancel
					</Button>
				</div>
			</div>
		</div>
    );
}

export default MyWorkspaceOTP;