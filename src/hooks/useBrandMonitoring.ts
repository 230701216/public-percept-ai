import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SentimentData {
  timestamp: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}

export interface BrandMetrics {
  name: string;
  overall_score: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  total_mentions: number;
  trend: "up" | "down" | "stable";
  risk_level: "low" | "medium" | "high" | "critical";
}

export interface Alert {
  id: number;
  brand: string;
  type: "critical" | "warning" | "info";
  message: string;
  timestamp: string;
  severity: string;
}

export const useBrandMonitoring = () => {
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [brandMetrics, setBrandMetrics] = useState<BrandMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [brandId, setBrandId] = useState<string | null>(null);

  // Start monitoring a brand
  const startMonitoring = async (brandName: string) => {
    try {
      setIsMonitoring(true);
      setSelectedBrand(brandName);

      // Call Twitter monitoring function
      const { data, error } = await supabase.functions.invoke('twitter-monitor', {
        body: { brand: brandName }
      });

      if (error) throw error;

      setBrandId(data.brandId);
      
      toast({
        title: "Monitoring Started",
        description: `Now monitoring sentiment for ${brandName}`,
      });

      // Start fetching initial data
      await fetchBrandData(data.brandId);

    } catch (error: any) {
      console.error('Error starting monitoring:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start monitoring",
        variant: "destructive"
      });
      setIsMonitoring(false);
    }
  };

  // Fetch brand data from database
  const fetchBrandData = async (currentBrandId: string) => {
    try {
      // Fetch latest sentiment metrics
      const { data: metrics, error: metricsError } = await supabase
        .from('sentiment_metrics')
        .select('*')
        .eq('brand_id', currentBrandId)
        .order('timestamp', { ascending: false })
        .limit(20);

      if (metricsError) throw metricsError;

      if (metrics && metrics.length > 0) {
        // Convert to chart data format
        const chartData = metrics.reverse().map(metric => ({
          timestamp: metric.timestamp,
          positive: metric.positive_count,
          negative: metric.negative_count,
          neutral: metric.neutral_count,
          total: metric.total_count
        }));

        setSentimentData(chartData);

        // Set latest metrics
        const latestMetric = metrics[metrics.length - 1];
        setBrandMetrics({
          name: selectedBrand,
          overall_score: latestMetric.overall_score,
          positive_count: latestMetric.positive_count,
          negative_count: latestMetric.negative_count,
          neutral_count: latestMetric.neutral_count,
          total_mentions: latestMetric.total_count,
          trend: "stable", // Could be calculated from historical data
          risk_level: latestMetric.risk_level as "low" | "medium" | "high" | "critical"
        });
      }

      // Fetch alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('alerts')
        .select('*')
        .eq('brand_id', currentBrandId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (alertsError) throw alertsError;

      if (alertsData) {
        const formattedAlerts = alertsData.map((alert, index) => ({
          id: Date.now() + index,
          brand: selectedBrand,
          type: alert.type === 'critical_sentiment' ? 'critical' as const : 'info' as const,
          message: alert.message,
          timestamp: alert.created_at,
          severity: alert.severity
        }));
        setAlerts(formattedAlerts);
      }

    } catch (error: any) {
      console.error('Error fetching brand data:', error);
    }
  };

  // Stop monitoring
  const stopMonitoring = async () => {
    if (brandId) {
      try {
        // Update brand monitoring status
        await supabase
          .from('brands')
          .update({ is_monitoring: false })
          .eq('id', brandId);
      } catch (error) {
        console.error('Error stopping monitoring:', error);
      }
    }

    setIsMonitoring(false);
    setSelectedBrand("");
    setSentimentData([]);
    setBrandMetrics(null);
    setBrandId(null);
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!brandId) return;

    console.log('Setting up real-time subscriptions for brand:', brandId);

    // Subscribe to sentiment metrics updates
    const metricsChannel = supabase
      .channel('sentiment_metrics_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sentiment_metrics',
          filter: `brand_id=eq.${brandId}`
        },
        (payload) => {
          console.log('New sentiment metrics:', payload);
          if (payload.new) {
            const newData: SentimentData = {
              timestamp: payload.new.timestamp,
              positive: payload.new.positive_count,
              negative: payload.new.negative_count,
              neutral: payload.new.neutral_count,
              total: payload.new.total_count
            };

            setSentimentData(prev => [...prev.slice(-19), newData]);

            setBrandMetrics({
              name: selectedBrand,
              overall_score: payload.new.overall_score,
              positive_count: payload.new.positive_count,
              negative_count: payload.new.negative_count,
              neutral_count: payload.new.neutral_count,
              total_mentions: payload.new.total_count,
              trend: "stable",
              risk_level: payload.new.risk_level as "low" | "medium" | "high" | "critical"
            });
          }
        }
      )
      .subscribe();

    // Subscribe to alerts
    const alertsChannel = supabase
      .channel('alerts_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
          filter: `brand_id=eq.${brandId}`
        },
        (payload) => {
          console.log('New alert:', payload);
          if (payload.new) {
            const newAlert: Alert = {
              id: Date.now(),
              brand: selectedBrand,
              type: payload.new.type === 'critical_sentiment' ? 'critical' as const : 'info' as const,
              message: payload.new.message,
              timestamp: payload.new.created_at,
              severity: payload.new.severity
            };

            setAlerts(prev => [newAlert, ...prev.slice(0, 9)]);

            toast({
              title: "New Alert",
              description: newAlert.message,
              variant: newAlert.severity === 'critical' ? 'destructive' : 'default'
            });
          }
        }
      )
      .subscribe();

    return () => {
      metricsChannel.unsubscribe();
      alertsChannel.unsubscribe();
    };
  }, [brandId, selectedBrand]);

  // Periodic data refresh
  useEffect(() => {
    if (!brandId || !isMonitoring) return;

    const interval = setInterval(() => {
      // Trigger new analysis every 5 minutes
      supabase.functions.invoke('analyze-sentiment', {
        body: { brandId }
      }).catch(error => {
        console.error('Error triggering analysis:', error);
      });
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [brandId, isMonitoring]);

  return {
    selectedBrand,
    isMonitoring,
    sentimentData,
    brandMetrics,
    alerts,
    startMonitoring,
    stopMonitoring
  };
};