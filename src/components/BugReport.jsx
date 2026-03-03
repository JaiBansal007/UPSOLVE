import { useState, useEffect } from 'react';
import { LuBug, LuX, LuSend, LuCheckCircle, LuAlertTriangle, LuInfo } from 'react-icons/lu';
import { submitBugReport, getUserDailyReportCount, auth } from '../services/firebase';

const MAX_DAILY = 5;
const MIN_LEN = 10;
const MAX_LEN = 1000;

export default function BugReport({ isOpen, onClose, cfHandle }) {
  const [reportText, setReportText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDailyCount = async () => {
      if (isOpen && auth.currentUser) {
        setLoading(true);
        try {
          const count = await getUserDailyReportCount(auth.currentUser.uid);
          setDailyCount(count);
        } catch (err) {
          console.error('Error fetching daily count:', err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchDailyCount();
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reportText.trim()) {
      setError('Please describe the bug');
      return;
    }

    if (reportText.trim().length < 10) {
      setError('Please provide more detail (at least 10 characters)');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in to report a bug');
      }

      await submitBugReport(
        user.uid,
        user.email || 'No email',
        cfHandle,
        reportText.trim()
      );

      setSuccess(true);
      setReportText('');
      setDailyCount(prev => prev + 1);
      
      // Auto close after success
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const remainingReports = 5 - dailyCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-md rounded-xl shadow-2xl p-6 ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-bold flex items-center gap-2 ${
            darkMode ? 'text-white' : 'text-gray-800'
          }`}>
            <span>🐛</span> Report a Bug
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            ✕
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✅</div>
            <p className={`font-medium ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
              Bug report submitted successfully!
            </p>
            <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Thank you for helping improve CF Upsolve!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Daily limit info */}
            <div className={`mb-4 p-3 rounded-lg ${
              darkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <p className={`text-sm ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {loading ? (
                  'Loading...'
                ) : remainingReports > 0 ? (
                  <>
                    You can submit <strong className={darkMode ? 'text-purple-400' : 'text-purple-600'}>{remainingReports}</strong> more report{remainingReports !== 1 ? 's' : ''} today
                  </>
                ) : (
                  <span className={darkMode ? 'text-red-400' : 'text-red-600'}>
                    You've reached your daily limit (5 reports per day)
                  </span>
                )}
              </p>
            </div>

            {/* Report text */}
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Describe the bug
              </label>
              <textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Please describe what went wrong, steps to reproduce, and what you expected to happen..."
                rows={5}
                disabled={remainingReports <= 0}
                className={`w-full px-4 py-3 border rounded-lg transition-colors resize-none ${
                  darkMode
                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-500 focus:border-purple-500'
                    : 'border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:border-purple-500'
                } ${remainingReports <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>

            {/* Error message */}
            {error && (
              <div className={`mb-4 p-3 rounded-lg ${
                darkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'
              }`}>
                {error}
              </div>
            )}

            {/* Submit button */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || remainingReports <= 0}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  darkMode
                    ? 'bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white'
                }`}
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
