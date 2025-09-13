import Link from "next/link";
import { Cpu, Twitter, Github, Dribbble } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="container py-12 mx-auto">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="flex flex-col items-center md:items-start">
            <Link href="/" className="flex items-center space-x-2">
              <Cpu className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold">BizFlow</span>
            </Link>
            <p className="mt-4 text-sm text-center text-muted-foreground md:text-left">
              The all-in-one business solution for small businesses, schools, and startups.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-center md:text-left md:col-span-2 md:grid-cols-3">
            <div>
              <h3 className="font-semibold tracking-wider uppercase">Product</h3>
              <nav className="mt-4 space-y-2">
                <Link href="#features" className="block text-sm text-muted-foreground hover:text-foreground">Features</Link>
                <Link href="#testimonials" className="block text-sm text-muted-foreground hover:text-foreground">Testimonials</Link>
                <Link href="/dashboard" className="block text-sm text-muted-foreground hover:text-foreground">Get Started</Link>
              </nav>
            </div>
            <div>
              <h3 className="font-semibold tracking-wider uppercase">Company</h3>
              <nav className="mt-4 space-y-2">
                <Link href="#about" className="block text-sm text-muted-foreground hover:text-foreground">About Us</Link>
                <Link href="#" className="block text-sm text-muted-foreground hover:text-foreground">Careers</Link>
                <Link href="#" className="block text-sm text-muted-foreground hover:text-foreground">Press</Link>
              </nav>
            </div>
            <div>
              <h3 className="font-semibold tracking-wider uppercase">Legal</h3>
              <nav className="mt-4 space-y-2">
                <Link href="#" className="block text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link>
                <Link href="#" className="block text-sm text-muted-foreground hover:text-foreground">Terms of Service</Link>
              </nav>
            </div>
          </div>
        </div>
        <div className="pt-8 mt-8 border-t">
          <div className="flex flex-col items-center justify-between sm:flex-row">
            <div className="text-sm text-muted-foreground">
              <p>© {new Date().getFullYear()} BizFlow. All rights reserved.</p>
              <p className="mt-1">Inspired by Odoo.</p>
            </div>
            <div className="flex mt-4 space-x-6 sm:mt-0">
              <Link href="#" className="text-muted-foreground hover:text-foreground"><span className="sr-only">Twitter</span><Twitter className="w-5 h-5" /></Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground"><span className="sr-only">GitHub</span><Github className="w-5 h-5" /></Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground"><span className="sr-only">Dribbble</span><Dribbble className="w-5 h-5" /></Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
