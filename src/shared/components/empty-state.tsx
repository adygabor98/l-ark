import type { ReactElement, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import Button from "./button";

interface EmptyStateProps {
	icon?: LucideIcon;
	title: string;
	description?: string;
	action?: {
		label: string;
		onClick: () => void;
	};
	secondaryAction?: {
		label: string;
		onClick: () => void;
	};
	children?: ReactNode;
	className?: string;
}

const EmptyState = ({ icon: Icon, title, description, action, secondaryAction, children, className = "" }: EmptyStateProps): ReactElement => {
	return (
		<div className={`flex flex-col items-center justify-center text-center py-10 px-6 ${className}`}>
			{ Icon &&
				<div className="w-12 h-12 rounded-2xl bg-black/4 flex items-center justify-center mb-4">
					<Icon className="w-6 h-6 text-black/25" />
				</div>
			}
			<p className="text-sm font-[Lato-Bold] text-black/60 mb-1"> {title} </p>
			{ description &&
				<p className="text-xs font-[Lato-Regular] text-black/35 max-w-xs"> {description} </p>
			}
			{ children }
			{ (action || secondaryAction) &&
				<div className="flex items-center gap-2 mt-4">
					{ secondaryAction &&
						<Button variant="secondary" onClick={secondaryAction.onClick}> {secondaryAction.label} </Button>
					}
					{ action &&
						<Button variant="primary" onClick={action.onClick}> {action.label} </Button>
					}
				</div>
			}
		</div>
	);
};

export default EmptyState;
