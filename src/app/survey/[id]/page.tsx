// src/app/survey/[id]/page.tsx
'use client';

import * as React from 'react';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader, AlertTriangle, ArrowLeft } from 'lucide-react';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Survey } from '@/types/survey';
import SurveyRenderer from '@/components/survey/SurveyRenderer';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

function PublicSurveyPageContent({ params }: { params: { id: string } }) {
    const { user, loading: authLoading } = useAuth();
    const [survey, setSurvey] = React.useState<Survey | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

    const fetchSurvey = React.useCallback(async () => {
        setIsLoading(true);
        if (!params.id) {
            setErrorMessage("Invalid survey link.");
            setIsLoading(false);
            return;
        }

        try {
            const docRef = doc(db, 'surveys', params.id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const surveyData = { 
                    id: docSnap.id, 
                    ...docSnap.data(),
                    createdAt: docSnap.data().createdAt instanceof Timestamp ? docSnap.data().createdAt.toDate().toISOString() : docSnap.data().createdAt,
                    expirationDate: docSnap.data().expirationDate instanceof Timestamp ? docSnap.data().expirationDate.toDate().toISOString() : docSnap.data().expirationDate,
                } as Survey;
                
                // New logic: Check permissions only after auth is resolved
                if (!authLoading) {
                    if (surveyData.visibility === 'public' || (user && surveyData.ownerId === user.uid)) {
                        setSurvey(surveyData);
                        setErrorMessage(null);
                    } else {
                        setSurvey(null);
                        setErrorMessage("This survey is private or you do not have permission to view it.");
                    }
                }
            } else {
                setSurvey(null);
                setErrorMessage("This survey could not be found.");
            }
        } catch (error) {
            console.error("Error fetching survey:", error);
            setErrorMessage("An unexpected error occurred while loading the survey.");
        } finally {
            if (!authLoading) {
              setIsLoading(false);
            }
        }
    }, [params.id, user, authLoading]);

    React.useEffect(() => {
        // Fetch survey data only when auth is not loading
        if (!authLoading) {
            fetchSurvey();
        }
    }, [authLoading, fetchSurvey]);


    if (isLoading || authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-secondary">
                <div className="text-center">
                    <Loader className="mx-auto h-12 w-12 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground">Loading survey...</p>
                </div>
            </div>
        )
    }

    if (errorMessage) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-secondary">
                 <Card className="w-full max-w-lg text-center p-8">
                    <CardHeader>
                        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                        <CardTitle className="mt-4">Survey Not Available</CardTitle>
                        <CardDescription>{errorMessage}</CardDescription>
                         <CardContent>
                            <Button asChild className="mt-4">
                                <Link href="/dashboard">Go to Dashboard</Link>
                            </Button>
                        </CardContent>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    if (!survey) {
        // This case handles when loading is done but no survey is set (and no error, which is unlikely but good practice)
        return null;
    }
    
    return (
        <div className="min-h-screen bg-secondary p-4 md:p-8 flex items-center justify-center">
            <SurveyRenderer survey={survey} />
        </div>
    );
}


export default function PublicSurveyPage({ params }: { params: { id: string } }) {
    return (
        <AuthProvider>
            <PublicSurveyPageContent params={params} />
        </AuthProvider>
    )
}
