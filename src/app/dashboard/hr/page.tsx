'use client';

import * as React from 'react';
import {
  PlusCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader
} from 'lucide-react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  where,
  FirestoreDataConverter
} from 'firebase/firestore';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { type Employee } from '@/lib/mock-data';

// ---------- Firestore converter for type safety ----------
const employeeConverter: FirestoreDataConverter<Employee> = {
  toFirestore(employee) {
    const { id, ...data } = employee; // Strip id for Firestore
    return data;
  },
  fromFirestore(snapshot, options) {
    const data = snapshot.data(options) as Omit<Employee, 'id'>;
    return { ...data, id: snapshot.id };
  }
};

export default function HrPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const employeesRef = collection(db, 'employees').withConverter(employeeConverter);

  const employeesQuery = user
    ? query(
        employeesRef,
        where('ownerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      )
    : null;

  const [employeesSnapshot, loadingEmployees] = useCollection(employeesQuery);
  const employees = employeesSnapshot?.docs.map(doc => doc.data()) || [];

  // Form/dialog state
  const [open, setOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [currentEmployee, setCurrentEmployee] = React.useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [name, setName] = React.useState('');
  const [role, setRole] = React.useState('');
  const [department, setDepartment] = React.useState('');
  const [jobDescription, setJobDescription] = React.useState('');

  const resetForm = () => {
    setName('');
    setRole('');
    setDepartment('');
    setJobDescription('');
    setCurrentEmployee(null);
    setIsEditing(false);
    setOpen(false);
  };

  const handleOpenDialog = (employee?: Employee) => {
    if (employee) {
      setIsEditing(true);
      setCurrentEmployee(employee);
      setName(employee.name);
      setRole(employee.role);
      setDepartment(employee.department);
      setJobDescription(employee.jobDescription || '');
    } else {
      resetForm();
    }
    setOpen(true);
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!user) {
      toast({ title: 'Error', description: 'Authentication required.', variant: 'destructive' });
      return;
    }
    try {
      await deleteDoc(doc(db, 'employees', id));
      toast({ title: 'Success', description: 'Employee deleted.' });
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast({ title: 'Error', description: 'Could not delete employee.', variant: 'destructive' });
    }
  };

  const handleSubmit = async () => {
    if (!name || !role || !department) {
      toast({ title: 'Error', description: 'Name, role, and department are required.', variant: 'destructive' });
      return;
    }
    if (!user) {
      toast({ title: 'Authentication Error', description: 'You must be logged in to save.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && currentEmployee) {
        await updateDoc(doc(db, 'employees', currentEmployee.id), {
          name,
          role,
          department,
          jobDescription
        });
        toast({ title: 'Success!', description: 'Employee updated.' });
      } else {
        await addDoc(employeesRef, {
          id: '', // converter will remove this
          name,
          role,
          department,
          jobDescription,
          hireDate: new Date().toISOString().split('T')[0],
          ownerId: user.uid, // ✅ needed for rules/query
          createdAt: serverTimestamp() // ✅ needed for orderBy
          ,
          email: ''
        });
        toast({ title: 'Success!', description: 'Employee added.' });
      }
      resetForm();
    } catch (error) {
      console.error("Error saving employee:", error);
      toast({ title: 'Error', description: 'Could not save employee.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Employees</CardTitle>
            <CardDescription>Manage employees, payroll, and recruitment.</CardDescription>
          </div>
          <Button size="sm" className="gap-1" onClick={() => handleOpenDialog()}>
            <PlusCircle className="h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden md:table-cell">Department</TableHead>
              <TableHead className="hidden lg:table-cell">Hire Date</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className="font-medium">{employee.name}</TableCell>
                <TableCell>{employee.role}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge>{employee.department}</Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : ''}
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
                      <DropdownMenuItem onClick={() => handleOpenDialog(employee)}>
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
                              This action cannot be undone. This will permanently delete the employee record.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteEmployee(employee.id)}>Continue</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {employees.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  {loadingEmployees
                    ? <Loader className="mx-auto animate-spin" />
                    : 'No employees found. Add one to get started.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Update the details for this employee."
                  : "Enter the details of the new employee below."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">Role</Label>
                <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="department" className="text-right">Department</Label>
                <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="jobDescription" className="text-right pt-2">Job Desc</Label>
                <div className="col-span-3">
                  <Textarea id="jobDescription" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} className="min-h-[100px]" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting
                  ? <Loader className="mr-2 h-4 w-4 animate-spin"/>
                  : (isEditing ? 'Save Changes' : 'Save Employee')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
