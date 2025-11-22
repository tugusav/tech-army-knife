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
  const cardClass = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const hoverClass = darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  const activeClass = darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900';

  return (
    <div className={`w-56 ${cardClass} border-r flex flex-col`}>
      <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
        <h1 className={`text-xl font-bold ${textClass}`}>TechArmyKnife</h1>
        <button onClick={toggleDarkMode} className={`p-2 rounded-lg ${hoverClass}`}>
          {darkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-gray-600" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <div className="mb-6">
          <div className={`text-xs font-semibold ${mutedClass} mb-2 px-3`}>HOME</div>
          <button
            onClick={() => setActiveView('home')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              activeView === 'home' ? activeClass : `${mutedClass} ${hoverClass}`
            }`}
          >
            <Home size={18} />
            <span className="text-sm">Home</span>
          </button>
        </div>

        {categories.map((category) => (
          <div key={category.name} className="mb-6">
            <div className={`text-xs font-semibold ${mutedClass} mb-2 px-3`}>{category.name}</div>
            {category.items.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveView(tool.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    activeView === tool.id ? activeClass : `${mutedClass} ${hoverClass}`
                  }`}
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
  );
}