

/**
 * @description selects some data of the store
 * @param store, global store of the platform
 * @returns the logged user
 */
export const getUser = (store: any): any => store.user.user;


/******************************************************************************/
/******************************** STORE ACTION ********************************/
/******************************************************************************/

/**
 * @description return some information of the store
 * @return the logged user
 */
export const selectUser = getUser;
