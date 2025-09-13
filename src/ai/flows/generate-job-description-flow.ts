/**
 * @fileOverview Generates a professional job description.
 *
 * - generateJobDescription - A function that creates a job description based on a title and department.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { GenerateJobDescriptionInputSchema, GenerateJobDescriptionOutputSchema, type GenerateJobDescriptionInput } from '@/ai/schemas';


export async function generateJobDescription(input: GenerateJobDescriptionInput) {
  return generateJobDescriptionFlow(input);
}

const generateJobDescriptionPrompt = ai.definePrompt({
  name: 'generateJobDescriptionPrompt',
  input: { schema: GenerateJobDescriptionInputSchema },
  output: { schema: GenerateJobDescriptionOutputSchema },
  prompt: `You are an expert HR manager. Your task is to generate a professional and detailed job description.

  Job Title: {{{title}}}
  Department: {{{department}}}

  Based on this information, write a comprehensive job description. It should include a summary, key responsibilities, and required qualifications.
  
  Do not make up information not provided.

  Your response MUST be in the format of the specified JSON output schema.
  `,
});

const generateJobDescriptionFlow = ai.defineFlow(
  {
    name: 'generateJobDescriptionFlow',
    inputSchema: GenerateJobDescriptionInputSchema,
    outputSchema: GenerateJobDescriptionOutputSchema,
  },
  async (input) => {
    const { output } = await generateJobDescriptionPrompt(input);
    return output!;
  }
);
