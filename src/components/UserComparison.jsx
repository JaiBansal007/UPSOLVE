import { useState, useEffect } from 'react';
import { codeforcesAPI } from '../services/codeforcesApi';

export default function UserComparison({ darkMode }) {
  const [user1Handle, setUser1Handle] = useState('');
  const [user2Handle, setUser2Handle] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [addingProblems, setAddingProblems] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState({ min: 0, max: 4000 });
  const [filteredResults, setFilteredResults] = useState(null);
  const PROBLEMS_PER_PAGE = 30;

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

      setCurrentPage(1); // Reset to first page when new results come

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

  // Filter and paginate results
  const applyFilters = () => {
    if (!results) return;

    const filtered = results.recommendedProblems.filter(problem => {
      const rating = problem.rating || 0;
      return rating >= ratingFilter.min && rating <= ratingFilter.max;
    });

    setFilteredResults({
      ...results,
      recommendedProblems: filtered,
      filteredCount: filtered.length
    });
  };

  // Apply filters whenever results or rating filter changes
  useEffect(() => {
    applyFilters();
  }, [results, ratingFilter]);

  // Get current page problems
  const getCurrentPageProblems = () => {
    if (!filteredResults) return [];
    
    const startIndex = (currentPage - 1) * PROBLEMS_PER_PAGE;
    const endIndex = startIndex + PROBLEMS_PER_PAGE;
    return filteredResults.recommendedProblems.slice(startIndex, endIndex);
  };

  const totalPages = filteredResults 
    ? Math.ceil(filteredResults.recommendedProblems.length / PROBLEMS_PER_PAGE) 
    : 0;

  const currentPageProblems = getCurrentPageProblems();

  const resetFilters = () => {
    setRatingFilter({ min: 0, max: 4000 });
    setCurrentPage(1);
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
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
        
        <div>
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
        
        <div className="flex items-end">
          <button
            onClick={handleCompare}
            disabled={loading}
            className={`w-full px-6 py-2 rounded-lg font-medium transition-colors ${
              darkMode
                ? 'bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 text-white'
                : 'bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white'
            }`}
          >
            {loading ? 'Comparing...' : 'Compare Users'}
          </button>
        </div>
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
                  {filteredResults?.filteredCount || 0} problems
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-400' : 'text-gray-700'
                  }`}>Min Rating</label>
                  <input
                    type="number"
                    value={ratingFilter.min}
                    onChange={(e) => {
                      setRatingFilter(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }));
                      setCurrentPage(1);
                    }}
                    placeholder="0"
                    className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${
                      darkMode
                        ? 'border-gray-600 bg-gray-700 text-white focus:ring-gray-500'
                        : 'border-gray-300 focus:ring-2 focus:ring-purple-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-400' : 'text-gray-700'
                  }`}>Max Rating</label>
                  <input
                    type="number"
                    value={ratingFilter.max}
                    onChange={(e) => {
                      setRatingFilter(prev => ({ ...prev, max: parseInt(e.target.value) || 4000 }));
                      setCurrentPage(1);
                    }}
                    placeholder="4000"
                    className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${
                      darkMode
                        ? 'border-gray-600 bg-gray-700 text-white focus:ring-gray-500'
                        : 'border-gray-300 focus:ring-2 focus:ring-purple-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Recommended Problems */}
          {filteredResults && filteredResults.recommendedProblems.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-bold ${
                  darkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  Problems solved by {results.user2} but not by {results.user1}:
                </h3>
                
                {/* Page Info */}
                <div className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Showing {((currentPage - 1) * PROBLEMS_PER_PAGE) + 1}-{Math.min(
                    currentPage * PROBLEMS_PER_PAGE,
                    filteredResults.recommendedProblems.length
                  )} of {filteredResults.recommendedProblems.length}
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                {currentPageProblems.map((problem, index) => (
                  <div
                    key={problem.id}
                    className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                      darkMode
                        ? 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <a
                            href={codeforcesAPI.getProblemUrl(problem.contestId, problem.index)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`font-semibold hover:underline ${
                              darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                            }`}
                          >
                            {problem.contestId}{problem.index}. {problem.name}
                          </a>
                          {problem.rating && (
                            <span className={`px-2 py-1 text-xs font-bold rounded ${getRatingColor(problem.rating)} bg-opacity-10`}>
                              {problem.rating}
                            </span>
                          )}
                        </div>
                        {problem.tags && problem.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {problem.tags.slice(0, 5).map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className={`px-2 py-1 text-xs rounded ${
                                  darkMode
                                    ? 'bg-gray-700 text-gray-300'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {tag}
                              </span>
                            ))}
                            {problem.tags.length > 5 && (
                              <span className={`px-2 py-1 text-xs rounded ${
                                darkMode
                                  ? 'bg-gray-700 text-gray-400'
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                +{problem.tags.length - 5} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                      darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700'
                    }`}
                  >
                    ← Previous
                  </button>
                  
                  <div className="flex gap-1">
                    {/* Show page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                            currentPage === pageNum
                              ? darkMode
                                ? 'bg-gray-600 text-white'
                                : 'bg-purple-600 text-white'
                              : darkMode
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                      darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700'
                    }`}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          ) : filteredResults && filteredResults.recommendedProblems.length === 0 ? (
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