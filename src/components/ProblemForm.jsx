import { useState } from 'react';
import { codeforcesAPI } from '../services/codeforcesApi';
import { useAuth } from '../contexts/AuthContext';

export default function ProblemForm({ onProblemAdded, loading: parentLoading, darkMode, isVerified }) {
  const [input, setInput] = useState('');
  const [customTags, setCustomTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { isGoogleUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Check authentication and verification
    if (!isGoogleUser()) {
      setError('Please sign in with Google to add problems');
      setLoading(false);
      return;
    }

    if (!isVerified) {
      setError('Please verify your Codeforces handle in Settings before adding problems');
      setLoading(false);
      return;
    }

    try {
      // Parse the input
      const parsed = codeforcesAPI.parseProblemInput(input);
      
      if (!parsed) {
        throw new Error('Invalid input. Use format like "1462 A" or paste a Codeforces URL');
      }

      // Fetch problem from API
      const problem = await codeforcesAPI.findProblem(parsed.contestId, parsed.index);
      
      if (!problem) {
        throw new Error(`Problem ${parsed.contestId}${parsed.index} not found on Codeforces`);
      }

      // Parse custom tags
      const myTags = customTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Prepare problem data
      const problemData = {
        contestId: problem.contestId,
        index: problem.index,
        name: problem.name,
        rating: problem.rating || null,
        tags: problem.tags || [],
        myTags: myTags,
        url: codeforcesAPI.getProblemUrl(problem.contestId, problem.index)
      };

      // Call parent callback
      onProblemAdded(problemData);

      // Reset form
      setInput('');
      setCustomTags('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rounded-xl shadow-lg p-6 border transition-colors duration-200 ${
      darkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-purple-100'
    }`}>
      <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${
        darkMode ? 'text-gray-100' : 'text-purple-800'
      }`}>
        <span className="text-2xl">➕</span> Add New Problem
      </h2>
      
      {/* Authentication and Verification Status */}
      {!isGoogleUser() && (
        <div className={`mb-4 p-3 rounded-lg border ${
          darkMode
            ? 'bg-yellow-900/20 border-yellow-700 text-yellow-300'
            : 'bg-yellow-50 border-yellow-200 text-yellow-800'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🔐</span>
            <span className="font-medium text-sm">Authentication Required</span>
          </div>
          <p className="text-xs">
            Please sign in with Google above to add problems to your personal tracker.
          </p>
        </div>
      )}
      
      {isGoogleUser() && !isVerified && (
        <div className={`mb-4 p-3 rounded-lg border ${
          darkMode
            ? 'bg-blue-900/20 border-blue-700 text-blue-300'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">✅</span>
            <span className="font-medium text-sm">Verification Required</span>
          </div>
          <p className="text-xs">
            Please verify your Codeforces handle in Settings to add problems.
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Problem ID or URL
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='e.g., "1462 A" or "https://codeforces.com/problemset/problem/1462/A"'
            disabled={!isGoogleUser() || !isVerified}
            className={`w-full px-3 py-1.5 border rounded-lg text-sm transition-colors ${
              !isGoogleUser() || !isVerified
                ? darkMode
                  ? 'border-gray-600 bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                : darkMode
                  ? 'border-gray-600 bg-gray-700 text-white focus:ring-gray-500 focus:border-transparent'
                  : 'border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
            }`}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter contest ID and index (e.g., "1462 A") or paste the problem URL
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Custom Tags (optional)
          </label>
          <input
            type="text"
            value={customTags}
            onChange={(e) => setCustomTags(e.target.value)}
            placeholder='e.g., "practice, important, review"'
            disabled={!isGoogleUser() || !isVerified}
            className={`w-full px-3 py-1.5 border rounded-lg text-sm transition-colors ${
              !isGoogleUser() || !isVerified
                ? darkMode
                  ? 'border-gray-600 bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                : darkMode
                  ? 'border-gray-600 bg-gray-700 text-white focus:ring-gray-500 focus:border-transparent'
                  : 'border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
            }`}
          />
          <p className="text-xs text-gray-500 mt-1">
            Separate multiple tags with commas
          </p>
        </div>

        {error && (
          <div className={`border px-3 py-2 rounded-lg text-sm ${
            darkMode
              ? 'bg-red-900/20 border-red-700 text-red-300'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || parentLoading || !isGoogleUser() || !isVerified}
          className={`w-full font-semibold py-2 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg text-sm ${
            !isGoogleUser() || !isVerified
              ? darkMode
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : darkMode
                ? 'bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 text-white'
                : 'bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white'
          }`}
        >
          {loading || parentLoading 
            ? 'Adding Problem...' 
            : !isGoogleUser() 
              ? 'Sign in Required' 
              : !isVerified 
                ? 'Verification Required'
                : 'Add Problem'
          }
        </button>
      </form>
    </div>
  );
}
