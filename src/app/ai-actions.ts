'use server';

import { aiAutomationExplainer as aiAutomationExplainerFlow } from '@/ai/flows/ai-automation-explainer';
import { generateFollowUpEmail as generateFollowUpEmailFlow } from '@/ai/flows/follow-up-email-flow';
import { categorizeItem as categorizeItemFlow } from '@/ai/flows/categorize-item-flow';
import { generateJobDescription as generateJobDescriptionFlow } from '@/ai/flows/generate-job-description-flow';
import { runCustomTask as runCustomTaskFlow } from '@/ai/flows/custom-task-flow';
import { processInventoryData as processInventoryDataFlow } from '@/ai/flows/process-inventory-data-flow';
import { runEmployeeAssistant as runEmployeeAssistantFlow } from '@/ai/flows/employee-assistant-flow';
import { analyzeDeal as analyzeDealFlow } from '@/ai/flows/analyze-deal-flow';
import { generateMeetingDetails as generateMeetingDetailsFlow } from '@/ai/flows/generate-meeting-details-flow';
import { getWebsiteFeedback as getWebsiteFeedbackFlow } from '@/ai/flows/website-feedback-flow';
import { fixWebsiteHtml as fixWebsiteHtmlFlow } from '@/ai/flows/fix-website-html-flow';
import { generateInvoiceSummary as generateInvoiceSummaryFlow } from '@/ai/flows/generate-invoice-summary-flow';
import { extractExpenseDetails as extractExpenseDetailsFlow } from '@/ai/flows/extract-expense-details-flow';
import { calculateMileageExpense as calculateMileageExpenseFlow } from '@/ai/flows/calculate-mileage-expense-flow';
import { generateKbArticle as generateKbArticleFlow } from '@/ai/flows/generate-kb-article-flow';
import { generateBom as generateBomFlow } from '@/ai/flows/generate-bom-flow';
import { generateEmailList as generateEmailListFlow } from '@/ai/flows/generate-email-list-flow';
import { generateSurveyQuestions as generateSurveyQuestionsFlow } from '@/ai/flows/generate-survey-questions-flow';
import { generateEmailContent as generateEmailContentFlow } from '@/ai/flows/generate-email-content-flow';

import type {
  AiAutomationExplainerInput,
  AiAutomationExplainerOutput,
  GenerateFollowUpEmailInput,
  GenerateFollowUpEmailOutput,
  CategorizeItemInput,
  CategorizeItemOutput,
  GenerateJobDescriptionInput,
  GenerateJobDescriptionOutput,
  CustomTaskInput,
  CustomTaskOutput,
  ProcessInventoryDataInput,
  ProcessInventoryDataOutput,
  EmployeeAssistantInput,
  EmployeeAssistantOutput,
  AnalyzeDealInput,
  AnalyzeDealOutput,
  GenerateMeetingDetailsInput,
  GenerateMeetingDetailsOutput,
  WebsiteFeedbackInput,
  WebsiteFeedbackOutput,
  FixWebsiteHtmlInput,
  FixWebsiteHtmlOutput,
  GenerateInvoiceSummaryInput,
  GenerateInvoiceSummaryOutput,
  ExtractExpenseDetailsInput,
  ExtractExpenseDetailsOutput,
  CalculateMileageExpenseInput,
  CalculateMileageExpenseOutput,
  GenerateKbArticleInput,
  GenerateKbArticleOutput,
  GenerateBomInput,
  GenerateBomOutput,
  GenerateEmailListInput,
  GenerateEmailListOutput,
  GenerateSurveyQuestionsInput,
  GenerateSurveyQuestionsOutput,
  GenerateEmailContentInput,
  GenerateEmailContentOutput,
} from '@/ai/schemas';

// --- AI Action Wrappers ---

export async function aiAutomationExplainer(
  input: AiAutomationExplainerInput
): Promise<AiAutomationExplainerOutput> {
  return aiAutomationExplainerFlow(input);
}

export async function generateFollowUpEmail(
  input: GenerateFollowUpEmailInput
): Promise<GenerateFollowUpEmailOutput> {
    return generateFollowUpEmailFlow(input);
}

export async function categorizeItem(
    input: CategorizeItemInput
): Promise<CategorizeItemOutput> {
    return categorizeItemFlow(input);
}

export async function generateJobDescription(
    input: GenerateJobDescriptionInput
): Promise<GenerateJobDescriptionOutput> {
    return generateJobDescriptionFlow(input);
}

export async function runCustomTask(
    input: CustomTaskInput
): Promise<CustomTaskOutput> {
    return runCustomTaskFlow(input);
}

export async function processInventoryData(
    input: ProcessInventoryDataInput
): Promise<ProcessInventoryDataOutput> {
    return processInventoryDataFlow(input);
}

export async function runEmployeeAssistant(
    input: EmployeeAssistantInput
): Promise<EmployeeAssistantOutput> {
    return runEmployeeAssistantFlow(input);
}

export async function analyzeDeal(
    input: AnalyzeDealInput
): Promise<AnalyzeDealOutput> {
    return analyzeDealFlow(input);
}

export async function generateMeetingDetails(
    input: GenerateMeetingDetailsInput
): Promise<GenerateMeetingDetailsOutput> {
    return generateMeetingDetailsFlow(input);
}

export async function getWebsiteFeedback(
    input: WebsiteFeedbackInput
): Promise<WebsiteFeedbackOutput> {
    return getWebsiteFeedbackFlow(input);
}

export async function fixWebsiteHtml(
    input: FixWebsiteHtmlInput
): Promise<FixWebsiteHtmlOutput> {
    return fixWebsiteHtmlFlow(input);
}

export async function generateInvoiceSummary(
    input: GenerateInvoiceSummaryInput
): Promise<GenerateInvoiceSummaryOutput> {
    return generateInvoiceSummaryFlow(input);
}

export async function extractExpenseDetails(
    input: ExtractExpenseDetailsInput
): Promise<ExtractExpenseDetailsOutput> {
    return extractExpenseDetailsFlow(input);
}

export async function calculateMileageExpense(
    input: CalculateMileageExpenseInput
): Promise<CalculateMileageExpenseOutput> {
    return calculateMileageExpenseFlow(input);
}

export async function generateKbArticle(
    input: GenerateKbArticleInput
): Promise<GenerateKbArticleOutput> {
    return generateKbArticleFlow(input);
}

export async function generateBom(
    input: GenerateBomInput
): Promise<GenerateBomOutput> {
    return generateBomFlow(input);
}

export async function generateEmailList(
    input: GenerateEmailListInput
): Promise<GenerateEmailListOutput> {
    return generateEmailListFlow(input);
}

export async function generateSurveyQuestions(
  input: GenerateSurveyQuestionsInput
): Promise<GenerateSurveyQuestionsOutput> {
  return generateSurveyQuestionsFlow(input);
}

export async function generateEmailContent(
  input: GenerateEmailContentInput
): Promise<GenerateEmailContentOutput> {
  return generateEmailContentFlow(input);
}
