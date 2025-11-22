import { diffLines, diffWords } from 'diff';
import { DiffRow } from '../types';

export function buildSideBySide(oldText: string, newText: string): DiffRow[] {
  const parts = diffLines(oldText, newText);
  const rows: DiffRow[] = [];
  let leftQueue: Array<{ text: string }> = [];
  let rightQueue: Array<{ text: string }> = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const lines = part.value.split('\n');
    if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

    if (part.added) {
      lines.forEach((ln) => rightQueue.push({ text: ln }));
    } else if (part.removed) {
      lines.forEach((ln) => leftQueue.push({ text: ln }));
    } else {
      const maxQ = Math.max(leftQueue.length, rightQueue.length);
      for (let k = 0; k < maxQ; k++) {
        const l = leftQueue[k] ? leftQueue[k].text : '';
        const r = rightQueue[k] ? rightQueue[k].text : '';
        rows.push(makeRow(l, r));
      }
      leftQueue = [];
      rightQueue = [];
      lines.forEach((ln) => rows.push(makeRow(ln, ln, 'equal')));
    }
  }

  const maxQ = Math.max(leftQueue.length, rightQueue.length);
  for (let k = 0; k < maxQ; k++) {
    const l = leftQueue[k] ? leftQueue[k].text : '';
    const r = rightQueue[k] ? rightQueue[k].text : '';
    rows.push(makeRow(l, r));
  }

  return rows;
}

function makeRow(left: string, right: string, forcedType: 'equal' | null = null): DiffRow {
  if (forcedType === 'equal' || left === right) {
    return { type: 'equal', left, right, leftTokens: null, rightTokens: null };
  }
  if (left && !right) {
    return { type: 'delete', left, right: '', leftTokens: null, rightTokens: null };
  }
  if (!left && right) {
    return { type: 'add', left: '', right, leftTokens: null, rightTokens: null };
  }
  
  const wordDiff = diffWords(left, right);
  const leftTokens: Array<{ text: string; removed?: boolean }> = [];
  const rightTokens: Array<{ text: string; added?: boolean }> = [];
  
  wordDiff.forEach((p) => {
    if (p.added) rightTokens.push({ text: p.value, added: true });
    else if (p.removed) leftTokens.push({ text: p.value, removed: true });
    else {
      leftTokens.push({ text: p.value });
      rightTokens.push({ text: p.value });
    }
  });
  
  return { type: 'modify', left, right, leftTokens, rightTokens };
}