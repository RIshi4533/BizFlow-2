import { adminDB } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
 
export async function POST() {
  try {
    const employeesSnapshot = await adminDB.collection('employees').get();

    const payslipPromises = employeesSnapshot.docs.map(async (doc) => {
      const data = doc.data();
      if (!data) return;

      const basicSalary = data.salary || 0;
      const leaves = data.leaves || 0;
      const overtimeHours = data.overtime || 0;

      const leaveDeduction = leaves * 500;
      const overtimeBonus = overtimeHours * 150;
      const netPay = basicSalary - leaveDeduction + overtimeBonus;

      const payslip = {
        employeeId: doc.id,
        name: data.name,
        role: data.role,
        department: data.department,
        salary: basicSalary,
        leaves,
        overtimeHours,
        leaveDeduction,
        overtimeBonus,
        netPay,
        generatedAt: Timestamp.now(),
      };

      await adminDB.collection('payslips').add(payslip);
    });

    await Promise.all(payslipPromises);

    return Response.json({ success: true });
  } catch (err) {
    console.error('Error generating payslips:', err);
    return Response.json(
      { error: 'Failed to generate payslips' },
      { status: 500 }
    );
  }
}
