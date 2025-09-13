import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { Features } from "@/components/sections/features";
import { AiAutomation } from "@/components/sections/ai-automation";
import { Testimonials } from "@/components/sections/testimonials";
import { About } from "@/components/sections/about";
import { AuthProvider } from "@/hooks/use-auth";

export default function Home() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1">
          <Hero />
          <Features />
          <AiAutomation />
          <Testimonials />
          <About />
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}
