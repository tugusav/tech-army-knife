// src/components/tools/CompareTool.tsx
import React, { useState } from 'react';
import { buildSideBySide } from '../../utils/diffUtils';
import { DiffRow } from '../../types';

interface CompareToolProps {
  darkMode: boolean;
  setError: (error: string) => void;
}

export function CompareTool({ darkMode, setError }: CompareToolProps) {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [diffRows, setDiffRows] = useState<DiffRow[]>([]);

  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  const compareTexts = () => {
    try {
      const rows = buildSideBySide(text1, text2);
      setDiffRows(rows);
    } catch (e: any) {
      setError('Error computing diff: ' + e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
            Left (old)
          </label>
          <textarea
            value={text1}
            onChange={(e) => setText1(e.target.value)}
            className={`w-full h-64 border rounded-lg p-3 font-mono text-sm ${inputClass}`}
            placeholder="Enter old text..."
          />
        </div>
        <div>
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
            Right (new)
          </label>
          <textarea
            value={text2}
            onChange={(e) => setText2(e.target.value)}
            className={`w-full h-64 border rounded-lg p-3 font-mono text-sm ${inputClass}`}
            placeholder="Enter new text..."
          />
        </div>
      </div>

      <button
        onClick={compareTexts}
        className={`w-full ${
          darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
        } text-white font-medium py-3 rounded-lg transition-colors`}
      >
        Compare Texts
      </button>

      {diffRows.length > 0 && (
        <div
          className={`border rounded-lg overflow-hidden ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
          }`}
        >
          <div className={`flex text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="w-1/2 px-3 py-2 border-r">Old</div>
            <div className="w-1/2 px-3 py-2">New</div>
          </div>

          <div className="grid grid-cols-2 text-sm font-mono" style={{ maxHeight: 480, overflow: 'auto' }}>
            {/* Left pane */}
            <div className="border-r">
              {diffRows.map((row, idx) => (
                <div key={idx} className="flex items-start">
                  <div
                    className={`w-12 px-2 text-right ${
                      darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-500'
                    } border-r`}
                  >
                    {idx + 1}
                  </div>
                  <div
                    className={`flex-1 px-2 py-0.5 whitespace-pre-wrap ${
                      row.type === 'delete'
                        ? 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : row.type === 'modify'
                        ? 'bg-yellow-50 dark:bg-yellow-900 dark:text-yellow-200'
                        : darkMode
                        ? 'bg-gray-800'
                        : 'bg-white'
                    }`}
                  >
                    {row.type === 'modify' && row.leftTokens ? (
                      row.leftTokens.map((t, i) => (
                        <span key={i} className={t.removed ? 'bg-red-200 line-through dark:bg-red-800' : ''}>
                          {t.text}
                        </span>
                      ))
                    ) : (
                      <span>{row.left || '(empty)'}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Right pane */}
            <div>
              {diffRows.map((row, idx) => (
                <div key={idx} className="flex items-start">
                  <div
                    className={`w-12 px-2 text-right ${
                      darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-500'
                    } border-r`}
                  >
                    {idx + 1}
                  </div>
                  <div
                    className={`flex-1 px-2 py-0.5 whitespace-pre-wrap ${
                      row.type === 'add'
                        ? 'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : row.type === 'modify'
                        ? 'bg-green-50 dark:bg-green-900 dark:text-green-200'
                        : darkMode
                        ? 'bg-gray-800'
                        : 'bg-white'
                    }`}
                  >
                    {row.type === 'modify' && row.rightTokens ? (
                      row.rightTokens.map((t, i) => (
                        <span key={i} className={t.added ? 'bg-green-200 dark:bg-green-800' : ''}>
                          {t.text}
                        </span>
                      ))
                    ) : (
                      <span>{row.right || '(empty)'}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}