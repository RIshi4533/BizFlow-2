/**
 * @fileOverview Processes a raw text block of inventory data, parses it, and updates stock levels.
 *
 * - processInventoryData - A function that takes a raw string and uses AI to update inventory.
 */
'use server';

import { ai } from '@/ai/genkit';
import { updateStockLevel } from '@/services/inventory-service';
import { z } from 'zod';
import { ProcessInventoryDataInputSchema, ProcessInventoryDataOutputSchema, type ProcessInventoryDataInput } from '@/ai/schemas';


export async function processInventoryData(input: ProcessInventoryDataInput) {
  return processInventoryDataFlow(input);
}

const processInventoryDataPrompt = ai.definePrompt({
  name: 'processInventoryDataPrompt',
  input: { schema: ProcessInventoryDataInputSchema },
  output: { schema: z.string().describe("A concise summary of the actions you took. For example: \"Successfully updated stock for 3 items. Could not find SKU 'XYZ-123'.\"") },
  tools: [updateStockLevel],
  prompt: `You are an inventory management specialist. The user has provided a raw text block containing information about stock updates (e.g., from a shipping manifest, an email, or a note). You have also been provided the ownerId.

  Your task is to:
  1.  Carefully read and parse the raw data provided below.
  2.  Identify all mentions of products and their quantities. The user might provide SKUs or product names.
  3.  For each product identified, use the 'updateStockLevel' tool to update the inventory. Assume new arrivals are positive quantities. You MUST pass the ownerId.
  4.  If a SKU or product name is ambiguous or not found, make a note of it.

  Raw Data:
  ---
  {{{rawData}}}
  ---

  After using the tool for all identified items, provide a concise summary of the actions you took. For example: "Successfully updated stock for 3 items. Could not find SKU 'XYZ-123'."
  `,
});

const processInventoryDataFlow = ai.defineFlow(
  {
    name: 'processInventoryDataFlow',
    inputSchema: ProcessInventoryDataInputSchema,
    outputSchema: ProcessInventoryDataOutputSchema,
  },
  async (input) => {
    const { output } = await processInventoryDataPrompt(input);
    
    return {
        summary: output || "The AI completed the task but did not provide a summary."
    };
  }
);
