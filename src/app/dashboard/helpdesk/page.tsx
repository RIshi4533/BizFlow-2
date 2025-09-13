
'use client';

import * as React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, Filter, Sparkles, Loader, MoreHorizontal, Edit, Send, Save, Trash2 } from "lucide-react";
import { categorizeItem } from '@/app/ai-actions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { initialContacts, initialEmployees, type Contact } from '@/lib/mock-data';
import { Textarea } from '@/components/ui/textarea';
import { sendFeatureMessage } from '@/lib/sendFeatureMessage';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';


type TicketStatus = "Open" | "In Progress" | "Resolved";
type TicketPriority = "High" | "Medium" | "Low";

type Ticket = {
    id: string;
    subject: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    priority: TicketPriority;
    status: TicketStatus;
    lastUpdate: string;
    category: string;
    ownerId?: string;
    createdAt?: any;
};

const categories = ["Billing", "Technical Support", "Feature Request", "General Inquiry"];
const priorities: TicketPriority[] = ["High", "Medium", "Low"];
const statuses: TicketStatus[] = ["Open", "In Progress", "Resolved"];

const initialTicketState: Omit<Ticket, 'id' | 'lastUpdate'> = {
    subject: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    priority: 'Medium',
    status: 'Open',
    category: 'General Inquiry',
};

function SendTicketDialog({ open, onOpenChange, onSend, ticket, allUsers }: { open: boolean, onOpenChange: (open: boolean) => void, onSend: (recipientId: string, message: string) => void, ticket: Ticket | null, allUsers: Omit<Contact, 'createdAt' | 'company' | 'phone'>[] }) {
    const [recipientId, setRecipientId] = React.useState('');
    const [message, setMessage] = React.useState('');
    const { toast } = useToast();

    React.useEffect(() => {
        if (ticket) {
            setMessage(`FYI: Please take a look at ticket ${ticket.id?.substring(0,8) || ''} - "${ticket.subject}"`);
        }
    }, [ticket]);

    const handleSend = () => {
        if (!recipientId) {
            toast({ title: "Error", description: "Please select a recipient.", variant: "destructive" });
            return;
        }
        onSend(recipientId, message);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Send Ticket to a User</DialogTitle>
                    <DialogDescription>Select a user to notify them about ticket: {ticket?.id?.substring(0,8) || ''}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div>
                        <Label htmlFor="recipient">Recipient</Label>
                        <Select value={recipientId} onValueChange={setRecipientId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a user..."/>
                            </SelectTrigger>
                            <SelectContent>
                                {allUsers.map(u => (
                                    <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="message">Message (Optional)</Label>
                        <Textarea 
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                     <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                     <Button onClick={handleSend} disabled={!recipientId}>
                        <Send className="mr-2 h-4 w-4" /> Send Notification
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function HelpdeskPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    
    const ticketsQuery = user ? query(collection(db, 'tickets'), where('ownerId', '==', user.uid)) : null;
    const [ticketsSnapshot, loadingTickets] = useCollection(ticketsQuery);
    const tickets: Ticket[] = ticketsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() as any })) || [];

    const [isCategorizing, setIsCategorizing] = React.useState<string | null>(null);
    
    const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
    const [isEditing, setIsEditing] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isSendDialogOpen, setIsSendDialogOpen] = React.useState(false);

    const [currentTicket, setCurrentTicket] = React.useState<Ticket | null>(null);
    const [allUsers, setAllUsers] = React.useState<Omit<Contact, 'createdAt' | 'company' | 'phone'>[]>([]);
    
    const [filterPriority, setFilterPriority] = React.useState<string>('all');
    const [filterStatus, setFilterStatus] = React.useState<string>('all');

    const fetchAllUsers = React.useCallback(() => {
        if (!user) return;
        const employeesAsContacts: Omit<Contact, 'createdAt' | 'company' | 'phone'>[] = initialEmployees;
        const combined = [...initialContacts, ...employeesAsContacts];
        const uniqueUsers = Array.from(new Map(combined.map(item => [item.id, item])).values());
        setAllUsers(uniqueUsers);
    }, [user]);

    React.useEffect(() => {
        fetchAllUsers();
    }, [fetchAllUsers]);

    const handleAutoCategorize = async (ticketId: string, subject: string) => {
        setIsCategorizing(ticketId);
        try {
            const result = await categorizeItem({ text: subject, categories });
            await updateDoc(doc(db, 'tickets', ticketId), { category: result.category });
            toast({ title: "Success", description: `Ticket categorized as "${result.category}".` });
        } catch (error) {
            console.error("Categorization failed:", error);
            toast({ title: "Error", description: "The AI service is currently unavailable.", variant: "destructive" });
        } finally {
            setIsCategorizing(null);
        }
    };
    
    const resetForm = () => {
        setCurrentTicket(null);
        setIsEditing(false);
    };
    
    const handleOpenFormDialog = (ticket?: Ticket) => {
        if (ticket) {
            setCurrentTicket(ticket);
            setIsEditing(true);
        } else {
            setCurrentTicket(initialTicketState as Ticket); // Cast for form
            setIsEditing(false);
        }
        setIsFormDialogOpen(true);
    };

    const handleOpenSendDialog = (ticket: Ticket) => {
        setCurrentTicket(ticket);
        setIsSendDialogOpen(true);
    };
    
    const handleSubmitTicket = async () => {
        if (!currentTicket || !currentTicket.subject || !currentTicket.customerName) {
            toast({ title: 'Error', description: 'Subject and Customer Name are required.', variant: 'destructive'});
            return;
        }

        if (!user) {
             toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive'});
            return;
        }

        setIsSubmitting(true);
        const ticketData = {
            ...currentTicket,
            ownerId: user.uid,
            lastUpdate: new Date().toISOString(),
        };
        
        try {
            if (isEditing && currentTicket.id) {
                const docRef = doc(db, 'tickets', currentTicket.id);
                await updateDoc(docRef, ticketData);
                toast({ title: "Success", description: "Ticket details have been updated."});
            } else {
                await addDoc(collection(db, 'tickets'), {...ticketData, createdAt: serverTimestamp()});
                toast({ title: "Success", description: "New ticket created."});
            }
            setIsFormDialogOpen(false);
            resetForm();
        } catch(error) {
            console.error(error);
            toast({ title: "Error", description: "Could not save ticket.", variant: "destructive"});
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTicket = async (ticketId: string) => {
        try {
            await deleteDoc(doc(db, 'tickets', ticketId));
            toast({ title: "Success", description: "Ticket has been deleted." });
        } catch (error) {
            toast({ title: "Error", description: "Could not delete ticket.", variant: 'destructive' });
        }
    };

    const handleSendTicket = async (recipientId: string, message: string) => {
        if (!recipientId || !currentTicket || !user) {
            toast({ title: "Error", description: "No recipient or ticket selected.", variant: "destructive" });
            return;
        }
        
        const recipient = allUsers.find(u => u.id === recipientId);
        if (!recipient) return;
        
        try {
            await sendFeatureMessage('Helpdesk', 'Contacts', message, user.uid, recipientId, currentTicket.id);
            toast({ title: "Ticket Sent!", description: `A notification has been sent to ${recipient.name}.` });
            setIsSendDialogOpen(false);
        } catch (error) {
            toast({ title: "Error", description: "Could not send notification.", variant: "destructive" });
        }
    };
    
    const filteredTickets = tickets.filter(ticket => {
        const priorityMatch = filterPriority === 'all' || ticket.priority === filterPriority;
        const statusMatch = filterStatus === 'all' || ticket.status === filterStatus;
        return priorityMatch && statusMatch;
    });

    const getPriorityVariant = (priority: string) => {
        switch (priority) {
            case 'High': return 'destructive';
            case 'Medium': return 'secondary';
            case 'Low': return 'outline';
            default: return 'default';
        }
    }

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'Open': return 'bg-blue-100 text-blue-800';
            case 'In Progress': return 'bg-yellow-100 text-yellow-800';
            case 'Resolved': return 'bg-green-100 text-green-800';
            default: return '';
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Helpdesk</CardTitle>
                            <CardDescription>Provide exceptional customer support.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                             <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-1">
                                        <Filter className="h-4 w-4" />
                                        Filter
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>Filter Tickets</DialogTitle></DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Priority</Label>
                                            <Select value={filterPriority} onValueChange={setFilterPriority}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All</SelectItem>
                                                    {priorities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                         <div className="space-y-2">
                                            <Label>Status</Label>
                                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                     <SelectItem value="all">All</SelectItem>
                                                    {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                            <Button size="sm" className="gap-1" onClick={() => handleOpenFormDialog()}>
                                <PlusCircle className="h-4 w-4" />
                                New Ticket
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Subject</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {loadingTickets && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24">
                                        <Loader className="w-8 h-8 animate-spin text-primary mx-auto" />
                                    </TableCell>
                                </TableRow>
                            )}
                            {filteredTickets.map((ticket) => (
                            <TableRow key={ticket.id} className="transition-colors hover:bg-muted/50">
                                <TableCell className="font-medium">{ticket.subject}</TableCell>
                                <TableCell>{ticket.customerName}</TableCell>
                                <TableCell>
                                    <a href={`mailto:${ticket.customerEmail}`} className="text-muted-foreground hover:text-primary transition-colors">
                                        {ticket.customerEmail}
                                    </a>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{ticket.category}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getPriorityVariant(ticket.priority) as any}>{ticket.priority}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge className={getStatusClass(ticket.status)}>{ticket.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Toggle menu</span>
                                        </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleOpenFormDialog(ticket)}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit Ticket
                                            </DropdownMenuItem>
                                             <DropdownMenuItem onClick={() => handleOpenSendDialog(ticket)}>
                                                <Send className="mr-2 h-4 w-4" /> Send to User
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleAutoCategorize(ticket.id, ticket.subject)} disabled={isCategorizing === ticket.id}>
                                                {isCategorizing === ticket.id ? (
                                                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Sparkles className="mr-2 h-4 w-4 text-primary" />
                                                )}
                                                Categorize with AI
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete Ticket
                                                    </DropdownMenuItem>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>This will permanently delete the ticket.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteTicket(ticket.id)}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                            ))}
                             {!loadingTickets && filteredTickets.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                        No tickets found that match your filters.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit Ticket' : 'Create New Ticket'}</DialogTitle>
                        <DialogDescription>{isEditing ? `Update details for ticket #${currentTicket?.id.substring(0,8)}` : 'Enter customer and issue details.'}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input id="subject" value={currentTicket?.subject} onChange={(e) => setCurrentTicket({...currentTicket, subject: e.target.value} as Ticket)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="customerName">Customer Name</Label>
                                <Input id="customerName" value={currentTicket?.customerName} onChange={(e) => setCurrentTicket({...currentTicket, customerName: e.target.value} as Ticket)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="customerEmail">Customer Email</Label>
                                <Input id="customerEmail" type="email" value={currentTicket?.customerEmail} onChange={(e) => setCurrentTicket({...currentTicket, customerEmail: e.target.value} as Ticket)} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Priority</Label>
                                <Select value={currentTicket?.priority} onValueChange={(value: TicketPriority) => setCurrentTicket({...currentTicket, priority: value} as Ticket)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{priorities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={currentTicket?.status} onValueChange={(value: TicketStatus) => setCurrentTicket({...currentTicket, status: value} as Ticket)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFormDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmitTicket} disabled={isSubmitting}>
                            {isSubmitting ? <Loader className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                            {isEditing ? 'Save Changes' : 'Create Ticket'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <SendTicketDialog 
                open={isSendDialogOpen} 
                onOpenChange={setIsSendDialogOpen}
                onSend={handleSendTicket}
                ticket={currentTicket}
                allUsers={allUsers}
            />

        </div>
    );
}
