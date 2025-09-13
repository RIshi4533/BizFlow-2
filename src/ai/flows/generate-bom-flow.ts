/**
 * @fileOverview Generates a plausible Bill of Materials (BOM) for a given product.
 * 
 * - generateBom - A function that suggests components and quantities for manufacturing.
 */

import { ai } from '@/ai/genkit';
import { GenerateBomInputSchema, GenerateBomOutputSchema, type GenerateBomInput, type GenerateBomOutput } from '@/ai/schemas';


export async function generateBom(input: GenerateBomInput): Promise<GenerateBomOutput> {
    return generateBomFlow(input);
}

const generateBomPrompt = ai.definePrompt({
    name: 'generateBomPrompt',
    input: { schema: GenerateBomInputSchema },
    output: { schema: GenerateBomOutputSchema },
    prompt: `You are a manufacturing process expert. Given a product name, generate a plausible Bill of Materials (BOM).
    
    The BOM should be a list of generic, high-level components and the quantity required for each to produce one unit of the finished product.
    
    For example, if the product is "Laptop", components might be "Chassis", "15-inch Screen", "Keyboard Assembly", "Motherboard", "CPU", "RAM Stick", "SSD Drive", "Battery".
    
    Product to generate a BOM for: "{{{productName}}}"
    
    Your response MUST be in the format of the specified JSON output schema.
    `,
});

const generateBomFlow = ai.defineFlow(
    {
        name: 'generateBomFlow',
        inputSchema: GenerateBomInputSchema,
        outputSchema: GenerateBomOutputSchema,
    },
    async (input) => {
        const { output } = await generateBomPrompt(input);
        return output!;
    }
);
