import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

console.log('--- Server Starting ---');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'FOUND' : 'MISSING');
console.log('SUPABASE_PUBLISHABLE_KEY:', process.env.SUPABASE_PUBLISHABLE_KEY ? 'FOUND' : 'MISSING');

// Supabase config
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: false,
    persistSession: false
  }
});

app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Anti-CSRF Middleware
const csrfProtection = (req, res, next) => {
  const safeMethods = ['GET', 'OPTIONS', 'HEAD'];
  if (!safeMethods.includes(req.method)) {
    const customHeader = req.headers['x-requested-with'];
    if (customHeader !== 'XMLHttpRequest') {
      return res.status(403).json({ error: 'Security violation' });
    }
  }
  next();
};

app.use(csrfProtection);

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { error: 'Too many requests' }
});

const authenticateUser = async (req, res, next) => {
  let accessToken = req.cookies['sb-access-token'];
  const refreshToken = req.cookies['sb-refresh-token'];

  if (!accessToken && !refreshToken) return res.status(401).json({ error: 'Unauthorized' });

  let userClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} }
  });

  let { data: { user }, error } = await userClient.auth.getUser();

  if ((error || !user) && refreshToken) {
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (!refreshError && refreshData.session) {
      accessToken = refreshData.session.access_token;
      res.cookie('sb-access-token', accessToken, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Lax',
        expires: new Date(Date.now() + refreshData.session.expires_in * 1000)
      });
      userClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } }
      });
      const { data: { user: refreshedUser } } = await userClient.auth.getUser();
      user = refreshedUser;
    }
  }

  if (!user) return res.status(401).json({ error: 'Session expired' });
  req.user = user;
  req.supabase = userClient;
  next();
};

// --- AUTHENTICATION ---

app.get('/api/auth/google', async (req, res) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.BACKEND_URL}/api/auth/callback`,
      skipBrowserRedirect: true // BẮT BUỘC phải là true ở Backend
    }
  });
  if (error) return res.status(500).json({ error: 'Authentication failed' });
  res.redirect(data.url);
});

app.get('/api/auth/callback', async (req, res) => {
  const code = req.query.code;
  
  // Nếu không có code, trả về script để kiểm tra hash (trường hợp bị dính dấu #)
  if (!code) {
    return res.send(`
      <html>
        <body>
          <script>
            const hash = window.location.hash;
            if (hash && hash.includes('access_token')) {
              // Nếu bị dính implicit flow (#), chuyển nó thành query (?) để server xử lý được
              const params = new URLSearchParams(hash.substring(1));
              window.location.href = window.location.pathname + '?' + params.toString();
            } else if (hash && hash.includes('code=')) {
              const params = new URLSearchParams(hash.substring(1));
              window.location.href = window.location.pathname + '?' + params.toString();
            } else {
              document.body.innerHTML = "Authentication failed: No code provided.";
            }
          </script>
        </body>
      </html>
    `);
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return res.status(500).send('Authentication failed');

  res.cookie('sb-access-token', data.session.access_token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Lax',
    expires: new Date(Date.now() + data.session.expires_in * 1000)
  });

  res.cookie('sb-refresh-token', data.session.refresh_token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Lax',
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });

  res.redirect(process.env.FRONTEND_URL || '/');
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('sb-access-token');
  res.clearCookie('sb-refresh-token');
  res.json({ success: true });
});

app.get('/api/auth/me', async (req, res) => {
  const token = req.cookies['sb-access-token'];
  if (!token) return res.json({ user: null });
  const { data: { user } } = await supabase.auth.getUser(token);
  res.json({ user });
});

// --- DATA ROUTES ---

app.get('/api/applications', authenticateUser, async (req, res) => {
  const { data, error } = await req.supabase.from('applications').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: 'Failed to load applications' });
  res.json(data);
});

app.post('/api/applications', authenticateUser, async (req, res) => {
  const { data, error } = await req.supabase.from('applications').insert({ ...req.body, user_id: req.user.id }).select().single();
  if (error) return res.status(500).json({ error: 'Failed to create application' });
  res.json(data);
});

app.get('/api/applications/:id', authenticateUser, async (req, res) => {
  const { data, error } = await req.supabase.from('applications').select('*, interview_questions(*)').eq('id', req.params.id).single();
  if (error) return res.status(500).json({ error: 'Application not found' });
  res.json(data);
});

app.patch('/api/applications/:id', authenticateUser, async (req, res) => {
  const { data, error } = await req.supabase.from('applications').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: 'Update failed' });
  res.json(data);
});

app.get('/api/questions', authenticateUser, async (req, res) => {
  const { data, error } = await req.supabase.from('interview_questions').select('*, applications!inner(company_name, user_id)').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: 'Failed to load questions' });
  res.json(data);
});

app.get('/api/questions/public', async (req, res) => {
  const { data, error } = await supabase.from('interview_questions').select('*, applications(company_name)').eq('is_public', true).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: 'Failed to load community questions' });
  res.json(data);
});

app.patch('/api/questions/:id', authenticateUser, async (req, res) => {
  const { data, error } = await req.supabase.from('interview_questions').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: 'Update failed' });
  res.json(data);
});

app.post('/api/ai/evaluate', authenticateUser, aiLimiter, async (req, res) => {
  const { data, error } = await req.supabase.functions.invoke('evaluate-answer', { body: req.body });
  if (error) return res.status(500).json({ error: 'AI Evaluation failed' });
  res.json(data);
});

app.post('/api/ai/mock-interview', authenticateUser, aiLimiter, async (req, res) => {
  const { data, error } = await req.supabase.functions.invoke('mock-interview', { body: req.body });
  if (error) return res.status(500).json({ error: 'AI Interview failed' });
  res.json(data);
});

app.listen(PORT, () => console.log(`Secure Backend running on port ${PORT}`));
