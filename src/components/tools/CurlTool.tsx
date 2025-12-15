import React, { useState } from 'react';
import { OutputBox } from '../common/OutputBox';
import { useHistory } from '../../contexts/HistoryContext';

interface CurlToolProps {
  darkMode: boolean;
  copied: boolean;
  copyToClipboard: (text: string) => void;
  setError: (error: string) => void;
}

export function CurlTool({ darkMode, copied, copyToClipboard, setError }: CurlToolProps) {
  const [curlUrl, setCurlUrl] = useState('');
  const [curlMethod, setCurlMethod] = useState('GET');
  const [curlHeaders, setCurlHeaders] = useState('');
  const [curlBody, setCurlBody] = useState('');
  const [curlOutput, setCurlOutput] = useState('');
  const [curlFlags, setCurlFlags] = useState({ verbose: false, includeHeaders: false, insecure: false });
  const [curlResolve, setCurlResolve] = useState('');
  const { addToHistory } = useHistory();

  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  const generateCurl = () => {
    setError('');
    if (!curlUrl.trim()) {
      setError('URL is required');
      return;
    }

    const flagLetters = [
      curlFlags.verbose ? 'v' : '',
      curlFlags.includeHeaders ? 'i' : '',
      curlFlags.insecure ? 'k' : '',
    ].join('');

    const flags = flagLetters ? `-${flagLetters}` : '';
    let curl = `curl ${flags}${flags ? ' ' : ''}-X ${curlMethod} '${curlUrl}'`;

    if (curlHeaders.trim()) {
      const headers = curlHeaders.split('\n').filter((h) => h.trim());
      headers.forEach((header) => {
        curl += ` \\\n  -H '${header.trim()}'`;
      });
    }

    if (curlBody.trim() && ['POST', 'PUT', 'PATCH'].includes(curlMethod)) {
      curl += ` \\\n  -d '${curlBody.trim()}'`;
    }

    if (curlResolve.trim()) {
      curl += ` \\\n  --resolve '${curlResolve.trim()}'`;
    }

    setCurlOutput(curl);
    addToHistory(curl, 'cURL Generator');
  };

  return (
    <div className="space-y-4">
      <div>
        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
          HTTP Method
        </label>
        <select 
          value={curlMethod} 
          onChange={(e) => setCurlMethod(e.target.value)} 
          className={`w-full border rounded-lg p-3 ${inputClass}`}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>

      <div>
        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
          URL
        </label>
        <input 
          type="text" 
          value={curlUrl} 
          onChange={(e) => setCurlUrl(e.target.value)} 
          className={`w-full border rounded-lg p-3 ${inputClass}`} 
          placeholder="https://api.example.com/endpoint" 
        />
      </div>

      <div>
        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
          Flags
        </label>
        <div className={`space-y-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={curlFlags.verbose} 
              onChange={(e) => setCurlFlags({ ...curlFlags, verbose: e.target.checked })} 
              className="mt-1 w-4 h-4 text-blue-600 rounded" 
            />
            <div>
              <div className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                <code className={`${darkMode ? 'bg-gray-600' : 'bg-gray-200'} px-2 py-1 rounded text-sm`}>-v</code> Verbose
              </div>
              <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'} mt-1`}>
                Show request and response headers
              </div>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={curlFlags.includeHeaders} 
              onChange={(e) => setCurlFlags({ ...curlFlags, includeHeaders: e.target.checked })} 
              className="mt-1 w-4 h-4 text-blue-600 rounded" 
            />
            <div>
              <div className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                <code className={`${darkMode ? 'bg-gray-600' : 'bg-gray-200'} px-2 py-1 rounded text-sm`}>-i</code> Include Headers
              </div>
              <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'} mt-1`}>
                Include response headers in output
              </div>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={curlFlags.insecure} 
              onChange={(e) => setCurlFlags({ ...curlFlags, insecure: e.target.checked })} 
              className="mt-1 w-4 h-4 text-blue-600 rounded" 
            />
            <div>
              <div className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                <code className={`${darkMode ? 'bg-gray-600' : 'bg-gray-200'} px-2 py-1 rounded text-sm`}>-k</code> Insecure
              </div>
              <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'} mt-1`}>
                Allow insecure SSL connections
              </div>
            </div>
          </label>
        </div>
      </div>

      <div>
        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
          Headers (one per line)
        </label>
        <textarea 
          value={curlHeaders} 
          onChange={(e) => setCurlHeaders(e.target.value)} 
          className={`w-full h-24 border rounded-lg p-3 font-mono text-sm ${inputClass}`} 
          placeholder="Content-Type: application/json" 
        />
      </div>

      <div>
        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
          Resolve (optional)
        </label>
        <input 
          type="text" 
          value={curlResolve} 
          onChange={(e) => setCurlResolve(e.target.value)} 
          placeholder="example.com:443:127.0.0.1" 
          className={`w-full border rounded-lg p-3 font-mono text-sm ${inputClass}`} 
        />
      </div>

      {['POST', 'PUT', 'PATCH'].includes(curlMethod) && (
        <div>
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
            Request Body
          </label>
          <textarea 
            value={curlBody} 
            onChange={(e) => setCurlBody(e.target.value)} 
            className={`w-full h-24 border rounded-lg p-3 font-mono text-sm ${inputClass}`} 
            placeholder='{"key": "value"}' 
          />
        </div>
      )}

      <button 
        onClick={generateCurl} 
        className={`w-full ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium py-3 rounded-lg transition-colors`}
      >
        Generate cURL
      </button>

      {curlOutput && (
        <OutputBox 
          darkMode={darkMode} 
          output={curlOutput} 
          copied={copied} 
          onCopy={() => copyToClipboard(curlOutput)} 
        />
      )}
    </div>
  );
}