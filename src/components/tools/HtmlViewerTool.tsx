import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useHistory } from '../../contexts/HistoryContext';

interface HtmlViewerToolProps {
  darkMode: boolean;
  copied: boolean;
  copyToClipboard: (text: string) => void;
  setError: (error: string) => void;
}

const DEFAULT_SPLIT = 50;

export function HtmlViewerTool({ darkMode, copied, copyToClipboard, setError }: HtmlViewerToolProps) {
  const [input, setInput] = useState('');
  const [viewMode, setViewMode] = useState<'preview' | 'formatted' | 'source' | 'minified'>('preview');
  const [isRealtime, setIsRealtime] = useState(true);
  const [iframeUrl, setIframeUrl] = useState('about:blank');
  const [splitPct, setSplitPct] = useState(DEFAULT_SPLIT);
  const [isResizing, setIsResizing] = useState(false);
  const splitRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { addToHistory } = useHistory();

  const formatHtml = (html: string): string => {
    const tab = '  ';
    let result = '';
    let indentLevel = 0;

    const escapes: { placeholder: string; content: string }[] = [];
    let processed = html;

    const escapeTags = ['script', 'style', 'pre', 'textarea'];
    for (const tag of escapeTags) {
      const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'gi');
      processed = processed.replace(regex, (match, content) => {
        const placeholder = `___ESCAPE_${escapes.length}___`;
        escapes.push({ placeholder, content });
        return match.replace(content, placeholder);
      });
    }

    const tokens = processed.match(/<[\w\-]+(?:\s+[^>]*?)?\/?>|<\/[\w\-]+>|[^<]+/g) || [];

    for (let token of tokens) {
      token = token.trim();
      if (!token) continue;

      if (token.match(/^<\/\w/)) {
        indentLevel = Math.max(0, indentLevel - 1);
        if (!result.endsWith('\n')) result += '\n';
        result += tab.repeat(indentLevel) + token;
      } else if (token.match(/^<[\w\-]+.*?\/>$/)) {
        if (!result.endsWith('\n') && result.length > 0) result += '\n';
        result += tab.repeat(indentLevel) + token;
      } else if (token.match(/^<[\w\-]+/)) {
        if (!result.endsWith('\n') && result.length > 0) result += '\n';
        result += tab.repeat(indentLevel) + token;
        const tagName = token.match(/^<([\w\-]+)/)?.[1]?.toLowerCase();
        const voidElements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
        if (tagName && !voidElements.includes(tagName) && !token.endsWith('/>')) {
          indentLevel++;
        }
      } else {
        const text = token.trim();
        if (text) {
          if (!result.endsWith('\n') && result.length > 0) result += '\n';
          result += tab.repeat(indentLevel) + text;
        }
      }
    }

    let final = result;
    for (const esc of escapes) {
      final = final.replace(esc.placeholder, esc.content);
    }
    return final.replace(/\n\s*\n/g, '\n');
  };

  const minifyHtml = (html: string): string => {
    return html
      .replace(/\n\s*/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/>\s+</g, '><')
      .replace(/\s*([{}();,:])\s*/g, '$1')
      .trim();
  };

  const getDisplayOutput = (): string => {
    try {
      switch (viewMode) {
        case 'formatted':
          return formatHtml(input);
        case 'minified':
          return minifyHtml(input);
        case 'source':
          return input;
        default:
          return '';
      }
    } catch (e: any) {
      setError('Format failed: ' + e.message);
      return input;
    }
  };

  const updatePreview = useCallback(() => {
    if (!input.trim()) return;
    const blob = new Blob([input], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setIframeUrl((prev) => {
      URL.revokeObjectURL(prev);
      return url;
    });
  }, [input]);

  const handleManualUpdate = () => {
    setError('');
    if (!input.trim()) {
      setError('HTML input is required');
      return;
    }
    updatePreview();
    addToHistory(input.trim(), `HTML Viewer (${viewMode})`);
  };

  useEffect(() => {
    if (isRealtime && viewMode === 'preview') {
      const timer = setTimeout(() => updatePreview(), 300);
      return () => clearTimeout(timer);
    }
  }, [input, viewMode, isRealtime, updatePreview]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(iframeUrl);
    };
  }, []);

  // Resizing — drag overlay prevents iframe from stealing mouse events
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(20, Math.min(80, (x / rect.width) * 100));
      setSplitPct(pct);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const sampleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sample HTML</title>
  <style>
    body {
      font-family: ui-sans-serif, system-ui, sans-serif;
      max-width: 600px;
      margin: 40px auto;
      padding: 0 20px;
      line-height: 1.6;
      color: #333;
    }
    h1 { color: #2563eb; }
    .card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
      background: #f9fafb;
    }
    .btn {
      background: #2563eb;
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      text-decoration: none;
      display: inline-block;
    }
  </style>
</head>
<body>
  <h1>Hello World</h1>
  <p>This is a sample HTML document rendered in the live preview.</p>
  <div class="card">
    <strong>Card Title</strong>
    <p>Edit the HTML on the left and see it update in real-time.</p>
    <a href="#" class="btn">Click Me</a>
  </div>
  <ul>
    <li>Edit the HTML code</li>
    <li>Switch between preview and source modes</li>
    <li>Use format or minify options</li>
  </ul>
</body>
</html>`;

  const modeButtons = [
    { id: 'preview' as const, label: 'Live Preview' },
    { id: 'formatted' as const, label: 'Formatted' },
    { id: 'source' as const, label: 'Source' },
    { id: 'minified' as const, label: 'Minified' },
  ];

  const isCodeMode = viewMode !== 'preview';
  const leftW = `${splitPct}%`;
  const rightW = `${100 - splitPct}%`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0 12px 12px' }}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center justify-between" style={{ flexShrink: 0, padding: '8px 0', borderBottom: `1px solid ${darkMode ? '#30363d' : '#d0d7de'}`, marginBottom: 8 }}>
        <div className="flex gap-2 flex-wrap items-center">
          {modeButtons.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              className={`git-btn ${viewMode === mode.id ? 'git-btn-primary' : ''}`}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          {viewMode === 'preview' && (
            <button
              onClick={() => setIsRealtime(!isRealtime)}
              className={`git-btn ${isRealtime ? 'text-green-400' : 'text-gray-400'}`}
              title={isRealtime ? 'Realtime updates on' : 'Realtime updates off'}
            >
              {isRealtime ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
              {isRealtime ? 'Realtime' : 'Manual'}
            </button>
          )}
          {isCodeMode && (
            <button
              onClick={() => copyToClipboard(getDisplayOutput())}
              className="git-btn"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
      </div>

      {/* Resizable split layout */}
      <div
        ref={containerRef}
        className="flex"
        style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}
      >
        {/* Drag overlay — captures events over iframe during resize */}
        {isResizing && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 9999,
              cursor: 'col-resize',
            }}
          />
        )}
        {/* Left — Editor */}
        <div className="flex flex-col" style={{ width: leftW, minWidth: 0 }}>
          <div className="flex items-center justify-between" style={{ flexShrink: 0, marginBottom: 8 }}>
            <label className="git-label" style={{ marginBottom: 0 }}>HTML Editor</label>
            <button
              onClick={() => setInput(sampleHtml)}
              className="git-btn git-btn-sm"
              style={{ padding: '4px 10px' }}
            >
              Load Sample
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="git-textarea"
            style={{ flex: 1, minHeight: 0, resize: 'none' }}
            placeholder="Paste or type your HTML here..."
            spellCheck={false}
          />
          {!isRealtime && viewMode === 'preview' && (
            <button onClick={handleManualUpdate} className="git-btn git-btn-primary w-full justify-center mt-2" style={{ flexShrink: 0 }}>
              Update Preview
            </button>
          )}
        </div>

        {/* Splitter */}
        <div
          ref={splitRef}
          onMouseDown={handleResizeStart}
          className="flex items-center justify-center"
          style={{
            width: 12,
            minWidth: 12,
            cursor: 'col-resize',
            flexShrink: 0,
            background: 'transparent',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: 2,
              height: '100%',
              background: isResizing
                ? darkMode ? '#58a6ff' : '#0969da'
                : darkMode ? '#30363d' : '#d0d7de',
              transition: isResizing ? 'none' : 'background 0.15s',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 16,
              height: 24,
              borderRadius: 4,
              background: darkMode ? '#21262d' : '#f6f8fa',
              border: `1px solid ${darkMode ? '#30363d' : '#d0d7de'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'col-resize',
            }}
          >
            <svg width="4" height="10" viewBox="0 0 4 10" fill="none">
              <rect width="1" height="10" fill={darkMode ? '#8b949e' : '#656d76'} />
              <rect x="3" width="1" height="10" fill={darkMode ? '#8b949e' : '#656d76'} />
            </svg>
          </div>
        </div>

        {/* Right — Output */}
        <div className="flex flex-col" style={{ width: rightW, minWidth: 0 }}>
          <div className="flex items-center justify-between" style={{ flexShrink: 0, marginBottom: 8 }}>
            <label className="git-label" style={{ marginBottom: 0 }}>
              {viewMode === 'preview' ? 'Output' : 'Output (read-only)'}
            </label>
          </div>
          {viewMode === 'preview' ? (
            <iframe
              ref={iframeRef}
              src={iframeUrl}
              className={`border rounded-lg ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}
              style={{ flex: 1, minHeight: 0, background: '#ffffff' }}
              sandbox="allow-scripts allow-same-origin"
              title="HTML Preview"
            />
          ) : (
            <div
              className={`border rounded-lg ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
              style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex' }}
            >
              <pre className={`whitespace-pre-wrap font-mono text-sm p-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                style={{ flex: 1, minHeight: 0 }}
              >
                {getDisplayOutput()}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
