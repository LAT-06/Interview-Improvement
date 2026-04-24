import { createRouter, createWebHistory } from 'vue-router';
import DashboardView from '../views/DashboardView.vue';
import ApplicationDetailView from '../views/ApplicationDetailView.vue';
import QuestionsReviewView from '../views/QuestionsReviewView.vue';
import CalendarView from '../views/CalendarView.vue';
import MockInterviewView from '../views/MockInterviewView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
    },
    {
      path: '/questions',
      name: 'questions-review',
      component: QuestionsReviewView,
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: CalendarView,
    },
    {
      path: '/mock-interview',
      name: 'mock-interview',
      component: MockInterviewView,
    },
    {
      path: '/application/:id',
      name: 'application-detail',
      component: ApplicationDetailView,
      props: true,
    },
  ],
});

export default router;
