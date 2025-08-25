// Bitcoin RPC client and utilities for Bitcoin Social Recovery Inheritance Wallet

export interface UTXO {
  txid: string;
  vout: number;
  address: string;
  amount: number;
  confirmations: number;
  spendable: boolean;
}

export interface TransactionInput {
  txid: string;
  vout: number;
  scriptSig?: string;
}

export interface TransactionOutput {
  address: string;
  amount: number;
}

export interface BitcoinTransaction {
  txid: string;
  amount: number;
  fee: number;
  confirmations: number;
  blockheight?: number;
  time: number;
  details: Array<{
    address: string;
    category: 'send' | 'receive' | 'generate' | 'immature' | 'orphan';
    amount: number;
    fee?: number;
  }>;
}

export class BitcoinRPC {
  private host: string;
  private port: number;
  private username: string;
  private password: string;
  private baseUrl: string;

  constructor(config: { host: string; port: number; username: string; password: string }) {
    this.host = config.host;
    this.port = config.port;
    this.username = config.username;
    this.password = config.password;
    this.baseUrl = `http://${this.host}:${this.port}`;
  }

  async call(method: string, params: any[] = []): Promise<any> {
    const auth = btoa(`${this.username}:${this.password}`);
    
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: crypto.randomUUID(),
        method,
        params
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(`Bitcoin RPC Error: ${result.error.message}`);
    }
    
    return result.result;
  }

  // Blockchain information
  async getBlockchainInfo(): Promise<any> {
    return this.call('getblockchaininfo');
  }

  async getNetworkInfo(): Promise<any> {
    return this.call('getnetworkinfo');
  }

  async getWalletInfo(): Promise<any> {
    return this.call('getwalletinfo');
  }

  // Address management
  async getNewAddress(label: string = '', addressType: string = 'legacy'): Promise<string> {
    return this.call('getnewaddress', [label, addressType]);
  }

  async getAddressInfo(address: string): Promise<any> {
    return this.call('getaddressinfo', [address]);
  }

  async validateAddress(address: string): Promise<any> {
    return this.call('validateaddress', [address]);
  }

  // UTXO management
  async listUnspent(minConf: number = 0, maxConf: number = 9999999, addresses: string[] = []): Promise<UTXO[]> {
    return this.call('listunspent', [minConf, maxConf, addresses]);
  }

  async getUTXOs(addresses: string[]): Promise<UTXO[]> {
    return this.listUnspent(0, 9999999, addresses);
  }

  // Transaction management
  async createRawTransaction(inputs: TransactionInput[], outputs: Record<string, number>): Promise<string> {
    return this.call('createrawtransaction', [inputs, outputs]);
  }

  async signRawTransaction(rawTx: string, privateKeys: string[] = []): Promise<any> {
    return this.call('signrawtransactionwithkey', [rawTx, privateKeys]);
  }

  async sendRawTransaction(signedTx: string): Promise<string> {
    return this.call('sendrawtransaction', [signedTx]);
  }

  async getRawTransaction(txid: string, verbose: boolean = true): Promise<any> {
    return this.call('getrawtransaction', [txid, verbose]);
  }

  async getTransaction(txid: string): Promise<BitcoinTransaction> {
    return this.call('gettransaction', [txid]);
  }

  // Balance and address management
  async getAddressBalance(address: string): Promise<number> {
    const utxos = await this.listUnspent(0, 9999999, [address]);
    return utxos.reduce((total, utxo) => total + utxo.amount * 100000000, 0); // Convert to satoshis
  }

  async getWalletBalance(): Promise<number> {
    const balance = await this.call('getbalance');
    return balance * 100000000; // Convert to satoshis
  }

  // Fee estimation
  async estimateSmartFee(confTarget: number = 6): Promise<any> {
    return this.call('estimatesmartfee', [confTarget]);
  }

  async estimateFee(confTarget: number = 6): Promise<number> {
    return this.call('estimatefee', [confTarget]);
  }

  // Block information
  async getBlockCount(): Promise<number> {
    return this.call('getblockcount');
  }

  async getBlockHash(height: number): Promise<string> {
    return this.call('getblockhash', [height]);
  }

  async getBlock(hash: string): Promise<any> {
    return this.call('getblock', [hash]);
  }

  // Mining and mempool
  async getMempoolInfo(): Promise<any> {
    return this.call('getmempoolinfo');
  }

  async getMempoolEntry(txid: string): Promise<any> {
    return this.call('getmempoolentry', [txid]);
  }
}

// Utility functions for Bitcoin operations
export class BitcoinUtils {
  static selectUtxos(utxos: UTXO[], targetAmount: number, feeRate: number): UTXO[] {
    // Implement coin selection algorithm (Branch and Bound)
    let selected: UTXO[] = [];
    let selectedAmount = 0;
    
    // Sort UTXOs by amount (largest first for simplicity)
    const sortedUtxos = [...utxos].sort((a, b) => b.amount - a.amount);
    
    for (const utxo of sortedUtxos) {
      selected.push(utxo);
      selectedAmount += utxo.amount * 100000000; // Convert to satoshis
      
      // Estimate fee for current selection
      const estimatedFee = this.estimateTransactionSize(selected.length, 2) * feeRate;
      
      if (selectedAmount >= targetAmount + estimatedFee) {
        break;
      }
    }
    
    return selected;
  }

  static estimateTransactionSize(inputs: number, outputs: number): number {
    // Estimate transaction size in bytes
    // Base size + inputs + outputs
    return 10 + (inputs * 148) + (outputs * 34);
  }

  static calculateFee(inputs: number, outputs: number, feeRate: number): number {
    const size = this.estimateTransactionSize(inputs, outputs);
    return size * feeRate;
  }

  static validateBitcoinAddress(address: string): boolean {
    // Basic Bitcoin address validation
    // In production, use a proper Bitcoin address validation library
    const patterns = {
      legacy: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
      segwit: /^bc1[a-z0-9]{39,59}$/,
      nativeSegwit: /^bc1[a-z0-9]{39,59}$/
    };

    return Object.values(patterns).some(pattern => pattern.test(address));
  }

  static satoshisToBTC(satoshis: number): number {
    return satoshis / 100000000;
  }

  static btcToSatoshis(btc: number): number {
    return Math.round(btc * 100000000);
  }

  static formatBitcoinAmount(satoshis: number): string {
    const btc = this.satoshisToBTC(satoshis);
    return btc.toFixed(8);
  }
}

// HD Wallet utilities (simplified)
export class HDWallet {
  static derivePath(basePath: string, index: number): string {
    return `${basePath}/${index}`;
  }

  static generateAddress(publicKey: string, network: 'mainnet' | 'testnet' = 'mainnet'): string {
    // Simplified address generation
    // In production, use proper Bitcoin address generation libraries
    const prefix = network === 'mainnet' ? '1' : 'm';
    const hash = this.sha256(publicKey);
    return prefix + this.base58Encode(hash);
  }

  private static sha256(data: string): string {
    // Simplified SHA256 - in production use proper crypto library
    return btoa(data).slice(0, 32);
  }

  private static base58Encode(data: string): string {
    // Simplified Base58 encoding
    // In production use proper Base58 library
    return data.replace(/[+/=]/g, '').slice(0, 25);
  }
}

// Transaction builder
export class TransactionBuilder {
  private inputs: TransactionInput[] = [];
  private outputs: TransactionOutput[] = [];
  private feeRate: number = 10; // satoshis per byte

  addInput(txid: string, vout: number): this {
    this.inputs.push({ txid, vout });
    return this;
  }

  addOutput(address: string, amount: number): this {
    this.outputs.push({ address, amount });
    return this;
  }

  setFeeRate(feeRate: number): this {
    this.feeRate = feeRate;
    return this;
  }

  calculateFee(): number {
    const size = BitcoinUtils.estimateTransactionSize(this.inputs.length, this.outputs.length);
    return size * this.feeRate;
  }

  getInputs(): TransactionInput[] {
    return this.inputs;
  }

  getOutputs(): TransactionOutput[] {
    return this.outputs;
  }

  build(): { inputs: TransactionInput[]; outputs: Record<string, number> } {
    const outputMap: Record<string, number> = {};
    
    for (const output of this.outputs) {
      outputMap[output.address] = BitcoinUtils.satoshisToBTC(output.amount);
    }

    return {
      inputs: this.inputs,
      outputs: outputMap
    };
  }
}
