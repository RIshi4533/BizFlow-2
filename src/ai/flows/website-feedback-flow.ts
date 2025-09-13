/**
 * @fileOverview Analyzes website HTML for SEO, accessibility, and content improvements.
 *
 * - getWebsiteFeedback - A function that provides AI-driven feedback on website code.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { WebsiteFeedbackInputSchema, WebsiteFeedbackOutputSchema, type WebsiteFeedbackInput } from '@/ai/schemas';


export async function getWebsiteFeedback(input: WebsiteFeedbackInput) {
  return websiteFeedbackFlow(input);
}

const websiteFeedbackPrompt = ai.definePrompt({
  name: 'websiteFeedbackPrompt',
  input: { schema: WebsiteFeedbackInputSchema },
  output: { schema: WebsiteFeedbackOutputSchema },
  prompt: `You are an expert web developer and digital marketing analyst. Your task is to analyze the provided HTML code and give feedback on its quality based on several criteria.

HTML to analyze:
\`\`\`html
{{{htmlContent}}}
\`\`\`

Analyze the HTML and provide feedback in the following areas:

1.  **SEO**:
    *   Check for the presence and quality of the <title> tag. It should not be a generic placeholder like "My Awesome Website".
    *   Check for a <meta name="description"> tag and ensure it is not generic and is a reasonable length (around 155 characters).
    *   Verify there is exactly one <h1> tag.

2.  **Accessibility**:
    *   Check if all <img> tags have a non-empty 'alt' attribute.
    *   Check if the <html> tag has a 'lang' attribute.
    *   Check for the use of semantic HTML5 elements like <header>, <main>, and <footer>.

3.  **Content**:
    *   Determine if there is a clear Call to Action (CTA). Look for buttons or links with text like "Sign Up", "Learn More", "Get Started", "Contact Us", etc.

For each check, provide a "passed" status (true/false) and a "message" explaining the result. For example, if the title is missing, the message should say "The website is missing a <title> tag, which is crucial for SEO." If it's present, say "The website has a clear and descriptive title tag."

Finally, calculate an 'overallScore' from 0 to 100 based on how many checks passed. Each passed check contributes to the score. Provide a concise 'overallSummary' of your findings.

Your response MUST be in the format of the specified JSON output schema.
`,
});

const websiteFeedbackFlow = ai.defineFlow(
  {
    name: 'websiteFeedbackFlow',
    inputSchema: WebsiteFeedbackInputSchema,
    outputSchema: WebsiteFeedbackOutputSchema,
  },
  async (input) => {
    const { output } = await websiteFeedbackPrompt(input);
    return output!;
  }
);
