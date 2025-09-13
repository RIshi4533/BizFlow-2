
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Factory, PlusCircle, MoreHorizontal, CheckCircle, PackageSearch, Clock, Play, AlertCircle, Trash2, Sparkles, Loader } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { type ManufacturingOrder, type BillOfMaterial, type InventoryItem, type BomComponent } from '@/lib/mock-data';
import { generateBom } from '@/app/ai-actions';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useCollection, useDocumentData } from 'react-firebase-hooks/firestore';
import { db } from '@/lib/firebase';
import { collection, doc, query, where, addDoc, updateDoc, serverTimestamp, orderBy, getDocs, increment } from 'firebase/firestore';


const getStatusVariant = (status: ManufacturingOrder['status']) => {
    switch (status) {
        case 'done': return 'default';
        case 'in_progress': return 'secondary';
        case 'draft': return 'outline';
        case 'confirmed':
        default: return 'destructive';
    }
};

const getStatusText = (status: ManufacturingOrder['status']) => {
    if (!status) return 'Unknown';
    const formatted = status.replace('_', ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

const getStatusClass = (status: ManufacturingOrder['status']) => {
    switch (status) {
        case 'done': return 'bg-green-100 text-green-800';
        case 'in_progress': return 'bg-blue-100 text-blue-800';
        case 'confirmed': return 'bg-yellow-100 text-yellow-800';
        case 'draft':
        default: return 'bg-gray-100 text-gray-800';
    }
}

type NewBomComponent = { tempId: number; componentId: string; quantity: number };


export default function ManufacturingPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    
    const ordersQuery = user ? query(collection(db, 'manufacturing_orders'), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc')) : null;
    const [ordersSnapshot, loadingOrders] = useCollection(ordersQuery);
    const orders = ordersSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as ManufacturingOrder)) || [];
    
    const inventoryQuery = user ? query(collection(db, 'inventory'), where('ownerId', '==', user.uid)) : null;
    const [inventorySnapshot, loadingInventory] = useCollection(inventoryQuery);
    const inventory: InventoryItem[] = inventorySnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() as InventoryItem })) || [];

    const bomsQuery = user ? query(collection(db, 'boms'), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc')) : null;
    const [bomsSnapshot, loadingBoms] = useCollection(bomsQuery);
    const boms = bomsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as BillOfMaterial)) || [];


    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false);
    const [isBomDialogOpen, setIsBomDialogOpen] = React.useState(false);
    const [isAiLoading, setIsAiLoading] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);


    const [selectedOrder, setSelectedOrder] = React.useState<ManufacturingOrder | null>(null);

    const [newProductId, setNewProductId] = React.useState('');
    const [newQuantity, setNewQuantity] = React.useState(1);

    const [newBomProductId, setNewBomProductId] = React.useState('');
    const [newBomComponents, setNewBomComponents] = React.useState<NewBomComponent[]>([{tempId: Date.now(), componentId: '', quantity: 1}]);


    const handleCreateOrder = async () => {
        if (!newProductId || newQuantity <= 0 || !user) {
            toast({ title: 'Error', description: 'Please select a product and a valid quantity.', variant: 'destructive' });
            return;
        }

        const product = inventory.find(p => p.id === newProductId);
        const bom = boms.find(b => b.productId === newProductId);
        
        if(!product || !bom) {
            toast({ title: 'Error', description: 'Selected product or its Bill of Materials not found.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'manufacturing_orders'), {
                productId: newProductId,
                productName: product.name,
                quantity: newQuantity,
                status: 'confirmed',
                bomId: bom.id,
                components: bom.components,
                workOrders: bom.routing || [],
                expectedDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
                ownerId: user.uid,
                createdAt: serverTimestamp(),
            });

            toast({ title: 'Success', description: 'Manufacturing Order created.' });
            setIsCreateDialogOpen(false);
        } catch (error) {
            toast({ title: 'Error', description: 'Could not create order.', variant: 'destructive'});
            console.error("Error creating MO: ", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveBom = async () => {
        if (!newBomProductId || newBomComponents.some(c => !c.componentId || c.quantity <= 0) || !user) {
            toast({ title: 'Error', description: 'Please select a product and fill out all component lines.', variant: 'destructive' });
            return;
        }
        
        const product = inventory.find(p => p.id === newBomProductId);
        if (!product) return;

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'boms'), {
                productId: newBomProductId,
                productName: product.name, // Storing name for easier display
                components: newBomComponents.map(({ componentId, quantity }) => {
                    const item = inventory.find(i => i.id === componentId);
                    return { componentId, name: item?.name || '', quantity };
                }),
                routing: [ 
                  { operation: 'Assemble Casing', workCenter: 'Assembly Line 1' },
                  { operation: 'Install Electronics', workCenter: 'Assembly Line 1' },
                  { operation: 'Quality Control', workCenter: 'QC Station' },
                ],
                ownerId: user.uid,
                createdAt: serverTimestamp(),
            });

            toast({ title: 'Success', description: `Bill of Materials for ${product.name} has been created.`});
            setIsBomDialogOpen(false);
            setNewBomProductId('');
            setNewBomComponents([{tempId: Date.now(), componentId: '', quantity: 1}]);
        } catch(error) {
             toast({ title: 'Error', description: `Could not save BoM.`, variant: 'destructive'});
             console.error("Error saving BoM: ", error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleBomComponentChange = (index: number, field: 'componentId' | 'quantity', value: string | number) => {
        const updatedComponents = [...newBomComponents];
        if (field === 'quantity') {
            updatedComponents[index].quantity = Number(value);
        } else if (field === 'componentId') {
            updatedComponents[index].componentId = value;
        }
        setNewBomComponents(updatedComponents);
    };

    const handleAddComponent = () => {
        setNewBomComponents([...newBomComponents, { tempId: Date.now(), componentId: '', quantity: 1 }]);
    };
    
    const handleRemoveComponent = (index: number) => {
        setNewBomComponents(newBomComponents.filter((_, i) => i !== index));
    };

    const handleOpenDetails = (order: ManufacturingOrder) => {
        setSelectedOrder(order);
        setIsDetailsDialogOpen(true);
    };

    const handleStartProduction = async (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (!order || !order.components) return;
        
        const componentsWithStock = order.components.map(c => {
            const itemInStock = inventory.find(i => i.id === c.componentId);
            return { ...c, stockAvailable: itemInStock?.stock || 0 };
        });

        const componentsAvailable = componentsWithStock.every(comp => comp.stockAvailable >= (comp.quantity * order.quantity));
    
        if (!componentsAvailable) {
            toast({ title: 'Insufficient Stock', description: 'One or more components are out of stock. Update stock in the Inventory module.', variant: 'destructive', duration: 5000 });
            return;
        }
        
        try {
            for (const comp of order.components) {
                const itemDoc = doc(db, 'inventory', comp.componentId);
                const item = inventory.find(i => i.id === comp.componentId);
                if(item) {
                   await updateDoc(itemDoc, { stock: increment(-(comp.quantity * order.quantity)) });
                }
            }
        
            const orderDoc = doc(db, 'manufacturing_orders', orderId);
            await updateDoc(orderDoc, { status: 'in_progress', actualStartDate: new Date().toISOString() });
        
            toast({ title: 'Production Started', description: `Order ${orderId} is now in progress. Component stock updated.` });
            const updatedSelectedOrder = { ...order, status: 'in_progress', actualStartDate: new Date().toISOString() };
            setSelectedOrder(updatedSelectedOrder);

        } catch(error) {
             toast({ title: 'Error', description: 'Could not start production.', variant: 'destructive' });
        }
    };

    const handleMarkDone = async (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;
        
        try {
            const itemDoc = doc(db, 'inventory', order.productId);
            const item = inventory.find(i => i.id === order.productId);
            if(item) {
                await updateDoc(itemDoc, { stock: increment(order.quantity) });
            }
        
            const orderDoc = doc(db, 'manufacturing_orders', orderId);
            await updateDoc(orderDoc, { status: 'done', actualEndDate: new Date().toISOString() });
            
            setIsDetailsDialogOpen(false);
            toast({ title: 'Production Complete', description: `Order ${orderId} marked as done. Finished product added to stock.` });
        } catch(error) {
             toast({ title: 'Error', description: 'Could not complete order.', variant: 'destructive'});
        }
    };

    const handleGenerateBom = async () => {
        if (!newBomProductId) {
            toast({ title: 'Error', description: 'Please select a product first.', variant: 'destructive' });
            return;
        }
        const product = inventory.find(p => p.id === newBomProductId);
        if (!product) return;

        setIsAiLoading(true);
        try {
            const result = await generateBom({ productName: product.name });
            if (result.components) {
                const aiComponents = result.components.map(c => {
                    const inventoryItem = inventory.find(item => item.name.toLowerCase() === c.componentName.toLowerCase());
                    return {
                        tempId: Date.now() + Math.random(),
                        componentId: inventoryItem?.id || '',
                        quantity: c.quantity
                    };
                });
                setNewBomComponents(aiComponents);
                toast({ title: 'BOM Generated!', description: 'AI has suggested the components below. Please verify and save.'});
            }
        } catch (error) {
            console.error("BOM generation failed", error);
            toast({ title: "Error", description: "Could not generate Bill of Materials.", variant: "destructive" });
        } finally {
            setIsAiLoading(false);
        }
    };
    
    // Memoized lists to prevent re-filtering on every render
    const { manufacturableProducts, productsWithoutBom } = React.useMemo(() => {
        if (loadingInventory || loadingBoms || !inventorySnapshot || !bomsSnapshot) {
            return { manufacturableProducts: [], productsWithoutBom: [] };
        }
        const bomsData = bomsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as BillOfMaterial })) || [];
        const inventoryData = inventorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as InventoryItem })) || [];
        
        const manufacturable = inventoryData.filter(p => bomsData.some(b => b.productId === p.id));
        const withoutBom = inventoryData.filter(p => !bomsData.some(b => b.productId === p.id));
        return { manufacturableProducts: manufacturable, productsWithoutBom: withoutBom };
    }, [inventorySnapshot, bomsSnapshot, loadingInventory, loadingBoms]);

    const selectedBom = selectedOrder ? boms.find(b => b.id === selectedOrder.bomId) : null;
    const componentsWithStock = selectedOrder && selectedBom ? (selectedBom.components || []).map(c => {
        const item = inventory.find(i => i.id === c.componentId);
        return { ...c, stock: item?.stock || 0, name: item?.name || c.name };
    }) : [];

    const componentsAvailable = selectedOrder && componentsWithStock.every(c => c.stock >= (c.quantity * (selectedOrder?.quantity || 1)));

  return (
    <div className="flex flex-col gap-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                    <Factory className="w-8 h-8 text-primary" />
                    <div>
                        <CardTitle>Manufacturing</CardTitle>
                        <CardDescription>Manage orders, bills of materials, and work center capacity.</CardDescription>
                    </div>
                </div>
                 <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Order
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loadingOrders && <TableRow><TableCell colSpan={6} className="text-center h-24"><Loader className="mx-auto animate-spin" /></TableCell></TableRow>}
                        {orders.map((order) => (
                             <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleOpenDetails(order)}>
                                <TableCell className="font-mono">{order.id}</TableCell>
                                <TableCell className="font-medium">{order.productName}</TableCell>
                                <TableCell>{order.quantity}</TableCell>
                                <TableCell>{format(new Date(order.expectedDate), 'PPP')}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusVariant(order.status)} className={getStatusClass(order.status)}>
                                        {getStatusText(order.status)}
                                    </Badge>
                                </TableCell>
                                 <TableCell className="text-right">
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Toggle menu</span>
                                        </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleOpenDetails(order)}>View Details</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                 </TableCell>
                             </TableRow>
                        ))}
                        {orders.length === 0 && !loadingOrders && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">No manufacturing orders found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Bills of Materials (BOM)</CardTitle>
                    <CardDescription>Define the components required to manufacture your products.</CardDescription>
                </div>
                 <Button size="sm" onClick={() => setIsBomDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Create BOM
                </Button>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Finished Product</TableHead>
                            <TableHead>Components</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                       {loadingBoms && <TableRow><TableCell colSpan={2} className="text-center h-24"><Loader className="mx-auto animate-spin" /></TableCell></TableRow>}
                       {boms.map(bom => {
                           const product = inventory.find(p => p.id === bom.productId);
                           return (
                            <TableRow key={bom.id}>
                                <TableCell className="font-medium">{product?.name || 'Unknown Product'}</TableCell>
                                <TableCell>
                                    {(bom.components || []).map(c => `${c.quantity} x ${c.name || 'Unknown'}`).join(', ')}
                                </TableCell>
                            </TableRow>
                       )})}
                       {boms.length === 0 && !loadingBoms && (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center h-24">No BOMs found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                 </Table>
            </CardContent>
        </Card>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Manufacturing Order</DialogTitle>
                    <DialogDescription>Select a product with a defined Bill of Materials and a quantity to produce.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="space-y-2">
                        <Label htmlFor="product">Product to Manufacture</Label>
                        <Select value={newProductId} onValueChange={setNewProductId}>
                            <SelectTrigger>
                                <SelectValue placeholder={loadingInventory || loadingBoms ? "Loading products..." : "Select a product..."}/>
                            </SelectTrigger>
                            <SelectContent>
                                {manufacturableProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input id="quantity" type="number" value={newQuantity} onChange={e => setNewQuantity(parseInt(e.target.value, 10) || 1)} min="1" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateOrder} disabled={isSubmitting}>{isSubmitting ? <Loader className="animate-spin mr-2" /> : "Create Order"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Order: {selectedOrder?.id}</DialogTitle>
                    <DialogDescription>{selectedOrder?.productName} - Quantity: {selectedOrder?.quantity}</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh]">
                    <div className="py-4 grid grid-cols-1 gap-6 pr-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><PackageSearch /> Components (BoM)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!componentsAvailable && selectedOrder?.status !== 'in_progress' && selectedOrder?.status !== 'done' && (
                                    <Alert variant="destructive" className="mb-4">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Insufficient Stock!</AlertTitle>
                                        <AlertDescription>One or more components are out of stock. Update stock in the Inventory module.</AlertDescription>
                                    </Alert>
                                )}
                                <ScrollArea className="h-48 w-full">
                                    <div className="relative w-full overflow-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Component</TableHead>
                                                    <TableHead>Required</TableHead>
                                                    <TableHead>In Stock</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {componentsWithStock.map((c, index) => {
                                                    const required = c.quantity * (selectedOrder?.quantity || 1);
                                                    return (
                                                    <TableRow key={c.componentId || index}>
                                                        <TableCell>{c.name}</TableCell>
                                                        <TableCell>{required}</TableCell>
                                                        <TableCell className={c.stock < required ? 'text-destructive font-bold' : ''}>{c.stock}</TableCell>
                                                    </TableRow>
                                                )})}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Clock /> Work Orders</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {(selectedOrder?.workOrders || []).map((step, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 rounded-md bg-secondary">
                                            <p>{index + 1}. {step.operation}</p>
                                            <Badge variant="outline">{step.workCenter}</Badge>
                                        </div>
                                    ))}
                                    {(selectedOrder?.workOrders || []).length === 0 && <p className="text-muted-foreground text-sm">No routing steps defined in BoM.</p>}
                                </div>
                                <div className="mt-4">
                                    <Label>Progress</Label>
                                    <Progress value={selectedOrder?.status === 'done' ? 100 : (selectedOrder?.status === 'in_progress' ? 50 : (selectedOrder?.status === 'confirmed' ? 20 : 0))} className="w-full" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </ScrollArea>
                <DialogFooter className="pt-4 mt-4 border-t">
                    <Button variant="secondary" onClick={() => setIsDetailsDialogOpen(false)}>Close</Button>
                     <Button onClick={() => selectedOrder && handleStartProduction(selectedOrder.id)} disabled={!componentsAvailable || (selectedOrder?.status !== 'confirmed' && selectedOrder?.status !== 'draft')}>
                        <Play className="mr-2 h-4 w-4" /> Start Production
                    </Button>
                    <Button onClick={() => selectedOrder && handleMarkDone(selectedOrder.id)} disabled={selectedOrder?.status !== 'in_progress'}>
                        <CheckCircle className="mr-2 h-4 w-4" /> Mark as Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
         <Dialog open={isBomDialogOpen} onOpenChange={setIsBomDialogOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Create Bill of Materials</DialogTitle>
                    <DialogDescription>Define the components (from your Inventory) required to create a finished product.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="space-y-2">
                        <Label>Finished Product</Label>
                        <Select value={newBomProductId} onValueChange={(value) => {
                            setNewBomProductId(value);
                            setNewBomComponents([{tempId: Date.now(), componentId: '', quantity: 1}]);
                        }}>
                            <SelectTrigger>
                                <SelectValue placeholder={loadingInventory || loadingBoms ? "Loading products..." : "Select a product..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {productsWithoutBom.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label>Components</Label>
                             <Button variant="ghost" size="sm" onClick={handleGenerateBom} disabled={isAiLoading || !newBomProductId}>
                                {isAiLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                Generate with AI
                             </Button>
                        </div>
                        <ScrollArea className="h-48 w-full rounded-md border">
                            <div className="p-2 space-y-2 min-w-[400px]">
                                {newBomComponents.map((comp, index) => (
                                    <div key={comp.tempId} className="flex items-center gap-2">
                                        <Select
                                            value={comp.componentId}
                                            onValueChange={(value) => handleBomComponentChange(index, 'componentId', value)}
                                        >
                                            <SelectTrigger className="flex-1">
                                                <SelectValue placeholder="Select Component..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {inventory.map(item => (
                                                    <SelectItem key={item.id} value={item.id} disabled={item.id === newBomProductId}>
                                                        {item.name} (Stock: {item.stock})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Input 
                                            type="number" 
                                            value={comp.quantity} 
                                            onChange={(e) => handleBomComponentChange(index, 'quantity', e.target.value)}
                                            min="1" 
                                            className="w-24"
                                        />
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveComponent(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <Button variant="outline" size="sm" onClick={handleAddComponent} className="mt-2"><PlusCircle className="mr-2 h-4 w-4" /> Add Component</Button>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsBomDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveBom} disabled={isSubmitting}>{isSubmitting ? <Loader className="animate-spin mr-2" /> : "Save Bill of Materials"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>


    </div>
  );
}
