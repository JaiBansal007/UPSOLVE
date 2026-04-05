import React, { useState, useEffect, useMemo } from 'react';
import { codeforcesAPI } from '../services/codeforcesApi';

const DIVISIONS = ['All', 'Div. 1', 'Div. 2', 'Div. 3', 'Div. 4', 'Educational', 'Global'];
const RATINGS = Array.from({ length: 28 }, (_, i) => 800 + i * 100); // 800 to 3500
const STATUSES = ['Not Tried', 'WA', 'AC'];

export default function RatingGrind({ darkMode, cfHandle }) {
  const [rating, setRating] = useState(() => Number(localStorage.getItem('rg_rating')) || 1200);
  const [divType, setDivType] = useState(() => localStorage.getItem('rg_divType') || 'All');
  const [selectedStatuses, setSelectedStatuses] = useState(() => {
    const saved = localStorage.getItem('rg_statuses');
    return saved ? JSON.parse(saved) : ['Not Tried', 'WA'];
  });
  const [selectedTags, setSelectedTags] = useState(() => {
    const saved = localStorage.getItem('rg_tags');
    return saved ? JSON.parse(saved) : [];
  });
  const [showTags, setShowTags] = useState(false);

  const [problems, setProblems] = useState([]);
  const [contestsMap, setContestsMap] = useState({});
  const [problemStatus, setProblemStatus] = useState({});
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(true);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('rg_rating', rating);
    localStorage.setItem('rg_divType', divType);
    localStorage.setItem('rg_statuses', JSON.stringify(selectedStatuses));
    localStorage.setItem('rg_tags', JSON.stringify(selectedTags));
  }, [rating, divType, selectedStatuses, selectedTags]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const promises = [
          codeforcesAPI.fetchAllProblems(),
          codeforcesAPI.getAllContests()
        ];
        
        if (cfHandle) {
          promises.push(codeforcesAPI.fetchUserSubmissions(cfHandle));
        }

        const results = await Promise.all(promises);
        const probs = results[0];
        const conts = results[1];
        const subs = cfHandle ? results[2] : [];

        setProblems(probs);
        
        const map = {};
        conts.forEach(c => {
          map[c.id] = c.name;
        });
        setContestsMap(map);

        const statusMap = {};
        if (subs) {
          subs.forEach(sub => {
            const key = `${sub.problem.contestId}${sub.problem.index}`;
            if (sub.verdict === 'OK') {
              statusMap[key] = 'AC';
            } else {
              if (statusMap[key] !== 'AC') {
                statusMap[key] = 'WA';
              }
            }
          });
        }
        setProblemStatus(statusMap);

        const tagSet = new Set();
        probs.forEach(p => {
          if (p.tags) p.tags.forEach(t => tagSet.add(t));
        });
        setAllTags(Array.from(tagSet).sort());

      } catch (err) {
        console.error("Failed to fetch CF data", err);
      }
      setLoading(false);
    };
    fetchData();
  }, [cfHandle]);

  const filteredProblems = useMemo(() => {
    if (!problems.length) return [];
    
    let filtered = problems.filter(p => p.rating === rating);
    
    // Filter by attempt status
    filtered = filtered.filter(p => {
      const key = `${p.contestId}${p.index}`;
      const status = problemStatus[key] || 'Not Tried';
      return selectedStatuses.includes(status);
    });
    
    // Filter by division
    if (divType !== 'All') {
      filtered = filtered.filter(p => {
        const contestName = contestsMap[p.contestId] || '';
        if (divType === 'Div. 1') return contestName.includes('Div. 1') || contestName.includes('Div 1');
        if (divType === 'Div. 2') return contestName.includes('Div. 2') || contestName.includes('Div 2');
        if (divType === 'Div. 3') return contestName.includes('Div. 3') || contestName.includes('Div 3');
        if (divType === 'Div. 4') return contestName.includes('Div. 4') || contestName.includes('Div 4');
        if (divType === 'Educational') return contestName.includes('Educational') || contestName.includes('Edu');
        if (divType === 'Global') return contestName.includes('Global');
        return true;
      });
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(p => {
        if (!p.tags) return false;
        return selectedTags.some(tag => p.tags.includes(tag));
      });
    }
    
    return filtered.slice(0, 100);
  }, [problems, contestsMap, rating, divType, problemStatus, selectedStatuses, selectedTags]);

  const getRatingBg = (val) => {
    if (!val) return 'bg-gray-800 text-gray-500 border-gray-700';
    if (val < 1200) return 'bg-green-950 text-green-400 border-green-800';
    if (val < 1600) return 'bg-cyan-950 text-cyan-400 border-cyan-800';
    if (val < 2000) return 'bg-blue-950 text-blue-400 border-blue-800';
    if (val < 2400) return 'bg-orange-950 text-orange-400 border-orange-800';
    return 'bg-red-950 text-red-400 border-red-800';
  };

  const toggleStatus = (status) => {
    setSelectedStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#111] border-gray-800' : 'bg-white border-gray-200'}`}>
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
          Rating Grind
        </h2>
        <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Practice specific problem types. Customize filters and tags to hone your skills. Shows up to 100 problems.
        </p>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-[0.5]">
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Rating
              </label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className={`w-full p-3 rounded-xl border text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all ${
                  darkMode
                    ? 'bg-black border-gray-800 text-gray-200 hover:bg-gray-900/50'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100/50'
                }`}
              >
                {RATINGS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="flex-[0.5]">
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Division
              </label>
              <select
                value={divType}
                onChange={(e) => setDivType(e.target.value)}
                className={`w-full p-3 rounded-xl border text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all ${
                  darkMode
                    ? 'bg-black border-gray-800 text-gray-200 hover:bg-gray-900/50'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100/50'
                }`}
              >
                {DIVISIONS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Status Filter
              </label>
              <div className="flex gap-2">
                {STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleStatus(s)}
                    className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold uppercase transition-colors border ${
                      selectedStatuses.includes(s)
                        ? 'bg-violet-600 text-white border-violet-600 shadow-md'
                        : darkMode 
                          ? 'bg-black border-gray-800 text-gray-400 hover:bg-gray-900' 
                          : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label 
                className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setShowTags(!showTags)}
              >
                Problem Tags (Optional)
                <span className={`text-[10px] transition-transform duration-200 ${showTags ? 'rotate-90' : ''}`}>▶</span>
              </label>
              {selectedTags.length > 0 && (
                <button 
                  onClick={() => setSelectedTags([])}
                  className={`text-xs font-medium hover:underline ${darkMode ? 'text-violet-400' : 'text-violet-600'}`}
                >
                  Clear Tags
                </button>
              )}
            </div>
            
            {showTags && (
              <div className={`p-3 rounded-xl border flex flex-wrap gap-2 max-h-40 overflow-y-auto mb-2 ${
                darkMode ? 'bg-black border-gray-800' : 'bg-gray-50 border-gray-200'
              }`}>
                {allTags.length > 0 ? (
                  allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors border ${
                        selectedTags.includes(tag)
                          ? 'bg-violet-600/20 text-violet-400 border-violet-600/30'
                          : darkMode 
                            ? 'bg-[#111] text-gray-400 border-gray-800 hover:bg-[#1a1a1a] hover:border-gray-700' 
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 shadow-sm'
                      }`}
                    >
                      {tag}
                    </button>
                  ))
                ) : (
                  <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>Loading tags...</span>
                )}
              </div>
            )}

            {!showTags && selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {selectedTags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 text-[10px] rounded-md font-medium bg-violet-600/20 text-violet-400 border border-violet-600/30">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        {loading ? (
          <div className={`flex flex-col items-center justify-center py-20 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className={`animate-spin rounded-full h-10 w-10 border-4 mb-4 ${
              darkMode ? 'border-gray-800 border-t-violet-500' : 'border-gray-200 border-t-violet-500'
            }`}></div>
            <span>Fetching Codeforces data...</span>
          </div>
        ) : filteredProblems.length > 0 ? (
          <div className="flex flex-col gap-2">
            {filteredProblems.map((prob, index) => {
              const key = `${prob.contestId}${prob.index}`;
              const status = problemStatus[key] || 'Not Tried';
              
              return (
                <div key={key} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                  darkMode 
                    ? 'bg-[#111] border-gray-800 hover:bg-[#161616] hover:border-gray-700' 
                    : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}>
                  <div className="flex items-center gap-3 sm:gap-4 flex-1">
                    <span className={`text-sm font-bold shrink-0 w-6 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {index + 1}.
                    </span>
                    <span className={`font-mono text-sm font-semibold w-16 text-center py-1 rounded border shrink-0 ${
                      darkMode ? 'bg-black text-gray-400 border-gray-800' : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      {prob.contestId}{prob.index}
                    </span>
                    <a
                      href={`https://codeforces.com/problemset/problem/${prob.contestId}/${prob.index}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`font-semibold transition-colors flex-1 line-clamp-1 ${
                        darkMode ? 'text-gray-200 hover:text-violet-400' : 'text-gray-800 hover:text-violet-600'
                      }`}
                    >
                      {prob.name}
                    </a>
                  </div>
                  
                  <div className="flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap shrink-0">
                    <span className={`px-2 py-1 rounded text-xs font-semibold border ${getRatingBg(prob.rating)}`}>
                      ★ {prob.rating}
                    </span>
                    <span className={`w-24 text-center px-2 py-1 rounded text-xs font-semibold border tracking-wider uppercase ${
                      status === 'WA' 
                        ? 'bg-red-950 text-red-500 border-red-900/50' 
                        : status === 'AC'
                        ? 'bg-emerald-950 text-emerald-500 border-emerald-900/50'
                        : darkMode ? 'bg-black text-gray-500 border-gray-800' : 'bg-gray-50 text-gray-500 border-gray-200'
                    }`}>
                      {status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`py-20 text-center rounded-2xl border ${
            darkMode ? 'bg-[#111] border-gray-800 text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-500'
          }`}>
            <span className="text-4xl block mb-3">🔍</span>
            <p>No problems found matching your current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
