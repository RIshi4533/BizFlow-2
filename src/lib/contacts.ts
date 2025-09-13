import { db } from "@/lib/firebase"; // or relative: "../../lib/firebase"
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { toast } from "sonner"; // if fails, use `react-hot-toast` as backup

/**
 * Save or update a contact
 */
export async function saveContact(contact: {
  id?: string;
  name: string;
  email: string;
  phone: string;
}) {
  const user = getAuth().currentUser;
  if (!user) return toast.error("Login required");

  const contactId = contact.id || crypto.randomUUID();
  const ref = doc(db, "contacts", contactId);

  const data = {
    ...contact,
    id: contactId,
    ownerId: user.uid,
    createdAt: Date.now(),
  };

  try {
    await setDoc(ref, data, { merge: true });
    toast.success("Contact saved");
  } catch (err) {
    console.error("Failed to save contact:", err);
    toast.error("Save failed");
  }
}

/**
 * Fetch all contacts created by the user
 */
export async function getUserContacts() {
  const user = getAuth().currentUser;
  if (!user) return [];

  const q = query(collection(db, "contacts"), where("ownerId", "==", user.uid));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
