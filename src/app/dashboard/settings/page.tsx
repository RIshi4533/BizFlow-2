
'use client';

import * as React from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Lock, Bell, Camera, Trash2, MoreHorizontal, AlertCircle, RefreshCcw, PlusCircle, HardDrive } from "lucide-react";
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';


type UserRole = 'Admin' | 'Editor' | 'Viewer';

type AppUser = {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
};

const notificationSettings = [
    { id: 'mentions', label: 'Mentions', description: 'Get notified when someone @mentions you in a comment.' },
    { id: 'new_deals', label: 'New Sales Deals', description: 'Receive an email when a new deal is added to the pipeline.' },
    { id: 'task_updates', label: 'Project Task Updates', description: 'Get notified about progress on tasks you are assigned to.' },
    { id: 'weekly_summary', label: 'Weekly Summary Email', description: 'Receive a summary of business activity every Monday.' },
]

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [usersSnapshot, loadingUsers] = useCollection(collection(db, 'users'));
  const users: AppUser[] = usersSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() as any })) || [];
  
  const [companyName, setCompanyName] = React.useState('BizFlow Inc.');
  const [contactEmail, setContactEmail] = React.useState('contact@bizflow.com');
  const [notifications, setNotifications] = React.useState({
      mentions: true,
      new_deals: true,
      task_updates: false,
      weekly_summary: true,
  });
  
  const [isUserDialogOpen, setIsUserDialogOpen] = React.useState(false);
  const [isEditingUser, setIsEditingUser] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<AppUser | null>(null);

  // Form state for adding/editing users
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState<UserRole>('Viewer');

  const [isCameraDialogOpen, setIsCameraDialogOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<AppUser | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
  
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  
  const resetUserForm = () => {
    setName('');
    setEmail('');
    setRole('Viewer');
    setCurrentUser(null);
    setIsEditingUser(false);
    setIsUserDialogOpen(false);
  };

  const handleOpenUserDialog = (user?: AppUser) => {
    if (user) {
      setIsEditingUser(true);
      setCurrentUser(user);
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
    } else {
      setIsEditingUser(false);
      setCurrentUser(null);
      setName('');
      setEmail('');
      setRole('Viewer');
    }
    setIsUserDialogOpen(true);
  };
  
  const handleSaveUser = async () => {
    if (!name || !email) {
      toast({ title: 'Error', description: 'Name and email are required.', variant: 'destructive' });
      return;
    }
    
    if (isEditingUser && currentUser) {
      await updateDoc(doc(db, 'users', currentUser.id), { name, email, role });
      toast({ title: 'Success', description: 'User updated successfully.' });
    } else {
      await addDoc(collection(db, 'users'), { name, email, role, createdAt: serverTimestamp() });
      toast({ title: 'Success', description: 'New user added successfully.' });
    }
    resetUserForm();
  };
  
  const handleRemoveUser = async (userId: string) => {
    await deleteDoc(doc(db, 'users', userId));
    toast({ title: 'Success', description: 'User has been removed.' });
  };
  
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    await updateDoc(doc(db, 'users', userId), { role: newRole });
  };

  const handleNotificationChange = (id: string, checked: boolean) => {
      setNotifications(prev => ({...prev, [id]: checked}));
  }

  const handleOpenCameraDialog = (user: AppUser) => {
    setSelectedUser(user);
    setCapturedImage(null);
    setHasCameraPermission(null);
    setIsCameraDialogOpen(true);
  };
  
  React.useEffect(() => {
    let stream: MediaStream | null = null;
    const getCameraPermission = async () => {
      if (!isCameraDialogOpen) return;
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({video: true});
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    };

    getCameraPermission();
    
    return () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [isCameraDialogOpen, toast]);

  const handleCapture = () => {
      if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const context = canvas.getContext('2d');
          if (context) {
              context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
              const dataUrl = canvas.toDataURL('image/png');
              setCapturedImage(dataUrl);
          }
      }
  };
  
  const handleSaveAvatar = async () => {
    if (capturedImage && selectedUser) {
        await updateDoc(doc(db, 'users', selectedUser.id), { avatar: capturedImage });
        toast({ title: 'Success', description: `Avatar for ${selectedUser.name} updated.` });
        setIsCameraDialogOpen(false);
    }
  };

  const handleRemoveAvatar = async (userId: string) => {
    await updateDoc(doc(db, 'users', userId), { avatar: null });
    toast({ title: 'Success', description: 'Avatar removed.' });
  };
  
  const handleClearAllData = () => {
     if (!user) return;
    toast({ title: "Action not available", description: "Data clearing must be done from a secure server environment.", variant: "destructive" });
  };


  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Manage your account and application settings.</CardDescription>
        </CardHeader>
      </Card>
      
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="users">Users & Permissions</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="danger-zone" className="text-destructive">Danger Zone</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Update your company's information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input id="company-name" value={companyName} onChange={e => setCompanyName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Contact Email</Label>
                <Input id="contact-email" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
              </div>
            </CardContent>
             <CardFooter className="border-t px-6 py-4">
                <Button>Save</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="users">
           <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Users & Permissions</CardTitle>
                    <CardDescription>Manage who can access and do what in your workspace.</CardDescription>
                </div>
                <Button onClick={() => handleOpenUserDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" />Invite User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
               <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map(user => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={user.avatar} alt={user.name} />
                                            <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium">{user.name}</div>
                                            <div className="text-sm text-muted-foreground">{user.email}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                   <Select value={user.role} onValueChange={(value: UserRole) => handleRoleChange(user.id, value)}>
                                        <SelectTrigger className="w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Admin">Admin</SelectItem>
                                            <SelectItem value="Editor">Editor</SelectItem>
                                            <SelectItem value="Viewer">Viewer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Toggle menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleOpenUserDialog(user)}>Edit User</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleOpenCameraDialog(user)}>
                                                <Camera className="mr-2 h-4 w-4" /> Update Avatar
                                            </DropdownMenuItem>
                                             <DropdownMenuItem onClick={() => handleRemoveAvatar(user.id)} className="text-destructive" disabled={!user.avatar}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Remove Avatar
                                             </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                   <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Remove User
                                                   </DropdownMenuItem>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently remove the user from the workspace.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleRemoveUser(user.id)}>Continue</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
           <Card>
            <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Choose how you want to be notified.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
                {notificationSettings.map(setting => (
                    <div key={setting.id} className="flex items-center justify-between py-4">
                        <div>
                            <Label htmlFor={setting.id} className="font-medium">{setting.label}</Label>
                            <p className="text-sm text-muted-foreground">{setting.description}</p>
                        </div>
                        <Switch 
                          id={setting.id} 
                          checked={notifications[setting.id as keyof typeof notifications]}
                          onCheckedChange={(checked) => handleNotificationChange(setting.id, checked)}
                        />
                    </div>
                ))}
            </CardContent>
             <CardFooter className="border-t px-6 py-4">
                <Button>Save Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
         <TabsContent value="danger-zone">
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><AlertCircle className="text-destructive" />Danger Zone</CardTitle>
                    <CardDescription>These actions are irreversible. Please proceed with caution.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <h4 className="font-semibold">Remove All Data</h4>
                            <p className="text-sm text-muted-foreground">This will delete all data for a clean slate. This action is not available in the demo.</p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" onClick={handleClearAllData}>Delete All Data</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action is final and will wipe your entire workspace. You will start with a completely empty application.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => {}}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

      </Tabs>
      
      {/* Dialog for adding/editing users */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{isEditingUser ? 'Edit User' : 'Invite New User'}</DialogTitle>
                <DialogDescription>
                    {isEditingUser ? 'Update the details for this user.' : 'Enter the details for the new user.'}
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">Role</Label>
                    <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="Editor">Editor</SelectItem>
                            <SelectItem value="Viewer">Viewer</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={resetUserForm}>Cancel</Button>
                <Button onClick={handleSaveUser}>Save</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Camera Dialog for Avatars */}
      <Dialog open={isCameraDialogOpen} onOpenChange={setIsCameraDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Update Avatar for {selectedUser?.name}</DialogTitle>
                    <DialogDescription>
                        Position your face in front of the camera and capture a photo.
                    </DialogDescription>
                </DialogHeader>
                 <div className="py-4 space-y-4">
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="relative">
                       <video 
                            ref={videoRef} 
                            className={`w-full aspect-video rounded-md bg-secondary ${capturedImage ? 'hidden' : 'block'}`} 
                            autoPlay muted playsInline 
                        />
                         {capturedImage && (
                           <Image src={capturedImage} alt="Captured avatar" width={1280} height={720} className="rounded-md" unoptimized />
                         )}
                    </div>
                    {hasCameraPermission === false && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Camera Access Required</AlertTitle>
                            <AlertDescription>
                                Please allow camera access to use this feature. You may need to refresh the page after granting permissions.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCameraDialogOpen(false)}>Cancel</Button>
                    {hasCameraPermission && !capturedImage && (
                        <Button onClick={handleCapture}>
                            <Camera className="mr-2 h-4 w-4" />
                            Capture Photo
                        </Button>
                    )}
                    {capturedImage && (
                         <>
                            <Button variant="outline" onClick={() => setCapturedImage(null)}>
                                <RefreshCcw className="mr-2 h-4 w-4" />
                                Retake
                            </Button>
                             <Button onClick={handleSaveAvatar}>Save Avatar</Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>

    </div>
  );
}
