
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, MessageSquare, Send, Hash, Users, Search, PlusCircle, AtSign, Smile, CornerDownRight, Bot, User, UserPlus, Loader, Trash2, Settings } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, query, addDoc, onSnapshot, orderBy, serverTimestamp, doc, setDoc, updateDoc, arrayUnion, arrayRemove, getDoc, getDocs, where } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { initialEmployees, type Contact } from '@/lib/mock-data';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { UnifiedContact } from '@/app/data-actions';
import { Label } from '@/components/ui/label';
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


type Message = {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    createdAt: any;
    replyTo?: {
        id: string;
        text: string;
        senderName: string;
    };
    reactions?: { [emoji: string]: string[] };
};

export type Channel = {
    id: string;
    name: string;
    type: 'channel' | 'dm';
    lastMessage?: string;
    timestamp?: any;
    unread?: number;
    members?: string[];
    memberIds: string[]; // Always an array of user IDs
};


const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];


function AddMemberDialog({ open, onOpenChange, channel, onMemberAdded }: { open: boolean, onOpenChange: (open: boolean) => void, channel: Channel | null, onMemberAdded: (user: UnifiedContact) => void }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [searchEmail, setSearchEmail] = React.useState('');
    const [foundContact, setFoundContact] = React.useState<UnifiedContact | null>(null);
    const [isSearching, setIsSearching] = React.useState(false);

    const findUserByEmail = async (email: string): Promise<UnifiedContact | null> => {
        const normalizedEmail = email.toLowerCase();
        
        // Search employees first (simulating registered users)
        const employee = initialEmployees.find(e => e.email.toLowerCase() === normalizedEmail);
        if (employee) {
            return { id: employee.id, name: employee.name, email: employee.email, isEmployee: true };
        }
        
        // Then search contacts in Firestore
        if (!user) return null;
        const q = query(collection(db, 'contacts'), where('email', '==', normalizedEmail), where('ownerId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const data = doc.data() as Contact;
            return { id: doc.id, name: data.name, email: data.email, isEmployee: false };
        }

        return null;
    }


    const resetState = () => {
        setSearchEmail('');
        setFoundContact(null);
        setIsSearching(false);
    };

    const handleFindUser = async () => {
        if (!searchEmail.trim()) {
            toast({ title: "Error", description: "Please enter an email address.", variant: "destructive" });
            return;
        }
        setIsSearching(true);
        const result = await findUserByEmail(searchEmail);
        setIsSearching(false);
        
        if (result) {
            if (channel?.memberIds?.includes(result.id) || channel?.members?.includes(result.name)) {
                toast({ title: "User Already in Channel", description: `${result.name} is already a member.`, variant: "default" });
                setFoundContact(null);
            } else {
                setFoundContact(result);
                toast({ title: "User Found!", description: `Click "Add to Channel" to invite ${result.name}.` });
            }
        } else {
            setFoundContact(null);
            toast({ title: "User Not Found", description: "No contact or employee found with that email.", variant: "destructive" });
        }
    };
    
    const handleAddMember = () => {
        if (!foundContact || !channel) return;
        onMemberAdded(foundContact);
        onOpenChange(false);
        resetState();
    };


    return (
         <Dialog open={open} onOpenChange={(isOpen) => { onOpenChange(isOpen); if (!isOpen) resetState(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Member to {channel?.type === 'channel' ? `#${channel?.name}` : channel?.name}</DialogTitle>
                    <DialogDescription>
                        Search for a registered user by email to add them to this conversation.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                     <div className="flex items-center space-x-2">
                           <Input
                                placeholder="user@example.com"
                                value={searchEmail}
                                onChange={(e) => setSearchEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleFindUser()}
                            />
                            <Button onClick={handleFindUser} disabled={isSearching} size="icon">
                                {isSearching ? <Loader className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            </Button>
                        </div>
                    {foundContact && (
                         <div className="p-2 flex items-center justify-between gap-3 rounded-md bg-secondary">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>{foundContact.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{foundContact.name}</p>
                                    <p className="text-sm text-muted-foreground">{foundContact.email}</p>
                                </div>
                            </div>
                                {foundContact.isEmployee && <Badge variant="secondary">Employee</Badge>}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleAddMember} disabled={!foundContact}>Add to Conversation</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}



export default function DiscussPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [activeView, setActiveView] = React.useState<'channels' | 'dms'>('channels');
    const [conversations, setConversations] = React.useState<Channel[]>([]);
    const [selectedConversation, setSelectedConversation] = React.useState<Channel | null>(null);
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [newMessage, setNewMessage] = React.useState('');
    const [replyingTo, setReplyingTo] = React.useState<Message | null>(null);
    const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = React.useState(false);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!user) return;
        
        const q = query(
            collection(db, 'conversations'), 
            where('memberIds', 'array-contains', user.uid),
            orderBy('timestamp', 'desc')
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const convos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel));
            setConversations(convos);
            if (!selectedConversation && convos.length > 0) {
                setSelectedConversation(convos[0]);
            }
        });
        
        return () => unsub();
    }, [user, selectedConversation]);


    React.useEffect(() => {
        setMessages([]); 

        if (!selectedConversation) return;
        
        const q = query(
            collection(db, 'conversations', selectedConversation.id, 'messages'),
            orderBy('createdAt')
        );

        const unsub = onSnapshot(q, (snap) => {
            const msgs = snap.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                } as Message;
            });
            setMessages(msgs);
        });

        return () => unsub();
    }, [selectedConversation]);


    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSelectConversation = async (conversation: Channel) => {
        setMessages([]); // Clear messages immediately on selection
        setSelectedConversation(conversation);
        if (conversation.unread) {
            const convRef = doc(db, 'conversations', conversation.id);
            await updateDoc(convRef, { unread: 0 });
        }
    };


    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation || !user) return;
        
        const senderName = user.email?.split('@')[0] || 'User';

        let messageData: any = {
            text: newMessage,
            senderId: user.uid,
            senderName: senderName,
            createdAt: serverTimestamp(),
            reactions: {},
        };
        
        if (replyingTo) {
            messageData.replyTo = {
                id: replyingTo.id,
                text: replyingTo.text,
                senderName: replyingTo.senderName
            };
        }

        await addDoc(collection(db, 'conversations', selectedConversation.id, 'messages'), messageData);
        
        const channelRef = doc(db, "conversations", selectedConversation.id);
        await setDoc(channelRef, { lastMessage: newMessage, timestamp: serverTimestamp() }, { merge: true });

        setNewMessage('');
        setReplyingTo(null);
    };

    const handleReaction = async (messageId: string, emoji: string) => {
        if (!selectedConversation || !user) return;
        const messageRef = doc(db, 'conversations', selectedConversation.id, 'messages', messageId);
        const message = messages.find(m => m.id === messageId);
        if (!message) return;

        const currentReactions = message.reactions || {};
        const userList = currentReactions[emoji] || [];

        if (userList.includes(user.uid)) {
            const updatedUserList = userList.filter(uid => uid !== user.uid);
            if (updatedUserList.length === 0) {
                delete currentReactions[emoji];
            } else {
                currentReactions[emoji] = updatedUserList;
            }
        } else {
            currentReactions[emoji] = [...userList, user.uid];
        }

        await updateDoc(messageRef, { reactions: currentReactions });
    };
    
    const handleMemberAdded = async (newUser: UnifiedContact) => {
        if (!selectedConversation) return;

        const convRef = doc(db, 'conversations', selectedConversation.id);

        try {
            // Update Firestore document
            await updateDoc(convRef, {
                members: arrayUnion(newUser.name),
                memberIds: arrayUnion(newUser.id)
            });

            const isChannel = selectedConversation.type === 'channel';
            // For DMs, update the name to reflect a group chat
            if (!isChannel) {
                const updatedMembers = [...(selectedConversation.members || []), newUser.name];
                await updateDoc(convRef, { name: updatedMembers.join(', ')});
            }


            toast({ title: 'Member Added', description: `${newUser.name} has been added.` });
        } catch (error) {
            console.error("Error adding member: ", error);
            toast({ title: 'Error', description: 'Could not add member.', variant: 'destructive' });
        }
    };

    const handleRemoveMember = async (memberIdToRemove: string, memberNameToRemove: string) => {
        if (!selectedConversation || !user) return;
        
        // Prevent removing the current user
        if (memberIdToRemove === user.uid) {
            toast({title: "Cannot remove yourself", variant: "destructive"});
            return;
        }

        const convRef = doc(db, 'conversations', selectedConversation.id);

        try {
             // Update Firestore document
            await updateDoc(convRef, {
                members: arrayRemove(memberNameToRemove),
                memberIds: arrayRemove(memberIdToRemove)
            });
            
            const isChannel = selectedConversation.type === 'channel';
            // For DMs, update the name to reflect the remaining members
            if (!isChannel) {
                const updatedMembers = (selectedConversation.members || []).filter(name => name !== memberNameToRemove);
                await updateDoc(convRef, { name: updatedMembers.join(', ')});
            }
            
            toast({ title: 'Member Removed', description: `${memberNameToRemove} has been removed.` });
        } catch (error) {
            console.error("Error removing member:", error);
            toast({ title: 'Error', description: 'Could not remove member.', variant: 'destructive' });
        }
    };

    
    const conversationList = conversations.filter(c => c.type === activeView);

    return (
        <div className="flex h-[calc(100vh-8rem)]">
            {/* Sidebar */}
            <div className="w-80 border-r flex flex-col">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold capitalize">Discuss</h2>
                </div>
                 <div className="p-2 border-b">
                    <div className="flex gap-1 bg-muted p-1 rounded-md">
                        <Button 
                            variant={activeView === 'channel' ? 'secondary' : 'ghost'} 
                            className="flex-1"
                            onClick={() => setActiveView('channel')}
                        >
                           <Hash className="w-4 h-4 mr-2" /> Channels
                        </Button>
                        <Button 
                            variant={activeView === 'dm' ? 'secondary' : 'ghost'} 
                            className="flex-1"
                            onClick={() => setActiveView('dm')}
                        >
                           <Users className="w-4 h-4 mr-2" /> DMs
                        </Button>
                    </div>
                </div>
                <ScrollArea className="flex-1">
                    {conversationList.map(channel => (
                        <div 
                            key={channel.id} 
                            className={cn(
                                "flex items-start gap-3 p-3 border-b cursor-pointer hover:bg-secondary/50",
                                selectedConversation?.id === channel.id && "bg-secondary"
                            )}
                            onClick={() => handleSelectConversation(channel)}
                        >
                            {channel.type === 'channel' ? <Hash className="w-5 h-5 text-muted-foreground mt-1" /> : <Avatar className="w-8 h-8"><AvatarFallback>{channel.name.charAt(0)}</AvatarFallback></Avatar>}
                            <div className="flex-1 overflow-hidden">
                                <p className="font-semibold truncate">{channel.name}</p>
                                <p className="text-sm text-muted-foreground truncate">{channel.lastMessage}</p>
                            </div>
                            {channel.unread && (
                                <Badge className="h-5 w-5 flex items-center justify-center p-0">{channel.unread}</Badge>
                            )}
                        </div>
                    ))}
                </ScrollArea>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                    <>
                        <header className="p-4 border-b flex justify-between items-center">
                            <div>
                                 <h3 className="text-lg font-semibold flex items-center gap-2">
                                    {selectedConversation.type === 'channel' ? <Hash className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                                    {selectedConversation.name}
                                 </h3>
                                 <p className="text-sm text-muted-foreground">
                                    {selectedConversation.members?.join(', ') || 'No members yet.'}
                                 </p>
                            </div>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <Settings className="h-5 w-5" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <h4 className="font-medium leading-none">Conversation Settings</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Manage members and other settings.
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                             <Label>Members ({selectedConversation.members?.length || 0})</Label>
                                             <ScrollArea className="h-40">
                                                 <div className="space-y-2 pr-4">
                                                    {(selectedConversation.members || []).map((memberName, idx) => {
                                                        const memberId = selectedConversation.memberIds?.[idx] || '';
                                                        return (
                                                            <div key={memberId || memberName} className="flex items-center justify-between">
                                                                <span>{memberName}</span>
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" disabled={memberId === user?.uid}>
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Remove {memberName}?</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                Are you sure you want to remove this member from the conversation?
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                            <AlertDialogAction onClick={() => handleRemoveMember(memberId, memberName)}>Remove</AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            </div>
                                                        )
                                                    })}
                                                 </div>
                                             </ScrollArea>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => setIsAddMemberDialogOpen(true)}>
                                            <UserPlus className="mr-2 h-4 w-4" /> Add Member
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </header>
                        <ScrollArea className="flex-1 p-6 bg-secondary/20">
                            <div className="space-y-6">
                                {messages.map(msg => (
                                    <div key={msg.id} className={cn("flex items-end gap-3 group", msg.senderId === user?.uid && "justify-end")}>
                                        {msg.senderId !== user?.uid && (
                                             <Avatar className="h-8 w-8">
                                                <AvatarFallback><User /></AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div className={cn("max-w-md rounded-xl p-3", msg.senderId === user?.uid ? "bg-primary text-primary-foreground" : "bg-background")}>
                                            <p className="font-bold text-sm">{msg.senderName}</p>
                                            {msg.replyTo && (
                                                <div className="text-xs p-2 border-l-2 border-primary/50 bg-primary/20 rounded-r-md mb-1">
                                                    <p className="font-semibold">{msg.replyTo.senderName}</p>
                                                    <p className="truncate">{msg.replyTo.text}</p>
                                                </div>
                                            )}
                                            <p className="text-base">{msg.text}</p>
                                             <p className={cn("text-xs mt-1 text-right", msg.senderId === user?.uid ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                                {msg.createdAt ? formatDistanceToNow(msg.createdAt, { addSuffix: true }) : 'Just now'}
                                            </p>
                                             <div className="flex gap-1 mt-1">
                                                {msg.reactions && Object.entries(msg.reactions).map(([emoji, uids]) => (
                                                    (uids as string[]).length > 0 && (
                                                    <Badge 
                                                        key={emoji}
                                                        variant="secondary"
                                                        className={cn(
                                                            "cursor-pointer transition-colors",
                                                            (uids as string[]).includes(user?.uid || '') && "bg-primary/20 border-primary"
                                                        )}
                                                        onClick={() => handleReaction(msg.id, emoji)}
                                                    >
                                                        {emoji} {(uids as string[]).length}
                                                    </Badge>
                                                    )
                                                ))}
                                            </div>
                                        </div>
                                         <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7"><Smile /></Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="p-1 w-auto">
                                                     <div className="flex gap-1">
                                                        {emojis.map(emoji => (
                                                            <Button key={emoji} variant="ghost" size="icon" onClick={() => handleReaction(msg.id, emoji)}>
                                                                {emoji}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setReplyingTo(msg)}>
                                                <CornerDownRight />
                                            </Button>
                                        </div>
                                         {msg.senderId === user?.uid && (
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback><Bot /></AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>
                        <div className="p-4 border-t bg-background">
                            {replyingTo && (
                                <div className="p-2 text-sm bg-secondary rounded-t-md flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">Replying to {replyingTo.senderName}</p>
                                        <p className="text-muted-foreground truncate">{replyingTo.text}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setReplyingTo(null)}>X</Button>
                                </div>
                            )}
                            <form 
                                className="flex items-center gap-2"
                                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                            >
                                <Input 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={`Message ${selectedConversation.name}`}
                                    className="flex-1"
                                />
                                <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <MessageSquare className="w-12 h-12 mb-4" />
                        <h3 className="text-lg font-semibold">Select a conversation</h3>
                        <p>Choose a channel or direct message to start chatting.</p>
                    </div>
                )}
            </div>
            <AddMemberDialog 
                open={isAddMemberDialogOpen} 
                onOpenChange={setIsAddMemberDialogOpen} 
                channel={selectedConversation}
                onMemberAdded={handleMemberAdded}
            />
        </div>
    );
}
