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
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Search,
  Download,
  Eye,
  Copy,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useProtocol } from '@/hooks/useProtocol';
import { formatCurrency, formatDate } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';

interface TransactionHistoryProps {
  walletId?: string;
  onNavigate?: (component: string) => void;
}

interface Transaction {
  id: string;
  hash: string;
  type: 'send' | 'receive';
  amount: number;
  fee: number;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  timestamp: string;
  fromAddress: string;
  toAddress: string;
  description?: string;
  blockHeight?: number;
  signedBy: string[];
  auditLogId: string;
}

export default function TransactionHistory({ walletId, onNavigate }: TransactionHistoryProps) {
  const { protocolClient, loading, error } = useProtocol();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (protocolClient && walletId) {
      loadTransactions();
    }
  }, [protocolClient, walletId]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, statusFilter, typeFilter]);

  const loadTransactions = async () => {
    if (!protocolClient || !walletId) return;

    try {
      setIsLoading(true);
      
      // Load transactions from protocol client
      // This would typically integrate with Bitcoin RPC or blockchain API
      const mockTransactions: Transaction[] = [
        {
          id: 'tx-1',
          hash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
          type: 'receive',
          amount: 0.00123456,
          fee: 0.00001,
          status: 'confirmed',
          confirmations: 6,
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          fromAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          toAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          description: 'Test transaction',
          blockHeight: 800000,
          signedBy: ['guardian-1', 'guardian-2'],
          auditLogId: 'audit-1'
        },
        {
          id: 'tx-2',
          hash: 'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567',
          type: 'send',
          amount: 0.0005,
          fee: 0.00002,
          status: 'pending',
          confirmations: 0,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          fromAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          toAddress: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
          description: 'Payment to merchant',
          signedBy: ['guardian-1'],
          auditLogId: 'audit-2'
        }
      ];

      setTransactions(mockTransactions);
    } catch (err) {
      logger.error('Failed to load transactions', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to load transaction history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.fromAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.toAddress.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(tx => tx.type === typeFilter);
    }

    setFilteredTransactions(filtered);
  };

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetails(true);
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast({
      title: "Copied",
      description: "Transaction hash copied to clipboard",
    });
  };

  const handleViewOnExplorer = (hash: string) => {
    // Open in blockchain explorer
    const explorerUrl = `https://blockstream.info/tx/${hash}`;
    window.open(explorerUrl, '_blank');
  };

  const handleExportTransactions = () => {
    const data = {
      walletId,
      exportDate: new Date().toISOString(),
      transactions: filteredTransactions
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${walletId}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "Transaction history exported successfully",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'send' ? 
      <ArrowUpRight className="h-4 w-4 text-red-500" /> : 
      <ArrowDownLeft className="h-4 w-4 text-green-500" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading transaction history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <span className="ml-2">Failed to load transactions: {error.message}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Transaction History</h2>
          <p className="text-muted-foreground">
            View and verify all signed transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadTransactions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportTransactions}>
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
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Types</option>
              <option value="send">Sent</option>
              <option value="receive">Received</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions ({filteredTransactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                {transactions.length === 0 ? 'No transactions found' : 'No transactions match your filters'}
              </div>
              {transactions.length === 0 && (
                <Button onClick={() => onNavigate?.('TransactionModal')}>
                  Create First Transaction
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Confirmations</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Hash</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(tx.type)}
                        <span className="capitalize">{tx.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono">
                        {tx.type === 'send' ? '-' : '+'}{formatCurrency(tx.amount)} BTC
                      </div>
                      {tx.fee > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Fee: {formatCurrency(tx.fee)} BTC
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(tx.status)}
                        <Badge variant={getStatusColor(tx.status) as 'default' | 'secondary' | 'destructive' | 'outline'}>
                          {tx.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{tx.confirmations}</span>
                        {tx.status === 'confirmed' && tx.confirmations >= 6 && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(tx.timestamp)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-xs">
                        {tx.hash.substring(0, 8)}...{tx.hash.substring(tx.hash.length - 8)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(tx)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyHash(tx.hash)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewOnExplorer(tx.hash)}
                        >
                          <ExternalLink className="h-4 w-4" />
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

      {/* Transaction Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Detailed information about this transaction
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Transaction Hash</Label>
                  <div className="font-mono text-sm bg-muted p-2 rounded">
                    {selectedTransaction.hash}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedTransaction.status)}
                    <Badge variant={getStatusColor(selectedTransaction.status) as 'default' | 'secondary' | 'destructive' | 'outline'}>
                      {selectedTransaction.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <div className="text-lg font-mono">
                    {selectedTransaction.type === 'send' ? '-' : '+'}
                    {formatCurrency(selectedTransaction.amount)} BTC
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Fee</Label>
                  <div className="font-mono">
                    {formatCurrency(selectedTransaction.fee)} BTC
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">From Address</Label>
                  <div className="font-mono text-sm bg-muted p-2 rounded">
                    {selectedTransaction.fromAddress}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">To Address</Label>
                  <div className="font-mono text-sm bg-muted p-2 rounded">
                    {selectedTransaction.toAddress}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Confirmations</Label>
                  <div className="text-lg">
                    {selectedTransaction.confirmations}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Block Height</Label>
                  <div className="font-mono">
                    {selectedTransaction.blockHeight || 'Pending'}
                  </div>
                </div>
              </div>

              {selectedTransaction.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <div className="bg-muted p-2 rounded">
                    {selectedTransaction.description}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Signed By Guardians</Label>
                <div className="space-y-1">
                  {selectedTransaction.signedBy.map((guardianId) => (
                    <div key={guardianId} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{guardianId}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleCopyHash(selectedTransaction.hash)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Hash
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleViewOnExplorer(selectedTransaction.hash)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Explorer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
