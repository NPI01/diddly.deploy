-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  twitter_handle TEXT,
  subscription_status TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Articles table
CREATE TABLE public.articles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Agent interactions table
CREATE TABLE public.agent_interactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('editor', 'writer', 'researcher', 'growth')),
  level INTEGER, -- For E&R levels 1-3
  input_content TEXT NOT NULL,
  output_content TEXT NOT NULL,
  prompt_used TEXT,
  user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
  user_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Article metrics for growth agent
CREATE TABLE public.article_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  published_url TEXT,
  open_rate DECIMAL(5,2),
  click_rate DECIMAL(5,2),
  comments_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  read_time_avg INTEGER, -- in seconds
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Publishing history
CREATE TABLE public.publishing_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  published_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  error_message TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompt templates for agents
CREATE TABLE public.prompt_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  agent_type TEXT NOT NULL,
  name TEXT NOT NULL,
  template TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Articles policies
CREATE POLICY "Users can view own articles" ON public.articles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own articles" ON public.articles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own articles" ON public.articles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own articles" ON public.articles
  FOR DELETE USING (auth.uid() = user_id);

-- Agent interactions policies
CREATE POLICY "Users can view own agent interactions" ON public.agent_interactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.articles
      WHERE articles.id = agent_interactions.article_id
      AND articles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create agent interactions for own articles" ON public.agent_interactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.articles
      WHERE articles.id = agent_interactions.article_id
      AND articles.user_id = auth.uid()
    )
  );

-- Article metrics policies
CREATE POLICY "Users can view own article metrics" ON public.article_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own article metrics" ON public.article_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own article metrics" ON public.article_metrics
  FOR UPDATE USING (auth.uid() = user_id);

-- Publishing history policies
CREATE POLICY "Users can view own publishing history" ON public.publishing_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.articles
      WHERE articles.id = publishing_history.article_id
      AND articles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create publishing history for own articles" ON public.publishing_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.articles
      WHERE articles.id = publishing_history.article_id
      AND articles.user_id = auth.uid()
    )
  );

-- Prompt templates policies
CREATE POLICY "Users can view own prompt templates" ON public.prompt_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own prompt templates" ON public.prompt_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prompt templates" ON public.prompt_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompt templates" ON public.prompt_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Functions and triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update word count
CREATE OR REPLACE FUNCTION public.update_word_count()
RETURNS TRIGGER AS $$
BEGIN
  NEW.word_count = array_length(string_to_array(trim(NEW.content), ' '), 1);
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for word count update
CREATE TRIGGER update_article_word_count
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE PROCEDURE public.update_word_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at for profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_articles_user_id ON public.articles(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON public.articles(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_interactions_article_id ON public.agent_interactions(article_id);
CREATE INDEX IF NOT EXISTS idx_agent_interactions_agent_type ON public.agent_interactions(agent_type);
CREATE INDEX IF NOT EXISTS idx_article_metrics_article_id ON public.article_metrics(article_id);
CREATE INDEX IF NOT EXISTS idx_publishing_history_article_id ON public.publishing_history(article_id);
CREATE INDEX IF NOT EXISTS idx_profiles_twitter_handle ON public.profiles(twitter_handle);
CREATE INDEX IF NOT EXISTS idx_profiles_website ON public.profiles(website);