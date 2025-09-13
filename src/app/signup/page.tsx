
"use client";

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Cpu, Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { AuthProvider } from '@/hooks/use-auth';
import { FirebaseError } from 'firebase/app';

function SignUpPageContent() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { signUp, user, loading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signUp(auth, email.toLowerCase(), password);
       toast({
        title: "Success!",
        description: "Your account has been created.",
      });
      // Auth state change will redirect
    } catch (error: any) {
      console.error(error);
      let description = "An unexpected error occurred. Please try again.";
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/configuration-not-found') {
            description = "Authentication is not enabled for this project. Please enable Email/Password sign-in in your Firebase console.";
        } else {
            description = error.message;
        }
      }
       toast({
        title: "Sign-up Failed",
        description: description,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  React.useEffect(() => {
    if (!isAuthLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isAuthLoading, router]);

  if (isAuthLoading || user) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary/40 p-4">
      <Card className="mx-auto max-w-sm w-full shadow-xl">
         <CardHeader className="text-center">
             <Link href="/" className="flex items-center justify-center space-x-2 mb-4">
              <Cpu className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">BizFlow</span>
            </Link>
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription>
            Enter your information to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <form onSubmit={handleSignUp}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                Create an account
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline font-medium text-primary">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignUpPage() {
    return (
        <AuthProvider>
            <SignUpPageContent />
        </AuthProvider>
    )
}
