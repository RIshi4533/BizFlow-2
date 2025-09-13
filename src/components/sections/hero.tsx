import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden bg-card border-b">
      <div className="container px-6 py-24 mx-auto sm:py-32 lg:py-40">
        <div className="flex flex-col items-center">
          <div className="max-w-2xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Your Entire Business,
              <span className="block text-primary">One Smart Platform.</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              BizFlow is the all-in-one, AI-powered ERP designed to streamline your operations.
              From CRM to accounting, we provide the tools to automate, integrate, and elevate your business.
              Perfect for small businesses, schools, and startups.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" asChild>
                <Link href="/dashboard">Get Started Free</Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link href="#features">Learn More <span aria-hidden="true">→</span></Link>
              </Button>
            </div>
          </div>
          <div className="relative mt-16 w-full max-w-4xl">
            <Image
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
              alt="BizFlow Dashboard Screenshot"
              width={1200}
              height={900}
              className="w-full rounded-2xl shadow-2xl ring-1 ring-black/10 object-cover"
              data-ai-hint="dashboard interface"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-tr from-accent to-primary opacity-10 -z-10 rounded-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
