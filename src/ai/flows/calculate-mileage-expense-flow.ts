/**
 * @fileOverview Calculates mileage expenses based on start and end locations.
 *
 * - calculateMileageExpense - A function that simulates distance calculation and suggests a reimbursement amount.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { CalculateMileageExpenseInputSchema, CalculateMileageExpenseOutputSchema, type CalculateMileageExpenseInput } from '@/ai/schemas';


export async function calculateMileageExpense(input: CalculateMileageExpenseInput) {
  return calculateMileageExpenseFlow(input);
}

const calculateMileageExpensePrompt = ai.definePrompt({
  name: 'calculateMileageExpensePrompt',
  input: { schema: CalculateMileageExpenseInputSchema },
  output: { schema: CalculateMileageExpenseOutputSchema },
  prompt: `You are a trip planning assistant. Given a start and end location, estimate a realistic driving distance in miles. Then, calculate the total reimbursement amount using the provided rate.

  Start Location: "{{{startLocation}}}"
  End Location: "{{{endLocation}}}"
  Rate per Mile: \${{{ratePerMile}}}

  Perform the following steps:
  1.  Estimate the plausible driving distance in miles. Do not provide a range, just a single number.
  2.  Calculate the total reimbursement by multiplying the distance by the rate per mile. Round to 2 decimal places.
  3.  Create a concise summary for the trip.

  Your response MUST be in the format of the specified JSON output schema.
  `,
});

const calculateMileageExpenseFlow = ai.defineFlow(
  {
    name: 'calculateMileageExpenseFlow',
    inputSchema: CalculateMileageExpenseInputSchema,
    outputSchema: CalculateMileageExpenseOutputSchema,
  },
  async (input) => {
    const { output } = await calculateMileageExpensePrompt(input);
    return output!;
  }
);
