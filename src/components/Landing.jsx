export default function Landing({ darkMode, onNavigate, isVerified, stats = {} }) {
  const { onlineCount = 0, totalVisits = 0, registeredUsers = 0 } = stats;

  const features = [
    {
      icon: '📋',
      title: 'Problem Tracker',
      description: 'Add Codeforces problems to your personal list. Track your progress, mark solved problems, and organize with custom tags.',
      requiresVerification: true
    },
    {
      icon: '🎯',
      title: 'Smart Upsolving',
      description: 'Get personalized recommendations for problems to upsolve from recent Div 1-4 contests. Focus on the next challenge after your last solved problem.',
      requiresVerification: true
    },
    {
      icon: '🔍',
      title: 'User Comparison',
      description: 'Compare any two Codeforces users. Find problems that one user has solved but the other hasn\'t. Great for learning from friends!',
      requiresVerification: false
    },
    {
      icon: '🏷️',
      title: 'Tag & Filter',
      description: 'Organize problems with custom tags, filter by rating range, and hide/show problem tags to avoid spoilers.',
      requiresVerification: true
    },
    {
      icon: '🌙',
      title: 'Dark Mode',
      description: 'Easy on the eyes with full dark mode support. Your preference is saved automatically.',
      requiresVerification: false
    },
    {
      icon: '✅',
      title: 'CF Verification',
      description: 'Verify your Codeforces handle ownership to ensure your data stays secure and private.',
      requiresVerification: false
    }
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className={`text-center py-12 px-6 rounded-2xl ${
        darkMode
          ? 'bg-gradient-to-br from-purple-900/50 to-indigo-900/50'
          : 'bg-gradient-to-br from-purple-100 to-indigo-100'
      }`}>
        <h1 className={`text-5xl font-bold mb-4 ${
          darkMode ? 'text-white' : 'text-purple-900'
        }`}>
          CF Upsolve Tracker
        </h1>
        <p className={`text-xl mb-8 max-w-2xl mx-auto ${
          darkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Your personal companion for mastering Codeforces problems. 
          Track progress, get smart recommendations, and level up your competitive programming skills.
        </p>
        
        <div className="flex justify-center gap-4 flex-wrap">
          {isVerified ? (
            <>
              <button
                onClick={() => onNavigate('problems')}
                className="px-8 py-3 bg-purple-600 text-white rounded-xl font-semibold text-lg hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
              >
                📋 My Problems
              </button>
              <button
                onClick={() => onNavigate('upsolve')}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
              >
                🎯 Start Upsolving
              </button>
            </>
          ) : (
            <button
              onClick={() => onNavigate('profile')}
              className="px-8 py-3 bg-purple-600 text-white rounded-xl font-semibold text-lg hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
            >
              🚀 Get Started - Set Up Profile
            </button>
          )}
          <button
            onClick={() => onNavigate('compare')}
            className={`px-8 py-3 rounded-xl font-semibold text-lg transition-colors shadow-lg hover:shadow-xl ${
              darkMode
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-white text-purple-700 hover:bg-gray-50'
            }`}
          >
            🔍 Compare Users
          </button>
        </div>

        {/* Live Stats */}
        <div className="flex justify-center gap-8 mt-8 flex-wrap">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            darkMode ? 'bg-white/10' : 'bg-white/60'
          }`}>
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className={`font-semibold ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
              {onlineCount}
            </span>
            <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>online now</span>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            darkMode ? 'bg-white/10' : 'bg-white/60'
          }`}>
            <span className="text-lg">👥</span>
            <span className={`font-semibold ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
              {registeredUsers.toLocaleString()}
            </span>
            <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>registered users</span>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            darkMode ? 'bg-white/10' : 'bg-white/60'
          }`}>
            <span className="text-lg">👀</span>
            <span className={`font-semibold ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
              {totalVisits.toLocaleString()}
            </span>
            <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>total visits</span>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div>
        <h2 className={`text-3xl font-bold text-center mb-8 ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Features
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`p-6 rounded-xl border transition-all hover:shadow-lg ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 hover:border-purple-500'
                  : 'bg-white border-gray-200 hover:border-purple-400'
              }`}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className={`text-xl font-bold mb-2 flex items-center gap-2 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {feature.title}
                {feature.requiresVerification && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    darkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700'
                  }`}>
                    Requires Verification
                  </span>
                )}
              </h3>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className={`p-8 rounded-2xl ${
        darkMode ? 'bg-gray-800' : 'bg-gray-50'
      }`}>
        <h2 className={`text-3xl font-bold text-center mb-8 ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          How It Works
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 ${
              darkMode ? 'bg-purple-600 text-white' : 'bg-purple-600 text-white'
            }`}>
              1
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Sign In & Verify
            </h3>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Sign in with Google and verify your CF handle by submitting a compilation error.
            </p>
          </div>
          
          <div className="text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 ${
              darkMode ? 'bg-purple-600 text-white' : 'bg-purple-600 text-white'
            }`}>
              2
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Add Problems
            </h3>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Add problems manually or get smart recommendations from recent contests.
            </p>
          </div>
          
          <div className="text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 ${
              darkMode ? 'bg-purple-600 text-white' : 'bg-purple-600 text-white'
            }`}>
              3
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Track & Improve
            </h3>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Solve problems, mark them complete, and watch your skills grow over time.
            </p>
          </div>
        </div>
      </div>

      {/* Stats/Info */}
      <div className="text-center">
        <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          Built with ❤️ for competitive programmers • Data from Codeforces API
        </p>
      </div>
    </div>
  );
}
