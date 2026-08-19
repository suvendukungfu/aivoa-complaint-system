import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import complaintReducer from './complaintSlice';
import aiReducer from './aiSlice';
import documentReducer from './documentSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    complaint: complaintReducer,
    ai: aiReducer,
    document: documentReducer,
    ui: uiReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
