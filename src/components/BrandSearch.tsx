import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface BrandSearchProps {
  onBrandSelect: (brand: string) => void;
  selectedBrand: string;
}

const popularBrands = [
  { name: "Apple", sentiment: "positive", mentions: "2.3k" },
  { name: "Tesla", sentiment: "mixed", mentions: "1.8k" },
  { name: "Netflix", sentiment: "negative", mentions: "1.2k" },
  { name: "McDonald's", sentiment: "positive", mentions: "956" },
  { name: "Coca-Cola", sentiment: "positive", mentions: "834" },
  { name: "Nike", sentiment: "mixed", mentions: "723" }
];

export const BrandSearch = ({ onBrandSelect, selectedBrand }: BrandSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Enter a brand name",
        description: "Please enter a brand name to search for",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onBrandSelect(searchTerm.trim());
    setIsSearching(false);
    
    toast({
      title: "Monitoring Started",
      description: `Now monitoring sentiment for ${searchTerm}`,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <TrendingUp className="h-4 w-4 text-positive" />;
      case "negative":
        return <TrendingDown className="h-4 w-4 text-negative" />;
      default:
        return <AlertCircle className="h-4 w-4 text-warning" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-positive/20 text-positive hover:bg-positive/30";
      case "negative":
        return "bg-negative/20 text-negative hover:bg-negative/30";
      default:
        return "bg-warning/20 text-warning hover:bg-warning/30";
    }
  };

  return (
    <Card className="gradient-card border-0">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Search Input */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter brand name (e.g., Apple, Tesla, Netflix...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 bg-background/50 border-border/50 focus:bg-background"
                disabled={isSearching}
              />
            </div>
            <Button 
              onClick={handleSearch}
              disabled={isSearching}
              className="gradient-primary shadow-primary"
            >
              {isSearching ? "Searching..." : "Monitor"}
            </Button>
          </div>

          {/* Popular Brands */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Popular Brands
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {popularBrands.map((brand) => (
                <Button
                  key={brand.name}
                  variant="outline"
                  className="h-auto p-3 flex flex-col items-start gap-2 bg-background/30 hover:bg-background/50 transition-smooth"
                  onClick={() => {
                    setSearchTerm(brand.name);
                    onBrandSelect(brand.name);
                    toast({
                      title: "Monitoring Started",
                      description: `Now monitoring sentiment for ${brand.name}`,
                    });
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{brand.name}</span>
                    {getSentimentIcon(brand.sentiment)}
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <Badge 
                      className={`text-xs ${getSentimentColor(brand.sentiment)}`}
                    >
                      {brand.sentiment}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {brand.mentions}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Current Selection */}
          {selectedBrand && (
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-positive rounded-full animate-pulse-glow" />
                <span className="font-medium">Currently monitoring: {selectedBrand}</span>
                <Badge className="bg-positive/20 text-positive">LIVE</Badge>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};