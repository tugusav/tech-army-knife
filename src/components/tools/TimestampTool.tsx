import React, { useState, useEffect } from 'react';
import { OutputBox } from '../common/OutputBox';
import { useHistory } from '../../contexts/HistoryContext';

interface TimestampToolProps {
  darkMode: boolean;
  copied: boolean;
  copyToClipboard: (text: string) => void;
  setError: (error: string) => void;
}

export function TimestampTool({ darkMode, copied, copyToClipboard, setError }: TimestampToolProps) {
  const [currentTimestamp, setCurrentTimestamp] = useState(Math.floor(Date.now() / 1000));
  const [inputTimestamp, setInputTimestamp] = useState('');
  const [inputDate, setInputDate] = useState('');
  const [convertedResult, setConvertedResult] = useState('');
  const [mode, setMode] = useState<'current' | 'convert' | 'generate'>('current');
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});
  const [selectedTimezone, setSelectedTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const { addToHistory } = useHistory();

  const copySpecificFormat = (value: string, formatKey: string) => {
    copyToClipboard(value);
    setCopiedStates({ ...copiedStates, [formatKey]: true });
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [formatKey]: false }));
    }, 1500);
  };

  const copyAllFormats = () => {
    copyToClipboard(convertedResult);
    setCopiedStates({ ...copiedStates, 'all': true });
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, 'all': false }));
    }, 1500);
  };

  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  // Common timezones
  const commonTimezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Australia/Sydney',
    Intl.DateTimeFormat().resolvedOptions().timeZone // User's local timezone
  ];

  // Update current timestamp every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimestamp(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return {
      unix: timestamp,
      iso: date.toISOString(),
      utc: date.toUTCString(),
      local: date.toLocaleString(),
      timezone: date.toLocaleString('en-US', { timeZone: selectedTimezone }),
      date: date.toDateString(),
      time: date.toTimeString(),
    };
  };
  const convertTimestamp = () => {
    setError('');
    if (!inputTimestamp.trim()) {
      setError('Timestamp is required');
      return;
    }

    try {
      const timestamp = parseInt(inputTimestamp);
      if (isNaN(timestamp)) {
        setError('Invalid timestamp format');
        return;
      }

      // Handle both seconds and milliseconds
      const normalizedTimestamp = timestamp.toString().length === 13 ? Math.floor(timestamp / 1000) : timestamp;
      const formatted = formatTimestamp(normalizedTimestamp);
      
      const result = `Unix Timestamp: ${formatted.unix}
ISO 8601: ${formatted.iso}
UTC: ${formatted.utc}
Local: ${formatted.local}
Date: ${formatted.date}
Time: ${formatted.time}`;

      setConvertedResult(result);
      addToHistory(result, 'Timestamp Converter');
    } catch (error) {
      setError('Failed to convert timestamp');
    }
  };

  const convertDateToTimestamp = () => {
    setError('');
    if (!inputDate.trim()) {
      setError('Date is required');
      return;
    }

    try {
      let date: Date;
      
      // Check if it's datetime-local format (YYYY-MM-DDTHH:mm)
      if (inputDate.includes('T') && inputDate.length === 16) {
        date = new Date(inputDate);
      } else {
        // Try to parse as regular date string
        date = new Date(inputDate);
      }
      
      if (isNaN(date.getTime())) {
        setError('Invalid date format');
        return;
      }

      const timestamp = Math.floor(date.getTime() / 1000);
      const formatted = formatTimestamp(timestamp);
      
      const result = `Unix Timestamp: ${formatted.unix}
ISO 8601: ${formatted.iso}
UTC: ${formatted.utc}
Local: ${formatted.local}`;

      setConvertedResult(result);
      addToHistory(result, 'Date to Timestamp');
    } catch (error) {
      setError('Failed to convert date');
    }
  };

  const getCurrentFormatted = () => {
    const formatted = formatTimestamp(currentTimestamp);
    const result = `Current Unix Timestamp: ${formatted.unix}
ISO 8601: ${formatted.iso}
UTC: ${formatted.utc}
Local: ${formatted.local}
Date: ${formatted.date}
Time: ${formatted.time}`;
    
    addToHistory(result, 'Current Timestamp');
    return result;
  };

  // Update presetTimestamps to be reactive to timezone changes
  const getPresetTimestamps = () => [
    { 
      label: 'Now', 
      value: () => Math.floor(Date.now() / 1000) 
    },
    { 
      label: 'Start of Today', 
      value: () => {
        const now = new Date();
        // Get the current time in the selected timezone
        const timeInTimezone = new Date(now.toLocaleString('en-US', { timeZone: selectedTimezone }));
        const startOfDay = new Date(timeInTimezone.getFullYear(), timeInTimezone.getMonth(), timeInTimezone.getDate(), 0, 0, 0, 0);
        return Math.floor(startOfDay.getTime() / 1000);
      }
    },
    { 
      label: 'End of Today', 
      value: () => {
        const now = new Date();
        const timeInTimezone = new Date(now.toLocaleString('en-US', { timeZone: selectedTimezone }));
        const endOfDay = new Date(timeInTimezone.getFullYear(), timeInTimezone.getMonth(), timeInTimezone.getDate(), 23, 59, 59, 999);
        return Math.floor(endOfDay.getTime() / 1000);
      }
    },
    { 
      label: 'Start of Week', 
      value: () => {
        const now = new Date();
        const timeInTimezone = new Date(now.toLocaleString('en-US', { timeZone: selectedTimezone }));
        const startOfWeek = new Date(timeInTimezone);
        startOfWeek.setDate(timeInTimezone.getDate() - timeInTimezone.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return Math.floor(startOfWeek.getTime() / 1000);
      }
    },
    { 
      label: 'Start of Month', 
      value: () => {
        const now = new Date();
        const timeInTimezone = new Date(now.toLocaleString('en-US', { timeZone: selectedTimezone }));
        const startOfMonth = new Date(timeInTimezone.getFullYear(), timeInTimezone.getMonth(), 1, 0, 0, 0, 0);
        return Math.floor(startOfMonth.getTime() / 1000);
      }
    },
    { 
      label: 'Start of Year', 
      value: () => {
        const now = new Date();
        const timeInTimezone = new Date(now.toLocaleString('en-US', { timeZone: selectedTimezone }));
        const startOfYear = new Date(timeInTimezone.getFullYear(), 0, 1, 0, 0, 0, 0);
        return Math.floor(startOfYear.getTime() / 1000);
      }
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Left Column - Input */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Input
          </h3>
          <div className="flex gap-1">
            {[
              { id: 'current', label: 'Current' },
              { id: 'convert', label: 'Convert' },
              { id: 'generate', label: 'Generate' }
            ].map((modeOption) => (
              <button
                key={modeOption.id}
                onClick={() => setMode(modeOption.id as any)}
                className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${
                  mode === modeOption.id
                    ? 'bg-blue-600 text-white'
                    : darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {modeOption.label}
              </button>
            ))}
          </div>
        </div>

        {/* Timezone Picker */}
        <div className="space-y-2">
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Timezone
          </label>
          <select
            value={selectedTimezone}
            onChange={(e) => setSelectedTimezone(e.target.value)}
            className={`w-full border rounded-lg p-3 ${inputClass}`}
          >
            {commonTimezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz} {tz === Intl.DateTimeFormat().resolvedOptions().timeZone ? '(Local)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Current Time Mode */}
        {mode === 'current' && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <h4 className={`text-sm font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Current Timestamp
              </h4>
              <div className={`space-y-2 font-mono text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <div>Unix: {currentTimestamp}</div>
                <div>ISO: {new Date().toISOString()}</div>
                <div>Local: {new Date().toLocaleString()}</div>
                <div>Timezone ({selectedTimezone.split('/').pop()}): {new Date().toLocaleString('en-US', { timeZone: selectedTimezone })}</div>
              </div>
            </div>
          </div>
        )}

        {/* Convert Timestamp Mode */}
        {mode === 'convert' && (
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Unix Timestamp
              </label>
              <input
                type="text"
                value={inputTimestamp}
                onChange={(e) => setInputTimestamp(e.target.value)}
                placeholder="1640995200 or 1640995200000"
                className={`w-full border rounded-lg p-3 font-mono ${inputClass}`}
              />
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                Supports both seconds and milliseconds
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Quick Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                {getPresetTimestamps().slice(0, 6).map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setInputTimestamp(preset.value().toString())}
                    className={`text-xs p-2 rounded ${
                      darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    } transition-colors`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons - Moved below inputs */}
        <div className="space-y-3 pt-4 border-t border-gray-600">
          {mode === 'current' && (
            <button
              onClick={() => copyToClipboard(getCurrentFormatted())}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 text-lg rounded-lg transition-colors"
            >
              Copy Current Timestamp Info
            </button>
          )}
          
          {mode === 'convert' && (
            <button
              onClick={convertTimestamp}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 text-lg rounded-lg transition-colors"
            >
              Convert Timestamp
            </button>
          )}
          
          {mode === 'generate' && (
            <button
              onClick={convertDateToTimestamp}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 text-lg rounded-lg transition-colors"
            >
              Generate Timestamp
            </button>
          )}
        </div>

        {/* Generate from Date Mode */}
        {mode === 'generate' && (
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Date & Time
              </label>
              <div className="space-y-3">
                <div>
                  <label className={`block text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                    Date/Time Picker
                  </label>
                  <input
                    type="datetime-local"
                    value={inputDate}
                    onChange={(e) => setInputDate(e.target.value)}
                    className={`w-full border rounded-lg p-3 ${inputClass}`}
                  />
                </div>
                <div className="relative">
                  <label className={`block text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                    Or enter manually
                  </label>
                  <input
                    type="text"
                    value={inputDate}
                    onChange={(e) => setInputDate(e.target.value)}
                    placeholder="2024-01-01 12:00:00, January 1 2024, etc."
                    className={`w-full border rounded-lg p-3 ${inputClass}`}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Quick Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const now = new Date();
                    // Get current time in selected timezone and format for datetime-local input
                    const timeInTimezone = new Date(now.toLocaleString('en-US', { timeZone: selectedTimezone }));
                    const year = timeInTimezone.getFullYear();
                    const month = String(timeInTimezone.getMonth() + 1).padStart(2, '0');
                    const day = String(timeInTimezone.getDate()).padStart(2, '0');
                    const hours = String(timeInTimezone.getHours()).padStart(2, '0');
                    const minutes = String(timeInTimezone.getMinutes()).padStart(2, '0');
                    setInputDate(`${year}-${month}-${day}T${hours}:${minutes}`);
                  }}
                  className={`text-sm p-2 rounded ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  } transition-colors`}
                >
                  Now ({selectedTimezone.split('/').pop()})
                </button>
                <button
                  onClick={() => {
                    const now = new Date();
                    const timeInTimezone = new Date(now.toLocaleString('en-US', { timeZone: selectedTimezone }));
                    const year = timeInTimezone.getFullYear();
                    setInputDate(`${year}-01-01T00:00`);
                  }}
                  className={`text-sm p-2 rounded ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  } transition-colors`}
                >
                  Year Start
                </button>
                <button
                  onClick={() => {
                    const now = new Date();
                    const timeInTimezone = new Date(now.toLocaleString('en-US', { timeZone: selectedTimezone }));
                    const year = timeInTimezone.getFullYear();
                    const month = String(timeInTimezone.getMonth() + 1).padStart(2, '0');
                    const day = String(timeInTimezone.getDate()).padStart(2, '0');
                    setInputDate(`${year}-${month}-${day}T00:00`);
                  }}
                  className={`text-sm p-2 rounded ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  } transition-colors`}
                >
                  Start of Today
                </button>
                <button
                  onClick={() => {
                    const now = new Date();
                    const timeInTimezone = new Date(now.toLocaleString('en-US', { timeZone: selectedTimezone }));
                    const year = timeInTimezone.getFullYear();
                    const month = String(timeInTimezone.getMonth() + 1).padStart(2, '0');
                    setInputDate(`${year}-${month}-01T00:00`);
                  }}
                  className={`text-sm p-2 rounded ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  } transition-colors`}
                >
                  Month Start
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const now = new Date();
                    const timeInTimezone = new Date(now.toLocaleString('en-US', { timeZone: selectedTimezone }));
                    const year = timeInTimezone.getFullYear();
                    const month = String(timeInTimezone.getMonth() + 1).padStart(2, '0');
                    const day = String(timeInTimezone.getDate()).padStart(2, '0');
                    setInputDate(`${year}-${month}-${day}T23:59`);
                  }}
                  className={`text-sm p-2 rounded ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  } transition-colors`}
                >
                  End of Today
                </button>
                <button
                  onClick={() => {
                    const now = new Date();
                    const timeInTimezone = new Date(now.toLocaleString('en-US', { timeZone: selectedTimezone }));
                    const year = timeInTimezone.getFullYear();
                    setInputDate(`${year}-12-25T00:00`);
                  }}
                  className={`text-sm p-2 rounded ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  } transition-colors`}
                >
                  Christmas
                </button>
                <button
                  onClick={() => {
                    const now = new Date();
                    const timeInTimezone = new Date(now.toLocaleString('en-US', { timeZone: selectedTimezone }));
                    const nextYear = timeInTimezone.getFullYear() + 1;
                    setInputDate(`${nextYear}-01-01T00:00`);
                  }}
                  className={`text-sm p-2 rounded ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  } transition-colors`}
                >
                  New Year
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Column - Output */}
      <div className="space-y-4">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Output
        </h3>

        <div className={`w-full h-96 border rounded-lg overflow-auto ${
          darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'
        }`}>
          {convertedResult ? (
            <div className="p-4 space-y-3">
              {(() => {
                const lines = convertedResult.split('\n');
                const formats = [
                  { key: 'unix', label: 'Unix Timestamp', value: lines.find(l => l.startsWith('Unix Timestamp:'))?.replace('Unix Timestamp: ', '') || '' },
                  { key: 'iso', label: 'ISO 8601', value: lines.find(l => l.startsWith('ISO 8601:'))?.replace('ISO 8601: ', '') || '' },
                  { key: 'utc', label: 'UTC', value: lines.find(l => l.startsWith('UTC:'))?.replace('UTC: ', '') || '' },
                  { key: 'local', label: 'Local', value: lines.find(l => l.startsWith('Local:'))?.replace('Local: ', '') || '' },
                  { key: 'date', label: 'Date', value: lines.find(l => l.startsWith('Date:'))?.replace('Date: ', '') || '' },
                  { key: 'time', label: 'Time', value: lines.find(l => l.startsWith('Time:'))?.replace('Time: ', '') || '' }
                ].filter(format => format.value);

                return formats.map((format) => (
                  <div key={format.key} className={`p-3 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {format.label}
                      </span>
                      <button
                        onClick={() => copySpecificFormat(format.value, format.key)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          copiedStates[format.key]
                            ? 'bg-green-600 text-white'
                            : darkMode
                              ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {copiedStates[format.key] ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className={`font-mono text-sm break-all ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {format.value}
                    </div>
                  </div>
                ));
              })()}
              
              <div className="pt-2 border-t border-gray-600">
                <button
                  onClick={copyAllFormats}
                  className={`w-full px-3 py-2 text-sm rounded-md transition-colors ${
                    copiedStates['all']
                      ? 'bg-green-600 text-white'
                      : darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {copiedStates['all'] ? 'Copied All!' : 'Copy All Formats'}
                </button>
              </div>
            </div>
          ) : (
            <div className={`text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-40`}>
              Converted timestamp will appear here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}