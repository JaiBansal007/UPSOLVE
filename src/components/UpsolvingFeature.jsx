import { useState, useEffect } from 'react';
import { codeforcesAPI } from '../services/codeforcesApi';

export default function UpsolvingFeature({ cfHandle, darkMode, onProblemAdd }) {
  const [loading, setLoading] = useState(false);
  const [contests, setContests] = useState([]);
  const [upsolvingProblems, setUpsolvingProblems] = useState([]);
  const [error, setError] = useState('');
  const [addingProblem, setAddingProblem] = useState(null);
  const [selectedDivisions, setSelectedDivisions] = useState(['Div. 2']); // Default to Div. 2

  const divisions = ['Div. 1', 'Div. 2', 'Div. 3', 'Div. 4'];

  const toggleDivision = (div) => {
    setSelectedDivisions(prev => {
      if (prev.includes(div)) {
        // Don't allow deselecting all divisions
        if (prev.length === 1) return prev;
        return prev.filter(d => d !== div);
      }
      return [...prev, div];
    });
  };

  const getContestDivision = (contestName) => {
    // Check for division in contest name
    for (const div of divisions) {
      if (contestName.includes(div) || contestName.includes(div.replace('. ', ''))) {
        return div;
      }
    }
    return null;
  };

  const fetchUpsolvingProblems = async () => {
    setLoading(true);
    setError('');

    try {
      // Fetch recent contests (we'll get more than 10 and filter)
      const response = await fetch('https://codeforces.com/api/contest.list');
      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error('Failed to fetch contests');
      }

      // Filter finished contests by selected divisions and get last 10 matching
      const finishedContests = data.result
        .filter(contest => contest.phase === 'FINISHED')
        .filter(contest => {
          const div = getContestDivision(contest.name);
          return div && selectedDivisions.includes(div);
        })
        .slice(0, 10);

      setContests(finishedContests);

      // Get user's solved problems
      const solvedProblems = await codeforcesAPI.getSolvedProblems(cfHandle);

      // For each contest, find the last unsolved problem
      const upsolvingProblemsData = [];
      
      for (const contest of finishedContests) {
        try {
          // Fetch contest problems
          const contestResponse = await fetch(`https://codeforces.com/api/contest.standings?contestId=${contest.id}&from=1&count=1`);
          const contestData = await contestResponse.json();
          
          if (contestData.status === 'OK' && contestData.result.problems) {
            const problems = contestData.result.problems;
            
            // Find the user's last solved problem index in this contest
            let lastSolvedIndex = -1;
            for (let i = 0; i < problems.length; i++) {
              const problem = problems[i];
              const problemId = `${problem.contestId}${problem.index}`;
              if (solvedProblems.has(problemId)) {
                lastSolvedIndex = i;
              }
            }

            // Find the first unsolved problem after the last solved one
            let nextUnsolvedProblem = null;
            const startIndex = lastSolvedIndex + 1;
            for (let i = startIndex; i < problems.length; i++) {
              const problem = problems[i];
              const problemId = `${problem.contestId}${problem.index}`;
              
              if (!solvedProblems.has(problemId)) {
                nextUnsolvedProblem = {
                  ...problem,
                  contestName: contest.name,
                  contestType: contest.type,
                  contestDivision: getContestDivision(contest.name),
                  url: codeforcesAPI.getProblemUrl(problem.contestId, problem.index)
                };
                break;
              }
            }

            if (nextUnsolvedProblem) {
              upsolvingProblemsData.push(nextUnsolvedProblem);
            }
          }
        } catch (contestError) {
          console.warn(`Failed to fetch contest ${contest.id}:`, contestError);
        }
      }

      setUpsolvingProblems(upsolvingProblemsData);
    } catch (error) {
      setError('Failed to fetch upsolving problems. Please try again.');
      console.error('Upsolving fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cfHandle) {
      fetchUpsolvingProblems();
    }
  }, [cfHandle, selectedDivisions]);

  const handleAddProblem = async (problem) => {
    setAddingProblem(problem.contestId + problem.index);
    
    try {
      const problemData = {
        contestId: problem.contestId,
        index: problem.index,
        name: problem.name,
        rating: problem.rating || null,
        tags: problem.tags || [],
        myTags: ['upsolve'],
        url: problem.url
      };

      if (onProblemAdd) {
        await onProblemAdd(problemData);
      }
    } catch (error) {
      console.error('Failed to add problem:', error);
    } finally {
      setAddingProblem(null);
    }
  };

  const getRatingColor = (rating) => {
    if (!rating) return darkMode ? 'text-gray-400' : 'text-gray-600';
    if (rating < 1200) return darkMode ? 'text-green-400' : 'text-green-600';
    if (rating < 1400) return darkMode ? 'text-green-300' : 'text-green-500';
    if (rating < 1600) return darkMode ? 'text-cyan-400' : 'text-cyan-600';
    if (rating < 1900) return darkMode ? 'text-blue-400' : 'text-blue-600';
    if (rating < 2100) return darkMode ? 'text-purple-400' : 'text-purple-600';
    if (rating < 2300) return darkMode ? 'text-yellow-400' : 'text-yellow-600';
    if (rating < 2400) return darkMode ? 'text-orange-400' : 'text-orange-600';
    return darkMode ? 'text-red-400' : 'text-red-600';
  };

  const getContestTypeColor = (type) => {
    switch (type) {
      case 'CF':
        return darkMode ? 'bg-blue-800 text-blue-300' : 'bg-blue-100 text-blue-700';
      case 'ICPC':
        return darkMode ? 'bg-green-800 text-green-300' : 'bg-green-100 text-green-700';
      case 'IOI':
        return darkMode ? 'bg-purple-800 text-purple-300' : 'bg-purple-100 text-purple-700';
      default:
        return darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className={`rounded-xl shadow-lg p-6 border transition-colors duration-200 ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-200'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-xl font-bold flex items-center gap-2 ${
          darkMode ? 'text-gray-100' : 'text-purple-800'
        }`}>
          <span className="text-2xl">🎯</span> Upsolving Recommendations
        </h3>
        
        <button
          onClick={fetchUpsolvingProblems}
          disabled={loading}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            darkMode
              ? 'bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 text-white'
              : 'bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white'
          }`}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Division Filter */}
      <div className="mb-6">
        <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Filter by Division:
        </p>
        <div className="flex flex-wrap gap-2">
          {divisions.map((div) => (
            <button
              key={div}
              onClick={() => toggleDivision(div)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors border ${
                selectedDivisions.includes(div)
                  ? darkMode
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-purple-600 border-purple-600 text-white'
                  : darkMode
                    ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {div}
            </button>
          ))}
        </div>
      </div>

      <p className={`mb-6 ${
        darkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        Next unsolved problem after your last solve from recent 10 {selectedDivisions.join(' / ')} contests for <strong>{cfHandle}</strong>
      </p>

      {loading && (
        <div className="text-center py-8">
          <div className={`animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4 ${
            darkMode ? 'border-gray-400' : 'border-purple-600'
          }`}></div>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Analyzing recent contests and your submissions...
          </p>
        </div>
      )}

      {error && (
        <div className={`border rounded-lg p-4 mb-6 ${
          darkMode
            ? 'bg-red-900/20 border-red-700 text-red-300'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <div className="flex items-center gap-2">
            <span>❌</span>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {!loading && !error && upsolvingProblems.length > 0 && (
        <div className="space-y-4">
          {upsolvingProblems.map((problem, index) => (
            <div
              key={`${problem.contestId}-${problem.index}`}
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                darkMode
                  ? 'border-gray-600 bg-gray-700 hover:bg-gray-600'
                  : 'border-gray-200 bg-gray-50 hover:bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className={`font-bold ${
                      darkMode ? 'text-gray-100' : 'text-gray-800'
                    }`}>
                      {problem.contestId}{problem.index}. {problem.name}
                    </h4>
                    
                    {problem.rating && (
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        darkMode ? 'bg-gray-800' : 'bg-white'
                      } ${getRatingColor(problem.rating)}`}>
                        {problem.rating}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getContestTypeColor(problem.contestType)}`}>
                      {problem.contestType || 'Contest'}
                    </span>
                    {problem.contestDivision && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        darkMode ? 'bg-purple-800 text-purple-300' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {problem.contestDivision}
                      </span>
                    )}
                    <span className={`text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      from {problem.contestName}
                    </span>
                  </div>

                  <a
                    href={problem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-xs font-medium hover:underline ${
                      darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                    }`}
                  >
                    View Problem →
                  </a>

                  {problem.tags && problem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {problem.tags.slice(0, 5).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className={`px-2 py-1 text-xs rounded ${
                            darkMode
                              ? 'bg-gray-800 text-gray-400'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                      {problem.tags.length > 5 && (
                        <span className={`px-2 py-1 text-xs rounded ${
                          darkMode ? 'text-gray-500' : 'text-gray-500'
                        }`}>
                          +{problem.tags.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleAddProblem(problem)}
                  disabled={addingProblem === (problem.contestId + problem.index)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    darkMode
                      ? 'bg-green-600 hover:bg-green-500 disabled:bg-green-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white'
                  }`}
                >
                  {addingProblem === (problem.contestId + problem.index) ? 'Adding...' : 'Add to List'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && upsolvingProblems.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🎉</div>
          <h4 className={`font-bold mb-2 ${
            darkMode ? 'text-gray-200' : 'text-gray-800'
          }`}>
            All caught up!
          </h4>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            You've solved all problems up to the end from recent {selectedDivisions.join(' / ')} contests. Great job!
          </p>
        </div>
      )}
    </div>
  );
}