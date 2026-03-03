import { useState, useEffect, createContext, useContext } from 'react';
import ProblemForm from './components/ProblemForm';
import ProblemList from './components/ProblemList';
import UserComparison from './components/UserComparison';
import UpsolvingFeature from './components/UpsolvingFeature';
import Navigation from './components/Navigation';
import Profile from './components/Profile';
import Landing from './components/Landing';
import { AuthProvider } from './contexts/AuthContext';
import { storage } from './services/firebaseStorage';
import { codeforcesAPI } from './services/codeforcesApi';
import { setupPresence, auth, registerUser } from './services/firebase';
import { useOnlinePresence } from './hooks/useOnlinePresence';

// Theme Context
const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

function App() {
  const [problems, setProblems] = useState([]);
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedRatingRange, setSelectedRatingRange] = useState({ min: 0, max: 4000 });
  const [showSolved, setShowSolved] = useState('all');
  const [sortBy, setSortBy] = useState('date-new');
  const [hideTags, setHideTags] = useState(false);
  const [cfHandle, setCfHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [cfApiStatus, setCfApiStatus] = useState('checking'); // checking, online, offline
  const [currentPage, setCurrentPage] = useState('home'); // home, profile, problems, compare, upsolve
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [isVerified, setIsVerified] = useState(false);

  // Online presence and stats hook
  const { onlineCount, onlineUsers, totalVisits, registeredUsers } = useOnlinePresence(cfHandle);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await storage.getSettings();
        setHideTags(settings.hideTags || false);
        setCfHandle(settings.cfHandle || '');
        
        // Check verification status
        if (settings.cfHandle) {
          const verificationData = localStorage.getItem(`cf_verified_${settings.cfHandle}`);
          if (verificationData) {
            const parsed = JSON.parse(verificationData);
            // Verification expires after 30 days
            const isExpired = Date.now() - parsed.timestamp > (30 * 24 * 60 * 60 * 1000);
            setIsVerified(parsed.verified && !isExpired);
          }
        }
        
        // Load problems for the user's CF handle
        if (settings.cfHandle) {
          const savedProblems = await storage.getProblems(settings.cfHandle);
          setProblems(savedProblems);
        } else {
          setProblems([]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadSettings();

    // Check CF API status
    checkCfApiStatus();
  }, []);

  // Setup presence tracking and register user when verified
  useEffect(() => {
    if (isVerified && cfHandle && auth.currentUser) {
      setupPresence(auth.currentUser.uid, cfHandle);
      registerUser(cfHandle);
    }
  }, [isVerified, cfHandle]);

  const checkCfApiStatus = async () => {
    try {
      setCfApiStatus('checking');
      await codeforcesAPI.fetchAllProblems();
      setCfApiStatus('online');
    } catch (error) {
      console.error('CF API check failed:', error);
      setCfApiStatus('offline');
    }
  };

  // Apply filters whenever problems or filters change
  useEffect(() => {
    let filtered = [...problems];

    // Filter by solved status
    if (showSolved === 'solved') {
      filtered = filtered.filter(p => p.solved);
    } else if (showSolved === 'unsolved') {
      filtered = filtered.filter(p => !p.solved);
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(problem => {
        const problemTags = [...(problem.tags || []), ...(problem.myTags || [])];
        return selectedTags.some(tag => problemTags.includes(tag));
      });
    }

    // Filter by rating range
    filtered = filtered.filter(problem => {
      const rating = problem.rating || 0;
      return rating >= selectedRatingRange.min && rating <= selectedRatingRange.max;
    });

    setFilteredProblems(filtered);
  }, [problems, selectedTags, selectedRatingRange, showSolved]);

  // Theme management
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const handleProblemAdded = async (problemData) => {
    try {
      setLoading(true);
      
      // Check if problem is solved on CF for the user's handle
      let solvedOnCF = false;
      if (cfHandle) {
        try {
          console.log(`Checking if ${problemData.contestId}${problemData.index} is solved by ${cfHandle}...`);
          solvedOnCF = await codeforcesAPI.isProblemSolved(
            cfHandle,
            problemData.contestId,
            problemData.index
          );
          console.log(`Result: ${solvedOnCF ? 'Solved' : 'Not solved'} on CF`);
        } catch (error) {
          console.error('Error checking CF solved status:', error);
        }
      }

      const problemWithStatus = {
        ...problemData,
        solvedOnCF,
        solved: solvedOnCF || problemData.solved || false // Auto-mark as solved if solved on CF
      };

      console.log('Adding problem with status:', problemWithStatus);
      if (!cfHandle) {
        throw new Error('Please complete your Profile setup before adding problems.');
      }
      const updatedProblems = await storage.addProblem(problemWithStatus, cfHandle);
      setProblems(updatedProblems);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProblem = async (problemId) => {
    if (window.confirm('Are you sure you want to delete this problem?')) {
      try {
        if (!cfHandle) {
          alert('Please complete your Profile setup.');
          return;
        }
        const updatedProblems = await storage.removeProblem(problemId, cfHandle);
        setProblems(updatedProblems);
      } catch (error) {
        console.error('Error deleting problem:', error);
        alert('Failed to delete problem. Please try again.');
      }
    }
  };

  const handleToggleSolved = async (problemId) => {
    try {
      if (!cfHandle) {
        alert('Please complete your Profile setup.');
        return;
      }
      const updatedProblems = await storage.toggleSolved(problemId, cfHandle);
      setProblems(updatedProblems);
    } catch (error) {
      console.error('Error toggling solved status:', error);
      alert('Failed to update problem. Please try again.');
    }
  };

  const handleHideTagsChange = async (value) => {
    setHideTags(value);
    try {
      await storage.setHideTags(value);
    } catch (error) {
      console.error('Error saving hide tags setting:', error);
      setHideTags(!value); // Revert on error
    }
  };

  const stats = {
    total: problems.length,
    solved: problems.filter(p => p.solved).length,
    unsolved: problems.filter(p => !p.solved).length
  };

  return (
    <AuthProvider>
      <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      <div className={`min-h-screen transition-colors duration-200 ${
        darkMode 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-br from-purple-50 via-purple-100 to-indigo-100'
      }`}>
        {/* Navigation */}
        <Navigation 
          currentPage={currentPage} 
          onPageChange={setCurrentPage}
          darkMode={darkMode}
          onThemeToggle={toggleTheme}
          isVerified={isVerified}
          onlineCount={onlineCount}
          cfHandle={cfHandle}
        />

        {/* Header */}
        <header className={`shadow-lg transition-colors duration-200 ${
          darkMode
            ? 'bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 text-white'
            : 'bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 text-white'
        }`}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Title and Stats */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">
                  🎯 {
                    currentPage === 'home' ? 'CF Upsolve Tracker' :
                    currentPage === 'profile' ? 'Profile Setup' :
                    currentPage === 'problems' ? 'My Problems' :
                    currentPage === 'compare' ? 'User Comparison' :
                    'Upsolving Feature'
                  }
                </h1>
                {/* CF API Status Indicator */}
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-3 py-1">
                  <div className={`w-2 h-2 rounded-full ${
                    cfApiStatus === 'online' ? 'bg-green-400 animate-pulse' :
                    cfApiStatus === 'offline' ? 'bg-red-400' :
                    'bg-yellow-400 animate-pulse'
                  }`}></div>
                  <span className="text-xs font-medium">
                    {cfApiStatus === 'online' ? 'CF API Online' :
                     cfApiStatus === 'offline' ? 'CF API Offline' :
                     'Checking API...'}
                  </span>
                  {cfApiStatus === 'offline' && (
                    <button
                      onClick={checkCfApiStatus}
                      className="text-xs underline hover:text-purple-200"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>
              <p className={`text-sm ${
                darkMode ? 'text-gray-300' : 'text-purple-100'
              }`}>
                {
                  currentPage === 'home'
                    ? 'Your personal companion for mastering Codeforces'
                    : currentPage === 'profile'
                    ? 'Complete your profile to unlock all features'
                    : currentPage === 'problems' 
                    ? 'Track, organize, and conquer your problem-solving journey'
                    : currentPage === 'compare'
                    ? 'Compare users and discover new problems to solve'
                    : 'Get personalized upsolving recommendations from recent contests'
                }
              </p>
              
              {/* CF Handle Display */}
              {(currentPage === 'problems' || currentPage === 'upsolve') && isVerified && (
                <div className="mt-2 inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-lg px-4 py-2">
                  <span className="text-lg">👤</span>
                  <span className="font-semibold">
                    {cfHandle}
                  </span>
                  {currentPage === 'upsolve' && (
                    <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium ml-2">
                      ✓ Verified
                    </span>
                  )}
                </div>
              )}
              
              {/* Stats - only show on problems page */}
              {currentPage === 'problems' && (
                <div className="flex gap-4 mt-4">
                  <div className="bg-white/10 backdrop-blur rounded-lg px-3 py-1.5">
                    <div className="text-xl font-bold">{stats.total}</div>
                    <div className={`text-xs ${
                      darkMode ? 'text-gray-300' : 'text-purple-100'
                    }`}>Total</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-lg px-3 py-1.5">
                    <div className="text-xl font-bold text-green-300">{stats.solved}</div>
                    <div className={`text-xs ${
                      darkMode ? 'text-gray-300' : 'text-purple-100'
                    }`}>Solved</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-lg px-3 py-1.5">
                    <div className="text-xl font-bold text-yellow-300">{stats.unsolved}</div>
                    <div className={`text-xs ${
                      darkMode ? 'text-gray-300' : 'text-purple-100'
                    }`}>Unsolved</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {currentPage === 'home' ? (
            <Landing 
              darkMode={darkMode}
              onNavigate={setCurrentPage}
              isVerified={isVerified}
              stats={{ onlineCount, totalVisits, registeredUsers }}
            />
          ) : currentPage === 'profile' ? (
            <Profile 
              darkMode={darkMode}
              cfHandle={cfHandle}
              setCfHandle={setCfHandle}
              isVerified={isVerified}
              setIsVerified={setIsVerified}
              onProfileComplete={() => {
                // Auto-navigate to problems after profile is complete
                setCurrentPage('problems');
              }}
            />
          ) : currentPage === 'problems' ? (
            !isVerified ? (
              <div className={`border rounded-xl p-8 text-center ${
                darkMode 
                  ? 'bg-purple-900/20 border-purple-700'
                  : 'bg-purple-50 border-purple-200'
              }`}>
                <span className="text-4xl mb-4 block">🔒</span>
                <h3 className={`text-xl font-semibold mb-2 ${
                  darkMode ? 'text-purple-300' : 'text-purple-800'
                }`}>
                  Profile Setup Required
                </h3>
                <p className={`mb-4 ${darkMode ? 'text-purple-200' : 'text-purple-700'}`}>
                  Complete your profile setup to access the Problems feature.
                </p>
                <button
                  onClick={() => setCurrentPage('profile')}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Go to Profile
                </button>
              </div>
            ) : (
            <>
              {/* Add Problem Form */}
              <div className="mb-6">
                <ProblemForm onProblemAdded={handleProblemAdded} loading={loading} darkMode={darkMode} isVerified={isVerified} />
              </div>

              {/* Problem List Section with Filters */}
              <ProblemList
                problems={filteredProblems}
                allProblems={problems}
                onDelete={handleDeleteProblem}
                onToggleSolved={handleToggleSolved}
                sortBy={sortBy}
                onSortChange={setSortBy}
                hideTags={hideTags}
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
                selectedRatingRange={selectedRatingRange}
                onRatingRangeChange={setSelectedRatingRange}
                showSolved={showSolved}
                onShowSolvedChange={setShowSolved}
                onHideTagsChange={setHideTags}
                darkMode={darkMode}
              />
            </>
            )
          ) : currentPage === 'compare' ? (
            <div className="mb-6">
              <UserComparison darkMode={darkMode} />
            </div>
          ) : (
            <div className="mb-6">
              {!isVerified ? (
                <div className={`border rounded-xl p-8 text-center ${
                  darkMode 
                    ? 'bg-purple-900/20 border-purple-700'
                    : 'bg-purple-50 border-purple-200'
                }`}>
                  <span className="text-4xl mb-4 block">🔒</span>
                  <h3 className={`text-xl font-semibold mb-2 ${
                    darkMode ? 'text-purple-300' : 'text-purple-800'
                  }`}>
                    Profile Setup Required
                  </h3>
                  <p className={`mb-4 ${darkMode ? 'text-purple-200' : 'text-purple-700'}`}>
                    Complete your profile setup to access the Upsolving feature.
                  </p>
                  <button
                    onClick={() => setCurrentPage('profile')}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Go to Profile
                  </button>
                </div>
              ) : (
                <UpsolvingFeature 
                  cfHandle={cfHandle} 
                  darkMode={darkMode} 
                  onProblemAdd={handleProblemAdded}
                />
              )}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className={`mt-16 transition-colors duration-200 ${
          darkMode
            ? 'bg-gray-900 text-gray-400'
            : 'bg-purple-900 text-purple-200'
        }`}>
          <div className="max-w-6xl mx-auto px-6 py-6 text-center">
            <p className="text-sm">
              Built with React + TailwindCSS • Data from{' '}
              <a
                href="https://codeforces.com/apiHelp"
                target="_blank"
                rel="noopener noreferrer"
                className={`underline hover:text-white ${
                  darkMode ? 'text-gray-300' : 'text-purple-300'
                }`}
              >
                Codeforces API
              </a>
            </p>
          </div>
        </footer>
      </div>
    </ThemeContext.Provider>
    </AuthProvider>
  );
}

export default App;
