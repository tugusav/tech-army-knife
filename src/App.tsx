import React, { useState } from 'react';
import { Copy, Check, AlertCircle, FileJson, GitCompare, Code2, Database, FileCode, Shuffle, Terminal, Home } from 'lucide-react';

export default function TechTools() {
  const [activeView, setActiveView] = useState('home');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Base64 Converter State
  const [base64Input, setBase64Input] = useState('');
  const [base64Output, setBase64Output] = useState('');
  const [base64Mode, setBase64Mode] = useState('encode');

  // cURL Generator State
  const [curlUrl, setCurlUrl] = useState('');
  const [curlMethod, setCurlMethod] = useState('GET');
  const [curlHeaders, setCurlHeaders] = useState('');
  const [curlBody, setCurlBody] = useState('');
  const [curlOutput, setCurlOutput] = useState('');
  const [curlFlags, setCurlFlags] = useState({
    verbose: false,
    includeHeaders: false,
    insecure: false
  });

  // Text Compare State
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [diffResult, setDiffResult] = useState([]);

  // JSON-YAML Converter State
  const [jsonYamlInput, setJsonYamlInput] = useState('');
  const [jsonYamlOutput, setJsonYamlOutput] = useState('');
  const [jsonYamlMode, setJsonYamlMode] = useState('json-to-yaml');

  // JSON Formatter State
  const [jsonInput, setJsonInput] = useState('');
  const [jsonOutput, setJsonOutput] = useState('');
  const [jsonFormatMode, setJsonFormatMode] = useState('format');

  // YAML Formatter State
  const [yamlInput, setYamlInput] = useState('');
  const [yamlOutput, setYamlOutput] = useState('');
  const [yamlIndent, setYamlIndent] = useState('2');
  const [yamlUseTab, setYamlUseTab] = useState(false);

  // SQL Formatter State
  const [sqlInput, setSqlInput] = useState('');
  const [sqlOutput, setSqlOutput] = useState('');
  const [sqlKeywordCase, setSqlKeywordCase] = useState('upper');
  const [sqlIndent, setSqlIndent] = useState('2');
  const [sqlUseTab, setSqlUseTab] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBase64Convert = () => {
    setError('');
    try {
      if (base64Mode === 'encode') {
        const encoded = btoa(base64Input);
        setBase64Output(encoded);
      } else {
        const decoded = atob(base64Input);
        setBase64Output(decoded);
      }
    } catch (e) {
      setError('Invalid input for conversion');
      setBase64Output('');
    }
  };

  const generateCurl = () => {
    setError('');
    if (!curlUrl.trim()) {
      setError('URL is required');
      return;
    }

    let flags = [];
    if (curlFlags.verbose) flags.push('-v');
    if (curlFlags.includeHeaders) flags.push('-i');
    if (curlFlags.insecure) flags.push('-k');

    let curl = `curl ${flags.join(' ')}${flags.length > 0 ? ' ' : ''}-X ${curlMethod} '${curlUrl}'`;

    if (curlHeaders.trim()) {
      const headers = curlHeaders.split('\n').filter(h => h.trim());
      headers.forEach(header => {
        curl += ` \\\n  -H '${header.trim()}'`;
      });
    }

    if (curlBody.trim() && ['POST', 'PUT', 'PATCH'].includes(curlMethod)) {
      curl += ` \\\n  -d '${curlBody.trim()}'`;
    }

    setCurlOutput(curl);
  };

  const compareTexts = () => {
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');
    const maxLines = Math.max(lines1.length, lines2.length);
    const result = [];

    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i] || '';
      const line2 = lines2[i] || '';
      
      if (line1 === line2) {
        result.push({ type: 'equal', line1, line2, lineNum: i + 1 });
      } else {
        result.push({ type: 'different', line1, line2, lineNum: i + 1 });
      }
    }
    
    setDiffResult(result);
  };

  const yamlToJson = (yaml) => {
    const lines = yaml.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
    const result = {};
    const stack = [{ obj: result, indent: -1 }];

    lines.forEach(line => {
      const indent = line.search(/\S/);
      const trimmed = line.trim();

      while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
        stack.pop();
      }

      if (trimmed.includes(':')) {
        const [key, ...valueParts] = trimmed.split(':');
        const value = valueParts.join(':').trim();
        const cleanKey = key.trim();

        if (value === '' || value === '{}' || value === '[]') {
          stack[stack.length - 1].obj[cleanKey] = value === '[]' ? [] : {};
          stack.push({ obj: stack[stack.length - 1].obj[cleanKey], indent });
        } else {
          let parsedValue = value;
          if (value === 'true') parsedValue = true;
          else if (value === 'false') parsedValue = false;
          else if (value === 'null') parsedValue = null;
          else if (!isNaN(value) && value !== '') parsedValue = Number(value);
          else if (value.startsWith('"') && value.endsWith('"')) parsedValue = value.slice(1, -1);
          else if (value.startsWith("'") && value.endsWith("'")) parsedValue = value.slice(1, -1);

          stack[stack.length - 1].obj[cleanKey] = parsedValue;
        }
      }
    });

    return result;
  };

  const jsonToYaml = (obj, indentSpaces = 2, useTab = false) => {
    const getIndent = (level) => {
      if (useTab) return '\t'.repeat(level);
      return ' '.repeat(indentSpaces * level);
    };

    const convert = (obj, indent = 0) => {
      const spaces = getIndent(indent);
      let yaml = '';

      if (Array.isArray(obj)) {
        obj.forEach(item => {
          if (typeof item === 'object' && item !== null) {
            yaml += `${spaces}-\n${convert(item, indent + 1)}`;
          } else {
            yaml += `${spaces}- ${item}\n`;
          }
        });
      } else if (typeof obj === 'object' && obj !== null) {
        Object.entries(obj).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            yaml += `${spaces}${key}:\n${convert(value, indent + 1)}`;
          } else {
            yaml += `${spaces}${key}: ${value}\n`;
          }
        });
      }

      return yaml;
    };

    return convert(obj);
  };

  const handleJsonYamlConvert = () => {
    setError('');
    try {
      if (jsonYamlMode === 'json-to-yaml') {
        const parsed = JSON.parse(jsonYamlInput);
        const yaml = jsonToYaml(parsed);
        setJsonYamlOutput(yaml);
      } else {
        const json = yamlToJson(jsonYamlInput);
        setJsonYamlOutput(JSON.stringify(json, null, 2));
      }
    } catch (e) {
      setError('Invalid input format: ' + e.message);
      setJsonYamlOutput('');
    }
  };

  const formatJson = () => {
    setError('');
    try {
      const parsed = JSON.parse(jsonInput);
      if (jsonFormatMode === 'format') {
        setJsonOutput(JSON.stringify(parsed, null, 2));
      } else {
        setJsonOutput(JSON.stringify(parsed));
      }
    } catch (e) {
      setError('Invalid JSON: ' + e.message);
      setJsonOutput('');
    }
  };

  const formatYaml = () => {
    setError('');
    try {
      const json = yamlToJson(yamlInput);
      const indentSpaces = parseInt(yamlIndent) || 2;
      const yaml = jsonToYaml(json, indentSpaces, yamlUseTab);
      setYamlOutput(yaml);
    } catch (e) {
      setError('Invalid YAML: ' + e.message);
      setYamlOutput('');
    }
  };

  const formatSql = () => {
    setError('');
    try {
      let formatted = sqlInput
        .replace(/\s+/g, ' ')
        .trim();

      const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN', 'ON', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'UNION', 'UNION ALL'];
      
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        formatted = formatted.replace(regex, `\n${keyword}`);
      });

      formatted = formatted
        .split('\n')
        .map(line => line.trim())
        .filter(line => line)
        .join('\n');

      formatted = formatted.replace(/\,/g, ',\n  ');
      formatted = formatted.replace(/\(/g, '(\n  ');
      formatted = formatted.replace(/\)/g, '\n)');
      
      const lines = formatted.split('\n');
      let indentLevel = 0;
      const indentSpaces = parseInt(sqlIndent) || 2;
      const getIndent = (level) => {
        if (sqlUseTab) return '\t'.repeat(level);
        return ' '.repeat(indentSpaces * level);
      };

      const formattedLines = lines.map(line => {
        const trimmed = line.trim();
        if (trimmed.endsWith('(')) {
          const result = getIndent(indentLevel) + trimmed;
          indentLevel++;
          return result;
        } else if (trimmed.startsWith(')')) {
          indentLevel = Math.max(0, indentLevel - 1);
          return getIndent(indentLevel) + trimmed;
        } else {
          return getIndent(indentLevel) + trimmed;
        }
      });

      let result = formattedLines.join('\n');

      // Apply keyword case
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        result = result.replace(regex, match => {
          return sqlKeywordCase === 'upper' ? match.toUpperCase() : match.toLowerCase();
        });
      });

      setSqlOutput(result);
    } catch (e) {
      setError('Error formatting SQL: ' + e.message);
      setSqlOutput('');
    }
  };

  const tools = [
    { id: 'base64', name: 'Base64 Converter', category: 'encoding', icon: Code2, desc: 'Encode or decode Base64 strings effortlessly.' },
    { id: 'curl', name: 'cURL Generator', category: 'api', icon: Terminal, desc: 'Generate cURL commands for API testing.' },
    { id: 'compare', name: 'Text Compare', category: 'text', icon: GitCompare, desc: 'Compare two pieces of text to identify differences quickly.' },
    { id: 'json-yaml', name: 'JSON ⟷ YAML', category: 'conversion', icon: Shuffle, desc: 'Convert between JSON and YAML formats.' },
    { id: 'json-format', name: 'JSON Formatter', category: 'formatting', icon: FileJson, desc: 'Format and beautify JSON data for better readability.' },
    { id: 'yaml-format', name: 'YAML Formatter', category: 'formatting', icon: FileCode, desc: 'Format and beautify YAML data.' },
    { id: 'sql-format', name: 'SQL Formatter', category: 'formatting', icon: Database, desc: 'Format and beautify SQL queries with keyword highlighting.' }
  ];

  const categories = [
    { name: 'TEXT & CONTENT', items: tools.filter(t => t.category === 'text') },
    { name: 'ENCODING & CONVERSION', items: tools.filter(t => ['encoding', 'conversion'].includes(t.category)) },
    { name: 'FORMATTING', items: tools.filter(t => t.category === 'formatting') },
    { name: 'API TOOLS', items: tools.filter(t => t.category === 'api') }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Tech Army Knife</h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-3">
          <div className="mb-6">
            <div className="text-xs font-semibold text-gray-500 mb-2 px-3">HOME</div>
            <button
              onClick={() => setActiveView('home')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeView === 'home' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Home size={18} />
              <span className="text-sm">Home</span>
            </button>
          </div>

          {categories.map(category => (
            <div key={category.name} className="mb-6">
              <div className="text-xs font-semibold text-gray-500 mb-2 px-3">{category.name}</div>
              {category.items.map(tool => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setActiveView(tool.id);
                      setError('');
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      activeView === tool.id ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-sm">{tool.name}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {activeView === 'home' ? (
          <div className="max-w-7xl mx-auto p-8">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-gray-900 mb-4">Your Ultimate Developer Toolkit</h1>
              <p className="text-xl text-gray-600">Unlock your productivity with tools designed for developers, by a developer.</p>
            </div>

            <div className="flex gap-4 justify-center mb-12">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
                <Code2 size={20} className="text-blue-600" />
                <span className="font-medium text-gray-900">{tools.length} Tools</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
                <Check size={20} className="text-green-600" />
                <span className="font-medium text-gray-900">Privacy First</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map(tool => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setActiveView(tool.id)}
                    className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all text-left"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <Icon size={24} className="text-gray-700" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                          {tool.name}
                          <span className="text-gray-400">→</span>
                        </h3>
                        <p className="text-sm text-gray-600">{tool.desc}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {tools.find(t => t.id === activeView)?.name}
              </h1>
              <p className="text-gray-600">
                {tools.find(t => t.id === activeView)?.desc}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              {activeView === 'base64' && (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setBase64Mode('encode')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        base64Mode === 'encode'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Encode
                    </button>
                    <button
                      onClick={() => setBase64Mode('decode')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        base64Mode === 'decode'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Decode
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Input</label>
                    <textarea
                      value={base64Input}
                      onChange={(e) => setBase64Input(e.target.value)}
                      className="w-full h-40 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={base64Mode === 'encode' ? 'Enter text to encode...' : 'Enter base64 to decode...'}
                    />
                  </div>

                  <button
                    onClick={handleBase64Convert}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    Convert
                  </button>

                  {base64Output && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">Output</label>
                        <button
                          onClick={() => copyToClipboard(base64Output)}
                          className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors text-sm"
                        >
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <textarea
                        value={base64Output}
                        readOnly
                        className="w-full h-40 border border-gray-300 rounded-lg p-3 bg-gray-50"
                      />
                    </div>
                  )}
                </div>
              )}

              {activeView === 'curl' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">HTTP Method</label>
                    <select
                      value={curlMethod}
                      onChange={(e) => setCurlMethod(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="PATCH">PATCH</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
                    <input
                      type="text"
                      value={curlUrl}
                      onChange={(e) => setCurlUrl(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://api.example.com/endpoint"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Flags</label>
                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={curlFlags.verbose}
                          onChange={(e) => setCurlFlags({...curlFlags, verbose: e.target.checked})}
                          className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-medium text-gray-900">
                            <code className="bg-gray-200 px-2 py-1 rounded text-sm">-v</code> Verbose
                          </div>
                          <div className="text-xs text-gray-600 mt-1">Show request and response headers</div>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={curlFlags.includeHeaders}
                          onChange={(e) => setCurlFlags({...curlFlags, includeHeaders: e.target.checked})}
                          className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-medium text-gray-900">
                            <code className="bg-gray-200 px-2 py-1 rounded text-sm">-i</code> Include Headers
                          </div>
                          <div className="text-xs text-gray-600 mt-1">Include response headers in output</div>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={curlFlags.insecure}
                          onChange={(e) => setCurlFlags({...curlFlags, insecure: e.target.checked})}
                          className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-medium text-gray-900">
                            <code className="bg-gray-200 px-2 py-1 rounded text-sm">-k</code> Insecure
                          </div>
                          <div className="text-xs text-gray-600 mt-1">Allow insecure SSL connections</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Headers (one per line)</label>
                    <textarea
                      value={curlHeaders}
                      onChange={(e) => setCurlHeaders(e.target.value)}
                      className="w-full h-24 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder="Content-Type: application/json&#10;Authorization: Bearer token"
                    />
                  </div>

                  {['POST', 'PUT', 'PATCH'].includes(curlMethod) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Request Body</label>
                      <textarea
                        value={curlBody}
                        onChange={(e) => setCurlBody(e.target.value)}
                        className="w-full h-24 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        placeholder='{"key": "value"}'
                      />
                    </div>
                  )}

                  <button
                    onClick={generateCurl}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    Generate cURL
                  </button>

                  {curlOutput && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">Generated cURL</label>
                        <button
                          onClick={() => copyToClipboard(curlOutput)}
                          className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors text-sm"
                        >
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <textarea
                        value={curlOutput}
                        readOnly
                        className="w-full h-40 border border-gray-300 rounded-lg p-3 bg-gray-50 font-mono text-sm"
                      />
                    </div>
                  )}
                </div>
              )}

              {activeView === 'compare' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Text 1</label>
                      <textarea
                        value={text1}
                        onChange={(e) => setText1(e.target.value)}
                        className="w-full h-64 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        placeholder="Enter first text..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Text 2</label>
                      <textarea
                        value={text2}
                        onChange={(e) => setText2(e.target.value)}
                        className="w-full h-64 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        placeholder="Enter second text..."
                      />
                    </div>
                  </div>

                  <button
                    onClick={compareTexts}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    Compare Texts
                  </button>

                  {diffResult.length > 0 && (
                    <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto bg-gray-50">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Comparison Results:</h3>
                      {diffResult.map((diff, idx) => (
                        <div key={idx} className={`p-3 mb-2 rounded-lg ${diff.type === 'equal' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                          <div className="text-xs text-gray-600 mb-1">Line {diff.lineNum}</div>
                          <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                            <div className="text-gray-900">{diff.line1 || '(empty)'}</div>
                            <div className="text-gray-900">{diff.line2 || '(empty)'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeView === 'json-yaml' && (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setJsonYamlMode('json-to-yaml')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        jsonYamlMode === 'json-to-yaml'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      JSON → YAML
                    </button>
                    <button
                      onClick={() => setJsonYamlMode('yaml-to-json')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        jsonYamlMode === 'yaml-to-json'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      YAML → JSON
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Input</label>
                    <textarea
                      value={jsonYamlInput}
                      onChange={(e) => setJsonYamlInput(e.target.value)}
                      className="w-full h-64 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder={jsonYamlMode === 'json-to-yaml' ? 'Enter JSON...' : 'Enter YAML...'}
                    />
                  </div>

                  <button
                    onClick={handleJsonYamlConvert}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    Convert
                  </button>

                  {jsonYamlOutput && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">Output</label>
                        <button
                          onClick={() => copyToClipboard(jsonYamlOutput)}
                          className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors text-sm"
                        >
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <textarea
                        value={jsonYamlOutput}
                        readOnly
                        className="w-full h-64 border border-gray-300 rounded-lg p-3 bg-gray-50 font-mono text-sm"
                      />
                    </div>
                  )}
                </div>
              )}

              {activeView === 'json-format' && (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setJsonFormatMode('format')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        jsonFormatMode === 'format'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Format
                    </button>
                    <button
                      onClick={() => setJsonFormatMode('minify')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        jsonFormatMode === 'minify'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Minify
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">JSON Input</label>
                    <textarea
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      className="w-full h-64 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder='{"key":"value","array":[1,2,3]}'
                    />
                  </div>

                  <button
                    onClick={formatJson}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    {jsonFormatMode === 'format' ? 'Format JSON' : 'Minify JSON'}
                  </button>

                  {jsonOutput && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {jsonFormatMode === 'format' ? 'Formatted' : 'Minified'} Output
                        </label>
                        <button
                          onClick={() => copyToClipboard(jsonOutput)}
                          className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors text-sm"
                        >
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <textarea
                        value={jsonOutput}
                        readOnly
                        className="w-full h-64 border border-gray-300 rounded-lg p-3 bg-gray-50 font-mono text-sm"
                      />
                    </div>
                  )}
                </div>
              )}

              {activeView === 'yaml-format' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Indentation</label>
                      <select
                        value={yamlIndent}
                        onChange={(e) => setYamlIndent(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="2">2 spaces</option>
                        <option value="4">4 spaces</option>
                        <option value="8">8 spaces</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Indent Type</label>
                      <div className="flex gap-3 h-12 items-center">
                        <button
                          onClick={() => setYamlUseTab(false)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            !yamlUseTab
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Spaces
                        </button>
                        <button
                          onClick={() => setYamlUseTab(true)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            yamlUseTab
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Tabs
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">YAML Input</label>
                    <textarea
                      value={yamlInput}
                      onChange={(e) => setYamlInput(e.target.value)}
                      className="w-full h-64 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder="key: value&#10;array:&#10;  - item1&#10;  - item2"
                    />
                  </div>

                  <button
                    onClick={formatYaml}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    Format YAML
                  </button>

                  {yamlOutput && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">Formatted Output</label>
                        <button
                          onClick={() => copyToClipboard(yamlOutput)}
                          className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors text-sm"
                        >
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <textarea
                        value={yamlOutput}
                        readOnly
                        className="w-full h-64 border border-gray-300 rounded-lg p-3 bg-gray-50 font-mono text-sm"
                      />
                    </div>
                  )}
                </div>
              )}

              {activeView === 'sql-format' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Keyword Case</label>
                      <select
                        value={sqlKeywordCase}
                        onChange={(e) => setSqlKeywordCase(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="upper">UPPERCASE</option>
                        <option value="lower">lowercase</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Indentation</label>
                      <select
                        value={sqlIndent}
                        onChange={(e) => setSqlIndent(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="2">2 spaces</option>
                        <option value="4">4 spaces</option>
                        <option value="8">8 spaces</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Indent Type</label>
                      <div className="flex gap-2 h-12 items-center">
                        <button
                          onClick={() => setSqlUseTab(false)}
                          className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                            !sqlUseTab
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Spaces
                        </button>
                        <button
                          onClick={() => setSqlUseTab(true)}
                          className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                            sqlUseTab
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Tabs
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SQL Input</label>
                    <textarea
                      value={sqlInput}
                      onChange={(e) => setSqlInput(e.target.value)}
                      className="w-full h-64 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder="SELECT * FROM users WHERE id = 1 AND status = 'active'"
                    />
                  </div>

                  <button
                    onClick={formatSql}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    Format SQL
                  </button>

                  {sqlOutput && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">Formatted Output</label>
                        <button
                          onClick={() => copyToClipboard(sqlOutput)}
                          className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors text-sm"
                        >
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <textarea
                        value={sqlOutput}
                        readOnly
                        className="w-full h-64 border border-gray-300 rounded-lg p-3 bg-gray-50 font-mono text-sm"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}