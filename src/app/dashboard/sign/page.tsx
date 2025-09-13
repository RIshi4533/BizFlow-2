
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  PlusCircle,
  FileText,
  MoreHorizontal,
  Edit,
  Trash2,
  Send,
  Eye,
  MousePointer2,
  Type,
  Upload,
  History,
  Check,
  Clock,
  Loader,
  Search,
} from 'lucide-react';
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
} from '@/components/ui/alert-dialog';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  type SignDocument,
  type AuditLog,
  type SignerInfo,
  type Contact,
  initialEmployees,
  initialContacts
} from '@/lib/mock-data';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { sendFeatureMessage } from '@/lib/sendFeatureMessage';

const getStatusClass = (status: string) => {
  switch (status) {
    case 'Sent':
      return 'bg-blue-100 text-blue-800';
    case 'Signed':
      return 'bg-green-100 text-green-800';
    case 'Rejected':
      return 'bg-red-100 text-red-800';
    case 'Draft':
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getAuditIcon = (action: string) => {
  switch (action) {
    case 'Created':
      return <PlusCircle className="h-4 w-4 text-muted-foreground" />;
    case 'Sent':
      return <Send className="h-4 w-4 text-blue-500" />;
    case 'Viewed':
      return <Eye className="h-4 w-4 text-purple-500" />;
    case 'Signed':
      return <Check className="h-4 w-4 text-green-500" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const SignaturePad = ({ onDrawEnd }: { onDrawEnd: (dataUrl: string) => void }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = React.useState(false);

    const getCoords = (event: React.MouseEvent | React.TouchEvent): [number, number] => {
        if (!canvasRef.current) return [0,0];
        const rect = canvasRef.current.getBoundingClientRect();
        const nativeEvent = event.nativeEvent;
        if (nativeEvent instanceof MouseEvent) {
             return [nativeEvent.clientX - rect.left, nativeEvent.clientY - rect.top];
        }
        if (nativeEvent instanceof TouchEvent) {
             return [nativeEvent.touches[0].clientX - rect.left, nativeEvent.touches[0].clientY - rect.top];
        }
        return [0,0];
    };
    
    const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
        const context = canvasRef.current?.getContext('2d');
        if (context) {
            context.beginPath();
            const [x,y] = getCoords(event);
            context.moveTo(x, y);
            setIsDrawing(true);
        }
    };

    const draw = (event: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const context = canvasRef.current?.getContext('2d');
        if (context) {
            const [x,y] = getCoords(event);
            context.lineTo(x, y);
            context.stroke();
        }
    };

    const stopDrawing = () => {
        const context = canvasRef.current?.getContext('2d');
        if (context) {
            context.closePath();
            setIsDrawing(false);
            if (canvasRef.current) {
                onDrawEnd(canvasRef.current.toDataURL());
            }
        }
    };

    const clearPad = () => {
        const canvas = canvasRef.current;
        if(canvas) {
            const context = canvas.getContext('2d');
            if (context) {
                context.clearRect(0, 0, canvas.width, canvas.height);
                onDrawEnd('');
            }
        }
    }

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const context = canvas.getContext('2d');
            if (context) {
                context.strokeStyle = "#000000";
                context.lineWidth = 2;
            }
        }
    }, []);

    return (
        <div>
            <canvas
                ref={canvasRef}
                className="w-full h-40 bg-gray-100 border-2 border-dashed rounded-md cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
            <Button variant="link" size="sm" className="mt-1" onClick={clearPad}>Clear</Button>
        </div>
    );
};

const fontMapping: { [key: string]: string } = {
  'font-merriweather': 'Merriweather',
  'font-roboto': 'Roboto',
  'font-dancing': 'Dancing Script',
  'font-oswald': 'Oswald',
  'font-lobster': 'Lobster',
};

const initialSigners: Omit<Contact, 'createdAt' | 'company' | 'phone'>[] = [...initialContacts, ...initialEmployees];

export default function SignPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = React.useState<SignDocument[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const [allUsers, setAllUsers] = React.useState<Omit<Contact, 'createdAt' | 'company' | 'phone'>[]>(initialSigners);

  const [isSendDialogOpen, setIsSendDialogOpen] = React.useState(false);
  const [isSignDialogOpen, setIsSignDialogOpen] = React.useState(false);
  const [isAuditTrailOpen, setIsAuditTrailOpen] = React.useState(false);

  const [currentDocument, setCurrentDocument] = React.useState<SignDocument | null>(
    null
  );
  const [signers, setSigners] = React.useState<Partial<SignerInfo>[]>([]);
  const [isSequential, setIsSequential] = React.useState(false);
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [uploadedFileDataUrl, setUploadedFileDataUrl] = React.useState<
    string | null
  >(null);

  // State for signature pad
  const [typedSignature, setTypedSignature] = React.useState('');
  const [signatureFont, setSignatureFont] = React.useState('font-merriweather');
  const [uploadedSignature, setUploadedSignature] = React.useState<string | null>(
    null
  );
  const [signatureDataUrl, setSignatureDataUrl] = React.useState<string | null>(
    null
  );

  const fetchDocuments = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/esign/documents');
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Could not load documents.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  const fetchAllUsers = React.useCallback(() => {
    if (!user) return;
    const contactsStorageKey = `bizflow-contacts-${user.uid}`;
    try {
        const storedContacts = localStorage.getItem(contactsStorageKey);
        const dynamicContacts: Contact[] = storedContacts ? JSON.parse(storedContacts) : [];
        const employeesAsContacts: Omit<Contact, 'createdAt' | 'company' | 'phone'>[] = initialEmployees;

        const combined = [...initialContacts, ...dynamicContacts, ...employeesAsContacts];
        const uniqueUsers = Array.from(new Map(combined.map(item => [item.id, item])).values());
        setAllUsers(uniqueUsers);
    } catch (e) {
        console.error("Failed to fetch users from local storage", e);
        setAllUsers(initialSigners);
    }
  }, [user]);

  React.useEffect(() => {
    fetchDocuments();
    fetchAllUsers();
  }, [fetchDocuments, fetchAllUsers]);

  const persistDocuments = async (updatedDocs: SignDocument[]) => {
    try {
        const response = await fetch('/api/esign/documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedDocs),
        });
        if (!response.ok) throw new Error('Failed to save documents');
        setDocuments(updatedDocs);
    } catch(error) {
        toast({ title: 'Error', description: 'Could not save document changes.', variant: 'destructive'});
    }
  };

  const handleDeleteDocument = (docId: string) => {
    const updatedDocs = documents.filter((d) => d.id !== docId);
    persistDocuments(updatedDocs);
    toast({ title: 'Success', description: 'Document has been deleted.' });
  };

  const handleOpenSendDialog = (doc?: SignDocument) => {
    if (doc) {
      setCurrentDocument(doc);
      setUploadedFileDataUrl(doc.fileDataUrl || null);
      setUploadedFile(null);
      setSigners(doc.signers || []);
    } else {
      setCurrentDocument(null);
      setUploadedFileDataUrl(null);
      setUploadedFile(null);
      setSigners([{ order: 1, status: 'Pending' }]);
    }
    setIsSequential(false);
    setIsSendDialogOpen(true);
  };

  const handleAddSigner = () => {
    setSigners([...signers, { order: signers.length + 1, status: 'Pending' }]);
  };

  const handleRemoveSigner = (index: number) => {
    setSigners(signers.filter((_, i) => i !== index));
  };

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedFileDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendDocument = async () => {
    if (!uploadedFileDataUrl) {
      toast({
        title: 'Error',
        description: 'Please upload a document to send.',
        variant: 'destructive',
      });
      return;
    }
    if (signers.some((s) => !s.contactId)) {
      toast({
        title: 'Error',
        description: 'Please select a contact for all signers.',
        variant: 'destructive',
      });
      return;
    }

    const auditTrailBase = currentDocument?.auditTrail || [
      {
        action: 'Created',
        actor: user?.email || 'System',
        timestamp: new Date().toLocaleString(),
      },
    ];

    const completedSigners = signers.map((s, i) => ({ ...s, order: i + 1 })) as SignerInfo[];

    const newDocument: SignDocument = {
      id: currentDocument?.id || `doc_${Date.now()}`,
      name: uploadedFile?.name || currentDocument?.name || 'Untitled Document',
      status: 'Sent',
      ownerEmail: user?.email || 'unknown',
      signers: completedSigners,
      lastUpdated: new Date().toLocaleDateString(),
      fileDataUrl: uploadedFileDataUrl,
      auditTrail: [
        ...auditTrailBase,
        {
          action: 'Sent',
          actor: user?.email || 'System',
          timestamp: new Date().toLocaleString(),
          details: `Sent to ${completedSigners.map((s) => s.email).join(', ')}`,
        },
      ],
    };

    let updatedDocs;
    if (currentDocument) {
      updatedDocs = documents.map((d) =>
        d.id === currentDocument.id ? newDocument : d
      );
    } else {
      updatedDocs = [newDocument, ...documents];
    }

    await persistDocuments(updatedDocs);
    toast({
      title: 'Success',
      description: 'Document has been sent for signature.',
    });
    setIsSendDialogOpen(false);
    setCurrentDocument(null);
  };
  
  const handleSelectSigner = (index: number, contactId: string) => {
      const contact = allUsers.find(c => c.id === contactId);
      if (contact) {
        const newSigners = [...signers];
        newSigners[index] = { ...newSigners[index], contactId: contact.id, email: contact.email, name: contact.name };
        setSigners(newSigners);
      }
  }

  const handleOpenSignDialog = (doc: SignDocument) => {
    setCurrentDocument(doc);
    setTypedSignature('');
    setUploadedSignature(null);
    setSignatureDataUrl(null);
    setIsSignDialogOpen(true);
  };

  const handleOpenAuditTrail = (doc: SignDocument) => {
    setCurrentDocument(doc);
    setIsAuditTrailOpen(true);
  };

  const handleConfirmSignature = async () => {
    if (!currentDocument || !user?.email) return;

    const newAuditLog: AuditLog = {
      action: 'Signed',
      actor: user.email,
      timestamp: new Date().toLocaleString(),
      details: 'Document was signed digitally.',
    };

    const currentSigners = [...currentDocument.signers];

    const updatedSigners = currentSigners.map((signer) => {
      if (signer.email === user.email) {
        return { ...signer, status: 'Signed' as const };
      }
      return signer;
    });

    const hasEveryoneSigned = updatedSigners.every((s) => s.status === 'Signed');

    const updatedDocs = documents.map((d) =>
      d.id === currentDocument.id
        ? {
            ...d,
            status: hasEveryoneSigned ? 'Signed' : 'Sent',
            signers: updatedSigners,
            lastUpdated: new Date().toLocaleDateString(),
            auditTrail: [...d.auditTrail, newAuditLog],
          }
        : d
    );

    await persistDocuments(updatedDocs);
    toast({
      title: 'Document Signed!',
      description: 'Your signature has been securely recorded.',
    });
    setIsSignDialogOpen(false);
  };

  const handleSignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedSignature(reader.result as string);
        setSignatureDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  React.useEffect(() => {
    if (typedSignature && signatureFont) {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const actualFont = fontMapping[signatureFont] || 'serif';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = `48px "${actualFont}"`;
        ctx.fillStyle = '#000';
        ctx.fillText(typedSignature, 20, 60);
        setSignatureDataUrl(canvas.toDataURL());
      }
    } else if (!typedSignature && !uploadedSignature) {
      setSignatureDataUrl(null);
    }
  }, [typedSignature, signatureFont, uploadedSignature]);

  const myDocuments = documents.filter((d) => d.ownerEmail === user?.email);
  const receivedDocuments = documents.filter((d) =>
    d.signers?.some((s) => s.email === user?.email && s.status === 'Pending')
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FileText className="w-8 h-8 text-primary" />
              <div>
                <CardTitle>E-Signatures</CardTitle>
                <CardDescription>
                  Send, sign, and manage documents electronically.
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => handleOpenSendDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" /> New Document
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="my-documents">
            <TabsList>
              <TabsTrigger value="my-documents">My Documents</TabsTrigger>
              <TabsTrigger value="awaiting-signature">
                Awaiting my Signature
                {receivedDocuments.length > 0 && (
                  <Badge className="ml-2">{receivedDocuments.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="my-documents">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.name}</TableCell>
                      <TableCell>
                        <Badge className={getStatusClass(doc.status)}>
                          {doc.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {doc.signers?.map((s) => s.name || s.email).join(', ')}
                      </TableCell>
                      <TableCell>{doc.lastUpdated}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleOpenAuditTrail(doc)}
                            >
                              <History className="mr-2 h-4 w-4" /> View Audit Trail
                            </DropdownMenuItem>
                            {doc.status === 'Draft' && (
                              <DropdownMenuItem
                                onClick={() => handleOpenSendDialog(doc)}
                              >
                                <Send className="mr-2 h-4 w-4" /> Send
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will
                                    permanently delete the document.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteDocument(doc.id)}
                                  >
                                    Continue
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {myDocuments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">
                        You haven't created any documents yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="awaiting-signature">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivedDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.name}</TableCell>
                      <TableCell>{doc.ownerEmail}</TableCell>
                      <TableCell>{doc.lastUpdated}</TableCell>
                      <TableCell className="text-right">
                        <Button onClick={() => handleOpenSignDialog(doc)}>
                          <Edit className="mr-2 h-4 w-4" /> Review & Sign
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {receivedDocuments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24">
                        You have no documents waiting for your signature.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Send for Signature Dialog */}
      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {currentDocument ? 'Send Document' : 'Create New Document'}
            </DialogTitle>
            <DialogDescription>
              Upload a document and specify the signing workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="doc-upload">Document (PDF only)</Label>
              <Input
                id="doc-upload"
                type="file"
                accept=".pdf"
                onChange={handleDocumentUpload}
              />
              {uploadedFileDataUrl && !uploadedFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  Using existing document: {currentDocument?.name}
                </p>
              )}
            </div>
            <div>
              <Label>Signers</Label>
              <div className="space-y-2 p-2 border rounded-md">
                 {signers.map((signer, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {isSequential && (
                      <span className="font-bold text-sm">{index + 1}.</span>
                    )}
                     <Select
                        value={signer.contactId}
                        onValueChange={(contactId) => handleSelectSigner(index, contactId)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a contact..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allUsers.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id}>
                              <div className="flex flex-col">
                                <span>{contact.name}</span>
                                <span className="text-xs text-muted-foreground">{contact.email}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSigner(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}

                <Button variant="outline" size="sm" onClick={handleAddSigner}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Signer
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="sequential-signing"
                checked={isSequential}
                onCheckedChange={setIsSequential}
              />
              <Label htmlFor="sequential-signing">
                Set signing order (Sequential Workflow)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSendDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSendDocument}>
              <Send className="mr-2 h-4 w-4" /> Send for Signature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sign Document Dialog */}
      <Dialog open={isSignDialogOpen} onOpenChange={setIsSignDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Sign Document: {currentDocument?.name}</DialogTitle>
            <DialogDescription>
              Please review the document and apply your signature below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
            <div className="md:col-span-2 h-[500px] bg-secondary rounded-md overflow-hidden relative">
              <embed
                  src={currentDocument?.fileDataUrl}
                  type="application/pdf"
                  width="100%"
                  height="100%"
                />
            </div>
            <div className="md:col-span-1">
              <Tabs defaultValue="draw">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="draw">
                    <MousePointer2 className="mr-1 h-4 w-4" />
                    Draw
                  </TabsTrigger>
                  <TabsTrigger value="type">
                    <Type className="mr-1 h-4 w-4" />
                    Type
                  </TabsTrigger>
                  <TabsTrigger value="upload">
                    <Upload className="mr-1 h-4 w-4" />
                    Upload
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="draw" className="mt-4">
                  <SignaturePad onDrawEnd={setSignatureDataUrl} />
                </TabsContent>
                <TabsContent value="type" className="mt-4 space-y-2">
                  <Input
                    placeholder="Your Name"
                    className={cn(
                      'text-2xl h-auto p-4 tracking-wider',
                      signatureFont
                    )}
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                  />
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Select Style
                    </Label>
                    <Select
                      value={signatureFont}
                      onValueChange={setSignatureFont}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value="font-merriweather"
                          className="font-merriweather"
                        >
                          Merriweather
                        </SelectItem>
                        <SelectItem
                          value="font-roboto"
                          className="font-roboto"
                        >
                          Roboto
                        </SelectItem>
                        <SelectItem
                          value="font-dancing"
                          className="font-dancing"
                        >
                          Dancing Script
                        </SelectItem>
                        <SelectItem
                          value="font-oswald"
                          className="font-oswald"
                        >
                          Oswald
                        </SelectItem>
                        <SelectItem
                          value="font-lobster"
                          className="font-lobster"
                        >
                          Lobster
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
                <TabsContent value="upload" className="mt-4 space-y-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                  />
                  {uploadedSignature && (
                    <div className="p-2 border rounded-md">
                      <Image
                        src={uploadedSignature}
                        alt="Uploaded signature preview"
                        width={200}
                        height={100}
                        className="mx-auto object-contain"
                        unoptimized
                      />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Upload an image of your signature.
                  </p>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSignDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSignature}
              disabled={!signatureDataUrl}
            >
              Apply Signature & Finish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Trail Dialog */}
      <Dialog open={isAuditTrailOpen} onOpenChange={setIsAuditTrailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History /> Audit Trail
            </DialogTitle>
            <DialogDescription>
              Showing the complete history for: {currentDocument?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[400px] overflow-y-auto">
            <ul className="space-y-4">
              {currentDocument?.auditTrail.map((log, index) => (
                <li key={index} className="flex items-start gap-4">
                  <div className="pt-1">{getAuditIcon(log.action)}</div>
                  <div className="flex-1">
                    <p className="font-semibold">{log.action}</p>
                    <p className="text-sm text-muted-foreground">
                      by {log.actor} on {log.timestamp}
                    </p>
                    {log.details && (
                      <p className="text-xs text-muted-foreground italic mt-1">
                        {log.details}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsAuditTrailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
