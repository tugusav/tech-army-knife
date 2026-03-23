import React from 'react';
import { Copy, Check } from 'lucide-react';

interface OutputBoxProps {
  darkMode: boolean;
  output: string;
  copied: boolean;
  onCopy: () => void;
  label?: string;
}

export function OutputBox({ darkMode, output, copied, onCopy, label = 'Output' }: OutputBoxProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="git-label" style={{ marginBottom: 0 }}>{label}</label>
        <button onClick={onCopy} className="git-btn git-btn-sm">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <textarea
        value={output}
        readOnly
        className="git-textarea"
        style={{ minHeight: 160 }}
      />
    </div>
  );
}
