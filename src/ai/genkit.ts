import { genkit } from 'genkit';
import googleAI from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      models: ['gemini-1.5-pro-preview'],
    }),
  ],
});

// Now `ai` has the `.prompt()` method and other Genkit features
