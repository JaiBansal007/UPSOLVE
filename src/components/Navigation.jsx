export default function Navigation({ currentPage, onPageChange, darkMode, isVerified, onlineCount = 0, cfHandle }) {
  return (
    <nav className="relative z-10 shadow-sm bg-gray-800 border-gray-700 border-b">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Navigation Links */}
          <div className="flex space-x-1">
            <button
              onClick={() => onPageChange('home')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === 'home'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              🏠 Home
            </button>
            <button
              onClick={() => isVerified ? onPageChange('problems') : onPageChange('profile')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === 'problems'
                  ? 'bg-gray-700 text-white'
                  : !isVerified
                    ? 'text-gray-500 cursor-not-allowed'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              📋 Problems {!isVerified && <span className="ml-1 text-xs">🔒</span>}
            </button>
            <button
              onClick={() => onPageChange('compare')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === 'compare'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              🔍 Compare
            </button>
            <button
              onClick={() => isVerified ? onPageChange('upsolve') : onPageChange('profile')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === 'upsolve'
                  ? 'bg-gray-700 text-white'
                  : !isVerified
                    ? 'text-gray-500 cursor-not-allowed'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              🎯 Upsolve {!isVerified && <span className="ml-1 text-xs">🔒</span>}
            </button>
          </div>

          {/* Right Side: Online Count, Profile */}
          <div className="flex items-center gap-3">
            {/* Online Count */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-700">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-gray-300">
                {onlineCount} online
              </span>
            </div>

            {/* Profile Button */}
            <button
              onClick={() => onPageChange('profile')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                currentPage === 'profile'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span className="text-lg">👤</span>
              <span className="text-sm font-medium">
                {isVerified && cfHandle ? cfHandle : 'Profile'}
              </span>
              {!isVerified && <span className="text-xs">⚠️</span>}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}