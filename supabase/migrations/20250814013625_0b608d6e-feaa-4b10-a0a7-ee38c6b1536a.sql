-- Create brands table to track monitored brands
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_monitoring BOOLEAN DEFAULT false,
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create tweets table for storing Twitter data
CREATE TABLE public.tweets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  tweet_id TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  author_username TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  analyzed_at TIMESTAMP WITH TIME ZONE,
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create sentiment_metrics table for aggregated data
CREATE TABLE public.sentiment_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  positive_count INTEGER DEFAULT 0,
  negative_count INTEGER DEFAULT 0,
  neutral_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  overall_score NUMERIC(5,2) DEFAULT 0,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low'
);

-- Create alerts table
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('positive_spike', 'negative_spike', 'critical_sentiment', 'volume_spike')),
  message TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  acknowledged BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tweets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentiment_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Create policies (public access for now since no auth mentioned)
CREATE POLICY "Brands are viewable by everyone" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Brands can be created by everyone" ON public.brands FOR INSERT WITH CHECK (true);
CREATE POLICY "Brands can be updated by everyone" ON public.brands FOR UPDATE USING (true);

CREATE POLICY "Tweets are viewable by everyone" ON public.tweets FOR SELECT USING (true);
CREATE POLICY "Tweets can be created by everyone" ON public.tweets FOR INSERT WITH CHECK (true);

CREATE POLICY "Sentiment metrics are viewable by everyone" ON public.sentiment_metrics FOR SELECT USING (true);
CREATE POLICY "Sentiment metrics can be created by everyone" ON public.sentiment_metrics FOR INSERT WITH CHECK (true);

CREATE POLICY "Alerts are viewable by everyone" ON public.alerts FOR SELECT USING (true);
CREATE POLICY "Alerts can be created by everyone" ON public.alerts FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_tweets_brand_id ON public.tweets(brand_id);
CREATE INDEX idx_tweets_created_at ON public.tweets(created_at DESC);
CREATE INDEX idx_tweets_sentiment ON public.tweets(sentiment);
CREATE INDEX idx_sentiment_metrics_brand_id ON public.sentiment_metrics(brand_id);
CREATE INDEX idx_sentiment_metrics_timestamp ON public.sentiment_metrics(timestamp DESC);
CREATE INDEX idx_alerts_brand_id ON public.alerts(brand_id);
CREATE INDEX idx_alerts_created_at ON public.alerts(created_at DESC);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.brands;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tweets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sentiment_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;