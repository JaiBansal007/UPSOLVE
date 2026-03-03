import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../services/firebaseStorage';
import { codeforcesAPI } from '../services/codeforcesApi';

export default function Profile({ darkMode, onProfileComplete, cfHandle, setCfHandle, isVerified, setIsVerified }) {
  const { user, login, logout, isGoogleUser } = useAuth();
  const [newHandle, setNewHandle] = useState(cfHandle || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Verification states
  const [verificationProblem, setVerificationProblem] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  useEffect(() => {
    setNewHandle(cfHandle || '');
  }, [cfHandle]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      setError('Failed to sign in. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      // Only clear local verification state, NOT Firestore (so it persists for next login)
      await logout();
      setIsVerified(false);
      setCfHandle('');
      setNewHandle('');
      setShowVerification(false);
      setVerificationProblem(null);
      setSuccess('Signed out successfully.');
    } catch (error) {
      setError('Failed to sign out. Please try again.');
    }
  };

  const handleSaveHandle = async () => {
    if (!newHandle.trim()) {
      setError('Please enter a Codeforces handle');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Verify the handle exists on Codeforces
      const userInfo = await codeforcesAPI.getUserInfo(newHandle.trim());
      if (!userInfo) {
        throw new Error('Codeforces handle not found. Please check the spelling.');
      }

      // Save the handle
      await storage.saveSettings({ cfHandle: newHandle.trim() });
      setCfHandle(newHandle.trim());
      setSuccess(`Handle "${newHandle.trim()}" saved! Now verify ownership.`);
      
      // Clear previous verification
      setIsVerified(false);
      localStorage.removeItem(`cf_verified_${newHandle.trim()}`);
      
      // Start verification flow
      setShowVerification(true);
      generateVerificationProblem();
    } catch (err) {
      setError(err.message || 'Failed to save handle');
    } finally {
      setSaving(false);
    }
  };

  const generateVerificationProblem = async () => {
    try {
      // Get a random problem for verification
      const problems = await codeforcesAPI.fetchAllProblems();
      const easyProblems = problems.filter(p => p.rating && p.rating >= 800 && p.rating <= 1200);
      const randomProblem = easyProblems[Math.floor(Math.random() * easyProblems.length)];
      
      // Generate a unique verification code
      const code = `CF_VERIFY_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      setVerificationProblem(randomProblem);
      setVerificationCode(code);
    } catch (err) {
      setError('Failed to generate verification problem. Please try again.');
    }
  };

  const handleVerify = async () => {
    if (!verificationProblem || !cfHandle) return;

    setVerifying(true);
    setError('');

    try {
      // Check recent submissions
      const response = await fetch(
        `https://codeforces.com/api/user.status?handle=${cfHandle}&from=1&count=10`
      );
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error('Failed to fetch submissions');
      }

      // Look for a compilation error submission to the verification problem
      const verificationSubmission = data.result.find(sub => 
        sub.problem.contestId === verificationProblem.contestId &&
        sub.problem.index === verificationProblem.index &&
        sub.verdict === 'COMPILATION_ERROR' &&
        // Check if submitted within last 30 minutes
        (Date.now() / 1000 - sub.creationTimeSeconds) < 1800
      );

      if (verificationSubmission) {
        // Verification successful - save to Firestore
        await storage.saveVerification(cfHandle);
        setIsVerified(true);
        setShowVerification(false);
        setSuccess('🎉 Handle verified successfully! You now have full access.');
        
        if (onProfileComplete) {
          onProfileComplete();
        }
      } else {
        setError('Verification failed. Make sure you submitted a compilation error to the correct problem.');
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const isProfileComplete = isGoogleUser() && cfHandle && isVerified;

  return (
    <div className={`rounded-xl shadow-lg border overflow-hidden ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b ${
        darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gradient-to-r from-purple-600 to-indigo-600'
      }`}>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>👤</span> Profile Setup
        </h2>
        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-purple-100'}`}>
          Complete your profile to access all features
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              isGoogleUser() 
                ? 'bg-green-500 text-white' 
                : darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-600'
            }`}>
              {isGoogleUser() ? '✓' : '1'}
            </div>
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Google Login</span>
          </div>
          <div className={`flex-1 h-1 mx-3 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
            <div className={`h-full transition-all ${isGoogleUser() ? 'bg-green-500 w-full' : 'w-0'}`}></div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              cfHandle 
                ? 'bg-green-500 text-white' 
                : darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-600'
            }`}>
              {cfHandle ? '✓' : '2'}
            </div>
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>CF Handle</span>
          </div>
          <div className={`flex-1 h-1 mx-3 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
            <div className={`h-full transition-all ${cfHandle ? 'bg-green-500 w-full' : 'w-0'}`}></div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              isVerified 
                ? 'bg-green-500 text-white' 
                : darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-600'
            }`}>
              {isVerified ? '✓' : '3'}
            </div>
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Verified</span>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className={`p-3 rounded-lg ${
            darkMode ? 'bg-red-900/30 border border-red-700 text-red-300' : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {error}
          </div>
        )}
        {success && (
          <div className={`p-3 rounded-lg ${
            darkMode ? 'bg-green-900/30 border border-green-700 text-green-300' : 'bg-green-50 border border-green-200 text-green-700'
          }`}>
            {success}
          </div>
        )}

        {/* Step 1: Google Login */}
        <div className={`p-4 rounded-lg border ${
          darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
        }`}>
          <h3 className={`font-semibold mb-3 flex items-center gap-2 ${
            darkMode ? 'text-gray-200' : 'text-gray-800'
          }`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              isGoogleUser() ? 'bg-green-500 text-white' : darkMode ? 'bg-gray-600' : 'bg-gray-300'
            }`}>1</span>
            Sign in with Google
          </h3>
          
          {isGoogleUser() ? (
            <div className="flex items-center gap-3">
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  {user.displayName}
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {user.email}
                </p>
              </div>
              <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                ✓ Connected
              </span>
              <button
                onClick={handleLogout}
                className={`px-3 py-1 text-xs font-medium rounded ${
                  darkMode ? 'bg-gray-600 hover:bg-gray-500 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 px-4 py-2 rounded-lg border border-gray-300 transition-colors font-medium shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          )}
        </div>

        {/* Step 2: Codeforces Handle */}
        <div className={`p-4 rounded-lg border ${
          !isGoogleUser() ? 'opacity-50 pointer-events-none' : ''
        } ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className={`font-semibold mb-3 flex items-center gap-2 ${
            darkMode ? 'text-gray-200' : 'text-gray-800'
          }`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              cfHandle ? 'bg-green-500 text-white' : darkMode ? 'bg-gray-600' : 'bg-gray-300'
            }`}>2</span>
            Set Codeforces Handle
          </h3>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={newHandle}
              onChange={(e) => setNewHandle(e.target.value)}
              placeholder="Enter your Codeforces handle"
              className={`flex-1 px-3 py-2 border rounded-lg text-sm ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 placeholder-gray-500'
              }`}
            />
            <button
              onClick={handleSaveHandle}
              disabled={saving || !newHandle.trim()}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                darkMode
                  ? 'bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white'
              }`}
            >
              {saving ? 'Saving...' : cfHandle === newHandle.trim() ? 'Saved ✓' : 'Save Handle'}
            </button>
          </div>
          
          {cfHandle && (
            <div className="mt-3 flex items-center gap-2">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Current:</span>
              <span className={`font-mono font-medium ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                {cfHandle}
              </span>
              {isVerified && (
                <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs">✓ Verified</span>
              )}
            </div>
          )}
        </div>

        {/* Step 3: Verification */}
        <div className={`p-4 rounded-lg border ${
          !cfHandle || !isGoogleUser() ? 'opacity-50 pointer-events-none' : ''
        } ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className={`font-semibold mb-3 flex items-center gap-2 ${
            darkMode ? 'text-gray-200' : 'text-gray-800'
          }`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              isVerified ? 'bg-green-500 text-white' : darkMode ? 'bg-gray-600' : 'bg-gray-300'
            }`}>3</span>
            Verify Ownership
          </h3>

          {isVerified ? (
            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              darkMode ? 'bg-green-900/30' : 'bg-green-50'
            }`}>
              <span className="text-2xl">✅</span>
              <div>
                <p className={`font-medium ${darkMode ? 'text-green-300' : 'text-green-800'}`}>
                  Handle Verified!
                </p>
                <p className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                  You have full access to all features.
                </p>
              </div>
            </div>
          ) : showVerification && verificationProblem ? (
            <div className="space-y-4">
              <div className={`p-3 rounded-lg ${
                darkMode ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'
              }`}>
                <p className={`font-medium mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                  📝 Verification Instructions:
                </p>
                <ol className={`text-sm space-y-2 ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>
                  <li>1. Go to this problem: <a 
                    href={`https://codeforces.com/problemset/problem/${verificationProblem.contestId}/${verificationProblem.index}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium"
                  >
                    {verificationProblem.contestId}{verificationProblem.index} - {verificationProblem.name}
                  </a></li>
                  <li>2. Submit any code that causes a <strong>Compilation Error</strong></li>
                  <li>3. Click "Verify" below after submitting</li>
                </ol>
              </div>

              <div className={`p-3 rounded-lg ${
                darkMode ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <p className={`text-sm ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
                  <strong>Tip:</strong> Submit something like <code className="px-1 bg-black/20 rounded">asdf</code> to get a compilation error quickly.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    darkMode
                      ? 'bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white'
                      : 'bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white'
                  }`}
                >
                  {verifying ? 'Checking submissions...' : '✓ Verify My Submission'}
                </button>
                <button
                  onClick={generateVerificationProblem}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    darkMode
                      ? 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  🔄 New Problem
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setShowVerification(true);
                generateVerificationProblem();
              }}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                darkMode
                  ? 'bg-purple-600 hover:bg-purple-500 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              Start Verification
            </button>
          )}
        </div>

        {/* Completion Status */}
        {isProfileComplete && (
          <div className={`p-4 rounded-lg border-2 ${
            darkMode ? 'bg-green-900/20 border-green-600' : 'bg-green-50 border-green-500'
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎉</span>
              <div>
                <h3 className={`font-bold ${darkMode ? 'text-green-300' : 'text-green-800'}`}>
                  Profile Complete!
                </h3>
                <p className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                  You now have full access to Problems, Upsolving, and Compare features.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}