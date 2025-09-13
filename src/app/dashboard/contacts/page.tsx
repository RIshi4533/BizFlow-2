
'use client';

import * as React from 'react';
import { PlusCircle, MoreHorizontal, Trash2, Edit, Loader, Bell, User, Wrench, PenSquare, LifeBuoy, TrendingUp, Send } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useToast } from '@/hooks/use-toast';
import useFeatureMessages from '@/hooks/useFeatureMessages';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { type Contact, initialEmployees, type Employee } from '@/lib/mock-data';
import { useAuth } from '@/hooks/use-auth';
import { sendFeatureMessage } from '@/lib/sendFeatureMessage';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '@/lib/firebase';
import { collection, query, where, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';


function SendContactDialog({ open, onOpenChange, onSend, contact, allUsers }: { open: boolean, onOpenChange: (open: boolean) => void, onSend: (recipientId: string, message: string) => void, contact: Contact | null, allUsers: (Contact | Employee)[] }) {
    const [recipientId, setRecipientId] = React.useState('');
    const [message, setMessage] = React.useState('');
    const { toast } = useToast();

    React.useEffect(() => {
        if (contact) {
            setMessage(`FYI: Please take a look at contact ${contact.name} (${contact.company}).`);
        }
    }, [contact]);

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
                    <DialogTitle>Send Contact to a User</DialogTitle>
                    <DialogDescription>Select a user to notify them about: {contact?.name}</DialogDescription>
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

export default function ContactsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const contactsQuery = user ? query(collection(db, 'contacts'), where('ownerId', '==', user.uid)) : null;
  const [contactsSnapshot, isLoading] = useCollection(contactsQuery);
  const contacts: Contact[] = contactsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() as any })) || [];

  const [open, setOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [currentContact, setCurrentContact] = React.useState<Contact | null>(null);
  const [isSendDialogOpen, setIsSendDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [company, setCompany] = React.useState('');

  const messages = useFeatureMessages('Contacts');
  
  const allUsers = React.useMemo(() => {
    const employeesAsContacts: Employee[] = initialEmployees;
    const combined = [...contacts, ...employeesAsContacts];
    return Array.from(new Map(combined.map(item => [item.id, item])).values());
  }, [contacts]);


  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setCurrentContact(null);
    setIsEditing(false);
    setOpen(false);
  };

  const handleOpenDialog = (contact?: Contact) => {
    if (contact) {
      setIsEditing(true);
      setCurrentContact(contact);
      setName(contact.name);
      setEmail(contact.email);
      setPhone(contact.phone);
      setCompany(contact.company);
    } else {
      setIsEditing(false);
      setCurrentContact(null);
      setName('');
      setEmail('');
      setPhone('');
      setCompany('');
    }
    setOpen(true);
  };

  const handleOpenSendDialog = (contact: Contact) => {
    setCurrentContact(contact);
    setIsSendDialogOpen(true);
  };
  
  const handleSubmit = async () => {
    if (!name || !email) {
      toast({ title: 'Error', description: 'Name and email are required.', variant: 'destructive'});
      return;
    }

    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to save a contact.', variant: 'destructive'});
      return;
    }

    setIsSubmitting(true);
    const contactData = { name, email, phone, company, ownerId: user.uid, createdAt: serverTimestamp() };

    try {
      if (isEditing && currentContact) {
        const docRef = doc(db, 'contacts', currentContact.id);
        await updateDoc(docRef, contactData);
        toast({ title: 'Success!', description: 'Contact has been updated.' });
      } else {
        await addDoc(collection(db, 'contacts'), contactData);
        toast({ title: 'Success!', description: 'Contact has been added.' });
      }
      resetForm();
    } catch(error) {
       toast({ title: 'Error', description: 'Could not save contact.', variant: 'destructive'});
       console.error("Failed to save contact: ", error);
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleDeleteContact = async (contactId: string) => {
    try {
      await deleteDoc(doc(db, 'contacts', contactId));
      toast({ title: 'Success', description: 'Contact deleted.' });
    } catch(error) {
        toast({ title: 'Error', description: 'Could not delete contact.', variant: 'destructive'});
    }
  };
  
  const handleSendContact = async (recipientId: string, message: string) => {
    if (!recipientId || !currentContact || !user) {
        toast({ title: "Error", description: "No recipient or contact selected.", variant: "destructive" });
        return;
    }
    
    const recipient = allUsers.find(u => u.id === recipientId);
    if (!recipient) return;
    
    try {
        await sendFeatureMessage('Contacts', 'Contacts', message, user.uid, recipientId, currentContact.id);
        toast({ title: "Contact Info Sent!", description: `A notification has been sent to ${recipient.name}.` });
        setIsSendDialogOpen(false);
    } catch (error) {
        toast({ title: "Error", description: "Could not send notification.", variant: "destructive" });
    }
  };

  const getNotificationIcon = (fromFeature: string) => {
    switch (fromFeature) {
        case 'Field Service': return Wrench;
        case 'Sign': return PenSquare;
        case 'Helpdesk': return LifeBuoy;
        case 'Sales': return TrendingUp;
        default: return User;
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
            <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Contacts</CardTitle>
                    <CardDescription>Centralize your address book seamlessly.</CardDescription>
                </div>
                <Button size="sm" className="gap-1" onClick={() => handleOpenDialog()}>
                    <PlusCircle className="h-4 w-4" />
                    Add Contact
                </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader className="w-8 h-8 animate-spin" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contacts.map((contact) => (
                            <TableRow key={contact.id}>
                                <TableCell className="font-medium">{contact.name}</TableCell>
                                <TableCell>{contact.company}</TableCell>
                                <TableCell>{contact.email}</TableCell>
                                <TableCell>{contact.phone}</TableCell>
                                <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Toggle menu</span>
                                    </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleOpenDialog(contact)}>
                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                     <DropdownMenuItem onClick={() => handleOpenSendDialog(contact)}>
                                        <Send className="mr-2 h-4 w-4" /> Send to User
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the contact.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteContact(contact.id)}>Continue</AlertDialogAction>
                                        </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                </TableCell>
                            </TableRow>
                            ))}
                            {contacts.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No contacts found. Add one to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
                        <DialogDescription>
                        {isEditing ? "Update the details for this contact." : "Enter the details of your new contact below."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="John Doe" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                            Email
                        </Label>
                        <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" placeholder="john.doe@example.com" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">
                            Phone
                        </Label>
                        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-3" placeholder="123-456-7890" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="company" className="text-right">
                            Company
                        </Label>
                        <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} className="col-span-3" placeholder="Acme Inc." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={resetForm}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? <Loader className="mr-2 h-4 w-4 animate-spin"/> : (isEditing ? 'Save Changes' : 'Save Contact')}</Button>
                    </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
            </Card>
        </div>
        <div className="xl:col-span-1">
             <Card>
                <CardHeader>
                    <CardTitle>Recent Notifications</CardTitle>
                    <CardDescription>
                        Updates from other modules.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                            <Bell className="mx-auto h-8 w-8" />
                            <p className="mt-2">No notifications yet.</p>
                        </div>
                    )}
                    {messages.map((msg: any) => {
                        const sender = allUsers.find(c => c.id === msg.from);
                        const timeAgo = msg.timestamp ? formatDistanceToNow(new Date(msg.timestamp.seconds * 1000), { addSuffix: true }) : 'Just now';
                        
                        const Icon = getNotificationIcon(msg.fromFeature);

                        return (
                        <div key={msg.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                             <Avatar className="h-10 w-10 border">
                                <AvatarFallback>
                                    <Icon className="w-5 h-5" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="text-sm font-medium">From: {sender?.name || msg.from || 'Unknown User'}</p>
                                <p className="text-sm text-muted-foreground">{msg.message}</p>
                                <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
                            </div>
                        </div>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
        <SendContactDialog
            open={isSendDialogOpen}
            onOpenChange={setIsSendDialogOpen}
            onSend={handleSendContact}
            contact={currentContact}
            allUsers={allUsers}
        />
    </div>
  );
}
