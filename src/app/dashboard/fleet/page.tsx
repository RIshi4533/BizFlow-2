
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Car,
  PlusCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  Wrench,
  PackageCheck,
  PackageX,
  Droplets,
  Gauge,
  FileText,
  Loader
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
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  type Vehicle,
  type Employee,
  type FuelLog,
  type MaintenanceLog,
  initialEmployees,
} from '@/lib/mock-data';
import Image from 'next/image';
import { format } from 'date-fns';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '@/lib/firebase';
import { collection, query, where, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';


const getStatusStyles = (status: Vehicle['status']) => {
  switch (status) {
    case 'Active':
      return {
        variant: 'default' as const,
        className: 'bg-green-100 text-green-800',
      };
    case 'In Maintenance':
      return {
        variant: 'secondary' as const,
        className: 'bg-yellow-100 text-yellow-800',
      };
    case 'Sold':
      return {
        variant: 'outline' as const,
        className: 'bg-gray-100 text-gray-800',
      };
    case 'Decommissioned':
    default:
      return {
        variant: 'destructive' as const,
        className: 'bg-red-100 text-red-800',
      };
  }
};

const initialVehicleState: Omit<Vehicle, 'id' | 'userId'> = {
  name: '',
  plate: '',
  type: 'Car',
  color: '',
  status: 'Active',
  odometer: 0,
  fuelLogs: [],
  maintenanceLogs: [],
};

function VehicleDetailsDialog({
  vehicle,
  open,
  onOpenChange,
  onUpdate,
}: {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (updatedVehicle: Vehicle) => void;
}) {
  const [newFuelLog, setNewFuelLog] = React.useState<Omit<FuelLog, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    odometer: vehicle?.odometer || 0,
    liters: 0,
    cost: 0,
  });
  const [newMaintLog, setNewMaintLog] = React.useState<
    Omit<MaintenanceLog, 'id'>
  >({
    date: new Date().toISOString().split('T')[0],
    service: '',
    cost: 0,
    notes: '',
  });

  const handleAddFuelLog = () => {
    if (!vehicle || newFuelLog.liters <= 0 || newFuelLog.cost <= 0) return;
    const updatedVehicle: Vehicle = {
      ...vehicle,
      fuelLogs: [
        ... (vehicle.fuelLogs || []),
        { ...newFuelLog, id: `fuel_${Date.now()}` },
      ],
      odometer: newFuelLog.odometer, // Update vehicle odometer with latest fuel log
    };
    onUpdate(updatedVehicle);
    setNewFuelLog({ date: new Date().toISOString().split('T')[0], odometer: updatedVehicle.odometer, liters: 0, cost: 0 });
  };
  
  const handleAddMaintLog = () => {
    if (!vehicle || !newMaintLog.service) return;
     const updatedVehicle: Vehicle = {
      ...vehicle,
      maintenanceLogs: [
        ... (vehicle.maintenanceLogs || []),
        { ...newMaintLog, id: `maint_${Date.now()}` },
      ],
    };
    onUpdate(updatedVehicle);
    setNewMaintLog({ date: new Date().toISOString().split('T')[0], service: '', cost: 0, notes: '' });
  };


  if (!vehicle) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {vehicle.name} ({vehicle.plate})
          </DialogTitle>
          <DialogDescription>
            View and manage vehicle logs and details.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="fuel">
          <TabsList>
            <TabsTrigger value="fuel">
              <Droplets className="mr-2 h-4 w-4" />
              Fuel Logs
            </TabsTrigger>
            <TabsTrigger value="maintenance">
              <Wrench className="mr-2 h-4 w-4" />
              Maintenance
            </TabsTrigger>
          </TabsList>
          <TabsContent value="fuel" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Add Fuel Entry</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="space-y-1">
                    <Label htmlFor="fuel-date">Date</Label>
                    <Input id="fuel-date" type="date" value={newFuelLog.date} onChange={(e) => setNewFuelLog({...newFuelLog, date: e.target.value})} />
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="fuel-odometer">Odometer</Label>
                    <Input id="fuel-odometer" type="number" value={newFuelLog.odometer} onChange={(e) => setNewFuelLog({...newFuelLog, odometer: parseInt(e.target.value) || 0})} />
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="fuel-liters">Liters</Label>
                    <Input id="fuel-liters" type="number" value={newFuelLog.liters} onChange={(e) => setNewFuelLog({...newFuelLog, liters: parseFloat(e.target.value) || 0})} />
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="fuel-cost">Total Cost</Label>
                    <Input id="fuel-cost" type="number" value={newFuelLog.cost} onChange={(e) => setNewFuelLog({...newFuelLog, cost: parseFloat(e.target.value) || 0})} />
                </div>
              </CardContent>
              <CardFooter>
                  <Button onClick={handleAddFuelLog}>Add Log</Button>
              </CardFooter>
            </Card>
            <Table className="mt-4">
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Odometer</TableHead>
                        <TableHead>Liters</TableHead>
                        <TableHead>Cost</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {(vehicle.fuelLogs || []).map(log => (
                        <TableRow key={log.id}>
                            <TableCell>{format(new Date(log.date), 'PPP')}</TableCell>
                            <TableCell>{log.odometer.toLocaleString()} km</TableCell>
                            <TableCell>{log.liters.toFixed(2)} L</TableCell>
                            <TableCell>${log.cost.toFixed(2)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </TabsContent>
          <TabsContent value="maintenance">
             <Card>
              <CardHeader>
                <CardTitle>Add Maintenance Record</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <Label htmlFor="maint-date">Date</Label>
                    <Input id="maint-date" type="date" value={newMaintLog.date} onChange={(e) => setNewMaintLog({...newMaintLog, date: e.target.value})} />
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="maint-cost">Total Cost</Label>
                    <Input id="maint-cost" type="number" value={newMaintLog.cost} onChange={(e) => setNewMaintLog({...newMaintLog, cost: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="md:col-span-2 space-y-1">
                    <Label htmlFor="maint-service">Service Performed</Label>
                    <Input id="maint-service" value={newMaintLog.service} onChange={(e) => setNewMaintLog({...newMaintLog, service: e.target.value})} placeholder="e.g., Oil Change, Tire Rotation"/>
                </div>
              </CardContent>
              <CardFooter>
                  <Button onClick={handleAddMaintLog}>Add Record</Button>
              </CardFooter>
            </Card>
             <Table className="mt-4">
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Cost</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                     {(vehicle.maintenanceLogs || []).map(log => (
                        <TableRow key={log.id}>
                            <TableCell>{format(new Date(log.date), 'PPP')}</TableCell>
                            <TableCell>{log.service}</TableCell>
                            <TableCell>${log.cost.toFixed(2)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}


export default function FleetPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    
    const vehiclesQuery = user ? query(collection(db, 'vehicles'), where('userId', '==', user.uid)) : null;
    const [vehiclesSnapshot, loadingVehicles] = useCollection(vehiclesQuery);
    const vehicles: Vehicle[] = vehiclesSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() as any })) || [];

    const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
    const [isEditing, setIsEditing] = React.useState(false);
    const [currentVehicle, setCurrentVehicle] = React.useState<Omit<Vehicle, 'id' | 'userId'> | Vehicle>(initialVehicleState);
    
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false);
    const [selectedVehicle, setSelectedVehicle] = React.useState<Vehicle | null>(null);

    const handleOpenDialog = (vehicle?: Vehicle) => {
        if (vehicle) {
            setCurrentVehicle(vehicle);
            setIsEditing(true);
        } else {
            setCurrentVehicle(initialVehicleState);
            setIsEditing(false);
        }
        setIsAddDialogOpen(true);
    };
    
    const handleOpenDetailsDialog = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setIsDetailsDialogOpen(true);
    }
    
    const handleUpdateVehicle = async (updatedVehicle: Vehicle) => {
        if (!updatedVehicle.id) return;
        const docRef = doc(db, 'vehicles', updatedVehicle.id);
        const { id, ...dataToSave } = updatedVehicle;
        await updateDoc(docRef, dataToSave);
        setSelectedVehicle(updatedVehicle); // Keep the dialog updated
    };

    const handleSaveVehicle = async () => {
        if (!currentVehicle.name || !currentVehicle.plate || !user) {
            toast({ title: 'Error', description: 'Vehicle name and license plate are required.', variant: 'destructive' });
            return;
        }

        const vehicleData = { ...currentVehicle, userId: user.uid };
        
        try {
            if (isEditing && 'id' in currentVehicle) {
                const { id, userId, ...dataToUpdate } = currentVehicle; // Remove id and userId
                const docRef = doc(db, 'vehicles', id);
                await updateDoc(docRef, dataToUpdate);
                toast({ title: 'Success', description: 'Vehicle updated.' });
            } else {
                await addDoc(collection(db, 'vehicles'), { ...vehicleData, createdAt: serverTimestamp() }); // createdAt is handled by serverTimestamp()
                toast({ title: 'Success', description: 'New vehicle added to the fleet.' });
            }
            setIsAddDialogOpen(false);
        } catch(error) {
            console.error("Error saving vehicle:", error);
            toast({ title: 'Error', description: 'Could not save vehicle.', variant: 'destructive' });
        }
    };
    
    const handleDeleteVehicle = async (id: string) => {
        try {
          await deleteDoc(doc(db, 'vehicles', id));
          toast({ title: 'Success', description: 'Vehicle has been removed.'});
        } catch(error) {
          toast({ title: 'Error', description: 'Could not delete vehicle.', variant: 'destructive'});
        }
    };

    const activeCount = vehicles.filter(v => v.status === 'Active').length;
    const maintenanceCount = vehicles.filter(v => v.status === 'In Maintenance').length;
    const outOfServiceCount = vehicles.filter(v => v.status === 'Sold' || v.status === 'Decommissioned').length;

    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Car className="w-8 h-8 text-primary" />
                            <div>
                                <CardTitle>Fleet Management</CardTitle>
                                <CardDescription>Oversee all company vehicles, assignments, and maintenance.</CardDescription>
                            </div>
                        </div>
                        <Button onClick={() => handleOpenDialog()}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Vehicle
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
                        <PackageCheck className="w-4 h-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeCount}</div>
                        <p className="text-xs text-muted-foreground">Currently in operation</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">In Maintenance</CardTitle>
                        <Wrench className="w-4 h-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{maintenanceCount}</div>
                        <p className="text-xs text-muted-foreground">Currently in service</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Out of Service</CardTitle>
                        <PackageX className="w-4 h-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{outOfServiceCount}</div>
                        <p className="text-xs text-muted-foreground">Sold or decommissioned</p>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Fleet Overview</CardTitle>
                    <CardDescription>A complete list of all vehicles in your fleet. Click a row to see details.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-20">Image</TableHead>
                                <TableHead>Vehicle</TableHead>
                                <TableHead>License Plate</TableHead>
                                <TableHead>Assigned Driver</TableHead>
                                <TableHead>Odometer</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loadingVehicles && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24"><Loader className="animate-spin mx-auto" /></TableCell>
                                </TableRow>
                            )}
                            {vehicles.map(vehicle => {
                                const status = getStatusStyles(vehicle.status);
                                const driver = initialEmployees.find(e => e.id === vehicle.assignedDriverId);
                                return (
                                    <TableRow key={vehicle.id} onClick={() => handleOpenDetailsDialog(vehicle)} className="cursor-pointer">
                                        <TableCell>
                                            <Image 
                                                src={vehicle.imageUrl || 'https://placehold.co/64x64.png'} 
                                                alt={vehicle.name} 
                                                width={64} 
                                                height={64}
                                                className="rounded-md object-cover"
                                                data-ai-hint="vehicle car"
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{vehicle.name}</TableCell>
                                        <TableCell>{vehicle.plate}</TableCell>
                                        <TableCell>{driver?.name || 'Unassigned'}</TableCell>
                                        <TableCell>{vehicle.odometer.toLocaleString()} km</TableCell>
                                        <TableCell><Badge variant={status.variant} className={status.className}>{vehicle.status}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                     <DropdownMenuItem onClick={() => handleOpenDetailsDialog(vehicle)}><FileText className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleOpenDialog(vehicle)}><Edit className="mr-2 h-4 w-4" />Edit Vehicle</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild><DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem></AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>This action will permanently delete this vehicle record.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteVehicle(vehicle.id)}>Continue</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            {!loadingVehicles && vehicles.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24">No vehicles in the fleet. Add one to get started.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit' : 'Add'} Vehicle</DialogTitle>
                        <DialogDescription>Fill out the details for the vehicle.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="v-name" className="text-right">Name</Label>
                            <Input id="v-name" value={currentVehicle.name} onChange={e => setCurrentVehicle({...currentVehicle, name: e.target.value})} className="col-span-3" placeholder="e.g. Ford Transit"/>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="v-plate" className="text-right">License Plate</Label>
                            <Input id="v-plate" value={currentVehicle.plate} onChange={e => setCurrentVehicle({...currentVehicle, plate: e.target.value})} className="col-span-3" placeholder="e.g. ABC-1234"/>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="v-odometer" className="text-right">Odometer (km)</Label>
                            <Input id="v-odometer" type="number" value={currentVehicle.odometer} onChange={e => setCurrentVehicle({...currentVehicle, odometer: parseInt(e.target.value, 10) || 0})} className="col-span-3" placeholder="e.g. 75000"/>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="v-driver" className="text-right">Driver</Label>
                            <Select value={currentVehicle.assignedDriverId} onValueChange={value => setCurrentVehicle({...currentVehicle, assignedDriverId: value})}>
                                <SelectTrigger className="col-span-3"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                                <SelectContent>
                                    {initialEmployees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="v-status" className="text-right">Status</Label>
                            <Select value={currentVehicle.status} onValueChange={(value: Vehicle['status']) => setCurrentVehicle({...currentVehicle, status: value})}>
                                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="In Maintenance">In Maintenance</SelectItem>
                                    <SelectItem value="Sold">Sold</SelectItem>
                                    <SelectItem value="Decommissioned">Decommissioned</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveVehicle}>Save Vehicle</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            <VehicleDetailsDialog 
                vehicle={selectedVehicle}
                open={isDetailsDialogOpen}
                onOpenChange={setIsDetailsDialogOpen}
                onUpdate={handleUpdateVehicle}
            />
        </div>
    );
}
