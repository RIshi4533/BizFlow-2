
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  PlusCircle,
  Receipt,
  FileText,
  DollarSign,
  MoreHorizontal,
  Trash2,
  Edit,
  Send,
  Sparkles,
  Loader,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
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

import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { Invoice, InvoiceStatus } from '@/lib/mock-data';
import { initialInvoices, initialContacts, initialInventoryItems } from '@/lib/mock-data';
import Link from 'next/link';
import { generateInvoiceSummary } from '@/app/ai-actions';


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const getStatusVariant = (status: InvoiceStatus) => {
  switch (status) {
    case 'Paid':
      return 'default';
    case 'Sent':
      return 'secondary';
    case 'Partial':
      return 'outline';
    case 'Overdue':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const getStatusClass = (status: InvoiceStatus) => {
    switch (status) {
        case 'Paid': return 'bg-green-100 text-green-800';
        case 'Sent': return 'bg-blue-100 text-blue-800';
        case 'Partial': return 'bg-yellow-100 text-yellow-800';
        case 'Draft': return 'bg-gray-100 text-gray-800';
        case 'Overdue': return 'bg-red-100 text-red-800';
        default: return '';
    }
}

export default function InvoicingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [isAiSummarizing, setIsAiSummarizing] = React.useState<string | null>(null);

  const getStorageKey = React.useCallback(() => {
    return user ? `bizflow-invoices-${user.uid}` : '';
  }, [user]);

  React.useEffect(() => {
    const storageKey = getStorageKey();
    if (!storageKey) return;
    try {
      const storedInvoices = localStorage.getItem(storageKey);
      if (storedInvoices) {
        setInvoices(JSON.parse(storedInvoices));
      } else {
        setInvoices(initialInvoices);
      }
    } catch (error) {
      console.error('Failed to parse invoices from localStorage', error);
      setInvoices(initialInvoices);
    }
  }, [getStorageKey]);

  const persistInvoices = (updatedInvoices: Invoice[]) => {
      const storageKey = getStorageKey();
      if (!storageKey) return;
      localStorage.setItem(storageKey, JSON.stringify(updatedInvoices));
      setInvoices(updatedInvoices);
  }

  const handleDeleteInvoice = (invoiceId: string) => {
      const updatedInvoices = invoices.filter(inv => inv.id !== invoiceId);
      persistInvoices(updatedInvoices);
      toast({ title: 'Success', description: 'Invoice has been deleted.' });
  }

  const handleGenerateSummary = async (invoice: Invoice) => {
      setIsAiSummarizing(invoice.id);
      try {
          const result = await generateInvoiceSummary({
              customerName: invoice.customerName,
              lineItems: invoice.lineItems,
              total: invoice.total,
          });

          const updatedInvoices = invoices.map(inv => 
              inv.id === invoice.id ? { ...inv, aiSummary: result.summary } : inv
          );
          
          // Set the state directly to force a UI update
          setInvoices(updatedInvoices);

          // Then, persist the changes to localStorage
          const storageKey = getStorageKey();
          if (storageKey) {
            localStorage.setItem(storageKey, JSON.stringify(updatedInvoices));
          }

          toast({ title: 'AI Summary Generated!', description: result.summary });
      } catch (error) {
          console.error('Failed to generate summary', error);
          toast({ title: 'Error', description: 'Could not generate AI summary.', variant: 'destructive'});
      } finally {
          setIsAiSummarizing(null);
      }
  }


  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Receipt className="w-8 h-8 text-primary" />
              <div>
                <CardTitle>Invoicing</CardTitle>
                <CardDescription>
                  Create and manage professional invoices.
                </CardDescription>
              </div>
            </div>
            <Button asChild>
                <Link href="/dashboard/invoicing/new">
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Invoice
                </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>
                      <div>{invoice.customerName}</div>
                      <div className="text-xs text-muted-foreground">{invoice.aiSummary}</div>
                  </TableCell>
                  <TableCell>{invoice.dueDate}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(invoice.status)} className={getStatusClass(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(invoice.total)}
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/invoicing/new?id=${invoice.id}`}>
                               <Edit className="mr-2 h-4 w-4" /> Edit
                            </Link>
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => handleGenerateSummary(invoice)} disabled={!!isAiSummarizing}>
                            {isAiSummarizing === invoice.id ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                           {invoice.aiSummary ? 'Regenerate' : 'Generate'} AI Summary
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
                                This action cannot be undone. This will permanently delete the invoice.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteInvoice(invoice.id)}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                          No invoices found.
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
