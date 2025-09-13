
'use client';

import * as React from 'react';
import { PlusCircle, MoreHorizontal, Edit, Trash2, Boxes, Sparkles, Loader, QrCode, PackageCheck, Factory } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { PackageX, Truck } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { runCustomTask, processInventoryData } from '@/app/ai-actions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import QRCode from 'qrcode';
import Image from 'next/image';
import { type RentalBooking, initialBookings } from '@/lib/mock-data';
import { format } from 'date-fns';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, query, where, serverTimestamp, orderBy } from 'firebase/firestore';
import Link from 'next/link';


export type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  stock: number;
  description?: string;
  userId?: string;
  ownerId?: string;
};


const getStatus = (stock: number) => {
    if (stock === 0) return { text: 'Out of Stock', variant: 'destructive' as const, className: 'bg-red-100 text-red-800' };
    if (stock > 0 && stock <= 10) return { text: 'Low Stock', variant: 'secondary' as const, className: 'bg-orange-100 text-orange-800' };
    return { text: 'In Stock', variant: 'default' as const, className: 'bg-green-100 text-green-800' };
};

const aihint = (name: string) => name.split(' ').slice(0, 2).join(' ').toLowerCase();


export default function InventoryPage() {
  const { user } = useAuth();
  
  const inventoryQuery = user ? query(collection(db, 'inventory'), where('ownerId', '==', user.uid), orderBy('name')) : null;
  const [itemsSnapshot, isLoading] = useCollection(inventoryQuery);
  const items: InventoryItem[] = itemsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() as InventoryItem })) || [];


  const [open, setOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [currentItem, setCurrentItem] = React.useState<InventoryItem | null>(null);
  const [currentBooking, setCurrentBooking] = React.useState<RentalBooking | null>(null);

  const [name, setName] = React.useState('');
  const [sku, setSku] = React.useState('');
  const [stock, setStock] = React.useState('');
  const [description, setDescription] = React.useState('');
  
  const [isAiActionDialogOpen, setIsAiActionDialogOpen] = React.useState(false);
  const [isUpdateStockDialogOpen, setIsUpdateStockDialogOpen] = React.useState(false);
  const [aiActionPrompt, setAiActionPrompt] = React.useState("");
  const [isAiActionLoading, setIsAiActionLoading] = React.useState(false);
  const [rawInventoryData, setRawInventoryData] = React.useState('');
  const [isBulkProcessing, setIsBulkProcessing] = React.useState(false);
  const [isQrDialogOpen, setIsQrDialogOpen] = React.useState(false);
  const [qrCodeUrl, setQrCodeUrl] = React.useState('');
  const { toast } = useToast();

  const getBookingsStorageKey = React.useCallback(() => {
    if (!user) return null;
    return `bizflow-rental-bookings-${user.uid}`;
  }, [user]);

  const resetForm = () => {
    setName('');
    setSku('');
    setStock('');
    setDescription('');
    setCurrentItem(null);
    setIsEditing(false);
    setOpen(false);
  };

  const handleOpenDialog = (item?: InventoryItem) => {
    if (item) {
      setIsEditing(true);
      setCurrentItem(item);
      setName(item.name);
      setSku(item.sku);
      setStock(String(item.stock));
      setDescription(item.description || '');
    } else {
      setIsEditing(false);
      setCurrentItem(null);
      setName('');
      setSku('');
      setStock('');
      setDescription('');
    }
    setOpen(true);
  };
  
  const handleOpenAiActionDialog = (item: InventoryItem) => {
    setCurrentItem(item);
    setAiActionPrompt(`Received a new shipment of `);
    setIsAiActionDialogOpen(true);
  };
  
  const handleOpenUpdateStockDialog = (item: InventoryItem) => {
    setCurrentItem(item);
    setStock(String(item.stock));
    setIsUpdateStockDialogOpen(true);
  };

  const handleUpdateStock = async () => {
    if (!currentItem) return;
    const stockNumber = parseInt(stock, 10);
    if (isNaN(stockNumber) || stockNumber < 0) {
      toast({ title: 'Error', description: 'Please enter a valid stock quantity.', variant: 'destructive' });
      return;
    }
    
    try {
        await updateDoc(doc(db, 'inventory', currentItem.id), { stock: stockNumber });
        toast({ title: 'Success', description: `${currentItem.name} stock updated to ${stockNumber}.` });
        setIsUpdateStockDialogOpen(false);
    } catch(error) {
        toast({ title: 'Error', description: 'Could not update stock.', variant: 'destructive' });
    }
  };


  const handleDeleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'inventory', id));
      toast({ title: 'Success', description: 'Item has been deleted.' });
    } catch (error) {
       toast({ title: 'Error', description: 'Could not delete item.', variant: 'destructive' });
    }
  };
  
  const handleSubmit = async () => {
    if (!name || !sku || stock === '' || !user) return;
    const stockNumber = parseInt(stock, 10);

    const itemData = {
        name,
        sku,
        stock: stockNumber,
        description,
        ownerId: user.uid,
    };
    
    try {
        if (isEditing && currentItem) {
          await updateDoc(doc(db, 'inventory', currentItem.id), itemData);
          toast({ title: 'Success!', description: 'Item has been updated.' });
        } else {
          await addDoc(collection(db, 'inventory'), { ...itemData, createdAt: serverTimestamp() });
          toast({ title: 'Success!', description: 'New item has been added.' });
        }
        resetForm();
    } catch (error) {
        toast({ title: 'Error', description: 'Could not save item.', variant: 'destructive' });
    }
  };
  
  const handleRunAiAction = async () => {
      if (!aiActionPrompt || !currentItem || !user) return;
      setIsAiActionLoading(true);
      try {
        const result = await runCustomTask({ prompt: aiActionPrompt, context: currentItem, ownerId: user.uid });
        toast({ title: "AI Task Complete", description: result.result });
      } catch (error) {
        toast({ title: "Error", description: "The AI task failed.", variant: "destructive" });
        console.error(error);
      } finally {
        setIsAiActionLoading(false);
        setIsAiActionDialogOpen(false);
        setAiActionPrompt("");
        setCurrentItem(null);
      }
  };
  
  const handleProcessRawData = async () => {
    if (!rawInventoryData || !user) return;
    setIsBulkProcessing(true);
    try {
      const result = await processInventoryData({ rawData: rawInventoryData, ownerId: user.uid });
      toast({ title: "AI Processing Complete", description: result.summary, duration: 5000 });
      setRawInventoryData('');
    } catch (error) {
      toast({ title: "Error", description: "Failed to process raw data.", variant: "destructive" });
      console.error(error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleGenerateQrCode = async (item: InventoryItem) => {
    try {
      const url = await QRCode.toDataURL(item.id, { width: 300 });
      setQrCodeUrl(url);
      setCurrentItem(item);
      
      const bookingKey = getBookingsStorageKey();
      const storedBookings = bookingKey ? localStorage.getItem(bookingKey) : null;
      const allBookings: RentalBooking[] = storedBookings ? JSON.parse(storedBookings) : initialBookings;
      const activeBooking = allBookings
        .filter(b => b.itemId === item.id && (b.status === 'booked' || b.status === 'rented'))
        .sort((a, b) => new Date(b.dateRange.from).getTime() - new Date(a.dateRange.from).getTime())[0] || null;
      
      setCurrentBooking(activeBooking);
      setIsQrDialogOpen(true);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Could not generate QR code.", variant: "destructive" });
    }
  };

  const handlePrintQr = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow && currentItem) {
        const itemInfo = `
            <div>
                <h2>${currentItem.name}</h2>
                <p><strong>SKU:</strong> ${currentItem.sku}</p>
                <p><strong>Status:</strong> ${currentBooking ? `Rented to ${currentBooking.customerName}` : 'Available'}</p>
                ${currentBooking ? `<p><strong>Return Date:</strong> ${format(new Date(currentBooking.dateRange.to), 'PPP')}</p>` : ''}
            </div>
        `;
        printWindow.document.write('<html><head><title>Print QR Code</title>');
        printWindow.document.write('<style>body { font-family: sans-serif; display: flex; align-items: center; gap: 2rem; } img { max-width: 150px; } </style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(`<img src="${qrCodeUrl}" />`);
        printWindow.document.write(itemInfo);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    }
  };

  const inStockCount = items?.filter(item => item.stock > 0).length || 0;
  const outOfStockCount = items?.filter(item => item.stock === 0).length || 0;
  const lowStockCount = items?.filter(item => item.stock > 0 && item.stock <= 10).length || 0;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div className='flex items-center gap-4'>
                <Boxes className="w-8 h-8 text-primary" />
                <div>
                <CardTitle>Inventory</CardTitle>
                <CardDescription>Manage stock for all items, including raw materials and finished products.</CardDescription>
                </div>
            </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" asChild>
                <Link href="/dashboard/manufacturing">
                    <Factory className="h-4 w-4" />
                    <span className="ml-2">Go to Manufacturing</span>
                </Link>
            </Button>
            <Button size="sm" className="gap-1" onClick={() => handleOpenDialog()}>
                <PlusCircle className="h-4 w-4" />
                Add Item
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Items In Stock</CardTitle>
            <PackageCheck className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inStockCount}</div>
            <p className="text-xs text-muted-foreground">Total unique items available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <Truck className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Items needing reorder soon</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Items Out of Stock</CardTitle>
            <PackageX className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStockCount}</div>
            <p className="text-xs text-muted-foreground">Needs immediate restocking</p>
          </CardContent>
        </Card>
      </div>
      
       <Card>
        <CardHeader>
          <CardTitle>Process Raw Inventory Data</CardTitle>
          <CardDescription>Paste a list, email, or manifest. The AI will parse it and update stock levels.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea 
            placeholder="Example: 'Received: 10x LP-1001, 50x MS-2034. Note: 2 HUB-7001 were returned.'"
            className="min-h-[150px]"
            value={rawInventoryData}
            onChange={(e) => setRawInventoryData(e.target.value)}
          />
        </CardContent>
        <CardFooter>
          <Button onClick={handleProcessRawData} disabled={isBulkProcessing}>
            {isBulkProcessing ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Process with AI
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock Levels</CardTitle>
          <CardDescription>An overview of all your inventory items.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items?.map((item) => {
                const status = getStatus(item.stock);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={status.variant} className={status.className}>
                        {status.text}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{item.stock}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleOpenUpdateStockDialog(item)}>
                            <PackageCheck className="mr-2 h-4 w-4" /> Update Stock
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenDialog(item)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Details
                          </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleOpenAiActionDialog(item)}>
                            <Sparkles className="mr-2 h-4 w-4" /> AI Action
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleGenerateQrCode(item)}>
                            <QrCode className="mr-2 h-4 w-4" /> Generate QR Code
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
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
                                  This action cannot be undone. This will permanently delete the item.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteItem(item.id)}>Continue</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
               {isLoading && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                       <Loader className="mx-auto animate-spin" />
                    </TableCell>
                </TableRow>
               )}
               {!isLoading && items?.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                        No inventory items found. Add one to get started.
                    </TableCell>
                </TableRow>
               )}
            </TableBody>
          </Table>
          
          <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); setOpen(isOpen); }}>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>{isEditing ? 'Edit Item' : 'Add New Item'}</DialogTitle>
                <DialogDescription>
                  {isEditing ? 'Update the details for this item.' : 'Enter the details of your new item below.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="e.g. Wireless Mouse" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="sku" className="text-right">SKU</Label>
                  <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} className="col-span-3" placeholder="e.g. MS-2034" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stock" className="text-right">Stock</Label>
                  <Input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="col-span-3" placeholder="e.g. 150" />
                </div>
                 <div className="grid grid-cols-4 items-start gap-4">
                 <Label htmlFor="description" className="text-right pt-2">
                  Description
                </Label>
                 <div className="col-span-3">
                   <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A brief product description..." className="min-h-[100px]" />
                 </div>
              </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleSubmit}>{isEditing ? 'Save Changes' : 'Save Item'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

            <Dialog open={isUpdateStockDialogOpen} onOpenChange={setIsUpdateStockDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Update Stock for {currentItem?.name}</DialogTitle>
                        <DialogDescription>Enter the new total quantity for this item.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="new-stock" className="text-right">New Stock Quantity</Label>
                            <Input
                                id="new-stock"
                                type="number"
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUpdateStockDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateStock}>Update Stock</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

          
           <Dialog open={isAiActionDialogOpen} onOpenChange={setIsAiActionDialogOpen}>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>Custom AI Action for "{currentItem?.name}"</DialogTitle>
                <DialogDescription>
                  Tell the AI what you want to do with this item. It can update stock levels or perform other tasks.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Textarea
                  id="ai-prompt"
                  className="min-h-[120px]"
                  placeholder="e.g., 'A new shipment of 50 units just arrived.'"
                  value={aiActionPrompt}
                  onChange={(e) => setAiActionPrompt(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAiActionDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleRunAiAction} disabled={isAiActionLoading}>
                    {isAiActionLoading ? (
                        <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Run AI Task
                </Button>
              </DialogFooter>
            </DialogContent>
           </Dialog>

           <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>QR Code for {currentItem?.name}</DialogTitle>
                        <DialogDescription>
                            Scan this QR code to quickly access item details. The code contains the unique item ID: {currentItem?.id}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center p-4">
                        {qrCodeUrl && <Image src={qrCodeUrl} alt="QR Code" width={250} height={250} />}
                    </div>
                     <Card className="text-sm">
                        <CardHeader>
                            <CardTitle>Item Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1">
                             <p><strong>SKU:</strong> {currentItem?.sku}</p>
                             <p><strong>Stock:</strong> {currentItem?.stock}</p>
                             <p><strong>Status:</strong> <Badge variant={currentBooking ? "destructive" : "default"} className={!currentBooking ? 'bg-green-100 text-green-800' : ''}>{currentBooking ? `Rented` : 'Available'}</Badge></p>
                            {currentBooking && (
                                <>
                                    <p><strong>Rented By:</strong> {currentBooking.customerName}</p>
                                    <p><strong>Return Date:</strong> {format(new Date(currentBooking.dateRange.to), 'PPP')}</p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsQrDialogOpen(false)}>Close</Button>
                        <Button onClick={handlePrintQr}>Print Label</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </CardContent>
      </Card>
    </div>
  );

    



