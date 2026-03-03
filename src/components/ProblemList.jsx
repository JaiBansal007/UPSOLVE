import ProblemCard from './ProblemCard';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';

const AnimatedItem = ({ children, delay = 0, index, onMouseEnter, onClick }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.3, triggerOnce: false });
  return (
    <motion.div
      ref={ref}
      data-index={index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      initial={{ scale: 0.96, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.96, opacity: 0 }}
      transition={{ duration: 0.18, delay }}
      className="mb-3 cursor-default"
    >
      {children}
    </motion.div>
  );
};

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
  const listRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [keyboardNav, setKeyboardNav] = useState(false);
  const [topGradientOpacity, setTopGradientOpacity] = useState(0);
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState(1);

  const sortedProblems = [...problems].sort((a, b) => {
    switch (sortBy) {
      case 'rating-asc': return (a.rating || 0) - (b.rating || 0);
      case 'rating-desc': return (b.rating || 0) - (a.rating || 0);
      case 'name': return a.name.localeCompare(b.name);
      case 'date-new': return new Date(b.addedAt) - new Date(a.addedAt);
      case 'date-old': return new Date(a.addedAt) - new Date(b.addedAt);
      default: return 0;
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

  const handleItemMouseEnter = useCallback(index => {
    setSelectedIndex(index);
  }, []);

  const handleScroll = useCallback(e => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    setTopGradientOpacity(Math.min(scrollTop / 50, 1));
    const bottomDistance = scrollHeight - (scrollTop + clientHeight);
    setBottomGradientOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1));
  }, []);

  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex(prev => Math.min(prev + 1, sortedProblems.length - 1));
      } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sortedProblems.length]);

  useEffect(() => {
    if (!keyboardNav || selectedIndex < 0 || !listRef.current) return;
    const container = listRef.current;
    const selectedItem = container.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedItem) {
      const extraMargin = 50;
      const containerScrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const itemTop = selectedItem.offsetTop;
      const itemBottom = itemTop + selectedItem.offsetHeight;
      if (itemTop < containerScrollTop + extraMargin) {
        container.scrollTo({ top: itemTop - extraMargin, behavior: 'smooth' });
      } else if (itemBottom > containerScrollTop + containerHeight - extraMargin) {
        container.scrollTo({ top: itemBottom - containerHeight + extraMargin, behavior: 'smooth' });
      }
    }
    setKeyboardNav(false);
  }, [selectedIndex, keyboardNav]);

  const statsTotal = allProblems.length;
  const statsSolved = allProblems.filter(p => p.solved || p.solvedOnCF).length;
  const statsUnsolved = statsTotal - statsSolved;

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center gap-4 px-1">
        <span className="text-2xl font-bold text-gray-100">Problems</span>
        <div className="flex items-center gap-3 ml-2">
          <span className="text-sm text-gray-600 bg-black border border-gray-800 px-2.5 py-1 rounded-lg">
            {statsTotal} total
          </span>
          <span className="text-sm text-green-500 bg-green-950 border border-green-900 px-2.5 py-1 rounded-lg">
            {statsSolved} solved
          </span>
          <span className="text-sm text-gray-500 bg-black border border-gray-800 px-2.5 py-1 rounded-lg">
            {statsUnsolved} pending
          </span>
        </div>
      </div>

      {/* Filters panel */}
      <div className="rounded-xl border border-gray-800 bg-[#0a0a0a] p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Filters</span>
          <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            Clear all
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          {/* Sort */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full px-3 py-2 bg-black border border-gray-800 text-gray-200 rounded-lg text-sm focus:border-gray-600 focus:outline-none"
            >
              <option value="date-new">Newest First</option>
              <option value="date-old">Oldest First</option>
              <option value="rating-asc">Rating ↑</option>
              <option value="rating-desc">Rating ↓</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={showSolved}
              onChange={(e) => onShowSolvedChange(e.target.value)}
              className="w-full px-3 py-2 bg-black border border-gray-800 text-gray-200 rounded-lg text-sm focus:border-gray-600 focus:outline-none"
            >
              <option value="all">All</option>
              <option value="solved">Solved</option>
              <option value="unsolved">Unsolved</option>
            </select>
          </div>

          {/* Min Rating */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Min rating</label>
            <select
              value={selectedRatingRange.min}
              onChange={(e) => onRatingRangeChange({ ...selectedRatingRange, min: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-black border border-gray-800 text-gray-200 rounded-lg text-sm focus:border-gray-600 focus:outline-none"
            >
              <option value={0}>Any</option>
              {Array.from({ length: 28 }, (_, i) => 800 + i * 100).map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Max Rating */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Max rating</label>
            <select
              value={selectedRatingRange.max}
              onChange={(e) => onRatingRangeChange({ ...selectedRatingRange, max: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-black border border-gray-800 text-gray-200 rounded-lg text-sm focus:border-gray-600 focus:outline-none"
            >
              {Array.from({ length: 28 }, (_, i) => 800 + i * 100).map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
              <option value={4000}>Any</option>
            </select>
          </div>
        </div>

        {/* Hide tags toggle */}
        <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-gray-500 hover:text-gray-300 transition-colors select-none">
          <div
            onClick={() => onHideTagsChange(!hideTags)}
            className={`w-8 h-4 rounded-full transition-colors relative ${hideTags ? 'bg-purple-700' : 'bg-gray-800'}`}
          >
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${hideTags ? 'left-4' : 'left-0.5'}`} />
          </div>
          Hide tags
        </label>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-900">
            <label className="block text-xs text-gray-600 mb-2">
              Tags {selectedTags.length > 0 && <span className="text-purple-500">({selectedTags.length} selected)</span>}
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
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
                  className={`px-2 py-0.5 rounded text-xs transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-purple-950 text-purple-400 border border-purple-800'
                      : 'bg-black text-gray-600 border border-gray-800 hover:border-gray-600 hover:text-gray-400'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Problems list */}
      {problems.length === 0 ? (
        <div className="border border-dashed border-gray-800 rounded-xl p-12 text-center bg-black/30">
          <div className="text-5xl mb-4 opacity-30">📝</div>
          <h3 className="text-lg font-semibold text-gray-600 mb-1">No problems yet</h3>
          <p className="text-sm text-gray-700">Add your first problem to start tracking</p>
        </div>
      ) : (
        <div className="relative">
          {/* Showing count */}
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="text-xs text-gray-500">Showing {sortedProblems.length} of {allProblems.length}</span>
            <span className="text-xs text-gray-600">· use ↑↓ to navigate</span>
          </div>

          {/* Scrollable animated list */}
          <div
            ref={listRef}
            className="max-h-[680px] overflow-y-auto pr-1
              [&::-webkit-scrollbar]:w-[4px]
              [&::-webkit-scrollbar-track]:bg-black
              [&::-webkit-scrollbar-thumb]:bg-gray-800
              [&::-webkit-scrollbar-thumb]:rounded-full"
            onScroll={handleScroll}
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#1f2937 #000' }}
          >
            {sortedProblems.map((problem, index) => (
              <AnimatedItem
                key={problem.id}
                index={index}
                delay={0.05}
                onMouseEnter={() => handleItemMouseEnter(index)}
              >
                <ProblemCard
                  problem={problem}
                  onDelete={onDelete}
                  onToggleSolved={onToggleSolved}
                  hideTags={hideTags}
                  isSelected={selectedIndex === index}
                />
              </AnimatedItem>
            ))}
          </div>

          {/* Scroll gradients */}
          <div
            className="absolute top-8 left-0 right-0 h-12 bg-gradient-to-b from-black to-transparent pointer-events-none transition-opacity duration-300"
            style={{ opacity: topGradientOpacity }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black to-transparent pointer-events-none transition-opacity duration-300"
            style={{ opacity: bottomGradientOpacity }}
          />
        </div>
      )}
    </div>
  );
}
