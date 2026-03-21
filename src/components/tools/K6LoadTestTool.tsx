import { useState } from 'react';
import { useHistory } from '../../contexts/HistoryContext';

interface K6LoadTestToolProps {
  darkMode: boolean;
  copied: boolean;
  copyToClipboard: (text: string) => void;
  setError: (error: string) => void;
}

interface DynamicParam {
  id: string;
  name: string;
  prefix: string;
  startFrom: number;
  digits: number;
}

interface ParsedRequest {
  url: string;
  method: string;
  headers: { key: string; value: string }[];
  body: string;
}

export function K6LoadTestTool({ darkMode, copied, copyToClipboard, setError }: K6LoadTestToolProps) {
  const [curlInput, setCurlInput] = useState('');
  const [vus, setVus] = useState(10);
  const [targetTps, setTargetTps] = useState(100);
  const [rampUpTime, setRampUpTime] = useState(30);
  const [sustainTime, setSustainTime] = useState(60);
  const [dynamicParams, setDynamicParams] = useState<DynamicParam[]>([]);
  const [output, setOutput] = useState('');
  const { addToHistory } = useHistory();

  const inputClass = darkMode
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';

  const labelClass = `block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`;

  // ── Curl parser ──────────────────────────────────────────────────────────────

  const tokenize = (cmd: string): string[] => {
    const tokens: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    for (let i = 0; i < cmd.length; i++) {
      const c = cmd[i];
      if (inQuotes) {
        if (c === quoteChar && cmd[i - 1] !== '\\') inQuotes = false;
        else current += c;
      } else if (c === '"' || c === "'") {
        inQuotes = true;
        quoteChar = c;
      } else if (c === ' ') {
        if (current) { tokens.push(current); current = ''; }
      } else {
        current += c;
      }
    }
    if (current) tokens.push(current);
    return tokens;
  };

  const parseCurl = (raw: string): ParsedRequest => {
    const clean = raw.replace(/\\\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim();
    const tokens = tokenize(clean);
    let url = '';
    let method = 'GET';
    const headers: { key: string; value: string }[] = [];
    let body = '';
    let i = tokens[0] === 'curl' ? 1 : 0;

    while (i < tokens.length) {
      const t = tokens[i];
      if (t === '-X' || t === '--request') {
        method = tokens[i + 1] || method; i += 2;
      } else if (t === '-H' || t === '--header') {
        const h = tokens[i + 1] || ''; i += 2;
        const ci = h.indexOf(':');
        if (ci !== -1) headers.push({ key: h.slice(0, ci).trim(), value: h.slice(ci + 1).trim() });
      } else if (t === '-d' || t === '--data' || t === '--data-raw' || t === '--data-urlencode') {
        body = tokens[i + 1] || ''; i += 2;
        if (method === 'GET') method = 'POST';
      } else if (t === '-u' || t === '--user') {
        const u = tokens[i + 1] || ''; i += 2;
        headers.push({ key: 'Authorization', value: `Basic ${btoa(u)}` });
      } else if (/^-[viksSLf]+$/.test(t) || ['--verbose','--include','--insecure','--silent','--location','--fail'].includes(t)) {
        i++;
      } else if (t.startsWith('http://') || t.startsWith('https://')) {
        url = t; i++;
      } else if (t.startsWith('-')) {
        i + 1 < tokens.length && !tokens[i + 1].startsWith('-') ? (i += 2) : i++;
      } else {
        if (!url && (t.includes('.') || t.includes('/')))
          url = t.startsWith('http') ? t : `https://${t}`;
        i++;
      }
    }
    return { url, method, headers, body };
  };

  // ── Dynamic params ────────────────────────────────────────────────────────────

  const addParam = () => {
    setDynamicParams(prev => [...prev, {
      id: Math.random().toString(36).slice(2),
      name: '', prefix: '', startFrom: 1, digits: 0,
    }]);
  };

  const updateParam = (id: string, field: keyof DynamicParam, value: string | number) => {
    setDynamicParams(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removeParam = (id: string) => {
    setDynamicParams(prev => prev.filter(p => p.id !== id));
  };

  // ── Script generator ──────────────────────────────────────────────────────────

  const generate = () => {
    setError('');
    if (!curlInput.trim()) { setError('Please paste a cURL command'); return; }

    const { url, method, headers, body } = parseCurl(curlInput);
    if (!url) { setError('Could not find a URL in the cURL command'); return; }

    const validParams = dynamicParams.filter(p => p.name.trim());
    const lines: string[] = [];

    // ── imports ──
    lines.push(`import http from 'k6/http';`);
    lines.push(`import { check } from 'k6';`);
    lines.push('');

    // ── options ──
    lines.push('export const options = {');
    lines.push('  scenarios: {');
    lines.push('    load_test: {');
    lines.push(`      executor: 'ramping-arrival-rate',`);
    lines.push(`      startRate: 0,`);
    lines.push(`      timeUnit: '1s',`);
    lines.push(`      preAllocatedVUs: ${vus},`);
    lines.push(`      maxVUs: ${Math.max(vus * 2, vus + 10)},`);
    lines.push(`      stages: [`);
    lines.push(`        { duration: '${rampUpTime}s', target: ${targetTps} }, // ramp up`);
    lines.push(`        { duration: '${sustainTime}s', target: ${targetTps} }, // sustain`);
    lines.push(`        { duration: '10s', target: 0 },                        // ramp down`);
    lines.push(`      ],`);
    lines.push('    },');
    lines.push('  },');
    lines.push('};');
    lines.push('');

    // ── default function ──
    lines.push('export default function () {');

    if (validParams.length > 0) {
      lines.push('  // Each VU operates on its own numeric range to avoid duplicate values');
      lines.push('  const _counter = (__VU - 1) * 1_000_000 + __ITER;');
      lines.push('');
      for (const p of validParams) {
        const padExpr = p.digits > 0
          ? `.padStart(${p.digits}, '0')`
          : '';
        const numExpr = `_counter + ${p.startFrom}`;
        const valExpr = p.prefix
          ? `\`${p.prefix}\${String(${numExpr})${padExpr}}\``
          : `String(${numExpr})${padExpr}`;
        lines.push(`  const ${p.name} = ${valExpr};`);
      }
      lines.push('');
    }

    // ── URL ──
    lines.push(`  const url = \`${url.replace(/`/g, '\\`')}\`;`);
    lines.push('');

    // ── headers ──
    if (headers.length > 0) {
      lines.push('  const params = {');
      lines.push('    headers: {');
      for (const h of headers) {
        lines.push(`      '${h.key}': '${h.value.replace(/'/g, "\\'")}',`);
      }
      lines.push('    },');
      lines.push('  };');
    } else {
      lines.push('  const params = { headers: {} };');
    }
    lines.push('');

    // ── body ──
    if (body) {
      let prettyBody = body;
      try {
        prettyBody = JSON.stringify(JSON.parse(body), null, 2);
      } catch { /* keep as-is */ }

      const escapedBody = prettyBody.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
      if (validParams.length > 0) {
        lines.push(`  // Replace static values with dynamic params where needed:`);
        lines.push(`  // Available: ${validParams.map(p => `\${${p.name}}`).join(', ')}`);
      }
      lines.push(`  const payload = \`${escapedBody}\`;`);
      lines.push('');
    }

    // ── request ──
    const m = method.toLowerCase();
    const hasBody = Boolean(body) && ['post', 'put', 'patch'].includes(m);
    if (hasBody) {
      lines.push(`  const response = http.${m}(url, payload, params);`);
    } else if (['get', 'delete', 'head', 'options'].includes(m)) {
      lines.push(`  const response = http.${m}(url, params);`);
    } else {
      lines.push(`  const response = http.request('${method}', url, ${body ? 'payload' : 'null'}, params);`);
    }

    lines.push('');
    lines.push('  check(response, {');
    lines.push(`    'status is 200': (r) => r.status === 200,`);
    lines.push(`    'response time < 2000ms': (r) => r.timings.duration < 2000,`);
    lines.push('  });');
    lines.push('}');

    const script = lines.join('\n');
    setOutput(script);
    addToHistory(script, 'k6 Load Test');
  };

  // ── render ────────────────────────────────────────────────────────────────────

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* ── Left: config ── */}
      <div className="space-y-5">

        {/* cURL input */}
        <div>
          <label className={labelClass}>cURL Command</label>
          <textarea
            value={curlInput}
            onChange={e => setCurlInput(e.target.value)}
            rows={5}
            placeholder={'curl -X POST https://api.example.com/pay \\\n  -H \'Content-Type: application/json\' \\\n  -d \'{"msisdn":"628100000001"}\''}
            className={`w-full border rounded-lg p-3 font-mono text-sm resize-none ${inputClass}`}
          />
        </div>

        {/* Load profile */}
        <div>
          <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Load Profile
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Virtual Users</label>
              <input
                type="number" min={1} value={vus}
                onChange={e => setVus(Number(e.target.value))}
                className={`w-full border rounded-lg p-2 text-sm ${inputClass}`}
              />
            </div>
            <div>
              <label className={labelClass}>Target TPS</label>
              <input
                type="number" min={1} value={targetTps}
                onChange={e => setTargetTps(Number(e.target.value))}
                className={`w-full border rounded-lg p-2 text-sm ${inputClass}`}
              />
            </div>
            <div>
              <label className={labelClass}>Ramp-up (seconds)</label>
              <input
                type="number" min={1} value={rampUpTime}
                onChange={e => setRampUpTime(Number(e.target.value))}
                className={`w-full border rounded-lg p-2 text-sm ${inputClass}`}
              />
            </div>
            <div>
              <label className={labelClass}>Sustain Duration (seconds)</label>
              <input
                type="number" min={1} value={sustainTime}
                onChange={e => setSustainTime(Number(e.target.value))}
                className={`w-full border rounded-lg p-2 text-sm ${inputClass}`}
              />
            </div>
          </div>
        </div>

        {/* Dynamic params */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Dynamic Parameters (Counter-based)
            </h3>
            <button
              onClick={addParam}
              className={`text-sm px-3 py-1 rounded transition-colors ${
                darkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-gray-100'
              }`}
            >
              + Add
            </button>
          </div>

          {dynamicParams.length === 0 ? (
            <p className={`text-xs italic ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Add counter-based params (e.g. msisdn, transaction_id). Each VU gets its own numeric range to guarantee uniqueness.
            </p>
          ) : (
            <div className="space-y-2">
              <div className={`grid grid-cols-12 gap-1 text-xs font-medium px-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <span className="col-span-3">Name</span>
                <span className="col-span-3">Prefix</span>
                <span className="col-span-3">Start From</span>
                <span className="col-span-2">Digits</span>
              </div>
              {dynamicParams.map(p => (
                <div key={p.id} className="grid grid-cols-12 gap-1 items-center">
                  <input
                    type="text" value={p.name} placeholder="msisdn"
                    onChange={e => updateParam(p.id, 'name', e.target.value)}
                    className={`col-span-3 border rounded px-2 py-1.5 text-xs font-mono ${inputClass}`}
                  />
                  <input
                    type="text" value={p.prefix} placeholder="628"
                    onChange={e => updateParam(p.id, 'prefix', e.target.value)}
                    className={`col-span-3 border rounded px-2 py-1.5 text-xs font-mono ${inputClass}`}
                  />
                  <input
                    type="number" value={p.startFrom} min={0}
                    onChange={e => updateParam(p.id, 'startFrom', Number(e.target.value))}
                    className={`col-span-3 border rounded px-2 py-1.5 text-xs ${inputClass}`}
                  />
                  <input
                    type="number" value={p.digits} min={0} placeholder="0=none"
                    onChange={e => updateParam(p.id, 'digits', Number(e.target.value))}
                    className={`col-span-2 border rounded px-2 py-1.5 text-xs ${inputClass}`}
                  />
                  <button
                    onClick={() => removeParam(p.id)}
                    className={`col-span-1 text-center text-lg leading-none transition-colors ${
                      darkMode ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'
                    }`}
                  >×</button>
                </div>
              ))}

              {/* preview */}
              <div className={`mt-2 p-2 rounded text-xs font-mono ${darkMode ? 'bg-gray-900 text-green-400' : 'bg-gray-50 text-green-700'}`}>
                {dynamicParams.filter(p => p.name).map(p => {
                  const pad = p.digits > 0 ? `.padStart(${p.digits}, '0')` : '';
                  const numExpr = `_counter + ${p.startFrom}`;
                  const val = p.prefix
                    ? `\`${p.prefix}\${String(${numExpr})${pad}}\``
                    : `String(${numExpr})${pad}`;
                  return <div key={p.id}>const {p.name} = {val};</div>;
                })}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={generate}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          Generate k6 Script
        </button>
      </div>

      {/* ── Right: output ── */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Generated Script
          </h3>
          {output && (
            <button
              onClick={() => copyToClipboard(output)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
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

        <textarea
          readOnly
          value={output || '// Generated k6 script will appear here'}
          rows={36}
          className={`w-full border rounded-lg p-4 font-mono text-xs resize-none ${
            darkMode
              ? 'bg-gray-900 border-gray-700 text-green-400'
              : 'bg-gray-50 border-gray-200 text-gray-800'
          }`}
        />

        {output && (
          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Run with: <code className={`px-1 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>k6 run script.js</code>
          </p>
        )}
      </div>
    </div>
  );
}
