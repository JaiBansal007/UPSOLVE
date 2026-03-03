export default function ProblemCard({ problem, onDelete, onToggleSolved, hideTags, isSelected }) {
  const getRatingBg = (rating) => {
    if (!rating) return 'bg-gray-800 text-gray-500 border border-gray-700';
    if (rating < 1200) return 'bg-green-950 text-green-400 border border-green-800';
    if (rating < 1600) return 'bg-cyan-950 text-cyan-400 border border-cyan-800';
    if (rating < 2000) return 'bg-blue-950 text-blue-400 border border-blue-800';
    if (rating < 2400) return 'bg-orange-950 text-orange-400 border border-orange-800';
    return 'bg-red-950 text-red-400 border border-red-800';
  };

  const isSolved = problem.solved || problem.solvedOnCF;

  return (
    <div className={`p-4 rounded-xl border transition-all duration-200 ${
      isSelected
        ? 'bg-[#1c1c1c] border-gray-600'
        : isSolved
          ? 'bg-[#0d160d] border-green-900/40'
          : 'bg-[#111] border-gray-800'
    }`}>
      <div className="flex items-start justify-between gap-4">
        {/* Left: Problem info */}
        <div className="flex-1 min-w-0">
          {/* Top row: ID + rating + solved badge */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-mono text-sm font-semibold text-gray-400 bg-black px-2 py-0.5 rounded border border-gray-800">
              {problem.contestId}{problem.index}
            </span>
            {problem.rating && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${getRatingBg(problem.rating)}`}>
                ★ {problem.rating}
              </span>
            )}
            {problem.solvedOnCF && (
              <span className="bg-green-950 text-green-400 border border-green-800 px-2 py-0.5 rounded text-xs font-medium">
                ✓ CF Solved
              </span>
            )}
            {problem.solved && !problem.solvedOnCF && (
              <span className="bg-green-950/50 text-green-500 border border-green-900 px-2 py-0.5 rounded text-xs font-medium">
                ✓ Solved
              </span>
            )}
          </div>

          {/* Problem name */}
          <h3 className={`text-base font-semibold mb-2 leading-snug ${
            isSolved ? 'text-gray-600 line-through decoration-gray-700' : 'text-gray-100'
          }`}>
            {problem.name}
          </h3>

          {/* Tags */}
          {!hideTags && (problem.tags?.length > 0 || problem.myTags?.length > 0) && (
            <div className="flex flex-wrap gap-1 mb-2">
              {problem.tags?.slice(0, 4).map((tag, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded text-xs bg-black text-gray-600 border border-gray-800">
                  {tag}
                </span>
              ))}
              {problem.tags?.length > 4 && (
                <span className="px-1.5 py-0.5 text-xs text-gray-700">
                  +{problem.tags.length - 4} more
                </span>
              )}
              {problem.myTags?.filter(t => t !== 'upsolve').map((tag, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded text-xs bg-indigo-950 text-indigo-400 border border-indigo-900">
                  {tag}
                </span>
              ))}
              {problem.myTags?.includes('upsolve') && (
                <span className="px-1.5 py-0.5 rounded text-xs bg-purple-950 text-purple-400 border border-purple-900">
                  upsolve
                </span>
              )}
            </div>
          )}

          {/* Link + date */}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <a
              href={problem.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="hover:text-blue-400 transition-colors"
            >
              codeforces.com ↗
            </a>
            <span>·</span>
            <span>{new Date(problem.addedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSolved(problem.id); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              isSolved
                ? 'bg-gray-900 hover:bg-gray-800 text-gray-500 border border-gray-800'
                : 'bg-green-950 hover:bg-green-900 text-green-400 border border-green-800'
            }`}
          >
            {isSolved ? 'Unsolve' : '✓ Solve'}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(problem.id); }}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-transparent hover:bg-red-950 text-gray-600 hover:text-red-400 border border-transparent hover:border-red-900 transition-all"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
