import { useState, useEffect } from 'react';
import { storage } from '../services/firebaseStorage';

export default function Settings({ onSettingsChange, darkMode }) {
  const [cfHandle, setCfHandle] = useState('');
  const [tempHandle, setTempHandle] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await storage.getSettings();
        setCfHandle(settings.cfHandle || '');
        setTempHandle(settings.cfHandle || '');
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  const handleSaveHandle = async () => {
    try {
      await storage.setCfHandle(tempHandle);
      setCfHandle(tempHandle);
      setIsEditing(false);
      if (onSettingsChange) {
        onSettingsChange();
      }
    } catch (error) {
      console.error('Error saving handle:', error);
      alert('Failed to save handle. Please try again.');
    }
  };

  return (
    <div className={`backdrop-blur rounded-xl shadow-lg p-5 border transition-colors duration-200 ${
      darkMode 
        ? 'bg-gray-800/95 border-gray-700' 
        : 'bg-white/95 border-white/20'
    }`}>
      <h2 className={`text-lg font-bold mb-3 flex items-center gap-2 ${
        darkMode ? 'text-gray-100' : 'text-purple-800'
      }`}>
        <span className="text-xl">⚙️</span> Settings
      </h2>
      
      {/* Codeforces Handle */}
      <div>
        <label className={`block text-xs font-semibold mb-1.5 ${
          darkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Codeforces Handle
        </label>
        {!isEditing ? (
          <div className="flex items-center gap-2">
            <div className={`flex-1 px-3 py-1.5 rounded-lg border text-sm ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-200' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              {cfHandle || <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>Not set</span>}
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                darkMode
                  ? 'bg-gray-600 hover:bg-gray-500 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {cfHandle ? 'Edit' : 'Set'}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tempHandle}
              onChange={(e) => setTempHandle(e.target.value)}
              placeholder="e.g., tourist"
              className={`flex-1 px-3 py-1.5 border rounded-lg text-sm transition-colors ${
                darkMode
                  ? 'border-gray-600 bg-gray-700 text-white focus:ring-gray-500 focus:border-transparent'
                  : 'border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
              }`}
              autoFocus
            />
            <button
              onClick={handleSaveHandle}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition"
            >
              Save
            </button>
            <button
              onClick={() => {
                setTempHandle(cfHandle);
                setIsEditing(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                darkMode
                  ? 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                  : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
              }`}
            >
              Cancel
            </button>
          </div>
        )}
        <p className={`text-xs mt-1 ${
          darkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          Auto-fetch solved status
        </p>
      </div>
    </div>
  );
}
