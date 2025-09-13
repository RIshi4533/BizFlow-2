
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, addDoc, runTransaction, serverTimestamp } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { surveyId, answers } = await request.json();

    if (!surveyId || !answers) {
        return NextResponse.json({ message: 'Missing surveyId or answers.' }, { status: 400 });
    }

    // Add the new response to the subcollection
    const newResponseRef = await addDoc(collection(db, 'surveys', surveyId, 'responses'), {
        surveyId,
        submittedAt: serverTimestamp(),
        answers,
    });

    // Update the response count on the parent survey document in a transaction
    const surveyRef = doc(db, 'surveys', surveyId);
    await runTransaction(db, async (transaction) => {
        const surveyDoc = await transaction.get(surveyRef);
        if (!surveyDoc.exists()) {
            throw "Survey does not exist!";
        }
        const newResponseCount = (surveyDoc.data().responseCount || 0) + 1;
        transaction.update(surveyRef, { responseCount: newResponseCount });
    });
    

    return NextResponse.json({ message: 'Response submitted successfully!', responseId: newResponseRef.id }, { status: 201 });

  } catch (error) {
      console.error('Failed to submit response:', error);
      return NextResponse.json({ message: 'Failed to submit response' }, { status: 500 });
  }
}
