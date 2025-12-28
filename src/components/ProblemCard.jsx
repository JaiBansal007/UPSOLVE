export default function ProblemCard({ problem, onDelete, onToggleSolved, hideTags }) {
  const getDifficultyColor = (rating) => {
    if (!rating) return 'bg-gray-100 text-gray-700';
    if (rating < 1200) return 'bg-green-100 text-green-700';
    if (rating < 1600) return 'bg-blue-100 text-blue-700';
    if (rating < 2000) return 'bg-purple-100 text-purple-700';
    if (rating < 2400) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 p-4 border-2 ${
      problem.solved || problem.solvedOnCF ? 'border-green-500 bg-green-50/50' : 'border-purple-200 hover:border-purple-300'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="text-base font-bold text-gray-800 mb-1">
            {problem.contestId}{problem.index}: {problem.name}
          </h3>
          
          <a
            href={problem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 hover:text-purple-800 text-xs font-medium hover:underline"
          >
            View on Codeforces →
          </a>
        </div>

        <div className="flex gap-2 items-center">
          {problem.solvedOnCF && (
            <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium" title="Solved on Codeforces">
              ✓ CF Solved
            </span>
          )}
          {problem.solved && !problem.solvedOnCF && (
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
              ✓ Solved
            </span>
          )}
          <button
            onClick={() => onToggleSolved(problem.id)}
            className={`px-2 py-1 rounded text-xs font-medium transition ${
              problem.solved
                ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {problem.solved ? 'Unsolve' : 'Mark Solved'}
          </button>
          <button
            onClick={() => onDelete(problem.id)}
            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-medium transition"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {problem.rating && (
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getDifficultyColor(problem.rating)}`}>
            Rating: {problem.rating}
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {!hideTags && problem.tags && problem.tags.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-gray-600 mr-2">CF Tags:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {problem.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {!hideTags && problem.myTags && problem.myTags.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-gray-600 mr-2">My Tags:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {problem.myTags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {hideTags && (
          <div className="bg-yellow-50 border border-yellow-200 rounded px-2 py-1">
            <span className="text-xs text-yellow-700 font-medium">🔒 Tags hidden for practice</span>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 mt-2">
        Added: {new Date(problem.addedAt).toLocaleDateString()}
      </div>
    </div>
  );
}
