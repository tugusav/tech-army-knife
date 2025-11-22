import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Tool } from '../../types';
import { Base64Tool } from '../tools/Base64Tool';
import { CurlTool } from '../tools/CurlTool';
import { CompareTool } from '../tools/CompareTool';
import { JsonYamlTool } from '../tools/JsonYamlTool';
import { JsonFormatterTool } from '../tools/JsonFormatterTool';
import { YamlFormatterTool } from '../tools/YamlFormatterTool';
import { SqlFormatterTool } from '../tools/SqlFormatterTool';
import { RegexTool } from '../tools/RegexTool';
import { JwtTool } from '../tools/JwtTool';
import { CsvJsonTool } from '../tools/CsvJsonTool';

interface ToolPageProps {
  activeView: string;
  tools: Tool[];
  error: string;
  setError: (error: string) => void;
  copied: boolean;
  copyToClipboard: (text: string) => void;
  darkMode: boolean;
}

export function ToolPage({ activeView, tools, error, setError, copied, copyToClipboard, darkMode }: ToolPageProps) {
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const cardClass = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';

  const activeTool = tools.find((t) => t.id === activeView);

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${textClass} mb-2`}>{activeTool?.name}</h1>
        <p className={mutedClass}>{activeTool?.desc}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className={`${cardClass} rounded-xl border p-6`}>
        {activeView === 'base64' && <Base64Tool darkMode={darkMode} copied={copied} copyToClipboard={copyToClipboard} setError={setError} />}
        {activeView === 'curl' && <CurlTool darkMode={darkMode} copied={copied} copyToClipboard={copyToClipboard} setError={setError} />}
        {activeView === 'compare' && <CompareTool darkMode={darkMode} setError={setError} />}
        {activeView === 'json-yaml' && <JsonYamlTool darkMode={darkMode} copied={copied} copyToClipboard={copyToClipboard} setError={setError} />}
        {activeView === 'json-format' && <JsonFormatterTool darkMode={darkMode} copied={copied} copyToClipboard={copyToClipboard} setError={setError} />}
        {activeView === 'yaml-format' && <YamlFormatterTool darkMode={darkMode} copied={copied} copyToClipboard={copyToClipboard} setError={setError} />}
        {activeView === 'sql-format' && <SqlFormatterTool darkMode={darkMode} copied={copied} copyToClipboard={copyToClipboard} setError={setError} />}
        {activeView === 'regex' && <RegexTool darkMode={darkMode} setError={setError} />}
        {activeView === 'jwt' && <JwtTool darkMode={darkMode} copied={copied} copyToClipboard={copyToClipboard} setError={setError} />}
        {activeView === 'csv-json' && <CsvJsonTool darkMode={darkMode} copied={copied} copyToClipboard={copyToClipboard} setError={setError} />}
      </div>
    </div>
  );
}