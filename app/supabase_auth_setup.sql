-- 1. Add user_id column to applications
ALTER TABLE applications ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- 2. Update existing data to belong to the first user (if any)
-- In a real app, you'd handle this more carefully
-- UPDATE applications SET user_id = 'some-user-id' WHERE user_id IS NULL;

-- 3. Drop existing public policies
DROP POLICY IF EXISTS "Public applications access" ON applications;
DROP POLICY IF EXISTS "Public interview_questions access" ON interview_questions;

-- 4. Create secure user-specific policies
CREATE POLICY "Users can manage their own applications" 
ON applications FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own questions" 
ON interview_questions FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM applications 
    WHERE applications.id = interview_questions.application_id 
    AND applications.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM applications 
    WHERE applications.id = interview_questions.application_id 
    AND applications.user_id = auth.uid()
  )
);
