import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Tool } from '../../types';
import { Base64Tool } from '../tools/Base64Tool';
import { UrlEncoderTool } from '../tools/UrlEncoderTool';
import { CurlTool } from '../tools/CurlTool';
import { CompareTool } from '../tools/CompareTool';
import { JsonYamlTool } from '../tools/JsonYamlTool';
import { JsonViewerTool } from '../tools/JsonViewerTool';
import { YamlViewerTool } from '../tools/YamlViewerTool';
import { XmlViewerTool } from '../tools/XmlViewerTool';
import { SqlFormatterTool } from '../tools/SqlFormatterTool';
import { RegexTool } from '../tools/RegexTool';
import { JwtTool } from '../tools/JwtTool';
import { CsvJsonTool } from '../tools/CsvJsonTool';
import { JsonXmlTool } from '../tools/JsonXmlTool';
import { UuidGeneratorTool } from '../tools/UuidGeneratorTool';
import { TimestampTool } from '../tools/TimestampTool';
import { CronTool } from '../tools/CronTool';
import { HashGeneratorTool } from '../tools/HashGeneratorTool';
import { K6LoadTestTool } from '../tools/K6LoadTestTool';

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
        {activeView === 'url-encoder' && <UrlEncoderTool darkMode={darkMode} copied={copied} copyToClipboard={copyToClipboard} setError={setError} />}
        {activeView === 'curl' && <CurlTool darkMode={darkMode} copied={copied} copyToClipboard={copyToClipboard} setError={setError} />}
        {activeView === 'compare' && <CompareTool darkMode={darkMode} setError={setError} />}
        {activeView === 'json-yaml' && <JsonYamlTool darkMode={darkMode} copied={copied} copyToClipboard={copyToClipboard} setError={setError} />}
        {activeView === 'json-viewer' && <JsonViewerTool darkMode={darkMode} copied={copied} copyToClipboard={copyToClipboard} setError={setError} />}
        {activeView === 'yaml-viewer' && <YamlViewerTool darkMode={darkMode} copied={copied} copyToClipboard={copyToClipboard} setError={setError} />}
        {activeView === 'xml-viewer' && <XmlViewerTool darkMode={darkMode} copied={copied} copyToClipboard={copyToClipboard} setError={setError} />}
        {activeView === 'sql-format' && <SqlFormatterTool darkMode={darkMode} copied={copied} copyToClipboard={copyToClipboard} setError={setError} />}
        {activeView === 'regex' && <RegexTool darkMode={darkMode} setError={setError} />}
        {activeView === 'jwt' && <JwtTool darkMode={darkMode} copied={copied} copyToClipboard={copyToClipboard} setError={setError} />}
        {activeView === 'csv-json' && <CsvJsonTool darkMode={darkMode} copied={copied} copyToClipboard={copyToClipboard} setError={setError} />}
        {activeView === 'json-xml' && <JsonXmlTool darkMode={darkMode} copied={copied} copyToClipboard={copyToClipboard} setError={setError} />}
        {activeView === 'uuid-generator' && <UuidGeneratorTool darkMode={darkMode} copied={copied} copyToClipboard={copyToClipboard} setError={setError} />}
        {activeView === 'timestamp' && <TimestampTool darkMode={darkMode} copied={copied} copyToClipboard={copyToClipboard} setError={setError} />}
        {activeView === 'cron' && <CronTool darkMode={darkMode} copied={copied} copyToClipboard={copyToClipboard} setError={setError} />}
        {activeView === 'hash-generator' && <HashGeneratorTool darkMode={darkMode} copied={copied} copyToClipboard={copyToClipboard} setError={setError} />}
        {activeView === 'k6-load-test' && <K6LoadTestTool darkMode={darkMode} copied={copied} copyToClipboard={copyToClipboard} setError={setError} />}
      </div>
    </div>
  );
}