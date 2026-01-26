import React, { useState } from 'react';
import { OutputBox } from '../common/OutputBox';
import { useHistory } from '../../contexts/HistoryContext';

interface UrlEncoderToolProps {
  darkMode: boolean;
  copied: boolean;
  copyToClipboard: (text: string) => void;
  setError: (error: string) => void;
}

export function UrlEncoderTool({ darkMode, copied, copyToClipboard, setError }: UrlEncoderToolProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const { addToHistory } = useHistory();

  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  const processUrl = () => {
    setError('');
    if (!input.trim()) {
      setError('Input is required');
      return;
    }

    try {
      let result = '';
      if (mode === 'encode') {
        result = encodeURIComponent(input);
      } else {
        result = decodeURIComponent(input);
      }
      
      setOutput(result);
      addToHistory(result, `URL ${mode === 'encode' ? 'Encoder' : 'Decoder'}`);
    } catch (error) {
      setError(`Failed to ${mode} URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const examples = {
    encode: [
      'Hello World!',
      'user@example.com',
      'https://example.com/path?param=value with spaces',
      'Special chars: #$%&+,/:;=?@[]'
    ],
    decode: [
      'Hello%20World%21',
      'user%40example.com',
      'https%3A%2F%2Fexample.com%2Fpath%3Fparam%3Dvalue%20with%20spaces',
      'Special%20chars%3A%20%23%24%25%26%2B%2C%2F%3A%3B%3D%3F%40%5B%5D'
    ]
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Left Column - Input */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Input
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('encode')}
              className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${
                mode === 'encode'
                  ? 'bg-blue-600 text-white'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Encode
            </button>
            <button
              onClick={() => setMode('decode')}
              className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${
                mode === 'decode'
                  ? 'bg-blue-600 text-white'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Decode
            </button>
          </div>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className={`w-full h-64 border rounded-lg p-3 font-mono text-sm resize-none ${inputClass}`}
          placeholder={`Enter text to ${mode}...`}
        />

        <div className="space-y-2">
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Examples
          </label>
          <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
            {examples[mode].slice(0, 4).map((example, index) => (
              <button
                key={index}
                onClick={() => setInput(example)}
                className={`text-left p-2 rounded text-xs font-mono truncate ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } transition-colors`}
                title={example}
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={processUrl}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
        >
          {mode === 'encode' ? 'Encode URL' : 'Decode URL'}
        </button>
      </div>

      {/* Right Column - Output */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Output
          </h3>
          {output && (
            <button
              onClick={() => copyToClipboard(output)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                copied
                  ? 'bg-green-600 text-white'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>

        <div className={`w-full h-64 border rounded-lg p-3 font-mono text-sm overflow-auto ${
          darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'
        }`}>
          {output ? (
            <pre className={`whitespace-pre-wrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {output}
            </pre>
          ) : (
            <div className={`text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-24`}>
              {mode === 'encode' ? 'Encoded' : 'Decoded'} text will appear here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}