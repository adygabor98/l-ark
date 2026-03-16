
/** Set user to the store */
export const setUser = ( user: any ) => ({
	type: 'SET_USER',
	payload: { user }
});

/** Remove the user from the store */
export const removeUser = () => ({
	type: 'REMOVE_USER'
});