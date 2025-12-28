import { useState } from 'react';
import { codeforcesAPI } from '../services/codeforcesApi';

export default function ProblemForm({ onProblemAdded, loading: parentLoading }) {
  const [input, setInput] = useState('');
  const [customTags, setCustomTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

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
    <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100">
      <h2 className="text-xl font-bold text-purple-800 mb-4 flex items-center gap-2">
        <span className="text-2xl">➕</span> Add New Problem
      </h2>
      
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
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
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
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Separate multiple tags with commas
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || parentLoading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg text-sm"
        >
          {loading || parentLoading ? 'Adding Problem...' : 'Add Problem'}
        </button>
      </form>
    </div>
  );
}
