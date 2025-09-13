
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, DocumentData } from 'firebase/firestore';
import { type Appointment } from '@/lib/mock-data';

export default function useMyAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'appointments'), orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(q, (snapshot) => {
      const fetchedAppointments = snapshot.docs.map(doc => {
          const data = doc.data();
          // Firestore Timestamps need to be converted to JS Dates.
          // The 'date' field is already stored as a string, so we create a Date from it.
          // The 'createdAt' field is a Firestore Timestamp.
          return {
              id: doc.id,
              ...data,
              date: new Date(data.date),
              createdAt: data.createdAt?.toDate(),
          } as Appointment;
      });
      setAppointments(fetchedAppointments);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching appointments:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { appointments, loading, setAppointments };
}
