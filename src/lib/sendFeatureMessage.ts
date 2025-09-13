
// lib/sendFeatureMessage.ts
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export function sendFeatureMessage(
  fromFeature: string,
  toFeature: string,
  message: string,
  senderId: string,
  receiverId: string,
  relatedId: string | null
) {
    if (!senderId || !receiverId) {
        return Promise.reject(new Error("Sender or Receiver ID is missing."));
    }

    return addDoc(collection(db, 'cross_comm'), {
        fromFeature,
        toFeature,
        message,
        from: senderId,
        to: receiverId,
        relatedId,
        timestamp: serverTimestamp(),
        read: false,
    });
}
