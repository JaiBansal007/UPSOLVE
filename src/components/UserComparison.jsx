import { useState, useEffect } from 'react';
import { codeforcesAPI } from '../services/codeforcesApi';

export default function UserComparison({ darkMode }) {
  const [user1Handle, setUser1Handle] = useState('');
  const [user2Handle, setUser2Handle] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [addingProblems, setAddingProblems] = useState(new Set());
  const [ratingFilter, setRatingFilter] = useState({ min: 800, max: 4000 });
  const [groupedProblems, setGroupedProblems] = useState({});
  const [expandedRatings, setExpandedRatings] = useState(new Set());
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' for low-to-high, 'desc' for high-to-low
  
  // All valid ratings (multiples of 100, >= 800)
  const ALL_RATINGS = Array.from({ length: 28 }, (_, i) => 800 + i * 100); // 800 to 3500

  const handleCompare = async () => {
    if (!user1Handle.trim() || !user2Handle.trim()) {
      setError('Please enter both usernames');
      return;
    }

    if (user1Handle.trim() === user2Handle.trim()) {
      setError('Please enter different usernames');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      console.log(`Fetching solved problems for ${user1Handle} and ${user2Handle}...`);
      
      // Fetch solved problems for both users
      const [user1Solved, user2Solved] = await Promise.all([
        codeforcesAPI.getSolvedProblems(user1Handle.trim()),
        codeforcesAPI.getSolvedProblems(user2Handle.trim())
      ]);

      // Find problems solved by user2 but not by user1
      const recommendedProblems = [];
      for (const problemId of user2Solved) {
        if (!user1Solved.has(problemId)) {
          recommendedProblems.push(problemId);
        }
      }

      // Get full problem details for recommended problems
      const allProblems = await codeforcesAPI.fetchAllProblems();
      const problemsWithDetails = recommendedProblems.map(problemId => {
        // Extract contestId and index from problemId (e.g., "1462A" -> contestId: 1462, index: "A")
        const match = problemId.match(/^(\d+)([A-Z]\d*)$/);
        if (!match) return null;
        
        const [, contestId, index] = match;
        const problem = allProblems.find(p => 
          p.contestId === parseInt(contestId) && p.index === index
        );
        
        return problem ? { ...problem, id: problemId } : null;
      }).filter(Boolean);

      // Sort by rating (highest first) and then by contest ID
      problemsWithDetails.sort((a, b) => {
        if (a.rating && b.rating) {
          if (b.rating !== a.rating) return b.rating - a.rating;
        } else if (a.rating) {
          return -1;
        } else if (b.rating) {
          return 1;
        }
        return b.contestId - a.contestId;
      });

      setResults({
        user1: user1Handle.trim(),
        user2: user2Handle.trim(),
        user1SolvedCount: user1Solved.size,
        user2SolvedCount: user2Solved.size,
        recommendedProblems: problemsWithDetails, // Show all problems, no slice limit
        allProblemsCount: problemsWithDetails.length
      });

      setExpandedRatings(new Set()); // Reset expanded ratings when new results come

    } catch (error) {
      console.error('Error comparing users:', error);
      setError('Failed to fetch user data. Please check the usernames and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating) => {
    if (!rating) return 'text-gray-600';
    if (rating < 1200) return 'text-gray-600';
    if (rating < 1400) return 'text-green-600';
    if (rating < 1600) return 'text-cyan-600';
    if (rating < 1900) return 'text-blue-600';
    if (rating < 2100) return 'text-purple-600';
    if (rating < 2300) return 'text-yellow-600';
    if (rating < 2400) return 'text-orange-600';
    return 'text-red-600';
  };

  // Group problems by rating
  const groupProblemsByRating = () => {
    if (!results) return;

    const filtered = results.recommendedProblems.filter(problem => {
      const rating = problem.rating || 0;
      return rating >= ratingFilter.min && rating <= ratingFilter.max;
    });

    // Group by rating
    const grouped = {};
    filtered.forEach(problem => {
      const rating = problem.rating || 0;
      // Round to nearest 100 for grouping (problems without rating go to 800)
      const ratingKey = rating >= 800 ? Math.floor(rating / 100) * 100 : 800;
      if (!grouped[ratingKey]) {
        grouped[ratingKey] = [];
      }
      grouped[ratingKey].push(problem);
    });

    // Sort problems within each group by contest ID
    Object.keys(grouped).forEach(rating => {
      grouped[rating].sort((a, b) => b.contestId - a.contestId);
    });

    setGroupedProblems(grouped);
  };

  // Apply grouping whenever results or rating filter changes
  useEffect(() => {
    groupProblemsByRating();
  }, [results, ratingFilter]);

  // Get sorted rating keys based on sort order
  const getSortedRatings = () => {
    const ratings = Object.keys(groupedProblems).map(Number).filter(r => r >= 800);
    if (sortOrder === 'asc') {
      return ratings.sort((a, b) => a - b);
    } else {
      return ratings.sort((a, b) => b - a);
    }
  };

  // Toggle rating dropdown
  const toggleRating = (rating) => {
    setExpandedRatings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rating)) {
        newSet.delete(rating);
      } else {
        newSet.add(rating);
      }
      return newSet;
    });
  };

  // Expand/collapse all
  const expandAll = () => {
    setExpandedRatings(new Set(Object.keys(groupedProblems).map(Number)));
  };

  const collapseAll = () => {
    setExpandedRatings(new Set());
  };

  // Get total problem count
  const getTotalProblemsCount = () => {
    return Object.values(groupedProblems).reduce((sum, problems) => sum + problems.length, 0);
  };

  const resetFilters = () => {
    setRatingFilter({ min: 800, max: 4000 });
    setSortOrder('asc');
    setExpandedRatings(new Set());
  };

  return (
    <div className={`backdrop-blur rounded-xl shadow-lg p-6 border transition-colors duration-200 ${
      darkMode 
        ? 'bg-gray-800/95 border-gray-700' 
        : 'bg-white/95 border-white/20'
    }`}>
      <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${
        darkMode ? 'text-gray-100' : 'text-purple-800'
      }`}>
        <span className="text-2xl">🔍</span> Problem Recommendations
      </h2>
      
      <p className={`text-sm mb-4 ${
        darkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        Compare two Codeforces users and find problems that the second user solved but the first user hasn't.
      </p>

      {/* Input Form */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
        <div className="flex-1">
          <label className={`block text-sm font-semibold mb-2 ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            First User (You)
          </label>
          <input
            type="text"
            value={user1Handle}
            onChange={(e) => setUser1Handle(e.target.value)}
            placeholder="e.g., tourist"
            className={`w-full px-4 py-2 border rounded-lg transition-colors ${
              darkMode
                ? 'border-gray-600 bg-gray-700 text-white focus:ring-gray-500 focus:border-transparent'
                : 'border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
            }`}
            disabled={loading}
          />
        </div>
        
        {/* Swap Button */}
        <button
          onClick={() => {
            const temp = user1Handle;
            setUser1Handle(user2Handle);
            setUser2Handle(temp);
          }}
          disabled={loading}
          title="Swap usernames"
          className={`px-3 py-2 rounded-lg transition-colors text-xl ${
            darkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          ⇄
        </button>
        
        <div className="flex-1">
          <label className={`block text-sm font-semibold mb-2 ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Second User (Compare with)
          </label>
          <input
            type="text"
            value={user2Handle}
            onChange={(e) => setUser2Handle(e.target.value)}
            placeholder="e.g., Benq"
            className={`w-full px-4 py-2 border rounded-lg transition-colors ${
              darkMode
                ? 'border-gray-600 bg-gray-700 text-white focus:ring-gray-500 focus:border-transparent'
                : 'border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
            }`}
            disabled={loading}
          />
        </div>
        
        {/* Compare Button */}
        <button
          onClick={handleCompare}
          disabled={loading}
          className={`px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            darkMode
              ? 'bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 text-white'
              : 'bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white'
          }`}
        >
          {loading ? 'Comparing...' : 'Compare'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`border rounded-lg p-4 mb-4 ${
          darkMode
            ? 'bg-red-900/20 border-red-700'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className={`flex items-center gap-2 ${
            darkMode ? 'text-red-300' : 'text-red-800'
          }`}>
            <span>❌</span>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className={`animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4 ${
            darkMode ? 'border-gray-400' : 'border-purple-600'
          }`}></div>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Fetching and comparing user data...
          </p>
        </div>
      )}

      {/* Results */}
      {results && (
        <div>
          {/* Summary */}
          <div className={`rounded-lg p-4 mb-6 ${
            darkMode
              ? 'bg-gradient-to-r from-gray-800 to-gray-700'
              : 'bg-gradient-to-r from-purple-50 to-indigo-50'
          }`}>
            <h3 className={`font-bold mb-2 ${
              darkMode ? 'text-gray-200' : 'text-gray-800'
            }`}>Comparison Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className={`font-semibold ${
                  darkMode ? 'text-blue-400' : 'text-purple-700'
                }`}>{results.user1}</div>
                <div className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {results.user1SolvedCount} problems solved
                </div>
              </div>
              <div className="text-center">
                <div className={`font-semibold ${
                  darkMode ? 'text-purple-400' : 'text-indigo-700'
                }`}>{results.user2}</div>
                <div className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {results.user2SolvedCount} problems solved
                </div>
              </div>
              <div className="text-center">
                <div className={`font-semibold ${
                  darkMode ? 'text-green-400' : 'text-green-700'
                }`}>Total Found</div>
                <div className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {results.allProblemsCount} problems
                </div>
              </div>
              <div className="text-center">
                <div className={`font-semibold ${
                  darkMode ? 'text-yellow-400' : 'text-yellow-700'
                }`}>After Filters</div>
                <div className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {getTotalProblemsCount()} problems
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          {results.allProblemsCount > 0 && (
            <div className={`rounded-lg p-4 mb-6 border ${
              darkMode
                ? 'bg-gray-800 border-gray-600'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className={`font-semibold ${
                  darkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>🔍 Filters</h4>
                <button
                  onClick={resetFilters}
                  className={`text-sm font-medium ${
                    darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-purple-600 hover:text-purple-800'
                  }`}
                >
                  Clear All
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-400' : 'text-gray-700'
                  }`}>Min Rating</label>
                  <select
                    value={ratingFilter.min}
                    onChange={(e) => {
                      setRatingFilter(prev => ({ ...prev, min: parseInt(e.target.value) || 800 }));
                    }}
                    className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${
                      darkMode
                        ? 'border-gray-600 bg-gray-700 text-white focus:ring-gray-500'
                        : 'border-gray-300 focus:ring-2 focus:ring-purple-500'
                    }`}
                  >
                    {ALL_RATINGS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-400' : 'text-gray-700'
                  }`}>Max Rating</label>
                  <select
                    value={ratingFilter.max}
                    onChange={(e) => {
                      setRatingFilter(prev => ({ ...prev, max: parseInt(e.target.value) || 3500 }));
                    }}
                    className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${
                      darkMode
                        ? 'border-gray-600 bg-gray-700 text-white focus:ring-gray-500'
                        : 'border-gray-300 focus:ring-2 focus:ring-purple-500'
                    }`}
                  >
                    {ALL_RATINGS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-400' : 'text-gray-700'
                  }`}>Sort by Rating</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSortOrder('asc')}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        sortOrder === 'asc'
                          ? darkMode
                            ? 'bg-purple-600 text-white'
                            : 'bg-purple-600 text-white'
                          : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      ↑ Low to High
                    </button>
                    <button
                      onClick={() => setSortOrder('desc')}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        sortOrder === 'desc'
                          ? darkMode
                            ? 'bg-purple-600 text-white'
                            : 'bg-purple-600 text-white'
                          : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      ↓ High to Low
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recommended Problems - Grouped by Rating */}
          {getTotalProblemsCount() > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-bold ${
                  darkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  Problems solved by {results.user2} but not by {results.user1}:
                </h3>
                
                {/* Expand/Collapse Controls */}
                <div className="flex gap-2">
                  <button
                    onClick={expandAll}
                    className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                      darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Expand All
                  </button>
                  <button
                    onClick={collapseAll}
                    className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                      darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Collapse All
                  </button>
                </div>
              </div>
              
              {/* Rating Groups */}
              <div className="space-y-2">
                {getSortedRatings().map(rating => (
                  <div
                    key={rating}
                    className={`border rounded-lg overflow-hidden ${
                      darkMode ? 'border-gray-600' : 'border-gray-200'
                    }`}
                  >
                    {/* Rating Header - Clickable Dropdown */}
                    <button
                      onClick={() => toggleRating(rating)}
                      className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${
                        darkMode
                          ? 'bg-gray-800 hover:bg-gray-700'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold ${getRatingColor(rating)}`}>
                          {rating}
                        </span>
                        <span className={`text-sm ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          ({groupedProblems[rating]?.length || 0} problems)
                        </span>
                      </div>
                      <span className={`text-lg transition-transform duration-200 ${
                        expandedRatings.has(rating) ? 'rotate-180' : ''
                      } ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        ▼
                      </span>
                    </button>
                    
                    {/* Problems List - Expandable */}
                    {expandedRatings.has(rating) && groupedProblems[rating] && (
                      <div className={`border-t ${
                        darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
                      }`}>
                        {groupedProblems[rating].map((problem, index) => (
                          <div
                            key={problem.id}
                            className={`px-4 py-2 flex items-center justify-between ${
                              index !== groupedProblems[rating].length - 1 
                                ? darkMode ? 'border-b border-gray-800' : 'border-b border-gray-100'
                                : ''
                            } ${
                              darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex-1">
                              <a
                                href={codeforcesAPI.getProblemUrl(problem.contestId, problem.index)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`font-medium hover:underline ${
                                  darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                                }`}
                              >
                                {problem.contestId}{problem.index}. {problem.name}
                              </a>
                              {problem.tags && problem.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {problem.tags.slice(0, 3).map((tag, tagIndex) => (
                                    <span
                                      key={tagIndex}
                                      className={`px-2 py-0.5 text-xs rounded ${
                                        darkMode
                                          ? 'bg-gray-700 text-gray-400'
                                          : 'bg-gray-100 text-gray-600'
                                      }`}
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {problem.tags.length > 3 && (
                                    <span className={`px-2 py-0.5 text-xs rounded ${
                                      darkMode
                                        ? 'bg-gray-700 text-gray-500'
                                        : 'bg-gray-100 text-gray-500'
                                    }`}>
                                      +{problem.tags.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : Object.keys(groupedProblems).length === 0 && results ? (
            <div className={`text-center py-8 rounded-lg ${
              darkMode ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <div className="text-4xl mb-2">🔍</div>
              <h3 className={`font-bold mb-2 ${
                darkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>No problems match the current filters</h3>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                Try adjusting the rating range or{' '}
                <button 
                  onClick={resetFilters}
                  className={`underline font-medium ${
                    darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-800'
                  }`}
                >
                  clear all filters
                </button>.
              </p>
            </div>
          ) : results && results.allProblemsCount === 0 ? (
            <div className={`text-center py-8 rounded-lg ${
              darkMode ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <div className="text-4xl mb-2">🎉</div>
              <h3 className={`font-bold mb-2 ${
                darkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>No recommendations found!</h3>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                {results.user1} has already solved all problems that {results.user2} has solved,
                or they have very different problem sets.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}