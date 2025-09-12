import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  RefreshCw,
  Download,
  UserX
} from 'lucide-react';
import { useProtocol } from '@/hooks/useProtocol';
import { formatDate } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';

interface GuardianStatusChartProps {
  walletId?: string;
  showDetails?: boolean;
}

interface GuardianStatus {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  lastSeen: string;
  responseTime: number; // in hours
  reliability: number; // 0-100
  priority: 'high' | 'medium' | 'low';
  verificationMethod: 'email' | 'sms' | 'both';
  sharesHeld: number;
  totalShares: number;
}

interface GuardianStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  suspended: number;
  averageResponseTime: number;
  averageReliability: number;
}

export default function GuardianStatusChart({ 
  walletId, 
  showDetails = true 
}: GuardianStatusChartProps) {
  const { loading, error } = useProtocol();
  const [guardians, setGuardians] = useState<GuardianStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGuardianData();
  }, [walletId]);

  const loadGuardianData = async () => {
    try {
      setIsLoading(true);
      
      // Load guardian data from protocol client
      const data = await loadGuardianStatus();
      setGuardians(data);
    } catch (err) {
      logger.error('Failed to load guardian data', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to load guardian data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadGuardianStatus = async (): Promise<GuardianStatus[]> => {
    try {
      // Load guardian data from Supabase
      const { supabaseClient } = await import('@/integrations/supabase/client');
      const { data: guardians, error } = await supabaseClient
        .getClient()
        .from('guardians')
        .select('*')
        .eq('wallet_id', walletId || '');
      
      if (error) {
        throw new Error(`Failed to load guardians: ${error.message}`);
      }
      
      return guardians.map((guardian: any) => ({
        id: guardian.id,
        name: guardian.full_name,
        email: guardian.email,
        status: guardian.status,
        lastSeen: guardian.last_seen,
        responseTime: guardian.response_time,
        reliability: guardian.reliability,
        priority: guardian.priority,
        verificationMethod: guardian.verification_method,
        sharesHeld: guardian.shares_held,
        totalShares: guardian.total_shares
      }));
    } catch (error) {
      console.error('Failed to load guardian data:', error);
      return [];
    }
  };

  const getGuardianStats = (): GuardianStats => {
    const total = guardians.length;
    const active = guardians.filter(g => g.status === 'active').length;
    const inactive = guardians.filter(g => g.status === 'inactive').length;
    const pending = guardians.filter(g => g.status === 'pending').length;
    const suspended = guardians.filter(g => g.status === 'suspended').length;
    
    const averageResponseTime = guardians.reduce((acc, g) => acc + g.responseTime, 0) / total;
    const averageReliability = guardians.reduce((acc, g) => acc + g.reliability, 0) / total;
    
    return {
      total,
      active,
      inactive,
      pending,
      suspended,
      averageResponseTime,
      averageReliability
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'suspended':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'suspended':
        return <UserX className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const handleExportData = () => {
    const csvData = guardians.map(guardian => ({
      Name: guardian.name,
      Email: guardian.email,
      Status: guardian.status,
      'Last Seen': new Date(guardian.lastSeen).toLocaleDateString(),
      'Response Time (hours)': guardian.responseTime,
      Reliability: guardian.reliability,
      Priority: guardian.priority,
      'Verification Method': guardian.verificationMethod,
      'Shares Held': guardian.sharesHeld
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guardian-status.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "Guardian status data exported successfully",
    });
  };

  const renderStatusChart = () => {
    const stats = getGuardianStats();
    const total = stats.total;
    
    if (total === 0) return null;

    return (
      <div className="space-y-4">
        {/* Status Overview */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-muted-foreground">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.inactive}</div>
            <div className="text-sm text-muted-foreground">Inactive</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.suspended}</div>
            <div className="text-sm text-muted-foreground">Suspended</div>
          </div>
        </div>

        {/* Status Bar Chart */}
        <div className="h-8 w-full bg-gray-200 rounded-lg overflow-hidden">
          <div className="h-full flex">
            <div 
              className="bg-green-500 h-full"
              style={{ width: `${(stats.active / total) * 100}%` }}
            />
            <div 
              className="bg-yellow-500 h-full"
              style={{ width: `${(stats.inactive / total) * 100}%` }}
            />
            <div 
              className="bg-orange-500 h-full"
              style={{ width: `${(stats.pending / total) * 100}%` }}
            />
            <div 
              className="bg-red-500 h-full"
              style={{ width: `${(stats.suspended / total) * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  if (loading || isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Guardian Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading guardian data...</span>
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
            <Users className="h-5 w-5" />
            Guardian Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <span className="text-destructive">Failed to load guardian data: {error.message}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = getGuardianStats();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Guardian Status
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
              onClick={loadGuardianData}
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
            <p className="text-sm text-muted-foreground">Total Guardians</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Response Time</p>
            <p className="text-2xl font-bold">{stats.averageResponseTime.toFixed(1)}h</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Reliability</p>
            <p className="text-2xl font-bold">{stats.averageReliability.toFixed(0)}%</p>
          </div>
        </div>

        {/* Status Chart */}
        {renderStatusChart()}

        {/* Guardian Details */}
        {showDetails && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Guardian Details</h3>
              <Badge variant="outline">
                {stats.active}/{stats.total} Active
              </Badge>
            </div>
            
            <div className="space-y-3">
              {guardians.map((guardian) => (
                <div key={guardian.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(guardian.status)}
                    <div>
                      <p className="font-medium">{guardian.name}</p>
                      <p className="text-sm text-muted-foreground">{guardian.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(guardian.status) as 'default' | 'secondary' | 'destructive' | 'outline'}>
                      {guardian.status}
                    </Badge>
                    <Badge variant={getPriorityColor(guardian.priority) as 'default' | 'secondary' | 'destructive' | 'outline'}>
                      {guardian.priority}
                    </Badge>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {guardian.reliability}% reliable
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last seen: {formatDate(guardian.lastSeen)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
