// This file defines the Zod schemas and TypeScript types for AI flows.
// It does NOT contain the 'use server' directive, allowing it to export objects and types freely.

import { z } from 'zod';

// --- AI Automation Explainer ---

export const AiAutomationExplainerInputSchema = z.object({
  feature: z.string().describe('The specific BizFlow feature the user is asking about.'),
});
export type AiAutomationExplainerInput = z.infer<typeof AiAutomationExplainerInputSchema>;

export const AiAutomationExplainerOutputSchema = z.object({
  explanation: z.string().describe('A clear explanation of the AI-powered automation feature.'),
  example: z.string().describe('A simple example of how the AI automation works.'),
  includeFeature: z.boolean().describe('Whether or not to include a particular feature based on context.')
});
export type AiAutomationExplainerOutput = z.infer<typeof AiAutomationExplainerOutputSchema>;


// --- Analyze Deal ---

export const AnalyzeDealInputSchema = z.object({
    ownerId: z.string().describe("The user ID of the deal's owner."),
    deal: z.object({
        id: z.string(),
        title: z.string(),
        client: z.string(),
        value: z.number(),
        status: z.string(),
        products: z.array(z.object({
            sku: z.string(),
            quantity: z.number(),
            name: z.string(),
        })),
    })
});
export type AnalyzeDealInput = z.infer<typeof AnalyzeDealInputSchema>;

export const AnalyzeDealOutputSchema = z.object({
    riskAnalysis: z.string().describe("A summary of potential risks that could prevent this deal from closing."),
    closeProbability: z.number().min(0).max(100).describe("An estimated probability (0-100) of this deal closing successfully."),
    suggestedNextStep: z.string().describe("A concrete, actionable next step to move the deal forward."),
    inventoryCheck: z.string().describe("A summary of the inventory status for the products included in this deal. For example, 'All items are in stock.' or 'Warning: Laptop Model X is out of stock.'"),
});
export type AnalyzeDealOutput = z.infer<typeof AnalyzeDealOutputSchema>;

// --- Calculate Mileage ---

export const CalculateMileageExpenseInputSchema = z.object({
  startLocation: z.string().describe('The starting point of the trip.'),
  endLocation: z.string().describe('The destination of the trip.'),
  ratePerMile: z.number().describe('The reimbursement rate per mile.'),
});
export type CalculateMileageExpenseInput = z.infer<typeof CalculateMileageExpenseInputSchema>;

export const CalculateMileageExpenseOutputSchema = z.object({
  distance: z.number().describe('The calculated distance between the two locations in miles.'),
  reimbursementAmount: z.number().describe('The total reimbursement amount calculated based on the distance and rate.'),
  summary: z.string().describe('A summary of the trip, e.g., "Trip from New York, NY to Boston, MA (215 miles)".'),
});
export type CalculateMileageExpenseOutput = z.infer<typeof CalculateMileageExpenseOutputSchema>;


// --- Categorize Item ---

export const CategorizeItemInputSchema = z.object({
  text: z.string().describe('The text content to be categorized.'),
  categories: z.array(z.string()).describe('A list of potential categories to choose from.'),
});
export type CategorizeItemInput = z.infer<typeof CategorizeItemInputSchema>;

export const CategorizeItemOutputSchema = z.object({
  category: z.string().describe('The selected category for the text.'),
});
export type CategorizeItemOutput = z.infer<typeof CategorizeItemOutputSchema>;


// --- Custom Task ---

export const CustomTaskInputSchema = z.object({
  prompt: z.string().describe('The user-defined prompt describing the task to perform.'),
  context: z.any().describe('The JSON object representing the data context (e.g., a deal, a contact).'),
  ownerId: z.string().describe("The user ID of the data owner, to be passed to any tools."),
});
export type CustomTaskInput = z.infer<typeof CustomTaskInputSchema>;

export const CustomTaskOutputSchema = z.object({
  result: z.string().describe('The text-based result of the custom AI task.'),
});
export type CustomTaskOutput = z.infer<typeof CustomTaskOutputSchema>;


// --- Employee Assistant ---

export const EmployeeAssistantInputSchema = z.object({
  query: z.string().describe('The employee\'s question or query for the AI assistant.'),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']).describe('The role of the message sender (user or assistant).'),
    content: z.string().describe('The content of the message.'),
  }))
  .optional() // Make history optional in case it's the first message
  .describe('A history of previous messages in the conversation.'),
});
export type EmployeeAssistantInput = z.infer<typeof EmployeeAssistantInputSchema>;

export const EmployeeAssistantOutputSchema = z.object({
    response: z.string().describe('The AI assistant\'s helpful response.'),
});
export type EmployeeAssistantOutput = z.infer<typeof EmployeeAssistantOutputSchema>;


// --- Extract Expense Details ---

export const ExtractExpenseDetailsInputSchema = z.object({
  receiptText: z.string().describe('The raw text extracted from a receipt.'),
  categories: z.array(z.string()).describe('A list of possible expense categories.'),
});
export type ExtractExpenseDetailsInput = z.infer<typeof ExtractExpenseDetailsInputSchema>;

export const ExtractExpenseDetailsOutputSchema = z.object({
  vendor: z.string().describe('The name of the vendor or merchant.'),
  amount: z.number().describe('The total amount of the expense.'),
  date: z.string().optional().describe('The date of the transaction in YYYY-MM-DD format.'),
  category: z.string().describe('The most likely expense category from the provided list.'),
});
export type ExtractExpenseDetailsOutput = z.infer<typeof ExtractExpenseDetailsOutputSchema>;


// --- Fix Website ---

export const FixWebsiteHtmlInputSchema = z.object({
  htmlContent: z.string().describe('The full HTML content of the website to be fixed.'),
});
export type FixWebsiteHtmlInput = z.infer<typeof FixWebsiteHtmlInputSchema>;

export const FixWebsiteHtmlOutputSchema = z.object({
  fixedHtmlContent: z.string().describe('The complete, corrected HTML content.'),
  summary: z.string().describe('A concise summary of the fixes that were applied.'),
});
export type FixWebsiteHtmlOutput = z.infer<typeof FixWebsiteHtmlOutputSchema>;


// --- Follow-up Email ---

export const GenerateFollowUpEmailInputSchema = z.object({
    dealTitle: z.string().describe("The title of the sales deal."),
    dealValue: z.number().describe("The monetary value of the deal."),
    clientName: z.string().describe("The name of the client or company."),
    dealStatus: z.string().describe("The current status of the deal (e.g., 'Proposal', 'Negotiation')."),
});
export type GenerateFollowUpEmailInput = z.infer<typeof GenerateFollowUpEmailInputSchema>;

export const GenerateFollowUpEmailOutputSchema = z.object({
    subject: z.string().describe("The subject line for the follow-up email."),
    body: z.string().describe("The full body content of the follow-up email."),
});
export type GenerateFollowUpEmailOutput = z.infer<typeof GenerateFollowUpEmailOutputSchema>;


// --- Generate Bill of Materials (BOM) ---

export const GenerateBomInputSchema = z.object({
  productName: z.string().describe('The name of the finished product for which to generate a Bill of Materials.'),
});
export type GenerateBomInput = z.infer<typeof GenerateBomInputSchema>;

export const GenerateBomOutputSchema = z.object({
  components: z.array(z.object({
    componentName: z.string().describe('The name of the component part.'),
    quantity: z.number().int().describe('The quantity of this component required.'),
  })).describe('A list of components and their quantities needed for the finished product.'),
});
export type GenerateBomOutput = z.infer<typeof GenerateBomOutputSchema>;


// --- Generate Email Content ---

export const GenerateEmailContentInputSchema = z.object({
  topic: z.string().describe('The topic for the email campaign.'),
});
export type GenerateEmailContentInput = z.infer<typeof GenerateEmailContentInputSchema>;

export const GenerateEmailContentOutputSchema = z.object({
  htmlContent: z.string().describe('The generated email body in HTML format.'),
});
export type GenerateEmailContentOutput = z.infer<typeof GenerateEmailContentOutputSchema>;


// --- Generate Email List ---

export const GenerateEmailListInputSchema = z.object({
  count: z.number().int().describe('The number of email addresses to generate.'),
});
export type GenerateEmailListInput = z.infer<typeof GenerateEmailListInputSchema>;

export const GenerateEmailListOutputSchema = z.object({
  emails: z.array(z.string()).describe('A list of generated email addresses.'),
});
export type GenerateEmailListOutput = z.infer<typeof GenerateEmailListOutputSchema>;


// --- Generate Invoice Summary ---

export const GenerateInvoiceSummaryInputSchema = z.object({
  customerName: z.string().describe("The name of the customer on the invoice."),
  lineItems: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
  })).describe("The line items on the invoice."),
  total: z.number().describe("The total amount of the invoice."),
});
export type GenerateInvoiceSummaryInput = z.infer<typeof GenerateInvoiceSummaryInputSchema>;

export const GenerateInvoiceSummaryOutputSchema = z.object({
  summary: z.string().describe("A concise, one-line summary of the invoice. E.g., 'Invoice for Laptop (1) and Mouse (2) - Total $1250.50'"),
});
export type GenerateInvoiceSummaryOutput = z.infer<typeof GenerateInvoiceSummaryOutputSchema>;


// --- Generate Job Description ---

export const GenerateJobDescriptionInputSchema = z.object({
  title: z.string().describe('The job title.'),
  department: z.string().describe('The department for the role.'),
});
export type GenerateJobDescriptionInput = z.infer<typeof GenerateJobDescriptionInputSchema>;

export const GenerateJobDescriptionOutputSchema = z.object({
  jobDescription: z.string().describe('The generated job description.'),
});
export type GenerateJobDescriptionOutput = z.infer<typeof GenerateJobDescriptionOutputSchema>;


// --- Generate KB Article ---

export const GenerateKbArticleInputSchema = z.object({
  topic: z.string().describe('The topic or subject for the knowledge base article.'),
});
export type GenerateKbArticleInput = z.infer<typeof GenerateKbArticleInputSchema>;

export const GenerateKbArticleOutputSchema = z.object({
  title: z.string().describe('A suitable title for the generated article.'),
  content: z.string().describe('The full article content in well-structured Markdown format.'),
});
export type GenerateKbArticleOutput = z.infer<typeof GenerateKbArticleOutputSchema>;


// --- Generate Meeting Details ---

export const GenerateMeetingDetailsInputSchema = z.object({
  eventTitle: z.string().describe("The title of the event or meeting."),
  eventType: z.enum(['video_call', 'audio_call']).describe("The type of meeting."),
});
export type GenerateMeetingDetailsInput = z.infer<typeof GenerateMeetingDetailsInputSchema>;

export const GenerateMeetingDetailsOutputSchema = z.object({
  meetingLink: z.string().nullable().describe("The unique URL for the video meeting. Null for audio-only calls."),
  dialInNumber: z.string().describe("The dial-in phone number for the meeting."),
  participantCode: z.string().describe("The numeric code for participants to enter."),
});
export type GenerateMeetingDetailsOutput = z.infer<typeof GenerateMeetingDetailsOutputSchema>;


// --- Generate Survey Questions ---

const QuestionTypeSchema = z.enum([
  'multiple-choice',
  'short-text',
  'paragraph',
  'yes-no',
  'rating',
  'checkbox',
  'dropdown',
]);

export const GenerateSurveyQuestionsInputSchema = z.object({
  topic: z.string().describe('The topic or goal of the survey.'),
});
export type GenerateSurveyQuestionsInput = z.infer<typeof GenerateSurveyQuestionsInputSchema>;

export const GenerateSurveyQuestionsOutputSchema = z.object({
  questions: z
    .array(
      z.object({
        text: z.string().describe('The question text.'),
        type: QuestionTypeSchema.describe('The type of question.'),
        options: z
          .array(z.string())
          .optional()
          .describe(
            'A list of options for multiple-choice, checkbox, or dropdown questions. Should be empty for other types.'
          ),
      })
    )
    .describe('An array of generated survey questions.'),
});
export type GenerateSurveyQuestionsOutput = z.infer<typeof GenerateSurveyQuestionsOutputSchema>;


// --- Process Inventory ---

export const ProcessInventoryDataInputSchema = z.object({
  rawData: z.string().describe('A raw block of text containing inventory update information.'),
  ownerId: z.string().describe("The user ID of the data owner, to be passed to any tools."),
});
export type ProcessInventoryDataInput = z.infer<typeof ProcessInventoryDataInputSchema>;

export const ProcessInventoryDataOutputSchema = z.object({
  summary: z.string().describe('A summary of the actions taken by the AI.'),
});
export type ProcessInventoryDataOutput = z.infer<typeof ProcessInventoryDataOutputSchema>;


// --- Website Feedback ---

export const WebsiteFeedbackInputSchema = z.object({
  htmlContent: z.string().describe('The full HTML content of the website to be analyzed.'),
});
export type WebsiteFeedbackInput = z.infer<typeof WebsiteFeedbackInputSchema>;

const FeedbackItemSchema = z.object({
    passed: z.boolean().describe("Whether the check passed or failed."),
    message: z.string().describe("A descriptive message explaining the result of the check."),
});

export const WebsiteFeedbackOutputSchema = z.object({
  overallScore: z.number().int().min(0).max(100).describe("An overall score from 0-100 based on the analysis."),
  overallSummary: z.string().describe("A brief, high-level summary of the website's strengths and weaknesses."),
  seo: z.object({
    hasTitle: FeedbackItemSchema,
    hasMetaDescription: FeedbackItemSchema,
    hasH1: FeedbackItemSchema,
  }),
  accessibility: z.object({
    imagesHaveAlt: FeedbackItemSchema,
  }),
  content: z.object({
    hasCallToAction: FeedbackItemSchema,
  }),
});
export type WebsiteFeedbackOutput = z.infer<typeof WebsiteFeedbackOutputSchema>;
