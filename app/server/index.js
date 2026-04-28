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
  try {
    let accessToken = req.cookies['sb-access-token'];
    const refreshToken = req.cookies['sb-refresh-token'];

    if (!accessToken && !refreshToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Khởi tạo client với token để check RLS
    const userClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, {
      global: { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} }
    });

    let { data: { user }, error } = await userClient.auth.getUser();

    // Tự động refresh nếu token hết hạn
    if ((error || !user) && refreshToken) {
      console.log('Refreshing expired session...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
      
      if (!refreshError && refreshData.session) {
        accessToken = refreshData.session.access_token;
        res.cookie('sb-access-token', accessToken, {
          httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Lax',
          expires: new Date(Date.now() + refreshData.session.expires_in * 1000)
        });
        
        // Thử lại với client mới
        const newUserClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { Authorization: `Bearer ${accessToken}` } }
        });
        const { data: { user: refreshedUser }, error: secondError } = await newUserClient.auth.getUser();
        if (secondError) throw secondError;
        
        user = refreshedUser;
        req.supabase = newUserClient;
      } else {
        throw refreshError || new Error('Failed to refresh session');
      }
    } else {
      if (error) throw error;
      req.supabase = userClient;
    }

    if (!user) return res.status(401).json({ error: 'Session expired' });
    
    req.user = user;
    next();
  } catch (err) {
    console.error('CRITICAL Auth Middleware Error:', err);
    res.status(500).json({ error: 'Internal security error' });
  }
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
  try {
    // Luôn luôn lọc theo user_id của chính người dùng đó
    const { data, error } = await req.supabase
      .from('applications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Detailed GET /api/applications error:', err);
    res.status(500).json({ error: 'Failed to load applications' });
  }
});

// ... (post route)

app.get('/api/applications/:id', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('applications')
      .select('*, interview_questions(*)')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Detailed GET /api/applications/:id error:', err);
    res.status(500).json({ error: 'Application not found' });
  }
});

// ... (patch, delete routes)

app.get('/api/questions', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('interview_questions')
      .select('*, applications!inner(company_name, user_id)')
      .eq('applications.user_id', req.user.id) // Chỉ lấy câu hỏi của chính mình
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Detailed GET /api/questions error:', err);
    res.status(500).json({ error: 'Failed to load questions' });
  }
});

app.get('/api/questions/public', async (req, res) => {
  const { data, error } = await supabase
    .from('interview_questions')
    .select('*, applications(company_name, position)')
    .eq('is_public', true)
    .order('created_at', { ascending: false });
  
  if (error) return res.status(500).json({ error: 'Failed to load community questions' });
  
  // Lọc bỏ những câu hỏi mà applications bị null (do RLS chặn)
  const validData = data.filter(q => q.applications !== null);
  res.json(validData);
});

app.post('/api/questions', authenticateUser, async (req, res) => {
  const { data, error } = await req.supabase
    .from('interview_questions')
    .insert(req.body)
    .select().single();
  if (error) return res.status(500).json({ error: 'Failed to add question' });
  res.json(data);
});

app.patch('/api/questions/:id', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await req.supabase.from('interview_questions').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Detailed PATCH /api/questions/:id error:', err);
    res.status(500).json({ error: 'Update failed' });
  }
});

app.delete('/api/questions/:id', authenticateUser, async (req, res) => {
  try {
    const { error } = await req.supabase.from('interview_questions').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Detailed DELETE /api/questions/:id error:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

app.post('/api/ai/evaluate', authenticateUser, aiLimiter, async (req, res) => {
  const { id, question, user_answer } = req.body;
  
  try {
    // 1. Gọi AI Edge Function của Supabase
    const { data: result, error: funcError } = await req.supabase.functions.invoke('evaluate-answer', {
      body: { question, user_answer }
    });

    if (funcError) throw funcError;

    // 2. Lưu kết quả vào Database
    const { data: updatedQuestion, error: dbError } = await req.supabase
      .from('interview_questions')
      .update({
        user_answer,
        llm_feedback: result.feedback,
        ideal_answer: result.ideal_answer
      })
      .eq('id', id)
      .select()
      .single();

    if (dbError) throw dbError;

    res.json(updatedQuestion);
  } catch (error) {
    console.error('AI Evaluation Error:', error);
    res.status(500).json({ error: 'AI Evaluation failed' });
  }
});

app.post('/api/ai/mock-interview', authenticateUser, aiLimiter, async (req, res) => {
  const { data, error } = await req.supabase.functions.invoke('mock-interview', { body: req.body });
  if (error) return res.status(500).json({ error: 'AI Interview failed' });
  res.json(data);
});

app.listen(PORT, () => console.log(`Secure Backend running on port ${PORT}`));
