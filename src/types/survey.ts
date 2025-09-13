export type QuestionType =
  | 'multiple-choice'
  | 'short-text'
  | 'paragraph'
  | 'yes-no'
  | 'rating'
  | 'checkbox'
  | 'dropdown';

export type Question = {
  id: string;
  label: string; // Changed from 'text' to 'label'
  type: QuestionType;
  required: boolean;
  options?: string[];
};

export type SurveySection = {
    id: string;
    title: string;
    questions: Question[];
}

export type Survey = {
  id?: string;
  ownerId: string;
  title: string;
  description: string;
  visibility: 'private' | 'public';
  sections?: SurveySection[];
  questions: Question[];
  allowAnonymousResponses: boolean;
  responseCount?: number;
  status: 'draft' | 'published' | 'closed';
  createdAt?: string;
  updatedAt?: string;
  expirationDate?: string;
  logoUrl?: string;
  thankYouMessage?: string;
  limitToOneResponse?: boolean;
};


export type SurveyResponse = {
    id: string;
    surveyId: string;
    submittedAt: any;
    answers: Record<string, string | string[]>;
    userId?: string;
}
