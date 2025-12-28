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
  onHideTagsChange
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
      <div className="bg-white rounded-xl shadow-md border border-purple-100 mb-6 p-4">
        {/* Top Row - Count and Sort */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-purple-100">
          <span className="text-2xl font-bold text-purple-800">
            📋 <span className="text-purple-600">({allProblems.length})</span>
          </span>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Sort:</label>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
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
            <span className="text-sm font-bold text-purple-800">🔍 Filters</span>
            <button
              onClick={clearFilters}
              className="text-sm text-purple-600 hover:text-purple-800 font-medium"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Solved Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={showSolved}
                onChange={(e) => onShowSolvedChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
              >
                <option value="all">All Problems</option>
                <option value="solved">Solved Only</option>
                <option value="unsolved">Unsolved Only</option>
              </select>
            </div>

            {/* Rating Min */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Min Rating</label>
              <input
                type="number"
                value={selectedRatingRange.min}
                onChange={(e) => onRatingRangeChange({ ...selectedRatingRange, min: parseInt(e.target.value) || 0 })}
                placeholder="Min"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>

            {/* Rating Max */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Max Rating</label>
              <input
                type="number"
                value={selectedRatingRange.max}
                onChange={(e) => onRatingRangeChange({ ...selectedRatingRange, max: parseInt(e.target.value) || 4000 })}
                placeholder="Max"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>

            {/* Hide Tags Toggle */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Display</label>
              <label className="flex items-center gap-2 cursor-pointer h-10 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={hideTags}
                  onChange={(e) => onHideTagsChange(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Hide Tags</span>
              </label>
            </div>
          </div>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Filter by Tags ({selectedTags.length} selected)
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200">
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
                        ? 'bg-purple-600 text-white'
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
        <div className="bg-purple-50 border-2 border-dashed border-purple-300 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-bold text-purple-800 mb-2">No problems yet</h3>
          <p className="text-gray-600">Add your first problem to start tracking!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedProblems.map(problem => (
            <ProblemCard
              key={problem.id}
              problem={problem}
              onDelete={onDelete}
              onToggleSolved={onToggleSolved}
              hideTags={hideTags}
            />
          ))}
        </div>
      )}
    </div>
  );
}
