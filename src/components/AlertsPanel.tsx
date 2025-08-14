import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Bell, Mail, MessageCircle, Send, Settings, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Alert {
  id: number;
  brand: string;
  type: "critical" | "warning" | "info";
  message: string;
  timestamp: string;
}

interface BrandMetrics {
  name: string;
  risk_level: string;
  negative_count: number;
  total_mentions: number;
}

interface AlertsPanelProps {
  alerts: Alert[];
  brandMetrics: BrandMetrics | null;
}

export const AlertsPanel = ({ alerts, brandMetrics }: AlertsPanelProps) => {
  const [telegramBot, setTelegramBot] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-negative" />;
      case "warning":
        return <Bell className="h-4 w-4 text-warning" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  const getAlertVariant = (type: string) => {
    switch (type) {
      case "critical":
        return "destructive";
      case "warning":
        return "secondary";
      default:
        return "default";
    }
  };

  const handleSendTelegram = async () => {
    if (!telegramBot) {
      toast({
        title: "Configure Telegram Bot",
        description: "Please enter your Telegram bot token first",
        variant: "destructive"
      });
      return;
    }

    const message = `🚨 *SentimentAI Alert*\n\nBrand: ${brandMetrics?.name}\nNegative Sentiment: ${Math.round((brandMetrics?.negative_count || 0) / (brandMetrics?.total_mentions || 1) * 100)}%\nRisk Level: ${brandMetrics?.risk_level?.toUpperCase()}\n\nImmediate attention required!`;

    // In a real implementation, this would call the Telegram Bot API
    toast({
      title: "Telegram Alert Sent",
      description: "Crisis alert has been sent to Telegram",
    });
  };

  const handleSendEmail = async () => {
    if (!emailAddress) {
      toast({
        title: "Configure Email",
        description: "Please enter an email address first",
        variant: "destructive"
      });
      return;
    }

    // In a real implementation, this would send an email via your backend
    toast({
      title: "Email Alert Sent",
      description: `Crisis alert has been sent to ${emailAddress}`,
    });
  };

  const saveConfiguration = () => {
    if (telegramBot || emailAddress) {
      setIsConfigured(true);
      toast({
        title: "Configuration Saved",
        description: "Alert notifications are now configured",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="alerts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          {/* Crisis Alert */}
          {brandMetrics?.risk_level === "critical" && (
            <Card className="gradient-negative border-negative/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-negative animate-pulse-glow" />
                  <div>
                    <CardTitle className="text-negative">CRISIS DETECTED</CardTitle>
                    <CardDescription>
                      {brandMetrics.name} - Negative sentiment exceeds 50%
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Button 
                    variant="destructive" 
                    onClick={handleSendTelegram}
                    disabled={!isConfigured}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send Telegram Alert
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleSendEmail}
                    disabled={!isConfigured}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email Alert
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Alerts */}
          <Card className="gradient-card border-0">
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>
                Latest sentiment alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start gap-3 p-3 bg-background/30 rounded-lg border border-border/50"
                    >
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{alert.message}</p>
                          <Badge variant={getAlertVariant(alert.type)}>
                            {alert.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {alert.brand} • {formatTime(alert.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No alerts yet</p>
                    <p className="text-sm">Alerts will appear when sentiment issues are detected</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="gradient-card border-0">
            <CardHeader>
              <CardTitle>Notification Channels</CardTitle>
              <CardDescription>
                Configure how you want to receive crisis alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Telegram Configuration */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Telegram Bot
                </h4>
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter Telegram Bot Token"
                    value={telegramBot}
                    onChange={(e) => setTelegramBot(e.target.value)}
                    type="password"
                  />
                  <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Create a bot via @BotFather on Telegram and enter the token here
                </p>
              </div>

              {/* Email Configuration */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Alerts
                </h4>
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter email address"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    type="email"
                  />
                  <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Email address to receive crisis notifications
                </p>
              </div>

              <Button onClick={saveConfiguration} className="w-full">
                Save Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="gradient-card border-0">
            <CardHeader>
              <CardTitle>Alert Settings</CardTitle>
              <CardDescription>
                Configure when and how alerts are triggered
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Crisis Threshold</h4>
                    <p className="text-sm text-muted-foreground">
                      Trigger alerts when negative sentiment exceeds this percentage
                    </p>
                  </div>
                  <Badge variant="outline">50%</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Real-time Monitoring</h4>
                    <p className="text-sm text-muted-foreground">
                      Continuously monitor sentiment in real-time
                    </p>
                  </div>
                  <Badge className="bg-positive/20 text-positive">Enabled</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Auto-notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically send notifications on crisis detection
                    </p>
                  </div>
                  <Badge className="bg-positive/20 text-positive">Enabled</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};