'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Lightbulb } from 'lucide-react';

const staticData = {
  explanation: 'BizFlow’s AI intelligently monitors your inventory levels. When stock for an item runs low, it doesn’t just send a simple alert; it automatically analyzes past sales data and supplier lead times to suggest an optimal reorder quantity, preventing stockouts and overstocking.',
  example: 'Your "Premium Blend Coffee" is running low. Instead of guessing, BizFlow AI sees you sell an average of 20 bags a week and your supplier takes 3 days to deliver. It then recommends reordering 30 bags to perfectly cover demand and lead time, creating a draft purchase order for your approval.',
  includeFeature: true
};


export function AiAutomation() {
  return (
    <section id="ai-automation" className="py-24 sm:py-32 bg-white">
      <div className="container px-6 mx-auto">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Harness the Power of AI</h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            BizFlow's AI-driven features work behind the scenes to automate complex processes, provide intelligent insights, and optimize your business for maximum efficiency.
          </p>
        </div>

        <div className="max-w-4xl mx-auto mt-16">
          <Card className="bg-secondary/50">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-3 rounded-full bg-accent text-accent-foreground">
                <Bot className="w-8 h-8" />
              </div>
              <div>
                <CardTitle className="text-xl text-primary">AI-Powered Automation Explained</CardTitle>
                <CardDescription>A simple example of BizFlow AI in action.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 text-base">
                <>
                  <p>{staticData.explanation}</p>
                  <div className="p-4 border-l-4 rounded-r-lg bg-background border-primary">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 mt-1 text-primary shrink-0" />
                      <div>
                        <h4 className="font-semibold">Example Scenario:</h4>
                        <p className="mt-1 text-muted-foreground">{staticData.example}</p>
                      </div>
                    </div>
                  </div>
                </>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
