
'use client';
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  Package,
  CheckCircle,
} from 'lucide-react';
import Link from "next/link";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { initialDeals, initialTasks, initialContacts } from '@/lib/mock-data';
import { moduleGroups } from '@/lib/nav-links';


const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(amount);
}

export default function DashboardPage() {
    const totalPipelineValue = initialDeals.reduce((acc, deal) => acc + deal.value, 0);
    const tasksInProgress = initialTasks.filter(task => task.status === 'inprogress').length;
    const totalContacts = initialContacts.length;

    const salesDataByStage = initialDeals.reduce((acc, deal) => {
        const stageName = deal.status.charAt(0).toUpperCase() + deal.status.slice(1).replace('-', ' ');
        if (!acc[stageName]) {
            acc[stageName] = { name: stageName, value: 0, count: 0 };
        }
        acc[stageName].value += deal.value;
        acc[stageName].count += 1;
        return acc;
    }, {} as Record<string, {name: string, value: number, count: number}>);
    
    const chartData = Object.values(salesDataByStage);


  return (
    <div className="flex flex-col gap-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Get an overview of your business and quickly access key modules.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Sales Pipeline</CardTitle>
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalPipelineValue)}</div>
                    <p className="text-xs text-muted-foreground">Total value of all deals</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Projects</CardTitle>
                    <Package className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{tasksInProgress}</div>
                    <p className="text-xs text-muted-foreground">Tasks currently in progress</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Contacts</CardTitle>
                    <CheckCircle className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalContacts}</div>
                    <p className="text-xs text-muted-foreground">Total contacts managed</p>
                </CardContent>
            </Card>
        </div>
        
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-5">
            <Card className="xl:col-span-3">
                <CardHeader>
                    <CardTitle>Sales Pipeline Overview</CardTitle>
                    <CardDescription>A summary of deal values and counts at each stage.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                             <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                />
                            <YAxis
                                yAxisId="left"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => formatCurrency(value as number)}
                            />
                             <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => value.toString()}
                            />
                             <Tooltip 
                                cursor={{fill: 'hsl(var(--secondary))'}}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: 'var(--radius)'
                                }}
                            />
                            <Legend />
                            <Bar yAxisId="left" dataKey="value" name="Value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            <Bar yAxisId="right" dataKey="count" name="Count" fill="hsl(var(--primary) / 0.5)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card className="xl:col-span-2">
                 <CardHeader>
                    <CardTitle>Modules</CardTitle>
                    <CardDescription>Quick access to all BizFlow features.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {moduleGroups.map((group) => (
                    <div key={group.title}>
                        <h4 className="font-semibold text-sm mb-2">{group.title}</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {group.modules.map((module) => (
                            <Link href={module.href} key={module.title} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary">
                                <div className="p-2 rounded-md bg-primary/10 text-primary">
                                    <module.icon className="w-5 h-5" />
                                </div>
                                <span>{module.title}</span>
                            </Link>
                          ))}
                        </div>
                    </div>
                  ))}
                </CardContent>
            </Card>
        </div>

    </div>
  );
}
