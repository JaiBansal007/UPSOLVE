import { useState } from 'react';
import { codeforcesAPI } from '../services/codeforcesApi';

export default function CFVerification({ onVerified, cfHandle, darkMode }) {
  const [loading, setLoading] = useState(false);
  const [verificationProblem, setVerificationProblem] = useState(null);
  const [error, setError] = useState('');
  const [verificationStep, setVerificationStep] = useState('start'); // start, problem-shown, checking, verified
  const [checkAttempts, setCheckAttempts] = useState(0);

  const generateVerificationProblem = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Get a random easy problem (rating 800-1000) for verification
      const problems = await codeforcesAPI.fetchAllProblems();
      const easyProblems = problems.filter(p => 
        p.rating && p.rating >= 800 && p.rating <= 1000 && 
        p.tags && p.tags.length > 0
      );
      
      const randomProblem = easyProblems[Math.floor(Math.random() * easyProblems.length)];
      
      setVerificationProblem({
        ...randomProblem,
        url: codeforcesAPI.getProblemUrl(randomProblem.contestId, randomProblem.index),
        verificationCode: Math.random().toString(36).substring(7) // Random code for uniqueness
      });
      
      setVerificationStep('problem-shown');
    } catch (error) {
      setError('Failed to generate verification problem. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkVerification = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Get user's recent submissions
      const submissions = await codeforcesAPI.fetchUserSubmissions(cfHandle, 50);
      
      // Look for submissions to the verification problem
      const verificationSubmissions = submissions.filter(sub => 
        sub.problem.contestId === verificationProblem.contestId &&
        sub.problem.index === verificationProblem.index &&
        sub.creationTimeSeconds > (Date.now() / 1000 - 300) // Within last 5 minutes
      );

      if (verificationSubmissions.length === 0) {
        setError('No recent submissions found for this problem. Please submit with compilation error and try again.');
        setCheckAttempts(prev => prev + 1);
        return;
      }

      // Check if any submission has compilation error
      const hasCompilationError = verificationSubmissions.some(sub => 
        sub.verdict === 'COMPILATION_ERROR'
      );

      if (hasCompilationError) {
        setVerificationStep('verified');
        // Store verification in localStorage
        localStorage.setItem(`cf_verified_${cfHandle}`, JSON.stringify({
          verified: true,
          timestamp: Date.now(),
          verificationProblem: verificationProblem.contestId + verificationProblem.index
        }));
        onVerified(true);
      } else {
        setError('No compilation error found in your recent submissions. Please make sure to submit with compilation error.');
        setCheckAttempts(prev => prev + 1);
      }

    } catch (error) {
      setError('Failed to check submissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetVerification = () => {
    setVerificationStep('start');
    setVerificationProblem(null);
    setError('');
    setCheckAttempts(0);
  };

  if (verificationStep === 'verified') {
    return (
      <div className={`rounded-xl shadow-lg p-6 border transition-colors duration-200 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-green-200'
      }`}>
        <div className="text-center">
          <div className="text-4xl mb-4">✅</div>
          <h3 className={`text-xl font-bold mb-2 ${
            darkMode ? 'text-green-400' : 'text-green-800'
          }`}>
            CF Handle Verified!
          </h3>
          <p className={`mb-4 ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Your Codeforces handle <strong>{cfHandle}</strong> has been successfully verified.
            You can now access the upsolving feature!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl shadow-lg p-6 border transition-colors duration-200 ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-blue-200'
    }`}>
      <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${
        darkMode ? 'text-gray-100' : 'text-blue-800'
      }`}>
        <span className="text-2xl">🔐</span> Verify Codeforces Handle
      </h3>

      {verificationStep === 'start' && (
        <div>
          <p className={`mb-4 ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            To access the upsolving feature, we need to verify that you own the handle <strong>{cfHandle}</strong>.
          </p>
          
          <div className={`rounded-lg p-4 mb-4 ${
            darkMode ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'
          }`}>
            <h4 className={`font-semibold mb-2 ${
              darkMode ? 'text-blue-300' : 'text-blue-800'
            }`}>Verification Process:</h4>
            <ol className={`space-y-1 text-sm ${
              darkMode ? 'text-blue-200' : 'text-blue-700'
            }`}>
              <li>1. We'll give you a random problem</li>
              <li>2. Submit any code with <strong>compilation error</strong> to that problem</li>
              <li>3. Come back here and click "Check Verification"</li>
              <li>4. Once verified, you'll get access to upsolving features</li>
            </ol>
          </div>

          <button
            onClick={generateVerificationProblem}
            disabled={loading}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              darkMode
                ? 'bg-blue-600 hover:bg-blue-500 disabled:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white'
            }`}
          >
            {loading ? 'Generating Problem...' : 'Start Verification'}
          </button>
        </div>
      )}

      {verificationStep === 'problem-shown' && verificationProblem && (
        <div>
          <p className={`mb-4 ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Please solve this problem with a <strong>compilation error</strong>:
          </p>

          <div className={`border rounded-lg p-4 mb-4 ${
            darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className={`font-bold ${
                darkMode ? 'text-gray-100' : 'text-gray-800'
              }`}>
                {verificationProblem.contestId}{verificationProblem.index}. {verificationProblem.name}
              </h4>
              {verificationProblem.rating && (
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  darkMode ? 'bg-green-800 text-green-300' : 'bg-green-100 text-green-700'
                }`}>
                  {verificationProblem.rating}
                </span>
              )}
            </div>
            
            <a
              href={verificationProblem.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 font-medium hover:underline ${
                darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              Open Problem on Codeforces →
            </a>
          </div>

          <div className={`rounded-lg p-4 mb-4 ${
            darkMode ? 'bg-yellow-900/20 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <h4 className={`font-semibold mb-2 ${
              darkMode ? 'text-yellow-300' : 'text-yellow-800'
            }`}>Instructions:</h4>
            <ul className={`space-y-1 text-sm ${
              darkMode ? 'text-yellow-200' : 'text-yellow-700'
            }`}>
              <li>• Go to the problem page above</li>
              <li>• Submit any code that will cause a <strong>compilation error</strong></li>
              <li>• Example: Submit "invalid code syntax" or incomplete code</li>
              <li>• Come back here and click "Check Verification" within 5 minutes</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={checkVerification}
              disabled={loading}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                darkMode
                  ? 'bg-green-600 hover:bg-green-500 disabled:bg-green-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white'
              }`}
            >
              {loading ? 'Checking...' : `Check Verification ${checkAttempts > 0 ? `(${checkAttempts})` : ''}`}
            </button>
            
            <button
              onClick={resetVerification}
              disabled={loading}
              className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                darkMode
                  ? 'bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 text-gray-200'
                  : 'bg-gray-300 hover:bg-gray-400 disabled:bg-gray-400 text-gray-700'
              }`}
            >
              Reset
            </button>
          </div>

          {checkAttempts > 0 && (
            <p className={`text-sm mt-3 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Tip: Make sure you submit within the last 5 minutes and that your code actually causes a compilation error.
            </p>
          )}
        </div>
      )}

      {error && (
        <div className={`mt-4 p-3 rounded-lg border text-sm ${
          darkMode
            ? 'bg-red-900/20 border-red-700 text-red-300'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {error}
        </div>
      )}
    </div>
  );
}