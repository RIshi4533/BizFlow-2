
'use client';

import { type DealStatus, type Deal } from "@/app/dashboard/sales/data";
import { type EmailCampaign } from "@/app/dashboard/email-marketing/page";
import { type Survey, type Question, type SurveySection } from "@/types/survey";

export type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  stock: number;
  description?: string;
  userId?: string;
};

export type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  createdAt?: any;
  sentTo?: string[];
  userId?: string;
};

export const initialContacts: Contact[] = [
  {
    id: '1',
    name: 'Innovate Inc.',
    email: 'alice.j@innovate.com',
    phone: '123-456-7890',
    company: 'Innovate Inc.',
  },
  {
    id: '2',
    name: 'Solutions Co.',
    email: 'bob.w@solutions.co',
    phone: '234-567-8901',
    company: 'Solutions Co.',
  },
  {
    id: '3',
    name: 'Creative LLC',
    email: 'charlie.b@creative.llc',
    phone: '345-678-9012',
    company: 'Creative LLC',
  },
];



import { Timestamp } from 'firebase/firestore';

export type Employee = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  hireDate: string; // stored as ISO string in mock data
  jobDescription?: string;
  ownerId: string; // ✅ Required for Firestore rules
  createdAt: Timestamp | null; // ✅ Firestore timestamp for ordering
};

// ✅ Mock data can use placeholder values for ownerId/createdAt
export const initialEmployees: Employee[] = [
  {
    id: 'employee_1',
    name: 'Michael Scott',
    email: 'michael.scott@bizflow.com',
    role: 'Regional Manager',
    department: 'Management',
    hireDate: '2001-04-01',
    jobDescription:
      'Oversees the entire branch, responsible for sales performance and day-to-day operations. Fosters a positive and energetic work environment through unique motivational techniques.',
    ownerId: 'mock-user-id',
    createdAt: null
  },
  {
    id: 'employee_2',
    name: 'Dwight Schrute',
    email: 'dwight.schrute@bizflow.com',
    role: 'Assistant to the Regional Manager',
    department: 'Sales',
    hireDate: '2002-07-15',
    jobDescription:
      'Top-performing salesperson with additional responsibilities including office safety, martial arts instruction, and beet farming. Aspires to lead the branch.',
    ownerId: 'mock-user-id',
    createdAt: null
  }
];

export type RentalLog = {
    type: 'check-in' | 'check-out';
    timestamp: Date;
    notes: string;
    imageUrl?: string;
};

export type RentalBooking = {
    id: string;
    itemId: string;
    itemName:string;
    userId: string;
    customerId: string;
    customerName: string;
    customerScore: number;
    dateRange: { from: Date; to: Date };
    status: 'booked' | 'rented' | 'returned';
    logs: RentalLog[];
};

export type AppointmentStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Pending';

export type Appointment = {
    id: string;
    userId: string;
    customerName?: string;
    staffName?: string;
    location: string;
    status: AppointmentStatus;
    date: Date;
    time: string;
    description: string;
    createdAt: Date;
};


export const initialBookings: RentalBooking[] = [
    {
        id: 'booking_1',
        itemId: 'item_1',
        itemName: 'Laptop Model X',
        userId: 'user_placeholder_id',
        customerId: '1',
        customerName: 'Innovate Inc.',
        customerScore: 5,
        dateRange: { from: new Date(), to: new Date(new Date().setDate(new Date().getDate() + 5)) },
        status: 'rented',
        logs: [],
    },
    {
        id: 'booking_2',
        itemId: 'item_4',
        itemName: 'USB-C Hub',
        userId: 'user_placeholder_id',
        customerId: '2',
        customerName: 'Solutions Co.',
        customerScore: 4,
        dateRange: { from: new Date(new Date().setDate(new Date().getDate() + 2)), to: new Date(new Date().setDate(new Date().getDate() + 7)) },
        status: 'booked',
        logs: [],
    },
];

export type TaskStatus = 'todo' | 'inprogress' | 'done';

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  userId?: string;
};

export const initialTasks: Task[] = [
  { id: '1', title: 'Launch Marketing Campaign', description: 'Plan and execute Q3 marketing campaign.', status: 'inprogress' },
  { id: '2', title: 'Develop New Website Feature', description: 'Add user profile pages.', status: 'todo' },
  { id: '3', title: 'Finalize Q2 Financial Report', description: 'Review and approve the final numbers.', status: 'done' },
];


export const initialDeals: Deal[] = [
  { id: '1', title: 'Website Redesign Project', client: 'Innovate Inc.', value: 15000, status: 'proposal', products: [{ sku: 'SERV-WEB', quantity: 1, name: 'Web Design Service'}] },
  { id: '2', title: 'Q3 Social Media Campaign', client: 'Solutions Co.', value: 7500, status: 'negotiation', products: [{ sku: 'SERV-MKTG', quantity: 1, name: 'Marketing Service'}] },
  { id: '3', title: 'ERP Implementation', client: 'Global United', value: 50000, status: 'qualified', products: [] },
  { id: '4', title: 'New Hardware Rollout', client: 'Tech Forward', value: 22000, status: 'lead', products: [{ sku: 'LP-1001', quantity: 10, name: 'Laptop Model X'}] },
  { id: '5', title: 'Annual Support Contract', client: 'Creative LLC', value: 8000, status: 'closed-won', products: [] },
];

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Partial' | 'Overdue';

export type InvoiceLineItem = {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
};

export type Invoice = {
    id: string;
    customerName: string;
    customerEmail: string;
    invoiceDate: string;
    dueDate: string;
    lineItems: InvoiceLineItem[];
    status: InvoiceStatus;
    total: number;
    paidAmount: number;
    aiSummary?: string;
    userId?: string;
};

export const initialInvoices: Invoice[] = [
    {
        id: 'INV-001',
        customerName: 'Innovate Inc.',
        customerEmail: 'alice.j@innovate.com',
        invoiceDate: '2023-10-15',
        dueDate: '2023-11-14',
        lineItems: [
            { id: '1', description: 'Website Redesign Project', quantity: 1, unitPrice: 15000 },
        ],
        status: 'Paid',
        total: 15000,
        paidAmount: 15000,
        aiSummary: 'Invoice for website redesign project.',
    },
    {
        id: 'INV-002',
        customerName: 'Solutions Co.',
        customerEmail: 'bob.w@solutions.co',
        invoiceDate: '2023-10-20',
        dueDate: '2023-11-19',
        lineItems: [
            { id: '1', description: 'Q3 Social Media Campaign', quantity: 1, unitPrice: 7500 },
            { id: '2', description: 'Consulting Hours', quantity: 10, unitPrice: 150 },
        ],
        status: 'Sent',
        total: 9000,
        paidAmount: 0,
        aiSummary: 'Invoice for social media campaign and consulting.',
    }
];

export type ExpenseStatus = 'Submitted' | 'Approved' | 'Rejected';

export type Transaction = {
    id: string;
    date: string;
    description: string;
    amount: number;
    status: string;
    ownerId?: string; // Added ownerId for consistency
  };
export type ExpenseCategory = 'Travel' | 'Food' | 'Office Supplies' | 'Software' | 'Utilities' | 'Other' | 'Mileage';
export type PaymentMethod = 'Credit Card' | 'Bank Transfer' | 'Cash';


export type Expense = {
    id: string;
    vendor: string;
    amount: number;
    date: string;
    category: ExpenseCategory;
    status: ExpenseStatus;
    employeeId: string;
    approverId: string;
    notes: string;
    reimbursedOn?: string;
    paymentMethod?: PaymentMethod;
    userId?: string;
};

export const initialExpenses: Expense[] = [
    {
        id: 'exp_1',
        vendor: 'Airline Company',
        amount: 450.00,
        date: new Date().toISOString(),
        category: 'Travel',
        status: 'Approved',
        employeeId: '2',
        approverId: '1',
        notes: 'Flight for client meeting.',
        reimbursedOn: new Date().toISOString(),
        paymentMethod: 'Credit Card',
    },
    {
        id: 'exp_2',
        vendor: 'Cloud Services Inc.',
        amount: 75.00,
        date: new Date().toISOString(),
        category: 'Software',
        status: 'Submitted',
        employeeId: '2',
        approverId: '1',
        notes: 'Monthly server hosting fees.',
    }
];

export type SignDocumentStatus = 'Draft' | 'Sent' | 'Signed' | 'Rejected';
export type SignerStatus = 'Pending' | 'Signed' | 'Rejected';

export type AuditLog = {
    action: string;
    actor: string;
    timestamp: string;
    details?: string;
};

export type SignerInfo = {
    contactId: string;
    name: string;
    email: string;
    status: SignerStatus;
    order: number;
};

export type SignDocument = {
  id: string;
  name: string;
  status: SignDocumentStatus;
  ownerEmail: string;
  signers: SignerInfo[];
  lastUpdated: string;
  auditTrail: AuditLog[];
  fileDataUrl?: string;
  userId?: string;
};

export type Job = {
    id: string;
    customer: string;
    technician: string;
    address: string;
    status: 'Scheduled' | 'In Progress' | 'Completed' | 'Pending';
    date: Date;
    description: string;
};

export type Technician = {
    id: string;
    name: string;
    skills: string[];
    available: boolean;
};

export type ApprovalRequest = {
  id: string;
  title: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  type: string;
  requester: string;
  createdAt: any; // Using `any` for mock simplicity. Firestore would be a Timestamp.
  amount?: number;
  userId?: string;
};

export const initialApprovals: ApprovalRequest[] = [
    {
        id: 'approval_1',
        title: 'Expense Report - Q3 Marketing',
        status: 'Pending',
        type: 'Expense',
        requester: 'Dwight Schrute',
        createdAt: { toDate: () => new Date('2023-10-25') },
        amount: 1250.75,
    },
    {
        id: 'approval_2',
        title: 'Vacation Request: Nov 20-25',
        status: 'Pending',
        type: 'Time Off',
        requester: 'Jim Halpert',
        createdAt: { toDate: () => new Date('2023-10-24') },
    },
    {
        id: 'approval_3',
        title: 'Purchase Order #PO-2023-005',
        status: 'Approved',
        type: 'Purchase',
        requester: 'Michael Scott',
        createdAt: { toDate: () => new Date('2023-10-22') },
        amount: 800,
    },
    {
        id: 'approval_4',
        title: 'Document: New Client Contract',
        status: 'Rejected',
        type: 'Document',
        requester: 'Dwight Schrute',
        createdAt: { toDate: () => new Date('2023-10-21') },
    }
];


export const initialJobs: Job[] = [
    {
        id: 'JOB-001',
        customer: 'Innovate Inc.',
        technician: 'Dwight Schrute',
        address: '123 Tech Park',
        status: 'Scheduled',
        date: new Date(),
        description: 'Fix leaky faucet'
    },
    {
        id: 'JOB-002',
        customer: 'Solutions Co.',
        technician: 'Unassigned',
        address: '456 Business Blvd',
        status: 'Pending',
        date: new Date(new Date().setDate(new Date().getDate() + 1)),
        description: 'Quarterly server maintenance'
    }
];

export const initialTechnicians: Technician[] = [
    { id: 'tech_1', name: 'Michael Scott', skills: ['Plumbing', 'HVAC'], available: true },
    { id: 'tech_2', name: 'Dwight Schrute', skills: ['Electrical', 'IT Support'], available: false },
    { id: 'tech_3', name: 'Jim Halpert', skills: ['General Maintenance'], available: true },
];

export const initialInventoryItems: InventoryItem[] = [
  { id: 'item_1', name: 'Laptop Model X', sku: 'LP-1001', stock: 25, description: "A high-performance laptop for professionals and creatives." },
  { id: 'item_2', name: 'Wireless Mouse', sku: 'MS-2034', stock: 150, description: "Ergonomic wireless mouse with long battery life." },
  { id: 'item_3', name: 'Mechanical Keyboard', sku: 'KB-4050', stock: 0, description: "Tactile and responsive mechanical keyboard for typing enthusiasts." },
  { id: 'item_4', name: 'USB-C Hub', sku: 'HUB-7001', stock: 5, description: "Expand your connectivity with this multi-port USB-C hub." },
  { id: 'item_5', name: 'Chassis', sku: 'CH-001', stock: 50 },
  { id: 'item_6', name: 'Screen 15"', sku: 'SC-015', stock: 40 },
  { id: 'item_7', name: 'Keyboard Unit', sku: 'KU-001', stock: 60 },
  { id: 'item_8', name: 'CPU i7', sku: 'CPU-I7', stock: 30 },
];

export type ManufacturingOrder = {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    status: 'draft' | 'confirmed' | 'in_progress' | 'done';
    bomId: string;
    components: BomComponent[];
    workOrders: WorkOrder[];
    expectedDate: string;
    actualStartDate?: string;
    actualEndDate?: string;
    userId?: string;
};

export type WorkOrder = {
    id: string;
    moId: string;
    operation: string;
    workCenter: string;
    duration: number; // in hours
    status: 'pending' | 'in_progress' | 'done';
};

export type BomComponent = {
    componentId: string;
    name: string;
    quantity: number;
};


export type BillOfMaterial = {
    id: string;
    productId: string;
    components: BomComponent[];
    routing: { operation: string, workCenter: string }[];
    userId?: string;
};

export type MaintenanceRequest = {
  id: string;
  equipmentId: string;
  type: "Preventive" | "Corrective";
  description: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Draft" | "Confirmed" | "In Progress" | "Done" | "Cancelled";
  requestedBy: string;
  requestedAt: any; // Firestore timestamp
  deadline?: any; // Firestore timestamp
  assignedTo?: string; // Team ID
};

export type Equipment = {
  id: string;
  name: string;
  category: string;
  location: string;
  serialNumber: string;
  status: "Active" | "In Repair" | "Disposed";
  nextMaintenance?: any; // Firestore timestamp
};

export type MaintenanceTeam = {
  id: string;
  name: string;
  members: string[]; // User emails or IDs
};

export const initialEquipment: Equipment[] = [
    { id: 'equip_1', name: 'CNC Machine A', category: 'Machinery', location: 'Shop Floor 1', serialNumber: 'SN-001', status: 'Active' },
    { id: 'equip_2', name: 'Forklift B', category: 'Vehicle', location: 'Warehouse', serialNumber: 'SN-002', status: 'Active' },
];

export const initialMaintenanceTeams: MaintenanceTeam[] = [
    { id: 'team_1', name: 'Mechanical Team', members: [] },
    { id: 'team_2', name: 'IT Support', members: [] },
];

export const initialMaintenanceRequests: MaintenanceRequest[] = [
    {
        id: 'req_1',
        equipmentId: 'equip_1',
        type: 'Corrective',
        description: 'Machine making a loud grinding noise.',
        priority: 'High',
        status: 'In Progress',
        requestedBy: 'operator@bizflow.com',
        requestedAt: { toDate: () => new Date() },
        assignedTo: 'team_1',
    }
];

export type LeaveType = 'Vacation' | 'Sick Leave' | 'Personal' | 'Unpaid';
export type LeaveRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export type LeaveRequest = {
    id: string;
    employeeId: string;
    employeeName: string;
    leaveType: LeaveType;
    dateRange: { from: Date, to: Date };
    reason: string;
    status: LeaveRequestStatus;
    approverId: string;
    userId?: string;
};

export type LeaveBalance = {
    employeeId: string;
    totalDays: number;
    daysUsed: number;
    userId?: string;
};

export const initialLeaveBalances: LeaveBalance[] = [
    { employeeId: 'employee_1', totalDays: 20, daysUsed: 5 },
    { employeeId: 'employee_2', totalDays: 15, daysUsed: 10 },
];

export const initialLeaveRequests: LeaveRequest[] = [
    {
        id: 'leave_1',
        employeeId: 'employee_2',
        employeeName: 'Dwight Schrute',
        leaveType: 'Vacation',
        dateRange: { from: new Date('2023-11-20'), to: new Date('2023-11-22') },
        reason: 'Family trip.',
        status: 'Approved',
        approverId: 'employee_1',
    },
    {
        id: 'leave_2',
        employeeId: 'employee_1',
        employeeName: 'Michael Scott',
        leaveType: 'Sick Leave',
        dateRange: { from: new Date(), to: new Date() },
        reason: 'Feeling unwell.',
        status: 'Pending',
        approverId: 'employee_1',
    }
];

export type FuelLog = {
    id: string;
    date: string;
    odometer: number;
    liters: number;
    cost: number;
};

export type MaintenanceLog = {
    id: string;
    date: string;
    service: string;
    cost: number;
    notes: string;
};

export type Vehicle = {
    id: string;
    name: string;
    plate: string;
    type: 'Car' | 'Truck' | 'Van' | 'Motorcycle';
    color: string;
    status: 'Active' | 'In Maintenance' | 'Sold' | 'Decommissioned';
    assignedDriverId?: string;
    odometer: number;
    fuelLogs?: FuelLog[];
    maintenanceLogs?: MaintenanceLog[];
    imageUrl?: string;
    userId?: string;
};

export const initialVehicles: Vehicle[] = [
  {
    id: 'vhc_1',
    name: 'Ford Transit',
    plate: 'ABC-1234',
    type: 'Van',
    color: 'White',
    status: 'Active',
    assignedDriverId: 'employee_2',
    odometer: 75240,
  },
  {
    id: 'vhc_2',
    name: 'Toyota Camry',
    plate: 'XYZ-9876',
    type: 'Car',
    color: 'Silver',
    status: 'In Maintenance',
    assignedDriverId: 'employee_1',
    odometer: 112500,
  },
];
