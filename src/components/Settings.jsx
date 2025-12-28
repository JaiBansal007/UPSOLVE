import { useState, useEffect } from 'react';
import { storage } from '../services/firebaseStorage';

export default function Settings({ onSettingsChange }) {
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
    <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-5 border border-white/20">
      <h2 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
        <span className="text-xl">⚙️</span> Settings
      </h2>
      
      {/* Codeforces Handle */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Codeforces Handle
        </label>
        {!isEditing ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 text-sm">
              {cfHandle || <span className="text-gray-400">Not set</span>}
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition whitespace-nowrap"
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
              placeholder="e.g., Jx07"
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
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
              className="px-3 py-1.5 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg text-xs font-medium transition"
            >
              Cancel
            </button>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Auto-fetch solved status
        </p>
      </div>
    </div>
  );
}
