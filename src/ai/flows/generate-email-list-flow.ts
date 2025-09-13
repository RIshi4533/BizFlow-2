/**
 * @fileOverview Generates a list of plausible but fake email addresses for testing purposes.
 *
 * - generateEmailList: Creates a list of a specified number of email addresses.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { GenerateEmailListInputSchema, GenerateEmailListOutputSchema, type GenerateEmailListInput, type GenerateEmailListOutput } from '@/ai/schemas';


export async function generateEmailList(input: GenerateEmailListInput): Promise<GenerateEmailListOutput> {
    return generateEmailListFlow(input);
}

const generateEmailListPrompt = ai.definePrompt({
    name: 'generateEmailListPrompt',
    input: { schema: GenerateEmailListInputSchema },
    output: { schema: GenerateEmailListOutputSchema },
    prompt: `Generate a list of {{{count}}} plausible but entirely fake email addresses suitable for a test marketing campaign. Use common domain names like gmail.com, yahoo.com, and outlook.com.
    
    Your response MUST be in the format of the specified JSON output schema.`,
});

const generateEmailListFlow = ai.defineFlow(
    {
        name: 'generateEmailListFlow',
        inputSchema: GenerateEmailListInputSchema,
        outputSchema: GenerateEmailListOutputSchema,
    },
    async (input) => {
        const { output } = await generateEmailListPrompt(input);
        return output!;
    }
);
