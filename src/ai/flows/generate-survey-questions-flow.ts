/**
 * @fileOverview Generates survey questions based on a topic.
 */

import { ai } from '@/ai/genkit';
import {
  GenerateSurveyQuestionsInputSchema,
  GenerateSurveyQuestionsOutputSchema,
  type GenerateSurveyQuestionsInput,
  type GenerateSurveyQuestionsOutput
} from '@/ai/schemas';
import { defineFlow } from '@genkit-ai/flow';

const prompt = ai.definePrompt<
  GenerateSurveyQuestionsInput,
  GenerateSurveyQuestionsOutput
>(
  {
    name: 'generateSurveyQuestionsPrompt',
    input: { schema: GenerateSurveyQuestionsInputSchema },
    output: { schema: GenerateSurveyQuestionsOutputSchema },
  },
  `You are an expert in survey design. A user wants to create a survey about a specific topic.

Generate a list of 5 to 7 relevant questions for the survey. For each question, provide the question text, an appropriate question type, and for multiple-choice, checkbox, or dropdown questions, a list of 3-5 plausible options.

Survey Topic: "{{{topic}}}"

Your response MUST be a valid JSON object that adheres to the specified output schema.
`
);

const generateSurveyQuestionsFlow = defineFlow(
  {
    name: 'generateSurveyQuestionsFlow',
    inputSchema: GenerateSurveyQuestionsInputSchema,
    outputSchema: GenerateSurveyQuestionsOutputSchema,
  },
  async (input: any) => {
    const output = await prompt.generate({ input });
    // Handle potential null output from the model
    if (!output || !output.questions) {
      return { questions: [] }; // Return a default empty array
    }
    return output;
  }
);

export async function generateSurveyQuestions(
  input: GenerateSurveyQuestionsInput
): Promise<GenerateSurveyQuestionsOutput> {
  return generateSurveyQuestionsFlow(input);
}
