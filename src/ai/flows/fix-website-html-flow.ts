/**
 * @fileOverview Analyzes website HTML and automatically fixes issues.
 *
 * - fixWebsiteHtml - A function that corrects HTML for SEO, accessibility, and content.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { FixWebsiteHtmlInputSchema, FixWebsiteHtmlOutputSchema, type FixWebsiteHtmlInput } from '@/ai/schemas';


export async function fixWebsiteHtml(input: FixWebsiteHtmlInput) {
  return fixWebsiteHtmlFlow(input);
}

const fixWebsiteHtmlPrompt = ai.definePrompt({
  name: 'fixWebsiteHtmlPrompt',
  input: { schema: FixWebsiteHtmlInputSchema },
  output: { schema: FixWebsiteHtmlOutputSchema },
  prompt: `You are an expert web developer and digital marketing analyst. Your task is to analyze the provided HTML code, identify issues, and then rewrite the code to fix them.

HTML to analyze and fix:
\`\`\`html
{{{htmlContent}}}
\`\`\`

Perform the following corrections:

1.  **SEO**:
    *   If the <title> tag is missing or generic, write a compelling, descriptive title based on the content.
    *   If the <meta name="description"> tag is missing or generic, write a concise and relevant description (approx. 155 characters).
    *   Ensure there is exactly one <h1> tag. If there are multiple, consolidate them or demote less important ones to <h2>. If there are none, promote the most likely candidate to <h1>.

2.  **Accessibility**:
    *   If any <img> tags are missing an 'alt' attribute, add a descriptive alt attribute based on the image's src URL. If the image is purely decorative, add 'alt=""'.
    *   If the <html> tag is missing a 'lang' attribute, add 'lang="en"'.

3.  **Content & Structure**:
    *   If there is no clear Call to Action (CTA) button, add one. Create a <button> with appropriate classes (e.g., bg-primary, text-primary-foreground, p-2, rounded). Common CTA text includes "Get Started", "Learn More", or "Sign Up". Place it in a logical location, like below the main content.
    *   Ensure the main content is wrapped in a <main> tag. If it is missing, add it.

Your response MUST be in the format of the specified JSON output schema. Your response MUST include the complete, corrected HTML content in the 'fixedHtmlContent' field. Do not use placeholders; write real, high-quality content for the tags you add or modify. Also, provide a concise summary of the changes you made in the 'summary' field.
`,
});

const fixWebsiteHtmlFlow = ai.defineFlow(
  {
    name: 'fixWebsiteHtmlFlow',
    inputSchema: FixWebsiteHtmlInputSchema,
    outputSchema: FixWebsiteHtmlOutputSchema,
  },
  async (input) => {
    const { output } = await fixWebsiteHtmlPrompt(input);
    return output!;
  }
);
