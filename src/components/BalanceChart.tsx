import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  RefreshCw,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import { useProtocol } from '@/hooks/useProtocol';
import { formatCurrency } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';

interface BalanceChartProps {
  walletId?: string;
  timeRange?: '1D' | '7D' | '30D' | '90D' | '1Y' | 'ALL';
  showBalance?: boolean;
}

interface BalanceDataPoint {
  timestamp: string;
  balance: number;
  change: number;
  changePercent: number;
}

export default function BalanceChart({ 
  walletId, 
  timeRange = '30D', 
  showBalance = true 
}: BalanceChartProps) {
  const { loading, error } = useProtocol();
  const [balanceData, setBalanceData] = useState<BalanceDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [balanceVisible, setBalanceVisible] = useState(showBalance);

  useEffect(() => {
    loadBalanceData();
  }, [selectedTimeRange, walletId]);

  const loadBalanceData = async () => {
    try {
      setIsLoading(true);
      
      // Load balance data from protocol client
      const data = await loadBalanceHistory(selectedTimeRange);
      setBalanceData(data);
    } catch (err) {
      logger.error('Failed to load balance data', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to load balance data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadBalanceHistory = async (range: string): Promise<BalanceDataPoint[]> => {
    // Mock data - would typically load from protocol client
    const now = new Date();
    const data: BalanceDataPoint[] = [];
    
    let days = 1;
    switch (range) {
      case '1D':
        days = 1;
        break;
      case '7D':
        days = 7;
        break;
      case '30D':
        days = 30;
        break;
      case '90D':
        days = 90;
        break;
      case '1Y':
        days = 365;
        break;
      case 'ALL':
        days = 365 * 2;
        break;
    }

    const baseBalance = 0.5; // 0.5 BTC base balance
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const randomChange = (Math.random() - 0.5) * 0.01; // Random change up to 1%
      const balance = baseBalance + (Math.random() - 0.5) * 0.1; // Random balance variation
      const change = randomChange * balance;
      const changePercent = (change / balance) * 100;
      
      data.push({
        timestamp: date.toISOString(),
        balance,
        change,
        changePercent
      });
    }
    
    return data;
  };

  const getCurrentBalance = (): number => {
    return balanceData.length > 0 ? balanceData[balanceData.length - 1].balance : 0;
  };

  const getTotalChange = (): { amount: number; percent: number } => {
    if (balanceData.length < 2) return { amount: 0, percent: 0 };
    
    const first = balanceData[0];
    const last = balanceData[balanceData.length - 1];
    const change = last.balance - first.balance;
    const percent = (change / first.balance) * 100;
    
    return { amount: change, percent };
  };

  const getTimeRangeLabel = (range: string): string => {
    switch (range) {
      case '1D': return 'Last 24 Hours';
      case '7D': return 'Last 7 Days';
      case '30D': return 'Last 30 Days';
      case '90D': return 'Last 90 Days';
      case '1Y': return 'Last Year';
      case 'ALL': return 'All Time';
      default: return 'Last 30 Days';
    }
  };

  const handleExportData = () => {
    const csvRows = balanceData.map(point => ({
      Date: new Date(point.timestamp).toLocaleDateString(),
      Balance: point.balance,
      Change: point.change,
      'Change %': point.changePercent.toFixed(2)
    }));

    const csvData = [
      Object.keys(csvRows[0]).join(','),
      ...csvRows.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balance-history-${selectedTimeRange.toLowerCase()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "Balance data exported successfully",
    });
  };

  const renderSimpleChart = () => {
    if (balanceData.length === 0) return null;

    const maxBalance = Math.max(...balanceData.map(d => d.balance));
    const minBalance = Math.min(...balanceData.map(d => d.balance));
    const range = maxBalance - minBalance;

    return (
      <div className="h-32 w-full relative">
        <svg className="w-full h-full" viewBox="0 0 400 128">
          <defs>
            <linearGradient id="balanceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Area fill */}
          <path
            d={balanceData.map((point, index) => {
              const x = (index / (balanceData.length - 1)) * 400;
              const y = 128 - ((point.balance - minBalance) / range) * 128;
              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ') + ` L 400 128 L 0 128 Z`}
            fill="url(#balanceGradient)"
          />
          
          {/* Line */}
          <path
            d={balanceData.map((point, index) => {
              const x = (index / (balanceData.length - 1)) * 400;
              const y = 128 - ((point.balance - minBalance) / range) * 128;
              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ')}
            stroke="rgb(59, 130, 246)"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </div>
    );
  };

  if (loading || isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Balance History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading balance data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Balance History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <span className="text-destructive">Failed to load balance data: {error.message}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentBalance = getCurrentBalance();
  const totalChange = getTotalChange();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Balance History
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBalanceVisible(!balanceVisible)}
            >
              {balanceVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportData}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadBalanceData}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Current Balance</p>
            <p className="text-2xl font-bold">
              {balanceVisible ? formatCurrency(currentBalance) : '••••••••'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Change ({getTimeRangeLabel(selectedTimeRange)})
            </p>
            <div className="flex items-center gap-1">
              {totalChange.amount >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <p className={`text-lg font-semibold ${
                totalChange.amount >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {balanceVisible ? (
                  <>
                    {totalChange.amount >= 0 ? '+' : ''}{formatCurrency(totalChange.amount)}
                    <span className="text-sm ml-1">
                      ({totalChange.percent >= 0 ? '+' : ''}{totalChange.percent.toFixed(2)}%)
                    </span>
                  </>
                ) : (
                  '••••••••'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {['1D', '7D', '30D', '90D', '1Y', 'ALL'].map((range) => (
            <Button
              key={range}
              variant={selectedTimeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeRange(range as '1D' | '7D' | '30D' | '90D' | '1Y')}
            >
              {range}
            </Button>
          ))}
        </div>

        {/* Chart */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {getTimeRangeLabel(selectedTimeRange)}
          </p>
          {renderSimpleChart()}
        </div>

        {/* Data Points */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Recent Changes</p>
          <div className="space-y-1">
            {balanceData.slice(-5).reverse().map((point, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {new Date(point.timestamp).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {balanceVisible ? formatCurrency(point.balance) : '••••••••'}
                  </span>
                  <span className={`text-xs ${
                    point.change >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {balanceVisible ? (
                      <>
                        {point.change >= 0 ? '+' : ''}{point.changePercent.toFixed(2)}%
                      </>
                    ) : (
                      '•••'
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
