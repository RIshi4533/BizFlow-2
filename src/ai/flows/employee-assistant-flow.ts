import { defineFlow } from "@genkit-ai/flow";
import { ai } from "@/ai/genkit";  // your Genkit instance
import {
  EmployeeAssistantInputSchema,
  EmployeeAssistantOutputSchema,
  type EmployeeAssistantInput,
} from "@/ai/schemas";

const MAX_QUERY_LENGTH = 1000;
const MAX_HISTORY_ITEMS = 10;

export async function runEmployeeAssistant(input: EmployeeAssistantInput) {
  return runEmployeeAssistantFlow.invoke(input);
}

const runEmployeeAssistantFlow = defineFlow(
  {
    name: "runEmployeeAssistantFlow",
    inputSchema: EmployeeAssistantInputSchema,
    outputSchema: EmployeeAssistantOutputSchema,
  },
  async (input: { query: string; history: any[] }) => {
    // Trim and slice history
    const trimmedInput = {
      query: input.query.substring(0, MAX_QUERY_LENGTH),
      history: (input.history ?? [])
        .slice(-MAX_HISTORY_ITEMS)
        .map((msg) => ({
          role: msg.role,
          content: msg.content.substring(0, 500),
        })),
    };

    // Convert history and query to array of { text } objects as required by Genkit
    const messages = [
      ...trimmedInput.history.map((msg) => ({
        text: msg.content,
      })),
      { text: trimmedInput.query },
    ];

    console.log("Messages sent to model:", messages);

    // Call generate with messages array
    const result = await ai.generate(messages);

    return {
      response: result.output ?? "",
    };
  }
);
