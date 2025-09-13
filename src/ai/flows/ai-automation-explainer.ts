import { ai } from '@/genkit'; // ✅ alias to src/genkit.ts
import { defineFlow } from '@genkit-ai/flow';
import {
  AiAutomationExplainerInputSchema,
  AiAutomationExplainerOutputSchema,
  type AiAutomationExplainerInput
} from '@/ai/schemas';

const aiAutomationExplainerFlow = defineFlow(
  {
    name: 'aiAutomationExplainerFlow',
    inputSchema: AiAutomationExplainerInputSchema,
    outputSchema: AiAutomationExplainerOutputSchema,
  },
  async (input: AiAutomationExplainerInput) => {
    // Load prompt by name from your .prompt file
    const prompt = await ai.prompt('aiAutomationExplainerPrompt');
    
    // ✅ Direct call because ExecutablePrompt is callable in latest API
    const output = await prompt(input);

    return output; // matches output schema
  }
);

export async function aiAutomationExplainer(input: AiAutomationExplainerInput) {
  return aiAutomationExplainerFlow(input);
}
