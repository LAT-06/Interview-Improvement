export type ApplicationStatus = 'saved' | 'applied' | 'in_review' | 'interview' | 'in_progress' | 'ghosted' | 'rejected' | 'offered';

export interface Application {
  id: string;
  company_name: string;
  position: string;
  status: ApplicationStatus;
  url?: string;
  notes?: string;
  interview_at?: string;
  created_at: string;
  updated_at: string;
}

export interface InterviewQuestion {
  id: string;
  application_id: string;
  question: string;
  user_answer?: string;
  llm_feedback?: string;
  ideal_answer?: string;
  is_public?: boolean;
  created_at: string;
}
