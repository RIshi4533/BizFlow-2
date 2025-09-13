
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Play, Square, PlusCircle, Trash2, Loader } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { type Task } from '@/lib/mock-data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '@/lib/firebase';
import { collection, query, where, doc, addDoc, serverTimestamp, orderBy, deleteDoc } from 'firebase/firestore';


type TimeLog = {
    id: string;
    taskId: string;
    taskTitle: string;
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
    userId: string;
};

export default function TimesheetsPage() {
    const { user } = useAuth();
    const { toast } = useToast();

    const tasksQuery = user ? query(collection(db, 'tasks'), where('ownerId', '==', user.uid)) : null;
    const [tasksSnapshot] = useCollection(tasksQuery);
    const tasks: Task[] = tasksSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() as any })) || [];
    
    const timeLogsQuery = user ? query(collection(db, 'timeLogs'), where('userId', '==', user.uid), orderBy('startTime', 'desc')) : null;
    const [timeLogsSnapshot, loadingLogs] = useCollection(timeLogsQuery);
    const timeLogs: TimeLog[] = timeLogsSnapshot?.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            startTime: data.startTime.toDate(),
            endTime: data.endTime.toDate(),
        } as TimeLog
    }) || [];

    const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
    
    const [timer, setTimer] = React.useState<NodeJS.Timeout | null>(null);
    const [startTime, setStartTime] = React.useState<Date | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
    
    const getTimerStorageKey = React.useCallback(() => {
        return user ? `bizflow-timer-${user.uid}` : null;
    }, [user]);

    // Check for and resume a running timer on mount
    React.useEffect(() => {
        const timerStorageKey = getTimerStorageKey();
        if (!timerStorageKey) return;
        
        const storedTimerData = localStorage.getItem(timerStorageKey);
        if (storedTimerData) {
            const { startTime: storedStartTimeStr, taskId } = JSON.parse(storedTimerData);
            const storedStartTime = new Date(storedStartTimeStr);
            
            setStartTime(storedStartTime);
            setSelectedTaskId(taskId);
            
            const elapsed = Math.floor((new Date().getTime() - storedStartTime.getTime()) / 1000);
            setElapsedSeconds(elapsed);
            
            const newTimer = setInterval(() => {
                setElapsedSeconds(prev => prev + 1);
            }, 1000);
            setTimer(newTimer);
        }
    }, [getTimerStorageKey]);
    

    const startTimer = () => {
        if (!selectedTaskId) {
            toast({ title: 'Error', description: 'Please select a task first.', variant: 'destructive'});
            return;
        }

        const now = new Date();
        setStartTime(now);
        setElapsedSeconds(0);
        
        const timerStorageKey = getTimerStorageKey();
        if (timerStorageKey) {
            localStorage.setItem(timerStorageKey, JSON.stringify({ startTime: now.toISOString(), taskId: selectedTaskId }));
        }

        const newTimer = setInterval(() => {
            setElapsedSeconds(prev => prev + 1);
        }, 1000);
        setTimer(newTimer);
    };

    const stopTimer = React.useCallback(async () => {
        if (timer) {
            clearInterval(timer);
        }
        
        const timerStorageKey = getTimerStorageKey();
        if (timerStorageKey) {
            localStorage.removeItem(timerStorageKey);
        }

        if (startTime && user) {
            const endTime = new Date();
            const durationMs = endTime.getTime() - startTime.getTime();
            const durationMinutes = Math.floor(durationMs / 60000);
            
            const selectedTask = tasks.find(t => t.id === selectedTaskId);

            if (durationMinutes >= 1 && selectedTask) {
                const newLog = {
                    taskId: selectedTaskId!,
                    taskTitle: selectedTask.title,
                    startTime,
                    endTime,
                    durationMinutes,
                    userId: user.uid,
                };
                
                try {
                    await addDoc(collection(db, 'timeLogs'), newLog);
                    toast({ title: 'Success', description: `Logged ${durationMinutes} minute(s) for ${selectedTask.title}.`});
                } catch(error) {
                    toast({ title: 'Error', description: 'Failed to save time log.', variant: 'destructive' });
                }
            } else if (durationMinutes < 1) {
                 toast({ title: 'Time log too short', description: 'Timer must run for at least 1 minute to be logged.', variant: 'destructive'});
            }
        }
        setTimer(null);
        setStartTime(null);
        setElapsedSeconds(0);
        setSelectedTaskId(null);
    }, [timer, startTime, tasks, selectedTaskId, getTimerStorageKey, toast, user]);

    const handleDeleteLog = async (logId: string) => {
        try {
            await deleteDoc(doc(db, 'timeLogs', logId));
            toast({ title: 'Log Deleted', description: 'The time entry has been removed.'});
        } catch(error) {
             toast({ title: 'Error', description: 'Could not delete time log.', variant: 'destructive' });
        }
    };
    
    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

  return (
     <div className="flex flex-col gap-6">
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <Clock className="w-8 h-8 text-primary" />
                <div>
                    <CardTitle>Timesheets</CardTitle>
                    <CardDescription>Track employee time on projects and tasks.</CardDescription>
                </div>
            </CardHeader>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Time Tracker</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 w-full">
                    <Select value={selectedTaskId || ''} onValueChange={setSelectedTaskId} disabled={!!timer}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a task to track..." />
                        </SelectTrigger>
                        <SelectContent>
                            {tasks.map(task => (
                                <SelectItem key={task.id} value={task.id}>{task.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="text-4xl font-mono font-bold text-center w-48 shrink-0">
                    {formatTime(elapsedSeconds)}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="lg" onClick={startTimer} disabled={!!timer}>
                        <Play className="mr-2 h-5 w-5" /> Start
                    </Button>
                     <Button variant="destructive" size="lg" onClick={stopTimer} disabled={!timer}>
                        <Square className="mr-2 h-5 w-5" /> Stop
                    </Button>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Recent Time Logs</CardTitle>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Task</TableHead>
                            <TableHead>Start Time</TableHead>
                            <TableHead>End Time</TableHead>
                            <TableHead className="text-right">Duration (minutes)</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {loadingLogs ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24"><Loader className="mx-auto animate-spin" /></TableCell>
                            </TableRow>
                         ) : timeLogs.map(log => (
                            <TableRow key={log.id}>
                                <TableCell className="font-medium">{log.taskTitle}</TableCell>
                                <TableCell>{log.startTime.toLocaleTimeString()}</TableCell>
                                <TableCell>{log.endTime.toLocaleTimeString()}</TableCell>
                                <TableCell className="text-right">{log.durationMinutes}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteLog(log.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                         {timeLogs.length === 0 && !loadingLogs && (
                             <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    No time logged yet. Start a timer to begin.
                                </TableCell>
                            </TableRow>
                         )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
