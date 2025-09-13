
import {
  HeartHandshake,
  TrendingUp,
  Boxes,
  Landmark,
  KanbanSquare,
  Contact,
  Truck,
  UsersRound,
  Megaphone,
  LifeBuoy,
  CalendarDays,
  Store,
  Paintbrush,
  BrainCircuit,
  AtSign,
  Receipt,
  CalendarPlus,
  CheckSquare,
  Mailbox,
  TrendingDown,
  FileQuestion,
  Star,
  Bus,
  ClipboardCheck,
  Globe,
  Users,
  LineChart,
  Laptop,
  BookUser,
  KeyRound,
  Camera,
  Calculator,
  Signature,
  LayoutGrid,
  Timer,
  CalendarCheck,
  MessagesSquare,
  Calendar,
  Library,
  Package,
  Cog,
  CreditCard,
  ShieldCheck,
  Mail,
  ClipboardList,
  CalendarCheck2,
  UserPlus,
  Plane,
  UserCheck,
  Award,
  DollarSign,
  Bot,
  Brain,
  Car,
  FileText,
  ShoppingCart,
  MessageCircle,
  CalendarOff,
} from 'lucide-react';


export const moduleGroups = [
  {
    title: 'Website',
    modules: [
      { href: '/dashboard/website-builder', icon: Globe, title: 'Website' },
      { href: '/dashboard/e-commerce', icon: ShoppingCart, title: 'eCommerce' },
    ]
  },
  {
    title: 'Sales',
    modules: [
      { href: '/dashboard/crm', icon: Users, title: 'CRM' },
      { href: '/dashboard/sales', icon: LineChart, title: 'Sales' },
      { href: '/dashboard/point-of-sale', icon: Laptop, title: 'Point of Sale' },
       { href: '/dashboard/email-marketing', icon: Megaphone, title: 'Email Marketing' },
       { href: '/dashboard/survey', icon: FileQuestion, title: 'Survey' },
      { href: '/dashboard/contacts', icon: BookUser, title: 'Contacts' },
    ]
  },
   {
    title: 'Rental',
    modules: [
      { href: '/dashboard/rental', icon: KeyRound, title: 'Rental' },
    ]
  },
  {
    title: 'Finance',
    modules: [
      { href: '/dashboard/accounting', icon: Calculator, title: 'Accounting' },
      { href: '/dashboard/invoicing', icon: FileText, title: 'Invoicing' },
      { href: '/dashboard/expenses', icon: TrendingDown, title: 'Expenses' },
      { href: '/dashboard/sign', icon: Signature, title: 'Sign' },
    ]
  },
   {
    title: 'Services',
    modules: [
      { href: '/dashboard/projects', icon: LayoutGrid, title: 'Project' },
      { href: '/dashboard/timesheets', icon: Timer, title: 'Timesheets' },
      { href: '/dashboard/field-service', icon: Truck, title: 'Field Service' },
      { href: '/dashboard/helpdesk', icon: MessageCircle, title: 'Helpdesk' },
      { href: '/dashboard/appointments', icon: CalendarCheck, title: 'Appointments' },
    ]
  },
   {
    title: 'Productivity',
    modules: [
      { href: '/dashboard/discuss', icon: MessagesSquare, title: 'Discuss' },
      { href: '/dashboard/calendar', icon: Calendar, title: 'Calendar' },
      { href: '/dashboard/knowledge', icon: Library, title: 'Knowledge' },
      { href: '/dashboard/approvals', icon: ClipboardCheck, title: 'Approvals' },
      { href: '/dashboard/events', icon: CalendarDays, title: 'Events' },
    ]
  },
   {
    title: 'Supply Chain',
    modules: [
      { href: '/dashboard/inventory', icon: Package, title: 'Inventory' },
      { href: '/dashboard/purchase', icon: CreditCard, title: 'Purchase' },
    ]
  },
   {
    title: 'Human Resources',
    modules: [
      { href: '/dashboard/hr', icon: Users, title: 'Employees' },
      { href: '/dashboard/recruitment', icon: UserPlus, title: 'Recruitment' },
      { href: '/dashboard/time-off', icon: CalendarOff, title: 'Time Off' },
      { href: '/dashboard/attendances', icon: UserCheck, title: 'Attendances' },
      { href: '/dashboard/appraisals', icon: Award, title: 'Appraisals' },
      { href: '/dashboard/fleet', icon: Car, title: 'Fleet' },
      { href: '/dashboard/payroll', icon: DollarSign, title: 'Payroll' },
    ]
  },
  {
    title: 'AI Features',
    modules: [
        { href: '/dashboard/ai-automation', icon: Bot, title: 'AI Automation' },
        { href: '/dashboard/ai-assistant', icon: Brain, title: 'AI Assistant' },
    ]
   }
];
