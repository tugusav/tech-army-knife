import { DiffRow } from '../types';

// ──── LCS-based line diff ────
function lcsLines(a: string[], b: string[]): Array<{ type: 'equal' | 'del' | 'add'; left?: number; right?: number }> {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);

  const result: Array<{ type: 'equal' | 'del' | 'add'; left?: number; right?: number }> = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) { result.push({ type: 'equal', left: i - 1, right: j - 1 }); i--; j--; }
    else if (dp[i - 1][j] >= dp[i][j - 1]) { result.push({ type: 'del', left: i - 1 }); i--; }
    else { result.push({ type: 'add', right: j - 1 }); j--; }
  }
  while (i > 0) { result.push({ type: 'del', left: i - 1 }); i--; }
  while (j > 0) { result.push({ type: 'add', right: j - 1 }); j--; }
  return result.reverse();
}

// ──── Character-level inline diff (common-prefix / common-suffix) ────
// More intuitive than LCS: "GIN_MODE=debug" → "GIN_MODE=debugging"
// highlights only "ging" on the right, not an arbitrary trailing "g".
function inlineCharDiff(oldStr: string, newStr: string): { leftHtml: string; rightHtml: string } {
  const minLen = Math.min(oldStr.length, newStr.length);

  // Find common prefix
  let pre = 0;
  while (pre < minLen && oldStr[pre] === newStr[pre]) pre++;

  // Find common suffix (from the remaining parts)
  let suf = 0;
  const oldRest = oldStr.length - pre;
  const newRest = newStr.length - pre;
  while (suf < Math.min(oldRest, newRest) &&
         oldStr[oldStr.length - 1 - suf] === newStr[newStr.length - 1 - suf]) suf++;

  const oldMid = oldStr.slice(pre, oldStr.length - suf);
  const newMid = newStr.slice(pre, newStr.length - suf);

  const prefix = escHtml(oldStr.slice(0, pre));
  const suffix = escHtml(oldStr.slice(oldStr.length - suf));

  const leftHtml = prefix
    + (oldMid ? `<span class="hl-del">${escHtml(oldMid)}</span>` : '')
    + suffix;
  const rightHtml = prefix
    + (newMid ? `<span class="hl-add">${escHtml(newMid)}</span>` : '')
    + suffix;

  return { leftHtml, rightHtml };
}

// ──── Word-level inline diff (falls back to char-level for single-token changes) ────
export function inlineDiff(oldStr: string, newStr: string): { leftHtml: string; rightHtml: string } {
  const oldWords = oldStr.split(/(\s+)/);
  const newWords = newStr.split(/(\s+)/);
  const m = oldWords.length, n = newWords.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = oldWords[i - 1] === newWords[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);

  const ops: Array<{ t: 'eq' | 'del' | 'add'; oi?: number; ni?: number }> = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (oldWords[i - 1] === newWords[j - 1]) { ops.push({ t: 'eq', oi: i - 1, ni: j - 1 }); i--; j--; }
    else if (dp[i - 1][j] >= dp[i][j - 1]) { ops.push({ t: 'del', oi: i - 1 }); i--; }
    else { ops.push({ t: 'add', ni: j - 1 }); j--; }
  }
  while (i > 0) { ops.push({ t: 'del', oi: i - 1 }); i--; }
  while (j > 0) { ops.push({ t: 'add', ni: j - 1 }); j--; }
  ops.reverse();

  // If the word-level diff would highlight everything on both sides
  // (no eq ops), fall back to character-level diff for precision.
  const hasEq = ops.some(op => op.t === 'eq');
  if (!hasEq) {
    // Token-level diff found zero shared words — fall back to char-level so
    // that "GIN_MODE=debug" → "GIN_MODE=debugging" highlights only "ging".
    return inlineCharDiff(oldStr, newStr);
  }

  let leftHtml = '', rightHtml = '';
  for (const op of ops) {
    if (op.t === 'eq') {
      const esc = escHtml(oldWords[op.oi!]);
      leftHtml += esc;
      rightHtml += esc;
    } else if (op.t === 'del') {
      leftHtml += `<span class="hl-del">${escHtml(oldWords[op.oi!])}</span>`;
    } else {
      rightHtml += `<span class="hl-add">${escHtml(newWords[op.ni!])}</span>`;
    }
  }
  return { leftHtml, rightHtml };
}

export function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ──── Build side-by-side diff rows ────
export interface JsonDiffRow {
  type: 'equal' | 'add' | 'del' | 'mod';
  left?: string;
  right?: string;
  ln1?: number;
  ln2?: number;
  leftHtml?: string;
  rightHtml?: string;
}

export function buildJsonDiffRows(linesA: string[], linesB: string[], pairModified = true): JsonDiffRow[] {
  const ops = lcsLines(linesA, linesB);
  const rows: JsonDiffRow[] = [];

  let i = 0;
  while (i < ops.length) {
    if (ops[i].type === 'equal') {
      rows.push({
        type: 'equal',
        left: linesA[ops[i].left!],
        right: linesB[ops[i].right!],
        ln1: ops[i].left! + 1,
        ln2: ops[i].right! + 1,
      });
      i++;
    } else {
      const dels: number[] = [], adds: number[] = [];
      while (i < ops.length && ops[i].type !== 'equal') {
        if (ops[i].type === 'del') dels.push(ops[i].left!);
        else adds.push(ops[i].right!);
        i++;
      }

      if (pairModified) {
        // Pair consecutive dels & adds as modified (with inline highlighting)
        const pairs = Math.min(dels.length, adds.length);
        for (let p = 0; p < pairs; p++) {
          const { leftHtml, rightHtml } = inlineDiff(linesA[dels[p]], linesB[adds[p]]);
          rows.push({
            type: 'mod',
            left: linesA[dels[p]],
            right: linesB[adds[p]],
            ln1: dels[p] + 1,
            ln2: adds[p] + 1,
            leftHtml,
            rightHtml,
          });
        }
        for (let p = pairs; p < dels.length; p++) {
          rows.push({ type: 'del', left: linesA[dels[p]], ln1: dels[p] + 1 });
        }
        for (let p = pairs; p < adds.length; p++) {
          rows.push({ type: 'add', right: linesB[adds[p]], ln2: adds[p] + 1 });
        }
      } else {
        // Show all as pure del / add — no modified pairing
        for (const idx of dels) {
          rows.push({ type: 'del', left: linesA[idx], ln1: idx + 1 });
        }
        for (const idx of adds) {
          rows.push({ type: 'add', right: linesB[idx], ln2: idx + 1 });
        }
      }
    }
  }
  return rows;
}

// ──── JSON preprocessing utilities ────
export interface IgnoreRule {
  scope: string | null;
  key: string;
}

export function parseIgnoreRule(rule: string): IgnoreRule {
  const dot = rule.lastIndexOf('.');
  if (dot === -1) return { scope: null, key: rule };
  return { scope: rule.substring(0, dot), key: rule.substring(dot + 1) };
}

export function deepRemoveKeys(val: any, rules: string[], currentPath: string): any {
  if (val === null || typeof val !== 'object') return val;

  if (Array.isArray(val)) {
    return val.map(v => deepRemoveKeys(v, rules, currentPath + '.[]'));
  }

  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(val)) {
    const childPath = currentPath ? currentPath + '.' + k : k;
    let shouldIgnore = false;
    for (const rule of rules) {
      const { scope, key } = parseIgnoreRule(rule);
      if (key !== k) continue;
      if (scope === null) { shouldIgnore = true; break; }
      const normalizedCurrent = currentPath.replace(/\.\[\]/g, '');
      if (normalizedCurrent === scope || currentPath === scope ||
          normalizedCurrent.endsWith('.' + scope) || currentPath.endsWith('.' + scope)) {
        shouldIgnore = true; break;
      }
      const scopeParts = scope.split('.');
      const pathSegments = currentPath.replace(/\.\[\]/g, '').split('.').filter(Boolean);
      if (scopeParts.length === 1) {
        if (pathSegments.includes(scopeParts[0])) { shouldIgnore = true; break; }
      } else {
        const scopeStr = scopeParts.join('.');
        const pathStr = pathSegments.join('.');
        if (pathStr === scopeStr || pathStr.endsWith('.' + scopeStr)) { shouldIgnore = true; break; }
      }
    }
    if (shouldIgnore) continue;
    out[k] = deepRemoveKeys(v, rules, childPath);
  }
  return out;
}

export function deepSortValue(val: any, sortKey: string | null): any {
  if (val === null || typeof val !== 'object') return val;
  if (Array.isArray(val)) {
    const sorted = val.map(v => deepSortValue(v, sortKey));
    sorted.sort((a, b) => {
      if (sortKey && typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
        const ka = String(a[sortKey] || '');
        const kb = String(b[sortKey] || '');
        if (ka !== kb) return ka.localeCompare(kb);
      }
      return JSON.stringify(a).localeCompare(JSON.stringify(b));
    });
    return sorted;
  }
  const sortedObj: Record<string, any> = {};
  for (const k of Object.keys(val).sort()) {
    sortedObj[k] = deepSortValue(val[k], sortKey);
  }
  return sortedObj;
}

// Legacy export for backward compat
export function buildSideBySide(oldText: string, newText: string): DiffRow[] {
  const linesA = oldText.split('\n');
  const linesB = newText.split('\n');
  const jsonRows = buildJsonDiffRows(linesA, linesB);
  return jsonRows.map(r => ({
    type: r.type === 'del' ? 'delete' as const : r.type === 'mod' ? 'modify' as const : r.type as 'equal' | 'add',
    left: r.left || '',
    right: r.right || '',
    leftTokens: null,
    rightTokens: null,
  }));
}
