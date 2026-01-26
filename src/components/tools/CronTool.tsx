import React, { useState } from 'react';
import { OutputBox } from '../common/OutputBox';
import { useHistory } from '../../contexts/HistoryContext';

interface CronToolProps {
  darkMode: boolean;
  copied: boolean;
  copyToClipboard: (text: string) => void;
  setError: (error: string) => void;
}

export function CronTool({ darkMode, copied, copyToClipboard, setError }: CronToolProps) {
  const [cronExpression, setCronExpression] = useState('0 0 * * *');
  const [description, setDescription] = useState('');
  const [nextRuns, setNextRuns] = useState<string[]>([]);
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});
  const { addToHistory } = useHistory();

  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  const copySpecificItem = (value: string, itemKey: string) => {
    copyToClipboard(value);
    setCopiedStates({ ...copiedStates, [itemKey]: true });
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [itemKey]: false }));
    }, 1500);
  };

  // Handle input change with auto-formatting
  const handleCronInputChange = (value: string) => {
    // Allow user to type freely, but provide gentle formatting
    let formatted = value;
    
    // If user is typing and we detect a pattern without spaces, help format it
    if (!value.includes(' ') && value.length >= 5) {
      // Don't auto-format while user is still typing, just when they pause
      // This prevents interrupting their input flow
      formatted = value;
    }
    
    setCronExpression(formatted);
  };

  // Normalize cron expression by adding spaces if missing
  const normalizeCronExpression = (cron: string): string => {
    // Remove extra spaces and trim
    const cleaned = cron.trim().replace(/\s+/g, ' ');
    
    // If no spaces, try to split into 5 parts automatically
    if (!cleaned.includes(' ') && cleaned.length >= 5) {
      // For expressions like "00***" or "0 0***", try to intelligently split
      const chars = cleaned.split('');
      const parts: string[] = [];
      let currentPart = '';
      
      for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        
        // If we encounter a digit followed by a non-digit (except for ranges like 1-5)
        if (currentPart && 
            /\d/.test(currentPart[currentPart.length - 1]) && 
            /[^\d\-,]/.test(char) && 
            parts.length < 4) {
          parts.push(currentPart);
          currentPart = char;
        } else {
          currentPart += char;
        }
      }
      
      // Add the last part
      if (currentPart) {
        parts.push(currentPart);
      }
      
      // If we got exactly 5 parts, join with spaces
      if (parts.length === 5) {
        return parts.join(' ');
      }
    }
    
    // If still no spaces and looks like a compact format, try common patterns
    if (!cleaned.includes(' ')) {
      // Common patterns like "0****" (daily at midnight)
      if (cleaned.match(/^0\*{4}$/)) {
        return '0 0 * * *';
      }
      // Pattern like "*/5****" (every 5 minutes)
      if (cleaned.match(/^\*\/\d+\*{4}$/)) {
        const interval = cleaned.match(/\d+/)?.[0] || '5';
        return `*/${interval} * * * *`;
      }
      // Pattern like "00***" (daily at midnight)
      if (cleaned.match(/^00\*{3}$/)) {
        return '0 0 * * *';
      }
      // Pattern like "0900**" (daily at 9 AM)
      if (cleaned.match(/^0?\d{1,2}00\*{2}$/)) {
        const hour = cleaned.replace(/00\*{2}$/, '');
        return `0 ${parseInt(hour)} * * *`;
      }
    }
    
    return cleaned;
  };

  const cronPresets = [
    { label: 'Every minute', expression: '* * * * *', desc: 'Runs every minute' },
    { label: 'Every 5 minutes', expression: '*/5 * * * *', desc: 'Runs every 5 minutes' },
    { label: 'Every hour', expression: '0 * * * *', desc: 'Runs at the start of every hour' },
    { label: 'Daily at midnight', expression: '0 0 * * *', desc: 'Runs daily at 12:00 AM' },
    { label: 'Daily at 9 AM', expression: '0 9 * * *', desc: 'Runs daily at 9:00 AM' },
    { label: 'Weekly (Sunday)', expression: '0 0 * * 0', desc: 'Runs every Sunday at midnight' },
    { label: 'Monthly (1st)', expression: '0 0 1 * *', desc: 'Runs on the 1st of every month' },
    { label: 'Yearly (Jan 1st)', expression: '0 0 1 1 *', desc: 'Runs on January 1st every year' },
    { label: 'Weekdays at 9 AM', expression: '0 9 * * 1-5', desc: 'Runs Monday to Friday at 9:00 AM' },
    { label: 'Every 15 minutes', expression: '*/15 * * * *', desc: 'Runs every 15 minutes' },
    { label: 'Twice daily', expression: '0 9,21 * * *', desc: 'Runs at 9:00 AM and 9:00 PM' },
    { label: 'Every 6 hours', expression: '0 */6 * * *', desc: 'Runs every 6 hours' }
  ];

  const parseCronExpression = (cron: string): string => {
    const parts = cron.trim().split(/\s+/);
    if (parts.length !== 5) {
      return 'Invalid cron expression (must have 5 parts)';
    }

    const [minute, hour, day, month, weekday] = parts;
    
    let desc = 'Runs ';
    
    // Frequency
    if (minute === '*' && hour === '*' && day === '*' && month === '*' && weekday === '*') {
      desc += 'every minute';
    } else if (minute.startsWith('*/') && hour === '*' && day === '*' && month === '*' && weekday === '*') {
      desc += `every ${minute.slice(2)} minutes`;
    } else if (hour.startsWith('*/') && day === '*' && month === '*' && weekday === '*') {
      desc += `every ${hour.slice(2)} hours`;
    } else if (day === '*' && month === '*' && weekday === '*') {
      desc += 'daily';
    } else if (month === '*' && weekday !== '*') {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      if (weekday.includes('-')) {
        const [start, end] = weekday.split('-').map(Number);
        desc += `weekly on ${days[start]} through ${days[end]}`;
      } else if (weekday.includes(',')) {
        const dayList = weekday.split(',').map(d => days[parseInt(d)]).join(', ');
        desc += `weekly on ${dayList}`;
      } else {
        desc += `weekly on ${days[parseInt(weekday)]}`;
      }
    } else if (day !== '*' && month === '*') {
      desc += `monthly on the ${day}${getOrdinalSuffix(parseInt(day))}`;
    } else if (month !== '*') {
      const months = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];
      desc += `yearly in ${months[parseInt(month) - 1]}`;
    }
    
    // Time
    if (hour !== '*' && minute !== '*') {
      const h = parseInt(hour);
      const m = parseInt(minute);
      const time = new Date();
      time.setHours(h, m, 0, 0);
      desc += ` at ${time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (hour !== '*') {
      desc += ` at hour ${hour}`;
    } else if (minute !== '*') {
      desc += ` at minute ${minute}`;
    }
    
    return desc;
  };

  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };
  const calculateNextRuns = (cron: string, count: number = 5): string[] => {
    const parts = cron.trim().split(/\s+/);
    if (parts.length !== 5) return [];

    const [minute, hour, day, month, weekday] = parts;
    const runs: string[] = [];
    const now = new Date();
    let current = new Date(now);
    current.setSeconds(0, 0);

    for (let i = 0; i < count && runs.length < count; i++) {
      current = new Date(current.getTime() + 60000); // Add 1 minute
      
      if (matchesCron(current, minute, hour, day, month, weekday)) {
        runs.push(current.toLocaleString());
        current = new Date(current.getTime() + 60000); // Skip to next minute
      }
      
      // Prevent infinite loop
      if (i > 10000) break;
    }
    
    return runs;
  };

  const matchesCron = (date: Date, minute: string, hour: string, day: string, month: string, weekday: string): boolean => {
    const m = date.getMinutes();
    const h = date.getHours();
    const d = date.getDate();
    const mon = date.getMonth() + 1;
    const w = date.getDay();

    return matchesField(m, minute) &&
           matchesField(h, hour) &&
           matchesField(d, day) &&
           matchesField(mon, month) &&
           matchesField(w, weekday);
  };

  const matchesField = (value: number, field: string): boolean => {
    if (field === '*') return true;
    
    if (field.includes('/')) {
      const [range, step] = field.split('/');
      const stepNum = parseInt(step);
      if (range === '*') {
        return value % stepNum === 0;
      }
    }
    
    if (field.includes(',')) {
      return field.split(',').some(v => parseInt(v) === value);
    }
    
    if (field.includes('-')) {
      const [start, end] = field.split('-').map(Number);
      return value >= start && value <= end;
    }
    
    return parseInt(field) === value;
  };

  const analyzeCron = () => {
    setError('');
    if (!cronExpression.trim()) {
      setError('Cron expression is required');
      return;
    }

    try {
      // Normalize the cron expression first
      const normalizedCron = normalizeCronExpression(cronExpression);
      
      // Update the input field with the normalized version if it changed
      if (normalizedCron !== cronExpression) {
        setCronExpression(normalizedCron);
      }
      
      const desc = parseCronExpression(normalizedCron);
      const runs = calculateNextRuns(normalizedCron);
      
      setDescription(desc);
      setNextRuns(runs);
      
      const result = `Cron Expression: ${normalizedCron}
Description: ${desc}
Next 5 runs:
${runs.map((run, i) => `${i + 1}. ${run}`).join('\n')}`;
      
      addToHistory(result, 'Cron Calculator');
    } catch (error) {
      setError('Failed to analyze cron expression');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Left Column - Input */}
      <div className="space-y-4">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Cron Expression
        </h3>

        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={cronExpression}
              onChange={(e) => handleCronInputChange(e.target.value)}
              placeholder="0 0 * * *"
              className={`flex-1 border rounded-lg p-3 font-mono ${inputClass}`}
            />
            <button
              onClick={analyzeCron}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Analyze
            </button>
          </div>
          
          {cronExpression && (
            <div className="flex justify-between items-center">
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                Format: minute hour day month weekday (0-6, Sunday=0)
                {!cronExpression.includes(' ') && cronExpression.length >= 5 && (
                  <span className={`ml-2 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    • Spaces will be added automatically when analyzed
                  </span>
                )}
              </p>
              <button
                onClick={() => copySpecificItem(cronExpression, 'cron-expression')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  copiedStates['cron-expression']
                    ? 'bg-green-600 text-white'
                    : darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {copiedStates['cron-expression'] ? 'Copied!' : 'Copy Expression'}
              </button>
            </div>
          )}
        </div>

        {/* Preset Templates */}
        <div className="space-y-3">
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Common Schedules
          </label>
          <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
            {cronPresets.map((preset, index) => (
              <button
                key={index}
                onClick={() => setCronExpression(preset.expression)}
                className={`text-left p-3 rounded-lg border transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-300' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="font-medium text-sm">{preset.label}</div>
                <div className={`text-xs font-mono ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  {preset.expression}
                </div>
                <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                  {preset.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cron Format Reference */}
        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Format Reference
          </h4>
          <div className={`text-xs space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="grid grid-cols-5 gap-2 font-mono">
              <div>* * * * *</div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              <div>minute</div>
              <div>hour</div>
              <div>day</div>
              <div>month</div>
              <div>weekday</div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              <div>0-59</div>
              <div>0-23</div>
              <div>1-31</div>
              <div>1-12</div>
              <div>0-6</div>
            </div>
            <p className="pt-2"><strong>Special:</strong> * (any), , (list), - (range), / (step)</p>
          </div>
        </div>
      </div>

      {/* Right Column - Output */}
      <div className="space-y-4">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Analysis
        </h3>

        <div className={`w-full h-96 border rounded-lg overflow-auto ${
          darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'
        }`}>
          {description || nextRuns.length > 0 ? (
            <div className="p-4 space-y-4">
              {description && (
                <div className={`p-3 rounded-lg border ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Description
                    </h4>
                    <button
                      onClick={() => copySpecificItem(description, 'description')}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        copiedStates['description']
                          ? 'bg-green-600 text-white'
                          : darkMode
                            ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {copiedStates['description'] ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{description}</p>
                </div>
              )}

              {nextRuns.length > 0 && (
                <div className={`p-3 rounded-lg border ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Next 5 Executions
                    </h4>
                    <button
                      onClick={() => copySpecificItem(nextRuns.join('\n'), 'next-runs')}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        copiedStates['next-runs']
                          ? 'bg-green-600 text-white'
                          : darkMode
                            ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {copiedStates['next-runs'] ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className={`space-y-1 font-mono text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {nextRuns.map((run, index) => (
                      <div key={index}>{index + 1}. {run}</div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-gray-600">
                <button
                  onClick={() => copySpecificItem(`Cron Expression: ${cronExpression}
Description: ${description}
Next 5 runs:
${nextRuns.map((run, i) => `${i + 1}. ${run}`).join('\n')}`, 'all-analysis')}
                  className={`w-full px-3 py-2 text-sm rounded-md transition-colors ${
                    copiedStates['all-analysis']
                      ? 'bg-green-600 text-white'
                      : darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {copiedStates['all-analysis'] ? 'Copied All!' : 'Copy Full Analysis'}
                </button>
              </div>
            </div>
          ) : (
            <div className={`text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-40`}>
              Cron analysis will appear here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}