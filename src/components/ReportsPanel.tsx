import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download, FileText, TrendingUp, TrendingDown, Calendar, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
  risk_level: string;
}

interface ReportsPanelProps {
  sentimentData: SentimentData[];
  brandMetrics: BrandMetrics | null;
}

export const ReportsPanel = ({ sentimentData, brandMetrics }: ReportsPanelProps) => {
  // Process data for reports
  const hourlyData = sentimentData.slice(-24).map((item, index) => ({
    hour: `${index}h`,
    positive: item.positive,
    negative: item.negative,
    neutral: item.neutral,
    total: item.total
  }));

  const pieData = brandMetrics ? [
    { name: 'Positive', value: brandMetrics.positive_count, color: 'hsl(var(--positive))' },
    { name: 'Negative', value: brandMetrics.negative_count, color: 'hsl(var(--negative))' },
    { name: 'Neutral', value: brandMetrics.neutral_count, color: 'hsl(var(--neutral))' }
  ] : [];

  const generateReport = (type: string) => {
    // In a real implementation, this would generate and download actual reports
    toast({
      title: "Report Generated",
      description: `${type} report has been generated and downloaded`,
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
          <TabsTrigger value="export">Export Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          {/* Executive Summary */}
          <Card className="gradient-card border-0">
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
              <CardDescription>
                Key insights and recommendations for {brandMetrics?.name || "your brand"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {brandMetrics ? (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 bg-background/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Total Reach</span>
                      </div>
                      <p className="text-2xl font-bold">{brandMetrics.total_mentions}</p>
                      <p className="text-sm text-muted-foreground">mentions analyzed</p>
                    </div>

                    <div className="p-4 bg-background/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-positive" />
                        <span className="text-sm font-medium">Sentiment Score</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {brandMetrics.overall_score > 0 ? '+' : ''}{brandMetrics.overall_score}%
                      </p>
                      <p className="text-sm text-muted-foreground">overall sentiment</p>
                    </div>

                    <div className="p-4 bg-background/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-accent" />
                        <span className="text-sm font-medium">Risk Level</span>
                      </div>
                      <Badge 
                        variant={
                          brandMetrics.risk_level === "critical" ? "destructive" :
                          brandMetrics.risk_level === "high" ? "destructive" :
                          "default"
                        }
                        className="text-lg px-3 py-1"
                      >
                        {brandMetrics.risk_level?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <h4 className="font-medium mb-3">Key Recommendations</h4>
                    <ul className="space-y-2 text-sm">
                      {brandMetrics.risk_level === "critical" && (
                        <>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-negative rounded-full mt-2" />
                            Immediate crisis communication required - address negative sentiment publicly
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-negative rounded-full mt-2" />
                            Review recent campaigns or announcements that may have triggered negative response
                          </li>
                        </>
                      )}
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2" />
                        Monitor competitor mentions to understand market context
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2" />
                        Engage with positive mentions to amplify brand advocacy
                      </li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No data available</p>
                  <p className="text-sm">Start monitoring a brand to generate reports</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sentiment Breakdown */}
          {brandMetrics && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="gradient-card border-0">
                <CardHeader>
                  <CardTitle>Sentiment Distribution</CardTitle>
                  <CardDescription>Overall sentiment breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="gradient-card border-0">
                <CardHeader>
                  <CardTitle>Hourly Trends</CardTitle>
                  <CardDescription>Sentiment patterns over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hourlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="positive" fill="hsl(var(--positive))" name="Positive" />
                        <Bar dataKey="negative" fill="hsl(var(--negative))" name="Negative" />
                        <Bar dataKey="neutral" fill="hsl(var(--neutral))" name="Neutral" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          <Card className="gradient-card border-0">
            <CardHeader>
              <CardTitle>Detailed Analysis</CardTitle>
              <CardDescription>In-depth sentiment analysis and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Sentiment Timeline */}
                <div>
                  <h4 className="font-medium mb-3">Sentiment Timeline</h4>
                  <div className="space-y-2">
                    {sentimentData.slice(-5).map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-background/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                          <Badge variant="outline">{item.total} mentions</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Badge className="bg-positive/20 text-positive">
                            +{item.positive}
                          </Badge>
                          <Badge className="bg-negative/20 text-negative">
                            -{item.negative}
                          </Badge>
                          <Badge className="bg-neutral/20" style={{ color: 'hsl(var(--neutral))' }}>
                            ={item.neutral}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Metrics */}
                {brandMetrics && (
                  <div>
                    <h4 className="font-medium mb-3">Key Performance Indicators</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 bg-background/30 rounded-lg">
                        <h5 className="font-medium mb-2">Engagement Rate</h5>
                        <p className="text-2xl font-bold">
                          {((brandMetrics.positive_count + brandMetrics.negative_count) / brandMetrics.total_mentions * 100).toFixed(1)}%
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Emotional responses vs neutral mentions
                        </p>
                      </div>
                      
                      <div className="p-4 bg-background/30 rounded-lg">
                        <h5 className="font-medium mb-2">Sentiment Velocity</h5>
                        <p className="text-2xl font-bold">
                          {Math.round(brandMetrics.total_mentions / 24)}/hour
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Average mentions per hour
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card className="gradient-card border-0">
            <CardHeader>
              <CardTitle>Export Reports</CardTitle>
              <CardDescription>
                Download detailed reports in various formats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => generateReport("Executive Summary")}
                >
                  <FileText className="h-6 w-6" />
                  <span>Executive Summary (PDF)</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => generateReport("Detailed Analytics")}
                >
                  <BarChart className="h-6 w-6" />
                  <span>Detailed Analytics (Excel)</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => generateReport("Raw Data")}
                >
                  <Download className="h-6 w-6" />
                  <span>Raw Data (CSV)</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => generateReport("Trend Analysis")}
                >
                  <TrendingUp className="h-6 w-6" />
                  <span>Trend Analysis (PDF)</span>
                </Button>
              </div>

              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <h4 className="font-medium mb-2">Report Features</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Real-time data analysis and insights</li>
                  <li>• Historical trend comparisons</li>
                  <li>• Crisis detection and recommendations</li>
                  <li>• Competitive sentiment benchmarking</li>
                  <li>• Customizable date ranges and filters</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};