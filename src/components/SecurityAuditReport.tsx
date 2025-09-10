import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Download,
  Filter,
  Search,
  RefreshCw,
  Eye,
  ExternalLink,
  Loader2,
  User,
  Key,
  Database
} from 'lucide-react';
import { useProtocol } from '@/hooks/useProtocol';
import { logger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';

interface SecurityAuditReportProps {
  walletId?: string;
  onNavigate?: (component: string) => void;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  eventType: 'wallet_created' | 'guardian_added' | 'guardian_removed' | 'recovery_initiated' | 'recovery_completed' | 'transaction_created' | 'password_changed' | 'security_setting_changed' | 'login' | 'logout' | 'failed_login';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  userId: string;
  walletId: string;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, unknown>;
  signature: string;
  hash: string;
  verified: boolean;
}

interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  highSeverityEvents: number;
  failedLogins: number;
  recoveryAttempts: number;
  lastSecurityEvent: string;
  averageResponseTime: number;
  securityScore: number;
}

interface FilterOptions {
  eventType: string;
  severity: string;
  dateRange: {
    start: string;
    end: string;
  };
  verified: boolean | null;
  searchTerm: string;
}

export default function SecurityAuditReport({ 
  walletId
}: SecurityAuditReportProps) {
  useProtocol();
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy] = useState<'timestamp' | 'severity' | 'eventType'>('timestamp');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics>({
    totalEvents: 0,
    criticalEvents: 0,
    highSeverityEvents: 0,
    failedLogins: 0,
    recoveryAttempts: 0,
    lastSecurityEvent: '',
    averageResponseTime: 0,
    securityScore: 0
  });
  
  const [filters, setFilters] = useState<FilterOptions>({
    eventType: '',
    severity: '',
    dateRange: {
      start: '',
      end: ''
    },
    verified: null,
    searchTerm: ''
  });


  useEffect(() => {
    loadAuditData();
  }, [walletId, currentPage, pageSize, sortBy, sortOrder, filters]);

  const loadAuditData = async () => {
    try {
      setIsLoading(true);
      
      // Load audit logs and metrics from Supabase
      const [logs, metrics] = await Promise.all([
        loadAuditLogsFromSupabase(),
        loadSecurityMetricsFromSupabase()
      ]);
      
      setAuditLogs(logs);
      setSecurityMetrics(metrics);
    } catch (err) {
      logger.error('Failed to load audit data', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  const loadAuditLogsFromSupabase = async (): Promise<AuditLogEntry[]> => {
    // Mock implementation - would integrate with Supabase
    return [
      {
        id: 'audit-1',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        eventType: 'wallet_created',
        severity: 'high',
        description: 'New wallet created with 3 guardians',
        userId: 'user-1',
        walletId: walletId || 'wallet-1',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        metadata: { guardians: 3, threshold: 2 },
        signature: 'signature-1',
        hash: 'hash-1',
        verified: true
      },
      {
        id: 'audit-2',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        eventType: 'guardian_added',
        severity: 'medium',
        description: 'Guardian John Doe added to wallet',
        userId: 'user-1',
        walletId: walletId || 'wallet-1',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        metadata: { guardianName: 'John Doe', guardianEmail: 'john@example.com' },
        signature: 'signature-2',
        hash: 'hash-2',
        verified: true
      },
      {
        id: 'audit-3',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        eventType: 'failed_login',
        severity: 'high',
        description: 'Failed login attempt detected',
        userId: 'user-1',
        walletId: walletId || 'wallet-1',
        ipAddress: '192.168.1.200',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        metadata: { attemptCount: 3, reason: 'invalid_password' },
        signature: 'signature-3',
        hash: 'hash-3',
        verified: true
      },
      {
        id: 'audit-4',
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        eventType: 'recovery_initiated',
        severity: 'critical',
        description: 'Recovery process initiated',
        userId: 'user-1',
        walletId: walletId || 'wallet-1',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        metadata: { reason: 'owner_unavailable', guardiansNotified: 3 },
        signature: 'signature-4',
        hash: 'hash-4',
        verified: true
      }
    ];
  };

  const loadSecurityMetricsFromSupabase = async (): Promise<SecurityMetrics> => {
    // Mock implementation - would integrate with Supabase
    return {
      totalEvents: 156,
      criticalEvents: 2,
      highSeverityEvents: 8,
      failedLogins: 3,
      recoveryAttempts: 1,
      lastSecurityEvent: new Date(Date.now() - 3600000).toISOString(),
      averageResponseTime: 2.5,
      securityScore: 85
    };
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'secondary';
      case 'medium':
        return 'default';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'wallet_created':
        return <Database className="h-4 w-4" />;
      case 'guardian_added':
      case 'guardian_removed':
        return <User className="h-4 w-4" />;
      case 'recovery_initiated':
      case 'recovery_completed':
        return <Shield className="h-4 w-4" />;
      case 'transaction_created':
        return <Key className="h-4 w-4" />;
      case 'password_changed':
      case 'security_setting_changed':
        return <Shield className="h-4 w-4" />;
      case 'login':
      case 'logout':
        return <User className="h-4 w-4" />;
      case 'failed_login':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Export audit logs to CSV/JSON
      const exportData = auditLogs.map(log => ({
        timestamp: log.timestamp,
        eventType: log.eventType,
        severity: log.severity,
        description: log.description,
        ipAddress: log.ipAddress,
        verified: log.verified
      }));
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${walletId || 'unknown'}-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: "Audit logs have been exported successfully",
      });
    } catch (err) {
      logger.error('Failed to export audit logs', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Export Failed",
        description: "Failed to export audit logs",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleVerifyLog = async (logId: string) => {
    try {
      // Verify log signature
      const log = auditLogs.find(l => l.id === logId);
      if (log) {
        // Mock verification
        const isValid = await verifyLogSignature(log);
        
        toast({
          title: isValid ? "Log Verified" : "Verification Failed",
          description: isValid ? "Log signature is valid" : "Log signature verification failed",
          variant: isValid ? "default" : "destructive",
        });
      }
    } catch (err) {
      logger.error('Failed to verify log', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Verification Error",
        description: "Failed to verify log signature",
        variant: "destructive",
      });
    }
  };

  const verifyLogSignature = async (log: AuditLogEntry): Promise<boolean> => {
    // Mock implementation - would verify cryptographic signature
    await new Promise(resolve => setTimeout(resolve, 1000));
    return log.verified;
  };

  const filteredLogs = auditLogs.filter(log => {
    if (filters.eventType && log.eventType !== filters.eventType) return false;
    if (filters.severity && log.severity !== filters.severity) return false;
    if (filters.verified !== null && log.verified !== filters.verified) return false;
    if (filters.searchTerm && !log.description.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false;
    if (filters.dateRange.start && new Date(log.timestamp) < new Date(filters.dateRange.start)) return false;
    if (filters.dateRange.end && new Date(log.timestamp) > new Date(filters.dateRange.end)) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Security Audit Report
          </h2>
          <p className="text-muted-foreground">
            Comprehensive security audit and event logging
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAuditData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{securityMetrics.totalEvents}</p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Events</p>
                <p className="text-2xl font-bold text-red-600">{securityMetrics.criticalEvents}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed Logins</p>
                <p className="text-2xl font-bold text-orange-600">{securityMetrics.failedLogins}</p>
              </div>
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Security Score</p>
                <p className="text-2xl font-bold text-green-600">{securityMetrics.securityScore}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="eventType">Event Type</Label>
              <select
                id="eventType"
                value={filters.eventType}
                onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Events</option>
                <option value="wallet_created">Wallet Created</option>
                <option value="guardian_added">Guardian Added</option>
                <option value="guardian_removed">Guardian Removed</option>
                <option value="recovery_initiated">Recovery Initiated</option>
                <option value="recovery_completed">Recovery Completed</option>
                <option value="transaction_created">Transaction Created</option>
                <option value="password_changed">Password Changed</option>
                <option value="security_setting_changed">Security Setting Changed</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="failed_login">Failed Login</option>
              </select>
            </div>

            <div>
              <Label htmlFor="severity">Severity</Label>
              <select
                id="severity"
                value={filters.severity}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <Label htmlFor="verified">Verification Status</Label>
              <select
                id="verified"
                value={filters.verified === null ? '' : filters.verified.toString()}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  verified: e.target.value === '' ? null : e.target.value === 'true' 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="true">Verified</option>
                <option value="false">Unverified</option>
              </select>
            </div>

            <div>
              <Label htmlFor="searchTerm">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="searchTerm"
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                  placeholder="Search descriptions..."
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>
            {filteredLogs.length} of {auditLogs.length} events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading audit logs...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getEventTypeIcon(log.eventType)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{log.description}</h4>
                          <Badge variant={getSeverityColor(log.severity) as 'default' | 'secondary' | 'destructive' | 'outline'}>
                            {log.severity}
                          </Badge>
                          {log.verified ? (
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Unverified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {formatTimestamp(log.timestamp)}
                        </p>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>IP: {log.ipAddress}</p>
                          <p>Event: {log.eventType.replace(/_/g, ' ')}</p>
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <p>Metadata: {JSON.stringify(log.metadata)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerifyLog(log.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/audit-log/${log.id}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-2">
                <Label htmlFor="pageSize">Show:</Label>
                <select
                  id="pageSize"
                  value={pageSize}
                  onChange={(e) => setPageSize(parseInt(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-muted-foreground">per page</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
