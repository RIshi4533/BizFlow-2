/**
 * @fileOverview Generates a follow-up email for a sales deal.
 *
 * - generateFollowUpEmail - A function that creates a contextual follow-up email.
 */

import { ai } from '@/ai/genkit';
import {
  GenerateFollowUpEmailInputSchema,
  GenerateFollowUpEmailOutputSchema,
  type GenerateFollowUpEmailInput,
} from '@/ai/schemas';

export async function generateFollowUpEmail(input: GenerateFollowUpEmailInput) {
  return generateFollowUpEmailFlow(input);
}

const generateFollowUpEmailPrompt = ai.definePrompt({
  name: 'generateFollowUpEmailPrompt',
  input: { schema: GenerateFollowUpEmailInputSchema },
  output: { schema: GenerateFollowUpEmailOutputSchema },
  prompt: `You are a professional and courteous sales assistant AI. Your task is to draft a follow-up email for a sales deal.

  Here is the deal information:
  - Deal: {{{dealTitle}}}
  - Client: {{{clientName}}}
  - Value: \${{{dealValue}}}
  - Current Status: {{{dealStatus}}}

  Based on this information, write a concise, professional, and friendly follow-up email. The tone should be encouraging and aim to move the deal to the next stage.
  
  - If the status is 'Proposal', ask if they have had a chance to review it and if they have any questions.
  - If the status is 'Negotiation', reiterate a key benefit and suggest scheduling a quick call to finalize details.
  
  Do not make up information not provided. Generate a suitable subject line and the email body.

  Your response MUST be in the format of the specified JSON output schema.
  `,
});

const generateFollowUpEmailFlow = ai.defineFlow(
  {
    name: 'generateFollowUpEmailFlow',
    inputSchema: GenerateFollowUpEmailInputSchema,
    outputSchema: GenerateFollowUpEmailOutputSchema,
  },
  async (input) => {
    const { output } = await generateFollowUpEmailPrompt(input);
    return output!;
  }
);
