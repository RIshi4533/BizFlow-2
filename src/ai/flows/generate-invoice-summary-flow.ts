/**
 * @fileOverview Generates a concise summary for an invoice.
 *
 * - generateInvoiceSummary - A function that creates a one-line summary of an invoice.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { GenerateInvoiceSummaryInputSchema, GenerateInvoiceSummaryOutputSchema, type GenerateInvoiceSummaryInput } from '@/ai/schemas';


export async function generateInvoiceSummary(input: GenerateInvoiceSummaryInput) {
  return generateInvoiceSummaryFlow(input);
}

const generateInvoiceSummaryPrompt = ai.definePrompt({
  name: 'generateInvoiceSummaryPrompt',
  input: { schema: GenerateInvoiceSummaryInputSchema },
  output: { schema: GenerateInvoiceSummaryOutputSchema },
  prompt: `You are an expert financial assistant. Your task is to generate a concise, one-line summary for an invoice based on its line items.

  The summary should be human-readable and capture the essence of the invoice.

  Here is the invoice information:
  - Customer: {{{customerName}}}
  - Total: {{{total}}}
  - Line Items:
  {{#each lineItems}}
  - {{this.description}} (Qty: {{this.quantity}}, Unit Price: {{this.unitPrice}})
  {{/each}}
  
  Example output: "Rental for Camera (3 days) + Late Fee - Total $3,250"
  Another example: "Invoice for Laptop (1) and Mouse (2) - Total $1250.50"

  Your response MUST be in the format of the specified JSON output schema.
  `,
});

const generateInvoiceSummaryFlow = ai.defineFlow(
  {
    name: 'generateInvoiceSummaryFlow',
    inputSchema: GenerateInvoiceSummaryInputSchema,
    outputSchema: GenerateInvoiceSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await generateInvoiceSummaryPrompt(input);
    return output!;
  }
);
