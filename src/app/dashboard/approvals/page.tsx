
'use client';

import * as React from "react";
import { useState, useEffect } from "react";
import { CheckSquare, Loader, X, ThumbsUp, ThumbsDown, User, Calendar, Tag, Check } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, addDoc, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import type { ApprovalRequest } from "@/lib/mock-data";
import { initialApprovals } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";


const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Approved': return 'default';
        case 'Rejected': return 'destructive';
        case 'Pending':
        default: return 'secondary';
    }
}

const getStatusClass = (status: string) => {
    switch (status) {
        case 'Approved': return 'bg-green-100 text-green-800';
        case 'Rejected': return 'bg-red-100 text-red-800';
        case 'Pending':
        default: return 'bg-yellow-100 text-yellow-800';
    }
}

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState("Pending");
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    
    setIsLoading(true);

    // Using a local copy for demonstration purposes.
    // In a real app, you would use Firestore listeners.
    const filtered = initialApprovals.filter(req => req.status === status);
    setRequests(filtered);
    setIsLoading(false);

  }, [status, user]);

  const handleStatusUpdate = (id: string, newStatus: 'Approved' | 'Rejected') => {
      // This is a mock update. In a real app, you'd update Firestore.
      const updatedRequests = requests.map(r => r.id === id ? {...r, status: newStatus } : r);
      // For demonstration, we'll just filter it out from the current view.
      setRequests(updatedRequests.filter(r => r.status === status));
      toast({
          title: `Request ${newStatus}`,
          description: `The request has been successfully ${newStatus.toLowerCase()}.`
      })
  }

  return (
    <div className="flex flex-col gap-6">
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <CheckSquare className="w-8 h-8 text-primary" />
                <div>
                    <CardTitle>Approvals</CardTitle>
                    <CardDescription>Review and manage requests for expenses, time off, and more.</CardDescription>
                </div>
            </CardHeader>
        </Card>
      
        <Tabs value={status} onValueChange={setStatus}>
            <TabsList className="mb-4 grid grid-cols-3">
            <TabsTrigger value="Pending">Pending</TabsTrigger>
            <TabsTrigger value="Approved">Approved</TabsTrigger>
            <TabsTrigger value="Rejected">Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value={status}>
            {isLoading ? (
                <div className="flex justify-center items-center h-48">
                    <Loader className="animate-spin" />
                </div>
            ) : requests.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                    <p>No {status.toLowerCase()} requests.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {requests.map((req) => (
                <Card key={req.id} className="flex flex-col">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                             <CardTitle className="text-lg">{req.title}</CardTitle>
                             <Badge variant={getStatusVariant(req.status)} className={getStatusClass(req.status)}>{req.status}</Badge>
                        </div>
                         <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Tag className="w-3 h-3" /> {req.type}
                         </div>
                    </CardHeader>
                    <CardContent className="space-y-3 flex-1">
                        <div className="text-sm flex items-center gap-2">
                           <User className="w-4 h-4 text-muted-foreground" />
                           <span>Requested by: <strong>{req.requester}</strong></span>
                        </div>
                        <div className="text-sm flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>On: {new Date(req.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}</span>
                        </div>
                        {req.amount && (
                             <div className="text-sm flex items-center gap-2">
                                <span className="font-semibold text-lg text-primary">${req.amount.toFixed(2)}</span>
                            </div>
                        )}
                    </CardContent>
                    {req.status === 'Pending' && (
                        <CardFooter className="flex gap-2">
                            <Button variant="outline" size="sm" className="w-full" onClick={() => handleStatusUpdate(req.id, 'Rejected')}>
                                <X className="w-4 h-4 mr-2"/> Reject
                            </Button>
                             <Button size="sm" className="w-full" onClick={() => handleStatusUpdate(req.id, 'Approved')}>
                                <Check className="w-4 h-4 mr-2" /> Approve
                            </Button>
                        </CardFooter>
                    )}
                </Card>
                ))}
                </div>
            )}
            </TabsContent>
        </Tabs>
    </div>
  );
}
