import { supabase } from '../lib/supabaseClient';
import type { Application, ApplicationStatus, InterviewQuestion } from '../models/types';

export const ApplicationRepository = {
  async getAll(): Promise<Application[]> {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const apps = data || [];
    const now = new Date();
    
    // Auto-update status logic
    for (const app of apps) {
      if (app.status === 'interview' && app.interview_at && new Date(app.interview_at) < now) {
        await this.update(app.id, { status: 'in_progress' });
        app.status = 'in_progress';
      }
    }
    
    return apps;
  },

  async getById(id: string): Promise<Application | null> {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    if (!data) return null;

    let app = data;
    const now = new Date();
    if (app.status === 'interview' && app.interview_at && new Date(app.interview_at) < now) {
      app = await this.update(app.id, { status: 'interviewed' });
    }

    return app;
  },

  async create(application: Partial<Application>): Promise<Application> {
    const { data, error } = await supabase
      .from('applications')
      .insert(application)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Application>): Promise<Application> {
    const { data, error } = await supabase
      .from('applications')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getQuestions(applicationId: string): Promise<InterviewQuestion[]> {
    const { data, error } = await supabase
      .from('interview_questions')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async addQuestion(question: Partial<InterviewQuestion>): Promise<InterviewQuestion> {
    const { data, error } = await supabase
      .from('interview_questions')
      .insert(question)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateQuestion(id: string, updates: Partial<InterviewQuestion>): Promise<InterviewQuestion> {
    const { data, error } = await supabase
      .from('interview_questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getAllQuestions(): Promise<(InterviewQuestion & { applications: { company_name: string } })[]> {
    const { data, error } = await supabase
      .from('interview_questions')
      .select('*, applications(company_name)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getPublicQuestions(): Promise<(InterviewQuestion & { applications: { company_name: string } })[]> {
    const { data, error } = await supabase
      .from('interview_questions')
      .select('*, applications(company_name)')
      .eq('is_public', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async evaluateQuestion(id: string, question: string, user_answer: string): Promise<InterviewQuestion> {
    const { data: result, error: funcError } = await supabase.functions.invoke('evaluate-answer', {
      body: { question, user_answer },
    });

    if (funcError) throw funcError;

    const { data, error } = await supabase
      .from('interview_questions')
      .update({
        user_answer,
        llm_feedback: result.feedback,
        ideal_answer: result.ideal_answer,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async mockInterview(role: string, jobDescription: string, messages: any[], bankContext: string): Promise<string> {
    const { data, error } = await supabase.functions.invoke('mock-interview', {
      body: { role, jobDescription, messages, bank_context: bankContext },
    });

    if (error) throw error;
    return data.content;
  }
};
