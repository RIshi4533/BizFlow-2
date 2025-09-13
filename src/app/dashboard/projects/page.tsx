
'use client';

import * as React from 'react';
import { PlusCircle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
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
import { type Task, type TaskStatus } from '@/lib/mock-data';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, addDoc, doc, updateDoc, deleteDoc, query, where, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';


const statusColumns: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'inprogress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

export default function ProjectsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const tasksQuery = user ? query(collection(db, 'tasks'), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc')) : null;
  const [tasksSnapshot, loadingTasks] = useCollection(tasksQuery);

  const tasks: Task[] = tasksSnapshot ? tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)) : [];

  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [status, setStatus] = React.useState<TaskStatus>('todo');


  const handleAddTask = async () => {
    if (!title) {
        toast({ title: 'Error', description: 'Title is required.', variant: 'destructive' });
        return;
    };
    if (!user) {
      toast({ title: 'Authentication Error', description: 'You must be logged in to add a task.', variant: 'destructive' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const newTask = {
        title,
        description,
        status,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'tasks'), newTask);
      toast({ title: 'Success!', description: 'New task added.'});
      setTitle('');
      setDescription('');
      setStatus('todo');
      setOpen(false);
    } catch(e) {
        toast({ title: 'Error', description: 'Could not add task.', variant: 'destructive'});
        console.error("Error adding task: ", e);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Project Management</h1>
          <p className="text-muted-foreground">Manage tasks and collaborate with your team.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
 
            <DialogHeader>
              <DialogTitle>Add a New Task</DialogTitle>
              <DialogDescription>
                Fill in the details for your new task.
              </DialogDescription>
            </DialogHeader>
 
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" placeholder="e.g. Design new logo" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" placeholder="Task details...\" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                 <Select onValueChange={(value: TaskStatus) => setStatus(value)} defaultValue={status}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusColumns.map((col) => (
                       <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
 
            <DialogFooter>
              <Button onClick={handleAddTask} disabled={isSubmitting}>{isSubmitting ? <Loader className="mr-2 h-4 w-4 animate-spin"/> : 'Add Task'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid flex-1 grid-cols-1 gap-8 md:grid-cols-3">
        {statusColumns.map((column) => (
          <div
            key={column.id}
            className="p-4 rounded-lg flex flex-col bg-secondary/50"
          >
            <h2 className="mb-4 text-lg font-semibold tracking-tight">{column.title}</h2>
            <div className="space-y-4 flex-1 min-h-[100px]">
              {tasks
                .filter((task) => task.status === column.id)
                .map((task, index) => (
                  <Card key={task.id} className="bg-background">
                    <CardHeader>
                      <CardTitle className="text-base">{task.title}</CardTitle>
                      <CardDescription>{task.description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              {tasks.filter((task) => task.status === column.id).length === 0 && (
                 <div className="flex items-center justify-center h-full">
                    {loadingTasks ? <Loader className="mx-auto animate-spin" /> : <p className="text-sm text-center text-muted-foreground">No tasks here.</p>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
