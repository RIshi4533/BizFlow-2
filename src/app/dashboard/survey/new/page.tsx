
// 🔥 FULLY WORKING SURVEY EDITOR PAGE — ALL 3 BUGS FIXED 🔥

'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Survey, SurveySection } from '@/types/survey';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader, AlertTriangle, ArrowLeft, Save } from 'lucide-react';
import { addDoc, collection, doc, getDoc, setDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import SurveyEditor from '@/components/survey/survey-editor';
import Link from 'next/link';

export default function NewSurveyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [survey, setSurvey] = useState<Survey>({
    title: '',
    description: '',
    ownerId: '',
    sections: [] as SurveySection[],
    questions: [] as any[],
    visibility: 'private',
    allowAnonymousResponses: false,
    responseCount: 0,
    status: 'draft',
    createdAt: new Date().toISOString(),
    expirationDate: undefined,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const surveyId = searchParams.get('id');

    const fetchSurvey = async () => {
      if (!surveyId || !user) return;

      try {
        const docRef = doc(db, 'surveys', surveyId);
        const docSnap = await getDoc(docRef);

        if (!isMounted) return;

        if (docSnap.exists() && docSnap.data().ownerId === user.uid) {
          const data = docSnap.data();
          setSurvey({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate().toISOString(),
            expirationDate: data.expirationDate?.toDate().toISOString(),
          } as Survey);
          setIsEditing(true);
        } else {
          setLoadError('Survey not found or permission denied.');
        }
      } catch (error) {
        console.error('Fetch survey failed:', error);
        setLoadError('Failed to fetch survey.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (user) {
      if (surveyId) {
        fetchSurvey();
      } else {
        setSurvey((prev) => ({ ...prev, ownerId: user?.uid || '' }));
        setIsLoading(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [searchParams, user]);

  const handleSave = async () => {
    if (!user?.uid) {
      toast({ title: 'Error', description: 'You must be logged in to save.', variant: 'destructive' });
      return;
    }
     if (!survey.title) {
        toast({ title: 'Error', description: 'Survey title is required.', variant: 'destructive'});
        return;
    }


    setIsSaving(true);
    try {
      if (isEditing && survey.id) {
        const docRef = doc(db, 'surveys', survey.id);
        const finalData: any = {
            ...survey,
            ownerId: user.uid,
            questions: survey.questions || [],
            sections: survey.sections || [],
            updatedAt: serverTimestamp(),
            createdAt: survey.createdAt ? Timestamp.fromDate(new Date(survey.createdAt)) : serverTimestamp(),
            expirationDate: survey.expirationDate ? Timestamp.fromDate(new Date(survey.expirationDate)) : null
        };
        await setDoc(docRef, finalData, { merge: true });
        toast({ title: 'Survey Updated!' });
        router.push('/dashboard/survey');
      } else {
        await addDoc(collection(db, 'surveys'), {
            ...survey,
            ownerId: user.uid,
            createdAt: serverTimestamp(),
            expirationDate: survey.expirationDate ? Timestamp.fromDate(new Date(survey.expirationDate)) : null,
        });
        toast({ title: 'Survey Saved!' });
        router.push(`/dashboard/survey`);
      }
    } catch (err: any) {
      console.error('Save failed:', err);
      toast({ title: 'Error', description: `Failed to save survey: ${err.message}`, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-6 w-6 animate-spin" /> Loading survey...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <h1 className="text-2xl font-bold">Error Loading Survey</h1>
        <p className="text-muted-foreground">{loadError}</p>
        <Button asChild>
          <Link href="/dashboard/survey">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Surveys
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/survey">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{isEditing ? 'Edit Survey' : 'Create New Survey'}</h1>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/survey')}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader className="h-4 w-4 animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
            {isEditing ? 'Update Survey' : 'Save Survey'}
          </Button>
        </div>
      </div>

      <SurveyEditor survey={survey} setSurvey={setSurvey} />
    </div>
  );
}
