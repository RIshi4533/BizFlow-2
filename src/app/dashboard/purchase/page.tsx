
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText, Trash2, Loader } from "lucide-react";
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
import { DatePicker } from '@/components/ui/date-picker';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { initialContacts, initialInventoryItems, type Contact, type InventoryItem } from '@/lib/mock-data';
import { format } from 'date-fns';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '@/lib/firebase';
import { collection, query, addDoc, serverTimestamp, where, orderBy } from 'firebase/firestore';


type OrderStatus = "Draft" | "Sent" | "Delivered" | "Cancelled";

type PurchaseOrderLine = {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
};

type PurchaseOrder = {
  id: string;
  supplierName: string;
  date: string;
  total: number;
  status: OrderStatus;
  lines: PurchaseOrderLine[];
  ownerId?: string;
};


const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Delivered': return 'default';
        case 'Sent': return 'secondary';
        case 'Draft': return 'outline';
        case 'Cancelled': return 'destructive';
        default: return 'default';
    }
}

const getStatusClass = (status: string) => {
    switch (status) {
        case 'Delivered': return 'bg-green-100 text-green-800';
        case 'Sent': return 'bg-blue-100 text-blue-800';
        case 'Draft': return 'bg-gray-100 text-gray-800';
        case 'Cancelled': return 'bg-red-100 text-red-800';
        default: return '';
    }
}

export default function PurchasePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    
    const purchaseOrdersQuery = user ? query(collection(db, 'purchase_orders'), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc')) : null;
    const [purchaseOrdersSnapshot, loadingPOs] = useCollection(purchaseOrdersQuery);
    const purchaseOrders: PurchaseOrder[] = purchaseOrdersSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() as any })) || [];

    const [dialogKey, setDialogKey] = React.useState(Date.now());
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const [newSupplierName, setNewSupplierName] = React.useState('');
    const [newPoDate, setNewPoDate] = React.useState<Date | undefined>(new Date());
    const [newPoLines, setNewPoLines] = React.useState<Partial<PurchaseOrderLine>[]>([{ id: `${Date.now()}` , description: '', quantity: 1, unitPrice: 0 }]);
    
    const handleLineChange = (index: number, field: keyof PurchaseOrderLine, value: string | number) => {
        const updatedLines = [...newPoLines];
        (updatedLines[index] as any)[field] = value;
        setNewPoLines(updatedLines);
    }
    
    const addLine = () => setNewPoLines([...newPoLines, { id: `${Date.now()}`, description: '', quantity: 1, unitPrice: 0 }]);
    const removeLine = (index: number) => setNewPoLines(newPoLines.filter((_, i) => i !== index));

    const resetForm = () => {
        setNewSupplierName('');
        setNewPoDate(new Date());
        setNewPoLines([{ id: `${Date.now()}`, description: '', quantity: 1, unitPrice: 0 }]);
    }

    const handleCreatePO = async () => {
        if (!newSupplierName || newPoLines.some(l => !l.description || !l.quantity || l.unitPrice === undefined)) {
            toast({ title: 'Error', description: 'Please enter a supplier and complete all line items.', variant: 'destructive'});
            return;
        }

        if (!user) {
            toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
            return;
        }

        const total = newPoLines.reduce((sum, line) => sum + ((line.quantity || 0) * (line.unitPrice || 0)), 0);

        const newPOData = {
            supplierName: newSupplierName,
            date: format(newPoDate || new Date(), 'yyyy-MM-dd'),
            status: 'Draft' as OrderStatus,
            lines: newPoLines as PurchaseOrderLine[],
            total,
            ownerId: user.uid,
            createdAt: serverTimestamp(),
        };

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "purchase_orders"), newPOData);
            toast({ title: 'Success!', description: 'New Purchase Order has been created as a draft.' });
            setIsDialogOpen(false);
            resetForm();
            setDialogKey(Date.now());
        } catch(error) {
            console.error("Error creating PO: ", error);
            toast({ title: 'Error', description: 'Could not save purchase order.', variant: 'destructive'});
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
     <div className="flex flex-col gap-6">
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Purchase Orders</CardTitle>
                        <CardDescription>Streamline your procurement workflow.</CardDescription>
                    </div>
                     <Dialog key={dialogKey} open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-1">
                                <PlusCircle className="h-4 w-4" />
                                Create Purchase Order
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl">
                             <DialogHeader>
                                <DialogTitle>Create Purchase Order</DialogTitle>
                                <DialogDescription>Fill out the details below to create a new PO.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="supplier">Supplier</Label>
                                         <Input id="supplier" placeholder="Enter supplier name..." value={newSupplierName} onChange={(e) => setNewSupplierName(e.target.value)} />
                                    </div>
                                     <div>
                                        <Label htmlFor="po-date">Order Date</Label>
                                        <DatePicker date={newPoDate} setDate={setNewPoDate} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Items</Label>
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                        {newPoLines.map((line, index) => (
                                            <div key={line.id} className="flex items-center gap-2">
                                                <Input 
                                                    placeholder="Item description..." 
                                                    className="flex-1" 
                                                    value={line.description} 
                                                    onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                                                />
                                                <Input type="number" placeholder="Qty" className="w-20" value={line.quantity} onChange={(e) => handleLineChange(index, 'quantity', parseInt(e.target.value) || 0)} />
                                                <Input type="number" placeholder="Price" className="w-24" value={line.unitPrice} onChange={(e) => handleLineChange(index, 'unitPrice', parseFloat(e.target.value) || 0)} />
                                                <Button variant="ghost" size="icon" onClick={() => removeLine(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                            </div>
                                        ))}
                                    </div>
                                    <Button variant="outline" size="sm" onClick={addLine}><PlusCircle className="mr-2 h-4 w-4" />Add Item</Button>
                                </div>
                                 <div className="text-right font-bold text-lg">
                                    Total: {formatCurrency(newPoLines.reduce((sum, line) => sum + ((line.quantity || 0) * (line.unitPrice || 0)), 0))}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreatePO} disabled={isSubmitting}>{isSubmitting ? <Loader className="animate-spin mr-2" /> : "Save Draft"}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-[100px] text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loadingPOs && <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader className="animate-spin mx-auto" /></TableCell></TableRow>}
                        {purchaseOrders.map((po) => (
                        <TableRow key={po.id}>
                            <TableCell className="font-medium">{po.id}</TableCell>
                            <TableCell>{po.supplierName}</TableCell>
                            <TableCell>{format(new Date(po.date), 'PPP')}</TableCell>
                            <TableCell>
                               <Badge variant={getStatusVariant(po.status)} className={getStatusClass(po.status)}>{po.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(po.total)}</TableCell>
                            <TableCell className="text-center">
                                <Button variant="ghost" size="icon">
                                    <FileText className="h-4 w-4" />
                                    <span className="sr-only">View Details</span>
                                </Button>
                            </TableCell>
                        </TableRow>
                        ))}
                         {!loadingPOs && purchaseOrders.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">No purchase orders found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
