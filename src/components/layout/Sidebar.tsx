import React from 'react';
import { Home, Moon, Sun } from 'lucide-react';
import { ToolCategory } from '../../types';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  categories: ToolCategory[];
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export function Sidebar({ activeView, setActiveView, categories, darkMode, toggleDarkMode }: SidebarProps) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>
          </svg>
          TechArmyKnife
        </div>
        <button onClick={toggleDarkMode} className="theme-toggle" title={darkMode ? 'Light mode' : 'Dark mode'}>
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-category">
          <div className="sidebar-category-label">Navigation</div>
          <button
            onClick={() => setActiveView('home')}
            className={`sidebar-item ${activeView === 'home' ? 'active' : ''}`}
          >
            <Home size={16} />
            <span>Home</span>
          </button>
        </div>

        {categories.map((category) => (
          <div key={category.name} className="sidebar-category">
            <div className="sidebar-category-label">{category.name}</div>
            {category.items.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveView(tool.id)}
                  className={`sidebar-item ${activeView === tool.id ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{tool.name}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );
}
