

export type Resource =
	| 'activity_log'
	| 'roles_permissions'
	| 'users'
	| 'offices'
	| 'divisions'
	| 'templates'
	| 'operations'
	| 'agenda';

export type Action =
	| 'view'
	| 'create'
	| 'edit'
	| 'soft_delete'
	| 'permanent_delete'
	| 'view_all'
	| 'view_mine'
	| 'view_mine_and_sub';

export interface Permission {
	key: string;
	label: string;
	description: string;
	resource: Resource;
	action: Action;
}

export interface RolePermissions {
	[resource: string]: {
		[action: string]: boolean;
	};
}

export interface Role {
	id: string;
	name: string;
	shortName: string;
	description: string;
	permissions: RolePermissions;
}