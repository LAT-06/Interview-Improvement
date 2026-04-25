-- 1. Add is_public column to interview_questions
ALTER TABLE interview_questions ADD COLUMN is_public BOOLEAN DEFAULT false;

-- 2. Add policy to allow anyone to READ public questions
CREATE POLICY "Public questions are viewable by everyone" 
ON interview_questions FOR SELECT 
USING (is_public = true);

-- 3. Update the existing owner policy to ensure they can still manage everything
-- (The existing policy should already cover this, but being explicit is safer)
