import React, { useState } from 'react';
import { TreeView } from '../common/TreeView';
import { useHistory } from '../../contexts/HistoryContext';

interface XmlViewerToolProps {
  darkMode: boolean;
  copied: boolean;
  copyToClipboard: (text: string) => void;
  setError: (error: string) => void;
}

export function XmlViewerTool({ darkMode, copied, copyToClipboard, setError }: XmlViewerToolProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'formatted' | 'minified'>('formatted');
  const [parsedData, setParsedData] = useState<any>(null);
  const { addToHistory } = useHistory();

  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  // Simple XML parser (converts XML to JSON-like structure)
  const parseXml = (xmlStr: string): any => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlStr, 'text/xml');
      
      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error('Invalid XML structure');
      }
      
      const convertNodeToObject = (node: Node): any => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent?.trim();
          return text || null;
        }
        
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          const result: any = {};
          
          // Add attributes
          if (element.attributes.length > 0) {
            result['@attributes'] = {};
            for (let i = 0; i < element.attributes.length; i++) {
              const attr = element.attributes[i];
              result['@attributes'][attr.name] = attr.value;
            }
          }
          
          // Process child nodes
          const children: any[] = [];
          const textContent: string[] = [];
          
          for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i];
            
            if (child.nodeType === Node.TEXT_NODE) {
              const text = child.textContent?.trim();
              if (text) textContent.push(text);
            } else if (child.nodeType === Node.ELEMENT_NODE) {
              const childElement = child as Element;
              const childObj = convertNodeToObject(child);
              
              if (result[childElement.tagName]) {
                // Convert to array if multiple elements with same name
                if (!Array.isArray(result[childElement.tagName])) {
                  result[childElement.tagName] = [result[childElement.tagName]];
                }
                result[childElement.tagName].push(childObj);
              } else {
                result[childElement.tagName] = childObj;
              }
            }
          }
          
          // If only text content, return the text
          if (textContent.length > 0 && Object.keys(result).length === 0) {
            return textContent.join(' ');
          }
          
          // If only text content and attributes, add text as @text
          if (textContent.length > 0) {
            result['@text'] = textContent.join(' ');
          }
          
          return Object.keys(result).length > 0 ? result : null;
        }
        
        return null;
      };
      
      const rootElement = xmlDoc.documentElement;
      if (!rootElement) {
        throw new Error('No root element found');
      }
      
      return {
        [rootElement.tagName]: convertNodeToObject(rootElement)
      };
    } catch (error) {
      throw new Error(`Failed to parse XML: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Format XML with proper indentation
  const formatXml = (xmlStr: string): string => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlStr, 'text/xml');
      
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error('Invalid XML structure');
      }
      
      const serializer = new XMLSerializer();
      let formatted = serializer.serializeToString(xmlDoc);
      
      // Add proper indentation
      const tab = '  ';
      let result = '';
      let indent = 0;
      
      formatted.split(/>\s*</).forEach((node, index) => {
        if (index > 0) result += '><';
        
        if (node.match(/^\/\w/)) {
          // Closing tag
          indent--;
        }
        
        result += (index > 0 ? '\n' : '') + tab.repeat(indent) + '<' + node + '>';
        
        if (node.match(/^<?\w[^>]*[^\/]$/)) {
          // Opening tag
          indent++;
        }
      });
      
      return result.substring(1, result.length - 1);
    } catch (error) {
      throw new Error('Failed to format XML');
    }
  };

  // Minify XML
  const minifyXml = (xmlStr: string): string => {
    return xmlStr.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
  };

  const processXml = () => {
    setError('');
    if (!input.trim()) {
      setError('XML input is required');
      return;
    }

    try {
      const parsed = parseXml(input);
      setParsedData(parsed);
      let result = '';

      switch (viewMode) {
        case 'formatted':
          result = formatXml(input);
          break;
        case 'minified':
          result = minifyXml(input);
          break;
        case 'tree':
          result = 'Tree view displayed below';
          break;
      }

      setOutput(result);
      addToHistory(result, `XML Viewer (${viewMode})`);
    } catch (error) {
      setError(`Invalid XML: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setParsedData(null);
    }
  };

  const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<bookstore>
  <book id="1" category="fiction">
    <title lang="en">The Great Gatsby</title>
    <author>F. Scott Fitzgerald</author>
    <year>1925</year>
    <price currency="USD">12.99</price>
    <description>A classic American novel set in the Jazz Age.</description>
  </book>
  <book id="2" category="science">
    <title lang="en">A Brief History of Time</title>
    <author>Stephen Hawking</author>
    <year>1988</year>
    <price currency="USD">15.99</price>
    <description>A landmark volume in science writing.</description>
  </book>
  <metadata>
    <created>2024-01-26</created>
    <version>1.0</version>
    <tags>
      <tag>books</tag>
      <tag>catalog</tag>
      <tag>literature</tag>
    </tags>
  </metadata>
</bookstore>`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Left Column - Input */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            XML Input
          </h3>
          <button
            onClick={() => setInput(sampleXml)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              darkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-gray-100'
            }`}
          >
            Load Sample
          </button>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className={`w-full h-80 border rounded-lg p-3 font-mono text-sm resize-none ${inputClass}`}
          placeholder="Paste your XML here..."
        />

        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'formatted', label: 'Formatted' },
            { id: 'minified', label: 'Minified' },
            { id: 'tree', label: 'Tree View' }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id as any)}
              className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${
                viewMode === mode.id
                  ? 'bg-blue-600 text-white'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <button
          onClick={processXml}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
        >
          View XML
        </button>
      </div>

      {/* Right Column - Output */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Output ({viewMode})
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

        <div className={`w-full h-80 border rounded-lg overflow-auto ${
          darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'
        }`}>
          {viewMode === 'tree' && parsedData ? (
            <div className="p-3">
              <TreeView data={parsedData} darkMode={darkMode} />
            </div>
          ) : output ? (
            <pre className={`p-3 whitespace-pre-wrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {output}
            </pre>
          ) : (
            <div className={`text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-32`}>
              Processed XML will appear here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}