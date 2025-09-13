/**
 * @fileOverview Analyzes a sales deal and provides AI-driven insights.
 *
 * - analyzeDeal - A function that assesses deal risks, closing probability, and suggests next steps.
 */
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { updateStockLevel } from '@/services/inventory-service';
import { AnalyzeDealInputSchema, AnalyzeDealOutputSchema, type AnalyzeDealInput } from '@/ai/schemas';

export async function analyzeDeal(input: AnalyzeDealInput) {
  return analyzeDealFlow(input);
}

const analyzeDealPrompt = ai.definePrompt({
  name: 'analyzeDealPrompt',
  input: { schema: AnalyzeDealInputSchema },
  output: { schema: AnalyzeDealOutputSchema },
  tools: [updateStockLevel],
  prompt: `You are an expert sales analyst AI for a company called BizFlow. Your task is to provide an advanced analysis of a sales deal. You have been provided the owner's ID.

  Here is the deal information in JSON format:
  \`\`\`json
  {{{json deal}}}
  \`\`\`

  Perform a comprehensive analysis:
  1.  **Risk Assessment**: Identify key risks (e.g., deal size, stage, product complexity).
  2.  **Inventory Check**: For deals in 'Proposal' or 'Negotiation' stages, you MUST use the 'updateStockLevel' tool with a quantityChange of 0 and the provided ownerId to check the current stock for EACH product in the deal. This is critical to ensure the order can be fulfilled.
  3.  **Closing Probability**: Estimate the likelihood of closing (0-100), considering all factors.
  4.  **Next Step**: Suggest a single, actionable next step for the sales representative.

  Your response MUST be in the format of the specified JSON output schema.
  `,
});

const analyzeDealFlow = ai.defineFlow(
  {
    name: 'analyzeDealFlow',
    inputSchema: AnalyzeDealInputSchema,
    outputSchema: AnalyzeDealOutputSchema,
  },
  async (input) => {
    const { output } = await analyzeDealPrompt(input);
    return output!;
  }
);
