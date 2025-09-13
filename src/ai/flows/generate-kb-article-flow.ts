/**
 * @fileOverview Generates a knowledge base article from a given topic.
 *
 * - generateKbArticle - A function that creates a title and content for a KB article.
 */

import {ai} from '@/ai/genkit';
import { z } from 'zod';
import { GenerateKbArticleInputSchema, GenerateKbArticleOutputSchema, type GenerateKbArticleInput, type GenerateKbArticleOutput } from '@/ai/schemas';


export async function generateKbArticle(input: GenerateKbArticleInput): Promise<GenerateKbArticleOutput> {
  return generateKbArticleFlow(input);
}

const generateKbArticlePrompt = ai.definePrompt({
  name: 'generateKbArticlePrompt',
  input: {schema: GenerateKbArticleInputSchema},
  output: {schema: GenerateKbArticleOutputSchema},
  prompt: `You are an expert content creator specializing in knowledge base articles.

Your task is to generate a comprehensive, well-structured knowledge base article based on the provided topic.

The output should be in Markdown format and include:
- A clear, concise title.
- Headings and subheadings to organize the content.
- Bullet points or numbered lists where appropriate.
- Any other relevant information that would be helpful for a user trying to learn about this topic.

Topic: "{{{topic}}}"

Your response MUST be in the format of the specified JSON output schema.
`,
});

const generateKbArticleFlow = ai.defineFlow(
  {
    name: 'generateKbArticleFlow',
    inputSchema: GenerateKbArticleInputSchema,
    outputSchema: GenerateKbArticleOutputSchema,
  },
  async input => {
    const {output} = await generateKbArticlePrompt(input);
    return output!;
  }
);
