
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrainCircuit, PlusCircle, Trash2, Edit, Play, Square, Loader } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  type AutomationRule,
} from '@/app/data-actions';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, query, where, serverTimestamp, orderBy } from 'firebase/firestore';


const initialRule: Omit<AutomationRule, 'id'> = {
  name: '',
  model: 'deal',
  trigger: 'on_update',
  action: 'generate_follow_up',
  active: true,
  customActionPrompt: '',
};

export default function AiAutomationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const automationsQuery = user ? query(collection(db, 'automations'), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc')) : null;
  const [automationsSnapshot, loadingAutomations] = useCollection(automationsQuery);
  const rules: AutomationRule[] = automationsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() as any })) || [];
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [currentRule, setCurrentRule] = React.useState<Omit<AutomationRule, 'id'> | AutomationRule>(initialRule);

  const handleOpenDialog = (rule?: AutomationRule) => {
    if (rule) {
      setCurrentRule(rule);
      setIsEditing(true);
    } else {
      setCurrentRule(initialRule);
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };

  const handleSaveRule = async () => {
    if (!user) {
        toast({ title: "Authentication Error", description: "You must be logged in to save a rule.", variant: "destructive" });
        return;
    }
    if (!currentRule.name) {
       toast({ title: "Error", description: "Rule name is required.", variant: "destructive" });
       return;
    }
    
    try {
      if (isEditing && 'id' in currentRule) {
        const docRef = doc(db, 'automations', currentRule.id);
        const { name, model, trigger, action, active, customActionPrompt } = currentRule;
        await updateDoc(docRef, { name, model, trigger, action, active, customActionPrompt });
        toast({ title: "Success", description: "Automation rule updated." });
      } else {
        await addDoc(collection(db, 'automations'), {
          ...currentRule,
          ownerId: user.uid,
          createdAt: serverTimestamp(),
        });
        toast({ title: "Success", description: "Automation rule created." });
      }
      setIsDialogOpen(false);
      setCurrentRule(initialRule);
    } catch(error) {
       console.error("Error saving rule:", error);
       toast({ title: "Error", description: "Could not save the rule. Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <BrainCircuit className="w-8 h-8 text-primary" />
              <div>
                <CardTitle>AI Automation Rules</CardTitle>
                <CardDescription>Create rules to automate tasks using AI.</CardDescription>
              </div>
            </div>
             <Dialog open={isDialogOpen} onOpenChange={(open) => {
                if (!open) {
                    setCurrentRule(initialRule);
                    setIsEditing(false);
                }
                setIsDialogOpen(open);
             }}>
                <DialogTrigger asChild>
                    <Button size="sm" className="gap-1" onClick={() => handleOpenDialog()}>
                        <PlusCircle className="h-4 w-4" />
                        Create Automation
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit' : 'Create'} Automation Rule</DialogTitle>
                        <DialogDescription>
                            Set up a trigger and an AI-powered action to automate your workflow.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="rule-name" className="text-right">Name</Label>
                            <Input 
                                id="rule-name" 
                                className="col-span-3" 
                                placeholder="e.g., 'Generate Sales Follow-up'"
                                value={currentRule.name}
                                onChange={e => setCurrentRule({...currentRule, name: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="model" className="text-right">On Model</Label>
                             <Select value={currentRule.model} onValueChange={value => setCurrentRule({...currentRule, model: value as any})}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a model..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="deal">Sales Deal</SelectItem>
                                    <SelectItem value="contact">Contact</SelectItem>
                                    <SelectItem value="task">Project Task</SelectItem>
                                    <SelectItem value="helpdesk">Helpdesk Ticket</SelectItem>
                                    <SelectItem value="employee">Employee</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="trigger" className="text-right">Trigger</Label>
                            <Select value={currentRule.trigger} onValueChange={value => setCurrentRule({...currentRule, trigger: value as any})}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a trigger..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="on_update">When a record is updated</SelectItem>
                                    <SelectItem value="on_create">When a record is created</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="action" className="text-right">AI Action</Label>
                           <Select value={currentRule.action} onValueChange={value => setCurrentRule({...currentRule, action: value as any})}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select an AI Action..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="generate_follow_up">Generate Follow-up Email</SelectItem>
                                    <SelectItem value="categorize">Auto-Categorize</SelectItem>
                                    <SelectItem value="generate_job_description">Generate Job Description</SelectItem>
                                    <SelectItem value="custom">Custom AI Action</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {currentRule.action === 'custom' && (
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label htmlFor="custom-prompt" className="text-right pt-2">Custom Prompt</Label>
                                <Textarea
                                    id="custom-prompt"
                                    className="col-span-3 min-h-[100px]"
                                    placeholder="e.g., 'Summarize this contact\'s recent activity and suggest the next best action.'"
                                    value={currentRule.customActionPrompt}
                                    onChange={e => setCurrentRule({...currentRule, customActionPrompt: e.target.value})}
                                />
                            </div>
                        )}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="active" className="text-right">Active</Label>
                            <Switch 
                                id="active" 
                                checked={currentRule.active} 
                                onCheckedChange={checked => setCurrentRule({...currentRule, active: checked})}
                             />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveRule}>Save Rule</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </CardHeader>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Your Automations</CardTitle>
            <CardDescription>Here is a list of all the automation rules you've configured.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Rule Name</TableHead>
                        <TableHead>Applies To</TableHead>
                        <TableHead>Trigger</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rules.map(rule => (
                        <TableRow key={rule.id}>
                            <TableCell className="font-medium">{rule.name}</TableCell>
                            <TableCell>
                                <Badge variant="outline">{rule.model.charAt(0).toUpperCase() + rule.model.slice(1)}</Badge>
                            </TableCell>
                            <TableCell>
                                {rule.trigger === 'on_update' ? 'On Update' : 'On Create'}
                            </TableCell>
                             <TableCell>
                                <Badge variant={rule.active ? 'default' : 'secondary'} className={`transition-colors ${rule.active ? 'bg-green-100 text-green-800' : ''}`}>
                                    {rule.active ? 'Active' : 'Inactive'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" className="transition-colors hover:bg-accent" onClick={() => handleOpenDialog(rule)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                     {rules.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                {loadingAutomations ? <Loader className="mx-auto animate-spin" /> : 'No automation rules created yet.'}
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
