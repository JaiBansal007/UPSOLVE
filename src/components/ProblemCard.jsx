export default function ProblemCard({ problem, onDelete, onToggleSolved, hideTags, darkMode }) {
  const getDifficultyColor = (rating) => {
    if (!rating) return darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700';
    if (rating < 1200) return darkMode ? 'bg-green-800 text-green-300' : 'bg-green-100 text-green-700';
    if (rating < 1600) return darkMode ? 'bg-blue-800 text-blue-300' : 'bg-blue-100 text-blue-700';
    if (rating < 2000) return darkMode ? 'bg-purple-800 text-purple-300' : 'bg-purple-100 text-purple-700';
    if (rating < 2400) return darkMode ? 'bg-orange-800 text-orange-300' : 'bg-orange-100 text-orange-700';
    return darkMode ? 'bg-red-800 text-red-300' : 'bg-red-100 text-red-700';
  };

  return (
    <div className={`group hover:shadow-md transition-all duration-200 p-3 border-l-4 ${
      problem.solved || problem.solvedOnCF 
        ? darkMode
          ? 'border-l-green-500 bg-green-900/10 hover:bg-green-900/20'
          : 'border-l-green-500 bg-green-50/30 hover:bg-green-50/60'
        : darkMode
          ? 'border-l-purple-500 bg-gray-800/50 hover:bg-gray-800'
          : 'border-l-purple-500 bg-white hover:bg-purple-50/30'
    }`}>
      <div className="flex items-center justify-between gap-4">
        {/* Problem Info - Left Side */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className={`font-mono text-sm font-medium ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {problem.contestId}{problem.index}
            </span>
            
            {problem.rating && (
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getDifficultyColor(problem.rating)}`}>
                {problem.rating}
              </span>
            )}
            
            {problem.solvedOnCF && (
              <span className="bg-green-500 text-white px-1.5 py-0.5 rounded text-xs font-medium">
                ✓ CF
              </span>
            )}
            {problem.solved && !problem.solvedOnCF && (
              <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded">
                ✓ Local
              </span>
            )}
          </div>
          
          <h3 className={`text-sm font-medium truncate mb-1 ${
            darkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>
            {problem.name}
          </h3>
          
          <div className="flex items-center gap-4 text-xs">
            <a
              href={problem.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`hover:underline ${
                darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-purple-600 hover:text-purple-700'
              }`}
            >
              View Problem →
            </a>
            
            {!hideTags && (problem.tags?.length > 0 || problem.myTags?.length > 0) && (
              <div className="flex items-center gap-1 max-w-md">
                {problem.tags?.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className={`px-1.5 py-0.5 rounded text-xs ${
                      darkMode
                        ? 'bg-purple-800/50 text-purple-300'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
                {problem.tags?.length > 3 && (
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    +{problem.tags.length - 3}
                  </span>
                )}
                {problem.myTags?.length > 0 && (
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    darkMode
                      ? 'bg-indigo-800/50 text-indigo-300'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    📝 {problem.myTags.length}
                  </span>
                )}
              </div>
            )}
            
            {hideTags && (
              <span className="text-xs text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded">
                🔒 Tags hidden
              </span>
            )}
          </div>
        </div>

        {/* Actions - Right Side */}
        <div className="flex items-center gap-2">
          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {new Date(problem.addedAt).toLocaleDateString()}
          </span>
          
          <button
            onClick={() => onToggleSolved(problem.id)}
            className={`px-2 py-1 rounded text-xs font-medium transition ${
              problem.solved
                ? darkMode
                  ? 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {problem.solved ? 'Unsolve' : 'Solve'}
          </button>
          
          <button
            onClick={() => onDelete(problem.id)}
            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-medium transition opacity-70 group-hover:opacity-100"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
