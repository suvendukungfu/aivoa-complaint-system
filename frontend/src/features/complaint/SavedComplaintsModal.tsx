import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setShowSavedModal, setSelectedComplaintDetail } from '../../store/uiSlice';
import { setComplaintData } from '../../store/complaintSlice';
import type { HistoricalComplaint } from '../../types';
import { api } from '../../services/api';
import {
  X,
  Database,
  Search,
  ExternalLink,
  History
} from 'lucide-react';

export const SavedComplaintsModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.showSavedModal);
  const savedList = useAppSelector((state) => state.ui.savedComplaintsList);
  const selectedDetail = useAppSelector((state) => state.ui.selectedComplaintDetail);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemEvents, setSelectedItemEvents] = useState<any[] | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        dispatch(setShowSavedModal(false));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, dispatch]);

  if (!isOpen) return null;

  const filtered = savedList.filter((item) => {
    const q = searchTerm.toLowerCase();
    return (
      (item.complaint_number || '').toLowerCase().includes(q) ||
      (item.product_name || '').toLowerCase().includes(q) ||
      (item.batch_number || '').toLowerCase().includes(q) ||
      (item.customer_name || '').toLowerCase().includes(q)
    );
  });

  const handleSelectComplaint = async (item: HistoricalComplaint) => {
    try {
      if (item.id) {
        const fullDetail = await api.fetchComplaintById(item.id);
        dispatch(setSelectedComplaintDetail(fullDetail));
        setSelectedItemEvents(fullDetail.events || []);
      }
    } catch {
      dispatch(setSelectedComplaintDetail(item));
    }
  };

  const handleLoadIntoForm = (item: HistoricalComplaint) => {
    dispatch(setComplaintData(item));
    dispatch(setShowSavedModal(false));
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: 16
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 6,
        border: '1px solid #E5E7EB',
        width: '100%',
        maxWidth: 960,
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 12px 24px -4px rgba(16, 24, 40, 0.16)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #E5E7EB',
          backgroundColor: '#F9FAFB'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={15} color="#1D4ED8" />
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                QMS Complaint Registry
              </h3>
              <p style={{ fontSize: 11, color: '#6B7280' }}>
                Search and inspect historical customer complaints
              </p>
            </div>
          </div>

          <button
            onClick={() => dispatch(setShowSavedModal(false))}
            style={{
              background: 'none',
              border: 'none',
              color: '#6B7280',
              cursor: 'pointer',
              padding: 4
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Toolbar */}
        <div style={{
          padding: '10px 16px',
          borderBottom: '1px solid #E5E7EB',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          gap: 10,
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: '#F9FAFB',
            border: '1px solid #D1D5DB',
            borderRadius: 4,
            padding: '4px 8px',
            flex: 1
          }}>
            <Search size={14} color="#6B7280" />
            <input
              type="text"
              placeholder="Search by Complaint ID, Customer, Product, or Batch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 12,
                color: '#111827',
                width: '100%'
              }}
            />
          </div>
          <span style={{ fontSize: 11, color: '#6B7280' }}>
            {filtered.length} records
          </span>
        </div>

        {/* Modal Body: Split Table and Detail View */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: selectedDetail ? '1.2fr 0.8fr' : '1fr',
          overflow: 'hidden',
          flex: 1
        }}>
          {/* Complaints Table */}
          <div style={{ overflowY: 'auto', borderRight: selectedDetail ? '1px solid #E5E7EB' : 'none' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#6B7280', fontSize: 12 }}>
                No complaints match your search query.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '8px 12px' }}>Complaint ID</th>
                    <th style={{ padding: '8px 12px' }}>Customer</th>
                    <th style={{ padding: '8px 12px' }}>Product</th>
                    <th style={{ padding: '8px 12px' }}>Batch</th>
                    <th style={{ padding: '8px 12px' }}>Severity</th>
                    <th style={{ padding: '8px 12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const isSelected = selectedDetail?.id === item.id;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => handleSelectComplaint(item)}
                        style={{
                          borderBottom: '1px solid #F3F4F6',
                          backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                          cursor: 'pointer'
                        }}
                      >
                        <td style={{ padding: '8px 12px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#111827' }}>
                          {item.complaint_number}
                        </td>
                        <td style={{ padding: '8px 12px', color: '#374151' }}>
                          {item.customer_name || '—'}
                        </td>
                        <td style={{ padding: '8px 12px', color: '#374151' }}>
                          {item.product_name || '—'}
                        </td>
                        <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', color: '#4B5563' }}>
                          {item.batch_number || '—'}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span className={`badge ${
                            item.severity === 'Critical' ? 'badge-critical' :
                            item.severity === 'High' ? 'badge-high' :
                            item.severity === 'Medium' ? 'badge-medium' : 'badge-low'
                          }`}>
                            {item.severity || 'Medium'}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ fontSize: 10, color: '#4B5563', backgroundColor: '#F3F4F6', padding: '1px 5px', borderRadius: 3 }}>
                            {item.status || 'Pending Triage'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Right-Side Detail Inspection View */}
          {selectedDetail && (
            <div style={{ padding: '14px', backgroundColor: '#F9FAFB', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                  {selectedDetail.complaint_number}
                </h4>
                <button
                  onClick={() => handleLoadIntoForm(selectedDetail)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 3,
                    border: 'none',
                    backgroundColor: '#1D4ED8',
                    color: '#FFFFFF',
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3
                  }}
                >
                  <ExternalLink size={11} />
                  <span>Load into Workspace</span>
                </button>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', borderRadius: 4, border: '1px solid #E5E7EB', padding: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
                  <div>
                    <span style={{ color: '#6B7280' }}>Customer:</span>
                    <div style={{ fontWeight: 500, color: '#111827' }}>{selectedDetail.customer_name || 'N/A'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#6B7280' }}>Batch:</span>
                    <div style={{ fontWeight: 500, color: '#111827', fontFamily: 'var(--font-mono)' }}>{selectedDetail.batch_number || 'N/A'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#6B7280' }}>Quantity:</span>
                    <div style={{ fontWeight: 500, color: '#111827' }}>{selectedDetail.quantity_affected || 'N/A'} {selectedDetail.quantity_unit || 'kg'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#6B7280' }}>Type:</span>
                    <div style={{ fontWeight: 500, color: '#111827' }}>{selectedDetail.complaint_type || 'N/A'}</div>
                  </div>
                </div>

                <div style={{ marginTop: 8 }}>
                  <span style={{ color: '#6B7280', fontSize: 10 }}>Description:</span>
                  <p style={{ margin: '2px 0 0 0', fontSize: 11, color: '#374151', lineHeight: 1.35 }}>
                    {selectedDetail.detailed_description || 'No description recorded.'}
                  </p>
                </div>
              </div>

              {/* Event Timeline snippet */}
              {selectedItemEvents && selectedItemEvents.length > 0 && (
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: 4, border: '1px solid #E5E7EB', padding: '10px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#111827', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <History size={12} color="#1D4ED8" />
                    <span>Audit Events ({selectedItemEvents.length})</span>
                  </div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {selectedItemEvents.slice(0, 5).map((evt: any, idx: number) => (
                      <li key={idx} style={{ fontSize: 10, color: '#4B5563', borderBottom: '1px solid #F3F4F6', paddingBottom: 2 }}>
                        <strong>{evt.event_type}</strong> • {evt.actor} • {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid #E5E7EB',
          backgroundColor: '#F9FAFB',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={() => dispatch(setShowSavedModal(false))}
            style={{
              padding: '4px 12px',
              borderRadius: 3,
              border: '1px solid #D1D5DB',
              backgroundColor: '#FFFFFF',
              color: '#374151',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
