import {
    Component,
    type ReactNode
} from 'react';
import {
    AlertTriangle
} from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    message: string;
}

export class ExportErrorBoundary extends Component<Props, State> {
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

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;
            return (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span> Render error: { this.state.message } </span>
                </div>
            );
        }
        return this.props.children;
    }
}
