
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarOff, Plane, PlusCircle, Calendar as CalendarIcon, User, Send, CheckCircle, XCircle, Clock, Loader } from "lucide-react";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { type LeaveRequest, type LeaveBalance, type LeaveType, type LeaveRequestStatus, type Contact, type Employee, initialEmployees, initialContacts } from '@/lib/mock-data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, differenceInCalendarDays, addDays } from 'date-fns';
import { DateRange } from "react-day-picker";
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from '@/lib/firebase';
import { useCollection, useDocumentData } from 'react-firebase-hooks/firestore';
import { collection, query, where, addDoc, doc, updateDoc, serverTimestamp, getDocs, orderBy, Timestamp } from 'firebase/firestore';


const getStatusVariant = (status: LeaveRequestStatus) => {
    switch (status) {
        case 'Approved': return 'default';
        case 'Rejected': return 'destructive';
        case 'Cancelled': return 'outline';
        case 'Pending':
        default: return 'secondary';
    }
}

const getStatusClass = (status: LeaveRequestStatus) => {
    switch (status) {
        case 'Approved': return 'bg-green-100 text-green-800';
        case 'Rejected': return 'bg-red-100 text-red-800';
        case 'Cancelled': return 'bg-gray-100 text-gray-800';
        case 'Pending':
        default: return 'bg-yellow-100 text-yellow-800';
    }
}

const leaveTypes: LeaveType[] = ['Vacation', 'Sick Leave', 'Personal', 'Unpaid'];


export default function TimeOffPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    
    // --- Data Fetching ---
    const allUsers = React.useMemo(() => {
        const employeesAsContacts: Omit<Contact, 'createdAt' | 'company' | 'phone'>[] = initialEmployees;
        // In a real app, contacts would also be fetched from Firestore
        return Array.from(new Map([...initialContacts, ...employeesAsContacts].map(item => [item.id, item])).values());
    }, []);

    const myRequestsQuery = user ? query(collection(db, 'leaveRequests'), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc')) : null;
    const [myRequestsSnapshot, loadingMyRequests] = useCollection(myRequestsQuery);
    const myRequests: LeaveRequest[] = myRequestsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data(), dateRange: { from: doc.data().dateRange.from.toDate(), to: doc.data().dateRange.to.toDate() } } as LeaveRequest)) || [];

    const approvalsQuery = user ? query(collection(db, 'leaveRequests'), where('approverId', '==', user.uid), where('status', '==', 'Pending')) : null;
    const [approvalsSnapshot, loadingApprovals] = useCollection(approvalsQuery);
    const pendingMyApproval: LeaveRequest[] = approvalsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data(), dateRange: { from: doc.data().dateRange.from.toDate(), to: doc.data().dateRange.to.toDate() } } as LeaveRequest)) || [];

    const myBalanceQuery = user ? query(collection(db, 'leaveBalances'), where("ownerId", '==', user.uid)) : null;
    const [myBalanceSnapshot, loadingBalances] = useCollection(myBalanceQuery);
    const myBalance: LeaveBalance = myBalanceSnapshot?.docs[0]?.data() as LeaveBalance || { totalDays: 20, daysUsed: 0 };
    
    const [isRequestDialogOpen, setIsRequestDialogOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    
    // Form State
    const [leaveType, setLeaveType] = React.useState<LeaveType>('Vacation');
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
        from: new Date(),
        to: new Date(),
    });
    const [reason, setReason] = React.useState('');
    const [approverId, setApproverId] = React.useState<string>(initialEmployees.find(e => e.role === 'Regional Manager')?.id || '');

    const resetForm = () => {
        setLeaveType('Vacation');
        setDateRange({ from: new Date(), to: new Date() });
        setReason('');
    };

    const handleRequestSubmit = async () => {
        if (!dateRange?.from || !dateRange?.to || !approverId) {
            toast({ title: "Error", description: "Please fill out all fields.", variant: "destructive" });
            return;
        }
        if (!user) {
            toast({ title: "Authentication Error", description: 'You must be logged in to submit a request.', variant: 'destructive' });
            return;
        }
        
        const currentUserInfo = allUsers.find(u => u.id === user.uid);
        const balanceToUse = myBalance;
        const remainingDays = balanceToUse.totalDays - balanceToUse.daysUsed;
        const requestedDays = differenceInCalendarDays(dateRange.to, dateRange.from) + 1;

        if (leaveType !== 'Unpaid' && requestedDays > remainingDays) {
            toast({ title: "Insufficient Leave Balance", description: `You only have ${remainingDays} days remaining.`, variant: "destructive"});
            return;
        }
        
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'leaveRequests'), {
                employeeId: user.uid,
                employeeName: currentUserInfo?.name || user.email,
                leaveType,
                dateRange: { 
                    from: Timestamp.fromDate(dateRange.from), 
                    to: Timestamp.fromDate(dateRange.to) 
                },
                reason,
                status: 'Pending',
                approverId: approverId,
                ownerId: user.uid,
                createdAt: serverTimestamp()
            });
            toast({ title: "Request Submitted", description: `Your request has been sent for approval.` });
            setIsRequestDialogOpen(false);
            resetForm();
        } catch(error) {
             toast({ title: "Error", description: `Could not submit request.`, variant: 'destructive'});
             console.error("Error submitting leave request: ", error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleApprovalAction = async (request: LeaveRequest, newStatus: 'Approved' | 'Rejected') => {
        const requestRef = doc(db, 'leaveRequests', request.id!);

        if (newStatus === 'Approved' && request.leaveType !== 'Unpaid') {
            const requestedDays = differenceInCalendarDays(request.dateRange.to, request.dateRange.from) + 1;
            
            // This part is tricky without knowing the balance doc ID. We will query for it.
            const balanceQuery = query(collection(db, 'leaveBalances'), where("ownerId", '==', request.employeeId));
            const balanceSnapshot = await getDocs(balanceQuery);
            
            if (!balanceSnapshot.empty) {
                const balanceDoc = balanceSnapshot.docs[0];
                const balanceData = balanceDoc.data() as LeaveBalance;
                const newDaysUsed = balanceData.daysUsed + requestedDays;
                if(balanceData.totalDays >= newDaysUsed) {
                    await updateDoc(balanceDoc.ref, { daysUsed: newDaysUsed });
                } else {
                     toast({ title: 'Approval Failed', description: `${request.employeeName} has insufficient leave balance.`, variant: 'destructive'});
                    return;
                }
            } else {
                 toast({ title: 'Error', description: `Could not find leave balance for ${request.employeeName}.`, variant: 'destructive'});
                 return; // Stop if balance record doesn't exist.
            }
        }
        
        await updateDoc(requestRef, { status: newStatus });
        toast({ title: `Request ${newStatus}`, description: 'The leave request has been updated.' });
    };

    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <CalendarOff className="w-8 h-8 text-primary" />
                            <div>
                                <CardTitle>Time Off</CardTitle>
                                <CardDescription>Manage your leave requests and see team availability.</CardDescription>
                            </div>
                        </div>
                        <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Request Time Off
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Request Time Off</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="leave-type">Leave Type</Label>
                                         <Select value={leaveType} onValueChange={(value: LeaveType) => setLeaveType(value)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {leaveTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Date Range</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    id="date"
                                                    variant={"outline"}
                                                    className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {dateRange?.from ? (
                                                    dateRange.to ? (
                                                        <>
                                                        {format(dateRange.from, "LLL dd, y")} -{" "}
                                                        {format(dateRange.to, "LLL dd, y")}
                                                        </>
                                                    ) : (
                                                        format(dateRange.from, "LLL dd, y")
                                                    )
                                                    ) : (
                                                    <span>Pick a date range</span>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    initialFocus
                                                    mode="range"
                                                    defaultMonth={dateRange?.from}
                                                    selected={dateRange}
                                                    onSelect={setDateRange}
                                                    numberOfMonths={2}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="approver">Send To</Label>
                                        <Select value={approverId} onValueChange={setApproverId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select an approver..."/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {allUsers.filter(u => u.id !== user?.uid).map(u => <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reason">Reason (Optional)</Label>
                                        <Textarea id="reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="Briefly explain your request..." />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={handleRequestSubmit} disabled={isSubmitting}>{isSubmitting ? <Loader className="mr-2 h-4 w-4 animate-spin"/> : 'Submit Request'}</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Your Leave Balance</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-3">
                    <div className="p-4 rounded-lg bg-secondary text-center">
                        <p className="text-3xl font-bold">{myBalance.totalDays}</p>
                        <p className="text-sm text-muted-foreground">Total Days Allotted</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary text-center">
                        <p className="text-3xl font-bold">{myBalance.daysUsed}</p>
                        <p className="text-sm text-muted-foreground">Days Used</p>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/10 text-center">
                        <p className="text-3xl font-bold text-primary">{myBalance.totalDays - myBalance.daysUsed}</p>
                        <p className="text-sm text-primary">Days Remaining</p>
                    </div>
                </CardContent>
            </Card>
            
            <Tabs defaultValue="my-requests">
                <TabsList>
                    <TabsTrigger value="my-requests">My Requests</TabsTrigger>
                    <TabsTrigger value="approvals">
                        Approvals
                        {pendingMyApproval.length > 0 && <Badge className="ml-2">{pendingMyApproval.length}</Badge>}
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="my-requests">
                    <Card>
                        <CardHeader><CardTitle>My Request History</CardTitle></CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Date Range</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingMyRequests ? (
                                        <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader className="mx-auto animate-spin" /></TableCell></TableRow>
                                    ) : myRequests.map((req) => (
                                        <TableRow key={req.id}>
                                            <TableCell className="font-medium">{req.leaveType}</TableCell>
                                            <TableCell>{format(req.dateRange.from, 'PP')} - {format(req.dateRange.to, 'PP')}</TableCell>
                                            <TableCell className="text-muted-foreground">{req.reason || 'N/A'}</TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(req.status)} className={getStatusClass(req.status)}>{req.status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {!loadingMyRequests && myRequests.length === 0 && (
                                        <TableRow><TableCell colSpan={4} className="h-24 text-center">You have no leave requests.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="approvals">
                     <Card>
                        <CardHeader><CardTitle>Pending My Approval</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Date Range</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                     {loadingApprovals ? (
                                        <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader className="mx-auto animate-spin" /></TableCell></TableRow>
                                    ) : pendingMyApproval.map((req) => (
                                        <TableRow key={req.id}>
                                            <TableCell className="font-medium">{req.employeeName}</TableCell>
                                            <TableCell>{req.leaveType}</TableCell>
                                            <TableCell>{format(req.dateRange.from, 'PP')} - {format(req.dateRange.to, 'PP')}</TableCell>
                                            <TableCell className="text-muted-foreground">{req.reason || 'N/A'}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="outline" size="sm" onClick={() => handleApprovalAction(req, 'Rejected')}><XCircle className="mr-2 h-4 w-4" /> Reject</Button>
                                                <Button size="sm" onClick={() => handleApprovalAction(req, 'Approved')}><CheckCircle className="mr-2 h-4 w-4" /> Approve</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {!loadingApprovals && pendingMyApproval.length === 0 && (
                                        <TableRow><TableCell colSpan={5} className="h-24 text-center">No requests awaiting your approval.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
