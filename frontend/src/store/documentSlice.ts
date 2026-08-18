import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface DocumentState {
  isDragging: boolean;
  uploading: boolean;
  progress: number;
  currentFile: {
    name: string;
    size: number;
    type: string;
    text_content?: string;
    filename?: string;
  } | null;
  error: string | null;
}

const initialState: DocumentState = {
  isDragging: false,
  uploading: false,
  progress: 0,
  currentFile: null,
  error: null
};

export const documentSlice = createSlice({
  name: 'document',
  initialState,
  reducers: {
    setDragging: (state, action: PayloadAction<boolean>) => {
      state.isDragging = action.payload;
    },
    setUploading: (state, action: PayloadAction<boolean>) => {
      state.uploading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setProgress: (state, action: PayloadAction<number>) => {
      state.progress = action.payload;
    },
    setCurrentFile: (state, action: PayloadAction<{ name: string; size: number; type: string } | null>) => {
      state.currentFile = action.payload;
    },
    setDocumentError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    resetDocument: (state) => {
      state.isDragging = false;
      state.uploading = false;
      state.progress = 0;
      state.currentFile = null;
      state.error = null;
    }
  }
});

export const {
  setDragging,
  setUploading,
  setProgress,
  setCurrentFile,
  setDocumentError,
  resetDocument
} = documentSlice.actions;

export default documentSlice.reducer;
