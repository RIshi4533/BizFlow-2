'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  PlusCircle,
  Save,
  Trash2,
  Sparkles,
  Loader,
  Settings,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Survey, SurveySection, Question, QuestionType } from '@/types/survey';
import { useToast } from '@/hooks/use-toast';
import { generateSurveyQuestions } from '@/app/ai-actions';


const questionTypeOptions: { value: QuestionType; label: string }[] = [
    { value: 'short-text', label: 'Short Text' },
    { value: 'paragraph', label: 'Paragraph' },
    { value: 'multiple-choice', label: 'Multiple Choice' },
    { value: 'checkbox', label: 'Checkboxes' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'yes-no', label: 'Yes/No' },
    { value: 'rating', label: 'Rating (1-5)' },
];

type SurveyEditorProps = {
    survey: Survey;
    setSurvey: React.Dispatch<React.SetStateAction<Survey>>;
}

export default function SurveyEditor({ survey, setSurvey }: SurveyEditorProps) {
    const { toast } = useToast();
    const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);

    const updateSurvey = (field: keyof Survey, value: any) => {
        setSurvey(prev => ({ ...prev, [field]: value }));
    };

    const addQuestion = () => {
        const newQuestion: Question = {
            id: `q_${Date.now()}`,
            label: '',
            type: 'short-text',
            required: false,
            options: [],
        };
        const updatedQuestions = [...(survey.questions || []), newQuestion];
        updateSurvey('questions', updatedQuestions);
    };

    const updateQuestion = (qIndex: number, field: keyof Question, value: any) => {
        const newQuestions = [...survey.questions!];
        (newQuestions[qIndex] as any)[field] = value;
        updateSurvey('questions', newQuestions);
    };

    const removeQuestion = (qIndex: number) => {
        const newQuestions = [...survey.questions!];
        newQuestions.splice(qIndex, 1);
        updateSurvey('questions', newQuestions);
    };
    
    const updateOption = (qIndex: number, oIndex: number, value: string) => {
        const newQuestions = [...survey.questions!];
        newQuestions[qIndex].options![oIndex] = value;
        updateSurvey('questions', newQuestions);
    }
    
    const addOption = (qIndex: number) => {
        const newQuestions = [...survey.questions!];
        if(!newQuestions[qIndex].options) newQuestions[qIndex].options = [];
        newQuestions[qIndex].options!.push('');
        updateSurvey('questions', newQuestions);
    }
    
    const removeOption = (qIndex: number, oIndex: number) => {
        const newQuestions = [...survey.questions!];
        newQuestions[qIndex].options!.splice(oIndex, 1);
        updateSurvey('questions', newQuestions);
    }


    const handleGenerateQuestions = async () => {
        if (!aiPrompt) return;
        setIsAiLoading(true);
        try {
            const result = await generateSurveyQuestions({ topic: aiPrompt });
            const newQuestions: Question[] = result.questions.map(q => ({
                id: `q_${Date.now()}_${Math.random()}`,
                label: q.text,
                type: q.type,
                required: false,
                options: q.options || [],
            }));
            const updatedQuestions = [...(survey.questions || []), ...newQuestions];
            setSurvey(prev => ({ ...prev, questions: updatedQuestions }));
            toast({ title: "Questions Generated!", description: `Added ${newQuestions.length} new questions.`});
            setIsAiDialogOpen(false);
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Failed to generate questions.', variant: 'destructive' });
        } finally {
            setIsAiLoading(false);
        }
    };


    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Survey Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" value={survey.title} onChange={e => updateSurvey('title', e.target.value)} placeholder="e.g., Customer Satisfaction Survey" />
                        </div>
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={survey.description} onChange={e => updateSurvey('description', e.target.value)} placeholder="A brief description of your survey." />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Questions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    {survey.questions?.map((q, qIndex) => (
                        <Card key={q.id} className="p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-semibold">Question {qIndex + 1}</h4>
                                <Button variant="ghost" size="icon" onClick={() => removeQuestion(qIndex)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                            <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor={`q-label-${q.id}`}>Question Text</Label>
                                    <Input id={`q-label-${q.id}`} value={q.label} onChange={e => updateQuestion(qIndex, 'label', e.target.value)} />
                                </div>
                                <div>
                                    <Label htmlFor={`q-type-${q.id}`}>Question Type</Label>
                                    <Select value={q.type} onValueChange={(value: QuestionType) => updateQuestion(qIndex, 'type', value)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {questionTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            {(q.type === 'multiple-choice' || q.type === 'checkbox' || q.type === 'dropdown') && (
                                <div className="space-y-2 pl-4 border-l-2">
                                    <Label>Options</Label>
                                    {q.options?.map((opt, oIndex) => (
                                        <div key={oIndex} className="flex items-center gap-2">
                                            <Input value={opt} onChange={e => updateOption(qIndex, oIndex, e.target.value)} />
                                            <Button variant="ghost" size="icon" onClick={() => removeOption(qIndex, oIndex)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    ))}
                                    <Button variant="outline" size="sm" onClick={() => addOption(qIndex)}>Add Option</Button>
                                </div>
                            )}
                            <div className="flex items-center space-x-2 pt-2">
                                <Switch id={`q-required-${q.id}`} checked={q.required} onCheckedChange={checked => updateQuestion(qIndex, 'required', checked)} />
                                <Label htmlFor={`q-required-${q.id}`}>Required</Label>
                            </div>
                            </div>
                        </Card>
                    ))}
                    </CardContent>
                    <CardFooter className="flex gap-2">
                         <Button onClick={addQuestion}><PlusCircle className="mr-2 h-4 w-4" /> Add Question</Button>
                        <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline"><Sparkles className="mr-2 h-4 w-4" /> Generate with AI</Button>
                        </DialogTrigger>
                            <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Generate Questions with AI</DialogTitle>
                                <DialogDescription>Describe the topic of your survey, and AI will create questions for you.</DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <Textarea 
                                    placeholder="e.g., A survey about employee satisfaction with our new work-from-home policy."
                                    value={aiPrompt}
                                    onChange={e => setAiPrompt(e.target.value)}
                                    className="min-h-[120px]"
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAiDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleGenerateQuestions} disabled={isAiLoading}>
                                    {isAiLoading ? <Loader className="animate-spin mr-2" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                    Generate
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    </CardFooter>
                </Card>
            </div>

            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                            <div>
                            <Label htmlFor="status">Visibility</Label>
                            <Select value={survey.visibility} onValueChange={(value: 'public' | 'private') => updateSurvey('visibility', value)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="private">Private</SelectItem>
                                    <SelectItem value="public">Public</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                            <div>
                            <Label htmlFor="expiration">Expiration Date (Optional)</Label>
                            <DatePicker date={survey.expirationDate ? new Date(survey.expirationDate) : undefined} setDate={(date) => updateSurvey('expirationDate', date?.toISOString())} />
                        </div>
                        <div className="flex items-center space-x-2">
                             <Switch id="anonymous" checked={survey.allowAnonymousResponses} onCheckedChange={checked => updateSurvey('allowAnonymousResponses', checked)} />
                             <Label htmlFor="anonymous">Allow Anonymous Responses</Label>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
