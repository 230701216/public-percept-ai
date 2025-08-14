import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, TrendingUp, TrendingDown, AlertTriangle, Users, MessageSquare, BarChart3, Bell } from "lucide-react";
import { BrandSearch } from "./BrandSearch";
import { SentimentChart } from "./SentimentChart";
import { AlertsPanel } from "./AlertsPanel";
import { ReportsPanel } from "./ReportsPanel";

interface SentimentData {
  timestamp: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}

interface BrandMetrics {
  name: string;
  overall_score: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  total_mentions: number;
  trend: "up" | "down" | "stable";
  risk_level: "low" | "medium" | "high" | "critical";
}

export const Dashboard = () => {
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [brandMetrics, setBrandMetrics] = useState<BrandMetrics | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  // Mock data for demo purposes
  useEffect(() => {
    if (selectedBrand && isMonitoring) {
      // Simulate real-time data updates
      const interval = setInterval(() => {
        const newData: SentimentData = {
          timestamp: new Date().toISOString(),
          positive: Math.floor(Math.random() * 50) + 20,
          negative: Math.floor(Math.random() * 30) + 10,
          neutral: Math.floor(Math.random() * 40) + 20,
          total: 0
        };
        newData.total = newData.positive + newData.negative + newData.neutral;
        
        setSentimentData(prev => [...prev.slice(-20), newData]);
        
        // Update brand metrics
        const negativePercentage = (newData.negative / newData.total) * 100;
        setBrandMetrics({
          name: selectedBrand,
          overall_score: Math.round(((newData.positive - newData.negative) / newData.total) * 100),
          positive_count: newData.positive,
          negative_count: newData.negative,
          neutral_count: newData.neutral,
          total_mentions: newData.total,
          trend: Math.random() > 0.5 ? "up" : "down",
          risk_level: negativePercentage > 50 ? "critical" : negativePercentage > 35 ? "high" : negativePercentage > 20 ? "medium" : "low"
        });

        // Generate alerts for critical sentiment
        if (negativePercentage > 50) {
          setAlerts(prev => [{
            id: Date.now(),
            brand: selectedBrand,
            type: "critical",
            message: `High negative sentiment detected: ${negativePercentage.toFixed(1)}%`,
            timestamp: new Date().toISOString()
          }, ...prev.slice(0, 9)]);
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [selectedBrand, isMonitoring]);

  const handleBrandSelect = (brand: string) => {
    setSelectedBrand(brand);
    setIsMonitoring(true);
    setSentimentData([]);
    setBrandMetrics(null);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    setSentimentData([]);
    setBrandMetrics(null);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-4xl font-bold text-transparent">
              SentimentAI Monitor
            </h1>
            <p className="text-muted-foreground">
              Real-time brand sentiment analysis and crisis detection
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={isMonitoring ? "default" : "secondary"} className="px-4 py-2">
              {isMonitoring ? "LIVE MONITORING" : "OFFLINE"}
            </Badge>
            {isMonitoring && (
              <Button variant="outline" onClick={stopMonitoring}>
                Stop Monitoring
              </Button>
            )}
          </div>
        </header>

        {/* Brand Search */}
        <BrandSearch onBrandSelect={handleBrandSelect} selectedBrand={selectedBrand} />

        {/* Main Dashboard */}
        {selectedBrand && (
          <Tabs defaultValue="analytics" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Alerts
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analytics" className="space-y-6">
              {/* Key Metrics */}
              {brandMetrics && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="gradient-card border-0">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Overall Score</p>
                          <p className="text-2xl font-bold">
                            {brandMetrics.overall_score > 0 ? '+' : ''}{brandMetrics.overall_score}%
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-positive" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="gradient-card border-0">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Mentions</p>
                          <p className="text-2xl font-bold">{brandMetrics.total_mentions}</p>
                        </div>
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="gradient-card border-0">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Positive</p>
                          <p className="text-2xl font-bold text-positive">{brandMetrics.positive_count}</p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-positive/20 text-positive hover:bg-positive/30">
                            {Math.round((brandMetrics.positive_count / brandMetrics.total_mentions) * 100)}%
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="gradient-card border-0">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Negative</p>
                          <p className="text-2xl font-bold text-negative">{brandMetrics.negative_count}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={brandMetrics.risk_level === "critical" ? "destructive" : "secondary"}>
                            {Math.round((brandMetrics.negative_count / brandMetrics.total_mentions) * 100)}%
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Charts */}
              <div className="grid gap-6 lg:grid-cols-2">
                <SentimentChart data={sentimentData} />
                
                <Card className="gradient-card border-0">
                  <CardHeader>
                    <CardTitle>Risk Assessment</CardTitle>
                    <CardDescription>Current brand reputation status</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {brandMetrics && (
                      <>
                        <div className="flex items-center justify-between">
                          <span>Risk Level</span>
                          <Badge 
                            variant={
                              brandMetrics.risk_level === "critical" ? "destructive" :
                              brandMetrics.risk_level === "high" ? "destructive" :
                              brandMetrics.risk_level === "medium" ? "secondary" : "default"
                            }
                            className="uppercase"
                          >
                            {brandMetrics.risk_level}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Sentiment Health</span>
                            <span>{100 - Math.round((brandMetrics.negative_count / brandMetrics.total_mentions) * 100)}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-positive to-positive-glow transition-all duration-500"
                              style={{ 
                                width: `${100 - Math.round((brandMetrics.negative_count / brandMetrics.total_mentions) * 100)}%` 
                              }}
                            />
                          </div>
                        </div>

                        {brandMetrics.risk_level === "critical" && (
                          <div className="p-4 bg-negative/10 border border-negative/20 rounded-lg">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="h-5 w-5 text-negative mt-0.5" />
                              <div>
                                <p className="font-medium text-negative">Crisis Alert</p>
                                <p className="text-sm text-muted-foreground">
                                  Negative sentiment exceeds 50%. Immediate action recommended.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="alerts">
              <AlertsPanel alerts={alerts} brandMetrics={brandMetrics} />
            </TabsContent>

            <TabsContent value="reports">
              <ReportsPanel sentimentData={sentimentData} brandMetrics={brandMetrics} />
            </TabsContent>
          </Tabs>
        )}

        {/* Welcome State */}
        {!selectedBrand && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 mx-auto gradient-hero rounded-full flex items-center justify-center animate-pulse-glow">
                <Search className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-2xl font-semibold">Start Monitoring</h2>
              <p className="text-muted-foreground max-w-md">
                Search for a brand to begin real-time sentiment analysis and monitoring
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};