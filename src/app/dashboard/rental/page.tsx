
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { cn } from "@/lib/utils";
import { addDays, format, isAfter } from "date-fns";
import { DateRange } from "react-day-picker";
import { Car, Package, PackageCheck, AlertTriangle, PlusCircle, Calendar as CalendarIcon, PackageOpen, Camera, RefreshCcw, AlertCircle, FileText, Star, Settings, Loader } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { type RentalBooking, type RentalLog, type InventoryItem, type Contact, initialEmployees } from '@/lib/mock-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sendFeatureMessage } from '@/lib/sendFeatureMessage';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '@/lib/firebase';
import { collection, query, where, doc, setDoc, addDoc, serverTimestamp, Timestamp, orderBy } from 'firebase/firestore';


export default function RentalPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    
    const bookingsQuery = user ? query(collection(db, 'bookings'), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc')) : null;
    const [bookingsSnapshot, loadingBookings] = useCollection(bookingsQuery);
    const bookings: RentalBooking[] = React.useMemo(() => 
        bookingsSnapshot?.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                dateRange: { from: data.dateRange.from.toDate(), to: data.dateRange.to.toDate() },
                logs: data.logs ? data.logs.map((l: any) => ({...l, timestamp: new Date(l.timestamp)})) : [],
            } as RentalBooking;
        }) || [], 
    [bookingsSnapshot]);

    const contactsQuery = user ? query(collection(db, 'contacts'), where('ownerId', '==', user.uid)) : null;
    const [contactsSnapshot] = useCollection(contactsQuery);
    const contacts: Contact[] = contactsSnapshot?.docs.map(d => ({id: d.id, ...d.data()} as Contact)) || [];

    const inventoryQuery = user ? query(collection(db, 'inventory'), where('ownerId', '==', user.uid)) : null;
    const [inventorySnapshot] = useCollection(inventoryQuery);
    const rentalItems: InventoryItem[] = inventorySnapshot?.docs.map(d => ({id: d.id, ...d.data()} as InventoryItem)) || [];
    
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());

    const [isNewBookingDialogOpen, setIsNewBookingDialogOpen] = React.useState(false);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false);
    const [isCameraDialogOpen, setIsCameraDialogOpen] = React.useState(false);
    const [isAgreementDialogOpen, setIsAgreementDialogOpen] = React.useState(false);
    
    const [selectedBooking, setSelectedBooking] = React.useState<RentalBooking | null>(null);
    const [logType, setLogType] = React.useState<'check-in' | 'check-out'>('check-in');

    const [newItemId, setNewItemId] = React.useState('');
    const [newCustomerId, setNewCustomerId] = React.useState('');
    const [newDateRange, setNewDateRange] = React.useState<DateRange | undefined>({
        from: new Date(),
        to: addDays(new Date(), 4),
    });

    const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
    const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
    const [conditionNotes, setConditionNotes] = React.useState('');
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    const resetNewBookingForm = () => {
        setNewItemId('');
        setNewCustomerId('');
        setNewDateRange({ from: new Date(), to: addDays(new Date(), 4) });
    };

    const handleCreateBooking = async () => {
        if (!newItemId || !newCustomerId || !newDateRange?.from || !newDateRange?.to) {
            toast({ title: 'Error', description: 'Please fill out all fields.', variant: 'destructive' });
            return;
        }
        if (!user) {
            toast({ title: 'Authentication Error', description: 'You must be logged in.', variant: 'destructive' });
            return;
        }

        const selectedItem = rentalItems.find(item => item.id === newItemId);
        const customer = contacts.find(c => c.id === newCustomerId);

        if (!selectedItem || !customer) {
            toast({ title: 'Error', description: 'Invalid item or customer selected.', variant: 'destructive' });
            return;
        }
        
        try {
            const newDoc = await addDoc(collection(db, 'bookings'), {
                itemId: newItemId,
                itemName: selectedItem.name,
                ownerId: user.uid,
                customerId: newCustomerId,
                customerName: customer.name,
                customerScore: 5,
                dateRange: { 
                    from: Timestamp.fromDate(newDateRange.from), 
                    to: Timestamp.fromDate(newDateRange.to) 
                },
                status: 'booked',
                logs: [],
                createdAt: serverTimestamp(),
            });

            toast({ title: 'Success!', description: `${selectedItem.name} has been booked for ${customer.name}.` });
            
            const message = `Your booking for ${selectedItem.name} from ${format(newDateRange.from, 'PPP')} to ${format(newDateRange.to, 'PPP')} is confirmed.`;
            await sendFeatureMessage('Rental', 'Contacts', message, user.uid, newCustomerId, newDoc.id);
            
            setIsNewBookingDialogOpen(false);
            resetNewBookingForm();
        } catch (error) {
             toast({ title: 'Error', description: 'Could not create booking.', variant: 'destructive' });
             console.error("Booking creation failed:", error);
        }
    };
    
     const handleOpenDetailsDialog = (booking: RentalBooking) => {
        setSelectedBooking(booking);
        setIsDetailsDialogOpen(true);
    };

    const handleOpenCameraDialog = (type: 'check-in' | 'check-out') => {
        setLogType(type);
        setCapturedImage(null);
        setHasCameraPermission(null);
        setConditionNotes('');
        setIsCameraDialogOpen(true);
    };

    React.useEffect(() => {
    let stream: MediaStream | null = null;
    const getCameraPermission = async () => {
      if (!isCameraDialogOpen) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({video: true});
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
        });
      }
      if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
      }
    };
  }, [isCameraDialogOpen, toast]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const dataUrl = canvas.toDataURL('image/png');
                setCapturedImage(dataUrl);
            }
        }
    };
  
    const handleSaveLog = async () => {
        if (!selectedBooking?.id) return;

        const newLog: RentalLog = {
            type: logType,
            timestamp: new Date(),
            notes: conditionNotes,
            imageUrl: capturedImage || undefined,
        };
        
        const newStatus = logType === 'check-in' ? 'rented' : (logType === 'check-out' ? 'returned' : selectedBooking.status);

        const updatedBookingData = {
            ...selectedBooking,
            dateRange: {
              from: Timestamp.fromDate(selectedBooking.dateRange.from),
              to: Timestamp.fromDate(selectedBooking.dateRange.to),
            },
            status: newStatus,
            logs: [...selectedBooking.logs, { ...newLog, timestamp: Timestamp.fromDate(newLog.timestamp) }]
        };
        
        try {
            await setDoc(doc(db, 'bookings', selectedBooking.id), updatedBookingData, { merge: true });
            toast({ title: 'Success', description: `${logType} log has been saved.`});
            setIsCameraDialogOpen(false);
        } catch(e) {
            toast({ title: 'Error', description: 'Failed to save log.', variant: 'destructive'});
        }
    };

    const handlePrintAgreement = () => {
        const printWindow = window.open('', '', 'height=800,width=600');
        if (printWindow && selectedBooking) {
            const item = rentalItems.find(i => i.id === selectedBooking.itemId);
            const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1E3A8A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v-2a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v2"/><path d="M12 20v-4"/><path d="M8 18h8"/></svg>`;

            const termsAndConditions = `
                <h2 class="section-title">Terms and Conditions</h2>
                <ol class="terms-list">
                    <li><strong>Rental Period:</strong> The rental period begins on the 'From' date and ends on the 'To' date specified above. The item must be returned by 5:00 PM on the return date.</li>
                    <li><strong>Condition of Item:</strong> The renter agrees to return the item in the same condition as it was received, excluding normal wear and tear. All damages will be noted upon return and may be subject to repair or replacement fees. The check-in/check-out photos will serve as evidence of the item's condition.</li>
                    <li><strong>Late Returns:</strong> A late fee of $25.00 per day will be charged for each day the item is not returned after the agreed-upon return date.</li>
                    <li><strong>Use of Item:</strong> The renter agrees to use the item for its intended purpose and in a safe and responsible manner. Any loss or damage due to misuse or neglect will be the renter's full responsibility.</li>
                    <li><strong>Liability:</strong> BizFlow Inc. is not liable for any accidents or injuries that occur during the use of the rented item.</li>
                </ol>
            `;

            printWindow.document.write('<html><head><title>Rental Agreement</title>');
            printWindow.document.write(`
                <style>
                    @media print {
                        @page { size: A4; margin: 0; }
                        * { box-sizing: border-box; }
                        body { margin: 0; padding: 1.5rem; }
                    }
                    body { font-family: 'Inter', sans-serif; color: #333; font-size: 10px; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #1E3A8A; padding-bottom: 0.5rem; }
                    .header-text h1 { color: #1E3A8A; margin: 0; font-size: 1.5rem; }
                    .header-text p { margin: 0; color: #555; font-size: 0.75rem; }
                    .logo { display: flex; align-items: center; gap: 0.5rem; font-size: 1.25rem; font-weight: bold; color: #1E3A8A; }
                    .section { margin-top: 1.5rem; padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; }
                    .section-title { font-size: 1rem; font-weight: 600; color: #1E3A8A; margin-top: 0; margin-bottom: 0.75rem; padding-bottom: 0.25rem; border-bottom: 1px solid #e5e7eb;}
                    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
                    .detail-item { }
                    .detail-label { font-weight: bold; color: #555; }
                    .terms-list { list-style-position: inside; padding-left: 0; font-size: 0.65rem; color: #444; }
                    .terms-list li { margin-bottom: 0.25rem; }
                    .signature-section { margin-top: 2rem; display: flex; justify-content: space-between; }
                    .signature-box { margin-top: 2rem; border-top: 1px solid #ccc; padding-top: 0.5rem; width: 45%; }
                </style>
                 <link rel="preconnect" href="https://fonts.googleapis.com" />
                 <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
                 <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
            `);
            printWindow.document.write('</head><body>');
            printWindow.document.write(`
                <div class="header">
                    <div class="logo">${logoSvg} <span>BizFlow</span></div>
                    <div class="header-text" style="text-align: right;">
                        <h1>Rental Agreement</h1>
                        <p>Agreement ID: ${selectedBooking.id}</p>
                    </div>
                </div>

                <div class="section">
                    <h2 class="section-title">Parties Involved</h2>
                    <div class="details-grid">
                        <div class="detail-item">
                            <p class="detail-label">Renter / Customer:</p>
                            <p>${selectedBooking.customerName}</p>
                        </div>
                         <div class="detail-item">
                            <p class="detail-label">Provider:</p>
                            <p>BizFlow Inc.</p>
                        </div>
                    </div>
                </div>

                <div class="section">
                     <h2 class="section-title">Rental Details</h2>
                     <div class="details-grid">
                         <div class="detail-item">
                            <p class="detail-label">Item:</p>
                            <p>${selectedBooking.itemName}</p>
                        </div>
                        <div class="detail-item">
                            <p class="detail-label">SKU:</p>
                            <p>${item?.sku || 'N/A'}</p>
                        </div>
                        <div class="detail-item">
                            <p class="detail-label">Rental Period From:</p>
                            <p>${format(selectedBooking.dateRange.from, 'PPP')}</p>
                        </div>
                         <div class="detail-item">
                            <p class="detail-label">Rental Period To:</p>
                            <p>${format(selectedBooking.dateRange.to, 'PPP')}</p>
                        </div>
                     </div>
                </div>
                
                 <div class="section">
                    ${termsAndConditions}
                 </div>

                 <div class="signature-section">
                    <div class="signature-box">Renter Signature</div>
                    <div class="signature-box" style="text-align: right;">Date</div>
                 </div>
            `);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
    };


    const selectedDayBookings = bookings.filter(b => 
        selectedDate && 
        selectedDate >= new Date(b.dateRange.from.setHours(0,0,0,0)) && 
        selectedDate <= new Date(b.dateRange.to.setHours(23,59,59,999))
    );
    
    const itemsOnRent = bookings.filter(b => b.status === 'rented').length;
    const overdueReturns = bookings.filter(b => b.status === 'rented' && isAfter(new Date(), b.dateRange.to)).length;
    const totalItems = rentalItems.length;
    const availableItems = totalItems - itemsOnRent;

    const myBookings = bookings.filter(b => b.ownerId === user?.uid);
    const receivedBookings = bookings.filter(b => b.customerId === user?.uid);

    const getLogForType = (booking: RentalBooking | null, type: 'check-in' | 'check-out') => {
        return booking?.logs.find(log => log.type === type);
    };

    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Car className="w-8 h-8 text-primary" />
                            <div>
                                <CardTitle>Rental</CardTitle>
                                <CardDescription>Manage your rental business, from bookings to invoicing.</CardDescription>
                            </div>
                        </div>
                        <Button size="sm" onClick={() => setIsNewBookingDialogOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> New Booking
                        </Button>
                    </div>
                </CardHeader>
            </Card>

             <Tabs defaultValue="rental">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="rental">Rental</TabsTrigger>
                    <TabsTrigger value="sent">My Bookings</TabsTrigger>
                    <TabsTrigger value="received">Items Rented to Me</TabsTrigger>
                </TabsList>
                <TabsContent value="rental">
                     <div className="grid gap-6 md:grid-cols-3 mt-6">
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Items on Rent</CardTitle>
                            <PackageOpen className="w-4 h-4 text-orange-500" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{itemsOnRent}</div>
                            <p className="text-xs text-muted-foreground">Currently with customers</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Available Items</CardTitle>
                            <PackageCheck className="w-4 h-4 text-green-500" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{availableItems}</div>
                            <p className="text-xs text-muted-foreground">Ready to be rented</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Overdue Returns</CardTitle>
                            <AlertTriangle className="w-4 h-4 text-destructive" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{overdueReturns}</div>
                            <p className="text-xs text-muted-foreground">Needs immediate follow-up</p>
                          </CardContent>
                        </Card>
                    </div>

                    <Card className="p-0 mt-6">
                        <div className="p-6 flex flex-col md:flex-row gap-6">
                            <div className="flex-shrink-0 mx-auto">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    className="rounded-md border"
                                    modifiers={{ booked: bookings.map(b => b.dateRange) }}
                                    modifiersStyles={{ booked: { border: '2px solid hsl(var(--primary))' } }}
                                />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold mb-4">
                                    Bookings for {selectedDate ? format(selectedDate, 'PPP') : 'Today'}
                                </h3>
                                <div className="space-y-4">
                                    {selectedDayBookings.length > 0 ? selectedDayBookings.map(booking => (
                                        <div key={booking.id} className="p-3 rounded-md bg-secondary flex justify-between items-center cursor-pointer hover:bg-accent" onClick={() => handleOpenDetailsDialog(booking)}>
                                            <div>
                                                <p className="font-semibold">{booking.itemName}</p>
                                                <p className="text-sm text-muted-foreground">Rented to: {booking.customerName}</p>
                                            </div>
                                            <Badge variant={booking.status === 'rented' ? 'default' : (booking.status === 'returned' ? 'secondary' : 'outline')}>{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</Badge>
                                        </div>
                                    )) : (
                                        <div className="text-center text-muted-foreground py-8">
                                            <p>{loadingBookings ? "Loading..." : "No bookings for this date."}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                </TabsContent>
                 <TabsContent value="sent">
                    <Card>
                        <CardHeader>
                            <CardTitle>My Bookings</CardTitle>
                            <CardDescription>Bookings you have created for customers.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Date Range</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {myBookings.length > 0 ? myBookings.map(booking => (
                                        <TableRow key={booking.id} onClick={() => handleOpenDetailsDialog(booking)} className="cursor-pointer">
                                            <TableCell className="font-medium">{booking.itemName}</TableCell>
                                            <TableCell>{booking.customerName}</TableCell>
                                            <TableCell>{format(booking.dateRange.from, "PP")} - {format(booking.dateRange.to, "PP")}</TableCell>
                                            <TableCell><Badge variant={booking.status === 'rented' ? 'default' : 'outline'}>{booking.status}</Badge></TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24">{loadingBookings ? "Loading..." : "You haven't created any bookings yet."}</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="received">
                     <Card>
                        <CardHeader>
                            <CardTitle>Items Rented To Me</CardTitle>
                            <CardDescription>Items that have been booked for you by others.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Booked By</TableHead>
                                        <TableHead>Date Range</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                     {receivedBookings.length > 0 ? receivedBookings.map(booking => (
                                        <TableRow key={booking.id}>
                                            <TableCell className="font-medium">{booking.itemName}</TableCell>
                                            <TableCell>{/* Need to map userId to a name */}</TableCell>
                                            <TableCell>{format(booking.dateRange.from, "PP")} - {format(booking.dateRange.to, "PP")}</TableCell>
                                            <TableCell><Badge variant={booking.status === 'rented' ? 'default' : 'outline'}>{booking.status}</Badge></TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24">{loadingBookings ? "Loading..." : "No items are currently rented to you."}</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isNewBookingDialogOpen} onOpenChange={setIsNewBookingDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Rental Booking</DialogTitle>
                        <DialogDescription>Select an item, customer, and date range to create a new booking.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="item" className="text-right">Item</Label>
                            <Select value={newItemId} onValueChange={setNewItemId}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select an item to rent..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {rentalItems.map(item => (
                                        <SelectItem key={item.id} value={item.id} disabled={item.stock === 0}>
                                            {item.name} (Stock: {item.stock})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="customer" className="text-right">Customer</Label>
                            <Select value={newCustomerId} onValueChange={setNewCustomerId}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a customer..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="date-range" className="text-right">Date Range</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    id="date-range"
                                    variant={"outline"}
                                    className={cn(
                                    "col-span-3 justify-start text-left font-normal",
                                    !newDateRange && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {newDateRange?.from ? (
                                    newDateRange.to ? (
                                        <>
                                        {format(newDateRange.from, "LLL dd, y")} -{" "}
                                        {format(newDateRange.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(newDateRange.from, "LLL dd, y")
                                    )
                                    ) : (
                                    <span>Pick a date</span>
                                    )}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={newDateRange?.from}
                                    selected={newDateRange}
                                    onSelect={setNewDateRange}
                                    numberOfMonths={2}
                                />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNewBookingDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateBooking}>Create Booking</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Booking Details for {selectedBooking?.itemName}</DialogTitle>
                        <div className="flex justify-between items-start">
                            <DialogDescription>Customer: {selectedBooking?.customerName}</DialogDescription>
                            <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-400" />
                                <span className="text-sm font-medium">Customer Score: {selectedBooking?.customerScore || 'N/A'}</span>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Check-in Log</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {getLogForType(selectedBooking, 'check-in') ? (
                                    <div className="space-y-2">
                                        {getLogForType(selectedBooking, 'check-in')?.imageUrl && <Image src={getLogForType(selectedBooking, 'check-in')!.imageUrl!} alt="Check-in" width={200} height={150} className="rounded-md object-cover" unoptimized />}
                                        <p className="text-sm font-medium">Notes:</p>
                                        <p className="text-sm text-muted-foreground p-2 bg-secondary rounded-md">{getLogForType(selectedBooking, 'check-in')?.notes || 'No notes provided.'}</p>
                                        <p className="text-xs text-muted-foreground pt-2">Logged on: {format(getLogForType(selectedBooking, 'check-in')!.timestamp, 'PPP p')}</p>
                                    </div>
                                ) : (
                                    <Button className="w-full" onClick={() => handleOpenCameraDialog('check-in')} disabled={selectedBooking?.status !== 'booked'}>
                                        <Camera className="mr-2 h-4 w-4" /> Check-in Item
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Check-out Log</CardTitle>
                            </CardHeader>
                            <CardContent>
                               {getLogForType(selectedBooking, 'check-out') ? (
                                    <div className="space-y-2">
                                        {getLogForType(selectedBooking, 'check-out')?.imageUrl && <Image src={getLogForType(selectedBooking, 'check-out')!.imageUrl!} alt="Check-out" width={200} height={150} className="rounded-md object-cover" unoptimized />}
                                        <p className="text-sm font-medium">Notes:</p>
                                        <p className="text-sm text-muted-foreground p-2 bg-secondary rounded-md">{getLogForType(selectedBooking, 'check-out')?.notes || 'No notes provided.'}</p>
                                         <p className="text-xs text-muted-foreground pt-2">Logged on: {format(getLogForType(selectedBooking, 'check-out')!.timestamp, 'PPP p')}</p>
                                    </div>
                                ) : (
                                    <Button className="w-full" onClick={() => handleOpenCameraDialog('check-out')} disabled={selectedBooking?.status !== 'rented'}>
                                        <Camera className="mr-2 h-4 w-4" /> Check-out Item
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                     <Separator />
                    <DialogFooter className="pt-4 flex justify-between w-full">
                        <Button variant="outline" onClick={() => { setIsAgreementDialogOpen(false); handlePrintAgreement(); }}>
                            <FileText className="mr-2 h-4 w-4" />
                            Print Agreement
                        </Button>
                        <Button variant="secondary" onClick={() => setIsDetailsDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isCameraDialogOpen} onOpenChange={setIsCameraDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Log Condition for {logType.replace('-', ' ')}</DialogTitle>
                        <DialogDescription>Take a photo and add notes about the item's condition.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="relative">
                            <video 
                                ref={videoRef} 
                                className={`w-full aspect-video rounded-md bg-secondary ${capturedImage ? 'hidden' : 'block'}`} 
                                autoPlay muted playsInline 
                            />
                            {capturedImage && (
                                <Image src={capturedImage} alt="Captured item" width={1280} height={720} className="rounded-md" unoptimized />
                            )}
                        </div>
                        {hasCameraPermission === false && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Camera Access Required</AlertTitle>
                                <AlertDescription>Please allow camera access to use this feature.</AlertDescription>
                            </Alert>
                        )}
                        <div>
                            <Label htmlFor="notes">Condition Notes</Label>
                            <Textarea id="notes" value={conditionNotes} onChange={e => setConditionNotes(e.target.value)} placeholder="e.g., small scratch on the top left corner." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCameraDialogOpen(false)}>Cancel</Button>
                        {capturedImage ? (
                            <>
                                <Button variant="outline" onClick={() => setCapturedImage(null)}>
                                    <RefreshCcw className="mr-2 h-4 w-4" /> Retake
                                </Button>
                                <Button onClick={handleSaveLog}>Save Log</Button>
                            </>
                        ) : (
                            <Button onClick={handleCapture} disabled={!hasCameraPermission}>
                                <Camera className="mr-2 h-4 w-4" /> Capture Photo
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
