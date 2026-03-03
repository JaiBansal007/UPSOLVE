import ProblemCard from './ProblemCard';
import { useState } from 'react';

export default function ProblemList({ 
  problems, 
  allProblems,
  onDelete, 
  onToggleSolved, 
  sortBy, 
  onSortChange, 
  hideTags,
  selectedTags,
  onTagsChange,
  selectedRatingRange,
  onRatingRangeChange,
  showSolved,
  onShowSolvedChange,
  onHideTagsChange,
  darkMode
}) {
  const [showFilters, setShowFilters] = useState(true);

  const sortedProblems = [...problems].sort((a, b) => {
    switch (sortBy) {
      case 'rating-asc':
        return (a.rating || 0) - (b.rating || 0);
      case 'rating-desc':
        return (b.rating || 0) - (a.rating || 0);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'date-new':
        return new Date(b.addedAt) - new Date(a.addedAt);
      case 'date-old':
        return new Date(a.addedAt) - new Date(b.addedAt);
      default:
        return 0;
    }
  });

  const allTags = [...new Set(
    allProblems.flatMap(p => [...(p.tags || []), ...(p.myTags || [])])
  )].sort();

  const clearFilters = () => {
    onTagsChange([]);
    onRatingRangeChange({ min: 0, max: 4000 });
    onShowSolvedChange('all');
  };

  return (
    <div>
      {/* Header with Filters */}
      <div className={`rounded-xl shadow-md border p-4 mb-6 transition-colors duration-200 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-purple-100'
      }`}>
        {/* Top Row - Count and Sort */}
        <div className={`flex justify-between items-center mb-4 pb-3 border-b ${
          darkMode ? 'border-gray-700' : 'border-purple-100'
        }`}>
          <span className={`text-2xl font-bold ${
            darkMode ? 'text-gray-100' : 'text-purple-800'
          }`}>
            📋 <span className={darkMode ? 'text-gray-300' : 'text-purple-600'}>({allProblems.length})</span>
          </span>
          
          <div className="flex items-center gap-2">
            <label className={`text-sm font-medium ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>Sort:</label>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className={`px-3 py-2 border rounded-lg text-sm transition-colors ${
                darkMode
                  ? 'border-gray-600 bg-gray-700 text-white focus:ring-gray-500 focus:border-transparent'
                  : 'border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
              }`}
            >
              <option value="date-new">Newest First</option>
              <option value="date-old">Oldest First</option>
              <option value="rating-asc">Rating: Low to High</option>
              <option value="rating-desc">Rating: High to Low</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filters Row */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className={`text-sm font-bold ${
              darkMode ? 'text-gray-200' : 'text-purple-800'
            }`}>🔍 Filters</span>
            <button
              onClick={clearFilters}
              className={`text-sm font-medium ${
                darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-purple-600 hover:text-purple-800'
              }`}
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Solved Status Filter */}
            <div>
              <label className={`block text-xs font-medium mb-1 ${
                darkMode ? 'text-gray-400' : 'text-gray-700'
              }`}>Status</label>
              <select
                value={showSolved}
                onChange={(e) => onShowSolvedChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${
                  darkMode
                    ? 'border-gray-600 bg-gray-700 text-white focus:ring-gray-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-purple-500'
                }`}
              >
                <option value="all">All Problems</option>
                <option value="solved">Solved Only</option>
                <option value="unsolved">Unsolved Only</option>
              </select>
            </div>

            {/* Rating Min */}
            <div>
              <label className={`block text-xs font-medium mb-1 ${
                darkMode ? 'text-gray-400' : 'text-gray-700'
              }`}>Min Rating</label>
              <input
                type="number"
                value={selectedRatingRange.min}
                onChange={(e) => onRatingRangeChange({ ...selectedRatingRange, min: parseInt(e.target.value) || 0 })}
                placeholder="Min"
                className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${
                  darkMode
                    ? 'border-gray-600 bg-gray-700 text-white focus:ring-gray-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-purple-500'
                }`}
              />
            </div>

            {/* Rating Max */}
            <div>
              <label className={`block text-xs font-medium mb-1 ${
                darkMode ? 'text-gray-400' : 'text-gray-700'
              }`}>Max Rating</label>
              <input
                type="number"
                value={selectedRatingRange.max}
                onChange={(e) => onRatingRangeChange({ ...selectedRatingRange, max: parseInt(e.target.value) || 4000 })}
                placeholder="Max"
                className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${
                  darkMode
                    ? 'border-gray-600 bg-gray-700 text-white focus:ring-gray-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-purple-500'
                }`}
              />
            </div>

            {/* Hide Tags Toggle */}
            <div>
              <label className={`block text-xs font-medium mb-1 ${
                darkMode ? 'text-gray-400' : 'text-gray-700'
              }`}>Display</label>
              <label className={`flex items-center gap-2 cursor-pointer h-10 px-3 py-2 border rounded-lg transition-colors ${
                darkMode
                  ? 'border-gray-600 hover:bg-gray-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}>
                <input
                  type="checkbox"
                  checked={hideTags}
                  onChange={(e) => onHideTagsChange(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className={`text-sm ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Hide Tags</span>
              </label>
            </div>
          </div>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <div>
              <label className={`block text-xs font-medium mb-1 ${
                darkMode ? 'text-gray-400' : 'text-gray-700'
              }`}>
                Filter by Tags ({selectedTags.length} selected)
              </label>
              <div className={`flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      if (selectedTags.includes(tag)) {
                        onTagsChange(selectedTags.filter(t => t !== tag));
                      } else {
                        onTagsChange([...selectedTags, tag]);
                      }
                    }}
                    className={`px-2 py-1 rounded text-xs font-medium transition ${
                      selectedTags.includes(tag)
                        ? darkMode
                          ? 'bg-gray-600 text-white'
                          : 'bg-purple-600 text-white'
                        : darkMode
                          ? 'bg-gray-800 text-gray-300 hover:bg-gray-600 border border-gray-600'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {problems.length === 0 ? (
        <div className={`border-2 border-dashed rounded-lg p-12 text-center ${
          darkMode
            ? 'border-gray-600 bg-gray-800/50'
            : 'border-purple-300 bg-purple-50'
        }`}>
          <div className="text-6xl mb-4">📝</div>
          <h3 className={`text-xl font-bold mb-2 ${
            darkMode ? 'text-gray-200' : 'text-purple-800'
          }`}>No problems yet</h3>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Add your first problem to start tracking!
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {/* List Header */}
          <div className={`px-3 py-2 border-b text-xs font-semibold ${
            darkMode 
              ? 'border-gray-700 text-gray-400 bg-gray-800/30' 
              : 'border-gray-200 text-gray-600 bg-gray-50'
          }`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-16">
                  <span>PROBLEM</span>
                  <span>TAGS</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span>ADDED</span>
                <span>ACTIONS</span>
              </div>
            </div>
          </div>
          
          {/* Problem Items */}
          {sortedProblems.map(problem => (
            <ProblemCard
              key={problem.id}
              problem={problem}
              onDelete={onDelete}
              onToggleSolved={onToggleSolved}
              hideTags={hideTags}
              darkMode={darkMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
