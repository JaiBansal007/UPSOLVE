import { useState, useEffect } from 'react';
import { getOnlineUsersRef, onValue, setupPresence, auth } from '../services/firebase';
import { codeforcesAPI } from '../services/codeforcesApi';

export default function OnlineUsers({ darkMode, cfHandle }) {
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [cfUserLookup, setCfUserLookup] = useState('');
  const [cfUserInfo, setCfUserInfo] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [showOnlineList, setShowOnlineList] = useState(false);

  // Setup presence when component mounts
  useEffect(() => {
    if (auth.currentUser) {
      setupPresence(auth.currentUser.uid, cfHandle);
    }
  }, [cfHandle]);

  // Listen to online users
  useEffect(() => {
    const presenceRef = getOnlineUsersRef();
    
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const users = Object.entries(data)
          .filter(([_, user]) => user.online)
          .map(([id, user]) => ({
            id,
            cfHandle: user.cfHandle,
            lastSeen: user.lastSeen
          }));
        setOnlineCount(users.length);
        setOnlineUsers(users);
      } else {
        setOnlineCount(0);
        setOnlineUsers([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Lookup CF user last online
  const handleCfLookup = async () => {
    if (!cfUserLookup.trim()) return;
    
    setLookupLoading(true);
    setLookupError('');
    setCfUserInfo(null);

    try {
      const userInfo = await codeforcesAPI.getUserInfo(cfUserLookup.trim());
      setCfUserInfo(userInfo);
    } catch (error) {
      setLookupError('User not found or API error');
    } finally {
      setLookupLoading(false);
    }
  };

  const formatLastOnline = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const getRatingColor = (rating) => {
    if (!rating) return darkMode ? 'text-gray-400' : 'text-gray-600';
    if (rating < 1200) return 'text-gray-500';
    if (rating < 1400) return 'text-green-500';
    if (rating < 1600) return 'text-cyan-500';
    if (rating < 1900) return 'text-blue-500';
    if (rating < 2100) return 'text-purple-500';
    if (rating < 2300) return 'text-yellow-500';
    if (rating < 2400) return 'text-orange-500';
    if (rating < 2600) return 'text-orange-600';
    if (rating < 3000) return 'text-red-500';
    return 'text-red-700';
  };

  const getRank = (rating) => {
    if (!rating) return 'Unrated';
    if (rating < 1200) return 'Newbie';
    if (rating < 1400) return 'Pupil';
    if (rating < 1600) return 'Specialist';
    if (rating < 1900) return 'Expert';
    if (rating < 2100) return 'Candidate Master';
    if (rating < 2300) return 'Master';
    if (rating < 2400) return 'International Master';
    if (rating < 2600) return 'Grandmaster';
    if (rating < 3000) return 'International Grandmaster';
    return 'Legendary Grandmaster';
  };

  return (
    <div className={`rounded-xl shadow-lg p-6 border transition-colors duration-200 ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-200'
    }`}>
      {/* App Online Users */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-bold flex items-center gap-2 ${
            darkMode ? 'text-gray-100' : 'text-purple-800'
          }`}>
            <span className="text-xl">🟢</span> Online Now
          </h3>
          <button
            onClick={() => setShowOnlineList(!showOnlineList)}
            className={`text-sm px-3 py-1 rounded-lg transition-colors ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
            }`}
          >
            {showOnlineList ? 'Hide' : 'Show'} Users
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className={`text-4xl font-bold ${
            darkMode ? 'text-green-400' : 'text-green-600'
          }`}>
            {onlineCount}
          </div>
          <div className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            user{onlineCount !== 1 ? 's' : ''} on CF Upsolve
          </div>
        </div>

        {showOnlineList && onlineUsers.length > 0 && (
          <div className={`mt-4 p-3 rounded-lg ${
            darkMode ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <div className="flex flex-wrap gap-2">
              {onlineUsers.map((user) => (
                <span
                  key={user.id}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                    darkMode
                      ? 'bg-gray-600 text-gray-200'
                      : 'bg-white text-gray-700 border border-gray-200'
                  }`}
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  {user.cfHandle || 'Anonymous'}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CF User Lookup */}
      <div className={`pt-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h3 className={`text-lg font-bold flex items-center gap-2 mb-4 ${
          darkMode ? 'text-gray-100' : 'text-purple-800'
        }`}>
          <span className="text-xl">🔍</span> CF User Lookup
        </h3>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={cfUserLookup}
            onChange={(e) => setCfUserLookup(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCfLookup()}
            placeholder="Enter CF handle..."
            className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
            }`}
          />
          <button
            onClick={handleCfLookup}
            disabled={lookupLoading || !cfUserLookup.trim()}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              darkMode
                ? 'bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 text-white'
                : 'bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white'
            }`}
          >
            {lookupLoading ? '...' : 'Lookup'}
          </button>
        </div>

        {lookupError && (
          <div className={`p-3 rounded-lg mb-4 ${
            darkMode ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-600'
          }`}>
            {lookupError}
          </div>
        )}

        {cfUserInfo && (
          <div className={`p-4 rounded-lg ${
            darkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className="flex items-start gap-4">
              {cfUserInfo.titlePhoto && (
                <img
                  src={cfUserInfo.titlePhoto}
                  alt={cfUserInfo.handle}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <a
                    href={`https://codeforces.com/profile/${cfUserInfo.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`font-bold text-lg hover:underline ${getRatingColor(cfUserInfo.rating)}`}
                  >
                    {cfUserInfo.handle}
                  </a>
                  {cfUserInfo.rating && (
                    <span className={`text-sm font-semibold ${getRatingColor(cfUserInfo.rating)}`}>
                      ({cfUserInfo.rating})
                    </span>
                  )}
                </div>
                
                <div className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {getRank(cfUserInfo.rating)}
                  {cfUserInfo.organization && ` • ${cfUserInfo.organization}`}
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    <span className="font-medium">Last Online:</span>{' '}
                    <span className={cfUserInfo.lastOnlineTimeSeconds && 
                      (Date.now() / 1000 - cfUserInfo.lastOnlineTimeSeconds) < 300
                        ? 'text-green-500 font-semibold'
                        : ''
                    }>
                      {formatLastOnline(cfUserInfo.lastOnlineTimeSeconds)}
                    </span>
                  </div>
                  
                  {cfUserInfo.contribution !== undefined && (
                    <div className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      <span className="font-medium">Contribution:</span>{' '}
                      <span className={cfUserInfo.contribution > 0 ? 'text-green-500' : cfUserInfo.contribution < 0 ? 'text-red-500' : ''}>
                        {cfUserInfo.contribution > 0 ? '+' : ''}{cfUserInfo.contribution}
                      </span>
                    </div>
                  )}
                  
                  {cfUserInfo.friendOfCount !== undefined && (
                    <div className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      <span className="font-medium">Friends:</span> {cfUserInfo.friendOfCount}
                    </div>
                  )}
                </div>

                {cfUserInfo.maxRating && cfUserInfo.maxRating !== cfUserInfo.rating && (
                  <div className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <span className="font-medium">Max Rating:</span>{' '}
                    <span className={getRatingColor(cfUserInfo.maxRating)}>
                      {cfUserInfo.maxRating} ({getRank(cfUserInfo.maxRating)})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
