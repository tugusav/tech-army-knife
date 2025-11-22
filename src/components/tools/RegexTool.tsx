// src/components/tools/RegexTool.tsx
import React, { useState } from 'react';
import { RegexFlags } from '../../types';

interface RegexToolProps {
  darkMode: boolean;
  setError: (error: string) => void;
}

export function RegexTool({ darkMode, setError }: RegexToolProps) {
  const [pattern, setPattern] = useState('');
  const [testText, setTestText] = useState('');
  const [matches, setMatches] = useState<any[]>([]);
  const [flags, setFlags] = useState<RegexFlags>({ g: true, i: false, m: false, s: false });

  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  const templates = {
    Email: '^[\\w.-]+@[\\w.-]+\\.[A-Za-z]{2,}$',
    'Phone (ID)':'^(\\+62|62|0)?([2-9][0-9]{1,3})?[0-9]{3,8}$',
    'Phone (US)': '^\\+?1?[\\s.-]?\\(?[0-9]{3}\\)?[\\s.-]?[0-9]{3}[\\s.-]?[0-9]{4}$',
    URL: 'https?:\\/\\/[\\w.-]+(?:\\.[\\w.-]+)+[/#?]?.*$',
    'IPv4 Address': '^((25[0-5]|(2[0-4]|1?[0-9]?[0-9]))\\.){3}(25[0-5]|(2[0-4]|1?[0-9]?[0-9]))$',
    'Credit Card': '^[0-9]{4}[\\s-]?[0-9]{4}[\\s-]?[0-9]{4}[\\s-]?[0-9]{4}$',
    'Social Security': '^[0-9]{3}-[0-9]{2}-[0-9]{4}$',
    'KTP Indonesia': '^(1[1-9]|21|[37][1-6]|5[1-3]|6[1-5]|[89][12])\d{2}\d{2}([04][1-9]|[1256][0-9]|[37][01])(0[1-9]|1[0-2])\d{2}\d{4}$',
    'Hex Color': '^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$',
    UUID: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
    'Date (YYYY-MM-DD)': '^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$',
    'Time (HH:MM)': '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
  };

  const testRegex = () => {
    try {
      const flagStr = Object.entries(flags)
        .filter(([_, v]) => v)
        .map(([k]) => k)
        .join('');
      const re = new RegExp(pattern, flagStr + (flagStr.includes('g') ? '' : 'g'));
      const m = [...testText.matchAll(re)];
      setMatches(m);
      setError('');
    } catch (e: any) {
      setError('Invalid regex: ' + e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Templates */}
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Common Patterns
            </label>
            <div className="space-y-2">
              {Object.entries(templates).map(([name, value]) => (
                <button
                  key={name}
                  onClick={() => setPattern(value)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span className="font-medium">{name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Pattern & Testing */}
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Regular Expression
            </label>
            <div className="flex items-center gap-2">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>/</span>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                className={`flex-1 border rounded-lg p-3 font-mono ${inputClass}`}
                placeholder="Enter regex pattern"
              />
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>/</span>
              <span className="font-mono text-sm">
                {Object.entries(flags)
                  .filter(([_, v]) => v)
                  .map(([k]) => k)
                  .join('')}
              </span>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Flags
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'g' as keyof RegexFlags, label: 'Global', desc: 'Find all matches' },
                { key: 'i' as keyof RegexFlags, label: 'Ignore Case', desc: 'Case insensitive' },
                { key: 'm' as keyof RegexFlags, label: 'Multiline', desc: '^ and $ match line breaks' },
                { key: 's' as keyof RegexFlags, label: 'Dot All', desc: '. matches newlines' },
              ].map(({ key, label, desc }) => (
                <label key={key} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={flags[key]}
                    onChange={(e) => setFlags({ ...flags, [key]: e.target.checked })}
                    className="mt-1 w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <div className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      <code className={`${darkMode ? 'bg-gray-700' : 'bg-gray-200'} px-2 py-1 rounded text-sm`}>
                        {key}
                      </code>{' '}
                      {label}
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'} mt-1`}>{desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Test Text
            </label>
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className={`w-full h-32 border rounded-lg p-3 font-mono text-sm ${inputClass}`}
              placeholder="Enter text to test against..."
            />
          </div>

          <button
            onClick={testRegex}
            className={`w-full ${
              darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
            } text-white font-medium py-3 rounded-lg transition-colors`}
          >
            Test Regex
          </button>

          {matches.length > 0 && (
            <div>
              <h3 className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'} mb-2`}>
                Matches ({matches.length})
              </h3>
              <pre
                className={`${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-900'
                } p-3 rounded text-sm overflow-auto max-h-64`}
              >
                {JSON.stringify(
                  matches.map((m) => ({ match: m[0], groups: m.slice(1), index: m.index })),
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}