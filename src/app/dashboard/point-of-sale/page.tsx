
'use client';

import * as React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MinusCircle, XCircle, Search, ShoppingCart, DollarSign, CreditCard, CheckCircle } from "lucide-react";
import Image from "next/image";
import { useAuth } from '@/hooks/use-auth';
import { initialInventoryItems, type InventoryItem } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Product = InventoryItem & { 
    price: number;
    imageUrl?: string; 
};

type CartItem = Product & {
    quantity: number;
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

const DEFAULT_IMAGE = "https://placehold.co/150x150.png";

export default function PointOfSalePage() {
  const { user } = useAuth();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const { toast } = useToast();
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = React.useState(false);

  const getPrice = (sku: string) => (sku.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100) + 0.99;

  const inventoryStorageKey = React.useCallback(() => {
    return user ? `bizflow-inventory-${user.uid}` : '';
  }, [user]);

  const ecomStorageKey = React.useCallback(() => {
    return user ? `bizflow-ecommerce-products-${user.uid}` : '';
  }, [user]);


  const fetchProducts = React.useCallback(() => {
     const invKey = inventoryStorageKey();
     const ecomKey = ecomStorageKey();
     if (!invKey || !ecomKey) return;
     
     try {
         const storedInventory = localStorage.getItem(invKey);
         const inventory: InventoryItem[] = storedInventory ? JSON.parse(storedInventory) : initialInventoryItems;

         const storedEcom = localStorage.getItem(ecomKey);
         const ecomProducts: Record<string, Partial<Product>> = storedEcom ? JSON.parse(storedEcom) : {};

         const mergedProducts = inventory.map(item => ({
             ...item,
             price: ecomProducts[item.id]?.price || getPrice(item.sku),
             imageUrl: ecomProducts[item.id]?.imageUrl,
         }));
         setProducts(mergedProducts);
     } catch (error) {
         console.error("Failed to parse POS data from localStorage", error);
         setProducts([]);
     }
  }, [inventoryStorageKey, ecomStorageKey]);


  React.useEffect(() => {
      fetchProducts();
  }, [fetchProducts]);

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity < product.stock) {
          return prevCart.map(item => 
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        } else {
          toast({ title: "Stock limit reached", description: `Cannot add more of ${product.name}.`, variant: "destructive" });
          return prevCart;
        }
      } else {
        if (product.stock > 0) {
          return [...prevCart, { ...product, quantity: 1 }];
        } else {
          toast({ title: "Out of stock", description: `${product.name} is currently unavailable.`, variant: "destructive" });
          return prevCart;
        }
      }
    });
  };
  
  const updateQuantity = (productId: string, newQuantity: number) => {
    setCart(prevCart => {
      const itemToUpdate = prevCart.find(item => item.id === productId);
      if (!itemToUpdate) return prevCart;

      if (newQuantity > 0 && newQuantity <= itemToUpdate.stock) {
        return prevCart.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item);
      } else if (newQuantity === 0) {
        return prevCart.filter(item => item.id !== productId);
      } else {
        toast({ title: "Invalid quantity", description: "Quantity cannot exceed stock.", variant: "destructive" });
        return prevCart;
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const handleConfirmPayment = () => {
    const invKey = inventoryStorageKey();
    if (!invKey) return;

    try {
        const storedInventory = localStorage.getItem(invKey);
        let inventory: InventoryItem[] = storedInventory ? JSON.parse(storedInventory) : initialInventoryItems;

        cart.forEach(cartItem => {
            inventory = inventory.map(invItem => 
                invItem.id === cartItem.id 
                ? { ...invItem, stock: invItem.stock - cartItem.quantity }
                : invItem
            );
        });

        localStorage.setItem(invKey, JSON.stringify(inventory));
        
        toast({
            title: "Sale Complete!",
            description: "Inventory has been updated.",
        });

        setCart([]);
        setIsPaymentDialogOpen(false);
        fetchProducts(); // Refetch products to get updated stock levels
    } catch (error) {
        console.error("Failed to update inventory", error);
        toast({ title: "Error", description: "Could not update inventory.", variant: "destructive" });
    }
  };
  
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cartSubtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const taxRate = 0.08; // 8% GST
  const cartTax = cartSubtotal * taxRate;
  const cartTotal = cartSubtotal + cartTax;

  const aihint = (name: string) => name.split(' ').slice(0, 2).join(' ').toLowerCase();

  return (
    <>
    <div className="h-[calc(100vh-8rem)] grid grid-cols-3 gap-6">
      {/* Product Selection */}
      <div className="col-span-2 flex flex-col gap-6">
        <Card>
           <CardHeader>
             <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search products..." 
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
           </CardHeader>
        </Card>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-y-auto pr-2">
            {filteredProducts.map(product => (
                <Card 
                    key={product.id} 
                    className={`flex flex-col cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 ${product.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => product.stock > 0 && addToCart(product)}
                >
                    <CardContent className="p-0 relative">
                        <Image 
                            src={product.imageUrl || DEFAULT_IMAGE} 
                            alt={product.name} 
                            width={150} 
                            height={150} 
                            className="w-full aspect-square object-cover rounded-t-lg"
                            unoptimized
                            data-ai-hint={aihint(product.name)}
                        />
                         <Badge variant={product.stock > 0 ? 'default' : 'destructive'} className="absolute top-2 right-2">
                           {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
                         </Badge>
                    </CardContent>
                    <CardFooter className="flex flex-col items-start p-3 flex-1">
                        <p className="font-semibold text-sm flex-1">{product.name}</p>
                        <p className="text-lg font-bold text-primary">{formatCurrency(product.price)}</p>
                    </CardFooter>
                </Card>
            ))}
        </div>
      </div>

      {/* Cart & Checkout */}
      <div className="col-span-1">
        <Card className="flex flex-col h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShoppingCart />
                    Current Order
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
               {cart.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
                    <ShoppingCart className="w-16 h-16" />
                    <p className="mt-4">Your cart is empty.</p>
                    <p className="text-sm">Click on products to add them to the order.</p>
                 </div>
               ) : (
                cart.map(item => (
                    <div key={item.id} className="flex items-center gap-4">
                        <Image src={item.imageUrl || DEFAULT_IMAGE} alt={item.name} width={48} height={48} className="rounded-md object-cover" unoptimized />
                        <div className="flex-1">
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-muted-foreground text-xs">{formatCurrency(item.price)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity - 1)}><MinusCircle className="w-4 h-4" /></Button>
                            <span className="w-6 text-center">{item.quantity}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity + 1)}><PlusCircle className="w-4 h-4" /></Button>
                        </div>
                        <p className="font-semibold w-16 text-right">{formatCurrency(item.price * item.quantity)}</p>
                         <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFromCart(item.id)}><XCircle className="w-4 h-4" /></Button>
                    </div>
                ))
               )}
            </CardContent>
             {cart.length > 0 && (
                <CardFooter className="flex flex-col gap-4 p-4 border-t">
                    <div className="w-full space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>{formatCurrency(cartSubtotal)}</span>
                        </div>
                         <div className="flex justify-between">
                            <span>Tax ({(taxRate * 100).toFixed(0)}%)</span>
                            <span>{formatCurrency(cartTax)}</span>
                        </div>
                         <Separator />
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>{formatCurrency(cartTotal)}</span>
                        </div>
                    </div>
                    <Button size="lg" className="w-full" onClick={() => setIsPaymentDialogOpen(true)}>
                        <CreditCard className="mr-2" />
                        Proceed to Payment
                    </Button>
                </CardFooter>
            )}
        </Card>
      </div>
    </div>
    <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Finalize Payment</DialogTitle>
                <DialogDescription>
                    Select a payment method to complete the transaction.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div className="p-6 rounded-lg bg-secondary text-center">
                    <p className="text-sm text-muted-foreground">Amount Due</p>
                    <p className="text-4xl font-bold text-primary">{formatCurrency(cartTotal)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" size="lg">Cash</Button>
                    <Button variant="outline" size="lg">Card</Button>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
                <Button size="lg" onClick={handleConfirmPayment}>
                    <CheckCircle className="mr-2" />
                    Confirm Sale
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );

    