import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  buildJsonDiffRows,
  deepRemoveKeys,
  deepSortValue,
  escHtml,
  JsonDiffRow,
} from '../../utils/diffUtils';

interface CompareToolProps {
  darkMode: boolean;
  setError: (error: string) => void;
}

const SAMPLE_LEFT = {"name": "Alice", "age": 30, "hobbies": ["reading", "hiking"], "address": {"city": "NYC", "zip": "10001"}, "added_offers": [{"id": 1, "service_type": "cleaning"}]};

const SAMPLE_RIGHT = {"name": "Alice", "age": 40, "hobbies": ["reading", "biking"], "address": {"city": "SFO", "zip": "10001"}, "added_offers": [{"id": 1, "service_type": "cleaning"}]};

export function CompareTool({ darkMode, setError }: CompareToolProps) {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [diffRows, setDiffRows] = useState<JsonDiffRow[]>([]);
  const [stats, setStats] = useState({ adds: 0, dels: 0, mods: 0 });
  const [hasResult, setHasResult] = useState(false);

  // Options
  const [sortArrays, setSortArrays] = useState(true);
  const [sortKey, setSortKey] = useState('');
  const [collapseEqual, setCollapseEqual] = useState(true);
  const [pairModified, setPairModified] = useState(true);
  const [ignoreRules, setIgnoreRules] = useState<string[]>([]);
  const [ignoreInput, setIgnoreInput] = useState('');
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
    if (!raw1 || !raw2) { showToast('Please paste JSON in both fields'); return; }

    let obj1: any, obj2: any;
    try { obj1 = JSON.parse(raw1); } catch (e: any) { showToast('Payload 1: Invalid JSON — ' + e.message); return; }
    try { obj2 = JSON.parse(raw2); } catch (e: any) { showToast('Payload 2: Invalid JSON — ' + e.message); return; }

    if (ignoreRules.length > 0) {
      obj1 = deepRemoveKeys(obj1, ignoreRules, '');
      obj2 = deepRemoveKeys(obj2, ignoreRules, '');
    }

    if (sortArrays) {
      obj1 = deepSortValue(obj1, sortKey || null);
      obj2 = deepSortValue(obj2, sortKey || null);
    }

    const json1 = JSON.stringify(obj1, null, 2);
    const json2 = JSON.stringify(obj2, null, 2);
    const lines1 = json1.split('\n');
    const lines2 = json2.split('\n');
    const rows = buildJsonDiffRows(lines1, lines2, pairModified);

    let adds = 0, dels = 0, mods = 0;
    rows.forEach(r => { if (r.type === 'add') adds++; else if (r.type === 'del') dels++; else if (r.type === 'mod') mods++; });

    setDiffRows(rows);
    setStats({ adds, dels, mods });
    setHasResult(true);
    setExpandedSections(new Set());
    setError('');
  }, [text1, text2, sortArrays, sortKey, collapseEqual, pairModified, ignoreRules, showToast, setError]);

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
    setText1(JSON.stringify(SAMPLE_LEFT, null, 2));
    setText2(JSON.stringify(SAMPLE_RIGHT, null, 2));
    showToast('Sample payloads loaded');
  };

  const handleIgnoreKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = ignoreInput.trim();
      if (val && !ignoreRules.includes(val)) {
        setIgnoreRules([...ignoreRules, val]);
      }
      setIgnoreInput('');
    }
    if (e.key === 'Backspace' && ignoreInput === '' && ignoreRules.length > 0) {
      setIgnoreRules(ignoreRules.slice(0, -1));
    }
  };

  const removeIgnoreRule = (idx: number) => {
    setIgnoreRules(ignoreRules.filter((_, i) => i !== idx));
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
          JSON Payload Diff
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
          <input type="checkbox" checked={sortArrays} onChange={e => setSortArrays(e.target.checked)} className="accent-blue-500" />
          Sort arrays before comparing
        </label>
        <label className={`flex items-center gap-1.5 ${textDim}`}>
          Sort key:
          <input
            type="text"
            value={sortKey}
            onChange={e => setSortKey(e.target.value)}
            placeholder="e.g. age"
            className={`jd-text-input ${darkMode ? 'jd-text-input-dark' : 'jd-text-input-light'}`}
          />
        </label>
        <label className={`flex items-center gap-1.5 cursor-pointer ${textDim}`}>
          <input type="checkbox" checked={pairModified} onChange={e => setPairModified(e.target.checked)} className="accent-blue-500" />
          Pair modified lines
        </label>
        <label className={`flex items-center gap-1.5 cursor-pointer ${textDim}`}>
          <input type="checkbox" checked={collapseEqual} onChange={e => setCollapseEqual(e.target.checked)} className="accent-blue-500" />
          Collapse unchanged sections
        </label>
      </div>

      {/* Ignore Keys Bar */}
      <div className={`flex items-start gap-2 px-4 py-2.5 ${surface} ${border} border-b text-sm`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`mt-1 flex-shrink-0 ${textDim}`}>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
        <div className="flex-1">
          <div className={`flex items-center gap-1.5 ${textDim} mb-1`}>
            <span>Ignore keys:</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {ignoreRules.map((rule, idx) => {
              const dot = rule.lastIndexOf('.');
              const isScoped = dot !== -1;
              const scope = isScoped ? rule.substring(0, dot) : null;
              const key = isScoped ? rule.substring(dot + 1) : rule;
              return (
                <span
                  key={idx}
                  className={`jd-tag-chip ${isScoped ? 'jd-tag-scoped' : 'jd-tag-global'} ${darkMode ? '' : 'jd-tag-light'}`}
                >
                  {isScoped && <span className="jd-tag-scope">{scope}.</span>}
                  {key}
                  <span className="jd-tag-remove" onClick={() => removeIgnoreRule(idx)}>&times;</span>
                </span>
              );
            })}
            <input
              type="text"
              value={ignoreInput}
              onChange={e => setIgnoreInput(e.target.value)}
              onKeyDown={handleIgnoreKeyDown}
              placeholder="parent.key or key + Enter"
              className={`jd-text-input ${darkMode ? 'jd-text-input-dark' : 'jd-text-input-light'}`}
            />
          </div>
          <span className={`text-[0.7rem] ${darkMode ? 'text-[#484f58]' : 'text-gray-400'} mt-1 block`}>
            scope with dot path: <code className={`font-mono text-[0.68rem] px-1 rounded ${darkMode ? 'bg-[#1e293b] text-[#8b949e]' : 'bg-gray-200 text-gray-600'}`}>address.city</code> &middot; bare key = global: <code className={`font-mono text-[0.68rem] px-1 rounded ${darkMode ? 'bg-[#1e293b] text-[#8b949e]' : 'bg-gray-200 text-gray-600'}`}>age</code>
          </span>
        </div>
      </div>

      {/* Input Textareas */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${border} border-b flex-1`}>
        <div className={`flex flex-col ${border} md:border-r`}>
          <div className={`flex items-center gap-2 px-4 py-2.5 ${headerBg} ${border} border-b font-mono text-xs font-semibold uppercase tracking-wider ${textDim}`}>
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Payload 1 (left / old)
          </div>
          <textarea
            value={text1}
            onChange={e => setText1(e.target.value)}
            placeholder="Paste JSON payload 1 here..."
            className={`jd-textarea ${darkMode ? 'jd-textarea-dark' : 'jd-textarea-light'} flex-1`}
          />
        </div>
        <div className="flex flex-col">
          <div className={`flex items-center gap-2 px-4 py-2.5 ${headerBg} ${border} border-b font-mono text-xs font-semibold uppercase tracking-wider ${textDim}`}>
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Payload 2 (right / new)
          </div>
          <textarea
            value={text2}
            onChange={e => setText2(e.target.value)}
            placeholder="Paste JSON payload 2 here..."
            className={`jd-textarea ${darkMode ? 'jd-textarea-dark' : 'jd-textarea-light'} flex-1`}
          />
        </div>
      </div>

      {/* Diff Output */}
      <div>
        {hasResult ? (
          <>
            <div className={`flex items-center justify-between px-4 py-2.5 ${headerBg} ${border} border-b font-mono text-xs sticky top-0 z-10 ${textDim}`}>
              <span>payload1.json &harr; payload2.json</span>
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
