'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { HeartHandshake, Users, Target, BarChart as BarChartIcon, CheckCircle, BrainCircuit, Mailbox, Puzzle, Star, Smartphone, Lock, Bot, LineChart, Mic, RadioTower, AreaChart, Code } from "lucide-react";
import { initialDeals, initialTasks, initialContacts } from '@/lib/mock-data';
import { moduleGroups } from '@/lib/nav-links';
import Link from "next/link";
import { BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';


const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(amount);
}


export default function CrmPage() {
  const newLeads = initialDeals.filter(deal => deal.status === 'lead').length;
  const dealsWon = initialDeals.filter(deal => deal.status === 'closed-won').length;
  const totalDealValue = initialDeals.reduce((sum, deal) => sum + deal.value, 0);
  const conversionRate = dealsWon > 0 ? ((dealsWon / initialDeals.length) * 100).toFixed(1) : 0;

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
     <div className="flex flex-col gap-6">
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <HeartHandshake className="w-8 h-8 text-primary" />
                <div>
                <CardTitle>Customer Relationship Management</CardTitle>
                <CardDescription>An overview of your business health and modules.</CardDescription>
                </div>
            </CardHeader>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">New Leads</CardTitle>
                    <Users className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+{newLeads}</div>
                    <p className="text-xs text-muted-foreground">In the last 30 days</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Deals Won</CardTitle>
                    <Target className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{dealsWon}</div>
                    <p className="text-xs text-muted-foreground">Total deals closed successfully</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    <BarChartIcon className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{conversionRate}%</div>
                    <p className="text-xs text-muted-foreground">From lead to closed-won</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Pipeline Value</CardTitle>
                    <CheckCircle className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${totalDealValue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Across all stages</p>
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
