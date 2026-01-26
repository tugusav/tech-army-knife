import React, { useState } from 'react';
import { OutputBox } from '../common/OutputBox';
import { useHistory } from '../../contexts/HistoryContext';

interface CurlToolProps {
  darkMode: boolean;
  copied: boolean;
  copyToClipboard: (text: string) => void;
  setError: (error: string) => void;
}

interface Header {
  key: string;
  value: string;
  enabled: boolean;
}

interface QueryParam {
  key: string;
  value: string;
  enabled: boolean;
}

export function CurlTool({ darkMode, copied, copyToClipboard, setError }: CurlToolProps) {
  const [curlUrl, setCurlUrl] = useState('');
  const [curlMethod, setCurlMethod] = useState('GET');
  const [headers, setHeaders] = useState<Header[]>([{ key: '', value: '', enabled: true }]);
  const [queryParams, setQueryParams] = useState<QueryParam[]>([{ key: '', value: '', enabled: true }]);
  const [curlBody, setCurlBody] = useState('');
  const [bodyType, setBodyType] = useState<'none' | 'raw' | 'form-data' | 'x-www-form-urlencoded'>('none');
  const [curlOutput, setCurlOutput] = useState('');
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'settings'>('params');
  const [curlFlags, setCurlFlags] = useState({ verbose: false, includeHeaders: false, insecure: false });
  const [curlResolve, setCurlResolve] = useState('');
  const { addToHistory } = useHistory();

  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';
  const tabClass = (isActive: boolean) => 
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      isActive 
        ? darkMode 
          ? 'border-blue-400 text-blue-400' 
          : 'border-blue-500 text-blue-600'
        : darkMode 
          ? 'border-transparent text-gray-400 hover:text-gray-300' 
          : 'border-transparent text-gray-500 hover:text-gray-700'
    }`;

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }]);
  };

  const updateHeader = (index: number, field: keyof Header, value: string | boolean) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    setHeaders(newHeaders);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const addQueryParam = () => {
    setQueryParams([...queryParams, { key: '', value: '', enabled: true }]);
  };

  const updateQueryParam = (index: number, field: keyof QueryParam, value: string | boolean) => {
    const newParams = [...queryParams];
    newParams[index] = { ...newParams[index], [field]: value };
    setQueryParams(newParams);
  };

  const removeQueryParam = (index: number) => {
    setQueryParams(queryParams.filter((_, i) => i !== index));
  };

  const buildUrlWithParams = () => {
    const enabledParams = queryParams.filter(p => p.enabled && p.key.trim());
    if (enabledParams.length === 0) return curlUrl;
    
    const url = new URL(curlUrl.includes('://') ? curlUrl : `https://${curlUrl}`);
    enabledParams.forEach(param => {
      url.searchParams.set(param.key, param.value);
    });
    return url.toString();
  };

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
      {/* Request URL Bar - Postman Style */}
      <div className={`border rounded-lg ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'}`}>
        <div className="flex">
          <select 
            value={curlMethod} 
            onChange={(e) => setCurlMethod(e.target.value)} 
            className={`border-r rounded-l-lg px-4 py-3 font-medium min-w-[100px] ${
              darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
            }`}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
            <option value="HEAD">HEAD</option>
            <option value="OPTIONS">OPTIONS</option>
          </select>
          <input 
            type="text" 
            value={curlUrl} 
            onChange={(e) => setCurlUrl(e.target.value)} 
            className={`flex-1 px-4 py-3 border-0 focus:ring-0 ${
              darkMode ? 'bg-gray-800 text-white placeholder-gray-400' : 'bg-white text-gray-900 placeholder-gray-500'
            }`}
            placeholder="Enter request URL" 
          />
          <button 
            onClick={generateCurl} 
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-r-lg transition-colors"
          >
            Send
          </button>
        </div>
      </div>

      {/* Tabs - Postman Style */}
      <div className={`border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
        <nav className="flex space-x-0">
          {[
            { id: 'params', label: 'Params' },
            { id: 'headers', label: 'Headers' },
            { id: 'body', label: 'Body' },
            { id: 'settings', label: 'Settings' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={tabClass(activeTab === tab.id)}
            >
              {tab.label}
              {tab.id === 'params' && queryParams.filter(p => p.enabled && p.key.trim()).length > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                  darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-600'
                }`}>
                  {queryParams.filter(p => p.enabled && p.key.trim()).length}
                </span>
              )}
              {tab.id === 'headers' && headers.filter(h => h.enabled && h.key.trim()).length > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                  darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-600'
                }`}>
                  {headers.filter(h => h.enabled && h.key.trim()).length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {activeTab === 'params' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Query Parameters
              </h3>
              <button
                onClick={addQueryParam}
                className={`text-sm px-3 py-1 rounded ${
                  darkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-gray-100'
                } transition-colors`}
              >
                + Add
              </button>
            </div>
            <div className="space-y-2">
              {queryParams.map((param, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={param.enabled}
                    onChange={(e) => updateQueryParam(index, 'enabled', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <input
                    type="text"
                    value={param.key}
                    onChange={(e) => updateQueryParam(index, 'key', e.target.value)}
                    placeholder="Key"
                    className={`flex-1 px-3 py-2 text-sm border rounded ${inputClass}`}
                  />
                  <input
                    type="text"
                    value={param.value}
                    onChange={(e) => updateQueryParam(index, 'value', e.target.value)}
                    placeholder="Value"
                    className={`flex-1 px-3 py-2 text-sm border rounded ${inputClass}`}
                  />
                  <button
                    onClick={() => removeQueryParam(index)}
                    className={`p-2 text-sm ${
                      darkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'
                    } transition-colors`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Headers
              </h3>
              <button
                onClick={addHeader}
                className={`text-sm px-3 py-1 rounded ${
                  darkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-gray-100'
                } transition-colors`}
              >
                + Add
              </button>
            </div>
            <div className="space-y-2">
              {headers.map((header, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={header.enabled}
                    onChange={(e) => updateHeader(index, 'enabled', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <input
                    type="text"
                    value={header.key}
                    onChange={(e) => updateHeader(index, 'key', e.target.value)}
                    placeholder="Header"
                    className={`flex-1 px-3 py-2 text-sm border rounded ${inputClass}`}
                  />
                  <input
                    type="text"
                    value={header.value}
                    onChange={(e) => updateHeader(index, 'value', e.target.value)}
                    placeholder="Value"
                    className={`flex-1 px-3 py-2 text-sm border rounded ${inputClass}`}
                  />
                  <button
                    onClick={() => removeHeader(index)}
                    className={`p-2 text-sm ${
                      darkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'
                    } transition-colors`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'body' && (
          <div className="space-y-4">
            <div className="flex gap-4">
              {[
                { id: 'none', label: 'none' },
                { id: 'raw', label: 'raw' },
                { id: 'form-data', label: 'form-data' },
                { id: 'x-www-form-urlencoded', label: 'x-www-form-urlencoded' }
              ].map((type) => (
                <label key={type.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="bodyType"
                    value={type.id}
                    checked={bodyType === type.id}
                    onChange={(e) => setBodyType(e.target.value as any)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {type.label}
                  </span>
                </label>
              ))}
            </div>
            
            {bodyType === 'raw' && (
              <div>
                <textarea 
                  value={curlBody} 
                  onChange={(e) => setCurlBody(e.target.value)} 
                  className={`w-full h-32 border rounded-lg p-3 font-mono text-sm ${inputClass}`} 
                  placeholder='{"key": "value"}'
                />
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => {
                      try {
                        const formatted = JSON.stringify(JSON.parse(curlBody), null, 2);
                        setCurlBody(formatted);
                      } catch (e) {
                        setError('Invalid JSON');
                      }
                    }}
                    className={`text-xs px-2 py-1 rounded ${
                      darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } transition-colors`}
                  >
                    Beautify JSON
                  </button>
                </div>
              </div>
            )}
            
            {bodyType !== 'none' && bodyType !== 'raw' && (
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {bodyType} support coming soon
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              cURL Options
            </h3>
            <div className="space-y-3">
              {[
                { key: 'verbose', flag: '-v', label: 'Verbose', desc: 'Show request and response headers' },
                { key: 'includeHeaders', flag: '-i', label: 'Include Headers', desc: 'Include response headers in output' },
                { key: 'insecure', flag: '-k', label: 'Insecure', desc: 'Allow insecure SSL connections' }
              ].map((option) => (
                <label key={option.key} className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={curlFlags[option.key as keyof typeof curlFlags]} 
                    onChange={(e) => setCurlFlags({ ...curlFlags, [option.key]: e.target.checked })} 
                    className="mt-1 w-4 h-4 text-blue-600 rounded" 
                  />
                  <div>
                    <div className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      <code className={`${darkMode ? 'bg-gray-600' : 'bg-gray-200'} px-2 py-1 rounded text-sm mr-2`}>
                        {option.flag}
                      </code>
                      {option.label}
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'} mt-1`}>
                      {option.desc}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            
            <div className="pt-4 border-t border-gray-600">
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Custom Resolve
              </label>
              <input 
                type="text" 
                value={curlResolve} 
                onChange={(e) => setCurlResolve(e.target.value)} 
                placeholder="example.com:443:127.0.0.1" 
                className={`w-full border rounded-lg p-3 font-mono text-sm ${inputClass}`} 
              />
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'} mt-1`}>
                Override DNS resolution for specific hosts
              </p>
            </div>
          </div>
        )}
      </div>

      {curlOutput && (
        <div className="pt-4">
          <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
            Generated cURL Command
          </h3>
          <OutputBox 
            darkMode={darkMode} 
            output={curlOutput} 
            copied={copied} 
            onCopy={() => copyToClipboard(curlOutput)} 
          />
        </div>
      )}
    </div>
  );
}