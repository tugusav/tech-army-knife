
import React, { useState } from "react";
import { diffLines, diffWords } from "diff";
import { Copy, Check, AlertCircle, FileJson, GitCompare, Code2, Database, FileCode, Shuffle, Terminal, Home } from "lucide-react";

/**
 * App.tsx
 * - Side-by-side git-style diff (adds green, deletes red, modified highlighted)
 * - Uses `diff` library (diffLines + diffWords)
 * - JSON formatter: visible indentation selector (numbers only)
 * - Only YAML exposes indent type (spaces / tabs)
 * - cURL flags are combined (e.g. -vik, -ik)
 *
 * Note: install dependency: npm install diff lucide-react
 */

export default function TechTools() {
  const [activeView, setActiveView] = useState("home");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // Base64
  const [base64Input, setBase64Input] = useState("");
  const [base64Output, setBase64Output] = useState("");
  const [base64Mode, setBase64Mode] = useState("encode");

  // cURL
  const [curlUrl, setCurlUrl] = useState("");
  const [curlMethod, setCurlMethod] = useState("GET");
  const [curlHeaders, setCurlHeaders] = useState("");
  const [curlBody, setCurlBody] = useState("");
  const [curlOutput, setCurlOutput] = useState("");
  const [curlFlags, setCurlFlags] = useState({
    verbose: false,
    includeHeaders: false,
    insecure: false,
  });

  // Text Compare
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [diffRows, setDiffRows] = useState([]); // rows for side-by-side

  // JSON/YAML
  const [jsonYamlInput, setJsonYamlInput] = useState("");
  const [jsonYamlOutput, setJsonYamlOutput] = useState("");
  const [jsonYamlMode, setJsonYamlMode] = useState("json-to-yaml");

  // JSON Formatter
  const [jsonInput, setJsonInput] = useState("");
  const [jsonOutput, setJsonOutput] = useState("");
  const [jsonFormatMode, setJsonFormatMode] = useState("format");
  const [jsonIndent, setJsonIndent] = useState("2"); // number only

  // YAML Formatter
  const [yamlInput, setYamlInput] = useState("");
  const [yamlOutput, setYamlOutput] = useState("");
  const [yamlIndent, setYamlIndent] = useState("2");
  const [yamlUseTab, setYamlUseTab] = useState(false);

  // SQL Formatter (keep as before)
  const [sqlInput, setSqlInput] = useState("");
  const [sqlOutput, setSqlOutput] = useState("");
  const [sqlKeywordCase, setSqlKeywordCase] = useState("upper");
  const [sqlIndent, setSqlIndent] = useState("2");
  const [sqlUseTab, setSqlUseTab] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Base64
  const handleBase64Convert = () => {
    setError("");
    try {
      if (base64Mode === "encode") {
        setBase64Output(btoa(base64Input));
      } else {
        setBase64Output(atob(base64Input));
      }
    } catch (e) {
      setError("Invalid input for conversion");
      setBase64Output("");
    }
  };

  // cURL generator with combined flags
  const generateCurl = () => {
    setError("");
    if (!curlUrl.trim()) {
      setError("URL is required");
      return;
    }

    // Build combined flag string e.g. -vik
    const flagLetters = [
      curlFlags.verbose ? "v" : "",
      curlFlags.includeHeaders ? "i" : "",
      curlFlags.insecure ? "k" : "",
    ].join("");

    const flags = flagLetters ? `-${flagLetters}` : "";

    let curl = `curl ${flags}${flags ? " " : ""}-X ${curlMethod} '${curlUrl}'`;

    if (curlHeaders.trim()) {
      const headers = curlHeaders.split("\n").filter((h) => h.trim());
      headers.forEach((header) => {
        curl += ` \\\n  -H '${header.trim()}'`;
      });
    }

    if (curlBody.trim() && ["POST", "PUT", "PATCH"].includes(curlMethod)) {
      curl += ` \\\n  -d '${curlBody.trim()}'`;
    }

    setCurlOutput(curl);
  };

  // DIFF: side-by-side rows builder
  const buildSideBySide = (oldText, newText) => {
    // Use diffLines to get blocks
    const parts = diffLines(oldText, newText);
    const rows = [];
    let leftQueue = [];
    let rightQueue = [];

    // We'll iterate over parts and align them:
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const lines = part.value.split("\n");
      // remove trailing empty line that diff produces often
      if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();

      if (part.added) {
        // additions go to rightQueue
        lines.forEach((ln) => {
          rightQueue.push({ text: ln });
        });
      } else if (part.removed) {
        // deletions go to leftQueue
        lines.forEach((ln) => {
          leftQueue.push({ text: ln });
        });
      } else {
        // equal - flush any pending left/right by pairing
        // pair leftQueue and rightQueue by index (modifies are when both had items)
        const maxQ = Math.max(leftQueue.length, rightQueue.length);
        for (let k = 0; k < maxQ; k++) {
          const l = leftQueue[k] ? leftQueue[k].text : "";
          const r = rightQueue[k] ? rightQueue[k].text : "";
          const row = makeRow(l, r);
          rows.push(row);
        }
        leftQueue = [];
        rightQueue = [];

        // now add equal lines as pairs
        lines.forEach((ln) => {
          rows.push(makeRow(ln, ln, "equal"));
        });
      }
    }

    // After loop, pair remaining queues
    const maxQ = Math.max(leftQueue.length, rightQueue.length);
    for (let k = 0; k < maxQ; k++) {
      const l = leftQueue[k] ? leftQueue[k].text : "";
      const r = rightQueue[k] ? rightQueue[k].text : "";
      const row = makeRow(l, r);
      rows.push(row);
    }

    return rows;
  };

  // helper: decide row type and compute word diffs for modified lines
  const makeRow = (left, right, forcedType = null) => {
    if (forcedType === "equal" || left === right) {
      return { type: "equal", left, right, leftTokens: null, rightTokens: null };
    }
    if (left && !right) {
      return { type: "delete", left, right: "", leftTokens: null, rightTokens: null };
    }
    if (!left && right) {
      return { type: "add", left: "", right, leftTokens: null, rightTokens: null };
    }
    // both present but different -> compute word-level diff tokens
    const wordDiff = diffWords(left, right);
    const leftTokens = [];
    const rightTokens = [];
    wordDiff.forEach((p) => {
      if (p.added) {
        rightTokens.push({ text: p.value, added: true });
      } else if (p.removed) {
        leftTokens.push({ text: p.value, removed: true });
      } else {
        leftTokens.push({ text: p.value });
        rightTokens.push({ text: p.value });
      }
    });
    return { type: "modify", left, right, leftTokens, rightTokens };
  };

  const compareTexts = () => {
    try {
      const rows = buildSideBySide(text1, text2);
      setDiffRows(rows);
    } catch (e) {
      setError("Error computing diff: " + e.message);
    }
  };

  // JSON <-> YAML helpers (simple converters)
  const yamlToJson = (yaml) => {
    // Simple line-based YAML -> JSON converter (limited)
    const lines = yaml.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#"));
    const result = {};
    const stack = [{ obj: result, indent: -1 }];

    lines.forEach((line) => {
      const indent = line.search(/\S/);
      const trimmed = line.trim();
      while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();

      if (trimmed.includes(":")) {
        const [key, ...valueParts] = trimmed.split(":");
        const value = valueParts.join(":").trim();
        const cleanKey = key.trim();
        if (value === "" || value === "{}" || value === "[]") {
          stack[stack.length - 1].obj[cleanKey] = value === "[]" ? [] : {};
          stack.push({ obj: stack[stack.length - 1].obj[cleanKey], indent });
        } else {
          let parsed = value;
          if (value === "true") parsed = true;
          else if (value === "false") parsed = false;
          else if (value === "null") parsed = null;
          else if (!isNaN(value) && value !== "") parsed = Number(value);
          stack[stack.length - 1].obj[cleanKey] = parsed;
        }
      }
    });

    return result;
  };

  const jsonToYaml = (obj, indentSpaces = 2, useTab = false) => {
    const getIndent = (level) => (useTab ? "\t".repeat(level) : " ".repeat(indentSpaces * level));
    const convert = (o, level = 0) => {
      const spaces = getIndent(level);
      let out = "";
      if (Array.isArray(o)) {
        o.forEach((it) => {
          if (typeof it === "object" && it !== null) {
            out += `${spaces}-\n${convert(it, level + 1)}`;
          } else {
            out += `${spaces}- ${it}\n`;
          }
        });
      } else if (typeof o === "object" && o !== null) {
        Object.entries(o).forEach(([k, v]) => {
          if (typeof v === "object" && v !== null) {
            out += `${spaces}${k}:\n${convert(v, level + 1)}`;
          } else {
            out += `${spaces}${k}: ${v}\n`;
          }
        });
      } else {
        out += `${spaces}${o}\n`;
      }
      return out;
    };
    return convert(obj);
  };

  const handleJsonYamlConvert = () => {
    setError("");
    try {
      if (jsonYamlMode === "json-to-yaml") {
        const parsed = JSON.parse(jsonYamlInput);
        setJsonYamlOutput(jsonToYaml(parsed, parseInt(yamlIndent || "2"), yamlUseTab));
      } else {
        const json = yamlToJson(jsonYamlInput);
        setJsonYamlOutput(JSON.stringify(json, null, parseInt(jsonIndent || "2")));
      }
    } catch (e) {
      setError("Invalid input format: " + e.message);
      setJsonYamlOutput("");
    }
  };

  // JSON formatter uses numeric-only indentation selector
  const formatJson = () => {
    setError("");
    try {
      const parsed = JSON.parse(jsonInput);
      if (jsonFormatMode === "format") {
        setJsonOutput(JSON.stringify(parsed, null, parseInt(jsonIndent || "2")));
      } else {
        setJsonOutput(JSON.stringify(parsed));
      }
    } catch (e) {
      setError("Invalid JSON: " + e.message);
      setJsonOutput("");
    }
  };

  const formatYaml = () => {
    setError("");
    try {
      const json = yamlToJson(yamlInput);
      const indentSpaces = parseInt(yamlIndent) || 2;
      setYamlOutput(jsonToYaml(json, indentSpaces, yamlUseTab));
    } catch (e) {
      setError("Invalid YAML: " + e.message);
      setYamlOutput("");
    }
  };

  const formatSql = () => {
    setError("");
    try {
      let formatted = sqlInput.replace(/\s+/g, " ").trim();
      const keywords = [
        "SELECT",
        "FROM",
        "WHERE",
        "AND",
        "OR",
        "JOIN",
        "LEFT JOIN",
        "RIGHT JOIN",
        "INNER JOIN",
        "OUTER JOIN",
        "ON",
        "GROUP BY",
        "ORDER BY",
        "HAVING",
        "LIMIT",
        "OFFSET",
        "INSERT INTO",
        "VALUES",
        "UPDATE",
        "SET",
        "DELETE FROM",
        "CREATE TABLE",
        "ALTER TABLE",
        "DROP TABLE",
        "UNION",
        "UNION ALL",
      ];
      keywords.forEach((kw) => {
        const regex = new RegExp(`\\b${kw}\\b`, "gi");
        formatted = formatted.replace(regex, `\n${kw}`);
      });

      formatted = formatted
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .join("\n");

      formatted = formatted.replace(/,/g, ",\n  ");
      formatted = formatted.replace(/\(/g, "(\n  ");
      formatted = formatted.replace(/\)/g, "\n)");

      const lines = formatted.split("\n");
      let indentLevel = 0;
      const indentSpaces = parseInt(sqlIndent) || 2;
      const getIndent = (level) => (sqlUseTab ? "\t".repeat(level) : " ".repeat(indentSpaces * level));

      const formattedLines = lines.map((line) => {
        const trimmed = line.trim();
        if (trimmed.endsWith("(")) {
          const res = getIndent(indentLevel) + trimmed;
          indentLevel++;
          return res;
        } else if (trimmed.startsWith(")")) {
          indentLevel = Math.max(0, indentLevel - 1);
          return getIndent(indentLevel) + trimmed;
        } else {
          return getIndent(indentLevel) + trimmed;
        }
      });

      let result = formattedLines.join("\n");

      keywords.forEach((kw) => {
        const regex = new RegExp(`\\b${kw}\\b`, "gi");
        result = result.replace(regex, (match) => {
          return sqlKeywordCase === "upper" ? match.toUpperCase() : match.toLowerCase();
        });
      });

      setSqlOutput(result);
    } catch (e) {
      setError("Error formatting SQL: " + e.message);
      setSqlOutput("");
    }
  };

  const tools = [
    { id: "base64", name: "Base64 Converter", category: "encoding", icon: Code2, desc: "Encode or decode Base64 strings." },
    { id: "curl", name: "cURL Generator", category: "api", icon: Terminal, desc: "Generate cURL commands." },
    { id: "compare", name: "Text Compare", category: "text", icon: GitCompare, desc: "Side-by-side git-style diff." },
    { id: "json-yaml", name: "JSON ⟷ YAML", category: "conversion", icon: Shuffle, desc: "Convert between JSON and YAML." },
    { id: "json-format", name: "JSON Formatter", category: "formatting", icon: FileJson, desc: "Format and beautify JSON." },
    { id: "yaml-format", name: "YAML Formatter", category: "formatting", icon: FileCode, desc: "Format and beautify YAML." },
    { id: "sql-format", name: "SQL Formatter", category: "formatting", icon: Database, desc: "Format SQL queries." },
  ];

  const categories = [
    { name: "TEXT & CONTENT", items: tools.filter((t) => t.category === "text") },
    { name: "ENCODING & CONVERSION", items: tools.filter((t) => ["encoding", "conversion"].includes(t.category)) },
    { name: "FORMATTING", items: tools.filter((t) => t.category === "formatting") },
    { name: "API TOOLS", items: tools.filter((t) => t.category === "api") },
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
            <button onClick={() => setActiveView("home")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeView === "home" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"}`}>
              <Home size={18} />
              <span className="text-sm">Home</span>
            </button>
          </div>

          {categories.map((category) => (
            <div key={category.name} className="mb-6">
              <div className="text-xs font-semibold text-gray-500 mb-2 px-3">{category.name}</div>
              {category.items.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setActiveView(tool.id);
                      setError("");
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeView === tool.id ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"}`}
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

      {/* Main */}
      <div className="flex-1 overflow-y-auto">
        {activeView === "home" ? (
          <div className="max-w-7xl mx-auto p-8">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-gray-900 mb-4">Your Ultimate Developer Toolkit</h1>
              <p className="text-xl text-gray-600">Tools for developers, by a developer.</p>
            </div>

            <div className="flex gap-4 justify-center mb-12">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
                <Code2 size={20} className="text-blue-600" />
                <span className="font-medium text-gray-900">{tools.length} Tools</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button key={tool.id} onClick={() => setActiveView(tool.id)} className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all text-left">
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
          <div className="max-w-6xl mx-auto p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{tools.find((t) => t.id === activeView)?.name}</h1>
              <p className="text-gray-600">{tools.find((t) => t.id === activeView)?.desc}</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              {/* Base64 */}
              {activeView === "base64" && (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <button onClick={() => setBase64Mode("encode")} className={`px-4 py-2 rounded-lg font-medium transition-colors ${base64Mode === "encode" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Encode</button>
                    <button onClick={() => setBase64Mode("decode")} className={`px-4 py-2 rounded-lg font-medium transition-colors ${base64Mode === "decode" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Decode</button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Input</label>
                    <textarea value={base64Input} onChange={(e) => setBase64Input(e.target.value)} className="w-full h-40 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder={base64Mode === "encode" ? "Enter text to encode..." : "Enter base64 to decode..."} />
                  </div>

                  <button onClick={handleBase64Convert} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors">Convert</button>

                  {base64Output && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">Output</label>
                        <button onClick={() => copyToClipboard(base64Output)} className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors text-sm">
                          {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <textarea value={base64Output} readOnly className="w-full h-40 border border-gray-300 rounded-lg p-3 bg-gray-50" />
                    </div>
                  )}
                </div>
              )}

              {/* cURL */}
              {activeView === "curl" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">HTTP Method</label>
                    <select value={curlMethod} onChange={(e) => setCurlMethod(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="PATCH">PATCH</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
                    <input type="text" value={curlUrl} onChange={(e) => setCurlUrl(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="https://api.example.com/endpoint" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Flags</label>
                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" checked={curlFlags.verbose} onChange={(e) => setCurlFlags({ ...curlFlags, verbose: e.target.checked })} className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                        <div>
                          <div className="font-medium text-gray-900"><code className="bg-gray-200 px-2 py-1 rounded text-sm">-v</code> Verbose</div>
                          <div className="text-xs text-gray-600 mt-1">Show request and response headers</div>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" checked={curlFlags.includeHeaders} onChange={(e) => setCurlFlags({ ...curlFlags, includeHeaders: e.target.checked })} className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                        <div>
                          <div className="font-medium text-gray-900"><code className="bg-gray-200 px-2 py-1 rounded text-sm">-i</code> Include Headers</div>
                          <div className="text-xs text-gray-600 mt-1">Include response headers in output</div>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" checked={curlFlags.insecure} onChange={(e) => setCurlFlags({ ...curlFlags, insecure: e.target.checked })} className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                        <div>
                          <div className="font-medium text-gray-900"><code className="bg-gray-200 px-2 py-1 rounded text-sm">-k</code> Insecure</div>
                          <div className="text-xs text-gray-600 mt-1">Allow insecure SSL connections</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Headers (one per line)</label>
                    <textarea value={curlHeaders} onChange={(e) => setCurlHeaders(e.target.value)} className="w-full h-24 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm" placeholder="Content-Type: application/json&#10;Authorization: Bearer token" />
                  </div>

                  {["POST", "PUT", "PATCH"].includes(curlMethod) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Request Body</label>
                      <textarea value={curlBody} onChange={(e) => setCurlBody(e.target.value)} className="w-full h-24 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm" placeholder='{"key": "value"}' />
                    </div>
                  )}

                  <button onClick={generateCurl} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors">Generate cURL</button>

                  {curlOutput && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">Generated cURL</label>
                        <button onClick={() => copyToClipboard(curlOutput)} className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors text-sm">
                          {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <textarea value={curlOutput} readOnly className="w-full h-40 border border-gray-300 rounded-lg p-3 bg-gray-50 font-mono text-sm" />
                    </div>
                  )}
                </div>
              )}

              {/* Compare - Side by side */}
              {activeView === "compare" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Left (old)</label>
                      <textarea value={text1} onChange={(e) => setText1(e.target.value)} className="w-full h-64 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm" placeholder="Enter old text..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Right (new)</label>
                      <textarea value={text2} onChange={(e) => setText2(e.target.value)} className="w-full h-64 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm" placeholder="Enter new text..." />
                    </div>
                  </div>

                  <button onClick={compareTexts} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors">Compare Texts</button>

                  {diffRows.length > 0 && (
                    <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto bg-white">
                      <div className="flex text-xs font-semibold text-gray-600 mb-3">
                        <div className="w-1/2">Old</div>
                        <div className="w-1/2">New</div>
                      </div>

                      {diffRows.map((row, idx) => (
                        <div key={idx} className="grid grid-cols-2 gap-4 mb-2 items-start">
                          {/* Left column */}
                          <div className={`p-3 rounded border ${row.type === "delete" ? "bg-red-50 border-red-200 text-red-800" : row.type === "modify" ? "bg-yellow-50 border-yellow-200" : "bg-gray-50 border-gray-200"}`}>
                            <div className="text-xs text-gray-500 mb-1">Line {idx + 1}</div>
                            {row.type === "modify" && row.leftTokens ? (
                              <div className="font-mono text-sm whitespace-pre-wrap">
                                {row.leftTokens.map((t, i) => (
                                  <span key={i} className={`${t.removed ? "bg-red-200 line-through" : ""}`}>{t.text}</span>
                                ))}
                              </div>
                            ) : (
                              <div className="font-mono text-sm whitespace-pre-wrap">{row.left || "(empty)"}</div>
                            )}
                          </div>

                          {/* Right column */}
                          <div className={`p-3 rounded border ${row.type === "add" ? "bg-green-50 border-green-200 text-green-800" : row.type === "modify" ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
                            <div className="text-xs text-gray-500 mb-1">Line {idx + 1}</div>
                            {row.type === "modify" && row.rightTokens ? (
                              <div className="font-mono text-sm whitespace-pre-wrap">
                                {row.rightTokens.map((t, i) => (
                                  <span key={i} className={`${t.added ? "bg-green-200" : ""}`}>{t.text}</span>
                                ))}
                              </div>
                            ) : (
                              <div className="font-mono text-sm whitespace-pre-wrap">{row.right || "(empty)"}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* JSON <-> YAML */}
              {activeView === "json-yaml" && (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <button onClick={() => setJsonYamlMode("json-to-yaml")} className={`px-4 py-2 rounded-lg font-medium transition-colors ${jsonYamlMode === "json-to-yaml" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>JSON → YAML</button>
                    <button onClick={() => setJsonYamlMode("yaml-to-json")} className={`px-4 py-2 rounded-lg font-medium transition-colors ${jsonYamlMode === "yaml-to-json" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>YAML → JSON</button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Input</label>
                    <textarea value={jsonYamlInput} onChange={(e) => setJsonYamlInput(e.target.value)} className="w-full h-64 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm" placeholder={jsonYamlMode === "json-to-yaml" ? "Enter JSON..." : "Enter YAML..."} />
                  </div>

                  <button onClick={handleJsonYamlConvert} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors">Convert</button>

                  {jsonYamlOutput && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">Output</label>
                        <button onClick={() => copyToClipboard(jsonYamlOutput)} className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors text-sm">
                          {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <textarea value={jsonYamlOutput} readOnly className="w-full h-64 border border-gray-300 rounded-lg p-3 bg-gray-50 font-mono text-sm" />
                    </div>
                  )}
                </div>
              )}

              {/* JSON Formatter (indentation number only) */}
              {activeView === "json-format" && (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <button onClick={() => setJsonFormatMode("format")} className={`px-4 py-2 rounded-lg font-medium transition-colors ${jsonFormatMode === "format" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Format</button>
                    <button onClick={() => setJsonFormatMode("minify")} className={`px-4 py-2 rounded-lg font-medium transition-colors ${jsonFormatMode === "minify" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Minify</button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Indentation (number only)</label>
                    <select value={jsonIndent} onChange={(e) => setJsonIndent(e.target.value)} className="w-32 border border-gray-300 rounded-lg p-2">
                      <option value="0">0</option>
                      <option value="2">2</option>
                      <option value="4">4</option>
                      <option value="8">8</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">JSON Input</label>
                    <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} className="w-full h-64 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm" placeholder='{"key":"value","array":[1,2,3]}' />
                  </div>

                  <button onClick={formatJson} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors">{jsonFormatMode === "format" ? "Format JSON" : "Minify JSON"}</button>

                  {jsonOutput && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">{jsonFormatMode === "format" ? "Formatted" : "Minified"} Output</label>
                        <button onClick={() => copyToClipboard(jsonOutput)} className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors text-sm">
                          {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <textarea value={jsonOutput} readOnly className="w-full h-64 border border-gray-300 rounded-lg p-3 bg-gray-50 font-mono text-sm" />
                    </div>
                  )}
                </div>
              )}

              {/* YAML Formatter (indentation number + type) */}
              {activeView === "yaml-format" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Indentation (number only)</label>
                      <select value={yamlIndent} onChange={(e) => setYamlIndent(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3">
                        <option value="2">2</option>
                        <option value="4">4</option>
                        <option value="8">8</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Indent Type</label>
                      <div className="flex gap-3 h-12 items-center">
                        <button onClick={() => setYamlUseTab(false)} className={`px-4 py-2 rounded-lg font-medium transition-colors ${!yamlUseTab ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Spaces</button>
                        <button onClick={() => setYamlUseTab(true)} className={`px-4 py-2 rounded-lg font-medium transition-colors ${yamlUseTab ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Tabs</button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">YAML Input</label>
                    <textarea value={yamlInput} onChange={(e) => setYamlInput(e.target.value)} className="w-full h-64 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm" placeholder="key: value&#10;array:&#10;  - item1&#10;  - item2" />
                  </div>

                  <button onClick={formatYaml} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors">Format YAML</button>

                  {yamlOutput && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">Formatted Output</label>
                        <button onClick={() => copyToClipboard(yamlOutput)} className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors text-sm">
                          {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <textarea value={yamlOutput} readOnly className="w-full h-64 border border-gray-300 rounded-lg p-3 bg-gray-50 font-mono text-sm" />
                    </div>
                  )}
                </div>
              )}

              {/* SQL Formatter */}
              {activeView === "sql-format" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Keyword Case</label>
                      <select value={sqlKeywordCase} onChange={(e) => setSqlKeywordCase(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3">
                        <option value="upper">UPPERCASE</option>
                        <option value="lower">lowercase</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Indentation</label>
                      <select value={sqlIndent} onChange={(e) => setSqlIndent(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3">
                        <option value="2">2 spaces</option>
                        <option value="4">4 spaces</option>
                        <option value="8">8 spaces</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Indent Type</label>
                      <div className="flex gap-2 h-12 items-center">
                        <button onClick={() => setSqlUseTab(false)} className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${!sqlUseTab ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Spaces</button>
                        <button onClick={() => setSqlUseTab(true)} className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${sqlUseTab ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Tabs</button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SQL Input</label>
                    <textarea value={sqlInput} onChange={(e) => setSqlInput(e.target.value)} className="w-full h-64 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm" placeholder="SELECT * FROM users WHERE id = 1 AND status = 'active'" />
                  </div>

                  <button onClick={formatSql} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors">Format SQL</button>

                  {sqlOutput && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">Formatted Output</label>
                        <button onClick={() => copyToClipboard(sqlOutput)} className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors text-sm">
                          {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <textarea value={sqlOutput} readOnly className="w-full h-64 border border-gray-300 rounded-lg p-3 bg-gray-50 font-mono text-sm" />
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