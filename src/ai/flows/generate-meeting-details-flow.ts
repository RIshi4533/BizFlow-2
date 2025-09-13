/**
 * @fileOverview Generates unique meeting details for video or audio calls.
 *
 * - generateMeetingDetails - A function that creates a meeting link and dial-in info.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { GenerateMeetingDetailsInputSchema, GenerateMeetingDetailsOutputSchema, type GenerateMeetingDetailsInput } from '@/ai/schemas';


export async function generateMeetingDetails(input: GenerateMeetingDetailsInput) {
  return generateMeetingDetailsFlow(input);
}

const generateMeetingDetailsPrompt = ai.definePrompt({
  name: 'generateMeetingDetailsPrompt',
  input: { schema: GenerateMeetingDetailsInputSchema },
  output: { schema: GenerateMeetingDetailsOutputSchema },
  prompt: `You are a meeting scheduling assistant. Your task is to generate unique and realistic-looking meeting details for an event.

  Event Title: "{{{eventTitle}}}"
  Event Type: "{{{eventType}}}"

  Based on the event type, generate the following:
  1.  **Meeting Link**: If the eventType is 'video_call', you MUST return the exact string "https://meet.google.com/landing?authuser=0". Do not add any paths or query parameters. If the eventType is 'audio_call', this value MUST be null.
  2.  **Dial-in Number**: Generate a plausible US-based phone number with a PIN for access.
  3.  **Participant Code**: Create a short, numeric code for participants to use when dialing in.

  Your response MUST be in the format of the specified JSON output schema. The dial-in details must be unique for each request. Do not use generic or repeating patterns.
  `,
});

const generateMeetingDetailsFlow = ai.defineFlow(
  {
    name: 'generateMeetingDetailsFlow',
    inputSchema: GenerateMeetingDetailsInputSchema,
    outputSchema: GenerateMeetingDetailsOutputSchema,
  },
  async (input) => {
    const { output } = await generateMeetingDetailsPrompt(input);
    return output!;
  }
);
