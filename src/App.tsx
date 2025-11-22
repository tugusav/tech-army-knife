import React, { useState } from 'react';
import { Code2, Terminal, GitCompare, Shuffle, FileJson, FileCode, Database, FileText } from 'lucide-react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Sidebar } from './components/layout/Sidebar';
import { HomePage } from './components/layout/HomePage';
import { ToolPage } from './components/layout/ToolPage';
import { Tool } from './types';

function AppContent() {
  const { darkMode, toggleDarkMode } = useTheme();
  const [activeView, setActiveView] = useState('home');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const tools: Tool[] = [
    { id: 'base64', name: 'Base64 Converter', category: 'encoding', icon: Code2, desc: 'Encode or decode Base64 strings.' },
    { id: 'curl', name: 'cURL Generator', category: 'api', icon: Terminal, desc: 'Generate cURL commands.' },
    { id: 'compare', name: 'Text Compare', category: 'text', icon: GitCompare, desc: 'Side-by-side git-style diff.' },
    { id: 'json-yaml', name: 'JSON ⟷ YAML', category: 'conversion', icon: Shuffle, desc: 'Convert between JSON and YAML.' },
    { id: 'json-format', name: 'JSON Formatter', category: 'formatting', icon: FileJson, desc: 'Format and beautify JSON.' },
    { id: 'yaml-format', name: 'YAML Formatter', category: 'formatting', icon: FileCode, desc: 'Format and beautify YAML.' },
    { id: 'sql-format', name: 'SQL Formatter', category: 'formatting', icon: Database, desc: 'Format SQL queries.' },
    { id: 'regex', name: 'Regex Tester', category: 'text', icon: Code2, desc: 'Test and generate regex patterns.' },
    { id: 'jwt', name: 'JWT Tool', category: 'encoding', icon: Code2, desc: 'Encode and decode JWT tokens.' },
    { id: 'csv-json', name: 'CSV ⟷ JSON', category: 'conversion', icon: FileText, desc: 'Convert between CSV and JSON.' },
  ];

  const categories = [
    { name: 'TEXT & CONTENT', items: tools.filter((t) => t.category === 'text') },
    { name: 'ENCODING & CONVERSION', items: tools.filter((t) => ['encoding', 'conversion'].includes(t.category)) },
    { name: 'FORMATTING', items: tools.filter((t) => t.category === 'formatting') },
    { name: 'API TOOLS', items: tools.filter((t) => t.category === 'api') },
  ];

  const bgClass = darkMode ? 'bg-gray-900' : 'bg-gray-50';

  return (
    <div className={`flex h-screen ${bgClass}`}>
      <Sidebar
        activeView={activeView}
        setActiveView={(view) => {
          setActiveView(view);
          setError('');
        }}
        categories={categories}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />

      <div className="flex-1 overflow-y-auto">
        {activeView === 'home' ? (
          <HomePage tools={tools} setActiveView={setActiveView} darkMode={darkMode} />
        ) : (
          <ToolPage
            activeView={activeView}
            tools={tools}
            error={error}
            setError={setError}
            copied={copied}
            copyToClipboard={copyToClipboard}
            darkMode={darkMode}
          />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}