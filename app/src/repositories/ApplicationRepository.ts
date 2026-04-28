import api from '../lib/apiClient';
import type { Application, InterviewQuestion } from '../models/types';

export const ApplicationRepository = {
  async getAll(): Promise<Application[]> {
    const { data } = await api.get('/applications');
    return data;
  },

  async getById(id: string): Promise<Application> {
    const { data } = await api.get(`/applications/${id}`);
    return data;
  },

  async create(application: Partial<Application>): Promise<Application> {
    const { data } = await api.post('/applications', application);
    return data;
  },

  async update(id: string, updates: Partial<Application>): Promise<Application> {
    const { data } = await api.patch(`/applications/${id}`, updates);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/applications/${id}`);
  },

  async addQuestion(question: Partial<InterviewQuestion>): Promise<InterviewQuestion> {
    const { data } = await api.post('/questions', question);
    return data;
  },

  async getAllQuestions(): Promise<(InterviewQuestion & { applications: { company_name: string } })[]> {
    const { data } = await api.get('/questions');
    return data;
  },

  async getPublicQuestions(): Promise<(InterviewQuestion & { applications: { company_name: string } })[]> {
    const { data } = await api.get('/questions/public');
    return data;
  },

  async updateQuestion(id: string, updates: Partial<InterviewQuestion>): Promise<InterviewQuestion> {
    const { data } = await api.patch(`/questions/${id}`, updates);
    return data;
  },

  async deleteQuestion(id: string): Promise<void> {
    await api.delete(`/questions/${id}`);
  },

  async evaluateQuestion(id: string, question: string, user_answer: string): Promise<InterviewQuestion> {
    const { data } = await api.post('/ai/evaluate', { id, question, user_answer });
    return data;
  },

  async mockInterview(role: string, jobDescription: string, messages: any[], bankContext: string): Promise<string> {
    const { data } = await api.post('/ai/mock-interview', { role, jobDescription, messages, bank_context: bankContext });
    return data.content;
  }
};
