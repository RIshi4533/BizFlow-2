
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Store, Camera, Video, AlertCircle, RefreshCcw, Trash2, MoreHorizontal, Edit, Loader } from "lucide-react";
import Image from "next/image";
import { useAuth } from '@/hooks/use-auth';
import { type InventoryItem, initialInventoryItems } from '@/lib/mock-data';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';


type Product = InventoryItem & { 
    price: number;
    imageUrl?: string; 
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

const DEFAULT_IMAGE = "https://placehold.co/64x64.png";

export default function ECommercePage() {
  const { user } = useAuth();
  const [products, setProducts] = React.useState<Product[]>([]);
  const { toast } = useToast();

  const inventoryQuery = user ? query(collection(db, 'inventory'), where('ownerId', '==', user.uid), orderBy('name')) : null;
  const [inventorySnapshot, loadingInventory] = useCollection(inventoryQuery);
  const inventoryItems: InventoryItem[] = inventorySnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() as InventoryItem })) || [];


  const [isCameraDialogOpen, setIsCameraDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [currentPrice, setCurrentPrice] = React.useState<number | string>('');

  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
  
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  
  const getStorageKey = React.useCallback(() => {
    return user ? `bizflow-ecommerce-products-${user.uid}` : '';
  }, [user]);

  React.useEffect(() => {
    if (loadingInventory) return;
    
    const productStorageKey = getStorageKey();
    if (!productStorageKey) {
        setProducts([]);
        return;
    }
    
    try {
        const storedProducts = localStorage.getItem(productStorageKey);
        const ecomProducts: Record<string, Partial<Product>> = storedProducts ? JSON.parse(storedProducts) : {};

        const getPrice = (sku: string) => (sku.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100) + 0.99;

        const mergedProducts = inventoryItems.map(item => ({
            ...item,
            price: ecomProducts[item.id]?.price || getPrice(item.sku),
            imageUrl: ecomProducts[item.id]?.imageUrl,
        }));
        
        setProducts(mergedProducts);

    } catch (error) {
        console.error("Failed to parse data from localStorage", error);
        setProducts([]);
    }
  }, [inventoryItems, loadingInventory, getStorageKey]);

  const persistProductData = (productId: string, data: Partial<Product>) => {
      const storageKey = getStorageKey();
      if (!storageKey) return;
      const stored = localStorage.getItem(storageKey) || '{}';
      const ecomProducts = JSON.parse(stored);
      if (!ecomProducts[productId]) {
          ecomProducts[productId] = {};
      }
      Object.assign(ecomProducts[productId], data);
      localStorage.setItem(storageKey, JSON.stringify(ecomProducts));
  };
  
  const handleRemoveImage = (productId: string) => {
    const updatedProducts = products.map(p =>
      p.id === productId ? { ...p, imageUrl: undefined } : p
    );
    setProducts(updatedProducts);
    persistProductData(productId, { imageUrl: undefined });
    toast({ title: 'Success', description: `Image for product removed.` });
  };
  
  const handleOpenEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setCurrentPrice(product.price);
    setIsEditDialogOpen(true);
  };

  const handleSavePrice = () => {
    if (!selectedProduct || currentPrice === '') return;
    const newPrice = typeof currentPrice === 'string' ? parseFloat(currentPrice) : currentPrice;

    const updatedProducts = products.map(p =>
      p.id === selectedProduct.id ? { ...p, price: newPrice } : p
    );
    setProducts(updatedProducts);
    persistProductData(selectedProduct.id, { price: newPrice });
    toast({ title: 'Success', description: 'Product price updated.' });
    setIsEditDialogOpen(false);
    setSelectedProduct(null);
  };


  const handleOpenCameraDialog = (product: Product) => {
    setSelectedProduct(product);
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
  
  const handleSaveImage = () => {
    if (capturedImage && selectedProduct) {
        const updatedProducts = products.map(p => 
            p.id === selectedProduct.id ? { ...p, imageUrl: capturedImage } : p
        );
        setProducts(updatedProducts);
        persistProductData(selectedProduct.id, { imageUrl: capturedImage });
        toast({ title: 'Success', description: `Image for ${selectedProduct.name} updated.` });
        setIsCameraDialogOpen(false);
    }
  };

  const aihint = (name: string) => name.split(' ').slice(0, 2).join(' ').toLowerCase();
  const getStatus = (stock: number) => stock > 0 ? { text: 'In Stock', variant: 'outline' as const } : { text: 'Out of Stock', variant: 'destructive' as const };
  
  return (
     <div className="flex flex-col gap-6">
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>E-Commerce</CardTitle>
                        <CardDescription>Manage your online store products. Images updated here will sync with your website.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loadingInventory ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader className="w-8 h-8 animate-spin" />
                    </div>
                ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="hidden w-[100px] sm:table-cell">Image</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Stock</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((product) => {
                            const status = getStatus(product.stock);
                            return (
                            <TableRow key={product.id}>
                                <TableCell className="hidden sm:table-cell">
                                    <Image
                                        alt={product.name}
                                        className="aspect-square rounded-md object-cover"
                                        height="64"
                                        src={product.imageUrl || DEFAULT_IMAGE}
                                        width="64"
                                        unoptimized // Required for base64 data URIs
                                        data-ai-hint={aihint(product.name)}
                                    />
                                </TableCell>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell><Badge variant={status.variant}>{status.text}</Badge></TableCell>
                                <TableCell className="text-right font-medium">{formatCurrency(product.price)}</TableCell>
                                <TableCell className="text-right">{product.stock}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Toggle menu</span>
                                        </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleOpenEditDialog(product)}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit Product
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleOpenCameraDialog(product)}>
                                                <Camera className="mr-2 h-4 w-4" /> Update Image
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleRemoveImage(product.id)} className="text-destructive" disabled={!product.imageUrl}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Remove Image
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )})}
                         {products.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    No products found. Add items in the Inventory module first.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                )}
            </CardContent>
        </Card>
        
        {/* Camera Dialog */}
        <Dialog open={isCameraDialogOpen} onOpenChange={setIsCameraDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Update Image for {selectedProduct?.name}</DialogTitle>
                    <DialogDescription>
                        Position the product in front of the camera and capture a photo.
                    </DialogDescription>
                </DialogHeader>
                 <div className="py-4 space-y-4">
                    <canvas ref={canvasRef} className="hidden" />
                    
                    <div className="relative">
                       <video 
                            ref={videoRef} 
                            className={`w-full aspect-video rounded-md bg-secondary ${capturedImage ? 'hidden' : 'block'}`} 
                            autoPlay 
                            muted 
                            playsInline 
                        />
                         {capturedImage && (
                           <Image src={capturedImage} alt="Captured product" width={1280} height={720} className="rounded-md" unoptimized />
                         )}
                    </div>
                    
                    {hasCameraPermission === null && (
                         <div className="flex items-center justify-center h-48">
                            <p>Requesting camera access...</p>
                        </div>
                    )}
                     {hasCameraPermission === false && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Camera Access Required</AlertTitle>
                            <AlertDescription>
                                Please allow camera access to use this feature. You may need to refresh the page after granting permissions in your browser settings.
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
                             <Button onClick={handleSaveImage}>Save Image</Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit {selectedProduct?.name}</DialogTitle>
                    <DialogDescription>
                        Update the product details below.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right">Price ($)</Label>
                        <Input
                            id="price"
                            type="number"
                            value={currentPrice}
                            onChange={(e) => setCurrentPrice(e.target.value)}
                            className="col-span-3"
                            placeholder="e.g. 99.99"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSavePrice}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

     </div>
  );
}
