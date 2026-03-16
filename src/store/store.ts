import {
    combineReducers
} from 'redux';
import {
    configureStore
} from '@reduxjs/toolkit';
import {
    persistReducer,
    persistStore
} from 'redux-persist';
import storage from 'redux-persist/lib/storage/session';
import userReducer from './reducers/user.reducer';

const rootReducer = combineReducers({
    user: userReducer
});

const persistConfig = {
    key: "mark-storage",
    storage,
    whitelist: ["user"]
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware: any) => {
        return getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    "persist/PERSIST", 
                    "persist/REHYDRATE",
                    "persist/REGISTER",
                    "persist/PURGE",
                    "persist/FLUSH",
                    "persist/PAUSE"
                ],
            },
        });
    }
});

export const persistor = persistStore(store);