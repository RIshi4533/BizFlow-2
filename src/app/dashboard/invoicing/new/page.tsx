
'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DatePicker } from '@/components/ui/date-picker';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, PlusCircle, Save, ArrowLeft, Bot, Upload, Sparkles, Loader, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { Invoice, InvoiceLineItem, InvoiceStatus } from '@/lib/mock-data';
import { initialInvoices, initialContacts, initialInventoryItems } from '@/lib/mock-data';
import { generateInvoiceSummary } from '@/app/ai-actions';


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [invoice, setInvoice] = React.useState<Omit<Invoice, 'id' | 'total' | 'paidAmount'> & { id?: string; total: number, paidAmount: number }>({
      customerName: '',
      customerEmail: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
      lineItems: [{ id: '1', description: '', quantity: 1, unitPrice: 0 }],
      status: 'Draft',
      total: 0,
      paidAmount: 0,
      aiSummary: '',
  });
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const getStorageKey = React.useCallback(() => {
    return user ? `bizflow-invoices-${user.uid}` : '';
  }, [user]);

  React.useEffect(() => {
      const invoiceId = searchParams.get('id');
      if (invoiceId) {
          const storageKey = getStorageKey();
          if (!storageKey) return;
          const storedInvoices = localStorage.getItem(storageKey);
          const invoices: Invoice[] = storedInvoices ? JSON.parse(storedInvoices) : initialInvoices;
          const existingInvoice = invoices.find(inv => inv.id === invoiceId);
          if (existingInvoice) {
              setInvoice(existingInvoice);
              setIsEditing(true);
          }
      }
  }, [searchParams, getStorageKey]);

  React.useEffect(() => {
    const newTotal = invoice.lineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    setInvoice(prev => ({...prev, total: newTotal}));
  }, [invoice.lineItems]);
  
  const handleLineItemChange = (index: number, field: keyof InvoiceLineItem, value: string | number) => {
    const updatedLineItems = [...invoice.lineItems];
    // @ts-ignore
    updatedLineItems[index][field] = value;
    setInvoice(prev => ({...prev, lineItems: updatedLineItems}));
  };

  const addLineItem = () => {
    setInvoice(prev => ({...prev, lineItems: [...prev.lineItems, { id: `${Date.now()}`, description: '', quantity: 1, unitPrice: 0 }]}));
  };

  const removeLineItem = (index: number) => {
    const updatedLineItems = invoice.lineItems.filter((_, i) => i !== index);
    setInvoice(prev => ({...prev, lineItems: updatedLineItems}));
  };
  
  const handleCustomerChange = (customerId: string) => {
      const customer = initialContacts.find(c => c.id === customerId);
      if (customer) {
          setInvoice(prev => ({...prev, customerName: customer.name, customerEmail: customer.email}));
      }
  }

  const handleSaveInvoice = async () => {
    setIsSaving(true);
    const storageKey = getStorageKey();
    if (!storageKey) {
        toast({ title: 'Error', description: 'Could not save invoice. User not found.', variant: 'destructive'});
        setIsSaving(false);
        return;
    }

    let aiSummary = invoice.aiSummary || '';
    try {
        const summaryResult = await generateInvoiceSummary({
            customerName: invoice.customerName,
            lineItems: invoice.lineItems,
            total: invoice.total
        });
        aiSummary = summaryResult.summary;
    } catch(error) {
        console.error("AI summary generation failed", error);
        toast({ title: "AI Feature Unavailable", description: "Could not generate AI summary, but the invoice will be saved without it.", variant: "default", duration: 5000 });
    }
    
    // Save invoice regardless of AI summary outcome
    try {
        const finalInvoice: Invoice = {
            ...invoice,
            id: invoice.id || `INV-${Date.now().toString().slice(-6)}`,
            aiSummary: aiSummary
        };

        const storedInvoices = localStorage.getItem(storageKey);
        let invoices: Invoice[] = storedInvoices ? JSON.parse(storedInvoices) : [];
        if (isEditing) {
            invoices = invoices.map(inv => inv.id === finalInvoice.id ? finalInvoice : inv);
        } else {
            invoices.push(finalInvoice);
        }
        
        localStorage.setItem(storageKey, JSON.stringify(invoices));
        toast({ title: 'Success!', description: 'Invoice has been saved.'});
        router.push('/dashboard/invoicing');
    } catch(error) {
        console.error("Save invoice failed", error);
        toast({ title: "Error", description: "Could not save the invoice to storage.", variant: "destructive"});
    } finally {
        setIsSaving(false);
    }
  };


  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{isEditing ? `Edit Invoice ${invoice.id}` : 'Create New Invoice'}</h1>
                <p className="text-muted-foreground">Fill in the details below to create or update an invoice.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Invoice Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead className="w-2/5">Description</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Unit Price</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoice.lineItems.map((item, index) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                    <Input
                                        placeholder="Service or product description"
                                        value={item.description}
                                        onChange={e => handleLineItemChange(index, 'description', e.target.value)}
                                    />
                                    </TableCell>
                                    <TableCell>
                                    <Input
                                        type="number"
                                        value={item.quantity}
                                        onChange={e => handleLineItemChange(index, 'quantity', Number(e.target.value))}
                                    />
                                    </TableCell>
                                    <TableCell>
                                    <Input
                                        type="number"
                                        value={item.unitPrice}
                                        onChange={e => handleLineItemChange(index, 'unitPrice', Number(e.target.value))}
                                    />
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                    {formatCurrency(item.quantity * item.unitPrice)}
                                    </TableCell>
                                    <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => removeLineItem(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                         <Button variant="outline" size="sm" className="mt-4" onClick={addLineItem}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Line Item
                         </Button>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1 flex flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Customer & Dates</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="customer">Customer</Label>
                            <Select onValueChange={handleCustomerChange} value={initialContacts.find(c => c.name === invoice.customerName)?.id}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a customer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {initialContacts.map(contact => (
                                        <SelectItem key={contact.id} value={contact.id}>{contact.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {invoice.customerName && <p className="text-sm text-muted-foreground mt-2">{invoice.customerName} ({invoice.customerEmail})</p>}
                        </div>
                        <div>
                            <Label htmlFor="invoiceDate">Invoice Date</Label>
                            <DatePicker date={new Date(invoice.invoiceDate)} setDate={date => setInvoice(prev => ({...prev, invoiceDate: date?.toISOString().split('T')[0] || ''}))} />
                        </div>
                         <div>
                            <Label htmlFor="dueDate">Due Date</Label>
                            <DatePicker date={new Date(invoice.dueDate)} setDate={date => setInvoice(prev => ({...prev, dueDate: date?.toISOString().split('T')[0] || ''}))} />
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Payment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="status">Status</Label>
                            <Select value={invoice.status} onValueChange={(value: InvoiceStatus) => setInvoice(prev => ({...prev, status: value}))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Draft">Draft</SelectItem>
                                    <SelectItem value="Sent">Sent</SelectItem>
                                    <SelectItem value="Partial">Partial</SelectItem>
                                    <SelectItem value="Paid">Paid</SelectItem>
                                    <SelectItem value="Overdue">Overdue</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="text-right space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Total:</span>
                                <span className="text-lg font-bold">{formatCurrency(invoice.total)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Amount Paid:</span>
                                <Input type="number" value={invoice.paidAmount} onChange={e => setInvoice(prev => ({...prev, paidAmount: Number(e.target.value)}))} className="w-32 text-right" />
                            </div>
                             <div className="flex justify-between items-center text-primary font-bold">
                                <span className="font-medium">Balance Due:</span>
                                <span>{formatCurrency(invoice.total - invoice.paidAmount)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                 <Button size="lg" onClick={handleSaveInvoice} disabled={isSaving}>
                    {isSaving ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isEditing ? 'Save Changes' : 'Save Invoice'}
                 </Button>
            </div>
        </div>
    </div>
  );
}

    