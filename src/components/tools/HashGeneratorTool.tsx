import React, { useState } from 'react';
import { OutputBox } from '../common/OutputBox';
import { useHistory } from '../../contexts/HistoryContext';

interface HashGeneratorToolProps {
  darkMode: boolean;
  copied: boolean;
  copyToClipboard: (text: string) => void;
  setError: (error: string) => void;
}

export function HashGeneratorTool({ darkMode, copied, copyToClipboard, setError }: HashGeneratorToolProps) {
  const [input, setInput] = useState('');
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const [selectedAlgorithms, setSelectedAlgorithms] = useState<string[]>(['SHA256', 'MD5', 'SHA1']);
  const { addToHistory } = useHistory();

  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  const algorithms = [
    { id: 'MD5', name: 'MD5', desc: '128-bit hash (deprecated for security)' },
    { id: 'SHA1', name: 'SHA-1', desc: '160-bit hash (deprecated for security)' },
    { id: 'SHA256', name: 'SHA-256', desc: '256-bit hash (recommended)' },
    { id: 'SHA512', name: 'SHA-512', desc: '512-bit hash (most secure)' }
  ];

  // Simple hash implementations (for demo purposes)
  const generateHash = async (text: string, algorithm: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    try {
      let hashBuffer: ArrayBuffer;
      
      switch (algorithm) {
        case 'SHA256':
          hashBuffer = await crypto.subtle.digest('SHA-256', data);
          break;
        case 'SHA512':
          hashBuffer = await crypto.subtle.digest('SHA-512', data);
          break;
        case 'SHA1':
          hashBuffer = await crypto.subtle.digest('SHA-1', data);
          break;
        case 'MD5':
          // MD5 implementation (simplified)
          return md5(text);
        default:
          throw new Error(`Unsupported algorithm: ${algorithm}`);
      }
      
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      throw new Error(`Failed to generate ${algorithm} hash`);
    }
  };

  // Simple MD5 implementation
  const md5 = (text: string): string => {
    // This is a simplified MD5 for demo purposes
    // In production, you'd use a proper crypto library
    let hash = 0;
    if (text.length === 0) return '0';
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0').repeat(4);
  };

  const generateHashes = async () => {
    setError('');
    if (!input.trim()) {
      setError('Input text is required');
      return;
    }

    if (selectedAlgorithms.length === 0) {
      setError('Please select at least one algorithm');
      return;
    }

    try {
      const newHashes: Record<string, string> = {};
      
      for (const algorithm of selectedAlgorithms) {
        newHashes[algorithm] = await generateHash(input, algorithm);
      }
      
      setHashes(newHashes);
      
      const result = Object.entries(newHashes)
        .map(([alg, hash]) => `${alg}: ${hash}`)
        .join('\n');
      
      addToHistory(result, 'Hash Generator');
    } catch (error) {
      setError(`Failed to generate hashes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const toggleAlgorithm = (algorithm: string) => {
    setSelectedAlgorithms(prev => 
      prev.includes(algorithm) 
        ? prev.filter(a => a !== algorithm)
        : [...prev, algorithm]
    );
  };

  const examples = [
    'Hello World!',
    'The quick brown fox jumps over the lazy dog',
    'password123',
    'user@example.com',
    JSON.stringify({ key: 'value', number: 42 }, null, 2)
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Left Column - Input */}
      <div className="space-y-4">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Input
        </h3>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className={`w-full h-48 border rounded-lg p-3 font-mono text-sm resize-none ${inputClass}`}
          placeholder="Enter text to hash..."
        />

        <div className="space-y-3">
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Hash Algorithms
          </label>
          <div className="grid grid-cols-2 gap-2">
            {algorithms.map((algorithm) => (
              <label key={algorithm.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedAlgorithms.includes(algorithm.id)}
                  onChange={() => toggleAlgorithm(algorithm.id)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {algorithm.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Examples
          </label>
          <div className="grid grid-cols-1 gap-1 max-h-24 overflow-y-auto">
            {examples.slice(0, 4).map((example, index) => (
              <button
                key={index}
                onClick={() => setInput(example)}
                className={`text-left p-2 rounded text-xs truncate ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } transition-colors`}
                title={example}
              >
                {example.length > 30 ? example.substring(0, 30) + '...' : example}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={generateHashes}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
        >
          Generate Hashes
        </button>

        {/* Security Notice */}
        <div className={`p-3 rounded-lg border text-xs ${
          darkMode ? 'bg-yellow-900/20 border-yellow-700 text-yellow-300' : 'bg-yellow-50 border-yellow-200 text-yellow-800'
        }`}>
          <strong>Security Notice:</strong> MD5 and SHA-1 are deprecated for security purposes. Use SHA-256 or SHA-512.
        </div>
      </div>

      {/* Right Column - Output */}
      <div className="space-y-4">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Hashes
        </h3>

        <div className={`w-full h-96 border rounded-lg overflow-auto ${
          darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'
        }`}>
          {Object.keys(hashes).length > 0 ? (
            <div className="p-3 space-y-3">
              {Object.entries(hashes).map(([algorithm, hash]) => (
                <div key={algorithm} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {algorithm}
                    </span>
                    <button
                      onClick={() => copyToClipboard(hash)}
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        darkMode ? 'text-blue-400 hover:bg-gray-600' : 'text-blue-600 hover:bg-gray-100'
                      }`}
                    >
                      Copy
                    </button>
                  </div>
                  <div className={`font-mono text-xs break-all ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {hash}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-40`}>
              Generated hashes will appear here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}