/**
 * @fileOverview Generates HTML email content based on a user's topic.
 *
 * - generateEmailContent: Creates professional, engaging email copy.
 */

import { ai } from '@/ai/genkit';
import {
    GenerateEmailContentInputSchema,
    GenerateEmailContentOutputSchema,
    type GenerateEmailContentInput,
    type GenerateEmailContentOutput
} from '@/ai/schemas';


export async function generateEmailContent(input: GenerateEmailContentInput): Promise<GenerateEmailContentOutput> {
    return generateEmailContentFlow(input);
}

const prompt = ai.definePrompt({
    name: 'generateEmailContentPrompt',
    input: { schema: GenerateEmailContentInputSchema },
    output: { schema: GenerateEmailContentOutputSchema },
    prompt: `You are an expert marketing copywriter. A user wants to create an email about a specific topic.

Generate professional and engaging email content based on the user's topic.

The response MUST be valid HTML content for the email body. Use simple, inline styles for maximum email client compatibility. Include a clear call-to-action button.

Topic: "{{{topic}}}"

Your response MUST be in the format of the specified JSON output schema.
`,
});

const generateEmailContentFlow = ai.defineFlow(
    {
        name: 'generateEmailContentFlow',
        inputSchema: GenerateEmailContentInputSchema,
        outputSchema: GenerateEmailContentOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);
