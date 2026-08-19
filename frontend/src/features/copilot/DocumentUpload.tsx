import React, { useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  setDragging,
  setUploading,
  setProgress,
  setCurrentFile,
  setDocumentError
} from '../../store/documentSlice';
import {
  setComplaintData,
  setUpdatedFields
} from '../../store/complaintSlice';
import {
  addMessage,
  setRiskAssessment,
  setCompleteness,
  setDuplicateWarning,
  setAuditTrail,
  setLoading,
  setStatusText
} from '../../store/aiSlice';
import { setToast } from '../../store/uiSlice';
import { api } from '../../services/api';
import {
  UploadCloud,
  AlertTriangle,
  Loader2,
  X
} from 'lucide-react';

export const DocumentUpload: React.FC = () => {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isDragging, uploading, progress, error } = useAppSelector((state) => state.document);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    dispatch(setDragging(true));
  };

  const handleDragLeave = () => {
    dispatch(setDragging(false));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dispatch(setDragging(false));
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      dispatch(setDocumentError('File size exceeds the 10 MB maximum limit.'));
      return;
    }

    const validExtensions = ['.pdf', '.docx', '.txt', '.eml'];
    const fileName = file.name.toLowerCase();
    const isValidExt = validExtensions.some((ext) => fileName.endsWith(ext));
    if (!isValidExt) {
      dispatch(setDocumentError('Unsupported file format. Please upload PDF, DOCX, TXT, or EML.'));
      return;
    }

    dispatch(setUploading(true));
    dispatch(setProgress(25));
    dispatch(setCurrentFile({ name: file.name, size: file.size, type: file.type }));
    dispatch(setLoading(true));
    dispatch(setStatusText(`Extracting data from ${file.name}...`));

    try {
      dispatch(setProgress(55));
      const res = await api.extractDocument(file);
      dispatch(setProgress(100));

      dispatch(setComplaintData(res.complaint));
      if (res.updated_fields) dispatch(setUpdatedFields(res.updated_fields));
      if (res.risk_assessment) dispatch(setRiskAssessment(res.risk_assessment));
      if (res.completeness) dispatch(setCompleteness(res.completeness));
      if (res.duplicate_warning) dispatch(setDuplicateWarning(res.duplicate_warning));
      if (res.audit_trail) dispatch(setAuditTrail(res.audit_trail));

      dispatch(addMessage({
        id: `doc-${Date.now()}`,
        sender: 'assistant',
        text: res.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        updatedFields: res.updated_fields,
        risk: res.risk_assessment
      }));

      dispatch(setToast({
        type: 'success',
        message: `Extracted complaint from ${file.name}`
      }));
    } catch (err: any) {
      dispatch(setDocumentError(err.message || 'Failed to extract document.'));
      dispatch(addMessage({
        id: `doc-err-${Date.now()}`,
        sender: 'assistant',
        text: `Document Parsing Failed: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
    } finally {
      dispatch(setUploading(false));
      dispatch(setLoading(false));
      dispatch(setStatusText('Idle'));
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.eml"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: isDragging ? '1px dashed #1D4ED8' : '1px dashed #D1D5DB',
          borderRadius: 4,
          backgroundColor: isDragging ? '#EFF6FF' : '#F9FAFB',
          padding: '10px 12px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: '#4B5563'
        }}>
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />}
          <span style={{ fontSize: 11, fontWeight: 500, color: '#111827' }}>
            {uploading ? 'Extracting document text...' : 'Upload Complaint Document'}
          </span>
        </div>

        <span style={{ fontSize: 10, color: '#6B7280' }}>
          PDF, DOCX, TXT, EML (Max 10 MB)
        </span>

        {uploading && (
          <div style={{
            width: '100%',
            height: 3,
            backgroundColor: '#E5E7EB',
            borderRadius: 2,
            overflow: 'hidden',
            marginTop: 4
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: '#1D4ED8',
              borderRadius: 2,
              transition: 'width 0.3s ease'
            }} />
          </div>
        )}
      </div>

      {error && (
        <div style={{
          marginTop: 6,
          padding: '6px 8px',
          backgroundColor: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11,
          color: '#991B1B'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertTriangle size={12} />
            <span>{error}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              dispatch(setDocumentError(null));
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991B1B' }}
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
};
