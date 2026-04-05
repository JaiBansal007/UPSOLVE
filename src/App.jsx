import { useState, useEffect, createContext, useContext } from 'react';
import ProblemForm from './components/ProblemForm';
import ProblemList from './components/ProblemList';
import UserComparison from './components/UserComparison';
import UpsolvingFeature from './components/UpsolvingFeature';
import CardNav from './components/CardNav';
import Profile from './components/Profile';
import Landing from './components/Landing';
import BugReport from './components/BugReport';
import AdminReports from './components/AdminReports';
import RatingGrind from './components/RatingGrind';
import { AuthProvider } from './contexts/AuthContext';
import { storage } from './services/firebaseStorage';
import { codeforcesAPI } from './services/codeforcesApi';
import { setupPresence, auth, registerUser, signOutUser } from './services/firebase';
import { useOnlinePresence } from './hooks/useOnlinePresence';
import { onAuthStateChanged } from 'firebase/auth';
import { Analytics } from '@vercel/analytics/react';

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
  const [currentPage, setCurrentPage] = useState('home'); // home, profile, problems, compare, upsolve, admin
  const darkMode = true; // Always dark mode
  const [isVerified, setIsVerified] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [authUser, setAuthUser] = useState(undefined);
  const [showBugReport, setShowBugReport] = useState(false);


  // Online presence and stats hook
  const { onlineCount, onlineUsers, totalVisits, registeredUsers } = useOnlinePresence(cfHandle);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Load settings when auth user changes
  useEffect(() => {
    const loadSettings = async () => {
      setInitialLoading(true);
      try {
        const settings = await storage.getSettings();
        setHideTags(settings.hideTags || false);
        setCfHandle(settings.cfHandle || '');
        
        // Check verification status from Firestore first
        if (settings.cfHandle) {
          const firestoreVerification = await storage.getVerification(settings.cfHandle);
          if (firestoreVerification && firestoreVerification.verified) {
            setIsVerified(true);
          } else {
            // Fall back to localStorage check
            const verificationData = localStorage.getItem(`cf_verified_${settings.cfHandle}`);
            if (verificationData) {
              const parsed = JSON.parse(verificationData);
              // Verification expires after 30 days
              const isExpired = Date.now() - parsed.timestamp > (30 * 24 * 60 * 60 * 1000);
              setIsVerified(parsed.verified && !isExpired);
            } else {
              setIsVerified(false);
            }
          }
        } else {
          setIsVerified(false);
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
      } finally {
        setInitialLoading(false);
      }
    };

    const resetState = () => {
      setCfHandle('');
      setIsVerified(false);
      setProblems([]);
      setInitialLoading(false);
    };
    
    if (authUser) {
      // Signed-in user: load their settings + verification from Firestore
      loadSettings();
    } else if (authUser === null) {
      // Explicitly signed out: reset all user state immediately
      resetState();
    }
    // authUser === undefined means Firebase hasn't resolved yet — wait
  }, [authUser]); // Re-run when auth user changes

  // Check CF API status on mount
  useEffect(() => {
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

  // Set dark mode class on document
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setIsVerified(false);
      setCfHandle('');
      setCurrentPage('home');
    } catch (e) {
      console.error('Sign out failed', e);
    }
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
      <ThemeContext.Provider value={{ darkMode }}>
      <div className="min-h-screen flex flex-col bg-black">
        {/* CardNav Navigation */}
        <CardNav 
          onNavigate={setCurrentPage}
          currentPage={currentPage}
          isVerified={isVerified}
          cfHandle={cfHandle}
          onlineCount={onlineCount}
          onSignOut={handleSignOut}
          isLoggedIn={!!(authUser && !authUser.isAnonymous)}
          cfApiStatus={cfApiStatus}
        />

        {/* Main Content - with top padding for floating nav */}
        <main className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-8 flex-grow w-full">
          {initialLoading ? (
            <div className={`flex flex-col items-center justify-center py-20 ${
              darkMode ? 'text-gray-300' : 'text-purple-700'
            }`}>
              <div className={`animate-spin rounded-full h-12 w-12 border-4 mb-4 ${
                darkMode 
                  ? 'border-gray-600 border-t-purple-500' 
                  : 'border-purple-200 border-t-purple-600'
              }`}></div>
              <p className="font-medium">Fetching user details...</p>
              <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-purple-500'}`}>
                Please wait while we load your profile
              </p>
            </div>
          ) : currentPage === 'home' ? (
            <Landing 
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
              {/* Add Problem Button - Opens Modal */}
              <div className="mb-6 flex items-center justify-between">
                <ProblemForm onProblemAdded={handleProblemAdded} loading={loading} darkMode={darkMode} isVerified={isVerified} />
                
                {/* Quick Stats */}
                <div className={`flex items-center gap-4 text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <span>{problems.length} total</span>
                  <span className="text-green-500">{problems.filter(p => p.solved).length} solved</span>
                  <span className="text-yellow-500">{problems.filter(p => !p.solved).length} unsolved</span>
                </div>
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
          ) : currentPage === 'rating-grind' ? (
            <div className="mb-6">
              <RatingGrind darkMode={darkMode} cfHandle={cfHandle} />
            </div>
          ) : currentPage === 'admin' && cfHandle === 'Jx07' ? (
            <div className="mb-6">
              <AdminReports darkMode={darkMode} />
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
        <footer className="relative z-10 mt-auto bg-black border-t border-gray-900">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-400">
                Built with React + TailwindCSS • Data from{' '}
                <a
                  href="https://codeforces.com/apiHelp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 underline hover:text-white"
                >
                  Codeforces API
                </a>
              </p>
              
              <div className="flex items-center gap-4">
                {/* Admin link - only for Jx07 */}
                {cfHandle === 'Jx07' && (
                  <button
                    onClick={() => setCurrentPage('admin')}
                    className="text-sm text-gray-400 underline hover:text-white transition-colors"
                  >
                    🔧 Admin
                  </button>
                )}
                
                {/* Bug Report - only for logged in users */}
                {authUser && !authUser.isAnonymous && (
                  <button
                    onClick={() => setShowBugReport(true)}
                    className="text-sm flex items-center gap-1 px-3 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-300 transition-colors border border-gray-800"
                  >
                    🐛 Report Bug
                  </button>
                )}
              </div>
            </div>
          </div>
        </footer>

        {/* Bug Report Modal */}
        <BugReport
          darkMode={darkMode}
          isOpen={showBugReport}
          onClose={() => setShowBugReport(false)}
          cfHandle={cfHandle}
        />
      </div>
    </ThemeContext.Provider>
    <Analytics />
    </AuthProvider>
  );
}

export default App;
