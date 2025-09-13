
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
  Receipt
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

const modules = [
  { href: '/dashboard/crm', icon: HeartHandshake, title: 'CRM', description: 'Build lasting customer relationships.' },
  { href: '/dashboard/sales', icon: TrendingUp, title: 'Sales', description: 'Automate your sales process and close more deals.' },
  { href: '/dashboard/inventory', icon: Boxes, title: 'Inventory', description: 'Optimize stock levels with smart predictions.' },
  { href: '/dashboard/accounting', icon: Landmark, title: 'Accounting', description: 'Integrate financial data in real-time.' },
  { href: '/dashboard/invoicing', icon: Receipt, title: 'Invoicing', description: 'Create and manage professional invoices.' },
  { href: '/dashboard/projects', icon: KanbanSquare, title: 'Projects', description: 'Manage tasks and collaborate with your team.' },
  { href: '/dashboard/purchase', icon: Truck, title: 'Purchase', description: 'Streamline your procurement workflow.' },
  { href: '/dashboard/hr', icon: UsersRound, title: 'Employees', description: 'Manage employees, payroll, and recruitment.' },
  { href: '/dashboard/email-marketing', icon: AtSign, title: 'Email Marketing', description: 'Automate campaigns and track ROI.' },
  { href: '/dashboard/helpdesk', icon: LifeBuoy, title: 'Helpdesk', description: 'Provide exceptional customer support.' },
  { href: '/dashboard/events', icon: CalendarDays, title: 'Events', description: 'Organize schedules and company events.' },
  { href: '/dashboard/e-commerce', icon: Store, title: 'eCommerce', description: 'Launch your online store in minutes.' },
  { href: '/dashboard/website-builder', icon: Paintbrush, title: 'Website Builder', description: 'Create beautiful, responsive websites.' },
  { href: '/dashboard/ai-automation', icon: BrainCircuit, title: 'AI Automation', description: 'Let AI handle repetitive tasks and optimize workflows.' },
];

export function Features() {
  return (
    <section id="features" className="py-24 sm:py-32 bg-secondary">
      <div className="container px-6 mx-auto">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Everything you need, all in one place.</h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            BizFlow integrates all your business needs into a single, intelligent platform. Discover our core modules designed for seamless automation and growth.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 mt-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {modules.map((module) => (
            <Link key={module.title} href={module.href}>
              <Card className="h-full transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                      <module.icon className="w-6 h-6" />
                    </div>
                    <CardTitle>{module.title}</CardTitle>
                  </div>
                  <CardDescription className="pt-2">{module.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
