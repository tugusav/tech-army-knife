import React, { useState } from 'react';
import {
  Code2, Terminal, GitCompare, Shuffle, FileJson, FileCode, Database, FileText, History,
  Link, Eye, Hash, Clock, Calendar, Settings, Braces, FileType, Globe, Key, FileX, Gauge
} from 'lucide-react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { HistoryProvider } from './contexts/HistoryContext';
import { Sidebar } from './components/layout/Sidebar';
import { HomePage } from './components/layout/HomePage';
import { ToolPage } from './components/layout/ToolPage';
import { HistorySidebar } from './components/layout/HistorySidebar';
import { Tool } from './types';

function AppContent() {
  const { darkMode, toggleDarkMode } = useTheme();
  const [activeView, setActiveView] = useState('home');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const tools: Tool[] = [
    { id: 'base64', name: 'Base64 Converter', category: 'encoding', icon: Code2, desc: 'Encode or decode Base64 strings.' },
    { id: 'url-encoder', name: 'URL Encoder', category: 'encoding', icon: Link, desc: 'Encode or decode URL strings.' },
    { id: 'curl', name: 'cURL Generator', category: 'api', icon: Terminal, desc: 'Generate cURL commands.' },
    { id: 'compare', name: 'JSON Diff', category: 'formatting', icon: GitCompare, desc: 'Git-style side-by-side JSON payload diff with smart comparison options.' },
    { id: 'json-yaml', name: 'JSON ⟷ YAML', category: 'conversion', icon: Shuffle, desc: 'Convert between JSON and YAML.' },
    { id: 'json-xml', name: 'JSON ⟷ XML', category: 'conversion', icon: Shuffle, desc: 'Convert between JSON and XML.' },
    { id: 'json-viewer', name: 'JSON Viewer', category: 'formatting', icon: Braces, desc: 'Format, beautify and view JSON data.' },
    { id: 'yaml-viewer', name: 'YAML Viewer', category: 'formatting', icon: FileType, desc: 'Format, beautify and view YAML data.' },
    { id: 'xml-viewer', name: 'XML Viewer', category: 'viewer', icon: FileX, desc: 'View and analyze XML data.' },
    { id: 'sql-format', name: 'SQL Formatter', category: 'formatting', icon: Database, desc: 'Format SQL queries.' },
    { id: 'regex', name: 'Regex Tester', category: 'text', icon: Code2, desc: 'Test and generate regex patterns.' },
    { id: 'jwt', name: 'JWT Tool', category: 'encoding', icon: Key, desc: 'Encode and decode JWT tokens.' },
    { id: 'csv-json', name: 'CSV ⟷ JSON', category: 'conversion', icon: FileText, desc: 'Convert between CSV and JSON.' },
    { id: 'uuid-generator', name: 'UUID Generator', category: 'generator', icon: Hash, desc: 'Generate and validate UUIDs.' },
    { id: 'timestamp', name: 'UNIX Timestamp', category: 'generator', icon: Clock, desc: 'Convert Unix timestamps and dates.' },
    { id: 'cron', name: 'Cron Calculator', category: 'generator', icon: Calendar, desc: 'Create and analyze cron expressions.' },
    { id: 'hash-generator', name: 'Hash Generator', category: 'encoding', icon: Hash, desc: 'Generate MD5, SHA1, SHA256, SHA512 hashes.' },
    { id: 'k6-load-test', name: 'k6 Generator', category: 'api', icon: Gauge, desc: 'Generate k6 load test scripts from cURL commands.' },
  ];

  const categories = [
    { name: 'API TOOLS', items: tools.filter((t) => t.category === 'api') },
    { name: 'FORMATTING & VIEWERS', items: tools.filter((t) => ['formatting', 'viewer'].includes(t.category)) },
    { name: 'ENCODING & CONVERSION', items: tools.filter((t) => ['encoding', 'conversion'].includes(t.category)) },
    { name: 'GENERATORS & UTILITIES', items: tools.filter((t) => t.category === 'generator') },
    { name: 'TEXT & CONTENT', items: tools.filter((t) => t.category === 'text') },
  ];

  return (
    <div className={`app-shell ${darkMode ? '' : 'theme-light'}`}>
      <HistorySidebar
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        darkMode={darkMode}
        copyToClipboard={copyToClipboard}
      />

      {/* History Toggle */}
      <button
        onClick={() => setHistoryOpen(!historyOpen)}
        className="history-toggle"
        title="Toggle History"
      >
        <History size={18} />
      </button>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar
          activeView={activeView}
          setActiveView={(view) => { setActiveView(view); setError(''); }}
          categories={categories}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
        />
      </div>

      {/* Mobile Top Bar */}
      <div className="md:hidden mobile-topbar">
        {!sidebarOpen && (
          <button onClick={() => setSidebarOpen(true)} className="mobile-hamburger">
            &#9776;
          </button>
        )}
        <span className="mobile-topbar-title">TechArmyKnife</span>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="md:hidden mobile-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile Drawer */}
      <div className={`md:hidden mobile-drawer ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar
          activeView={activeView}
          setActiveView={(view) => { setActiveView(view); setSidebarOpen(false); setError(''); }}
          categories={categories}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
        />
      </div>

      {/* Main Content */}
      <div className="main-content md:pt-0 pt-12">
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
      <HistoryProvider>
        <AppContent />
      </HistoryProvider>
    </ThemeProvider>
  );
}
