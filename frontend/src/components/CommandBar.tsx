import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { setAnalyticsOpen } from '../store/aiSlice';
import { resetComplaint } from '../store/complaintSlice';
import { setShowSavedModal, setToast } from '../store/uiSlice';
import { 
  Search, 
  FilePlus2, 
  ShieldAlert, 
  BarChart3, 
  Archive, 
  FileSpreadsheet
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  category: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

export const CommandBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const complaintData = useAppSelector((state) => state.complaint.data);

  const commands: CommandItem[] = [
    {
      id: 'new-complaint',
      label: 'Log New Complaint Intake',
      category: 'Complaints',
      icon: <FilePlus2 size={14} color="#1D4ED8" />,
      shortcut: 'N',
      action: () => {
        dispatch(resetComplaint());
        dispatch(setToast({ message: 'Initialized new complaint intake session.', type: 'info' }));
        setIsOpen(false);
      }
    },
    {
      id: 'saved-registry',
      label: 'Open Saved Complaints Registry',
      category: 'Navigation',
      icon: <Archive size={14} color="#059669" />,
      shortcut: 'S',
      action: () => {
        dispatch(setShowSavedModal(true));
        setIsOpen(false);
      }
    },
    {
      id: 'analytics-dashboard',
      label: 'Open Quality & AI Telemetry',
      category: 'Observability',
      icon: <BarChart3 size={14} color="#4B5563" />,
      shortcut: 'A',
      action: () => {
        dispatch(setAnalyticsOpen(true));
        setIsOpen(false);
      }
    },
    {
      id: 'triage-risk',
      label: 'Re-evaluate Risk Triage & Policy Floors',
      category: 'Quality Engine',
      icon: <ShieldAlert size={14} color="#DC2626" />,
      shortcut: 'R',
      action: () => {
        dispatch(setToast({ message: 'Evaluated regulatory quality policy floors.', type: 'success' }));
        setIsOpen(false);
      }
    },
    {
      id: 'export-capa',
      label: 'Export Complaint Record as JSON',
      category: 'Export',
      icon: <FileSpreadsheet size={14} color="#D97706" />,
      shortcut: 'E',
      action: () => {
        const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(complaintData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", jsonStr);
        downloadAnchor.setAttribute("download", `AIVOA_Complaint_${complaintData.batch_number || 'Draft'}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        dispatch(setToast({ message: 'Exported complaint JSON packet.', type: 'success' }));
        setIsOpen(false);
      }
    }
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const handleSelect = (cmd: CommandItem) => {
    cmd.action();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (filteredCommands.length || 1)) % (filteredCommands.length || 1));
    } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredCommands[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.5)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '14vh'
    }} onClick={() => setIsOpen(false)}>
      <div style={{
        width: '100%',
        maxWidth: 520,
        backgroundColor: '#FFFFFF',
        borderRadius: 6,
        boxShadow: '0 12px 24px -4px rgba(16, 24, 40, 0.16)',
        border: '1px solid #E5E7EB',
        overflow: 'hidden'
      }} onClick={(e) => e.stopPropagation()}>
        {/* Search Input Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 14px',
          borderBottom: '1px solid #E5E7EB'
        }}>
          <Search size={16} color="#6B7280" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search action..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 13,
              color: '#111827',
              backgroundColor: 'transparent'
            }}
          />
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 5px',
            backgroundColor: '#F3F4F6',
            color: '#6B7280',
            borderRadius: 3,
            border: '1px solid #E5E7EB'
          }}>ESC</span>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: 280, overflowY: 'auto', padding: '6px' }}>
          {filteredCommands.length === 0 ? (
            <div style={{ padding: '20px 14px', textAlign: 'center', color: '#6B7280', fontSize: 12 }}>
              No commands found matching "{query}"
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => (
              <div
                key={cmd.id}
                onClick={() => handleSelect(cmd)}
                onMouseEnter={() => setSelectedIndex(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  backgroundColor: selectedIndex === idx ? '#EFF6FF' : 'transparent',
                  border: selectedIndex === idx ? '1px solid #BFDBFE' : '1px solid transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    backgroundColor: '#F3F4F6'
                  }}>
                    {cmd.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>{cmd.label}</div>
                    <div style={{ fontSize: 10, color: '#6B7280' }}>{cmd.category}</div>
                  </div>
                </div>
                {cmd.shortcut && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '1px 5px',
                    backgroundColor: '#F3F4F6',
                    color: '#6B7280',
                    borderRadius: 3,
                    border: '1px solid #E5E7EB'
                  }}>
                    {cmd.shortcut}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 14px',
          backgroundColor: '#F9FAFB',
          borderTop: '1px solid #E5E7EB',
          fontSize: 10,
          color: '#6B7280'
        }}>
          <span>Navigate: <strong>↑ ↓</strong></span>
          <span>Select: <strong>↵ Enter</strong></span>
          <span>Command Bar (<strong>⌘K</strong>)</span>
        </div>
      </div>
    </div>
  );
};
