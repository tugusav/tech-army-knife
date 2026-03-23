import React from 'react';
import { Code2 } from 'lucide-react';
import { Tool } from '../../types';

interface HomePageProps {
  tools: Tool[];
  setActiveView: (view: string) => void;
  darkMode: boolean;
}

export function HomePage({ tools, setActiveView }: HomePageProps) {
  return (
    <div className="home-page">
      <div className="home-hero">
        <h1 className="home-title">Your Tech Swiss-Army Knife</h1>
        <p className="home-subtitle">Developer tools to help you work faster. <br />Encode, decode, compare, format, and generate. <br />No server-side processing = No data leaves your browser.</p>
      </div>

      <div className="home-stats">
        <div className="home-stat-badge">
          <Code2 size={18} />
          <span>{tools.length} Tools</span>
        </div>
      </div>

      <div className="home-grid">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveView(tool.id)}
              className="home-card"
            >
              <div className="home-card-inner">
                <div className="home-card-icon">
                  <Icon size={22} />
                </div>
                <div>
                  <div className="home-card-title">
                    {tool.name}
                    <span className="arrow">&rarr;</span>
                  </div>
                  <div className="home-card-desc">{tool.desc}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
