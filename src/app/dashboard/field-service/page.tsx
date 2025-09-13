
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Wrench, PlusCircle, MoreHorizontal, Trash2, Edit, Loader } from "lucide-react";
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { useAuth } from '@/hooks/use-auth';
import type { Technician, Contact, Appointment } from '@/lib/mock-data';
import { initialTechnicians, initialContacts } from '@/lib/mock-data';
import { format } from 'date-fns';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
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
import { useToast } from '@/hooks/use-toast';
import { sendFeatureMessage } from '@/lib/sendFeatureMessage';
import useMyAppointments from '@/hooks/useMyAppointments';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';


const getStatusVariant = (status: Appointment['status']) => {
    switch (status) {
        case 'Scheduled': return 'default';
        case 'In Progress': return 'secondary';
        case 'Completed': return 'outline';
        case 'Pending':
        default: return 'destructive';
    }
};

const getStatusClass = (status: Appointment['status']) => {
    switch (status) {
        case 'Scheduled': return 'bg-blue-100 text-blue-800';
        case 'In Progress': return 'bg-yellow-100 text-yellow-800';
        case 'Completed': return 'bg-green-100 text-green-800';
        case 'Pending':
        default: return 'bg-gray-100 text-gray-800';
    }
}

const jobStatuses: Appointment['status'][] = ['Scheduled', 'In Progress', 'Completed', 'Pending'];


export default function FieldServicePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { appointments: jobs, loading, setAppointments: setJobs } = useMyAppointments();
    const [technicians] = React.useState<Technician[]>(initialTechnicians);
    const [contacts, setContacts] = React.useState<Contact[]>([]);
    const [date, setDate] = React.useState<Date | undefined>(new Date());
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);


    // Form state
    const [contactId, setContactId] = React.useState('');
    const [address, setAddress] = React.useState('');
    const [technicianId, setTechnicianId] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [time, setTime] = React.useState('10:00');
    
    const getStorageKey = React.useCallback(() => {
        if (!user) return null;
        return `bizflow-contacts-${user.uid}`;
    }, [user]);
    
    React.useEffect(() => {
        const contactsKey = getStorageKey();
        if(contactsKey) {
            try {
                const storedContacts = localStorage.getItem(contactsKey);
                setContacts(storedContacts ? JSON.parse(storedContacts) : initialContacts);
            } catch (error) {
                setContacts(initialContacts);
            }
        }
    }, [getStorageKey]);

    const resetForm = () => {
        setContactId('');
        setAddress('');
        setTechnicianId('');
        setDescription('');
        setTime('10:00');
    }

    const handleCreateJob = async () => {
        if (!contactId || !address || !technicianId || !date || !user) {
            toast({ title: 'Error', description: 'Please fill all fields.', variant: 'destructive'});
            return;
        }
        
        const customer = contacts.find(c => c.id === contactId);
        const technician = technicians.find(t => t.id === technicianId);

        if (!customer || !technician) {
            toast({ title: 'Error', description: 'Invalid customer or technician.', variant: 'destructive'});
            return;
        }
        
        setIsSubmitting(true);
        try {
            const newApptDocRef = await addDoc(collection(db, 'appointments'), {
                ownerId: user.uid,
                customerName: customer.name,
                staffName: technician.name,
                location: address,
                status: 'Scheduled',
                date: date.toISOString().split('T')[0],
                time: time,
                description: description,
                createdAt: serverTimestamp(),
            });

            toast({ title: 'Job Scheduled!', description: `Job for ${customer.name} has been created.`});

            const notificationMessage = `Service Scheduled: ${technician.name} is coming to ${address} on ${format(date, 'PPP')} at ${time}.`;
            sendFeatureMessage('Field Service', 'Contacts', notificationMessage, user.uid, customer.id, newApptDocRef.id)
                .catch((error) => {
                    console.error("Failed to send notification:", error);
                    toast({ title: 'Notification Error', description: 'Could not send message to contact.', variant: 'destructive' });
                });
                
            setIsDialogOpen(false);
            resetForm();
        } catch(error) {
             toast({ title: 'Error', description: 'Could not create job.', variant: 'destructive'});
             console.error("Error creating job: ", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteJob = async (jobId: string) => {
        try {
            await deleteDoc(doc(db, 'appointments', jobId));
            toast({ title: 'Success', description: 'Job has been deleted.'});
        } catch(error) {
            toast({ title: 'Error', description: 'Could not delete job.', variant: 'destructive'});
        }
    };

    const handleStatusChange = async (jobId: string, status: Appointment['status']) => {
        try {
            const jobRef = doc(db, 'appointments', jobId);
            await updateDoc(jobRef, { status: status });
            toast({ title: 'Success', description: 'Job status has been updated.'});
        } catch (error) {
            toast({ title: 'Error', description: 'Could not update job status.', variant: 'destructive'});
        }
    };


    const selectedDayJobs = jobs.filter(job => format(job.date, 'yyyy-MM-dd') === (date ? format(date, 'yyyy-MM-dd') : ''));

    return (
     <div className="flex flex-col gap-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                    <Wrench className="w-8 h-8 text-primary" />
                    <div>
                        <CardTitle>Field Service Management</CardTitle>
                        <CardDescription>Manage your field technicians, schedule appointments, and track jobs.</CardDescription>
                    </div>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                         <Button size="sm">
                            <PlusCircle className="mr-2 h-4 w-4" /> Schedule Job
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                         <DialogHeader>
                            <DialogTitle>Schedule a New Job</DialogTitle>
                            <DialogDescription>
                                Fill out the details to assign a new work order. This will also create an appointment.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="customer" className="text-right">Customer</Label>
                                <Select onValueChange={setContactId} value={contactId}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select a customer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="address" className="text-right">Address</Label>
                                <Input id="address" value={address} onChange={e => setAddress(e.target.value)} className="col-span-3" placeholder="e.g. 123 Main St" />
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="time" className="text-right">Time</Label>
                                <Input id="time" type="time" value={time} onChange={e => setTime(e.target.value)} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="technician" className="text-right">Technician</Label>
                                 <Select onValueChange={setTechnicianId} value={technicianId}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Assign a technician" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="description" className="text-right">Description</Label>
                                <Input id="description" value={description} onChange={e => setDescription(e.target.value)} className="col-span-3" placeholder="Brief job description" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateJob} disabled={isSubmitting}>{isSubmitting ? <Loader className="animate-spin mr-2" /> : 'Schedule Job'}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
        </Card>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>Job Scheduler</CardTitle>
                    <CardDescription>Select a date to view scheduled jobs.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex justify-center">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="rounded-md border"
                        />
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold mb-2">
                            Jobs for {date ? format(date, 'PPP') : 'Today'}
                        </h3>
                        <div className="space-y-2">
                            {loading ? <Loader className="animate-spin" /> : selectedDayJobs.length > 0 ? selectedDayJobs.map(job => (
                                <div key={job.id} className="p-3 rounded-md bg-secondary">
                                    <p className="font-semibold">{job.customerName}</p>
                                    <p className="text-sm text-muted-foreground">{job.location}</p>
                                    <p className="text-xs text-muted-foreground">Assigned to: {job.staffName}</p>
                                </div>
                            )) : (
                                <p className="text-sm text-muted-foreground pt-4">No jobs scheduled.</p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
         </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Work Orders</CardTitle>
                <CardDescription>An overview of all active and scheduled jobs.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Technician</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24"><Loader className="mx-auto animate-spin" /></TableCell>
                            </TableRow>
                        ) : jobs.map(job => (
                             <TableRow key={job.id}>
                                <TableCell className="font-medium">{format(job.date, 'PPP')}</TableCell>
                                <TableCell>{job.customerName}</TableCell>
                                <TableCell>{job.staffName}</TableCell>
                                <TableCell>{job.location}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusVariant(job.status)} className={getStatusClass(job.status)}>{job.status}</Badge>
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
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    <span>Change Status</span>
                                                </DropdownMenuSubTrigger>
                                                <DropdownMenuPortal>
                                                    <DropdownMenuSubContent>
                                                        {jobStatuses.map(status => (
                                                            <DropdownMenuItem key={status} onClick={() => handleStatusChange(job.id, status)}>
                                                                {status}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuPortal>
                                            </DropdownMenuSub>
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
                                                    This action cannot be undone. This will permanently delete this job record.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteJob(job.id)}>Continue</AlertDialogAction>
                                                </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                 </TableCell>
                             </TableRow>
                        ))}
                         {jobs.length === 0 && !loading && (
                             <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">No jobs found.</TableCell>
                            </TableRow>
                         )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );

