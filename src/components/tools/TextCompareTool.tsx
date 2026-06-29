import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  buildJsonDiffRows,
  escHtml,
  JsonDiffRow,
} from '../../utils/diffUtils';

interface TextCompareToolProps {
  darkMode: boolean;
  setError: (error: string) => void;
}

const SAMPLE_LEFT = `Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
Ut enim ad minim veniam, quis nostrud exercitation ullamco.
Duis aute irure dolor in reprehenderit in voluptate velit.
Excepteur sint occaecat cupidatat non proident.
This line is unique to the left side.
Another common line here.
Final shared line of the text.`;

const SAMPLE_RIGHT = `Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.
Excepteur sint occaecat cupidatat non proident, sunt in culpa.
Another common line here.
This line is unique to the right side.
Final shared line of the text.`;

export function TextCompareTool({ darkMode, setError }: TextCompareToolProps) {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [diffRows, setDiffRows] = useState<JsonDiffRow[]>([]);
  const [stats, setStats] = useState({ adds: 0, dels: 0, mods: 0 });
  const [hasResult, setHasResult] = useState(false);

  // Options
  const [collapseEqual, setCollapseEqual] = useState(true);
  const [ignoreOrder, setIgnoreOrder] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  // Toast
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2500);
  }, []);

  const doCompare = useCallback(() => {
    const raw1 = text1.trim();
    const raw2 = text2.trim();
    if (!raw1 || !raw2) { showToast('Please paste text in both fields'); return; }

    let lines1 = raw1.split('\n');
    let lines2 = raw2.split('\n');

    if (ignoreOrder) {
      lines1 = lines1.sort((a, b) => a.localeCompare(b));
      lines2 = lines2.sort((a, b) => a.localeCompare(b));
    }

    const rows = buildJsonDiffRows(lines1, lines2);

    let adds = 0, dels = 0, mods = 0;
    rows.forEach(r => { if (r.type === 'add') adds++; else if (r.type === 'del') dels++; else if (r.type === 'mod') mods++; });

    setDiffRows(rows);
    setStats({ adds, dels, mods });
    setHasResult(true);
    setExpandedSections(new Set());
    setError('');
  }, [text1, text2, ignoreOrder, showToast, setError]);

  const handleClear = () => {
    setText1('');
    setText2('');
    setDiffRows([]);
    setHasResult(false);
    setStats({ adds: 0, dels: 0, mods: 0 });
    setExpandedSections(new Set());
    showToast('Cleared');
  };

  const handleSample = () => {
    setText1(SAMPLE_LEFT);
    setText2(SAMPLE_RIGHT);
    showToast('Sample texts loaded');
  };

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') doCompare();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [doCompare]);

  // ──── Render diff table rows ────
  const renderRows = () => {
    if (!hasResult) return null;

    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < diffRows.length) {
      const r = diffRows[i];
      if (r.type === 'equal' && collapseEqual) {
        const eqStart = i;
        while (i < diffRows.length && diffRows[i].type === 'equal') i++;
        const eqCount = i - eqStart;
        if (eqCount > 6) {
          for (let e = eqStart; e < eqStart + 3; e++) elements.push(renderEqualRow(diffRows[e], e));
          if (!expandedSections.has(eqStart)) {
            const hidden = eqCount - 6;
            elements.push(
              <tr
                key={`collapse-${eqStart}`}
                className="jd-collapse-row"
                onClick={() => setExpandedSections(prev => new Set([...prev, eqStart]))}
              >
                <td colSpan={7}>
                  {hidden} unchanged lines hidden — click to expand
                </td>
              </tr>
            );
          } else {
            for (let e = eqStart + 3; e < i - 3; e++) elements.push(renderEqualRow(diffRows[e], e));
          }
          for (let e = i - 3; e < i; e++) elements.push(renderEqualRow(diffRows[e], e));
        } else {
          for (let e = eqStart; e < i; e++) elements.push(renderEqualRow(diffRows[e], e));
        }
      } else {
        elements.push(renderDiffRow(r, i));
        i++;
      }
    }
    return elements;
  };

  const renderEqualRow = (r: JsonDiffRow, idx: number) => (
    <tr key={idx} className="jd-row-equal">
      <td className="jd-ln">{r.ln1}</td>
      <td className="jd-gutter"></td>
      <td className="jd-content">{r.left}</td>
      <td className="jd-sep"></td>
      <td className="jd-ln">{r.ln2}</td>
      <td className="jd-gutter"></td>
      <td className="jd-content">{r.left}</td>
    </tr>
  );

  const renderDiffRow = (r: JsonDiffRow, idx: number) => {
    if (r.type === 'del') {
      return (
        <tr key={idx} className="jd-row-del">
          <td className="jd-ln">{r.ln1}</td>
          <td className="jd-gutter">−</td>
          <td className="jd-content">{r.left}</td>
          <td className="jd-sep"></td>
          <td className="jd-ln"></td>
          <td className="jd-gutter"></td>
          <td className="jd-content"></td>
        </tr>
      );
    }
    if (r.type === 'add') {
      return (
        <tr key={idx} className="jd-row-add">
          <td className="jd-ln"></td>
          <td className="jd-gutter"></td>
          <td className="jd-content"></td>
          <td className="jd-sep"></td>
          <td className="jd-ln">{r.ln2}</td>
          <td className="jd-gutter">+</td>
          <td className="jd-content">{r.right}</td>
        </tr>
      );
    }
    if (r.type === 'mod') {
      return (
        <tr key={idx} className="jd-row-mod">
          <td className="jd-ln">{r.ln1}</td>
          <td className="jd-gutter">−</td>
          <td className="jd-content" dangerouslySetInnerHTML={{ __html: r.leftHtml || escHtml(r.left || '') }} />
          <td className="jd-sep"></td>
          <td className="jd-ln">{r.ln2}</td>
          <td className="jd-gutter">+</td>
          <td className="jd-content" dangerouslySetInnerHTML={{ __html: r.rightHtml || escHtml(r.right || '') }} />
        </tr>
      );
    }
    return null;
  };

  // Color classes
  const surface = darkMode ? 'bg-[#161b22]' : 'bg-gray-50';
  const border = darkMode ? 'border-[#30363d]' : 'border-gray-200';
  const textDim = darkMode ? 'text-[#8b949e]' : 'text-gray-500';
  const headerBg = darkMode ? 'bg-[#1c2128]' : 'bg-gray-100';

  return (
    <div className="jd-wrapper flex flex-col" style={{ minHeight: 'calc(100vh - 240px)' }}>
      {/* Action Buttons */}
      <div className={`flex items-center justify-between gap-3 p-3 ${surface} ${border} border-b rounded-t-lg`}>
        <span className={`font-mono text-xs font-semibold uppercase tracking-wider ${textDim}`}>
          Text Diff
        </span>
        <div className="flex gap-2">
          <button onClick={handleSample} className={`jd-btn ${darkMode ? 'jd-btn-dark' : 'jd-btn-light'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Sample
          </button>
          <button onClick={handleClear} className={`jd-btn jd-btn-danger ${darkMode ? 'jd-btn-dark' : 'jd-btn-light'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Clear
          </button>
          <button onClick={doCompare} className="jd-btn jd-btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            Compare
          </button>
        </div>
      </div>

      {/* Options Bar */}
      <div className={`flex flex-wrap items-center gap-4 px-4 py-2.5 ${surface} ${border} border-b text-sm`}>
        <label className={`flex items-center gap-1.5 cursor-pointer ${textDim}`}>
          <input type="checkbox" checked={ignoreOrder} onChange={e => setIgnoreOrder(e.target.checked)} className="accent-blue-500" />
          Ignore line order
        </label>
        <label className={`flex items-center gap-1.5 cursor-pointer ${textDim}`}>
          <input type="checkbox" checked={collapseEqual} onChange={e => setCollapseEqual(e.target.checked)} className="accent-blue-500" />
          Collapse unchanged sections
        </label>
      </div>

      {/* Input Textareas */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${border} border-b flex-1`}>
        <div className={`flex flex-col ${border} md:border-r`}>
          <div className={`flex items-center gap-2 px-4 py-2.5 ${headerBg} ${border} border-b font-mono text-xs font-semibold uppercase tracking-wider ${textDim}`}>
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Text 1 (left / old)
          </div>
          <textarea
            value={text1}
            onChange={e => setText1(e.target.value)}
            placeholder="Paste text 1 here..."
            className={`jd-textarea ${darkMode ? 'jd-textarea-dark' : 'jd-textarea-light'} flex-1`}
          />
        </div>
        <div className="flex flex-col">
          <div className={`flex items-center gap-2 px-4 py-2.5 ${headerBg} ${border} border-b font-mono text-xs font-semibold uppercase tracking-wider ${textDim}`}>
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Text 2 (right / new)
          </div>
          <textarea
            value={text2}
            onChange={e => setText2(e.target.value)}
            placeholder="Paste text 2 here..."
            className={`jd-textarea ${darkMode ? 'jd-textarea-dark' : 'jd-textarea-light'} flex-1`}
          />
        </div>
      </div>

      {/* Diff Output */}
      <div>
        {hasResult ? (
          <>
            <div className={`flex items-center justify-between px-4 py-2.5 ${headerBg} ${border} border-b font-mono text-xs sticky top-0 z-10 ${textDim}`}>
              <span>text1 &harr; text2</span>
              <div className="flex gap-3 font-semibold text-xs">
                <span className="text-green-500">+{stats.adds} added</span>
                <span className="text-red-500">&minus;{stats.dels} removed</span>
                <span className="text-yellow-500">~{stats.mods} modified</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className={`jd-diff-table ${darkMode ? 'jd-diff-dark' : 'jd-diff-light'}`}>
                <tbody>
                  {renderRows()}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </div>

      {/* Toast */}
      <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg text-sm shadow-lg transition-all duration-300 ${
        darkMode ? 'bg-[#161b22] border border-[#30363d] text-[#c9d1d9]' : 'bg-white border border-gray-200 text-gray-800 shadow-md'
      } ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
        {toast}
      </div>
    </div>
  );
}
