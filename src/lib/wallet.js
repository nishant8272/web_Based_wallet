import axios from 'axios';
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from 'bip39';
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { derivePath } from 'ed25519-hd-key';
import nacl from 'tweetnacl';

export const SOL_ICON_URL =
  'https://panoramacrypto.transfero.com/wp-content/uploads/2021/05/solana-ethereum.jpg';
export const ALCHEMY_RPC_URL = 'https://solana-devnet.g.alchemy.com/v2/cHPknoVWJYSFrX6nFfJP1';

const connection = new Connection(ALCHEMY_RPC_URL, 'confirmed');
const TRANSACTION_CONFIRM_TIMEOUT_MS = 30_000;

export const createSeedPhrase = () => generateMnemonic();
export const isValidSeedPhrase = (value) => validateMnemonic(value);

export const normalizeSeedPhrase = (value) =>
  value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .join(' ');

export const getBalanceInSol = async (publicKey) => {
  const response = await axios.post(
    ALCHEMY_RPC_URL,
    {
      id: 1,
      jsonrpc: '2.0',
      method: 'getBalance',
      params: [publicKey],
    },
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  return (response?.data?.result?.value ?? 0) / 1_000_000_000;
};

export const getWalletFromSeedPhrase = async (mnemonic, accountIndex) => {
  const seed = mnemonicToSeedSync(mnemonic);
  const path = `m/44'/501'/${accountIndex}'/0'`;
  const derivedSeed = derivePath(path, seed.toString('hex')).key;
  const secretKey = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
  const publicKey = Keypair.fromSecretKey(secretKey).publicKey.toBase58();

  let balance = 0;
  try {
    balance = await getBalanceInSol(publicKey);
  } catch (err) {
    balance = 0;
  }

  return {
    id: accountIndex + 1,
    publicKey,
    privateKey: Buffer.from(secretKey).toString('hex'),
    balance,
  };
};

export const validatePublicKey = (value) => new PublicKey(value);

export const getWalletActivity = async (publicKey, limit = 15) => {
  const address = new PublicKey(publicKey);
  const signatures = await connection.getSignaturesForAddress(address, { limit });

  if (signatures.length === 0) {
    return [];
  }

  const parsedTransactions = await connection.getParsedTransactions(
    signatures.map((item) => item.signature),
    {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    }
  );

  return parsedTransactions
    .map((transaction, index) => {
      if (!transaction) {
        return null;
      }

      const accountKeys =
        transaction.transaction.message.accountKeys?.map((item) =>
          'pubkey' in item ? item.pubkey.toBase58() : item.toBase58()
        ) ?? [];
      const walletIndex = accountKeys.findIndex((key) => key === publicKey);

      let amount = 0;
      let direction = 'Activity';
      let counterparty = 'Unknown';

      if (walletIndex >= 0 && transaction.meta) {
        const preBalance = transaction.meta.preBalances?.[walletIndex] ?? 0;
        const postBalance = transaction.meta.postBalances?.[walletIndex] ?? 0;
        const deltaLamports = postBalance - preBalance;

        amount = Math.abs(deltaLamports) / LAMPORTS_PER_SOL;
        direction = deltaLamports < 0 ? 'Sent' : deltaLamports > 0 ? 'Received' : 'Activity';

        const otherParty = accountKeys.find((key) => key !== publicKey);
        if (otherParty) {
          counterparty = otherParty;
        }
      }

      return {
        amount,
        counterparty,
        direction,
        error: Boolean(transaction.meta?.err),
        fee: (transaction.meta?.fee ?? 0) / LAMPORTS_PER_SOL,
        signature: signatures[index]?.signature,
        slot: transaction.slot,
        timestamp: signatures[index]?.blockTime
          ? new Date(signatures[index].blockTime * 1000).toISOString()
          : new Date().toISOString(),
      };
    })
    .filter(Boolean);
};

export const sendSolTransaction = async ({ senderPrivateKey, recipientPublicKey, amountInSol }) => {
  const senderKeypair = Keypair.fromSecretKey(
    Uint8Array.from(Buffer.from(senderPrivateKey, 'hex'))
  );
  const recipientKey = new PublicKey(recipientPublicKey);
  const lamports = Math.round(amountInSol * LAMPORTS_PER_SOL);

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  const transaction = new Transaction({
    feePayer: senderKeypair.publicKey,
    recentBlockhash: blockhash,
  }).add(
    SystemProgram.transfer({
      fromPubkey: senderKeypair.publicKey,
      toPubkey: recipientKey,
      lamports,
    })
  );

  const signature = await connection.sendTransaction(transaction, [senderKeypair]);
  const startTime = Date.now();

  while (Date.now() - startTime < TRANSACTION_CONFIRM_TIMEOUT_MS) {
    const statusResponse = await connection.getSignatureStatuses([signature]);
    const status = statusResponse?.value?.[0];

    if (status?.err) {
      throw new Error('Transaction failed on-chain.');
    }

    if (status?.confirmationStatus === 'confirmed' || status?.confirmationStatus === 'finalized') {
      return signature;
    }

    const currentBlockHeight = await connection.getBlockHeight('confirmed');
    if (currentBlockHeight > lastValidBlockHeight) {
      throw new Error('Transaction expired before confirmation.');
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error('Timed out waiting for transaction confirmation.');
};
