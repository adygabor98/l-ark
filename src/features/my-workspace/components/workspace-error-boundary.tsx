import {
    Component,
    type ReactNode
} from 'react';
import {
    AlertTriangle,
    RefreshCcw
} from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    message: string;
}

/**
 * Catches render errors anywhere in the my-workspace detail subtree so a
 * single broken step or panel can't take the whole page down.
 *
 * Logs the error and offers a one-click reload as a recovery hatch.
 */
export class WorkspaceErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, message: '' };
    }

    static getDerivedStateFromError(error: unknown): State {
        return {
            hasError: true,
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }

    componentDidCatch(error: unknown, info: unknown): void {
        // eslint-disable-next-line no-console
        console.error('[my-workspace] render error', error, info);
    }

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;
            return (
                <div className="h-full flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-white border border-black/8 rounded-xl shadow-sm p-6 flex flex-col items-center text-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                        </div>
                        <h2 className="text-base font-[Lato-Bold] text-black/80">
                            Something went wrong
                        </h2>
                        <p className="text-sm text-black/50 font-[Lato-Regular]">
                            We couldn&apos;t render this operation. The error was: {this.state.message}
                        </p>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-500 text-black/80 font-[Lato-Bold] text-sm transition-colors"
                        >
                            <RefreshCcw className="w-3.5 h-3.5" />
                            Reload page
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
