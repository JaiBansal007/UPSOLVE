// Firebase Firestore service for persisting user's problem list
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  query,
  orderBy 
} from "firebase/firestore";
import { db, auth, authPromise } from './firebase';

class FirebaseStorageService {
  constructor() {
    this.settingsDocRef = null;
    this.initialized = false;
  }

  /**
   * Initialize the service and wait for auth
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      await authPromise;
      const user = auth.currentUser;
      if (user) {
        this.settingsDocRef = doc(db, `users/${user.uid}/settings/config`);
        this.initialized = true;
      }
    } catch (error) {
      console.error('Error initializing Firebase storage:', error);
      throw error;
    }
  }

  /**
   * Get all saved problems from Firestore for a CF handle
   * @param {string} cfHandle - Codeforces handle
   * @returns {Promise<Array>} Array of problem objects
   */
  async getProblems(cfHandle) {
    if (!cfHandle) return [];
    
    try {
      const handleProblemsRef = collection(db, `cfHandles/${cfHandle}/problems`);
      const q = query(handleProblemsRef, orderBy('addedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const problems = [];
      querySnapshot.forEach((doc) => {
        problems.push({ ...doc.data(), firestoreId: doc.id });
      });
      
      return problems;
    } catch (error) {
      console.error('Error getting problems from Firestore:', error);
      return [];
    }
  }

  /**
   * Add a new problem to Firestore for a CF handle
   * @param {Object} problem - Problem object to add
   * @param {string} cfHandle - Codeforces handle
   * @returns {Promise<Array>} Updated array of problems
   */
  async addProblem(problem, cfHandle) {
    if (!cfHandle) throw new Error('CF handle is required to add problems');
    
    try {
      const handleProblemsRef = collection(db, `cfHandles/${cfHandle}/problems`);
      
      const newProblem = {
        ...problem,
        id: `${problem.contestId}${problem.index}`,
        addedAt: new Date().toISOString(),
        solved: problem.solved || false,
        solvedOnCF: problem.solvedOnCF || false,
        myTags: problem.myTags || []
      };

      // Check if problem already exists for this CF handle
      const problems = await this.getProblems(cfHandle);
      const exists = problems.some(p => p.id === newProblem.id);
      if (exists) {
        throw new Error('Problem already exists in your list');
      }

      // Add to Firestore using problem ID as document ID
      await setDoc(doc(handleProblemsRef, newProblem.id), newProblem);
      
      return await this.getProblems(cfHandle);
    } catch (error) {
      console.error('Error adding problem to Firestore:', error);
      throw error;
    }
  }

  /**
   * Remove a problem by ID for a CF handle
   * @param {string} problemId - Problem ID to remove
   * @param {string} cfHandle - Codeforces handle
   * @returns {Promise<Array>} Updated array of problems
   */
  async removeProblem(problemId, cfHandle) {
    if (!cfHandle) throw new Error('CF handle is required');
    
    try {
      const handleProblemsRef = collection(db, `cfHandles/${cfHandle}/problems`);
      await deleteDoc(doc(handleProblemsRef, problemId));
      
      return await this.getProblems(cfHandle);
    } catch (error) {
      console.error('Error removing problem from Firestore:', error);
      throw error;
    }
  }

  /**
   * Update a problem for a CF handle
   * @param {string} problemId - Problem ID to update
   * @param {Object} updates - Object containing fields to update
   * @param {string} cfHandle - Codeforces handle
   * @returns {Promise<Array>} Updated array of problems
   */
  async updateProblem(problemId, updates, cfHandle) {
    if (!cfHandle) throw new Error('CF handle is required');
    
    try {
      const handleProblemsRef = collection(db, `cfHandles/${cfHandle}/problems`);
      await updateDoc(doc(handleProblemsRef, problemId), updates);
      
      return await this.getProblems(cfHandle);
    } catch (error) {
      console.error('Error updating problem in Firestore:', error);
      throw error;
    }
  }

  /**
   * Toggle solved status of a problem for a CF handle
   * @param {string} problemId - Problem ID
   * @param {string} cfHandle - Codeforces handle
   * @returns {Promise<Array>} Updated array of problems
   */
  async toggleSolved(problemId, cfHandle) {
    if (!cfHandle) throw new Error('CF handle is required');
    
    try {
      const problems = await this.getProblems(cfHandle);
      const problem = problems.find(p => p.id === problemId);
      
      if (!problem) {
        throw new Error('Problem not found');
      }

      return await this.updateProblem(problemId, { solved: !problem.solved }, cfHandle);
    } catch (error) {
      console.error('Error toggling solved status:', error);
      throw error;
    }
  }

  /**
   * Add custom tags to a problem
   * @param {string} problemId - Problem ID
   * @param {Array<string>} tags - Tags to add
   * @returns {Promise<Array>} Updated array of problems
   */
  async addCustomTags(problemId, tags) {
    try {
      await this.initialize();
      
      const problems = await this.getProblems();
      const problem = problems.find(p => p.id === problemId);
      
      if (!problem) {
        throw new Error('Problem not found');
      }

      const myTags = [...new Set([...(problem.myTags || []), ...tags])];
      return await this.updateProblem(problemId, { myTags });
    } catch (error) {
      console.error('Error adding custom tags:', error);
      throw error;
    }
  }

  /**
   * Clear all problems
   * @returns {Promise<Array>} Empty array
   */
  async clearAll() {
    try {
      await this.initialize();
      
      const problems = await this.getProblems();
      
      const deletePromises = problems.map(problem => 
        deleteDoc(doc(this.userCollectionRef, problem.id))
      );
      
      await Promise.all(deletePromises);
      
      return [];
    } catch (error) {
      console.error('Error clearing all problems:', error);
      throw error;
    }
  }

  /**
   * Get settings from Firestore
   * @returns {Promise<Object>} Settings object
   */
  async getSettings() {
    try {
      await this.initialize();
      
      const docSnap = await getDocs(query(collection(db, `users/${auth.currentUser.uid}/settings`)));
      
      if (!docSnap.empty) {
        const settingsDoc = docSnap.docs[0];
        return settingsDoc.data();
      }
      
      return { cfHandle: '', hideTags: false };
    } catch (error) {
      console.error('Error reading settings from Firestore:', error);
      return { cfHandle: '', hideTags: false };
    }
  }

  /**
   * Save settings to Firestore
   * @param {Object} settings - Settings object
   */
  async saveSettings(settings) {
    try {
      await this.initialize();
      
      await setDoc(this.settingsDocRef, settings, { merge: true });
    } catch (error) {
      console.error('Error saving settings to Firestore:', error);
      throw error;
    }
  }

  /**
   * Update Codeforces handle
   * @param {string} handle - Codeforces handle
   */
  async setCfHandle(handle) {
    const settings = await this.getSettings();
    settings.cfHandle = handle;
    await this.saveSettings(settings);
  }

  /**
   * Get Codeforces handle
   * @returns {Promise<string>} Codeforces handle
   */
  async getCfHandle() {
    const settings = await this.getSettings();
    return settings.cfHandle || '';
  }

  /**
   * Toggle hide tags setting
   * @param {boolean} hideTags - Whether to hide tags
   */
  async setHideTags(hideTags) {
    const settings = await this.getSettings();
    settings.hideTags = hideTags;
    await this.saveSettings(settings);
  }

  /**
   * Get hide tags setting
   * @returns {Promise<boolean>} Whether tags are hidden
   */
  async getHideTags() {
    const settings = await this.getSettings();
    return settings.hideTags || false;
  }
}

// Export singleton instance
export const storage = new FirebaseStorageService();
