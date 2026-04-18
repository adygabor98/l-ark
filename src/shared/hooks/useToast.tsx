import { AlertCircle, Loader2 } from 'lucide-react';
import { type ReactElement, type ReactNode, useState } from 'react';
import { sileo, type SileoOptions } from 'sileo';

type ToastType = 'success' | 'error' | 'info' | 'warning';
type ToastActionColor = 'success' | 'error';

const ACTION_COLORS: Record<ToastActionColor, string> = {
    success: 'oklch(0.623 0.214 259.815)',
    error: 'oklch(0.628 0.258 29.234)',
};

interface ToastData {
    message: string;
    type?: ToastType;
}

interface ToastConfirmationData {
    title: string;
    description?: string | ReactElement;
    actionText?: string;
    cancelText?: string;
    actionColor?: ToastActionColor;
    /** Optional third button rendered between cancel and the primary action */
    secondaryActionText?: string;
}

interface ToastPromiseData {
    cb: Promise<number>;
    loading: SileoOptions;
    success: SileoOptions;
    error: SileoOptions;
}

interface ToastActionsProps {
    description?: string | ReactNode;
    actionText: string;
    cancelText: string;
    actionColor?: ToastActionColor;
    onConfirm: () => void;
    onCancel: () => void;
    secondaryActionText?: string;
    onSecondaryAction?: () => void;
}

export const ToastActions = ({ description, actionText, cancelText, actionColor = 'success', onConfirm, onCancel, secondaryActionText, onSecondaryAction }: ToastActionsProps) => {
    const [loading, setLoading] = useState(false);
    const color = ACTION_COLORS[actionColor];

    const handleConfirm = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        setLoading(true);
        onConfirm();
    };

    return (
        <div className="flex flex-col gap-2">
            { description && description }
            <div className="flex justify-end gap-2 mt-3">
                {/* Cancel — stay on page */}
                <div
                    className='flex items-center justify-center h-7 w-1/3 px-2.5 rounded-full text-xs font-medium transition-colors duration-150'
                    style={{ cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.4 : 1 }}
                    role="button"
                    tabIndex={0}
                    onClick={e => { if (loading) return; e.stopPropagation(); onCancel(); }}
                    onPointerDown={e => e.stopPropagation()}
                    onKeyDown={e => { if (!loading && e.key === 'Enter') onCancel(); }}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = 'rgba(120,120,120,0.15)'; }}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                    { cancelText }
                </div>

                {/* Optional secondary action (e.g. Discard) */}
                { secondaryActionText && onSecondaryAction && (
                    <div
                        className='flex items-center justify-center h-7 px-2.5 rounded-full text-xs font-medium transition-colors duration-150'
                        style={{
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.4 : 1,
                            color: ACTION_COLORS['error'],
                            backgroundColor: `color-mix(in oklch, ${ACTION_COLORS['error']} 12%, transparent)`,
                        }}
                        role="button"
                        tabIndex={0}
                        onClick={e => { if (loading) return; e.stopPropagation(); onSecondaryAction(); }}
                        onPointerDown={e => e.stopPropagation()}
                        onKeyDown={e => { if (!loading && e.key === 'Enter') onSecondaryAction(); }}
                        onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = `color-mix(in oklch, ${ACTION_COLORS['error']} 22%, transparent)`; }}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = `color-mix(in oklch, ${ACTION_COLORS['error']} 12%, transparent)`)}
                    >
                        { secondaryActionText }
                    </div>
                )}

                {/* Primary action */}
                <div
                    style={{
                        color,
                        backgroundColor: `color-mix(in oklch, ${color} 15%, transparent)`,
                        cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                    className='flex items-center justify-center gap-1.5 h-7 w-1/2 px-2.5 rounded-full text-xs font-medium transition-colors duration-150'
                    role="button"
                    tabIndex={0}
                    onClick={e => { if (!loading) handleConfirm(e); }}
                    onPointerDown={e => e.stopPropagation()}
                    onKeyDown={e => { if (!loading && e.key === 'Enter') handleConfirm(e); }}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = `color-mix(in oklch, ${color} 25%, transparent)`; }}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = `color-mix(in oklch, ${color} 15%, transparent)`)}
                >
                    { loading && <Loader2 size={12} className='animate-spin' /> }
                    { loading ? 'Processing...' : actionText }
                </div>
            </div>
        </div>
    );
};

export const useToast = () => {

    const onToast = (data: ToastData): void => {
        const { message, type = 'info' } = data;
        sileo[type]({ title: message });
    };

    const onConfirmationToast = (data: ToastConfirmationData): Promise<{ confirmed: boolean; secondary: boolean; dismiss: () => void }> => {
        return new Promise((resolve) => {
            let toastId: string;

            const dismiss = () => sileo.dismiss(toastId);

            toastId = sileo.action({
                title: data.title,
                autopilot: true,
                icon: <AlertCircle />,
                description: (
                    <ToastActions
                        description={data.description}
                        actionText={data.actionText ?? 'Confirm'}
                        cancelText={data.cancelText ?? 'Cancel'}
                        actionColor={data.actionColor}
                        secondaryActionText={data.secondaryActionText}
                        onConfirm={() => { dismiss(); resolve({ confirmed: true, secondary: false, dismiss }); }}
                        onSecondaryAction={data.secondaryActionText ? () => { dismiss(); resolve({ confirmed: false, secondary: true, dismiss }); } : undefined}
                        onCancel={() => { dismiss(); resolve({ confirmed: false, secondary: false, dismiss }); }}
                    />
                ),
                duration: null,
            });
        });
    };

    const onPromiseToast = (data: ToastPromiseData) => {
         sileo.promise(data.cb, {
            loading: data.loading,
            success: data.success,
            error: data.error
        });
    }
    return { onToast, onConfirmationToast, onPromiseToast };
};
