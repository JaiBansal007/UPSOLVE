// LocalStorage service for persisting user's problem list
const STORAGE_KEY = 'upsolve_tracker_problems';
const SETTINGS_KEY = 'upsolve_tracker_settings';

class LocalStorageService {
  /**
   * Get all saved problems from localStorage
   * @returns {Array} Array of problem objects
   */
  getProblems() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  }

  /**
   * Save problems to localStorage
   * @param {Array} problems - Array of problem objects to save
   */
  saveProblems(problems) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(problems));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  /**
   * Add a new problem to the list
   * @param {Object} problem - Problem object to add
   * @returns {Array} Updated array of problems
   */
  addProblem(problem) {
    const problems = this.getProblems();
    const newProblem = {
      ...problem,
      id: `${problem.contestId}${problem.index}`,
      addedAt: new Date().toISOString(),
      solved: false,
      myTags: problem.myTags || []
    };
    
    // Check if problem already exists
    const exists = problems.some(p => p.id === newProblem.id);
    if (exists) {
      throw new Error('Problem already exists in your list');
    }

    problems.push(newProblem);
    this.saveProblems(problems);
    return problems;
  }

  /**
   * Remove a problem by ID
   * @param {string} problemId - Problem ID to remove
   * @returns {Array} Updated array of problems
   */
  removeProblem(problemId) {
    const problems = this.getProblems();
    const filtered = problems.filter(p => p.id !== problemId);
    this.saveProblems(filtered);
    return filtered;
  }

  /**
   * Update a problem
   * @param {string} problemId - Problem ID to update
   * @param {Object} updates - Object containing fields to update
   * @returns {Array} Updated array of problems
   */
  updateProblem(problemId, updates) {
    const problems = this.getProblems();
    const index = problems.findIndex(p => p.id === problemId);
    
    if (index === -1) {
      throw new Error('Problem not found');
    }

    problems[index] = { ...problems[index], ...updates };
    this.saveProblems(problems);
    return problems;
  }

  /**
   * Toggle solved status of a problem
   * @param {string} problemId - Problem ID
   * @returns {Array} Updated array of problems
   */
  toggleSolved(problemId) {
    const problems = this.getProblems();
    const problem = problems.find(p => p.id === problemId);
    
    if (!problem) {
      throw new Error('Problem not found');
    }

    return this.updateProblem(problemId, { solved: !problem.solved });
  }

  /**
   * Add custom tags to a problem
   * @param {string} problemId - Problem ID
   * @param {Array<string>} tags - Tags to add
   * @returns {Array} Updated array of problems
   */
  addCustomTags(problemId, tags) {
    const problems = this.getProblems();
    const problem = problems.find(p => p.id === problemId);
    
    if (!problem) {
      throw new Error('Problem not found');
    }

    const myTags = [...new Set([...(problem.myTags || []), ...tags])];
    return this.updateProblem(problemId, { myTags });
  }

  /**
   * Clear all problems (with confirmation)
   * @returns {Array} Empty array
   */
  clearAll() {
    this.saveProblems([]);
    return [];
  }

  /**
   * Get settings from localStorage
   * @returns {Object} Settings object
   */
  getSettings() {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : { cfHandle: '', hideTags: false };
    } catch (error) {
      console.error('Error reading settings from localStorage:', error);
      return { cfHandle: '', hideTags: false };
    }
  }

  /**
   * Save settings to localStorage
   * @param {Object} settings - Settings object
   */
  saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
    }
  }

  /**
   * Update Codeforces handle
   * @param {string} handle - Codeforces handle
   */
  setCfHandle(handle) {
    const settings = this.getSettings();
    settings.cfHandle = handle;
    this.saveSettings(settings);
  }

  /**
   * Get Codeforces handle
   * @returns {string} Codeforces handle
   */
  getCfHandle() {
    const settings = this.getSettings();
    return settings.cfHandle || '';
  }

  /**
   * Toggle hide tags setting
   * @param {boolean} hideTags - Whether to hide tags
   */
  setHideTags(hideTags) {
    const settings = this.getSettings();
    settings.hideTags = hideTags;
    this.saveSettings(settings);
  }

  /**
   * Get hide tags setting
   * @returns {boolean} Whether tags are hidden
   */
  getHideTags() {
    const settings = this.getSettings();
    return settings.hideTags || false;
  }
}

// Export singleton instance
export const storage = new LocalStorageService();
