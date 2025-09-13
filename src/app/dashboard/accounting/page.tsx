
'use client';

import * as React from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, serverTimestamp, doc, query, orderBy, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingDown, Receipt, Download, PlusCircle, MoreHorizontal, Edit, Trash2, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { handlePdfExport } from '@/lib/pdf-export';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';import { useAuth } from '@/hooks/use-auth';
import { type Transaction } from '@/lib/mock-data';


const initialTransactionState: Omit<Transaction, 'id' | 'date'> = {
    description: '',
    amount: 0,
    status: 'Pending',
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

const handleCsvExport = (transactions: Transaction[]) => {
    if (transactions.length === 0) return;

    const headers = ["ID", "Date", "Description", "Amount", "Status"];
    const csvRows = [
        headers.join(','),
        ...transactions.map(t => 
            [t.id, t.date, `"${t.description.replace(/"/g, '""')}"`, t.amount, t.status].join(',')
        )
    ];
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'transactions.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


export default function AccountingPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [currentTransaction, setCurrentTransaction] = React.useState<Omit<Transaction, 'id' | 'date'> | Transaction>(initialTransactionState);

 // Conditionally create and use the query when the user is available
 const transactionsQuery = user ? query(collection(db, 'transactions'), where('ownerId', '==', user.uid), orderBy('date', 'desc')) : null;
  const transactions: Transaction[] = transactionsSnapshot?.docs.map((doc: { id: any; data: () => any; }) => ({
      id: doc.id,
      ...doc.data(),
  })) as Transaction[] || [];

  const handleOpenDialog = (transaction?: Transaction) => {
 if (!user) {
 toast({ title: 'Authentication Required', description: 'Please log in to manage transactions.', variant: 'destructive' });
 return;
 }

    if (transaction) {
      setCurrentTransaction(transaction);
      setIsEditing(true);
    } else {
      setCurrentTransaction(initialTransactionState);
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };
  
  const handleSaveTransaction = async () => {
 if (!user) {
 toast({ title: 'Authentication Error', description: 'You must be logged in to save transactions.', variant: 'destructive' });
 return;
 }
    if (isEditing && 'id' in currentTransaction) {
       await updateDoc(doc(db, 'transactions', currentTransaction.id), {
           ...(currentTransaction as any),
       });
       toast({ title: "Success", description: "Transaction updated."});
    } else {
       const newTransaction = {
            description: currentTransaction.description,
            amount: Number(currentTransaction.amount) || 0,
            status: currentTransaction.status,
            date: new Date().toISOString(),
 ownerId: user.uid,
       };
       await addDoc(collection(db, 'transactions'), newTransaction);
       toast({ title: "Success", description: "Transaction created." });
    }
    setIsDialogOpen(false);
  };
  
  const handleDeleteTransaction = async (transactionId: string) => {
 if (!user) {
 toast({ title: 'Authentication Required', description: 'Please log in to delete transactions.', variant: 'destructive' });
 return;
 }

    await deleteDoc(doc(db, 'transactions', transactionId));
    toast({ title: "Success", description: "Transaction deleted." });
  };


  const totalRevenue = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalRevenue + totalExpenses;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Report</h1>
          <p className="text-muted-foreground">An overview of your company's financial activities.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => handleOpenDialog()}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
            <Button 
                size="sm" 
                variant="outline" 
                className="gap-1" 
                onClick={() => handleCsvExport(transactions)}
                disabled={transactions.length === 0}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
            </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <TrendingDown className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(Math.abs(totalExpenses))}</div>
                <p className="text-xs text-muted-foreground">+5.2% from last month</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-primary">Net Profit</CardTitle>
                <Receipt className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-primary">{formatCurrency(netProfit)}</div>
                <p className="text-xs text-primary/80">Updated just now</p>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>A list of your most recent financial activities.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
            {loading ? (
                <div className="flex justify-center items-center h-48">
                    <Loader className="w-8 h-8 animate-spin" />
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="hidden text-right sm:table-cell">Status</TableHead>
                        <TableHead className="hidden text-right sm:table-cell">Date</TableHead>
                        <TableHead><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map((transaction) => (
                        <TableRow key={transaction.id} className="hover:bg-muted/50">
                            <TableCell>
                            <div className="font-medium">{transaction.description}</div>
                            </TableCell>
                            <TableCell className={`text-right font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-destructive'}`}>
                                {formatCurrency(transaction.amount)}
                            </TableCell>
                            <TableCell className="hidden text-right sm:table-cell">
                                <Badge variant={transaction.status === 'Cleared' ? 'default' : 'secondary'} className={transaction.status === 'Cleared' ? 'bg-green-100 text-green-800' : ''}>
                                    {transaction.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="hidden text-right sm:table-cell">
                            {new Date(transaction.date).toLocaleDateString()}
                            </TableCell>
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
                                <DropdownMenuItem onClick={() => handleOpenDialog(transaction)}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
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
                                        This action cannot be undone. This will permanently delete the transaction.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteTransaction(transaction.id)}>Continue</AlertDialogAction>
                                    </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            </TableCell>
                        </TableRow>
                        ))}
                        {transactions.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">No transactions found.</TableCell>
                        </TableRow>
                        )}
                    </TableBody>
                </Table>
            )}
        </CardContent>
       </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{isEditing ? 'Edit' : 'Create'} Transaction</DialogTitle>
                <DialogDescription>
                    Fill out the details for the transaction.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">Description</Label>
                    <Input 
                        id="description" 
                        className="col-span-3"
                        value={currentTransaction.description}
                        onChange={e => setCurrentTransaction({...currentTransaction, description: e.target.value})}
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">Amount</Label>
                    <Input 
                        id="amount" 
                        type="number"
                        className="col-span-3"
                        placeholder="Use negative for expenses"
                        value={currentTransaction.amount}
                        onChange={e => setCurrentTransaction({...currentTransaction, amount: Number(e.target.value)})}
                    />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right">Status</Label>
                    <Select 
                        value={currentTransaction.status} 
                        onValueChange={(value: 'Cleared' | 'Pending') => setCurrentTransaction({...currentTransaction, status: value})}
                    >
                        <SelectTrigger className="col-span-3">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Cleared">Cleared</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveTransaction}>Save Transaction</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
