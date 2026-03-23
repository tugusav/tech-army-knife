import React from 'react';
import { Clock, Trash2, Copy, X } from 'lucide-react';
import { useHistory } from '../../contexts/HistoryContext';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  copyToClipboard: (text: string) => void;
}

export function HistorySidebar({ isOpen, onClose, darkMode, copyToClipboard }: HistorySidebarProps) {
  const { history, clearHistory, removeFromHistory } = useHistory();

  if (!isOpen) return null;

  return (
    <div className="history-panel">
      <div className="history-header">
        <div className="history-header-title">
          <Clock size={16} />
          History
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {history.length > 0 && (
            <button onClick={clearHistory} className="git-btn git-btn-sm git-btn-danger" title="Clear All">
              <Trash2 size={14} />
            </button>
          )}
          <button onClick={onClose} className="git-btn git-btn-sm">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="history-body">
        {history.length === 0 ? (
          <div className="history-empty">
            <p>No history yet.</p>
            <p style={{ fontSize: '0.75rem', marginTop: 6, opacity: 0.6 }}>Generated values will appear here.</p>
          </div>
        ) : (
          history.map((item) => (
            <div key={item.id} className="history-item">
              <div className="history-item-header">
                <span className="history-item-tool">{item.toolName}</span>
                <span className="history-item-time">{new Date(item.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="history-item-value">{item.value}</div>
              <div className="history-item-actions">
                <button
                  onClick={() => removeFromHistory(item.id)}
                  className="git-btn git-btn-sm git-btn-danger"
                  title="Remove"
                >
                  <Trash2 size={12} />
                </button>
                <button
                  onClick={() => copyToClipboard(item.value)}
                  className="git-btn git-btn-sm"
                >
                  <Copy size={12} /> Copy
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
