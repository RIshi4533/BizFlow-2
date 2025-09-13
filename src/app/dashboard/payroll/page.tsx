'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, DollarSign, FilePlus } from 'lucide-react';
import { toast } from 'sonner';

type Employee = {
  id: string;
  name: string;
  role: string;
  department: string;
  salary: number;
  leaves: number;
  overtime: number;
};

export default function PayrollPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch('/api/employees');
        const data = await res.json();
        setEmployees(data.employees || []);
      } catch (err) {
        toast.error('Failed to load employees');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleCreatePayslip = async (employeeId: string) => {
    setProcessingId(employeeId);
    try {
      const res = await fetch('/api/flows/generatePayslip', {
        method: 'POST',
        body: JSON.stringify({ employeeId }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || 'Failed to create payslip');

      toast.success(`Payslip created for ${data.name}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <DollarSign className="w-8 h-8 text-primary" />
            <div>
              <CardTitle>Payroll</CardTitle>
              <CardDescription>
                Generate payslips for individual employees
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="overflow-auto border rounded-lg">
        {loading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
            Loading employees...
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Department</th>
                <th className="px-4 py-2 text-left">Salary</th>
                <th className="px-4 py-2 text-left">Leaves</th>
                <th className="px-4 py-2 text-left">Overtime</th>
                <th className="px-4 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-t">
                  <td className="px-4 py-2">{emp.name}</td>
                  <td className="px-4 py-2">{emp.role}</td>
                  <td className="px-4 py-2">{emp.department}</td>
                  <td className="px-4 py-2">₹{emp.salary}</td>
                  <td className="px-4 py-2">{emp.leaves}</td>
                  <td className="px-4 py-2">{emp.overtime}</td>
                  <td className="px-4 py-2">
                    <Button
                      size="sm"
                      disabled={processingId === emp.id}
                      onClick={() => handleCreatePayslip(emp.id)}
                      className="gap-1"
                    >
                      {processingId === emp.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <FilePlus className="h-4 w-4" />
                          Create Payslip
                        </>
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
