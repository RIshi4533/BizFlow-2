// src/app/thank-you/page.tsx
'use client';

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ThankYouPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-secondary">
            <Card className="w-full max-w-lg text-center p-8">
                <CardHeader>
                    <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                    <CardTitle className="mt-4 text-2xl">Thank You!</CardTitle>
                    <CardDescription className="mt-2 text-muted-foreground">
                        Your response has been successfully recorded.
                    </CardDescription>
                </CardHeader>
                <div className="mt-6">
                    <Button asChild>
                        <Link href="/">Back to Homepage</Link>
                    </Button>
                </div>
            </Card>
        </div>
    );
}
