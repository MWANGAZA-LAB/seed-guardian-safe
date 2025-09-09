import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Shield, 
  Search, 
  Download, 
  Eye, 
  AlertTriangle, 
  RefreshCw,
  Copy,
  FileText,
  Key,
  Users,
  Wallet
} from 'lucide-react';
import { useProtocol } from '@/hooks/useProtocol';
import { AuditLogEntry } from '@/protocol';
import { formatDate } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';

interface AuditLogsProps {
  walletId?: string;
  onNavigate?: (component: string) => void;
}

interface AuditLogFilter {
  eventType: string;
  severity: string;
  dateRange: string;
  actor: string;
}

export default function AuditLogs({ walletId }: AuditLogsProps) {
  const { loading, error } = useProtocol();
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState<AuditLogFilter>({
    eventType: 'all',
    severity: 'all',
    dateRange: 'all',
    actor: 'all'
  });

  useEffect(() => {
    if (walletId) {
      loadAuditLogs();
    }
  }, [walletId]);

  useEffect(() => {
    filterLogs();
  }, [auditLogs, searchTerm, filters]);

  const loadAuditLogs = async () => {
    try {
      setIsLoading(true);
      
      // Load audit logs from protocol client
      const logs = await loadAuditLogData();
      setAuditLogs(logs);
    } catch (err) {
      logger.error('Failed to load audit logs', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to load audit logs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAuditLogData = async (): Promise<AuditLogEntry[]> => {
    // Mock data - would typically load from protocol client
    return [
      {
        id: 'audit-1',
        eventType: 'wallet_created',
        walletId: walletId || 'wallet-1',
        actorId: 'user-1',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        data: {
          walletName: 'My Inheritance Wallet',
          threshold: 3,
          totalGuardians: 5
        },
        signature: 'signature-1',
        previousHash: 'hash-0',
        merkleRoot: 'merkle-root-1',
        metadata: {
          version: '1.0.0',
          clientType: 'web'
        }
      },
      {
        id: 'audit-2',
        eventType: 'guardian_added',
        walletId: walletId || 'wallet-1',
        actorId: 'user-1',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        data: {
          guardianId: 'guardian-1',
          guardianEmail: 'guardian1@example.com',
          guardianName: 'John Doe'
        },
        signature: 'signature-2',
        previousHash: 'hash-1',
        merkleRoot: 'merkle-root-2',
        metadata: {
          version: '1.0.0',
          clientType: 'web'
        }
      },
      {
        id: 'audit-3',
        eventType: 'recovery_initiated',
        walletId: walletId || 'wallet-1',
        actorId: 'guardian-1',
        timestamp: new Date(Date.now() - 259200000).toISOString(),
        data: {
          recoveryId: 'recovery-1',
          reason: 'owner_unavailable',
          newOwnerEmail: 'newowner@example.com'
        },
        signature: 'signature-3',
        previousHash: 'hash-2',
        merkleRoot: 'merkle-root-3',
        metadata: {
          version: '1.0.0',
          clientType: 'web'
        }
      },
      {
        id: 'audit-4',
        eventType: 'recovery_signed',
        walletId: walletId || 'wallet-1',
        actorId: 'guardian-2',
        timestamp: new Date(Date.now() - 345600000).toISOString(),
        data: {
          recoveryId: 'recovery-1',
          guardianId: 'guardian-2',
          verificationMethod: 'email'
        },
        signature: 'signature-4',
        previousHash: 'hash-3',
        merkleRoot: 'merkle-root-4',
        metadata: {
          version: '1.0.0',
          clientType: 'web'
        }
      },
      {
        id: 'audit-5',
        eventType: 'recovery_completed',
        walletId: walletId || 'wallet-1',
        actorId: 'system',
        timestamp: new Date(Date.now() - 432000000).toISOString(),
        data: {
          recoveryId: 'recovery-1',
          signaturesCollected: 3,
          requiredSignatures: 3
        },
        signature: 'signature-5',
        previousHash: 'hash-4',
        merkleRoot: 'merkle-root-5',
        metadata: {
          version: '1.0.0',
          clientType: 'web'
        }
      }
    ];
  };

  const filterLogs = () => {
    let filtered = auditLogs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.actorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(log.data).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Event type filter
    if (filters.eventType !== 'all') {
      filtered = filtered.filter(log => log.eventType === filters.eventType);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const days = parseInt(filters.dateRange);
      const cutoffDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
      filtered = filtered.filter(log => new Date(log.timestamp) >= cutoffDate);
    }

    // Actor filter
    if (filters.actor !== 'all') {
      filtered = filtered.filter(log => log.actorId === filters.actor);
    }

    setFilteredLogs(filtered);
  };

  const handleViewDetails = (log: AuditLogEntry) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  const handleCopySignature = (signature: string) => {
    navigator.clipboard.writeText(signature);
    toast({
      title: "Copied",
      description: "Signature copied to clipboard",
    });
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast({
      title: "Copied",
      description: "Hash copied to clipboard",
    });
  };

  const handleExportLogs = () => {
    const data = {
      walletId,
      exportDate: new Date().toISOString(),
      logs: filteredLogs
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${walletId || 'unknown'}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "Audit logs exported successfully",
    });
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'wallet_created':
        return <Wallet className="h-4 w-4 text-green-500" />;
      case 'guardian_added':
      case 'guardian_removed':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'recovery_initiated':
      case 'recovery_signed':
      case 'recovery_completed':
        return <Key className="h-4 w-4 text-orange-500" />;
      case 'transaction_created':
        return <Wallet className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'wallet_created':
        return 'default';
      case 'guardian_added':
        return 'secondary';
      case 'guardian_removed':
        return 'destructive';
      case 'recovery_initiated':
        return 'outline';
      case 'recovery_signed':
        return 'secondary';
      case 'recovery_completed':
        return 'default';
      case 'transaction_created':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getEventDescription = (eventType: string, data: Record<string, unknown>) => {
    switch (eventType) {
      case 'wallet_created':
        return `Wallet "${data.walletName}" created with ${data.totalGuardians} guardians (threshold: ${data.threshold})`;
      case 'guardian_added':
        return `Guardian "${data.guardianName}" (${data.guardianEmail}) added`;
      case 'guardian_removed':
        return `Guardian "${data.guardianName}" (${data.guardianEmail}) removed`;
      case 'recovery_initiated':
        return `Recovery initiated by ${data.actorId} - Reason: ${data.reason}`;
      case 'recovery_signed':
        return `Recovery signed by ${data.guardianId} via ${data.verificationMethod}`;
      case 'recovery_completed':
        return `Recovery completed with ${data.signaturesCollected}/${data.requiredSignatures} signatures`;
      case 'transaction_created':
        return `Transaction created: ${data.amount} BTC to ${data.toAddress}`;
      default:
        return `Event: ${eventType}`;
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading audit logs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <span className="ml-2">Failed to load audit logs: {error.message}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Audit Logs
          </h2>
          <p className="text-muted-foreground">
            Verifiable signed event logs for all wallet activities
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAuditLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search audit logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={filters.eventType}
              onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Events</option>
              <option value="wallet_created">Wallet Created</option>
              <option value="guardian_added">Guardian Added</option>
              <option value="guardian_removed">Guardian Removed</option>
              <option value="recovery_initiated">Recovery Initiated</option>
              <option value="recovery_signed">Recovery Signed</option>
              <option value="recovery_completed">Recovery Completed</option>
              <option value="transaction_created">Transaction Created</option>
            </select>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Time</option>
              <option value="1">Last 24 Hours</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs List */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Audit Logs Found</h3>
              <p className="text-muted-foreground">
                {auditLogs.length === 0 ? 'No audit logs available' : 'No logs match your filters'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Signature</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getEventIcon(log.eventType)}
                        <Badge variant={getEventColor(log.eventType) as 'default' | 'secondary' | 'destructive' | 'outline'}>
                          {log.eventType.replace('_', ' ')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md">
                        <p className="text-sm">
                          {getEventDescription(log.eventType, log.data)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {log.actorId}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(log.timestamp)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-xs">
                        {log.signature.substring(0, 8)}...{log.signature.substring(log.signature.length - 8)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopySignature(log.signature)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Audit Log Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Detailed information about this audit log entry
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Event Type</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getEventIcon(selectedLog.eventType)}
                    <Badge variant={getEventColor(selectedLog.eventType) as 'default' | 'secondary' | 'destructive' | 'outline'}>
                      {selectedLog.eventType.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Actor</Label>
                  <div className="text-sm mt-1">
                    {selectedLog.actorId}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Description</Label>
                <div className="bg-muted p-3 rounded mt-1">
                  {getEventDescription(selectedLog.eventType, selectedLog.data)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Timestamp</Label>
                  <div className="text-sm mt-1">
                    {formatDate(selectedLog.timestamp)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Wallet ID</Label>
                  <div className="text-sm mt-1">
                    {selectedLog.walletId}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Event Data</Label>
                <div className="bg-muted p-3 rounded mt-1">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(selectedLog.data, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Signature</Label>
                  <div className="font-mono text-xs bg-muted p-2 rounded mt-1">
                    {selectedLog.signature}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Previous Hash</Label>
                  <div className="font-mono text-xs bg-muted p-2 rounded mt-1">
                    {selectedLog.previousHash}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Merkle Root</Label>
                <div className="font-mono text-xs bg-muted p-2 rounded mt-1">
                  {selectedLog.merkleRoot}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleCopySignature(selectedLog.signature)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Signature
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCopyHash(selectedLog.previousHash)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Hash
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCopyHash(selectedLog.merkleRoot)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Merkle Root
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
