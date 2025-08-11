import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import authReducer from './slices/authSlice';
import rootSaga from './sagas';

const sagaMiddleware = createSagaMiddleware();
const store = configureStore({
  reducer: {
    auth: authReducer
  },
  middleware: (getDefault) => getDefault({ thunk: false }).concat(sagaMiddleware)
});

sagaMiddleware.run(rootSaga);
export type RootState = ReturnType<typeof store.getState>;
export default store;
