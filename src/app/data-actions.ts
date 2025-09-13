
'use server';

// This file is largely deprecated as data has moved to Firestore.
// It's kept for any remaining mock data references but active data
// mutations and fetches should be done via react-firebase-hooks or
// direct Firestore calls in the components themselves.

export type UnifiedContact = {
    id: string;
    name: string;
    email: string;
    isEmployee: boolean;
};

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: string;
};

// --- AI Automation Rules ---
export type AutomationRule = {
    id: string;
    name: string;
    model: 'deal' | 'contact' | 'task' | 'helpdesk' | 'employee';
    trigger: 'on_create' | 'on_update';
    action: 'generate_follow_up' | 'categorize' | 'generate_job_description' | 'custom';
    customActionPrompt?: string;
    active: boolean;
    ownerId?: string;
};
