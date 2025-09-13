/**
 * @fileOverview Extracts structured expense data from raw receipt text.
 *
 * - extractExpenseDetails - A function that parses receipt text and returns structured data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ExtractExpenseDetailsInputSchema, ExtractExpenseDetailsOutputSchema, type ExtractExpenseDetailsInput } from '@/ai/schemas';


export async function extractExpenseDetails(input: ExtractExpenseDetailsInput) {
  return extractExpenseDetailsFlow(input);
}

const extractExpenseDetailsPrompt = ai.definePrompt({
  name: 'extractExpenseDetailsPrompt',
  input: { schema: ExtractExpenseDetailsInputSchema },
  output: { schema: ExtractExpenseDetailsOutputSchema },
  prompt: `You are an expert at parsing receipt data. Analyze the raw text below and extract the specified information.

  **Instructions:**
  1.  **Vendor**: Identify the merchant or store name.
  2.  **Amount**: Find the total transaction amount. It's usually the largest number or labeled as 'Total'.
  3.  **Date**: Find the transaction date. If found, format it as YYYY-MM-DD. If no date is present, leave the field empty.
  4.  **Category**: From the list of available categories, choose the one that best fits the vendor and items.

  **Raw Receipt Text:**
  \`\`\`
  {{{receiptText}}}
  \`\`\`

  **Available Categories:**
  {{#each categories}}
  - {{{this}}}
  {{/each}}

  Your response MUST be in the format of the specified JSON output schema.
  `,
});

const extractExpenseDetailsFlow = ai.defineFlow(
  {
    name: 'extractExpenseDetailsFlow',
    inputSchema: ExtractExpenseDetailsInputSchema,
    outputSchema: ExtractExpenseDetailsOutputSchema,
  },
  async (input) => {
    const { output } = await extractExpenseDetailsPrompt(input);
    return output!;
  }
);
