
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Sparkles, User, Bot, Loader } from "lucide-react";
import { runEmployeeAssistant } from '@/app/ai-actions';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';


type Message = {
    role: 'user' | 'assistant';
    content: string;
};

export default function AiAssistantPage() {
    const [query, setQuery] = React.useState('');
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const { toast } = useToast();
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        const userMessage: Message = { role: 'user', content: query };
        setMessages(prev => [...prev, userMessage]);
        setQuery('');
        setIsLoading(true);

        try {
            // Ensure only the current query is sent, trimming here as a safeguard
            const inputPayload = {
                query: query.trim().substring(0, 1000),
            };

            const result = await runEmployeeAssistant(inputPayload);
            const assistantMessage: Message = { role: 'assistant', content: result.response };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error("AI Assistant failed:", error);
            toast({ title: "Error", description: "The AI assistant could not respond.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };


  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
            <MessageSquare className="w-8 h-8 text-primary" />
            <div>
                <CardTitle>AI Employee Assistant</CardTitle>
                <CardDescription>Ask questions and get help with your work.</CardDescription>
            </div>
        </CardHeader>
      </Card>
      
      <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 p-0">
             <ScrollArea className="h-full p-6" ref={scrollAreaRef}>
                 <div className="space-y-6">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                            <Sparkles className="w-12 h-12 mb-4" />
                            <h3 className="text-lg font-semibold">Welcome to the AI Assistant!</h3>
                            <p>You can ask me anything about BizFlow or for general help.</p>
                            <p className="text-sm">Example: "What's the best way to track a new sales lead?"</p>
                        </div>
                    )}
                    {messages.map((message, index) => (
                        <div key={index} className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
                             {message.role === 'assistant' && (
                                 <Avatar className="w-10 h-10 border-2 border-primary">
                                     <AvatarFallback><Bot /></AvatarFallback>
                                 </Avatar>
                             )}
                            <div className={`max-w-xl p-4 rounded-xl ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                                <p>{message.content}</p>
                            </div>
                            {message.role === 'user' && (
                                 <Avatar className="w-10 h-10">
                                     <AvatarFallback><User /></AvatarFallback>
                                 </Avatar>
                             )}
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-start gap-4">
                            <Avatar className="w-10 h-10 border-2 border-primary">
                                <AvatarFallback><Bot /></AvatarFallback>
                            </Avatar>
                            <div className="max-w-xl p-4 rounded-xl bg-secondary flex items-center">
                                <Loader className="w-5 h-5 animate-spin text-muted-foreground" />
                            </div>
                        </div>
                    )}
                 </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-4 border-t">
              <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
                <Input 
                    id="query"
                    placeholder="Type your message..."
                    className="flex-1"
                    autoComplete="off"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={isLoading}
                />
                <Button type="submit" size="icon" disabled={isLoading || !query.trim()}>
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send</span>
                </Button>
              </form>
          </CardFooter>
       </Card>
    </div>
  );
}
