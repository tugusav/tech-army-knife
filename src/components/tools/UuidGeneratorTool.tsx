import React, { useState } from 'react';
import { OutputBox } from '../common/OutputBox';
import { useHistory } from '../../contexts/HistoryContext';

interface UuidGeneratorToolProps {
  darkMode: boolean;
  copied: boolean;
  copyToClipboard: (text: string) => void;
  setError: (error: string) => void;
}

export function UuidGeneratorTool({ darkMode, copied, copyToClipboard, setError }: UuidGeneratorToolProps) {
  const [uuids, setUuids] = useState<string[]>([]);
  const [count, setCount] = useState(1);
  const [version, setVersion] = useState<'v4' | 'v1' | 'nil'>('v4');
  const [format, setFormat] = useState<'standard' | 'uppercase' | 'no-hyphens' | 'braces'>('standard');
  const { addToHistory } = useHistory();

  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  // Generate UUID v4 (random)
  const generateUUIDv4 = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Generate UUID v1 (timestamp-based, simplified)
  const generateUUIDv1 = (): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(16).substring(2, 15);
    const timestampHex = timestamp.toString(16).padStart(12, '0');
    
    return `${timestampHex.substring(0, 8)}-${timestampHex.substring(8, 12)}-1${random.substring(0, 3)}-8${random.substring(3, 6)}-${random.substring(6, 18)}`;
  };

  // Generate nil UUID
  const generateNilUUID = (): string => {
    return '00000000-0000-0000-0000-000000000000';
  };

  const formatUUID = (uuid: string): string => {
    switch (format) {
      case 'uppercase':
        return uuid.toUpperCase();
      case 'no-hyphens':
        return uuid.replace(/-/g, '');
      case 'braces':
        return `{${uuid}}`;
      default:
        return uuid;
    }
  };

  const generateUUIDs = () => {
    setError('');
    
    if (count < 1 || count > 100) {
      setError('Count must be between 1 and 100');
      return;
    }

    const newUuids: string[] = [];
    
    for (let i = 0; i < count; i++) {
      let uuid = '';
      switch (version) {
        case 'v4':
          uuid = generateUUIDv4();
          break;
        case 'v1':
          uuid = generateUUIDv1();
          break;
        case 'nil':
          uuid = generateNilUUID();
          break;
      }
      newUuids.push(formatUUID(uuid));
    }
    
    setUuids(newUuids);
    addToHistory(newUuids.join('\n'), `UUID Generator (${version})`);
  };

  const validateUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  const [validationInput, setValidationInput] = useState('');
  const [validationResult, setValidationResult] = useState<string>('');

  const validateInput = () => {
    if (!validationInput.trim()) {
      setValidationResult('Please enter a UUID to validate');
      return;
    }

    const cleanUuid = validationInput.trim().replace(/[{}]/g, '');
    const isValid = validateUUID(cleanUuid);
    
    if (isValid) {
      const version = cleanUuid.charAt(14);
      setValidationResult(`✅ Valid UUID (Version ${version})`);
    } else {
      setValidationResult('❌ Invalid UUID format');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Left Column - Generator */}
      <div className="space-y-4">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Generate UUIDs
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Version
            </label>
            <select
              value={version}
              onChange={(e) => setVersion(e.target.value as any)}
              className={`w-full border rounded-lg p-2 ${inputClass}`}
            >
              <option value="v4">Version 4 (Random)</option>
              <option value="v1">Version 1 (Timestamp)</option>
              <option value="nil">Nil UUID</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
              className={`w-full border rounded-lg p-2 ${inputClass}`}
            >
              <option value="standard">Standard</option>
              <option value="uppercase">Uppercase</option>
              <option value="no-hyphens">No Hyphens</option>
              <option value="braces">With Braces</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Count
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              className={`w-full border rounded-lg p-2 ${inputClass}`}
            />
          </div>

          <button
            onClick={generateUUIDs}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
          >
            Generate UUID{count > 1 ? 's' : ''}
          </button>
        </div>

        {/* Validator Section */}
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <h4 className={`text-sm font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Validate UUID
          </h4>
          
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={validationInput}
              onChange={(e) => setValidationInput(e.target.value)}
              placeholder="Enter UUID to validate..."
              className={`flex-1 border rounded-lg p-2 font-mono text-sm ${inputClass}`}
            />
            <button
              onClick={validateInput}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Validate
            </button>
          </div>
          
          {validationResult && (
            <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {validationResult}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            UUID Information
          </h4>
          <div className={`text-xs space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <p><strong>Version 1:</strong> Timestamp-based, includes MAC address</p>
            <p><strong>Version 4:</strong> Random or pseudo-random (most common)</p>
            <p><strong>Nil UUID:</strong> All zeros, used as placeholder</p>
          </div>
        </div>
      </div>

      {/* Right Column - Output */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Generated UUIDs
          </h3>
          {uuids.length > 0 && (
            <button
              onClick={() => copyToClipboard(uuids.join('\n'))}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                copied
                  ? 'bg-green-600 text-white'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {copied ? 'Copied!' : 'Copy All'}
            </button>
          )}
        </div>

        <div className={`w-full h-96 border rounded-lg overflow-auto ${
          darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'
        }`}>
          {uuids.length > 0 ? (
            <div className="p-3 space-y-2">
              {uuids.map((uuid, index) => (
                <div key={index} className={`flex items-center justify-between p-2 rounded ${
                  darkMode ? 'bg-gray-700' : 'bg-white'
                }`}>
                  <span className={`font-mono text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {uuid}
                  </span>
                  <button
                    onClick={() => copyToClipboard(uuid)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      darkMode ? 'text-blue-400 hover:bg-gray-600' : 'text-blue-600 hover:bg-gray-100'
                    }`}
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-40`}>
              Generated UUIDs will appear here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}