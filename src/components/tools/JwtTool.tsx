// src/components/tools/JwtTool.tsx
import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface JwtToolProps {
  darkMode: boolean;
  copied: boolean;
  copyToClipboard: (text: string) => void;
  setError: (error: string) => void;
}

export function JwtTool({ darkMode, copied, copyToClipboard, setError }: JwtToolProps) {
  const [jwtInput, setJwtInput] = useState('');
  const [decoded, setDecoded] = useState<any>(null);
  const [payload, setPayload] = useState('');
  const [secret, setSecret] = useState('');
  const [encoded, setEncoded] = useState('');

  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  const decodeJWT = () => {
    try {
      const parts = jwtInput.split('.');
      if (parts.length !== 3) throw new Error('Invalid JWT format');
      const header = JSON.parse(atob(parts[0]));
      const payloadData = JSON.parse(atob(parts[1]));
      setDecoded({ header, payload: payloadData });
      setError('');
    } catch (e: any) {
      setError('Invalid JWT: ' + e.message);
    }
  };

  const encodeJWT = async () => {
    try {
      const header = { alg: 'HS256', typ: 'JWT' };
      const enc = (o: any) => btoa(JSON.stringify(o)).replace(/=/g, '');

      const unsigned = enc(header) + '.' + enc(JSON.parse(payload));

      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(unsigned));

      const signature = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      setEncoded(unsigned + '.' + signature);
      setError('');
    } catch (e: any) {
      setError('Error encoding JWT: ' + e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Decoder Section */}
      <div>
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-900'} mb-3`}>
          JWT Decoder
        </h3>
        <div className="space-y-3">
          <textarea
            value={jwtInput}
            onChange={(e) => setJwtInput(e.target.value)}
            className={`w-full h-28 border rounded-lg p-3 font-mono text-sm ${inputClass}`}
            placeholder="Paste JWT token here..."
          />
          <button
            onClick={decodeJWT}
            className={`${
              darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
            } text-white px-6 py-2 rounded-lg transition-colors`}
          >
            Decode JWT
          </button>

          {decoded && (
            <div>
              <pre
                className={`${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-900'
                } p-4 rounded-lg text-sm overflow-auto`}
              >
                {JSON.stringify(decoded, null, 2)}
              </pre>
              <button
                onClick={() => copyToClipboard(JSON.stringify(decoded, null, 2))}
                className={`mt-2 flex items-center gap-2 px-3 py-1 ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                } rounded-lg transition-colors text-sm`}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
        </div>
      </div>

      <hr className={darkMode ? 'border-gray-700' : 'border-gray-200'} />

      {/* Encoder Section */}
      <div>
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-900'} mb-3`}>
          JWT Encoder
        </h3>
        <div className="space-y-3">
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Payload (JSON)
            </label>
            <textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              className={`w-full h-28 border rounded-lg p-3 font-mono text-sm ${inputClass}`}
              placeholder='{"sub": "1234567890", "name": "John Doe", "iat": 1516239022}'
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Secret Key
            </label>
            <input
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className={`w-full border rounded-lg p-3 font-mono text-sm ${inputClass}`}
              placeholder="your-256-bit-secret"
            />
          </div>

          <button
            onClick={encodeJWT}
            className={`${
              darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700'
            } text-white px-6 py-2 rounded-lg transition-colors`}
          >
            Encode JWT
          </button>

          {encoded && (
            <div>
              <pre
                className={`${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-900'
                } p-4 rounded-lg text-sm overflow-auto break-all`}
              >
                {encoded}
              </pre>
              <button
                onClick={() => copyToClipboard(encoded)}
                className={`mt-2 flex items-center gap-2 px-3 py-1 ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                } rounded-lg transition-colors text-sm`}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}