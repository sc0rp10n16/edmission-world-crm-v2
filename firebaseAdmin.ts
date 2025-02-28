import admin from 'firebase-admin';

const serviceKey = require('@/service_key.json');
// Check if Firebase admin is already initialized
if (!admin.apps.length) {
  // Get the Firebase service account credentials from environment variables
  

  // Initialize the admin SDK
  admin.initializeApp({
    credential: admin.credential.cert(serviceKey)
  });
}

// Export the Firebase admin modules
export const auth = admin.auth();
export const db = admin.firestore();
export const storage = admin.storage();
export default admin;
