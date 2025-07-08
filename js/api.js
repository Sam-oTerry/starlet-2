// --- AGENT STORE API ---

// Initialize Firebase if not already done
let db;
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp({
    apiKey: "AIzaSyDH1sMk2NwceMAEfvH07azxaoPXpOI1Sek",
    authDomain: "starlet-properties-41509.firebaseapp.com",
    projectId: "starlet-properties-41509"
  });
}
if (typeof firebase !== 'undefined') db = firebase.firestore();

/**
 * Fetch agent store profile by agentId
 * @param {string} agentId
 * @returns {Promise<Object|null>}
 */
async function fetchAgentStoreProfile(agentId) {
  if (!db) return null;
  try {
    const doc = await db.collection('agentStores').doc(agentId).get();
    return doc.exists ? doc.data() : null;
  } catch (e) {
    return null;
  }
}

/**
 * Fetch listings for a given agentId
 * @param {string} agentId
 * @returns {Promise<Array>}
 */
async function fetchAgentListings(agentId) {
  if (!db) return [];
  try {
    const snap = await db.collection('listings').where('agentId', '==', agentId).get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    return [];
  }
}

// Add more API functions as needed for analytics, premium services, etc.
