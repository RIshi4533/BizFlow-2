
'use client';

import * as React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  PlusCircle,
  Search,
  Tag,
  FileText,
  Bot,
  Loader,
  Sparkles,
  Edit,
  Trash2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { generateKbArticle } from '@/app/ai-actions';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ArticleStatus = 'Draft' | 'In Progress' | 'Published';

type Article = {
  id: string;
  title: string;
  content: string; // Markdown content
  category: string;
  tags: string[];
  createdAt: string;
  status: ArticleStatus;
};

const initialArticles: Article[] = [
  {
    id: '1',
    title: 'Onboarding New Sales Team Members',
    content: '## Welcome to the Team!\n\nThis guide will walk you through the essential steps for getting started in your new role.\n\n### Week 1 Checklist\n\n- [ ] Complete HR paperwork\n- [ ] Set up your workstation\n- [ ] Meet your mentor',
    category: 'Onboarding',
    tags: ['sales', 'hr'],
    createdAt: new Date().toISOString(),
    status: 'Published',
  },
  {
    id: '2',
    title: 'How to Submit an Expense Report',
    content: '## Expense Reporting Process\n\n1. Navigate to the **Finance > Expenses** module.\n2. Click "Add Expense".\n3. Fill out the required fields and attach receipts.\n4. Submit for approval.',
    category: 'Finance',
    tags: ['expenses', 'guide'],
    createdAt: new Date().toISOString(),
    status: 'Published',
  },
];

const categories = ['All', 'Onboarding', 'Engineering', 'Sales', 'Marketing', 'Finance', 'HR', 'General'];
const statuses: ArticleStatus[] = ['Draft', 'In Progress', 'Published'];

export default function KnowledgePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [articles, setArticles] = React.useState<Article[]>(initialArticles);
  const [selectedArticle, setSelectedArticle] = React.useState<Article | null>(articles[0] || null);
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [searchTerm, setSearchTerm] = React.useState('');

  // Dialog state
  const [isNewArticleDialogOpen, setIsNewArticleDialogOpen] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState('');
  const [newContent, setNewContent] = React.useState('');
  const [newCategory, setNewCategory] = React.useState('General');
  const [newTags, setNewTags] = React.useState('');
  const [newStatus, setNewStatus] = React.useState<ArticleStatus>('Draft');

  // AI State
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const [aiSummary, setAiSummary] = React.useState('');
  const [aiPrompt, setAiPrompt] = React.useState('');

  const getStorageKey = React.useCallback(() => {
    return user ? `bizflow-knowledgebase-${user.uid}` : '';
  }, [user]);

  React.useEffect(() => {
    const storageKey = getStorageKey();
    if (!storageKey) return;

    try {
      const storedArticles = localStorage.getItem(storageKey);
      if (storedArticles) {
        const parsed = JSON.parse(storedArticles);
        setArticles(parsed);
        if(!selectedArticle) setSelectedArticle(parsed[0] || null);
      } else {
        setArticles(initialArticles);
      }
    } catch (error) {
      console.error(error);
      setArticles(initialArticles);
    }
  }, [getStorageKey, selectedArticle]);

  const persistArticles = (updatedArticles: Article[]) => {
    const storageKey = getStorageKey();
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(updatedArticles));
    setArticles(updatedArticles);
  };
  
  const resetForm = () => {
      setNewTitle('');
      setNewContent('');
      setNewCategory('General');
      setNewTags('');
      setNewStatus('Draft');
      setIsNewArticleDialogOpen(false);
  }

  const handleCreateArticle = () => {
    if (!newTitle || !newContent) {
      toast({ title: 'Error', description: 'Title and content are required.', variant: 'destructive' });
      return;
    }
    const newArticle: Article = {
      id: `art_${Date.now()}`,
      title: newTitle,
      content: newContent,
      category: newCategory,
      tags: newTags.split(',').map(tag => tag.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
      status: newStatus,
    };
    const updatedArticles = [newArticle, ...articles];
    persistArticles(updatedArticles);
    setSelectedArticle(newArticle);
    toast({ title: 'Success!', description: 'New article has been created.' });
    resetForm();
  };
  
  const handleUpdateStatus = (articleId: string, status: ArticleStatus) => {
    const updatedArticles = articles.map(a => a.id === articleId ? {...a, status} : a);
    persistArticles(updatedArticles);
    setSelectedArticle(prev => prev && prev.id === articleId ? {...prev, status} : prev);
  }

  const handleDeleteArticle = (articleId: string) => {
    const updatedArticles = articles.filter(a => a.id !== articleId);
    persistArticles(updatedArticles);
    if(selectedArticle?.id === articleId) {
        setSelectedArticle(updatedArticles[0] || null);
    }
    toast({ title: 'Success', description: 'Article deleted.'});
  }

  const handleSummarize = async () => {
    if (!selectedArticle) return;
    setIsAiLoading(true);
    setAiSummary('');
    try {
      // The prompt is now structured for the generateKbArticle flow
      const result = await generateKbArticle({ topic: `Summarize the following article:\n\n${selectedArticle.content}` });
      setAiSummary(result.content);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to generate summary.', variant: 'destructive' });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGenerateArticle = async () => {
    if (!aiPrompt) return;
    setIsAiLoading(true);
    try {
        const result = await generateKbArticle({ topic: aiPrompt });
        setNewTitle(result.title);
        setNewContent(result.content);
        setIsNewArticleDialogOpen(true);
        toast({ title: 'Article Generated!', description: 'Review the content below and save.'});
    } catch (e) {
        console.error(e);
        toast({ title: 'Error', description: 'Failed to generate article.', variant: 'destructive' });
    } finally {
        setIsAiLoading(false);
    }
  };


  const filteredArticles = articles.filter(
    article =>
      (selectedCategory === 'All' || article.category === selectedCategory) &&
      (article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
       article.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const getStatusColor = (status: ArticleStatus) => {
    switch(status) {
        case 'Published': return 'bg-green-100 text-green-800';
        case 'In Progress': return 'bg-yellow-100 text-yellow-800';
        case 'Draft':
        default: return 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
      {/* Sidebar */}
      <div className="md:col-span-1 flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen /> Knowledge Base
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={isNewArticleDialogOpen} onOpenChange={setIsNewArticleDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="w-full"><PlusCircle className="mr-2 h-4 w-4" /> New Article</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Article</DialogTitle>
                    </DialogHeader>
                     <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                 <Select value={newCategory} onValueChange={setNewCategory}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {categories.filter(c=> c !== 'All').map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={newStatus} onValueChange={(value: ArticleStatus) => setNewStatus(value)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="tags">Tags (comma-separated)</Label>
                            <Input id="tags" value={newTags} onChange={e => setNewTags(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="content">Content (Markdown)</Label>
                            <Textarea id="content" value={newContent} onChange={e => setNewContent(e.target.value)} className="min-h-[200px]" />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                           <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleCreateArticle}>Create Article</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {categories.map(cat => (
                        <li key={cat}>
                            <Button variant={selectedCategory === cat ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setSelectedCategory(cat)}>
                                {cat}
                            </Button>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
      </div>

      {/* Article List & Search */}
      <div className="md:col-span-1 flex flex-col gap-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search articles..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <ScrollArea className="border rounded-lg flex-1">
          {filteredArticles.map(article => (
            <div
              key={article.id}
              className={`p-4 border-b cursor-pointer hover:bg-secondary group ${selectedArticle?.id === article.id ? 'bg-secondary' : ''}`}
              onClick={() => setSelectedArticle(article)}
            >
              <div className="flex justify-between items-start">
                  <h3 className="font-semibold truncate pr-2">{article.title}</h3>
                   <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                              <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the article. This action cannot be undone.
                              </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteArticle(article.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
                <span>{article.category}</span>
                <Badge variant="outline" className={getStatusColor(article.status)}>{article.status}</Badge>
              </div>
            </div>
          ))}
          {filteredArticles.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">No articles found.</div>
          )}
        </ScrollArea>
      </div>

      {/* Article Viewer & AI Panel */}
      <div className="md:col-span-2 flex flex-col gap-6">
        <Card className="flex-1">
          {selectedArticle ? (
            <>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                    <CardTitle>{selectedArticle.title}</CardTitle>
                    <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{selectedArticle.category}</Badge>
                        {selectedArticle.tags.map(tag => <Badge key={tag}>{tag}</Badge>)}
                         <Badge variant="secondary" className={getStatusColor(selectedArticle.status)}>{selectedArticle.status}</Badge>
                    </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[40vh] pr-4">
                 <article className="prose prose-sm dark:prose-invert max-w-none">
                   <ReactMarkdown>{selectedArticle.content}</ReactMarkdown>
                </article>
              </ScrollArea>
            </CardContent>
             <CardFooter>
                 <Select value={selectedArticle.status} onValueChange={(value: ArticleStatus) => handleUpdateStatus(selectedArticle.id, value)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Change status..." />
                    </SelectTrigger>
                    <SelectContent>
                        {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
             </CardFooter>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <FileText className="mx-auto h-12 w-12" />
                <p className="mt-4">Select an article to view its content.</p>
              </div>
            </CardContent>
          )}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bot /> AI Assistant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Button onClick={handleSummarize} disabled={!selectedArticle || isAiLoading} className="w-full">
                {isAiLoading && !aiSummary ? <Loader className="animate-spin" /> : 'Summarize Selected Article'}
              </Button>
              {aiSummary && <div className="text-sm mt-2 p-2 bg-secondary rounded-md prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{aiSummary}</ReactMarkdown></div>}
            </div>
             <div className="space-y-2">
                <Textarea placeholder="Or, ask AI to generate a new article... (e.g., 'a guide to effective email marketing')" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} />
                 <Button onClick={handleGenerateArticle} disabled={!aiPrompt || isAiLoading} className="w-full">
                    {isAiLoading && aiSummary === '' ? <Loader className="animate-spin" /> : <><Sparkles className="mr-2 h-4 w-4" /> Generate Article</>}
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
