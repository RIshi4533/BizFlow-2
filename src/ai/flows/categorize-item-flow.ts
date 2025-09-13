/**
 * @fileOverview Categorizes a given text item into one of several predefined categories.
 *
 * - categorizeItem - A function that assigns a category to a piece of text.
 */
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { CategorizeItemInputSchema, CategorizeItemOutputSchema, type CategorizeItemInput } from '@/ai/schemas';


export async function categorizeItem(input: CategorizeItemInput) {
  return categorizeItemFlow(input);
}

const categorizeItemPrompt = ai.definePrompt({
  name: 'categorizeItemPrompt',
  input: { schema: CategorizeItemInputSchema },
  output: { schema: CategorizeItemOutputSchema },
  prompt: `You are an expert at categorization. Your task is to analyze the provided text and assign it to the most appropriate category from the given list.

  Text to categorize: "{{{text}}}"

  Available categories:
  {{#each categories}}
  - {{{this}}}
  {{/each}}

  Your response MUST be in the format of the specified JSON output schema. The output must be one of the exact category names from the list provided.
  `,
});

const categorizeItemFlow = ai.defineFlow(
  {
    name: 'categorizeItemFlow',
    inputSchema: CategorizeItemInputSchema,
    outputSchema: CategorizeItemOutputSchema,
  },
  async (input) => {
    const { output } = await categorizeItemPrompt(input);
    return output!;
  }
);
