import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const twitterBearerToken = Deno.env.get('TWITTER_BEARER_TOKEN');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { brand } = await req.json();

    if (!brand) {
      throw new Error('Brand name is required');
    }

    if (!twitterBearerToken) {
      throw new Error('Twitter Bearer Token not configured');
    }

    console.log(`Starting Twitter monitoring for brand: ${brand}`);

    // Create or get brand record
    const { data: existingBrand, error: brandError } = await supabase
      .from('brands')
      .select('*')
      .eq('name', brand)
      .maybeSingle();

    let brandRecord;
    if (existingBrand) {
      // Update existing brand
      const { data: updatedBrand, error: updateError } = await supabase
        .from('brands')
        .update({ 
          is_monitoring: true, 
          last_checked: new Date().toISOString() 
        })
        .eq('id', existingBrand.id)
        .select()
        .single();

      if (updateError) throw updateError;
      brandRecord = updatedBrand;
    } else {
      // Create new brand
      const { data: newBrand, error: createError } = await supabase
        .from('brands')
        .insert({ 
          name: brand, 
          is_monitoring: true 
        })
        .select()
        .single();

      if (createError) throw createError;
      brandRecord = newBrand;
    }

    // Search for tweets about the brand
    const searchQuery = encodeURIComponent(`${brand} OR @${brand.toLowerCase().replace(/\s+/g, '')}`);
    const twitterUrl = `https://api.twitter.com/2/tweets/search/recent?query=${searchQuery}&max_results=100&tweet.fields=created_at,author_id,public_metrics&user.fields=username`;

    const twitterResponse = await fetch(twitterUrl, {
      headers: {
        'Authorization': `Bearer ${twitterBearerToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!twitterResponse.ok) {
      console.error('Twitter API error:', await twitterResponse.text());
      throw new Error(`Twitter API error: ${twitterResponse.status}`);
    }

    const twitterData = await twitterResponse.json();
    console.log(`Found ${twitterData.data?.length || 0} tweets for brand: ${brand}`);

    // Process tweets and store in database
    const tweets = twitterData.data || [];
    const users = twitterData.includes?.users || [];
    
    for (const tweet of tweets) {
      const author = users.find((u: any) => u.id === tweet.author_id);
      
      // Check if tweet already exists
      const { data: existingTweet } = await supabase
        .from('tweets')
        .select('id')
        .eq('tweet_id', tweet.id)
        .maybeSingle();

      if (!existingTweet) {
        // Store tweet
        const { error: tweetError } = await supabase
          .from('tweets')
          .insert({
            brand_id: brandRecord.id,
            tweet_id: tweet.id,
            content: tweet.text,
            author_username: author?.username || 'unknown',
            created_at: tweet.created_at,
            metadata: {
              public_metrics: tweet.public_metrics,
              author_id: tweet.author_id
            }
          });

        if (tweetError) {
          console.error('Error storing tweet:', tweetError);
        }
      }
    }

    // Trigger sentiment analysis for new tweets
    const { error: analysisError } = await supabase.functions.invoke('analyze-sentiment', {
      body: { brandId: brandRecord.id }
    });

    if (analysisError) {
      console.error('Error triggering sentiment analysis:', analysisError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        brandId: brandRecord.id,
        tweetsFound: tweets.length,
        message: `Started monitoring ${brand}` 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in twitter-monitor function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});