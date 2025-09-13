
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart2, PieChart, FileText, Download, User, Clock, Loader } from 'lucide-react';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar, Pie, Cell, Legend } from 'recharts';
import { type Survey, type SurveyResponse, type Question } from '@/lib/mock-data';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { getDoc, doc, collection, getDocs } from 'firebase/firestore';


const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8442ff', '#ffc658'];

const getChartDataForQuestion = (question: Question, responses: SurveyResponse[]) => {
    if (!question.options || question.options.length === 0) {
        if (question.type === 'yes-no') {
            question.options = ['Yes', 'No'];
        } else if (question.type === 'rating') {
            question.options = ['1', '2', '3', '4', '5'];
        } else {
            return [];
        }
    }
    
    const counts: { [key: string]: number } = {};
    question.options.forEach(opt => counts[opt] = 0);
    
    responses.forEach(resp => {
        const answer = resp.answers[question.id];
        if (answer && counts[answer as string] !== undefined) {
            counts[answer as string]++;
        }
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
};


export default function SurveyAnalyticsPage({ params }: { params: { id: string } }) {
    const [survey, setSurvey] = React.useState<Survey | null>(null);
    const [responses, setResponses] = React.useState<SurveyResponse[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const { user } = useAuth();
    
    React.useEffect(() => {
        async function fetchData() {
            if (!params.id) return;
            setIsLoading(true);
            
            try {
                const docRef = doc(db, 'surveys', params.id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const surveyData = { id: docSnap.id, ...docSnap.data() } as Survey;
                    setSurvey(surveyData);

                    const responsesRef = collection(db, 'surveys', params.id, 'responses');
                    const responsesSnap = await getDocs(responsesRef);
                    const responseData = responsesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SurveyResponse));
                    setResponses(responseData);

                }
            } catch (error) {
                console.error("Error fetching survey analytics:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [params.id]);


    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader className="animate-spin" /></div>;
    }

    if (!survey) {
        return (
             <div className="flex flex-col items-center justify-center text-center gap-4">
                <h1 className="text-2xl font-bold">Survey Not Found</h1>
                <p className="text-muted-foreground">The survey you are looking for does not exist or could not be loaded.</p>
                <Button asChild>
                    <Link href="/dashboard/survey"><ArrowLeft className="mr-2 h-4 w-4" />Back to Surveys</Link>
                </Button>
            </div>
        );
    }

    const exportToCsv = () => {
        if (responses.length === 0) return;
        const headers = ['ResponseID', 'SubmittedAt', ...survey.questions.map(q => `"${q.text.replace(/"/g, '""')}"`)];
        const rows = responses.map(resp => [
            resp.id,
            resp.submittedAt,
            ...survey.questions.map(q => `"${String(resp.answers[q.id] || '').replace(/"/g, '""')}"`)
        ].join(','));
        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if(link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${survey.title.replace(/ /g,"_")}_responses.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/survey"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{survey.title} - Analytics</h1>
                    <p className="text-muted-foreground">Review responses and insights for your survey.</p>
                </div>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Summary</CardTitle>
                    <Button variant="outline" size="sm" onClick={exportToCsv} disabled={responses.length === 0}>
                        <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 rounded-lg bg-secondary text-center">
                        <User className="mx-auto h-8 w-8 text-primary" />
                        <p className="mt-2 text-3xl font-bold">{survey.responseCount}</p>
                        <p className="text-sm text-muted-foreground">Total Responses</p>
                    </div>
                     <div className="p-4 rounded-lg bg-secondary text-center">
                        <Clock className="mx-auto h-8 w-8 text-primary" />
                         <p className="mt-2 text-xl font-bold">
                            {survey.expirationDate ? format(new Date(survey.expirationDate), 'PPP') : 'No Expiration'}
                        </p>
                        <p className="text-sm text-muted-foreground">Expiration Date</p>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6">
                {survey.questions.map((question, index) => {
                     const isChartable = question.type === 'multiple-choice' || question.type === 'yes-no' || question.type === 'rating';
                     const chartData = isChartable ? getChartDataForQuestion(question, responses) : [];
                     return (
                    <Card key={question.id}>
                        <CardHeader>
                            <CardTitle>Question {index + 1}: {question.text}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isChartable ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                   <div className="h-64">
                                     <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} layout="vertical" margin={{ left: 100 }}>
                                            <XAxis type="number" hide />
                                            <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                                            <Tooltip cursor={{ fill: 'hsl(var(--secondary))'}} />
                                            <Bar dataKey="value" name="Responses" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                   </div>
                                    <div className="h-64">
                                     <ResponsiveContainer width="100%" height="100%">
                                         <PieChart>
                                            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                                                 {chartData.map((entry, idx) => <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip formatter={(value, name) => [value, name]} />
                                            <Legend />
                                         </PieChart>
                                     </ResponsiveContainer>
                                   </div>
                                </div>
                            ) : (
                                <div className="max-h-64 overflow-y-auto space-y-2 p-2 bg-secondary rounded-md">
                                    {responses.length > 0 ? responses.map(r => (
                                        <div key={r.id} className="p-2 border-b text-sm">
                                            {String(r.answers[question.id] || '(No answer)')}
                                        </div>
                                    )) : <p className="text-sm text-muted-foreground p-4 text-center">No text responses yet.</p>}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )})}
            </div>
        </div>
    );

    