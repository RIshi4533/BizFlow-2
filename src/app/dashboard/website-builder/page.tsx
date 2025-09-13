
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { getWebsiteFeedback } from '@/app/ai-actions';
import type { WebsiteFeedbackOutput } from '@/ai/schemas';
import { Sparkles, Loader, Save, FileText, Trash2, FolderOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { HtmlRenderer } from '@/components/website-builder/HtmlRenderer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';


const initialHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Awesome Website</title>
    <meta name="description" content="A great starting point for your new website.">
    <script src="https://cdn.tailwindcss.com"><\/script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <style>
      body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-gray-100">
    <header class="bg-white shadow">
        <nav class="container mx-auto px-6 py-4">
            <div class="text-2xl font-bold text-gray-800">MyBrand</div>
        </nav>
    </header>
    <main class="container mx-auto px-6 py-12">
        <div class="text-center">
            <h1 class="text-4xl font-extrabold text-gray-900">Build Something Amazing</h1>
            <p class="mt-4 text-lg text-gray-600">This is a starting point for your new website. Let's make it great.</p>
        </div>
        <div class="mt-12">
            <img src="https://placehold.co/1200x500.png" alt="A placeholder image showing a beautiful landscape" class="rounded-lg shadow-xl mx-auto" />
        </div>
    </main>
</body>
</html>
`;

type Project = {
    id: string;
    name: string;
    html: string;
    savedAt: string;
};


export default function WebsiteBuilderPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [editorHtml, setEditorHtml] = React.useState(initialHtml);
    
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);
    const [feedback, setFeedback] = React.useState<WebsiteFeedbackOutput | null>(null);

    const [activeTab, setActiveTab] = React.useState('builder');
    const [savedProjects, setSavedProjects] = React.useState<Project[]>([]);
    const [isSaveDialogOpen, setIsSaveDialogOpen] = React.useState(false);
    const [projectName, setProjectName] = React.useState('New Project');

    const getProjectsStorageKey = React.useCallback(() => {
        return user ? `bizflow-saved-websites-${user.uid}` : null;
    }, [user]);

    // Load saved projects from localStorage
    React.useEffect(() => {
        const key = getProjectsStorageKey();
        if (key) {
            const stored = localStorage.getItem(key);
            if (stored) {
                setSavedProjects(JSON.parse(stored));
            }
        }
    }, [getProjectsStorageKey]);

    const handleOpenSaveDialog = () => {
        setProjectName('My New Website'); // Reset name
        setIsSaveDialogOpen(true);
    };

    const handleSaveProject = () => {
        if (!projectName.trim()) {
            toast({ title: "Error", description: "Please enter a project name.", variant: "destructive" });
            return;
        }

        const key = getProjectsStorageKey();
        if (!key) return;

        const newProject: Project = {
            id: `proj_${Date.now()}`,
            name: projectName,
            html: editorHtml,
            savedAt: new Date().toISOString(),
        };

        const updatedProjects = [...savedProjects, newProject];
        localStorage.setItem(key, JSON.stringify(updatedProjects));
        setSavedProjects(updatedProjects);
        
        toast({ title: "Project Saved!", description: `"${projectName}" has been saved.` });
        setIsSaveDialogOpen(false);
    };

    const handleLoadProject = (project: Project) => {
        setEditorHtml(project.html);
        setActiveTab('builder');
        toast({ title: "Project Loaded", description: `You are now editing "${project.name}".` });
    };

    const handleDeleteProject = (projectId: string) => {
        const key = getProjectsStorageKey();
        if (!key) return;

        const updatedProjects = savedProjects.filter(p => p.id !== projectId);
        localStorage.setItem(key, JSON.stringify(updatedProjects));
        setSavedProjects(updatedProjects);
        toast({ title: "Project Deleted", variant: "default" });
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setFeedback(null);
        try {
            const result = await getWebsiteFeedback({ htmlContent: editorHtml });
            setFeedback(result);
            toast({ title: 'Analysis Complete', description: 'AI feedback has been generated below.' });
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Could not analyze the website content.', variant: 'destructive' });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const FeedbackItem = ({ item }: { item: { passed: boolean; message: string; }}) => (
        <div className={`text-sm flex items-start gap-2 ${item.passed ? 'text-green-600' : 'text-destructive'}`}>
            <span className="mt-0.5">{item.passed ? '✅' : '❌'}</span>
            <span>{item.message}</span>
        </div>
    );

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <TabsList className="shrink-0">
                <TabsTrigger value="builder">Website Builder</TabsTrigger>
                <TabsTrigger value="projects">Saved Projects</TabsTrigger>
            </TabsList>
            <TabsContent value="builder" className="flex-1 mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full">
                    <div className="flex flex-col h-full lg:p-0">
                        <Card className="flex-1 flex flex-col h-full rounded-none lg:rounded-xl lg:border-r-0">
                             <CardHeader className="flex-row justify-between items-center">
                                <div>
                                    <CardTitle>Website Editor</CardTitle>
                                    <CardDescription>
                                        Write or paste your website's HTML below.
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                     <Button onClick={handleAnalyze} disabled={isAnalyzing} variant="outline">
                                        {isAnalyzing ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                        Analyze
                                    </Button>
                                    <Button onClick={handleOpenSaveDialog}>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Project
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col">
                               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                                    <div className="lg:col-span-2 flex flex-col h-full">
                                        <Textarea
                                            value={editorHtml}
                                            onChange={(e) => setEditorHtml(e.target.value)}
                                            className="font-mono text-xs flex-1 w-full h-full"
                                            placeholder="<html>...</html>"
                                        />
                                    </div>
                               </div>
                            </CardContent>
                            {feedback && (
                                <CardFooter className="flex-col items-start gap-4 pt-4 border-t shrink-0">
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <Label>Overall Score</Label>
                                            <span className="font-bold text-primary">{feedback.overallScore}/100</span>
                                        </div>
                                        <Progress value={feedback.overallScore} />
                                        <p className="text-sm text-muted-foreground mt-2">{feedback.overallSummary}</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div className="space-y-1">
                                            <h4 className="font-semibold">SEO</h4>
                                            <FeedbackItem item={feedback.seo.hasTitle} />
                                            <FeedbackItem item={feedback.seo.hasMetaDescription} />
                                            <FeedbackItem item={feedback.seo.hasH1} />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-semibold">Accessibility</h4>
                                            <FeedbackItem item={feedback.accessibility.imagesHaveAlt} />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-semibold">Content</h4>
                                            <FeedbackItem item={feedback.content.hasCallToAction} />
                                        </div>
                                    </div>
                                </CardFooter>
                            )}
                        </Card>
                    </div>
                    <div className="lg:col-span-1 h-[calc(100vh-4rem-60px)] lg:h-full">
                         <Card className="flex flex-col h-full rounded-none border-l lg:rounded-r-xl">
                            <CardHeader>
                                <CardTitle>Live Preview</CardTitle>
                                <CardDescription>
                                    A real-time preview of your website.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 p-0">
                                <HtmlRenderer htmlContent={editorHtml} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </TabsContent>
            <TabsContent value="projects" className="flex-1 mt-0">
                 <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Saved Projects</CardTitle>
                        <CardDescription>Manage your saved website projects here.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Project Name</TableHead>
                                    <TableHead>Last Saved</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {savedProjects.map((project) => (
                                    <TableRow key={project.id}>
                                        <TableCell className="font-medium">{project.name}</TableCell>
                                        <TableCell>{format(new Date(project.savedAt), "PPP p")}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" className="mr-2" onClick={() => handleLoadProject(project)}>
                                                <FolderOpen className="mr-2 h-4 w-4" /> Open
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>This will permanently delete the project "{project.name}".</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteProject(project.id)}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {savedProjects.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24">No saved projects yet.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                 </Card>
            </TabsContent>

            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save Project</DialogTitle>
                        <DialogDescription>
                            Give your project a name to save it for later.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="project-name">Project Name</Label>
                        <Input 
                            id="project-name"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveProject}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Tabs>
    );
}
