import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

interface SentimentData {
  timestamp: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}

interface SentimentChartProps {
  data: SentimentData[];
}

export const SentimentChart = ({ data }: SentimentChartProps) => {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-2">{formatTime(label)}</p>
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

  // Calculate percentages for area chart
  const areaData = data.map(item => ({
    ...item,
    time: formatTime(item.timestamp),
    positivePercent: (item.positive / item.total) * 100,
    negativePercent: (item.negative / item.total) * 100,
    neutralPercent: (item.neutral / item.total) * 100
  }));

  return (
    <div className="space-y-6">
      {/* Real-time Mentions */}
      <Card className="gradient-card border-0">
        <CardHeader>
          <CardTitle>Real-time Sentiment Flow</CardTitle>
          <CardDescription>Live mentions and sentiment analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.map(item => ({ ...item, time: formatTime(item.timestamp) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="positive" 
                  stroke="hsl(var(--positive))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--positive))", strokeWidth: 2, r: 4 }}
                  name="Positive"
                />
                <Line 
                  type="monotone" 
                  dataKey="negative" 
                  stroke="hsl(var(--negative))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--negative))", strokeWidth: 2, r: 4 }}
                  name="Negative"
                />
                <Line 
                  type="monotone" 
                  dataKey="neutral" 
                  stroke="hsl(var(--neutral))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--neutral))", strokeWidth: 2, r: 4 }}
                  name="Neutral"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Sentiment Distribution */}
      <Card className="gradient-card border-0">
        <CardHeader>
          <CardTitle>Sentiment Distribution</CardTitle>
          <CardDescription>Percentage breakdown of sentiment over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  domain={[0, 100]}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <p className="text-sm font-medium mb-2">{label}</p>
                          {payload.map((entry: any, index: number) => (
                            <p key={index} className="text-sm" style={{ color: entry.color }}>
                              {entry.name}: {entry.value.toFixed(1)}%
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="positivePercent"
                  stackId="1"
                  stroke="hsl(var(--positive))"
                  fill="hsl(var(--positive) / 0.6)"
                  name="Positive"
                />
                <Area
                  type="monotone"
                  dataKey="neutralPercent"
                  stackId="1"
                  stroke="hsl(var(--neutral))"
                  fill="hsl(var(--neutral) / 0.6)"
                  name="Neutral"
                />
                <Area
                  type="monotone"
                  dataKey="negativePercent"
                  stackId="1"
                  stroke="hsl(var(--negative))"
                  fill="hsl(var(--negative) / 0.6)"
                  name="Negative"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};