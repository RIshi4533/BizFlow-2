
'use client';

import * as React from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '@/lib/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Loader, BarChart2, Eye, Edit } from "lucide-react";
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { type Survey } from '@/types/survey';
import { format } from 'date-fns';

const getStatusVariant = (status: string) => {
    switch(status) {
        case 'published': return 'default';
        case 'draft': return 'secondary';
        case 'closed': return 'outline';
        default: return 'default';
    }
}

const getStatusClass = (status: string) => {
    switch (status) {
        case 'published': return 'bg-green-100 text-green-800';
        case 'draft': return 'bg-gray-100 text-gray-800';
        case 'closed': return 'bg-red-100 text-red-800';
        default: return '';
    }
}

export default function SurveyListPage() {
    const { user } = useAuth();
    
    // Firestore query that fetches surveys only for the current user.
    const surveysQuery = user ? query(collection(db, 'surveys'), where('ownerId', '==', user.uid)) : null;
    const [snapshot, loading, error] = useCollection(surveysQuery);

    const surveys: Survey[] = snapshot ? snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        } as Survey
    }) : [];

    if (error) {
        console.error("Error fetching surveys:", error);
        return <p>Error loading surveys.</p>;
    }

    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Surveys</CardTitle>
                            <CardDescription>Create and manage your surveys.</CardDescription>
                        </div>
                        <Button asChild>
                            <Link href="/dashboard/survey/new">
                                <PlusCircle className="mr-2 h-4 w-4" /> Create Survey
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Responses</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24"><Loader className="mx-auto animate-spin" /></TableCell>
                                </TableRow>
                            )}
                            {!loading && surveys.length === 0 && (
                                 <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">You haven't created any surveys yet.</TableCell>
                                </TableRow>
                            )}
                            {surveys.map((survey) => (
                                <TableRow key={survey.id}>
                                    <TableCell className="font-medium">{survey.title}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(survey.status)} className={getStatusClass(survey.status)}>{survey.status.charAt(0).toUpperCase() + survey.status.slice(1)}</Badge>
                                    </TableCell>
                                    <TableCell>{survey.responseCount || 0}</TableCell>
                                    <TableCell>
                                        {survey.createdAt ? format(new Date(survey.createdAt), 'PPP') : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                         <Button variant="outline" size="sm" asChild>
                                            <Link href={`/survey/${survey.id}`} target="_blank">
                                                <Eye className="mr-2 h-4 w-4" /> View
                                            </Link>
                                        </Button>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/dashboard/survey/${survey.id}/analytics`}>
                                                <BarChart2 className="mr-2 h-4 w-4" /> Analytics
                                            </Link>
                                        </Button>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/dashboard/survey/new?id=${survey.id}`}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
