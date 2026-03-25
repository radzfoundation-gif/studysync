-- StudySync Database Schema (Supabase) - UPDATE FINAL
-- RESTRUCTURED TO AVOID "RELATION DOES NOT EXIST" ERRORS

-- 0. Cleanup existing data & schema
DROP TABLE IF EXISTS public.quiz_results, public.assignments, public.classes, public.notes, public.rooms, public.quizzes, public.room_messages, public.attendance, public.profiles, public.student_data, public.student_complaints CASCADE;

-------------------------------------------------------------------------------
-- 1. TABLE DEFINITIONS
-------------------------------------------------------------------------------

-- 1.1 Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text,
  full_name text,
  role text DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin', 'staff')),
  nisn text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.2 Classes Table
CREATE TABLE IF NOT EXISTS public.classes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE DEFAULT auth.uid(),
  name text NOT NULL,
  grade text,
  theme_color text DEFAULT 'bg-primary',
  students integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.3 Quizzes Table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE DEFAULT auth.uid(),
  title text NOT NULL,
  questions jsonb NOT NULL,
  plays integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.4 Assignments Table
CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE DEFAULT auth.uid(),
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  title text NOT NULL,
  course_name text NOT NULL,
  due_date timestamp with time zone NOT NULL,
  status text DEFAULT 'Pending',
  quiz_data jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.5 Notes Table
CREATE TABLE IF NOT EXISTS public.notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE DEFAULT auth.uid(),
  title text NOT NULL,
  subject text NOT NULL,
  content text DEFAULT '',
  last_edited text DEFAULT 'Baru saja',
  is_shared boolean DEFAULT false,
  icon text DEFAULT 'description',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.6 Rooms Table
CREATE TABLE IF NOT EXISTS public.rooms (
  id uuid PRIMARY KEY REFERENCES public.classes(id) ON DELETE CASCADE,
  name text NOT NULL,
  subject text NOT NULL,
  members_count integer DEFAULT 1,
  last_active text DEFAULT 'Active now',
  is_private boolean DEFAULT false,
  icon text DEFAULT 'groups',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.7 Room Messages Table
CREATE TABLE IF NOT EXISTS public.room_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid REFERENCES public.rooms(id) ON DELETE CASCADE,
  sender_name text NOT NULL,
  sender_role text DEFAULT 'student',
  content text NOT NULL,
  file_url text,
  file_name text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.8 Student Data Table
CREATE TABLE IF NOT EXISTS public.student_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  nisn text UNIQUE NOT NULL,
  class_name text,
  password text DEFAULT '123',
  school_name text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.9 Student Complaints Table
CREATE TABLE IF NOT EXISTS public.student_complaints (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  content text NOT NULL,
  status text DEFAULT 'Baru',
  reply text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.10 Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  class_name text,
  student_number text,
  nisn text,
  photo_url text,
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.11 Quiz Results Table (Leaderboard)
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id uuid REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  score integer NOT NULL,
  completed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-------------------------------------------------------------------------------
-- 2. FUNCTIONS & TRIGGERS
-------------------------------------------------------------------------------

-- 2.1 Auto Profile Trigger Function (Fixed: use ON CONFLICT)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role = COALESCE(
      NULLIF(EXCLUDED.role, 'student'),
      profiles.role
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.2 Create Profile Trigger (DISABLED to prevent role overwriting)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2.3 Increment Quiz Plays Function
CREATE OR REPLACE FUNCTION public.increment_quiz_plays(quiz_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.quizzes
  SET plays = plays + 1
  WHERE id = quiz_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-------------------------------------------------------------------------------
-- 3. SECURITY (RLS) & POLICIES
-------------------------------------------------------------------------------

-- Enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- 3.1 Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Staff can manage teacher profiles" ON public.profiles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('staff', 'admin')
  )
);

-- 3.2 Classes Policies
CREATE POLICY "Users can view own classes" ON public.classes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own classes" ON public.classes FOR ALL USING (auth.uid() = user_id);

-- 3.3 Assignments Policies
CREATE POLICY "Users can view own assignments" ON public.assignments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own assignments" ON public.assignments FOR ALL USING (auth.uid() = user_id);

-- 3.4 Notes Policies
CREATE POLICY "Users can view own or shared notes" ON public.notes FOR SELECT USING (auth.uid() = user_id OR is_shared = true);
CREATE POLICY "Users can manage own notes" ON public.notes FOR ALL USING (auth.uid() = user_id);

-- 3.5 Quizzes Policies
CREATE POLICY "Quizzes are viewable by everyone" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "Users can manage own quizzes" ON public.quizzes FOR ALL USING (auth.uid() = user_id);

-- 3.6 Room & Messages Policies
CREATE POLICY "Rooms are viewable by everyone" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can insert rooms" ON public.rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Messages are viewable by everyone" ON public.room_messages FOR SELECT USING (true);
CREATE POLICY "Users can insert own messages" ON public.room_messages FOR INSERT WITH CHECK (true);

-- 3.7 Student Data Policies
CREATE POLICY "Full access to student data" ON public.student_data FOR ALL USING (true);

-- 3.8 Complaints Policies
CREATE POLICY "Complaints are viewable by everyone" ON public.student_complaints FOR SELECT USING (true);
CREATE POLICY "Everyone can insert complaints" ON public.student_complaints FOR INSERT WITH CHECK (true);
CREATE POLICY "Teacher/Admin can update complaints" ON public.student_complaints FOR UPDATE USING (true);

-- 3.9 Attendance Policies
CREATE POLICY "Attendance viewable by everyone" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Everyone can insert attendance" ON public.attendance FOR INSERT WITH CHECK (true);

-- 3.10 Quiz Results Policies
CREATE POLICY "Quiz results are viewable by everyone" ON public.quiz_results FOR SELECT USING (true);
CREATE POLICY "Everyone can insert quiz results" ON public.quiz_results FOR INSERT WITH CHECK (true);

-------------------------------------------------------------------------------
-- 4. REALTIME CONFIGURATION
-------------------------------------------------------------------------------

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.classes; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.assignments; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notes; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.quizzes; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.student_data; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.student_complaints; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_results; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
