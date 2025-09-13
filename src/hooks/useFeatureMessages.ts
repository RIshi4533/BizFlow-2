
'use client';

// hooks/useFeatureMessages.ts
import { useEffect, useState, useCallback } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, DocumentData } from 'firebase/firestore';
import { useAuth } from './use-auth';
import type { Contact } from '@/lib/mock-data'; // Import Contact type

export default function useFeatureMessages(toFeature: string) {
  const [messages, setMessages] = useState<DocumentData[]>([]);
  const { user } = useAuth();

  const getContactsFromLocalStorage = useCallback(() => {
    if (!user) return [];
    const storageKey = `bizflow-contacts-${user.uid}`;
    try {
        const storedContacts = localStorage.getItem(storageKey);
        return storedContacts ? JSON.parse(storedContacts) : [];
    } catch(error) {
        console.error("Failed to parse contacts from localStorage", error);
        return [];
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setMessages([]);
      return;
    };

    const q = query(
      collection(db, 'cross_comm'),
      where('to', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const allContacts: Contact[] = getContactsFromLocalStorage();
      
      const newMessages = snapshot.docs.map(doc => {
          const data = doc.data();
          const sender = allContacts.find(c => c.id === data.from);
          return {
              id: doc.id,
              ...data,
              senderName: sender?.name || data.from,
          }
      });
      
      setMessages(newMessages);

    }, (error) => {
      console.error("Error fetching feature messages:", error);
    });

    return () => unsub();
  }, [user, toFeature, getContactsFromLocalStorage]);

  return messages;
}
