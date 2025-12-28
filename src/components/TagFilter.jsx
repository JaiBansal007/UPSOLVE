import { useState, useEffect } from 'react';

export default function TagFilter({ problems, selectedTags, onTagsChange, selectedRatingRange, onRatingRangeChange, showSolved, onShowSolvedChange, hideTags, onHideTagsChange }) {
  const [allTags, setAllTags] = useState([]);

  useEffect(() => {
    // Extract all unique tags from problems
    const tagSet = new Set();
    problems.forEach(problem => {
      // Add Codeforces tags
      if (problem.tags) {
        problem.tags.forEach(tag => tagSet.add(tag));
      }
      // Add custom tags
      if (problem.myTags) {
        problem.myTags.forEach(tag => tagSet.add(tag));
      }
    });
    setAllTags(Array.from(tagSet).sort());
  }, [problems]);

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const clearFilters = () => {
    onTagsChange([]);
    onRatingRangeChange({ min: 0, max: 4000 });
    onShowSolvedChange('all');
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-purple-800 flex items-center gap-2">
          <span className="text-2xl">🔍</span> Filters
        </h2>
        <button
          onClick={clearFilters}
          className="text-sm text-purple-600 hover:text-purple-800 font-medium"
        >
          Clear All
        </button>
      </div>

      {/* Hide Tags Toggle */}
      <div className="mb-4 flex items-center justify-between p-2.5 bg-purple-50 rounded-lg border border-purple-200">
        <div>
          <div className="font-semibold text-gray-800 text-xs">Hide Tags</div>
          <div className="text-xs text-gray-600">For practice</div>
        </div>
        <button
          onClick={() => onHideTagsChange(!hideTags)}
          className={`relative inline-flex items-center h-5 rounded-full w-9 transition-colors ${
            hideTags ? 'bg-purple-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block w-3.5 h-3.5 transform bg-white rounded-full transition-transform ${
              hideTags ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Solved Status Filter */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Show Problems
        </label>
        <div className="flex gap-1.5">
          <button
            onClick={() => onShowSolvedChange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              showSolved === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onShowSolvedChange('unsolved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              showSolved === 'unsolved'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Unsolved
          </button>
          <button
            onClick={() => onShowSolvedChange('solved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              showSolved === 'solved'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Solved
          </button>
        </div>
      </div>

      {/* Rating Range Filter */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Rating Range
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            min="0"
            max="4000"
            step="100"
            value={selectedRatingRange.min}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 0;
              onRatingRangeChange({ ...selectedRatingRange, min: Math.min(val, selectedRatingRange.max) });
            }}
            className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            placeholder="Min"
          />
          <span className="text-gray-500 text-sm">to</span>
          <input
            type="number"
            min="0"
            max="4000"
            step="100"
            value={selectedRatingRange.max}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 4000;
              onRatingRangeChange({ ...selectedRatingRange, max: Math.max(val, selectedRatingRange.min) });
            }}
            className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            placeholder="Max"
          />
        </div>
      </div>

      {/* Tags Filter */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
        </label>
        {allTags.length === 0 ? (
          <p className="text-xs text-gray-500">No tags available</p>
        ) : (
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-lg">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-2 py-1 rounded-full text-xs font-medium transition ${
                  selectedTags.includes(tag)
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-400'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
