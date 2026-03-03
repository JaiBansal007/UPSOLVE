import { useState, useEffect } from 'react';
import { codeforcesAPI } from '../services/codeforcesApi';

// How many recent contests to consider per division
const MAX_CONTESTS = 20;

function getCacheKey(handle, divisions) {
  return `upsolve_cache_v3_${handle}_${[...divisions].sort().join('_')}`;
}
function loadCache(handle, divisions) {
  try {
    const raw = localStorage.getItem(getCacheKey(handle, divisions));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveCache(handle, divisions, data) {
  try {
    localStorage.setItem(getCacheKey(handle, divisions), JSON.stringify(data));
  } catch (e) { console.warn('Failed to save upsolve cache', e); }
}

export default function UpsolvingFeature({ cfHandle, darkMode, onProblemAdd }) {
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [upsolvingProblems, setUpsolvingProblems] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState('');
  const [addingProblem, setAddingProblem] = useState(null);
  const [selectedDivisions, setSelectedDivisions] = useState(['Div. 2']);
  const [minRating, setMinRating] = useState(800);
  const [maxRating, setMaxRating] = useState(2000);

  const divisions = ['Div. 1', 'Div. 2', 'Div. 3', 'Div. 4'];

  // All valid ratings (multiples of 100, >= 800)
  const ALL_RATINGS = Array.from({ length: 28 }, (_, i) => 800 + i * 100);

  const toggleDivision = (div) => {
    setSelectedDivisions(prev => {
      if (prev.includes(div)) {
        if (prev.length === 1) return prev;
        return prev.filter(d => d !== div);
      }
      return [...prev, div];
    });
  };

  const getContestDivision = (contestName) => {
    for (const div of divisions) {
      if (contestName.includes(div) || contestName.includes(div.replace('. ', ''))) {
        return div;
      }
    }
    return null;
  };

  // Fetch everything in 3 parallel-friendly calls, filter locally — no per-contest loops
  const smartUpdate = async () => {
    setLoading(true);
    setError('');

    try {
      // Step 1 + 2 in parallel: contest list & user submissions
      setLoadingStatus('Fetching contests and submissions...');
      const [contestRes, solvedSet, allProblems] = await Promise.all([
        codeforcesAPI.fetchWithRetry('https://codeforces.com/api/contest.list').then(r => r.json()),
        codeforcesAPI.getSolvedProblems(cfHandle),
        codeforcesAPI.fetchAllProblems(),   // cached for 1 hr in codeforcesAPI
      ]);

      if (contestRes.status !== 'OK') throw new Error('Failed to fetch contest list');

      setLoadingStatus('Filtering problems...');

      // Build a map: contestId → { name, division, type } for the last MAX_CONTESTS per division
      const contestMap = new Map();
      const divisionCount = {};

      for (const contest of contestRes.result) {
        if (contest.phase !== 'FINISHED') continue;
        const div = getContestDivision(contest.name);
        if (!div || !selectedDivisions.includes(div)) continue;

        divisionCount[div] = (divisionCount[div] || 0);
        if (divisionCount[div] >= MAX_CONTESTS) continue;

        contestMap.set(contest.id, {
          name: contest.name,
          division: div,
          type: contest.type,
        });
        divisionCount[div]++;
      }

      // Filter problemset: must be from one of our pool contests and not solved
      const upsolvingProblemsData = allProblems
        .filter(p => {
          const cid = p.contestId;
          if (!cid || !contestMap.has(cid)) return false;
          const pid = `${cid}${p.index}`;
          return !solvedSet.has(pid);
        })
        .map(p => {
          const meta = contestMap.get(p.contestId);
          return {
            ...p,
            contestName: meta.name,
            contestType: meta.type,
            contestDivision: meta.division,
            url: codeforcesAPI.getProblemUrl(p.contestId, p.index),
          };
        });

      // Persist to localStorage
      const now = new Date().toISOString();
      saveCache(cfHandle, selectedDivisions, {
        problems: upsolvingProblemsData,
        lastUpdated: now,
      });

      setUpsolvingProblems(upsolvingProblemsData);
      setLastUpdated(now);
    } catch (err) {
      const isRateLimit = err.message?.includes('429') || err.message?.includes('503') || err.message?.includes('rate');
      setError(
        isRateLimit
          ? 'Codeforces API is rate limiting requests. Please wait a moment and try again.'
          : 'Failed to fetch upsolving problems. Please try again.'
      );
      console.error('Upsolving fetch error:', err);
    } finally {
      setLoading(false);
      setLoadingStatus('');
    }
  };

  useEffect(() => {
    if (!cfHandle) return;
    // Immediately show cached data so the UI isn't blank while updating
    const cache = loadCache(cfHandle, selectedDivisions);
    if (cache?.problems?.length) {
      setUpsolvingProblems(cache.problems);
      setLastUpdated(cache.lastUpdated);
    } else {
      setUpsolvingProblems([]);
    }
    // Then smart-update in the background
    smartUpdate();
  }, [cfHandle, selectedDivisions]);

  // Filter problems by rating range
  const filteredProblems = upsolvingProblems.filter(problem => {
    const rating = problem.rating || 0;
    return rating >= minRating && rating <= maxRating;
  }).sort((a, b) => (a.rating || 0) - (b.rating || 0)); // Sort by rating ascending

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
    if (!rating) return 'text-gray-400';
    if (rating < 1200) return 'text-green-400';
    if (rating < 1400) return 'text-green-300';
    if (rating < 1600) return 'text-cyan-400';
    if (rating < 1900) return 'text-blue-400';
    if (rating < 2100) return 'text-purple-400';
    if (rating < 2300) return 'text-yellow-400';
    if (rating < 2400) return 'text-orange-400';
    return 'text-red-400';
  };

  const getContestTypeColor = (type) => {
    switch (type) {
      case 'CF':
        return 'bg-blue-900/50 text-blue-300';
      case 'ICPC':
        return 'bg-green-900/50 text-green-300';
      case 'IOI':
        return 'bg-purple-900/50 text-purple-300';
      default:
        return 'bg-gray-800 text-gray-300';
    }
  };

  return (
    <div className="rounded-xl shadow-lg p-6 border transition-colors duration-200 bg-black/60 border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2 text-gray-100">
          <span className="text-2xl">🎯</span> Upsolving Recommendations
        </h3>
        
        <div className="flex items-center gap-3">
          {lastUpdated && !loading && (
            <span className="text-xs text-gray-500">
              Updated {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={smartUpdate}
            disabled={loading}
            className="px-4 py-2 rounded-lg font-medium transition-colors bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 text-white"
          >
            {loading ? 'Updating...' : 'Check for New'}
          </button>
        </div>
      </div>

      {/* Division Filter */}
      <div className="mb-4">
        <p className="text-sm mb-3 text-gray-400">
          Filter by Division:
        </p>
        <div className="flex flex-wrap gap-2">
          {divisions.map((div) => (
            <button
              key={div}
              onClick={() => toggleDivision(div)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors border ${
                selectedDivisions.includes(div)
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800'
              }`}
            >
              {div}
            </button>
          ))}
        </div>
      </div>

      {/* Rating Filter */}
      <div className="mb-6">
        <p className="text-sm mb-3 text-gray-400">
          Problem Rating Range:
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Min:</span>
            <select
              value={minRating}
              onChange={(e) => setMinRating(parseInt(e.target.value))}
              className="px-3 py-2 border rounded-lg font-medium transition-colors border-gray-700 bg-gray-900 text-white"
            >
              {ALL_RATINGS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Max:</span>
            <select
              value={maxRating}
              onChange={(e) => setMaxRating(parseInt(e.target.value))}
              className="px-3 py-2 border rounded-lg font-medium transition-colors border-gray-700 bg-gray-900 text-white"
            >
              {ALL_RATINGS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            ({filteredProblems.length} problems)
          </span>
        </div>
      </div>

      <p className={`mb-6 ${
        darkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        Unsolved problems ({minRating}–{maxRating} rating) from the last {MAX_CONTESTS} {selectedDivisions.join(' / ')} contests for <strong>{cfHandle}</strong>.
        Fetched from the full problemset in one shot — cached locally for instant reload.
      </p>

      {/* How recommendations work info */}
      {/* <div className={`mb-6 p-4 rounded-lg border ${
        darkMode 
          ? 'bg-gray-700/50 border-gray-600' 
          : 'bg-purple-50 border-purple-200'
      }`}>
        <h4 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${
          darkMode ? 'text-gray-200' : 'text-purple-800'
        }`}>
          <span>💡</span> How we recommend problems
        </h4>
        <ul className={`text-xs space-y-1 ${
          darkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          <li>• We fetch problems from the last 100 contests of your selected divisions</li>
          <li>• Filter out problems you've already solved on Codeforces</li>
          <li>• Show only problems within your selected rating range</li>
          <li>• Problems are sorted by rating (lowest first) for gradual progression</li>
        </ul>
      </div> */}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4 border-gray-400"></div>
          <p className="text-gray-400">
            {loadingStatus || 'Fetching problems...'}
          </p>
          <p className="text-xs text-gray-600 mt-2">Fetching from problemset — no per-contest loops, much faster</p>
        </div>
      )}

      {error && (
        <div className="border rounded-lg p-4 mb-6 bg-red-900/20 border-red-700 text-red-300">
          <div className="flex items-center gap-2">
            <span>❌</span>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {!loading && !error && filteredProblems.length > 0 && (
        <div className="space-y-4">
          {filteredProblems.map((problem, index) => (
            <div
              key={`${problem.contestId}-${problem.index}`}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow border-gray-700 bg-gray-900/60 hover:bg-gray-800/60"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-bold text-gray-100">
                      {problem.contestId}{problem.index}. {problem.name}
                    </h4>
                    
                    {problem.rating && (
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold bg-gray-800 ${getRatingColor(problem.rating)}`}>
                        {problem.rating}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getContestTypeColor(problem.contestType)}`}>
                      {problem.contestType || 'Contest'}
                    </span>
                    {problem.contestDivision && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-purple-900/50 text-purple-300">
                        {problem.contestDivision}
                      </span>
                    )}
                    <span className="text-sm text-gray-400">
                      from {problem.contestName}
                    </span>
                  </div>

                  <a
                    href={problem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium hover:underline text-blue-400 hover:text-blue-300"
                  >
                    View Problem →
                  </a>

                  {problem.tags && problem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {problem.tags.slice(0, 5).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-2 py-1 text-xs rounded bg-gray-800 text-gray-400"
                        >
                          {tag}
                        </span>
                      ))}
                      {problem.tags.length > 5 && (
                        <span className="px-2 py-1 text-xs rounded text-gray-500">
                          +{problem.tags.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleAddProblem(problem)}
                  disabled={addingProblem === (problem.contestId + problem.index)}
                  className="px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap bg-green-600 hover:bg-green-500 disabled:bg-green-700 text-white"
                >
                  {addingProblem === (problem.contestId + problem.index) ? 'Adding...' : 'Add to List'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && upsolvingProblems.length > 0 && filteredProblems.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🔍</div>
          <h4 className="font-bold mb-2 text-gray-200">
            No problems match your rating filter
          </h4>
          <p className="text-gray-400">
            Try increasing the max rating to see more problems.
          </p>
        </div>
      )}

      {!loading && !error && upsolvingProblems.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🎉</div>
          <h4 className="font-bold mb-2 text-gray-200">
            All caught up!
          </h4>
          <p className="text-gray-400">
            You've solved all problems from the last {MAX_CONTESTS} {selectedDivisions.join(' / ')} contests. Great job!
          </p>
        </div>
      )}
    </div>
  );
}