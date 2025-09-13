
import { useEffect, useState } from "react";
import { collection, getDocs, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import PayslipCard from "@/components/payroll/PayslipCard";
import { useAuth } from "@/hooks/use-auth";
import { Loader } from "lucide-react";

export default function PayrollDashboard() {
  const [payslips, setPayslips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
        setIsLoading(false);
        return;
    };
    
    const q = query(collection(db, "payslips"), orderBy("date", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPayslips(data);
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching payslips: ", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-48">
            <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="p-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {payslips.length === 0 && (
            <p className="text-muted-foreground col-span-full text-center">No payslips found.</p>
        )}
      {payslips.map((payslip) => (
        <PayslipCard key={payslip.id} payslip={payslip} />
      ))}
    </div>
  );
}
