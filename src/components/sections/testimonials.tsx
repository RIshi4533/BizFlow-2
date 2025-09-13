
'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const testimonials = [
  {
    quote: "BizFlow revolutionized how we manage our startup. The integration between sales and inventory is seamless, and the AI-powered forecasts are incredibly accurate. We feel more in control than ever.",
    name: "For Eg: Alex Johnson",
    title: "CEO, Tech Innovators Inc.",
    initials: "AJ",
  },
  {
    quote: "As a school, managing contacts, enrollment, and finances was a nightmare of spreadsheets. BizFlow brought everything under one roof. The students from Coders Club have built something truly remarkable.",
    name: "For Eg: Dr. Maria Garcia",
    title: "Principal, Future Leaders Academy",
    initials: "MG",
  },
  {
    quote: "The ability to customize workflows with AI automation has saved us countless hours. We can focus on growing our business instead of getting bogged down by repetitive tasks. Highly recommended!",
    name: "For Eg: David Chen",
    title: "Founder, Creative Goods Co.",
    initials: "DC",
  },
   {
    quote: "The Helpdesk and CRM modules are fantastic. Our customer satisfaction has skyrocketed since we switched to BizFlow. It's intuitive, powerful, and the support is top-notch.",
    name: "For Eg: Sophie Dubois",
    title: "Head of Operations, The Design Hub",
    initials: "SD",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 sm:py-32 bg-secondary">
      <div className="container px-6 mx-auto">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Loved by Businesses and Schools Alike</h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            Don't just take our word for it. Here's what our users are saying about how BizFlow has transformed their operations.
          </p>
        </div>
        <Carousel
          opts={{ align: "start", loop: true }}
          className="w-full max-w-4xl mx-auto mt-16"
        >
          <CarouselContent>
            {testimonials.map((testimonial, index) => (
              <CarouselItem key={index} className="md:basis-1/2">
                <div className="p-1">
                  <Card className="h-full">
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                      <p className="flex-grow text-muted-foreground">"{testimonial.quote}"</p>
                      <div className="mt-6">
                        <Avatar className="w-16 h-16 mx-auto text-lg">
                          <AvatarFallback>{testimonial.initials}</AvatarFallback>
                        </Avatar>
                        <h3 className="mt-4 font-semibold text-foreground">{testimonial.name}</h3>
                        <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  );
}
