export default function Navigation({ currentPage, onPageChange, darkMode, onThemeToggle, isVerified, onlineCount = 0, cfHandle }) {
  return (
    <nav className={`shadow-sm transition-colors duration-200 ${
      darkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    } border-b`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Navigation Links */}
          <div className="flex space-x-1">
            <button
              onClick={() => onPageChange('home')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === 'home'
                  ? darkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-purple-100 text-purple-800'
                  : darkMode
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              🏠 Home
            </button>
            <button
              onClick={() => isVerified ? onPageChange('problems') : onPageChange('profile')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === 'problems'
                  ? darkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-purple-100 text-purple-800'
                  : !isVerified
                    ? darkMode
                      ? 'text-gray-500 cursor-not-allowed'
                      : 'text-gray-400 cursor-not-allowed'
                    : darkMode
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              📋 Problems {!isVerified && <span className="ml-1 text-xs">🔒</span>}
            </button>
            <button
              onClick={() => onPageChange('compare')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === 'compare'
                  ? darkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-purple-100 text-purple-800'
                  : darkMode
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              🔍 Compare
            </button>
            <button
              onClick={() => isVerified ? onPageChange('upsolve') : onPageChange('profile')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === 'upsolve'
                  ? darkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-purple-100 text-purple-800'
                  : !isVerified
                    ? darkMode
                      ? 'text-gray-500 cursor-not-allowed'
                      : 'text-gray-400 cursor-not-allowed'
                    : darkMode
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              🎯 Upsolve {!isVerified && <span className="ml-1 text-xs">🔒</span>}
            </button>
          </div>

          {/* Right Side: Online Count, Profile, Theme Toggle */}
          <div className="flex items-center gap-3">
            {/* Online Count */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              darkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className={`text-sm font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {onlineCount} online
              </span>
            </div>

            {/* Profile Button */}
            <button
              onClick={() => onPageChange('profile')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                currentPage === 'profile'
                  ? darkMode
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-600 text-white'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-lg">👤</span>
              <span className="text-sm font-medium">
                {isVerified && cfHandle ? cfHandle : 'Profile'}
              </span>
              {!isVerified && <span className="text-xs">⚠️</span>}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onThemeToggle}
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? 'text-yellow-400 hover:bg-gray-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}