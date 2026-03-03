// Codeforces API service
const CF_API_BASE = 'https://codeforces.com/api';

class CodeforcesAPI {
  constructor() {
    this.problemsCache = null;
    this.cacheExpiry = null;
    this.CACHE_DURATION = 1000 * 60 * 60; // 1 hour
  }

  /**
   * Fetch all problems from Codeforces API with caching
   * @returns {Promise<Array>} Array of problem objects
   */
  async fetchAllProblems() {
    // Check if cache is still valid
    if (this.problemsCache && this.cacheExpiry && Date.now() < this.cacheExpiry) {
      return this.problemsCache;
    }

    try {
      const response = await fetch(`${CF_API_BASE}/problemset.problems`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(data.comment || 'API returned non-OK status');
      }

      // Cache the results
      this.problemsCache = data.result.problems;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;

      return data.result.problems;
    } catch (error) {
      console.error('Error fetching problems from Codeforces:', error);
      throw error;
    }
  }

  /**
   * Find a specific problem by contest ID and index
   * @param {number|string} contestId - Contest ID
   * @param {string} index - Problem index (A, B, C, etc.)
   * @returns {Promise<Object|null>} Problem object or null if not found
   */
  async findProblem(contestId, index) {
    const problems = await this.fetchAllProblems();
    const problem = problems.find(
      p => p.contestId === parseInt(contestId) && p.index === index.toUpperCase()
    );
    return problem || null;
  }

  /**
   * Parse a Codeforces problem URL or ID
   * @param {string} input - URL or "contestId index" format
   * @returns {Object|null} {contestId, index} or null if invalid
   */
  parseProblemInput(input) {
    input = input.trim();

    // Try URL formats:
    // 1. https://codeforces.com/problemset/problem/1462/A
    // 2. https://codeforces.com/contest/475/problem/D
    const contestMatch = input.match(/codeforces\.com\/contest\/(\d+)\/problem\/([A-Z]\d?)/i);
    if (contestMatch) {
      return {
        contestId: parseInt(contestMatch[1]),
        index: contestMatch[2].toUpperCase()
      };
    }

    const problemsetMatch = input.match(/codeforces\.com\/problemset\/problem\/(\d+)\/([A-Z]\d?)/i);
    if (problemsetMatch) {
      return {
        contestId: parseInt(problemsetMatch[1]),
        index: problemsetMatch[2].toUpperCase()
      };
    }

    // Try "contestId index" format: "1462 A" or "1462A"
    const spaceMatch = input.match(/^(\d+)\s*([A-Z]\d?)$/i);
    if (spaceMatch) {
      return {
        contestId: parseInt(spaceMatch[1]),
        index: spaceMatch[2].toUpperCase()
      };
    }

    return null;
  }

  /**
   * Get problem URL from contestId and index
   * @param {number} contestId - Contest ID
   * @param {string} index - Problem index
   * @returns {string} Problem URL
   */
  getProblemUrl(contestId, index) {
    return `https://codeforces.com/problemset/problem/${contestId}/${index}`;
  }

  /**
   * Get user info from Codeforces
   * @param {string} handle - Codeforces user handle
   * @returns {Promise<Object>} User info object
   */
  async getUserInfo(handle) {
    try {
      const response = await fetch(`${CF_API_BASE}/user.info?handles=${handle}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(data.comment || 'User not found');
      }

      return data.result[0];
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw error;
    }
  }

  /**
   * Get all unique tags from cached problems
   * @returns {Promise<Array<string>>} Array of unique tag strings
   */
  async getAllTags() {
    const problems = await this.fetchAllProblems();
    const tagSet = new Set();
    
    problems.forEach(problem => {
      if (problem.tags) {
        problem.tags.forEach(tag => tagSet.add(tag));
      }
    });

    return Array.from(tagSet).sort();
  }

  /**
   * Fetch user submissions
   * @param {string} handle - Codeforces user handle
   * @param {number} count - Number of submissions to fetch (max 100000)
   * @returns {Promise<Array>} Array of submission objects
   */
  async fetchUserSubmissions(handle, count = 100000) {
    try {
      const response = await fetch(
        `${CF_API_BASE}/user.status?handle=${handle}&from=1&count=${count}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(data.comment || 'API returned non-OK status');
      }

      return data.result;
    } catch (error) {
      console.error('Error fetching user submissions:', error);
      throw error;
    }
  }

  /**
   * Check if a user has solved a specific problem
   * @param {string} handle - Codeforces user handle
   * @param {number} contestId - Contest ID
   * @param {string} index - Problem index
   * @returns {Promise<boolean>} True if problem is solved
   */
  async isProblemSolved(handle, contestId, index) {
    try {
      const submissions = await this.fetchUserSubmissions(handle);
      
      // Check if there's any accepted submission for this problem
      const solved = submissions.some(
        sub => 
          sub.problem.contestId === parseInt(contestId) &&
          sub.problem.index === index.toUpperCase() &&
          sub.verdict === 'OK'
      );

      return solved;
    } catch (error) {
      console.error('Error checking if problem is solved:', error);
      return false;
    }
  }

  /**
   * Get solved problems for a user
   * @param {string} handle - Codeforces user handle
   * @returns {Promise<Set>} Set of solved problem IDs (contestId+index)
   */
  async getSolvedProblems(handle) {
    try {
      const submissions = await this.fetchUserSubmissions(handle);
      const solvedSet = new Set();

      submissions.forEach(sub => {
        if (sub.verdict === 'OK' && sub.problem.contestId && sub.problem.index) {
          solvedSet.add(`${sub.problem.contestId}${sub.problem.index}`);
        }
      });

      return solvedSet;
    } catch (error) {
      console.error('Error fetching solved problems:', error);
      return new Set();
    }
  }

  /**
   * Get recent contests
   * @param {number} count - Number of contests to fetch
   * @returns {Promise<Array>} Array of contest objects
   */
  async getRecentContests(count = 20) {
    try {
      const response = await fetch(`${CF_API_BASE}/contest.list`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(data.comment || 'API returned non-OK status');
      }

      // Filter finished contests and return the most recent ones
      return data.result
        .filter(contest => contest.phase === 'FINISHED')
        .slice(0, count);
    } catch (error) {
      console.error('Error fetching recent contests:', error);
      throw error;
    }
  }

  /**
   * Get contest standings with problems
   * @param {number} contestId - Contest ID
   * @param {number} from - Starting rank (default 1)
   * @param {number} count - Number of participants to fetch (default 1)
   * @returns {Promise<Object>} Contest standings with problems
   */
  async getContestStandings(contestId, from = 1, count = 1) {
    try {
      const response = await fetch(
        `${CF_API_BASE}/contest.standings?contestId=${contestId}&from=${from}&count=${count}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(data.comment || 'API returned non-OK status');
      }

      return data.result;
    } catch (error) {
      console.error('Error fetching contest standings:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const codeforcesAPI = new CodeforcesAPI();
