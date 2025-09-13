
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Settings, ArrowLeft, LogOut, Loader, ChevronLeft } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AuthProvider, useAuth as useFirebaseAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { moduleGroups } from '@/lib/nav-links';
import { LayoutDashboard } from 'lucide-react';


function DashboardSidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2">
          <Cpu className="w-8 h-8 text-primary" />
          <span className={cn("font-bold text-xl", collapsed && "hidden")}>BizFlow</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
           <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === '/dashboard'}
                className="transition-all duration-200"
                tooltip={{children: 'Dashboard', side: 'right'}}
              >
                <Link href={'/dashboard'} prefetch={false}>
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          {moduleGroups.map((group) => (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                 {group.modules.map((module) => {
                  const isActive = module.href === '/dashboard' 
                  ? pathname === module.href 
                  : pathname.startsWith(module.href);
                  
                  return (
                  <SidebarMenuItem key={module.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className="transition-all duration-200"
                      tooltip={{children: module.title, side: 'right'}}
                    >
                      <Link href={module.href} prefetch={false}>
                        <module.icon />
                        <span>{module.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                 )})}
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard/settings')} className="transition-all duration-200" tooltip={{children: 'Settings', side: 'right'}}>
              <Link href="/dashboard/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function PageOverlay() {
  const { openMobile, setOpenMobile } = useSidebar();
  return (
    <div
      data-mobile-overlay=""
      className={cn(
        "fixed inset-0 z-40 bg-black/50 md:hidden",
        openMobile ? "opacity-100 visible" : "opacity-0 invisible",
        "transition-opacity duration-200"
      )}
      onClick={() => setOpenMobile(false)}
    />
  );
}


function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logOut } = useFirebaseAuth();

  const isRootDashboard = pathname === '/dashboard';
  const isWebsiteBuilder = pathname === '/dashboard/website-builder';
  
  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return null; // or a redirect, though the effect handles it
  }
  

  return (
    <div className="relative flex flex-col min-h-screen">
      <PageOverlay />
      <div className={cn("flex flex-1 group/sidebar-wrapper has-[[data-variant=inset]]:bg-sidebar")}>
        <div className={cn(isWebsiteBuilder && "hidden")}>
          <DashboardSidebar />
        </div>
        <div className={cn("relative flex min-h-svh flex-1 flex-col bg-background peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:border")}>
            <header className={cn("flex items-center justify-between border-b bg-background/80 backdrop-blur-sm sticky top-0 z-30 h-16 px-4 sm:px-6 lg:px-8", isWebsiteBuilder && "px-4")}>
              <div className="flex items-center gap-2">
                <div>
                  <SidebarTrigger className={cn(isWebsiteBuilder && "hidden")} />
                   {isWebsiteBuilder && (
                     <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')} className="transition-colors hover:bg-accent">
                        <ChevronLeft />
                        <span className="sr-only">Back to Dashboard</span>
                    </Button>
                   )}
                </div>
                 {!isRootDashboard && !isWebsiteBuilder && (
                   <Button variant="ghost" size="icon" onClick={() => router.back()} className="transition-colors hover:bg-accent md:hidden">
                      <ChevronLeft />
                      <span className="sr-only">Go back</span>
                  </Button>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                        <Avatar className="h-9 w-9">
                            <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">My Account</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {user.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </header>
          <main className={cn("flex-1", isWebsiteBuilder ? "p-0" : "p-6 md:p-8")}>
            <AnimatePresence mode="wait">
               <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className={cn(isWebsiteBuilder && "h-full")}
               >
                  {children}
               </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
     <AuthProvider>
      <SidebarProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </SidebarProvider>
    </AuthProvider>
  )
}
