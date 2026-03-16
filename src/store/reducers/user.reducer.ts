import {
	REHYDRATE
} from "redux-persist";

/** 
 * Definition of the initial state of the reducer 
*/
const initialState: any = {
    user: null
};

/** Definition of the current state of the reducer */
const currentState: any = { ...initialState };

/**
 * @description Executes the differents action about the user
 * @param state The current state of the configuration
 * @param action to perform on the current state
 * @returns the state updated with the action performed
 */
const userReducer = (state = currentState, action: any) => {
	switch (action.type) {
	case REHYDRATE:
		if (action.payload?.user) {
			return { ...state, ...action.payload.user };
		}
		return state;
	case 'SET_USER':
		return { ...state, user: action.payload.user };
	case 'REMOVE_USER':
		return { ...state, user: null };
	default:
		return state;
	}
};

export default userReducer;