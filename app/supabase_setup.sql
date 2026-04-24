-- Create Enums
CREATE TYPE application_status AS ENUM ('saved', 'applied', 'in_review', 'interview', 'in_progress', 'ghosted', 'rejected', 'offered');

-- Create Applications table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    position TEXT NOT NULL,
    status application_status DEFAULT 'applied',
    url TEXT,
    notes TEXT,
    interview_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Interview Questions table
CREATE TABLE interview_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    user_answer TEXT,
    llm_feedback TEXT,
    ideal_answer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;

-- Create policies (Assuming public access for now as it's a personal tool, 
-- but in a real app you'd bind this to auth.uid())
CREATE POLICY "Public applications access" ON applications FOR ALL USING (true);
CREATE POLICY "Public interview_questions access" ON interview_questions FOR ALL USING (true);
