import { useState } from 'react';
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

interface FormDataItem {
  key: string;
  value: string;
  type: 'text' | 'file';
  enabled: boolean;
}

export function CurlTool({ darkMode, copied, copyToClipboard, setError }: CurlToolProps) {
  const [curlUrl, setCurlUrl] = useState('');
  const [curlMethod, setCurlMethod] = useState('GET');
  const [headers, setHeaders] = useState<Header[]>([{ key: '', value: '', enabled: true }]);
  const [queryParams, setQueryParams] = useState<QueryParam[]>([{ key: '', value: '', enabled: true }]);
  const [curlBody, setCurlBody] = useState('');
  const [bodyType, setBodyType] = useState<'none' | 'raw' | 'form-data' | 'x-www-form-urlencoded'>('none');
  const [formData, setFormData] = useState<FormDataItem[]>([{ key: '', value: '', type: 'text', enabled: true }]);
  const [curlOutput, setCurlOutput] = useState('');
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'auth' | 'settings' | 'import'>('params');
  const [curlFlags, setCurlFlags] = useState({ verbose: false, includeHeaders: false, insecure: false });
  const [curlResolve, setCurlResolve] = useState('');
  
  // Authentication
  const [authType, setAuthType] = useState<'none' | 'basic' | 'bearer' | 'api-key'>('none');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [authApiKey, setAuthApiKey] = useState('');
  const [authApiKeyHeader, setAuthApiKeyHeader] = useState('X-API-Key');
  
  // Raw input modes
  const [headersRawMode, setHeadersRawMode] = useState(false);
  const [paramsRawMode, setParamsRawMode] = useState(false);
  const [headersRaw, setHeadersRaw] = useState('');
  const [paramsRaw, setParamsRaw] = useState('');
  
  // Import curl
  const [importCurl, setImportCurl] = useState('');
  
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

  // Parse raw headers string into header objects
  const parseRawHeaders = (rawHeaders: string): Header[] => {
    if (!rawHeaders.trim()) return [{ key: '', value: '', enabled: true }];
    
    return rawHeaders.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) return { key: line.trim(), value: '', enabled: true };
        return {
          key: line.substring(0, colonIndex).trim(),
          value: line.substring(colonIndex + 1).trim(),
          enabled: true
        };
      })
      .concat([{ key: '', value: '', enabled: true }]);
  };

  // Parse raw params string into param objects
  const parseRawParams = (rawParams: string): QueryParam[] => {
    if (!rawParams.trim()) return [{ key: '', value: '', enabled: true }];
    
    return rawParams.split('&')
      .filter(param => param.trim())
      .map(param => {
        const equalIndex = param.indexOf('=');
        if (equalIndex === -1) return { key: param.trim(), value: '', enabled: true };
        return {
          key: decodeURIComponent(param.substring(0, equalIndex).trim()),
          value: decodeURIComponent(param.substring(equalIndex + 1).trim()),
          enabled: true
        };
      })
      .concat([{ key: '', value: '', enabled: true }]);
  };

  // Convert headers to raw string
  const headersToRaw = (headers: Header[]): string => {
    return headers
      .filter(h => h.enabled && h.key.trim())
      .map(h => `${h.key}: ${h.value}`)
      .join('\n');
  };

  // Convert params to raw string
  const paramsToRaw = (params: QueryParam[]): string => {
    return params
      .filter(p => p.enabled && p.key.trim())
      .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
      .join('&');
  };

  // Parse curl command
  const parseCurlCommand = (curlCmd: string) => {
    try {
      console.log('Parsing cURL command:', curlCmd);
      
      // Clean up the command - handle line continuations and normalize spaces
      let cleanCmd = curlCmd
        .replace(/\\\s*\n\s*/g, ' ') // Handle line continuations
        .replace(/\s+/g, ' ') // Normalize multiple spaces
        .trim();

      console.log('Cleaned command:', cleanCmd);

      // Parse using a more sophisticated approach that handles quotes
      const tokens = parseCommandTokens(cleanCmd);
      console.log('Parsed tokens:', tokens);
      
      let url = '';
      let method = 'GET';
      const parsedHeaders: Header[] = [];
      let body = '';
      let i = 0;
      setCurlFlags({ verbose: false, includeHeaders: false, insecure: false });
      
      // Skip 'curl' if present
      if (tokens[0] === 'curl') {
        i = 1;
      }
      
      while (i < tokens.length) {
        const token = tokens[i];
        
        if (token === '-v' || token === '--verbose' ||
            token === '-i' || token === '--include' ||
            token === '-k' || token === '--insecure' ||
            token === '-s' || token === '--silent' ||
            token === '-L' || token === '--location' ||
            /^-[viksSL]+$/.test(token)) {
          // Boolean flags — detect and reflect in settings
          const f = token.replace(/^-+/, '');
          setCurlFlags(prev => ({
            ...prev,
            verbose: prev.verbose || f.includes('v') || token === '--verbose',
            includeHeaders: prev.includeHeaders || f.includes('i') || token === '--include',
            insecure: prev.insecure || f.includes('k') || token === '--insecure',
          }));
          i++;
        } else if (token === '-X' || token === '--request') {
          if (i + 1 < tokens.length) {
            method = tokens[i + 1];
            i += 2;
          } else {
            i++;
          }
        } else if (token === '-H' || token === '--header') {
          if (i + 1 < tokens.length) {
            const headerStr = tokens[i + 1];
            const colonIndex = headerStr.indexOf(':');
            if (colonIndex !== -1) {
              parsedHeaders.push({
                key: headerStr.substring(0, colonIndex).trim(),
                value: headerStr.substring(colonIndex + 1).trim(),
                enabled: true
              });
            }
            i += 2;
          } else {
            i++;
          }
        } else if (token === '-d' || token === '--data' || token === '--data-raw') {
          if (i + 1 < tokens.length) {
            body = tokens[i + 1];
            i += 2;
          } else {
            i++;
          }
        } else if (token.startsWith('http://') || token.startsWith('https://')) {
          url = token;
          i++;
        } else if (token.startsWith('-')) {
          // Skip unknown flags
          if (i + 1 < tokens.length && !tokens[i + 1].startsWith('-')) {
            i += 2; // Skip flag and its value
          } else {
            i++; // Skip flag only
          }
        } else {
          // If it's not a flag and looks like a URL, use it
          if (token.includes('.') && !url) {
            url = token.startsWith('http') ? token : `https://${token}`;
          }
          i++;
        }
      }
      
      console.log('Parsed results:', { url, method, headers: parsedHeaders, body });
      
      if (!url) {
        setError('No URL found in cURL command');
        return;
      }
      
      // Parse URL for query params
      let parsedParams: QueryParam[] = [];
      try {
        const urlObj = new URL(url);
        urlObj.searchParams.forEach((value, key) => {
          parsedParams.push({ key, value, enabled: true });
        });
        
        // Update state
        setCurlUrl(urlObj.origin + urlObj.pathname);
      } catch (urlError) {
        // If URL parsing fails, just use the URL as-is
        setCurlUrl(url);
      }
      
      setCurlMethod(method.toUpperCase());
      setHeaders(parsedHeaders.length > 0 ? [...parsedHeaders, { key: '', value: '', enabled: true }] : [{ key: '', value: '', enabled: true }]);
      setQueryParams(parsedParams.length > 0 ? [...parsedParams, { key: '', value: '', enabled: true }] : [{ key: '', value: '', enabled: true }]);
      setCurlBody(body);
      setBodyType(body ? 'raw' : 'none');
      
      setError('');
      
      // Clear the import field after successful parsing
      setImportCurl('');
      
      console.log('Successfully parsed and updated state');
      
    } catch (error) {
      console.error('Parse error:', error);
      setError('Failed to parse cURL command. Please check the format.');
    }
  };

  // Helper function to parse command tokens while respecting quotes
  const parseCommandTokens = (cmd: string): string[] => {
    const tokens: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < cmd.length; i++) {
      const char = cmd[i];
      
      if (!inQuotes && (char === '"' || char === "'")) {
        inQuotes = true;
        quoteChar = char;
      } else if (inQuotes && char === quoteChar) {
        inQuotes = false;
        quoteChar = '';
      } else if (!inQuotes && char === ' ') {
        if (current.trim()) {
          tokens.push(current.trim());
          current = '';
        }
      } else {
        current += char;
      }
    }
    
    if (current.trim()) {
      tokens.push(current.trim());
    }
    
    return tokens;
  };

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

  const addFormDataItem = () => {
    setFormData([...formData, { key: '', value: '', type: 'text', enabled: true }]);
  };

  const updateFormDataItem = (index: number, field: keyof FormDataItem, value: string | boolean) => {
    const newFormData = [...formData];
    newFormData[index] = { ...newFormData[index], [field]: value };
    setFormData(newFormData);
  };

  const removeFormDataItem = (index: number) => {
    setFormData(formData.filter((_, i) => i !== index));
  };

  const buildUrlWithParams = () => {
    const enabledParams = paramsRawMode 
      ? parseRawParams(paramsRaw).filter(p => p.enabled && p.key.trim())
      : queryParams.filter(p => p.enabled && p.key.trim());
    
    if (enabledParams.length === 0) return curlUrl;
    
    try {
      const url = new URL(curlUrl.includes('://') ? curlUrl : `https://${curlUrl}`);
      enabledParams.forEach(param => {
        url.searchParams.set(param.key, param.value);
      });
      return url.toString();
    } catch {
      return curlUrl;
    }
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
    const finalUrl = buildUrlWithParams();
    let curl = `curl ${flags}${flags ? ' ' : ''}-X ${curlMethod} '${finalUrl}'`;

    // Add authentication headers
    if (authType === 'basic' && authUsername && authPassword) {
      curl += ` -u '${authUsername}:${authPassword}'`;
    } else if (authType === 'bearer' && authToken) {
      curl += ` -H 'Authorization: Bearer ${authToken}'`;
    } else if (authType === 'api-key' && authApiKey) {
      curl += ` -H '${authApiKeyHeader}: ${authApiKey}'`;
    }

    // Add headers
    const enabledHeaders = headersRawMode 
      ? parseRawHeaders(headersRaw).filter(h => h.enabled && h.key.trim())
      : headers.filter(h => h.enabled && h.key.trim());
    
    enabledHeaders.forEach((header) => {
      curl += ` -H '${header.key.trim()}: ${header.value.trim()}'`;
    });

    // Add body for appropriate methods
    if (['POST', 'PUT', 'PATCH'].includes(curlMethod)) {
      if (bodyType === 'raw' && curlBody.trim()) {
        curl += ` -d '${curlBody.trim()}'`;
      } else if (bodyType === 'form-data') {
        const enabledFormData = formData.filter(f => f.enabled && f.key.trim());
        enabledFormData.forEach((item) => {
          if (item.type === 'file') {
            curl += ` -F '${item.key}=@${item.value}'`;
          } else {
            curl += ` -F '${item.key}=${item.value}'`;
          }
        });
      } else if (bodyType === 'x-www-form-urlencoded') {
        const enabledFormData = formData.filter(f => f.enabled && f.key.trim());
        const formDataStr = enabledFormData
          .map(item => `${encodeURIComponent(item.key)}=${encodeURIComponent(item.value)}`)
          .join('&');
        if (formDataStr) {
          curl += ` -d '${formDataStr}'`;
          curl += ` -H 'Content-Type: application/x-www-form-urlencoded'`;
        }
      }
    }

    if (curlResolve.trim()) {
      curl += ` --resolve '${curlResolve.trim()}'`;
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
            Generate
          </button>
        </div>
      </div>

      {/* Tabs - Postman Style */}
      <div className={`border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
        <nav className="flex space-x-0">
          {[
            { id: 'import', label: 'Import' },
            { id: 'params', label: 'Params' },
            { id: 'headers', label: 'Headers' },
            { id: 'body', label: 'Body' },
            { id: 'auth', label: 'Auth' },
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
              {tab.id === 'auth' && authType !== 'none' && (
                <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                  darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-600'
                }`}>
                  •
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {activeTab === 'import' && (
          <div className="space-y-4">
            <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Import cURL Command
            </h3>
            <textarea
              value={importCurl}
              onChange={(e) => setImportCurl(e.target.value)}
              placeholder="Paste your cURL command here..."
              className={`w-full h-32 border rounded-lg p-3 font-mono text-sm ${inputClass}`}
            />
            <div className="flex gap-2">
              <button
                onClick={() => parseCurlCommand(importCurl)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  darkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                } transition-colors`}
              >
                Import cURL
              </button>
              <button
                onClick={() => setImportCurl('')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  darkMode 
                    ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                    : 'bg-gray-500 hover:bg-gray-600 text-white'
                } transition-colors`}
              >
                Clear
              </button>
            </div>
            
            {/* Example cURL commands */}
            <div className="space-y-3">
              <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Example cURL Commands (click to test):
              </h4>
              <div className="space-y-2">
                {[
                  {
                    name: 'Simple GET',
                    cmd: `curl -X GET 'https://jsonplaceholder.typicode.com/posts/1'`
                  },
                  {
                    name: 'POST with JSON',
                    cmd: `curl -X POST 'https://jsonplaceholder.typicode.com/posts' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer token123' \\
  -d '{"title": "foo", "body": "bar", "userId": 1}'`
                  },
                  {
                    name: 'GET with Query Params',
                    cmd: `curl -X GET 'https://api.example.com/search?q=javascript&limit=10&sort=date'`
                  },
                  {
                    name: 'POST with Headers',
                    cmd: `curl -X POST 'https://api.example.com/users' \\
  -H 'Content-Type: application/json' \\
  -H 'X-API-Key: abc123' \\
  -H 'User-Agent: MyApp/1.0' \\
  -d '{"name": "John Doe", "email": "john@example.com"}'`
                  }
                ].map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setImportCurl(example.cmd)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-300' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="font-medium text-sm mb-1">{example.name}</div>
                    <div className={`text-xs font-mono ${darkMode ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                      {example.cmd.split('\\')[0]}...
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'params' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Query Parameters
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setParamsRawMode(!paramsRawMode);
                    if (!paramsRawMode) {
                      setParamsRaw(paramsToRaw(queryParams));
                    } else {
                      setQueryParams(parseRawParams(paramsRaw));
                    }
                  }}
                  className={`text-xs px-2 py-1 rounded ${
                    paramsRawMode
                      ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                      : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } transition-colors`}
                >
                  Raw
                </button>
                <button
                  onClick={addQueryParam}
                  className={`text-sm px-3 py-1 rounded ${
                    darkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-gray-100'
                  } transition-colors`}
                >
                  + Add
                </button>
              </div>
            </div>
            
            {paramsRawMode ? (
              <textarea
                value={paramsRaw}
                onChange={(e) => setParamsRaw(e.target.value)}
                placeholder="key1=value1&key2=value2"
                className={`w-full h-24 border rounded-lg p-3 font-mono text-sm ${inputClass}`}
              />
            ) : (
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
            )}
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Headers
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setHeadersRawMode(!headersRawMode);
                    if (!headersRawMode) {
                      setHeadersRaw(headersToRaw(headers));
                    } else {
                      setHeaders(parseRawHeaders(headersRaw));
                    }
                  }}
                  className={`text-xs px-2 py-1 rounded ${
                    headersRawMode
                      ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                      : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } transition-colors`}
                >
                  Raw
                </button>
                <button
                  onClick={addHeader}
                  className={`text-sm px-3 py-1 rounded ${
                    darkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-gray-100'
                  } transition-colors`}
                >
                  + Add
                </button>
              </div>
            </div>
            
            {headersRawMode ? (
              <textarea
                value={headersRaw}
                onChange={(e) => setHeadersRaw(e.target.value)}
                placeholder="Content-Type: application/json&#10;Authorization: Bearer token"
                className={`w-full h-24 border rounded-lg p-3 font-mono text-sm ${inputClass}`}
              />
            ) : (
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
            )}
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
            
            {(bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded') && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Form Data
                  </h4>
                  <button
                    onClick={addFormDataItem}
                    className={`text-sm px-3 py-1 rounded ${
                      darkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-gray-100'
                    } transition-colors`}
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={(e) => updateFormDataItem(index, 'enabled', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <input
                        type="text"
                        value={item.key}
                        onChange={(e) => updateFormDataItem(index, 'key', e.target.value)}
                        placeholder="Key"
                        className={`flex-1 px-3 py-2 text-sm border rounded ${inputClass}`}
                      />
                      <input
                        type="text"
                        value={item.value}
                        onChange={(e) => updateFormDataItem(index, 'value', e.target.value)}
                        placeholder={item.type === 'file' ? 'File path' : 'Value'}
                        className={`flex-1 px-3 py-2 text-sm border rounded ${inputClass}`}
                      />
                      {bodyType === 'form-data' && (
                        <select
                          value={item.type}
                          onChange={(e) => updateFormDataItem(index, 'type', e.target.value)}
                          className={`px-2 py-2 text-sm border rounded ${inputClass}`}
                        >
                          <option value="text">Text</option>
                          <option value="file">File</option>
                        </select>
                      )}
                      <button
                        onClick={() => removeFormDataItem(index)}
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
          </div>
        )}

        {activeTab === 'auth' && (
          <div className="space-y-4">
            <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Authentication
            </h3>
            <div className="flex gap-4">
              {[
                { id: 'none', label: 'No Auth' },
                { id: 'basic', label: 'Basic Auth' },
                { id: 'bearer', label: 'Bearer Token' },
                { id: 'api-key', label: 'API Key' }
              ].map((type) => (
                <label key={type.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="authType"
                    value={type.id}
                    checked={authType === type.id}
                    onChange={(e) => setAuthType(e.target.value as any)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {type.label}
                  </span>
                </label>
              ))}
            </div>

            {authType === 'basic' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Username
                  </label>
                  <input
                    type="text"
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded ${inputClass}`}
                  />
                </div>
              </div>
            )}

            {authType === 'bearer' && (
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Token
                </label>
                <input
                  type="text"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  placeholder="Enter bearer token"
                  className={`w-full px-3 py-2 text-sm border rounded ${inputClass}`}
                />
              </div>
            )}

            {authType === 'api-key' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Header Name
                  </label>
                  <input
                    type="text"
                    value={authApiKeyHeader}
                    onChange={(e) => setAuthApiKeyHeader(e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    API Key
                  </label>
                  <input
                    type="text"
                    value={authApiKey}
                    onChange={(e) => setAuthApiKey(e.target.value)}
                    placeholder="Enter API key"
                    className={`w-full px-3 py-2 text-sm border rounded ${inputClass}`}
                  />
                </div>
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