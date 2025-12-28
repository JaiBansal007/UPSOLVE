import { useState, useEffect } from 'react';
import ProblemForm from './components/ProblemForm';
import ProblemList from './components/ProblemList';
import TagFilter from './components/TagFilter';
import { storage } from './services/firebaseStorage';
import { codeforcesAPI } from './services/codeforcesApi';

function App() {
  const [problems, setProblems] = useState([]);
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedRatingRange, setSelectedRatingRange] = useState({ min: 0, max: 4000 });
  const [showSolved, setShowSolved] = useState('all');
  const [sortBy, setSortBy] = useState('date-new');
  const [hideTags, setHideTags] = useState(false);
  const cfHandle = 'Jx07'; // Hardcoded CF handle
  const [loading, setLoading] = useState(false);
  const [cfApiStatus, setCfApiStatus] = useState('checking'); // checking, online, offline

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await storage.getSettings();
        setHideTags(settings.hideTags || false);
        
        // Load problems for Jx07
        const savedProblems = await storage.getProblems('Jx07');
        setProblems(savedProblems);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadSettings();

    // Check CF API status
    checkCfApiStatus();
  }, []);

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

  const handleProblemAdded = async (problemData) => {
    try {
      setLoading(true);
      
      // Check if problem is solved on CF for Jx07
      let solvedOnCF = false;
      try {
        console.log(`Checking if ${problemData.contestId}${problemData.index} is solved by Jx07...`);
        solvedOnCF = await codeforcesAPI.isProblemSolved(
          'Jx07',
          problemData.contestId,
          problemData.index
        );
        console.log(`Result: ${solvedOnCF ? 'Solved' : 'Not solved'} on CF`);
      } catch (error) {
        console.error('Error checking CF solved status:', error);
      }

      const problemWithStatus = {
        ...problemData,
        solvedOnCF,
        solved: solvedOnCF || problemData.solved || false // Auto-mark as solved if solved on CF
      };

      console.log('Adding problem with status:', problemWithStatus);
      const updatedProblems = await storage.addProblem(problemWithStatus, 'Jx07');
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
        const updatedProblems = await storage.removeProblem(problemId, 'Jx07');
        setProblems(updatedProblems);
      } catch (error) {
        console.error('Error deleting problem:', error);
        alert('Failed to delete problem. Please try again.');
      }
    }
  };

  const handleToggleSolved = async (problemId) => {
    try {
      const updatedProblems = await storage.toggleSolved(problemId, 'Jx07');
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-indigo-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Title and Stats */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">🎯 Codeforces Upsolve Tracker</h1>
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
              <p className="text-purple-100 text-sm">Track, organize, and conquer your problem-solving journey</p>
              
              {/* CF Handle Display */}
              <div className="mt-2 inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-lg px-4 py-2">
                <span className="text-lg">👤</span>
                <span className="font-semibold">Jx07</span>
              </div>
              
              {/* Stats */}
              <div className="flex gap-4 mt-4">
                <div className="bg-white/10 backdrop-blur rounded-lg px-3 py-1.5">
                  <div className="text-xl font-bold">{stats.total}</div>
                  <div className="text-xs text-purple-100">Total</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg px-3 py-1.5">
                  <div className="text-xl font-bold text-green-300">{stats.solved}</div>
                  <div className="text-xs text-purple-100">Solved</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg px-3 py-1.5">
                  <div className="text-xl font-bold text-yellow-300">{stats.unsolved}</div>
                  <div className="text-xs text-purple-100">Unsolved</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Add Problem Form */}
        <div className="mb-6">
          <ProblemForm onProblemAdded={handleProblemAdded} loading={loading} />
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
        />
      </main>

      {/* Footer */}
      <footer className="bg-purple-900 text-purple-200 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center">
          <p className="text-sm">
            Built with React + TailwindCSS • Data from{' '}
            <a
              href="https://codeforces.com/apiHelp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-300 hover:text-white underline"
            >
              Codeforces API
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
