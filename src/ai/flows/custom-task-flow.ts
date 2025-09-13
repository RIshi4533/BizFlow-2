/**
 * @fileOverview Executes a custom, user-defined AI task based on a prompt and a data context.
 *
 * - runCustomTask - A function that interprets a user's prompt and applies it to a given data object.
 */
'use server';

import { ai } from '@/ai/genkit';
import { updateStockLevel } from '@/services/inventory-service';
import { z } from 'zod';
import { CustomTaskInputSchema, CustomTaskOutputSchema, type CustomTaskInput } from '@/ai/schemas';


export async function runCustomTask(input: CustomTaskInput) {
  return runCustomTaskFlow(input);
}

const customTaskPrompt = ai.definePrompt({
  name: 'customTaskPrompt',
  input: { schema: CustomTaskInputSchema },
  output: { schema: z.string() }, // The model will output natural language text.
  tools: [updateStockLevel],
  prompt: `You are a helpful business operations assistant. Your task is to perform a user-defined instruction on a provided data object. You have been provided the owner's ID.

IMPORTANT:
- Be concise and efficient. Limit your reasoning to essential details only.
- The total input size must not exceed 8,000 tokens. If the context is too large, summarize or skip redundant parts.
- If the instruction cannot be performed due to missing or insufficient context, respond clearly.
- When using tools, you MUST pass the ownerId provided in the input context.

=== Data Context (JSON) ===
\`\`\`json
{{{context}}}
\`\`\`

=== User Instruction ===
"{{{prompt}}}"

Execute the instruction using the available tools if needed.

Your final response should be a **brief summary of actions performed**.
For example: "Inventory updated for 2 items in Deal #123."`,
});

const runCustomTaskFlow = ai.defineFlow(
  {
    name: 'runCustomTaskFlow',
    inputSchema: CustomTaskInputSchema,
    outputSchema: CustomTaskOutputSchema,
  },
  async (input) => {
    const { output } = await customTaskPrompt(input);

    return {
      result: output || "The AI completed the task but did not provide a summary.",
    };
  }
);
