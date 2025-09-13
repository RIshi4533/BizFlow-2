
'use client';

import * as React from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, doc, updateDoc, deleteDoc, where, Timestamp } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, AtSign, Send, Loader, Trash2, MoreHorizontal, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
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

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { generateEmailContent } from '@/ai/flows/generate-email-content-flow';


type CampaignStatus = "Sent" | "Draft" | "Sending";

export type EmailCampaign = {
    id: string;
    name: string;
    status: CampaignStatus;
    recipients: string[];
    openRate: number;
    clickRate: number;
    htmlContent?: string;
    createdAt?: any;
    ownerId?: string;
};

export default function EmailMarketingPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [isAiDialogOpen, setIsAiDialogOpen] = React.useState(false);

    const campaignsQuery = user ? query(collection(db, 'campaigns'), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc')) : null;
    const [campaignsSnapshot, loadingCampaigns] = useCollection(campaignsQuery);
    const campaigns: EmailCampaign[] = campaignsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() as any })) || [];
    
    // Form state
    const [name, setName] = React.useState('');
    const [htmlContent, setHtmlContent] = React.useState('<p>Your email content here. Use HTML for formatting.</p>');
    const [aiPrompt, setAiPrompt] = React.useState('');
    const [isAiLoading, setIsAiLoading] = React.useState(false);
    
    const resetForm = () => {
        setName('');
        setHtmlContent('<p>Your email content here. Use HTML for formatting.</p>');
        setAiPrompt('');
    }

    const handleCreateCampaign = async () => {
        if (!name) {
            toast({ title: 'Error', description: 'Campaign name is required.', variant: 'destructive'});
            return;
        }

        if (!user) {
            toast({ title: 'Error', description: 'You must be logged in to create a campaign.', variant: 'destructive'});
            return;
        }

        const newCampaignData = {
            name,
            htmlContent,
            status: 'Draft' as CampaignStatus,
            recipients: [],
            openRate: 0,
            clickRate: 0,
            createdAt: serverTimestamp(),
            ownerId: user.uid,
        };

        try {
            await addDoc(collection(db, "campaigns"), newCampaignData);
            toast({ title: 'Success!', description: 'New campaign created as a draft.' });
            setIsDialogOpen(false);
            resetForm();
        } catch(error) {
            console.error("Error creating campaign:", error);
            toast({ title: 'Error', description: 'Could not create campaign.', variant: 'destructive'});
        }
    }
    
    const handleDeleteCampaign = async (campaignId: string) => {
        if (!user) {
            toast({ title: "Error", description: "Authentication required.", variant: "destructive" });
            return;
        }
        try {
            await deleteDoc(doc(db, "campaigns", campaignId));
            toast({ title: "Success", description: "Campaign has been deleted." });
        } catch (error) {
            toast({ title: "Error", description: "Could not delete campaign.", variant: "destructive" });
        }
    };
    
    const handleGenerateContent = async () => {
        if (!aiPrompt) return;
        setIsAiLoading(true);
        try {
            const result = await generateEmailContent({ topic: aiPrompt });
            setHtmlContent(result.htmlContent);
            toast({ title: "Content Generated!", description: 'AI has created your email content.'});
            setIsAiDialogOpen(false);
        } catch (error) {
             toast({ title: "Error", description: 'Failed to generate content.', variant: 'destructive' });
        } finally {
            setIsAiLoading(false);
        }
    };

    const getStatusVariant = (status: string) => {
        switch(status) {
            case 'Sent': return 'default';
            case 'Draft': return 'secondary';
            case 'Sending': return 'outline';
            default: return 'default';
        }
    }

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'Sent': return 'bg-green-100 text-green-800';
            case 'Sending': return 'bg-blue-100 text-blue-800';
            case 'Draft': return 'bg-gray-100 text-gray-800';
            default: return '';
        }
    }
    
  return (
    <TooltipProvider>
    <div className="flex flex-col gap-6">
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <AtSign className="w-8 h-8 text-primary" />
                        <div>
                            <CardTitle>Email Marketing</CardTitle>
                            <CardDescription>Create, send, and track beautiful email campaigns.</CardDescription>
                        </div>
                    </div>
                     <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-1">
                                <PlusCircle className="h-4 w-4" />
                                New Campaign
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Create New Campaign</DialogTitle>
                                <DialogDescription>Fill out the details below. You can use HTML for the content.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Campaign Name / Subject</Label>
                                    <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Q4 Product Update" />
                                </div>
                                <div className="space-y-2">
                                     <div className="flex items-center justify-between">
                                        <Label htmlFor="htmlContent">Email Content (HTML)</Label>
                                        <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" className="gap-1">
                                                    <Sparkles className="h-4 w-4" /> Generate with AI
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Generate Email Content</DialogTitle>
                                                    <DialogDescription>Describe what the email should be about.</DialogDescription>
                                                </DialogHeader>
                                                <div className="py-4">
                                                    <Textarea
                                                        placeholder="e.g., An announcement for our new Fall collection, highlighting the new sweaters and offering a 15% discount."
                                                        value={aiPrompt}
                                                        onChange={(e) => setAiPrompt(e.target.value)}
                                                        className="min-h-[100px]"
                                                    />
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="outline" onClick={() => setIsAiDialogOpen(false)}>Cancel</Button>
                                                    <Button onClick={handleGenerateContent} disabled={isAiLoading}>
                                                        {isAiLoading ? <Loader className="animate-spin mr-2"/> : <Sparkles className="mr-2 h-4 w-4" />}
                                                        Generate
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                     </div>
                                     <Textarea 
                                        id="htmlContent"
                                        placeholder="<p>Your email content here.</p>" 
                                        value={htmlContent} 
                                        onChange={e => setHtmlContent(e.target.value)}
                                        className="min-h-[200px] font-mono"
                                     />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreateCampaign}>Save as Draft</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Email Campaigns</CardTitle>
                <CardDescription>An overview of your recent email campaigns.</CardDescription>
            </CardHeader>
             <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Campaign</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Recipients</TableHead>
                            <TableHead className="text-right">Open Rate (Simulated)</TableHead>
                            <TableHead className="text-right">Click Rate (Simulated)</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loadingCampaigns && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24"><Loader className="mx-auto animate-spin" /></TableCell>
                            </TableRow>
                        )}
                        {campaigns.map((campaign) => (
                        <TableRow key={campaign.id}>
                            <TableCell className="font-medium">{campaign.name}</TableCell>
                            <TableCell>
                               <Badge variant={getStatusVariant(campaign.status)} className={getStatusClass(campaign.status)}>{campaign.status}</Badge>
                            </TableCell>
                            <TableCell>
                                <div className="text-sm">
                                    {(campaign.recipients || []).length > 0 ? (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="underline decoration-dashed cursor-pointer">
                                                    {(campaign.recipients || []).length} Recipients
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs break-words max-h-48 overflow-y-auto">
                                                <p>{(campaign.recipients || []).join(', ')}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    ) : '—'}
                                </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold">{campaign.status === 'Sent' ? `${campaign.openRate}%` : '—'}</TableCell>
                            <TableCell className="text-right font-semibold">{campaign.status === 'Sent' ? `${campaign.clickRate}%` : '—'}</TableCell>
                            <TableCell className="text-center">
                               <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
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
                                                        This will permanently delete the campaign. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteCampaign(campaign.id)}>Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </DropdownMenuContent>
                               </DropdownMenu>
                            </TableCell>
                        </TableRow>
                        ))}
                         {!loadingCampaigns && campaigns.length === 0 && (
                             <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No campaigns found. Create one to get started.</TableCell>
                            </TableRow>
                         )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
    </TooltipProvider>
  );
}
