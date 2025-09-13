import Image from 'next/image';

export function About() {
  return (
    <section id="about" className="py-24 sm:py-32 bg-white">
      <div className="container px-6 mx-auto">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Built by Students, for the Future of Business.</h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              BizFlow started as an ambitious project within the Coders Club, a passionate group of student developers dedicated to solving real-world problems with technology. Our mission is to provide powerful, accessible business tools to empower startups, schools, and small businesses to thrive.
            </p>
            <div className="mt-8 space-y-4">
              <div className="p-4 border rounded-lg bg-secondary/30">
                <h3 className="font-semibold text-primary">Rishi Raj, President</h3>
                <p className="text-sm text-muted-foreground">Visionary leader and lead architect, driving the project's technical and strategic direction.</p>
              </div>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
             <Image
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
                alt="Coders Club team working on BizFlow"
                width={800}
                height={600}
                className="rounded-2xl shadow-xl object-cover"
                data-ai-hint="students coding"
              />
              <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white to-transparent -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
