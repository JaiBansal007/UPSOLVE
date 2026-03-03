import { useState } from 'react';
import { codeforcesAPI } from '../services/codeforcesApi';
import { useAuth } from '../contexts/AuthContext';

export default function ProblemForm({ onProblemAdded, loading: parentLoading, darkMode, isVerified }) {
  const [input, setInput] = useState('');
  const [customTags, setCustomTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [success, setSuccess] = useState('');
  const { isGoogleUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
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

      // Reset form and show success
      setInput('');
      setCustomTags('');
      setSuccess(`Added: ${problem.contestId}${problem.index} - ${problem.name}`);
      
      // Auto-close after success
      setTimeout(() => {
        setIsOpen(false);
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setError('');
    setSuccess('');
  };

  return (
    <>
      {/* Add Problem Button */}
      <button
        onClick={() => setIsOpen(true)}
        disabled={!isGoogleUser() || !isVerified}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg ${
          !isGoogleUser() || !isVerified
            ? darkMode
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : darkMode
              ? 'bg-purple-600 hover:bg-purple-500 text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
        }`}
      >
        <span className="text-xl">➕</span>
        <span>Add Problem</span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          
          {/* Modal Content */}
          <div 
            className={`relative w-full max-w-md rounded-xl shadow-2xl p-6 border transition-all transform ${
              darkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-purple-100'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className={`absolute top-4 right-4 p-1 rounded-full transition-colors ${
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${
              darkMode ? 'text-gray-100' : 'text-purple-800'
            }`}>
              <span className="text-2xl">➕</span> Add New Problem
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Problem ID or URL
                </label>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder='e.g., "1462 A" or paste URL'
                  autoFocus
                  className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${
                    darkMode
                      ? 'border-gray-600 bg-gray-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                      : 'border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                  }`}
                  required
                />
                <p className={`text-xs mt-1 ${
                  darkMode ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  Enter contest ID and index or paste the problem URL
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1.5 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Custom Tags (optional)
                </label>
                <input
                  type="text"
                  value={customTags}
                  onChange={(e) => setCustomTags(e.target.value)}
                  placeholder='e.g., "practice, important, review"'
                  className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${
                    darkMode
                      ? 'border-gray-600 bg-gray-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                      : 'border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                  }`}
                />
                <p className={`text-xs mt-1 ${
                  darkMode ? 'text-gray-500' : 'text-gray-500'
                }`}>
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

              {success && (
                <div className={`border px-3 py-2 rounded-lg text-sm ${
                  darkMode
                    ? 'bg-green-900/20 border-green-700 text-green-300'
                    : 'bg-green-50 border-green-200 text-green-700'
                }`}>
                  ✓ {success}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className={`flex-1 font-medium py-2 px-4 rounded-lg transition-colors ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || parentLoading}
                  className={`flex-1 font-semibold py-2 px-4 rounded-lg transition-all shadow-md hover:shadow-lg ${
                    darkMode
                      ? 'bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 text-white'
                      : 'bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white'
                  }`}
                >
                  {loading || parentLoading ? 'Adding...' : 'Add Problem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
