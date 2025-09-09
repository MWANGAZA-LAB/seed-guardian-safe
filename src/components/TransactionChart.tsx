import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  Download,
  BarChart3
} from 'lucide-react';
import { useProtocol } from '@/hooks/useProtocol';
import { formatCurrency, formatDate } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';

interface TransactionChartProps {
  walletId?: string;
  timeRange?: '1D' | '7D' | '30D' | '90D' | '1Y' | 'ALL';
  chartType?: 'volume' | 'count' | 'fees';
}

interface TransactionDataPoint {
  timestamp: string;
  volume: number;
  count: number;
  fees: number;
  incoming: number;
  outgoing: number;
}

export default function TransactionChart({ 
  walletId, 
  timeRange = '30D', 
  chartType = 'volume' 
}: TransactionChartProps) {
  const { loading, error } = useProtocol();
  const [transactionData, setTransactionData] = useState<TransactionDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedChartType, setSelectedChartType] = useState(chartType);

  useEffect(() => {
    loadTransactionData();
  }, [selectedTimeRange, walletId]);

  const loadTransactionData = async () => {
    try {
      setIsLoading(true);
      
      // Load transaction data from protocol client
      const data = await loadTransactionHistory(selectedTimeRange);
      setTransactionData(data);
    } catch (err) {
      logger.error('Failed to load transaction data', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to load transaction data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTransactionHistory = async (range: string): Promise<TransactionDataPoint[]> => {
    // Mock data - would typically load from protocol client
    const now = new Date();
    const data: TransactionDataPoint[] = [];
    
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

    for (let i = days; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const count = Math.floor(Math.random() * 10) + 1; // 1-10 transactions per day
      const incoming = Math.random() * 0.1; // Random incoming amount
      const outgoing = Math.random() * 0.05; // Random outgoing amount
      const volume = incoming + outgoing;
      const fees = outgoing * 0.001; // 0.1% fee
      
      data.push({
        timestamp: date.toISOString(),
        volume,
        count,
        fees,
        incoming,
        outgoing
      });
    }
    
    return data;
  };

  const getTotalStats = () => {
    const total = transactionData.reduce((acc, point) => ({
      volume: acc.volume + point.volume,
      count: acc.count + point.count,
      fees: acc.fees + point.fees,
      incoming: acc.incoming + point.incoming,
      outgoing: acc.outgoing + point.outgoing
    }), { volume: 0, count: 0, fees: 0, incoming: 0, outgoing: 0 });

    return total;
  };

  const getAverageStats = () => {
    if (transactionData.length === 0) return { volume: 0, count: 0, fees: 0 };
    
    const total = getTotalStats();
    return {
      volume: total.volume / transactionData.length,
      count: total.count / transactionData.length,
      fees: total.fees / transactionData.length
    };
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
    const csvRows = transactionData.map(point => ({
      Date: new Date(point.timestamp).toLocaleDateString(),
      Volume: point.volume,
      Count: point.count,
      Fees: point.fees,
      Incoming: point.incoming,
      Outgoing: point.outgoing
    }));

    const csvData = [
      Object.keys(csvRows[0]).join(','),
      ...csvRows.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaction-history-${selectedTimeRange.toLowerCase()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "Transaction data exported successfully",
    });
  };

  const renderBarChart = () => {
    if (transactionData.length === 0) return null;

    const maxValue = Math.max(...transactionData.map(d => {
      switch (selectedChartType) {
        case 'volume': return d.volume;
        case 'count': return d.count;
        case 'fees': return d.fees;
        default: return d.volume;
      }
    }));

    return (
      <div className="h-48 w-full relative">
        <div className="flex items-end justify-between h-full gap-1">
          {transactionData.map((point, index) => {
            let value = 0;
            switch (selectedChartType) {
              case 'volume': value = point.volume; break;
              case 'count': value = point.count; break;
              case 'fees': value = point.fees; break;
            }
            
            const height = (value / maxValue) * 100;
            const isIncoming = point.incoming > point.outgoing;
            
            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center"
                style={{ height: '100%' }}
              >
                <div
                  className={`w-full rounded-t ${
                    isIncoming ? 'bg-green-500' : 'bg-red-500'
                  } opacity-80 hover:opacity-100 transition-opacity`}
                  style={{ height: `${height}%` }}
                  title={`${formatDate(point.timestamp)}: ${value.toFixed(4)}`}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading || isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Transaction Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading transaction data...</span>
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
            <BarChart3 className="h-5 w-5" />
            Transaction Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <span className="text-destructive">Failed to load transaction data: {error.message}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalStats = getTotalStats();
  const averageStats = getAverageStats();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Transaction Analytics
          </CardTitle>
          <div className="flex items-center gap-2">
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
              onClick={loadTransactionData}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Volume</p>
            <p className="text-xl font-bold">{formatCurrency(totalStats.volume)}</p>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(averageStats.volume)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Transactions</p>
            <p className="text-xl font-bold">{totalStats.count}</p>
            <p className="text-xs text-muted-foreground">
              Avg: {averageStats.count.toFixed(1)}/day
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Fees</p>
            <p className="text-xl font-bold">{formatCurrency(totalStats.fees)}</p>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(averageStats.fees)}
            </p>
          </div>
        </div>

        {/* Incoming vs Outgoing */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Incoming</p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(totalStats.incoming)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <div>
              <p className="text-sm text-muted-foreground">Outgoing</p>
              <p className="text-lg font-semibold text-red-600">
                {formatCurrency(totalStats.outgoing)}
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

        {/* Chart Type Selector */}
        <div className="flex gap-2">
          {[
            { key: 'volume', label: 'Volume' },
            { key: 'count', label: 'Count' },
            { key: 'fees', label: 'Fees' }
          ].map((type) => (
            <Button
              key={type.key}
              variant={selectedChartType === type.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedChartType(type.key as 'volume' | 'fees' | 'count')}
            >
              {type.label}
            </Button>
          ))}
        </div>

        {/* Chart */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {selectedChartType.charAt(0).toUpperCase() + selectedChartType.slice(1)} - {getTimeRangeLabel(selectedTimeRange)}
          </p>
          {renderBarChart()}
        </div>

        {/* Recent Activity */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Recent Activity</p>
          <div className="space-y-1">
            {transactionData.slice(-5).reverse().map((point, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {new Date(point.timestamp).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-4">
                  <span className="font-medium">
                    {point.count} transactions
                  </span>
                  <span className="text-green-600">
                    +{formatCurrency(point.incoming)}
                  </span>
                  <span className="text-red-600">
                    -{formatCurrency(point.outgoing)}
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
