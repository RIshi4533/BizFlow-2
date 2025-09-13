
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const formatCurrency = (amount: number, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export default function PayslipCard({ payslip }: any) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-lg">{payslip.name}</CardTitle>
                <CardDescription>Month: {payslip.month}</CardDescription>
            </div>
            <Badge variant={payslip.approved ? "default" : "secondary"} className={payslip.approved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                {payslip.approved ? "Approved" : "Pending"}
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 grid grid-cols-2 gap-2 text-sm">
        <div className="font-medium">Basic:</div>
        <div className="text-right">{formatCurrency(payslip.basic, 'INR')}</div>
        
        <div className="font-medium">HRA:</div>
        <div className="text-right">{formatCurrency(payslip.hra, 'INR')}</div>

        <div className="font-medium">Deductions:</div>
        <div className="text-right text-destructive">{formatCurrency(payslip.deductions, 'INR')}</div>
        
        <div className="col-span-2 border-t mt-2 pt-2"></div>
        
        <div className="text-base font-bold">Net Pay:</div>
        <div className="text-base font-bold text-right">{formatCurrency(payslip.netPay, 'INR')}</div>
      </CardContent>
    </Card>
  );
}
