// src/lib/firebase-admin.ts

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // Or use a service account if needed
  });
}

const adminDB = admin.firestore();

export { admin, adminDB };
