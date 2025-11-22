import React from 'react';
import { Code2 } from 'lucide-react';
import { Tool } from '../../types';

interface HomePageProps {
  tools: Tool[];
  setActiveView: (view: string) => void;
  darkMode: boolean;
}

export function HomePage({ tools, setActiveView, darkMode }: HomePageProps) {
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const cardClass = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const hoverClass = darkMode ? 'hover:border-blue-500' : 'hover:border-blue-300';

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="text-center mb-12">
        <h1 className={`text-5xl font-bold ${textClass} mb-4`}>Your Tech Swiss-Army Knife</h1>
        <p className={`text-xl ${mutedClass}`}>Tools for developers to help you work faster!</p>
      </div>

      <div className="flex gap-4 justify-center mb-12">
        <div className={`flex items-center gap-2 px-4 py-2 ${cardClass} rounded-lg border`}>
          <Code2 size={20} className="text-blue-600" />
          <span className={`font-medium ${textClass}`}>{tools.length} Tools</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveView(tool.id)}
              className={`${cardClass} p-6 rounded-xl border ${hoverClass} hover:shadow-lg transition-all text-left`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                  <Icon size={24} className={darkMode ? 'text-gray-300' : 'text-gray-700'} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${textClass} mb-1 flex items-center gap-2`}>
                    {tool.name}
                    <span className={mutedClass}>→</span>
                  </h3>
                  <p className={`text-sm ${mutedClass}`}>{tool.desc}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}