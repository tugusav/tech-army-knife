import React, { useState } from 'react';
import { useHistory } from '../../contexts/HistoryContext';

interface CronToolProps {
  darkMode: boolean;
  copied: boolean;
  copyToClipboard: (text: string) => void;
  setError: (error: string) => void;
}

export function CronTool({ darkMode, copied, copyToClipboard, setError }: CronToolProps) {
  const [cronParts, setCronParts] = useState(['0', '0', '*', '*', '*']); // [minute, hour, day, month, weekday]
  const [description, setDescription] = useState('');
  const [nextRuns, setNextRuns] = useState<string[]>([]);
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});
  const { addToHistory } = useHistory();

  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white text-center' : 'bg-white border-gray-300 text-gray-900 text-center';

  const copySpecificItem = (value: string, itemKey: string) => {
    copyToClipboard(value);
    setCopiedStates({ ...copiedStates, [itemKey]: true });
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [itemKey]: false }));
    }, 1500);
  };

  // Update individual cron part
  const updateCronPart = (index: number, value: string) => {
    const newParts = [...cronParts];
    newParts[index] = value;
    setCronParts(newParts);
  };

  // Get the full cron expression
  const getCronExpression = () => cronParts.join(' ');

  const loadPreset = (expression: string) => {
    const parts = expression.split(' ');
    if (parts.length === 5) {
      setCronParts(parts);
    }
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

  const isPlainNumber = (f: string) => /^\d+$/.test(f);

  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  const formatTime = (hour: string, minute: string): string => {
    const formatHHMM = (h: number, m: number) => {
      const time = new Date();
      time.setHours(h, m, 0, 0);
      return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (isPlainNumber(hour) && isPlainNumber(minute)) {
      return ` at ${formatHHMM(parseInt(hour), parseInt(minute))}`;
    }
    if (isPlainNumber(minute) && hour.includes(',')) {
      const m = parseInt(minute);
      const list = hour.split(',').filter(isPlainNumber).map(h => formatHHMM(parseInt(h), m));
      if (list.length === 2) return ` at ${list[0]} and ${list[1]}`;
      if (list.length > 2) return ` at ${list.slice(0, -1).join(', ')}, and ${list[list.length - 1]}`;
    }
    if (isPlainNumber(minute) && hour.includes('-') && !hour.includes('/')) {
      const [start, end] = hour.split('-').map(Number);
      const m = parseInt(minute);
      return ` every hour from ${formatHHMM(start, m)} to ${formatHHMM(end, m)}`;
    }
    if (isPlainNumber(hour)) return ` at hour ${hour}`;
    if (isPlainNumber(minute)) return ` at minute ${minute}`;
    return '';
  };

  const parseCronExpression = (cron: string): string => {
    const parts = cron.trim().split(/\s+/);
    if (parts.length !== 5) {
      return 'Invalid cron expression (must have 5 parts)';
    }

    const [minute, hour, day, month, weekday] = parts;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];

    let freq = '';
    let appendTime = true;

    if (minute === '*' && hour === '*' && day === '*' && month === '*' && weekday === '*') {
      freq = 'every minute';
      appendTime = false;
    } else if (/^\*\/\d+$/.test(minute) && hour === '*' && day === '*' && month === '*' && weekday === '*') {
      freq = `every ${minute.slice(2)} minutes`;
      appendTime = false;
    } else if (/^\*\/\d+$/.test(hour) && day === '*' && month === '*' && weekday === '*') {
      freq = `every ${hour.slice(2)} hours`;
      if (isPlainNumber(minute) && parseInt(minute) !== 0) {
        freq += ` at minute ${minute}`;
      }
      appendTime = false;
    } else if (hour === '*' && day === '*' && month === '*' && weekday === '*') {
      freq = isPlainNumber(minute) ? `every hour at minute ${minute}` : 'every hour';
      appendTime = false;
    } else if (day === '*' && month === '*' && weekday === '*') {
      freq = 'daily';
    } else if (month === '*' && weekday !== '*' && day === '*') {
      if (weekday.includes('-')) {
        const [start, end] = weekday.split('-').map(Number);
        freq = `weekly on ${days[start]} through ${days[end]}`;
      } else if (weekday.includes(',')) {
        const dayList = weekday.split(',').map(d => days[parseInt(d)]).filter(Boolean).join(', ');
        freq = `weekly on ${dayList}`;
      } else if (isPlainNumber(weekday)) {
        freq = `weekly on ${days[parseInt(weekday)]}`;
      } else {
        freq = `on weekdays matching "${weekday}"`;
      }
    } else if (day !== '*' && month === '*' && weekday === '*') {
      freq = isPlainNumber(day)
        ? `monthly on the ${day}${getOrdinalSuffix(parseInt(day))}`
        : `on day "${day}" of every month`;
    } else if (month !== '*') {
      const monthName = isPlainNumber(month) ? months[parseInt(month) - 1] : month;
      freq = isPlainNumber(day)
        ? `yearly on ${monthName} ${day}${getOrdinalSuffix(parseInt(day))}`
        : `yearly in ${monthName}`;
    } else {
      freq = `on schedule "${cron}"`;
    }

    let desc = `Runs ${freq}`;
    if (appendTime) desc += formatTime(hour, minute);
    return desc;
  };

  const normalizeWeekday = (field: string): string => {
    if (field === '*') return field;
    if (/^\d+-7$/.test(field)) {
      const start = parseInt(field.split('-')[0]);
      const list: number[] = [];
      for (let i = start; i <= 6; i++) list.push(i);
      list.push(0);
      return list.join(',');
    }
    return field.replace(/(?<![\d-])7(?!\d)/g, '0');
  };

  const matchesField = (value: number, field: string): boolean => {
    if (field === '*') return true;

    if (field.includes(',')) {
      return field.split(',').some(item => matchesField(value, item));
    }

    if (field.includes('/')) {
      const [rangePart, stepStr] = field.split('/');
      const stepNum = parseInt(stepStr);
      if (isNaN(stepNum) || stepNum <= 0) return false;

      let start: number;
      let end: number;
      if (rangePart === '*') {
        start = 0;
        end = Infinity;
      } else if (rangePart.includes('-')) {
        [start, end] = rangePart.split('-').map(Number);
      } else {
        start = parseInt(rangePart);
        end = Infinity;
      }
      if (isNaN(start) || (end !== Infinity && isNaN(end))) return false;
      if (value < start || value > end) return false;
      return (value - start) % stepNum === 0;
    }

    if (field.includes('-')) {
      const [start, end] = field.split('-').map(Number);
      return value >= start && value <= end;
    }

    return parseInt(field) === value;
  };

  // Cron spec: when day-of-month and day-of-week are both restricted,
  // the schedule fires when EITHER matches (not both).
  const matchesDayCombo = (date: Date, day: string, weekday: string): boolean => {
    const d = date.getDate();
    const w = date.getDay();
    const wField = normalizeWeekday(weekday);

    if (day === '*' && weekday === '*') return true;
    if (day === '*') return matchesField(w, wField);
    if (weekday === '*') return matchesField(d, day);
    return matchesField(d, day) || matchesField(w, wField);
  };

  const calculateNextRuns = (cron: string, count: number = 5): string[] => {
    const parts = cron.trim().split(/\s+/);
    if (parts.length !== 5) return [];

    const [minute, hour, day, month, weekday] = parts;
    const runs: string[] = [];
    let current = new Date();
    current.setSeconds(0, 0);
    current = new Date(current.getTime() + 60000);

    // 10-year horizon so yearly schedules can yield 5 runs; smart skipping keeps this fast.
    const deadline = current.getTime() + 10 * 366 * 24 * 60 * 60 * 1000;

    while (current.getTime() < deadline && runs.length < count) {
      if (!matchesField(current.getMonth() + 1, month)) {
        current = new Date(current.getFullYear(), current.getMonth() + 1, 1, 0, 0, 0, 0);
        continue;
      }
      if (!matchesDayCombo(current, day, weekday)) {
        current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1, 0, 0, 0, 0);
        continue;
      }
      if (!matchesField(current.getHours(), hour)) {
        current = new Date(current.getFullYear(), current.getMonth(), current.getDate(), current.getHours() + 1, 0, 0, 0);
        continue;
      }
      if (!matchesField(current.getMinutes(), minute)) {
        current = new Date(current.getTime() + 60000);
        continue;
      }
      runs.push(current.toLocaleString());
      current = new Date(current.getTime() + 60000);
    }

    return runs;
  };

  const analyzeCron = () => {
    setError('');
    const cronExpression = getCronExpression();
    
    if (!cronExpression.trim()) {
      setError('Cron expression is required');
      return;
    }

    try {
      const desc = parseCronExpression(cronExpression);
      const runs = calculateNextRuns(cronExpression);
      
      setDescription(desc);
      setNextRuns(runs);
      
      const result = `Cron Expression: ${cronExpression}
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

        <div className="space-y-4">
          {/* 5 Separate Input Boxes */}
          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: 'Min', placeholder: '0-59', index: 0 },
                { label: 'Hour', placeholder: '0-23', index: 1 },
                { label: 'Day', placeholder: '1-31', index: 2 },
                { label: 'Month', placeholder: '1-12', index: 3 },
                { label: 'Weekday', placeholder: '0-6', index: 4 }
              ].map((field) => (
                <div key={field.index} className="text-center">
                  <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={cronParts[field.index]}
                    onChange={(e) => updateCronPart(field.index, e.target.value)}
                    placeholder={field.placeholder}
                    className={`w-full h-12 border rounded-lg font-mono text-lg font-bold ${inputClass}`}
                  />
                </div>
              ))}
            </div>
            
            <div className="text-center">
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                Current expression: <span className="font-mono font-bold">{getCronExpression()}</span>
              </p>
            </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={analyzeCron}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium text-lg rounded-lg transition-colors"
          >
            Analyze Cron Expression
          </button>

          {/* Copy Expression Button */}
          {getCronExpression() && (
            <button
              onClick={() => copySpecificItem(getCronExpression(), 'cron-expression')}
              className={`w-full py-2 text-sm rounded-lg transition-colors ${
                copiedStates['cron-expression']
                  ? 'bg-green-600 text-white'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {copiedStates['cron-expression'] ? 'Copied Expression!' : 'Copy Expression'}
            </button>
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
                onClick={() => loadPreset(preset.expression)}
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
                  onClick={() => copySpecificItem(`Cron Expression: ${getCronExpression()}
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