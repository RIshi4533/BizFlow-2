
'use client';

import * as React from 'react';
import { PlusCircle, Sparkles, Loader, BarChart, X, PackageSearch, Send } from 'lucide-react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, serverTimestamp, query, orderBy, updateDoc, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type Deal, type DealStatus } from './data';
import { type Contact, initialEmployees, type Employee } from '@/lib/mock-data';
import { type AutomationRule } from '@/app/data-actions';
import { runCustomTask, analyzeDeal } from '@/app/ai-actions';
import type { AnalyzeDealOutput } from '@/ai/schemas';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { sendFeatureMessage } from '@/lib/sendFeatureMessage';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';


const statusColumns: { id: DealStatus; title: string }[] = [
  { id: 'lead', title: 'Lead' },
  { id: 'qualified', title: 'Qualified' },
  { id: 'proposal', title: 'Proposal' },
  { id: 'negotiation', title: 'Negotiation' },
  { id: 'closed-won', title: 'Closed Won' },
  { id: 'closed-lost', title: 'Closed Lost' },
];

function SendDealDialog({ open, onOpenChange, onSend, deal, allUsers }: { open: boolean, onOpenChange: (open: boolean) => void, onSend: (recipientId: string, message: string) => void, deal: Deal | null, allUsers: (Omit<Contact, 'createdAt' | 'company' | 'phone'> | Employee)[] }) {
    const [recipientId, setRecipientId] = React.useState('');
    const [message, setMessage] = React.useState('');
    const { toast } = useToast();

    React.useEffect(() => {
        if (deal) {
            setMessage(`FYI: Please take a look at the deal: "${deal.title}" with ${deal.client}.`);
        }
    }, [deal]);

    const handleSend = () => {
        if (!recipientId) {
            toast({ title: "Error", description: "Please select a recipient.", variant: "destructive" });
            return;
        }
        onSend(recipientId, message);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Send Deal to a User</DialogTitle>
                    <DialogDescription>Select a user to notify them about deal: {deal?.title}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div>
                        <Label htmlFor="recipient">Recipient</Label>
                        <Select value={recipientId} onValueChange={setRecipientId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a user..."/>
                            </SelectTrigger>
                            <SelectContent>
                                {allUsers.map(u => (
                                    <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="message">Message (Optional)</Label>
                        <Textarea 
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                      <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                      <Button onClick={handleSend} disabled={!recipientId}>
                        <Send className="mr-2 h-4 w-4" /> Send Notification
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function SalesPage() {
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [title, setTitle] = React.useState('');
  const [client, setClient] = React.useState('');
  const [value, setValue] = React.useState('');
  const [status, setStatus] = React.useState<DealStatus>('lead');

  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<AnalyzeDealOutput | null>(null);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = React.useState(false);
  
  const [isSendDialogOpen, setIsSendDialogOpen] = React.useState(false);
  const [currentDeal, setCurrentDeal] = React.useState<Deal | null>(null);

  const dealsQuery = user ? query(collection(db, 'deals'), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc')) : null;
  const [dealsSnapshot, loadingDeals] = useCollection(dealsQuery);
  const deals: Deal[] = dealsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() as any })) || [];
  
  const contactsSnapshotQuery = user ? query(collection(db, 'contacts'), where('ownerId', '==', user.uid)) : null;
  const [contactsSnapshot, loadingContacts] = useCollection(contactsSnapshotQuery);
  const contacts: Contact[] = contactsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() as any })) || [];

  const [automationsSnapshot, loadingAutomations] = useCollection(collection(db, 'automations'));
  const automations: AutomationRule[] = automationsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() as any })) || [];

  const { toast } = useToast();

  const allUsers = React.useMemo(() => {
    const employeesAsContacts: Omit<Contact, 'createdAt' | 'company' | 'phone'>[] = initialEmployees;

    const combined = [...contacts, ...employeesAsContacts];
    // This is a simple way to get unique users by ID. A real app might need more robust merging.
    return Array.from(new Map(combined.map(item => [item.id, item])).values());
  }, [contacts]);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  const handleAddDeal = async () => {
    if (!title || !client || !value) {
        toast({ title: "Error", description: "Title, client, and value are required.", variant: 'destructive'});
        return;
    }
    if (!user) {
        toast({ title: 'Authentication Error', description: 'You must be logged in to add a deal.', variant: 'destructive' });
        return;
    }
    
    setIsSubmitting(true);
    try {
        const dealValue = parseFloat(value);
        const newDealData = {
          title,
          client,
          value: dealValue,
          status,
          products: [],
          ownerId: user.uid,
          createdAt: serverTimestamp(),
        };
        
        const newDoc = await addDoc(collection(db, 'deals'), newDealData);
        
        if (newDealData.status === 'closed-won') {
          await handleDealWon({ ...newDealData, id: newDoc.id } as Deal);
        }

        toast({ title: 'Success!', description: 'New deal added.'});
        setTitle('');
        setClient('');
        setValue('');
        setStatus('lead');
        setOpen(false);
    } catch(error) {
        toast({ title: 'Error', description: 'Could not add deal.', variant: 'destructive'});
        console.error("Error adding deal: ", error);
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleDealWon = async (deal: Deal) => {
     try {
        await addDoc(collection(db, 'transactions'), {
          description: `Client Payment - ${deal.client} (${deal.title})`,
          amount: deal.value,
          date: new Date().toISOString(),
          status: 'Cleared'
        });
        
        toast({
          title: "Integration Success!",
          description: `Deal marked as won. A new transaction of ${formatCurrency(deal.value)} has been added to Accounting.`,
        });

        const dealRule = automations.find(r => r.model === 'deal' && r.trigger === 'on_update' && r.active);
        
        if (dealRule && dealRule.action === 'custom' && dealRule.customActionPrompt) {
            toast({ title: "Automation Triggered", description: `Running: ${dealRule.name}`});
            const result = await runCustomTask({ prompt: dealRule.customActionPrompt, context: deal});
            toast({ title: "Automation Finished", description: result.result });
        }

      } catch (error) {
         toast({
          title: "Integration Error",
          description: "Could not create accounting transaction or run automation.",
          variant: 'destructive'
        });
      }
  };

  const handleAnalyzeDeal = async (deal: Deal) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setCurrentDeal(deal); // Set the current deal for the dialog
    setIsAnalysisDialogOpen(true);
    try {
        const result = await analyzeDeal({ deal });
        setAnalysisResult(result);
    } catch(error) {
        console.error("Deal analysis failed", error);
        toast({ title: "Error", description: "Could not analyze the deal.", variant: "destructive"});
        setIsAnalysisDialogOpen(false);
    } finally {
        setIsAnalyzing(false);
    }
  }

  const handleOpenSendDialog = (deal: Deal) => {
    setCurrentDeal(deal);
    setIsAnalysisDialogOpen(false);
    setIsSendDialogOpen(true);
  };

  const handleSendDeal = async (recipientId: string, message: string) => {
    if (!recipientId || !currentDeal || !user) {
        toast({ title: "Error", description: "No recipient or deal selected.", variant: "destructive" });
        return;
    }
    
    const recipient = allUsers.find(u => u.id === recipientId);
    if (!recipient) return;
    
    try {
        await sendFeatureMessage('Sales', 'Contacts', message, user.uid, recipientId, currentDeal.id);
        toast({ title: "Deal Sent!", description: `A notification has been sent to ${recipient.name}.` });
        setIsSendDialogOpen(false);
    } catch (error) {
        toast({ title: "Error", description: "Could not send notification.", variant: "destructive" });
    }
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales Pipeline</h1>
          <p className="text-muted-foreground">Automate your sales process and close more deals.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              Add Deal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add a New Deal</DialogTitle>
              <DialogDescription>
                Fill in the details for the new sales deal.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" placeholder="e.g. Q4 Marketing Contract" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client" className="text-right">
                  Client
                </Label>
                <Input id="client" value={client} onChange={(e) => setClient(e.target.value)} className="col-span-3" placeholder="Client's company name" />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="value" className="text-right">
                  Value ($)
                </Label>
                <Input id="value" type="number" value={value} onChange={(e) => setValue(e.target.value)} className="col-span-3" placeholder="e.g. 5000" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                 <Select onValueChange={(value: DealStatus) => setStatus(value)} defaultValue={status}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusColumns.map((col) => (
                       <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddDeal} disabled={isSubmitting}>{isSubmitting ? <Loader className="mr-2 h-4 w-4 animate-spin"/> : 'Add Deal'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-6">
        {statusColumns.map((column) => (
          <div
            key={column.id}
            className="p-4 rounded-lg flex flex-col bg-secondary/50"
          >
            <h2 className="mb-4 font-semibold tracking-tight text-center">{column.title}</h2>
            <div className="flex-1 space-y-4 min-h-[100px]">
              {loadingDeals ? <Loader className="mx-auto animate-spin" /> : deals
                .filter((deal) => deal.status === column.id)
                .map((deal) => (
                  <Card key={deal.id} className="bg-background">
                    <CardHeader className="p-4">
                      <CardTitle className="text-base">{deal.title}</CardTitle>
                      <CardDescription>{deal.client}</CardDescription>
                      <p className="pt-2 font-semibold text-primary">{formatCurrency(deal.value)}</p>
                    </CardHeader>
                    <CardFooter className="p-2 pt-0">
                      <Button variant="outline" size="sm" className="w-full gap-1" onClick={() => handleAnalyzeDeal(deal)}>
                        <Sparkles className="w-4 h-4" />
                        Analyze with AI
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              {deals.filter((deal) => deal.status === column.id).length === 0 && !loadingDeals && (
                 <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-center text-muted-foreground">No deals here.</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

       <Dialog open={isAnalysisDialogOpen} onOpenChange={setIsAnalysisDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart className="w-6 h-6 text-primary" />
              AI Deal Analysis
            </DialogTitle>
             <DialogDescription>
                Here is the AI's assessment of this sales deal.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-6">
            {isAnalyzing && (
                <div className="flex items-center justify-center h-48">
                <Loader className="w-8 h-8 animate-spin text-primary" />
                </div>
            )}
            {analysisResult && (
                <div className="space-y-4 py-4">
                <div>
                    <Label>Close Probability</Label>
                    <div className="flex items-center gap-2">
                        <Progress value={analysisResult.closeProbability} className="w-full" />
                        <span className="font-semibold">{analysisResult.closeProbability}%</span>
                    </div>
                </div>
                <div>
                    <Label>Risk Analysis</Label>
                    <p className="text-sm p-3 bg-secondary rounded-md">{analysisResult.riskAnalysis}</p>
                </div>
                <div>
                    <Label className="flex items-center gap-2"><PackageSearch className="w-4 h-4" />Inventory Check</Label>
                    <p className="text-sm p-3 bg-secondary rounded-md">{analysisResult.inventoryCheck}</p>
                </div>
                <div>
                    <Label>Suggested Next Step</Label>
                    <p className="text-sm p-3 bg-secondary rounded-md">{analysisResult.suggestedNextStep}</p>
                </div>
                </div>
            )}
          </ScrollArea>
          <DialogFooter className="sm:justify-between pt-4 border-t">
              <Button onClick={() => currentDeal && handleOpenSendDialog(currentDeal)} variant="outline" disabled={!analysisResult}>
                <Send className="mr-2 h-4 w-4"/>
                Send to User
              </Button>
              <Button type="button" onClick={() => setIsAnalysisDialogOpen(false)}>
                Close
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

        <SendDealDialog 
            open={isSendDialogOpen} 
            onOpenChange={setIsSendDialogOpen} 
            onSend={handleSendDeal}
            deal={currentDeal}
            allUsers={allUsers}
        />
    </div>
  );
}
