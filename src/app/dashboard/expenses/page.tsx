
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  TrendingDown,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Loader,
  Upload,
  BarChart,
  DollarSign,
  ShieldCheck,
  Hourglass,
  Route
} from "lucide-react";
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
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { Expense, ExpenseStatus, ExpenseCategory, PaymentMethod } from '@/lib/mock-data';
import { initialExpenses, initialEmployees } from '@/lib/mock-data';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { extractExpenseDetails, calculateMileageExpense } from '@/app/ai-actions';


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const getStatusStyles = (status: ExpenseStatus) => {
  switch (status) {
    case 'Approved': return { variant: 'default' as const, className: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> };
    case 'Submitted': return { variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-4 h-4" /> };
    case 'Rejected': return { variant: 'destructive' as const, className: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" /> };
    default: return { variant: 'outline' as const, icon: <Clock className="w-4 h-4" /> };
  }
};

const initialExpenseState: Omit<Expense, 'id'> = {
  vendor: '',
  amount: 0,
  date: new Date().toISOString(),
  category: 'Other',
  status: 'Submitted',
  employeeId: initialEmployees[0].id,
  approverId: initialEmployees[1].id,
  notes: '',
};

const expenseCategories: ExpenseCategory[] = ["Travel", "Food", "Office Supplies", "Software", "Utilities", "Other", "Mileage"];
const paymentMethods: PaymentMethod[] = ["Credit Card", "Bank Transfer", "Cash"];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff4d4d', '#A333FF'];


export default function ExpensesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [currentExpense, setCurrentExpense] = React.useState<Omit<Expense, 'id'> | Expense>(initialExpenseState);

  const getStorageKey = React.useCallback(() => user ? `bizflow-expenses-${user.uid}` : null, [user]);

  React.useEffect(() => {
    const key = getStorageKey();
    if (!key) return;
    try {
      const stored = localStorage.getItem(key);
      setExpenses(stored ? JSON.parse(stored) : initialExpenses);
    } catch (e) {
      console.error("Failed to parse expenses from localStorage", e);
      setExpenses(initialExpenses);
    }
  }, [getStorageKey]);

  const persistExpenses = (updatedExpenses: Expense[]) => {
    const key = getStorageKey();
    if (key) localStorage.setItem(key, JSON.stringify(updatedExpenses));
    setExpenses(updatedExpenses);
  };

  const handleOpenDialog = (expense?: Expense) => {
    if (expense) {
      setCurrentExpense(expense);
      setIsEditing(true);
    } else {
      setCurrentExpense(initialExpenseState);
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };

  const handleSaveExpense = () => {
    if (!currentExpense.vendor || currentExpense.amount <= 0) {
      toast({ title: 'Error', description: 'Vendor and a valid amount are required.', variant: 'destructive' });
      return;
    }
    
    let updatedExpenses;
    if (isEditing && 'id' in currentExpense) {
      updatedExpenses = expenses.map(e => e.id === currentExpense.id ? currentExpense as Expense : e);
      toast({ title: 'Success', description: 'Expense updated.' });
    } else {
      const newExpense = { ...currentExpense, id: `exp_${Date.now()}` };
      updatedExpenses = [newExpense, ...expenses];
      toast({ title: 'Success', description: 'Expense created.' });
    }

    persistExpenses(updatedExpenses);
    setIsDialogOpen(false);
  };

  const handleDeleteExpense = (id: string) => {
    persistExpenses(expenses.filter(e => e.id !== id));
    toast({ title: 'Success', description: 'Expense deleted.' });
  };
  
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingApproval = expenses.filter(e => e.status === 'Submitted').length;
  const totalReimbursed = expenses.filter(e => e.status === 'Approved' && e.reimbursedOn).reduce((sum, e) => sum + e.amount, 0);

  const chartData = expenseCategories.map(category => ({
      name: category,
      value: expenses.filter(e => e.category === category).reduce((sum, e) => sum + e.amount, 0)
  })).filter(d => d.value > 0);


  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <TrendingDown className="w-8 h-8 text-primary" />
              <div>
                <CardTitle>Expenses</CardTitle>
                <CardDescription>Track and manage employee expenses.</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
                <Button onClick={() => handleOpenDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
                </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">Across all employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Hourglass className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApproval}</div>
            <p className="text-xs text-muted-foreground">Expenses waiting for review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Reimbursed</CardTitle>
            <ShieldCheck className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalReimbursed)}</div>
            <p className="text-xs text-muted-foreground">Approved and paid expenses</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Expense History</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Employee</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {expenses.map((expense) => {
                            const status = getStatusStyles(expense.status);
                            const employee = initialEmployees.find(e => e.id === expense.employeeId);
                            return (
                                <TableRow key={expense.id}>
                                    <TableCell>
                                        <div className="font-medium">{expense.vendor}</div>
                                        <div className="text-sm text-muted-foreground">{expense.category}</div>
                                    </TableCell>
                                    <TableCell>{employee?.name || 'Unknown'}</TableCell>
                                    <TableCell className="font-medium">{formatCurrency(expense.amount)}</TableCell>
                                    <TableCell>
                                        <Badge variant={status.variant} className={status.className}>
                                            {status.icon}
                                            <span className="ml-2">{expense.status}</span>
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleOpenDialog(expense)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>This action will permanently delete the expense record.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteExpense(expense.id)}>Continue</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                         {expenses.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">No expenses found.</TableCell>
                            </TableRow>
                         )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                            {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value as number)} />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{isEditing ? 'Edit' : 'Add'} Expense</DialogTitle>
                  <DialogDescription>Fill out the details for the expense record.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="vendor" className="text-right">Vendor</Label>
                      <Input id="vendor" value={currentExpense.vendor} onChange={e => setCurrentExpense({...currentExpense, vendor: e.target.value})} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="amount" className="text-right">Amount</Label>
                      <Input id="amount" type="number" value={currentExpense.amount} onChange={e => setCurrentExpense({...currentExpense, amount: parseFloat(e.target.value) || 0})} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="date" className="text-right">Date</Label>
                      <DatePicker date={new Date(currentExpense.date)} setDate={date => setCurrentExpense({...currentExpense, date: date?.toISOString() || ''})} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="category" className="text-right">Category</Label>
                      <Select value={currentExpense.category} onValueChange={value => setCurrentExpense({...currentExpense, category: value as any})}>
                          <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                          <SelectContent>{expenseCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="status" className="text-right">Status</Label>
                      <Select value={currentExpense.status} onValueChange={value => setCurrentExpense({...currentExpense, status: value as any})}>
                          <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Submitted">Submitted</SelectItem>
                            <SelectItem value="Approved">Approved</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="approver" className="text-right">Approver</Label>
                      <Select value={currentExpense.approverId} onValueChange={value => setCurrentExpense({...currentExpense, approverId: value})}>
                          <SelectTrigger className="col-span-3"><SelectValue placeholder="Suggesting approver..." /></SelectTrigger>
                          <SelectContent>{initialEmployees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                      </Select>
                  </div>
                   <div className="grid grid-cols-4 items-start gap-4">
                      <Label htmlFor="notes" className="text-right pt-2">Notes</Label>
                      <Textarea id="notes" value={currentExpense.notes} onChange={e => setCurrentExpense({...currentExpense, notes: e.target.value})} className="col-span-3" />
                  </div>
                  {'id' in currentExpense && currentExpense.status === 'Approved' && (
                    <>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="paymentMethod" className="text-right">Payment Method</Label>
                            <Select 
                                value={currentExpense.paymentMethod} 
                                onValueChange={(value: PaymentMethod) => setCurrentExpense({...currentExpense, paymentMethod: value})}>
                                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select payment method..." /></SelectTrigger>
                                <SelectContent>{paymentMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="reimbursedOn" className="text-right">Reimbursed On</Label>
                            <DatePicker date={currentExpense.reimbursedOn ? new Date(currentExpense.reimbursedOn) : undefined} setDate={date => setCurrentExpense({...currentExpense, reimbursedOn: date?.toISOString() || ''})} className="col-span-3" />
                        </div>
                    </>
                  )}
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveExpense}>Save Expense</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
