import { useState, useEffect } from 'react';
import { getBugReports, deleteBugReport } from '../services/firebase';

export default function AdminReports({ darkMode }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const fetchedReports = await getBugReports();
      setReports(fetchedReports);
    } catch (err) {
      setError('Failed to fetch reports');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDelete = async (reportId) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    
    setDeleting(reportId);
    try {
      await deleteBugReport(reportId);
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (err) {
      setError('Failed to delete report');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className={`rounded-xl shadow-lg p-6 border transition-colors duration-200 ${
      darkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-purple-200'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-xl font-bold flex items-center gap-2 ${
          darkMode ? 'text-gray-100' : 'text-purple-800'
        }`}>
          <span className="text-2xl">🐛</span> Bug Reports
        </h2>
        <button
          onClick={fetchReports}
          disabled={loading}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            darkMode
              ? 'bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 text-white'
              : 'bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white'
          }`}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className={`mb-4 p-3 rounded-lg ${
          darkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'
        }`}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className={`animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4 ${
            darkMode ? 'border-purple-400' : 'border-purple-600'
          }`}></div>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Loading reports...
          </p>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">✨</div>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            No bug reports yet. Everything is working great!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Total: {reports.length} report{reports.length !== 1 ? 's' : ''}
          </p>
          
          {reports.map((report) => (
            <div
              key={report.id}
              className={`p-4 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-700/50 border-gray-600' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-medium ${
                      darkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      {report.userEmail}
                    </span>
                    {report.cfHandle && report.cfHandle !== 'Anonymous' && (
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        darkMode ? 'bg-purple-800 text-purple-300' : 'bg-purple-100 text-purple-700'
                      }`}>
                        CF: {report.cfHandle}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {formatDate(report.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(report.id)}
                  disabled={deleting === report.id}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    darkMode
                      ? 'bg-red-800 hover:bg-red-700 disabled:bg-gray-600 text-red-200'
                      : 'bg-red-100 hover:bg-red-200 disabled:bg-gray-200 text-red-700'
                  }`}
                >
                  {deleting === report.id ? '...' : 'Delete'}
                </button>
              </div>
              
              {/* Report content */}
              <div className={`p-3 rounded-lg ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <p className={`text-sm whitespace-pre-wrap ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {report.reportText}
                </p>
              </div>
              
              {/* Report ID */}
              <p className={`text-xs mt-2 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                ID: {report.id}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
