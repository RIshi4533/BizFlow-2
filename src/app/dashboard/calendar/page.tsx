
'use client';

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, PlusCircle, Video, User } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "@/lib/firebase";
import { collection, query, where, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";


type Event = {
    id: string;
    date: Date;
    time: string;
    title: string;
    type: "meeting" | "personal";
    attendees: string;
    ownerId: string;
};

export default function CalendarPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const eventsQuery = user ? query(collection(db, 'events'), where('ownerId', '==', user.uid)) : null;
  const [eventsSnapshot, loadingEvents] = useCollection(eventsQuery);
  const events: Event[] = eventsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data(), date: new Date(doc.data().date) } as Event)) || [];

  const [date, setDate] = React.useState<Date | undefined>(new Date());
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [newEventTitle, setNewEventTitle] = React.useState('');
  const [newEventTime, setNewEventTime] = React.useState('10:00');
  const [newEventAttendees, setNewEventAttendees] = React.useState('');
  const [newEventType, setNewEventType] = React.useState<'meeting' | 'personal'>('meeting');

  const resetForm = () => {
    setNewEventTitle('');
    setNewEventTime('10:00');
    setNewEventAttendees('');
    setNewEventType('meeting');
    setIsDialogOpen(false);
  };

  const handleCreateEvent = async () => {
    if (!newEventTitle || !newEventTime || !date || !user) {
        toast({ title: "Error", description: "Please fill out all fields.", variant: 'destructive' });
        return;
    }
    const newEventData = {
      date: date.toISOString(),
      title: newEventTitle,
      time: newEventTime,
      type: newEventType,
      attendees: newEventAttendees,
      ownerId: user.uid
    };
    
    try {
        await addDoc(collection(db, 'events'), newEventData);
        toast({ title: 'Success!', description: 'Event has been created.' });
        resetForm();
    } catch(error) {
        console.error("Error creating event: ", error);
        toast({ title: 'Error', description: 'Could not create event.', variant: 'destructive' });
    }
  };

  const selectedDayEvents = date ? events.filter(event => 
    event.date.getDate() === date.getDate() &&
    event.date.getMonth() === date.getMonth() &&
    event.date.getFullYear() === date.getFullYear()
  ) : [];

  return (
    <div className="flex flex-col gap-6">
       <Card>
          <CardHeader>
             <div className="flex items-center justify-between">
                <div>
                   <CardTitle>Calendar</CardTitle>
                   <CardDescription>Organize schedules and company events.</CardDescription>
                </div>
                 <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-1">
                           <PlusCircle className="h-4 w-4" />
                           Create Event
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create a New Event</DialogTitle>
                            <DialogDescription>
                                Fill out the details below to add a new event to your calendar. The date is pre-filled based on your selection.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="title" className="text-right">Title</Label>
                                <Input id="title" value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} className="col-span-3" placeholder="e.g. Team Meeting" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="time" className="text-right">Time</Label>
                                <Input id="time" type="time" value={newEventTime} onChange={(e) => setNewEventTime(e.target.value)} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="attendees" className="text-right">Attendees</Label>
                                <Input id="attendees" value={newEventAttendees} onChange={(e) => setNewEventAttendees(e.target.value)} className="col-span-3" placeholder="e.g. Sales Team" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="type" className="text-right">Type</Label>
                                <Select onValueChange={(value: 'meeting' | 'personal') => setNewEventType(value)} defaultValue={newEventType}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="meeting">Meeting</SelectItem>
                                        <SelectItem value="personal">Personal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={resetForm}>Cancel</Button>
                            <Button onClick={handleCreateEvent}>Save Event</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
             </div>
          </CardHeader>
       </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
                <Card>
                    <CardContent className="p-2 md:p-6 flex flex-col md:flex-row gap-6">
                       <div className="flex-shrink-0 mx-auto">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                className="rounded-md border"
                            />
                       </div>
                       <div className="flex-1">
                           <h3 className="text-lg font-semibold">
                             Events for {date ? date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Today'}
                           </h3>
                           <ul className="mt-4 space-y-4">
                               {selectedDayEvents.length > 0 ? selectedDayEvents.map(event => (
                                <li key={event.id} className="flex items-center gap-4 p-3 rounded-md bg-secondary">
                                    <div className="w-20 text-sm font-semibold text-primary">{event.time}</div>
                                    <div className="flex-1">
                                        <p className="font-medium">{event.title}</p>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            {event.type === 'meeting' ? <Video className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                            <span>{event.attendees}</span>
                                        </div>
                                    </div>
                                </li>
                               )) : (
                                <p className="text-sm text-muted-foreground text-center py-8">{loadingEvents ? "Loading..." : "No events scheduled for this day."}</p>
                               )}
                           </ul>
                       </div>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1">
                 <Card>
                    <CardHeader>
                        <CardTitle>Upcoming</CardTitle>
                        <CardDescription>A look at the week ahead.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-3 rounded-md bg-secondary">
                            <p className="font-semibold">Tomorrow</p>
                            <p className="text-sm text-muted-foreground">Team-wide sync</p>
                        </div>
                         <div className="p-3 rounded-md bg-secondary">
                            <p className="font-semibold">Friday</p>
                            <p className="text-sm text-muted-foreground">Project Alpha Deadline</p>
                        </div>
                         <div className="p-3 rounded-md bg-secondary">
                            <p className="font-semibold">Next Monday</p>
                            <p className="text-sm text-muted-foreground">Q4 Kick-off</p>
                        </div>
                    </CardContent>
                 </Card>
            </div>
        </div>
    </div>
  );
}
