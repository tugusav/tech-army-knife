import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Minus, Plus } from 'lucide-react';

interface TreeViewProps {
  data: any;
  darkMode: boolean;
  level?: number;
}

interface TreeNodeProps {
  nodeKey: string;
  value: any;
  darkMode: boolean;
  level: number;
  isLast?: boolean;
  expandAll?: boolean;
}

const TreeNode: React.FC<TreeNodeProps> = ({ nodeKey, value, darkMode, level, isLast = false, expandAll }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels
  const indent = level * 20;

  // Update expansion state when expandAll changes
  useEffect(() => {
    if (expandAll !== undefined) {
      setIsExpanded(expandAll);
    }
  }, [expandAll]);

  const getValueType = (val: any): string => {
    if (val === null) return 'null';
    if (Array.isArray(val)) return 'array';
    if (typeof val === 'object') return 'object';
    if (typeof val === 'string') return 'string';
    if (typeof val === 'number') return 'number';
    if (typeof val === 'boolean') return 'boolean';
    return 'unknown';
  };

  const getValuePreview = (val: any): string => {
    const type = getValueType(val);
    switch (type) {
      case 'null':
        return 'null';
      case 'array':
        return `Array(${val.length})`;
      case 'object':
        const keys = Object.keys(val);
        return `Object(${keys.length})`;
      case 'string':
        return val.length > 50 ? `"${val.substring(0, 50)}..."` : `"${val}"`;
      case 'number':
      case 'boolean':
        return String(val);
      default:
        return String(val);
    }
  };

  const getTypeColor = (type: string): string => {
    const colors = {
      string: darkMode ? 'text-green-400' : 'text-green-600',
      number: darkMode ? 'text-blue-400' : 'text-blue-600',
      boolean: darkMode ? 'text-purple-400' : 'text-purple-600',
      null: darkMode ? 'text-gray-500' : 'text-gray-400',
      array: darkMode ? 'text-orange-400' : 'text-orange-600',
      object: darkMode ? 'text-yellow-400' : 'text-yellow-600',
    };
    return colors[type as keyof typeof colors] || (darkMode ? 'text-gray-300' : 'text-gray-700');
  };

  const type = getValueType(value);
  const isExpandable = type === 'object' || type === 'array';
  const hasChildren = isExpandable && (
    type === 'array' ? value.length > 0 : Object.keys(value).length > 0
  );

  return (
    <div className="select-none">
      <div 
        className={`flex items-center py-1 hover:bg-opacity-50 rounded ${
          darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
        }`}
        style={{ paddingLeft: `${indent}px` }}
      >
        {/* Expand/Collapse Button */}
        <div className="w-5 h-5 flex items-center justify-center mr-1">
          {hasChildren ? (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-0.5 rounded hover:bg-opacity-50 transition-colors ${
                darkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
              }`}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <div className="w-4 h-4" />
          )}
        </div>

        {/* Key */}
        <span className={`font-medium mr-2 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
          {nodeKey}:
        </span>

        {/* Value */}
        <span className={`font-mono text-sm ${getTypeColor(type)}`}>
          {getValuePreview(value)}
        </span>

        {/* Type Badge */}
        <span className={`ml-2 px-1.5 py-0.5 text-xs rounded ${
          darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
        }`}>
          {type}
        </span>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {type === 'array' ? (
            value.map((item: any, index: number) => (
              <TreeNode
                key={index}
                nodeKey={`[${index}]`}
                value={item}
                darkMode={darkMode}
                level={level + 1}
                isLast={index === value.length - 1}
                expandAll={expandAll}
              />
            ))
          ) : (
            Object.entries(value).map(([key, val], index, entries) => (
              <TreeNode
                key={key}
                nodeKey={key}
                value={val}
                darkMode={darkMode}
                level={level + 1}
                isLast={index === entries.length - 1}
                expandAll={expandAll}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export const TreeView: React.FC<TreeViewProps> = ({ data, darkMode, level = 0 }) => {
  const [expandAll, setExpandAll] = useState<boolean | undefined>(undefined);

  const toggleExpandAll = () => {
    setExpandAll(prev => prev === true ? false : true);
  };

  if (!data || typeof data !== 'object') {
    return (
      <div className={`p-4 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        No data to display in tree view
      </div>
    );
  }

  return (
    <div className="font-mono text-sm">
      {/* Tree Controls */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-300 dark:border-gray-600">
        <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Tree View
        </span>
        <div className="flex gap-2">
          <button
            onClick={toggleExpandAll}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
              darkMode 
                ? 'text-blue-400 hover:bg-gray-700' 
                : 'text-blue-600 hover:bg-gray-100'
            }`}
          >
            {expandAll === true ? (
              <>
                <Minus size={12} />
                Collapse All
              </>
            ) : (
              <>
                <Plus size={12} />
                Expand All
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tree Content */}
      <div className="space-y-0">
        {Object.entries(data).map(([key, value], index, entries) => (
          <TreeNode
            key={key}
            nodeKey={key}
            value={value}
            darkMode={darkMode}
            level={0}
            isLast={index === entries.length - 1}
            expandAll={expandAll}
          />
        ))}
      </div>
    </div>
  );
};