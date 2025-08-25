import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { BitcoinRPC, BitcoinUtils, TransactionBuilder } from '../_shared/bitcoin.ts'

interface CreateTransactionRequest {
  walletId: string;
  toAddress: string;
  amountSatoshis: number;
  feeRate?: number;
  userPassword: string;
}

interface GetWalletBalanceRequest {
  walletId: string;
  userPassword: string;
}

interface GetWalletAddressesRequest {
  walletId: string;
  userPassword: string;
  count?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const bitcoin = new BitcoinRPC({
      host: Deno.env.get('BITCOIN_RPC_HOST') || 'localhost',
      port: parseInt(Deno.env.get('BITCOIN_RPC_PORT') || '8332'),
      username: Deno.env.get('BITCOIN_RPC_USER') || 'bitcoinrpc',
      password: Deno.env.get('BITCOIN_RPC_PASSWORD') || ''
    });

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    switch (path) {
      case 'create-transaction':
        return await handleCreateTransaction(req, supabase, bitcoin, user);
      
      case 'get-balance':
        return await handleGetBalance(req, supabase, user);
      
      case 'get-addresses':
        return await handleGetAddresses(req, supabase, user);
      
      case 'send-transaction':
        return await handleSendTransaction(req, supabase, bitcoin, user);
      
      default:
        throw new Error('Invalid endpoint');
    }

  } catch (error) {
    console.error('Bitcoin service error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});

async function handleCreateTransaction(req: Request, supabase: any, bitcoin: BitcoinRPC, user: any) {
  const { walletId, toAddress, amountSatoshis, feeRate = 10, userPassword }: CreateTransactionRequest = await req.json();

  // Validate input
  if (!walletId || !toAddress || !amountSatoshis || !userPassword) {
    throw new Error('Missing required fields');
  }

  if (amountSatoshis <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  if (!BitcoinUtils.validateBitcoinAddress(toAddress)) {
    throw new Error('Invalid Bitcoin address');
  }

  // Verify wallet ownership
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('id', walletId)
    .eq('owner_id', user.id)
    .single();

  if (walletError || !wallet) {
    throw new Error('Wallet not found or access denied');
  }

  // Get wallet addresses
  const { data: addresses } = await supabase
    .from('wallet_addresses')
    .select('address')
    .eq('wallet_id', walletId);

  if (!addresses || addresses.length === 0) {
    throw new Error('No addresses found for wallet');
  }

  const addressList = addresses.map((addr: any) => addr.address);

  // Get UTXOs for wallet addresses
  const utxos = await bitcoin.getUTXOs(addressList);

  if (utxos.length === 0) {
    throw new Error('No UTXOs found for wallet');
  }

  // Select UTXOs for transaction
  const selectedUtxos = BitcoinUtils.selectUtxos(utxos, amountSatoshis, feeRate);

  if (selectedUtxos.length === 0) {
    throw new Error('Insufficient funds for transaction');
  }

  // Calculate total input amount
  const totalInput = selectedUtxos.reduce((sum, utxo) => sum + utxo.amount * 100000000, 0);
  
  // Calculate fee
  const fee = BitcoinUtils.calculateFee(selectedUtxos.length, 2, feeRate);
  
  // Calculate change amount
  const changeAmount = totalInput - amountSatoshis - fee;

  if (changeAmount < 0) {
    throw new Error('Insufficient funds to cover transaction fee');
  }

  // Build transaction
  const builder = new TransactionBuilder();
  
  // Add inputs
  for (const utxo of selectedUtxos) {
    builder.addInput(utxo.txid, utxo.vout);
  }

  // Add outputs
  builder.addOutput(toAddress, amountSatoshis);
  
  if (changeAmount > 546) { // Dust threshold
    // Generate change address
    const changeAddress = await bitcoin.getNewAddress('change', 'legacy');
    builder.addOutput(changeAddress, changeAmount);
  }

  const transaction = builder.build();

  // Create unsigned transaction
  const unsignedTx = await bitcoin.createRawTransaction(transaction.inputs, transaction.outputs);

  // Store transaction in database
  const { data: txRecord, error: txError } = await supabase
    .from('transactions')
    .insert({
      wallet_id: walletId,
      txid: '', // Will be set after signing
      amount_satoshis: amountSatoshis,
      fee_satoshis: fee,
      transaction_type: 'send',
      status: 'pending',
      raw_transaction: unsignedTx
    })
    .select()
    .single();

  if (txError) {
    throw new Error('Failed to store transaction');
  }

  return new Response(
    JSON.stringify({
      success: true,
      transactionId: txRecord.id,
      unsignedTransaction: unsignedTx,
      fee: fee,
      inputs: selectedUtxos,
      changeAmount: changeAmount > 546 ? changeAmount : 0
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleGetBalance(req: Request, supabase: any, user: any) {
  const { walletId, userPassword }: GetWalletBalanceRequest = await req.json();

  // Validate input
  if (!walletId || !userPassword) {
    throw new Error('Missing required fields');
  }

  // Verify wallet ownership
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('id', walletId)
    .eq('owner_id', user.id)
    .single();

  if (walletError || !wallet) {
    throw new Error('Wallet not found or access denied');
  }

  // Get wallet balance from database
  const balance = await supabase.rpc('get_wallet_balance', { p_wallet_id: walletId });

  return new Response(
    JSON.stringify({
      success: true,
      balanceSatoshis: balance.data || 0,
      balanceBTC: BitcoinUtils.satoshisToBTC(balance.data || 0)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleGetAddresses(req: Request, supabase: any, user: any) {
  const { walletId, userPassword, count = 5 }: GetWalletAddressesRequest = await req.json();

  // Validate input
  if (!walletId || !userPassword) {
    throw new Error('Missing required fields');
  }

  // Verify wallet ownership
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('id', walletId)
    .eq('owner_id', user.id)
    .single();

  if (walletError || !wallet) {
    throw new Error('Wallet not found or access denied');
  }

  // Get existing addresses
  const { data: addresses } = await supabase
    .from('wallet_addresses')
    .select('*')
    .eq('wallet_id', walletId)
    .order('address_index', { ascending: true });

  // Generate new addresses if needed
  const currentCount = addresses?.length || 0;
  const newAddresses = [];

  if (currentCount < count) {
    const bitcoin = new BitcoinRPC({
      host: Deno.env.get('BITCOIN_RPC_HOST') || 'localhost',
      port: parseInt(Deno.env.get('BITCOIN_RPC_PORT') || '8332'),
      username: Deno.env.get('BITCOIN_RPC_USER') || 'bitcoinrpc',
      password: Deno.env.get('BITCOIN_RPC_PASSWORD') || ''
    });

    for (let i = currentCount; i < count; i++) {
      const address = await bitcoin.getNewAddress(`wallet_${walletId}_${i}`, 'legacy');
      
      const { data: newAddress } = await supabase
        .from('wallet_addresses')
        .insert({
          wallet_id: walletId,
          address,
          derivation_path: `m/44'/0'/0'/0/${i}`,
          address_type: 'legacy',
          is_change: false,
          address_index: i
        })
        .select()
        .single();

      if (newAddress) {
        newAddresses.push(newAddress);
      }
    }
  }

  const allAddresses = [...(addresses || []), ...newAddresses];

  return new Response(
    JSON.stringify({
      success: true,
      addresses: allAddresses.slice(0, count)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleSendTransaction(req: Request, supabase: any, bitcoin: BitcoinRPC, user: any) {
  const { transactionId, signedTransaction } = await req.json();

  // Validate input
  if (!transactionId || !signedTransaction) {
    throw new Error('Missing required fields');
  }

  // Get transaction record
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .select('*, wallets!inner(*)')
    .eq('id', transactionId)
    .single();

  if (txError || !transaction) {
    throw new Error('Transaction not found');
  }

  // Verify wallet ownership
  if (transaction.wallets.owner_id !== user.id) {
    throw new Error('Access denied');
  }

  if (transaction.status !== 'pending') {
    throw new Error('Transaction is not in pending status');
  }

  try {
    // Send the signed transaction
    const txid = await bitcoin.sendRawTransaction(signedTransaction);

    // Update transaction record
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        txid,
        status: 'confirmed',
        raw_transaction: signedTransaction
      })
      .eq('id', transactionId);

    if (updateError) {
      console.error('Transaction update error:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        txid,
        message: 'Transaction sent successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Update transaction status to failed
    await supabase
      .from('transactions')
      .update({ status: 'failed' })
      .eq('id', transactionId);

    throw new Error(`Failed to send transaction: ${error.message}`);
  }
}
