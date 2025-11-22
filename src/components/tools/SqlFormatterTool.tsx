// src/components/tools/SqlFormatterTool.tsx
import React, { useState } from 'react';
import { format as formatSQL } from 'sql-formatter';
import { OutputBox } from '../common/OutputBox';

interface SqlFormatterToolProps {
  darkMode: boolean;
  copied: boolean;
  copyToClipboard: (text: string) => void;
  setError: (error: string) => void;
}

export function SqlFormatterTool({ darkMode, copied, copyToClipboard, setError }: SqlFormatterToolProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [keywordCase, setKeywordCase] = useState<'upper' | 'lower'>('upper');
  const [dialect, setDialect] = useState('sql');

  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  const handleFormat = () => {
    setError('');
    try {
      const result = formatSQL(input, {
        language: dialect as any,
        keywordCase: keywordCase,
        indent: '  ',
      });
      setOutput(result);
    } catch (e: any) {
      setError('Error formatting SQL: ' + e.message);
      setOutput('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
            Keyword Case
          </label>
          <select 
            value={keywordCase} 
            onChange={(e) => setKeywordCase(e.target.value as 'upper' | 'lower')} 
            className={`w-full border rounded-lg p-3 ${inputClass}`}
          >
            <option value="upper">UPPERCASE</option>
            <option value="lower">lowercase</option>
          </select>
        </div>
        <div>
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
            SQL Dialect
          </label>
          <select
            value={dialect}
            onChange={(e) => setDialect(e.target.value)}
            className={`w-full border rounded-lg p-3 ${inputClass}`}
          >
            <option value="sql">Standard SQL</option>
            <option value="postgresql">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="mariadb">MariaDB</option>
            <option value="sqlite">SQLite</option>
            <option value="bigquery">BigQuery</option>
            <option value="db2">DB2</option>
            <option value="plsql">PL/SQL</option>
            <option value="tsql">T-SQL</option>
          </select>
        </div>
      </div>

      <div>
        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
          SQL Input
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className={`w-full h-64 border rounded-lg p-3 font-mono text-sm ${inputClass}`}
          placeholder="SELECT * FROM users WHERE id = 1 AND status = 'active'"
        />
      </div>

      <button
        onClick={handleFormat}
        className={`w-full ${
          darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
        } text-white font-medium py-3 rounded-lg transition-colors`}
      >
        Format SQL
      </button>

      {output && (
        <OutputBox 
          darkMode={darkMode} 
          output={output} 
          copied={copied} 
          onCopy={() => copyToClipboard(output)} 
        />
      )}
    </div>
  );
}