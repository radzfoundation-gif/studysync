-- StudySync Database Schema (Supabase) - UPDATE FINAL

-- 0. Cleanup existing data & schema (KOSONGKAN SELUA DATABASE)
-- KODE INI AKAN MENGHAPUS TABEL LAMA DAN ISINYA UNTUK MEMBUAT STRUKTUR BARU
DROP TABLE IF EXISTS public.assignments, public.classes, public.notes, public.rooms, public.quizzes, public.room_messages, public.attendance, public.profiles CASCADE;

-- 0.1 Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text,
  full_name text,
  role text DEFAULT 'student',
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1. Create Classes Table
CREATE TABLE IF NOT EXISTS public.classes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE DEFAULT auth.uid(),
  name text NOT NULL,
  grade text,
  theme_color text DEFAULT 'bg-primary',
  students integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Assignments Table
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

-- 3. Create Notes Table
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

-- 4. Create Rooms Table
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

-- 5. Create Quizzes Table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE DEFAULT auth.uid(),
  title text NOT NULL,
  questions jsonb NOT NULL,
  plays integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create Room Messages Table
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

-- Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  class_name text,
  student_number text,
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(class_id, student_name)
);

-- Enable Realtime WebSockets SAFELY
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.classes; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.assignments; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notes; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.quizzes; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Profiles: Users can view all profiles but only edit their own
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Classes: Users can view and manage their own classes
CREATE POLICY "Users can view own classes" ON public.classes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own classes" ON public.classes FOR ALL USING (auth.uid() = user_id);

-- Assignments: Users can view and manage their own assignments
CREATE POLICY "Users can view own assignments" ON public.assignments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own assignments" ON public.assignments FOR ALL USING (auth.uid() = user_id);

-- Notes: Users can view own or shared notes
CREATE POLICY "Users can view own or shared notes" ON public.notes FOR SELECT USING (auth.uid() = user_id OR is_shared = true);
CREATE POLICY "Users can manage own notes" ON public.notes FOR ALL USING (auth.uid() = user_id);

-- Quizzes: Users can view all quizzes but only manage their own
CREATE POLICY "Quizzes are viewable by everyone" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "Users can manage own quizzes" ON public.quizzes FOR ALL USING (auth.uid() = user_id);

-- Room Messages: Viewable by everyone, only manage own
CREATE POLICY "Messages are viewable by everyone" ON public.room_messages FOR SELECT USING (true);
CREATE POLICY "Users can insert own messages" ON public.room_messages FOR INSERT WITH CHECK (true);

-- 8. Auto Profile Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Student User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 9. Create Student Data Table
CREATE TABLE IF NOT EXISTS public.student_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  nisn text UNIQUE NOT NULL,
  class_name text,
  password text DEFAULT '123',
  school_name text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Create Student Complaints Table
CREATE TABLE IF NOT EXISTS public.student_complaints (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  content text NOT NULL,
  status text DEFAULT 'Baru',
  reply text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Create Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  class_name text,
  student_number text,
  nisn text,
  photo_url text,
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(class_id, student_name)
);

-- Enable Realtime for New Tables
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.student_data; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.student_complaints; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- Enable RLS for New Tables
ALTER TABLE public.student_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for New Tables
CREATE POLICY "Full access to student data" ON public.student_data FOR ALL USING (true);
CREATE POLICY "Complaints are viewable by everyone" ON public.student_complaints FOR SELECT USING (true);
CREATE POLICY "Everyone can insert complaints" ON public.student_complaints FOR INSERT WITH CHECK (true);
CREATE POLICY "Teacher/Admin can update complaints" ON public.student_complaints FOR UPDATE USING (true);
CREATE POLICY "Attendance viewable by everyone" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Everyone can insert attendance" ON public.attendance FOR INSERT WITH CHECK (true);

