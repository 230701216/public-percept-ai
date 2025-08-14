import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { brandId } = await req.json();

    if (!brandId) {
      throw new Error('Brand ID is required');
    }

    console.log(`Analyzing sentiment for brand ID: ${brandId}`);

    // Get unanalyzed tweets for this brand
    const { data: tweets, error: tweetsError } = await supabase
      .from('tweets')
      .select('*')
      .eq('brand_id', brandId)
      .is('sentiment', null)
      .limit(50);

    if (tweetsError) throw tweetsError;

    if (!tweets || tweets.length === 0) {
      console.log('No new tweets to analyze');
      return new Response(
        JSON.stringify({ message: 'No new tweets to analyze' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing ${tweets.length} tweets`);

    // Analyze sentiment for each tweet
    for (const tweet of tweets) {
      let sentiment = 'neutral';
      let confidence = 0.5;

      if (openAIApiKey) {
        try {
          // Use OpenAI for sentiment analysis
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: 'You are a sentiment analysis expert. Analyze the sentiment of tweets and respond with ONLY a JSON object in this exact format: {"sentiment": "positive|negative|neutral", "confidence": 0.0-1.0, "reasoning": "brief explanation"}. Be accurate and objective.'
                },
                {
                  role: 'user',
                  content: `Analyze the sentiment of this tweet: "${tweet.content}"`
                }
              ],
              temperature: 0.1,
              max_tokens: 150
            }),
          });

          if (response.ok) {
            const aiResult = await response.json();
            const analysis = JSON.parse(aiResult.choices[0].message.content);
            sentiment = analysis.sentiment;
            confidence = analysis.confidence;
            console.log(`AI Analysis for tweet ${tweet.id}: ${sentiment} (${confidence})`);
          }
        } catch (aiError) {
          console.error('OpenAI analysis failed, using fallback:', aiError);
          // Fallback to simple keyword-based analysis
          const content = tweet.content.toLowerCase();
          const positiveWords = ['love', 'great', 'amazing', 'awesome', 'excellent', 'good', 'best', 'happy', 'perfect'];
          const negativeWords = ['hate', 'terrible', 'awful', 'bad', 'worst', 'horrible', 'disappointed', 'angry', 'sucks'];
          
          const positiveScore = positiveWords.reduce((score, word) => 
            score + (content.includes(word) ? 1 : 0), 0);
          const negativeScore = negativeWords.reduce((score, word) => 
            score + (content.includes(word) ? 1 : 0), 0);

          if (positiveScore > negativeScore) {
            sentiment = 'positive';
            confidence = Math.min(0.7, 0.5 + (positiveScore * 0.1));
          } else if (negativeScore > positiveScore) {
            sentiment = 'negative';
            confidence = Math.min(0.7, 0.5 + (negativeScore * 0.1));
          } else {
            sentiment = 'neutral';
            confidence = 0.6;
          }
        }
      } else {
        // Simple fallback analysis without OpenAI
        const content = tweet.content.toLowerCase();
        const positiveWords = ['love', 'great', 'amazing', 'awesome', 'excellent', 'good', 'best', 'happy', 'perfect'];
        const negativeWords = ['hate', 'terrible', 'awful', 'bad', 'worst', 'horrible', 'disappointed', 'angry', 'sucks'];
        
        const positiveScore = positiveWords.reduce((score, word) => 
          score + (content.includes(word) ? 1 : 0), 0);
        const negativeScore = negativeWords.reduce((score, word) => 
          score + (content.includes(word) ? 1 : 0), 0);

        if (positiveScore > negativeScore) {
          sentiment = 'positive';
          confidence = Math.min(0.7, 0.5 + (positiveScore * 0.1));
        } else if (negativeScore > positiveScore) {
          sentiment = 'negative';
          confidence = Math.min(0.7, 0.5 + (negativeScore * 0.1));
        }
      }

      // Update tweet with sentiment analysis
      const { error: updateError } = await supabase
        .from('tweets')
        .update({
          sentiment,
          confidence_score: confidence,
          analyzed_at: new Date().toISOString()
        })
        .eq('id', tweet.id);

      if (updateError) {
        console.error('Error updating tweet sentiment:', updateError);
      }
    }

    // Calculate aggregated metrics
    const { data: sentimentCounts, error: countsError } = await supabase
      .from('tweets')
      .select('sentiment')
      .eq('brand_id', brandId)
      .not('sentiment', 'is', null);

    if (countsError) throw countsError;

    const positive = sentimentCounts?.filter(t => t.sentiment === 'positive').length || 0;
    const negative = sentimentCounts?.filter(t => t.sentiment === 'negative').length || 0;
    const neutral = sentimentCounts?.filter(t => t.sentiment === 'neutral').length || 0;
    const total = positive + negative + neutral;

    const overallScore = total > 0 ? ((positive - negative) / total) * 100 : 0;
    const negativePercentage = total > 0 ? (negative / total) * 100 : 0;
    
    let riskLevel = 'low';
    if (negativePercentage > 50) riskLevel = 'critical';
    else if (negativePercentage > 35) riskLevel = 'high';
    else if (negativePercentage > 20) riskLevel = 'medium';

    // Store aggregated metrics
    const { error: metricsError } = await supabase
      .from('sentiment_metrics')
      .insert({
        brand_id: brandId,
        positive_count: positive,
        negative_count: negative,
        neutral_count: neutral,
        total_count: total,
        overall_score: overallScore,
        risk_level: riskLevel
      });

    if (metricsError) {
      console.error('Error storing metrics:', metricsError);
    }

    // Create alerts for critical sentiment
    if (riskLevel === 'critical') {
      const { error: alertError } = await supabase
        .from('alerts')
        .insert({
          brand_id: brandId,
          type: 'critical_sentiment',
          message: `Critical negative sentiment detected: ${negativePercentage.toFixed(1)}% negative mentions`,
          severity: 'critical'
        });

      if (alertError) {
        console.error('Error creating alert:', alertError);
      }
    }

    console.log(`Analysis complete. Metrics: +${positive} -${negative} =${neutral} (${overallScore.toFixed(1)}% score)`);

    return new Response(
      JSON.stringify({
        success: true,
        analyzed: tweets.length,
        metrics: {
          positive,
          negative,
          neutral,
          total,
          overallScore,
          riskLevel
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyze-sentiment function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});