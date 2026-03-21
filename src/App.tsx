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
    { id: 'compare', name: 'Text Compare', category: 'text', icon: GitCompare, desc: 'Side-by-side git-style diff.' },
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
    { id: 'k6-load-test', name: 'k6 Load Test Generator', category: 'api', icon: Gauge, desc: 'Generate k6 load test scripts from cURL commands.' },
  ];

  const categories = [
    { name: 'API TOOLS', items: tools.filter((t) => t.category === 'api') },
    { name: 'FORMATTING & VIEWERS', items: tools.filter((t) => ['formatting', 'viewer'].includes(t.category)) },
    { name: 'ENCODING & CONVERSION', items: tools.filter((t) => ['encoding', 'conversion'].includes(t.category)) },
    { name: 'GENERATORS & UTILITIES', items: tools.filter((t) => t.category === 'generator') },
    { name: 'TEXT & CONTENT', items: tools.filter((t) => t.category === 'text') },

  ];

  const bgClass = darkMode ? 'bg-gray-900' : 'bg-gray-50';

  return (
    <div className={`flex h-screen ${bgClass} relative overflow-hidden`}>
      <HistorySidebar 
        isOpen={historyOpen} 
        onClose={() => setHistoryOpen(false)} 
        darkMode={darkMode}
        copyToClipboard={copyToClipboard}
      />

      {/* Detail: Floating History Toggle Button */}
      <button
        onClick={() => setHistoryOpen(!historyOpen)}
        className={`fixed top-4 right-4 z-[40] p-2 rounded-lg shadow-lg transition-colors ${
          darkMode ? 'bg-gray-800 text-blue-400 hover:bg-gray-700' : 'bg-white text-blue-600 hover:bg-gray-50'
        }`}
        title="Toggle History"
      >
        <History size={20} />
      </button>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
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
      </div>

      {/* Mobile Top Bar */}
      <div
        className={`md:hidden fixed top-0 left-0 right-0 h-12 flex items-center px-4 shadow z-[30] ${
          darkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}
      >
        {/* Hamburger */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className={`p-2 rounded-lg ${
              darkMode ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
            }`}
          >
            ☰
          </button>
        )}

          {/* Title */}
          <h1
            className={`absolute left-1/2 transform -translate-x-1/2 text-lg font-bold ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            TechArmyKnife
          </h1>
        </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[95] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 left-0 w-56 max-w-[14rem] h-screen
          bg-white dark:bg-gray-800 shadow-xl transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-300 z-[100] md:hidden flex flex-col`}
      >
        <Sidebar
          activeView={activeView}
          setActiveView={(view) => {
            setActiveView(view);
            setSidebarOpen(false);
            setError('');
          }}
          categories={categories}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto md:pt-0 pt-12">
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