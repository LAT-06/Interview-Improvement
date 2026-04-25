import { createRouter, createWebHistory } from 'vue-router';
import { supabase } from '../lib/supabaseClient';
import DashboardView from '../views/DashboardView.vue';
import ApplicationDetailView from '../views/ApplicationDetailView.vue';
import QuestionsReviewView from '../views/QuestionsReviewView.vue';
import CalendarView from '../views/CalendarView.vue';
import MockInterviewView from '../views/MockInterviewView.vue';
import CommunityQuestionsView from '../views/CommunityQuestionsView.vue';
import LoginView from '../views/LoginView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/questions',
      name: 'questions-review',
      component: QuestionsReviewView,
      meta: { requiresAuth: true }
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: CalendarView,
      meta: { requiresAuth: true }
    },
    {
      path: '/mock-interview',
      name: 'mock-interview',
      component: MockInterviewView,
      meta: { requiresAuth: true }
    },
    {
      path: '/community',
      name: 'community-questions',
      component: CommunityQuestionsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/application/:id',
      name: 'application-detail',
      component: ApplicationDetailView,
      props: true,
      meta: { requiresAuth: true }
    },
  ],
});

// Navigation Guard
router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (to.meta.requiresAuth && !session) {
    next('/login');
  } else if (to.name === 'login' && session) {
    next('/');
  } else {
    next();
  }
});

export default router;
