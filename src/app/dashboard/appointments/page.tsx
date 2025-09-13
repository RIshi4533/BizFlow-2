
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CalendarPlus, User, HardHat, MapPin, Loader } from "lucide-react";
import useMyAppointments from '@/hooks/useMyAppointments';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { type Appointment } from '@/lib/mock-data';


const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Scheduled': return 'default';
        case 'Completed': return 'secondary';
        case 'In Progress': return 'outline';
        case 'Pending':
        default: return 'destructive';
    }
};

const getStatusClass = (status: string) => {
    switch (status) {
        case 'Scheduled': return 'bg-blue-100 text-blue-800';
        case 'In Progress': return 'bg-yellow-100 text-yellow-800';
        case 'Completed': return 'bg-green-100 text-green-800';
        case 'Pending':
        default: return 'bg-gray-100 text-gray-800';
    }
}


export default function AppointmentsPage() {
  const { appointments, loading } = useMyAppointments();

  return (
     <div className="flex flex-col gap-6">
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <CalendarPlus className="w-8 h-8 text-primary" />
                <div>
                <CardTitle>Appointments</CardTitle>
                <CardDescription>Manage your upcoming bookings and schedules, including field service jobs.</CardDescription>
                </div>
            </CardHeader>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Customer/Description</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Staff</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    <Loader className="mx-auto animate-spin" />
                                </TableCell>
                            </TableRow>
                        ) : appointments.length > 0 ? (
                            appointments.map((appt: Appointment) => (
                                <TableRow key={appt.id}>
                                    <TableCell>
                                        <div className="font-medium">{format(appt.date, 'PPP')}</div>
                                        <div className="text-sm text-muted-foreground">{appt.time}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{appt.customerName || appt.description}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-muted-foreground" />
                                            <span>{appt.location}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                         <div className="flex items-center gap-2">
                                            <HardHat className="w-4 h-4 text-muted-foreground" />
                                            <span>{appt.staffName || 'Unassigned'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(appt.status)} className={getStatusClass(appt.status)}>{appt.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    No upcoming appointments.
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
