// components/SurveyRenderer.tsx
"use client";

import { useState } from "react";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { Survey, Question } from "@/types/survey";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";


export default function SurveyRenderer({ survey }: { survey: Survey }) {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [error, setError] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const handleChange = (qId: string, value: any) => {
    setResponses((prev) => ({ ...prev, [qId]: value }));
  };

  const handleSubmit = async () => {
    const missingRequired = survey.questions.some(
      (q) => q.required && !responses[q.id]
    );
    if (missingRequired) {
      setError("Please answer all required questions.");
      return;
    }
    setError("");
  
    if (!survey.id) {
      setError("This survey cannot accept responses at this time.");
      return;
    }
  
    // The security rule allows anonymous responses, so we don't need to block based on auth.
    // However, we still want to associate the response with a user if they are logged in.
    const userId = auth.currentUser?.uid || 'anonymous';
  
    const responseId = uuidv4();
    const surveyRef = doc(db, "surveys", survey.id);
    const responseRef = doc(db, "surveys", survey.id, "responses", responseId);
  
    try {
      await runTransaction(db, async (transaction) => {
        const surveyDoc = await transaction.get(surveyRef);
        if (!surveyDoc.exists()) {
          throw new Error("Survey does not exist!");
        }
  
        const newResponseCount = (surveyDoc.data()?.responseCount || 0) + 1;
  
        transaction.set(responseRef, {
          id: responseId,
          surveyId: survey.id,
          answers: responses,
          submittedAt: serverTimestamp(),
          userId: userId,
        });
  
        transaction.update(surveyRef, {
          responseCount: newResponseCount,
        });
      });
  
      toast({
        title: "Saved!",
        description: "Your response has been submitted successfully.",
      });
  
      router.push("/thank-you");
    } catch (err: any) {
      console.error("Submission error:", err.message || err);
      toast({
        title: "Error",
        description: "Could not submit your response. Try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
            <CardTitle className="text-3xl">{survey.title}</CardTitle>
            <CardDescription>{survey.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            {survey.questions.map((q, index) => (
                <div key={q.id} className="p-4 border rounded-lg">
                <label className="block text-lg font-medium text-gray-700 mb-4">
                    {index+1}. {q.label} {q.required && <span className="text-red-500">*</span>}
                </label>

                {q.type === "short-text" && (
                    <Input
                    type="text"
                    onChange={(e) => handleChange(q.id, e.target.value)}
                    />
                )}

                {q.type === "paragraph" && (
                    <Textarea
                    rows={4}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                    />
                )}

                {q.type === "multiple-choice" && (
                    <RadioGroup className="space-y-2" onValueChange={(value) => handleChange(q.id, value)}>
                    {(q.options || []).map((opt: string) => (
                        <div key={opt} className="flex items-center space-x-2">
                            <RadioGroupItem value={opt} id={`${q.id}-${opt}`} />
                            <Label htmlFor={`${q.id}-${opt}`} className="font-normal">{opt}</Label>
                        </div>
                    ))}
                    </RadioGroup>
                )}
                
                {q.type === "checkbox" && (
                    <div className="space-y-2">
                    {(q.options || []).map((opt: string) => (
                        <div key={opt} className="flex items-center space-x-2">
                        <Checkbox
                            id={`${q.id}-${opt}`}
                            onCheckedChange={(checked) => {
                                const prev = responses[q.id] || [];
                                handleChange(
                                    q.id,
                                    checked
                                    ? [...prev, opt]
                                    : prev.filter((item: string) => item !== opt)
                                );
                            }}
                        />
                        <Label htmlFor={`${q.id}-${opt}`} className="font-normal">{opt}</Label>
                        </div>
                    ))}
                    </div>
                )}

                {q.type === "dropdown" && (
                    <Select onValueChange={(value) => handleChange(q.id, value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                            {(q.options || []).map((opt: string) => (
                                <SelectItem key={opt} value={opt}>
                                {opt}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {q.type === "yes-no" && (
                    <RadioGroup className="space-y-2" onValueChange={(value) => handleChange(q.id, value)}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Yes" id={`${q.id}-yes`} />
                            <Label htmlFor={`${q.id}-yes`} className="font-normal">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="No" id={`${q.id}-no`} />
                            <Label htmlFor={`${q.id}-no`} className="font-normal">No</Label>
                        </div>
                    </RadioGroup>
                )}

                {q.type === "rating" && (
                    <RadioGroup className="flex items-center space-x-4" onValueChange={(value) => handleChange(q.id, value)}>
                        {['1','2','3','4','5'].map((opt: string) => (
                        <div key={opt} className="flex flex-col items-center">
                            <Label htmlFor={`${q.id}-${opt}`} className="mb-2">{opt}</Label>
                            <RadioGroupItem value={opt} id={`${q.id}-${opt}`} />
                        </div>
                        ))}
                    </RadioGroup>
                )}

                </div>
            ))}
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4">
            {error && <div className="text-destructive font-medium p-2 bg-destructive/10 rounded-md w-full">{error}</div>}
            <Button
                onClick={handleSubmit}
                className="w-full text-lg py-6"
            >
                Submit
            </Button>
        </CardFooter>
    </Card>
  );
}
