import { type ReactElement } from 'react';

interface PropTypes {
	firstName?: string | null;
	lastName?: string | null;
	emptyText?: string;
}

/**
 * Compact "avatar + name" chip used inside the right context panel for
 * assignee / creator. Keeps both rows visually consistent.
 */
const UserChip = ({ firstName, lastName, emptyText = 'Unassigned' }: PropTypes): ReactElement => {
	if ( !firstName && !lastName ) {
		return <p className="text-xs font-[Lato-Regular] text-black/30"> { emptyText } </p>;
	}
	return (
		<div className="flex items-center gap-1.5 mt-0.5">
			<div className="w-4 h-4 rounded-full bg-black/6 flex items-center justify-center shrink-0">
				<span className="text-[8px] font-[Lato-Bold] text-black/50 uppercase">
					{ firstName?.charAt(0) }{ lastName?.charAt(0) }
				</span>
			</div>
			<p className="text-xs font-[Lato-Regular] text-black/60 truncate">
				{ firstName } { lastName }
			</p>
		</div>
	);
};

export default UserChip;
