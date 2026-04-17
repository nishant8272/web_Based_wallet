import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from 'bip39';
import React, { useEffect, useState } from 'react';
import { Keypair } from '@solana/web3.js';
import { derivePath } from 'ed25519-hd-key';
import nacl from 'tweetnacl';
import axios from 'axios';

const SOL_ICON_URL =
  'https://panoramacrypto.transfero.com/wp-content/uploads/2021/05/solana-ethereum.jpg';
const ALCHEMY_RPC_URL = 'https://solana-devnet.g.alchemy.com/v2/cHPknoVWJYSFrX6nFfJP1';

const copyToClipboard = async (text, showToast, message) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    showToast(message);
  } catch (err) {
    showToast('Failed to copy.', true);
  }
};

const normalizeSeedPhrase = (value) =>
  value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .join(' ');

const getBalanceInSol = async (publicKey) => {
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

const getWalletFromSeedPhrase = async (mnemonic, accountIndex) => {
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

const Toast = ({ message, show, isError }) => {
  if (!show) return null;
  return (
    <div
      className={`fixed top-20 right-5 z-50 rounded-lg px-6 py-3 text-base text-white shadow-lg transition-transform duration-300 ${show ? 'translate-x-0' : 'translate-x-full'} ${isError ? 'bg-red-500' : 'bg-green-500'}`}
    >
      {message}
    </div>
  );
};

const Navbar = ({ selectedWallet }) => (
  <nav className="sticky top-0 z-20 border-b border-gray-700/50 bg-gray-800/70 backdrop-blur-lg">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <i className="fas fa-wallet text-2xl text-indigo-400"></i>
          <h1 className="text-xl font-bold tracking-tight text-gray-100">Solana Phantom Wallet</h1>
        </div>
        {selectedWallet && (
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-100">
            <img src={SOL_ICON_URL} alt="SOL" className="h-5 w-5" />
            <span>{selectedWallet.balance.toFixed(4)} SOL</span>
          </div>
        )}
      </div>
    </div>
  </nav>
);

const Footer = ({ activeTab, setActiveTab }) => (
  <footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-700/50 bg-gray-800/80 backdrop-blur-lg md:hidden">
    <div className="flex h-16 items-center justify-around">
      <FooterButton
        icon="fa-list-ul"
        label="Wallets"
        isActive={activeTab === 'wallets'}
        onClick={() => setActiveTab('wallets')}
      />
      <FooterButton
        icon="fa-search-dollar"
        label="Balance"
        isActive={activeTab === 'balance'}
        onClick={() => setActiveTab('balance')}
      />
      <FooterButton
        icon="fa-paper-plane"
        label="Send"
        isActive={activeTab === 'send'}
        onClick={() => setActiveTab('send')}
      />
      <FooterButton
        icon="fa-history"
        label="Activity"
        isActive={activeTab === 'activity'}
        onClick={() => setActiveTab('activity')}
      />
    </div>
  </footer>
);

const FooterButton = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex h-full w-full flex-col items-center justify-center transition-colors duration-200 ${isActive ? 'text-indigo-400' : 'text-gray-400 hover:text-indigo-300'}`}
  >
    <i className={`fas ${icon} text-xl`}></i>
    <span className="mt-1 text-xs">{label}</span>
    {isActive && <div className="absolute bottom-0 h-1 w-10 rounded-t-full bg-indigo-400"></div>}
  </button>
);

const WalletList = ({ wallets, selectedWalletKey, onSelectWallet, handleCreateWallet }) => (
  <div className="flex h-full flex-col rounded-xl border border-gray-700/50 bg-gray-800/50">
    <div className="flex items-center justify-between border-b border-gray-700/50 p-4">
      <h2 className="text-lg font-semibold">My Wallets</h2>
      <button
        onClick={handleCreateWallet}
        className="flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-bold text-white transition-transform duration-200 hover:scale-105 hover:bg-indigo-500"
      >
        <i className="fas fa-plus mr-2"></i> New
      </button>
    </div>
    <div className="flex-grow space-y-3 overflow-y-auto p-4">
      {wallets.length === 0 ? (
        <div className="flex h-full items-center justify-center py-10 text-center text-gray-500">
          <p>Create or restore a wallet to get started.</p>
        </div>
      ) : (
        wallets.map((wallet) => (
          <button
            key={wallet.publicKey}
            onClick={() => onSelectWallet(wallet.publicKey)}
            className={`wallet-card w-full rounded-lg p-4 text-left transition-all duration-200 ${selectedWalletKey === wallet.publicKey ? 'border border-indigo-500 bg-indigo-600/30' : 'bg-gray-900/50 hover:bg-gray-700/40'}`}
          >
            <h3 className="text-md font-semibold text-gray-200">Wallet {wallet.id}</h3>
            <p className="truncate text-xs text-gray-400">{wallet.publicKey}</p>
          </button>
        ))
      )}
    </div>
  </div>
);

const BalanceDisplay = ({ wallet, isRefreshing, onRefresh, showToast }) => {
  const [isPkVisible, setPkVisible] = useState(false);
  if (!wallet) return null;

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-indigo-400">Wallet {wallet.id} Balance</h2>
        <button
          type="button"
          onClick={() => onRefresh(wallet.publicKey)}
          disabled={isRefreshing}
          className="inline-flex items-center rounded-lg bg-gray-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <i className={`fas ${isRefreshing ? 'fa-spinner fa-spin' : 'fa-rotate-right'} mr-2`}></i>
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      <div className="mb-6 flex items-center gap-3 text-4xl font-bold">
        <img src={SOL_ICON_URL} alt="SOL" className="h-8 w-8" />
        <span>{wallet.balance.toFixed(4)} SOL</span>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <label className="text-xs text-gray-400">Public Key</label>
          <div className="flex items-center gap-2">
            <p className="truncate font-mono text-gray-300">{wallet.publicKey}</p>
            <button
              onClick={() => copyToClipboard(wallet.publicKey, showToast, 'Public Key copied!')}
              className="text-gray-400 hover:text-white"
            >
              <i className="fas fa-copy"></i>
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400">Secret Key</label>
          <div className="flex items-center gap-2">
            <p className="truncate font-mono text-gray-300">
              {isPkVisible ? wallet.privateKey : '••••••••••••••••••••••••••••••••••••••'}
            </p>
            <button onClick={() => setPkVisible(!isPkVisible)} className="text-gray-400 hover:text-white">
              <i className={`fas ${isPkVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
            <button
              onClick={() => copyToClipboard(wallet.privateKey, showToast, 'Secret Key copied!')}
              className="text-gray-400 hover:text-white"
            >
              <i className="fas fa-copy"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TransferForm = ({ wallets, selectedWalletKey, handleTransfer }) => (
  <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-6 shadow-lg">
    <h2 className="mb-4 text-xl font-semibold">
      <i className="fas fa-exchange-alt mr-2 text-indigo-400"></i>Transfer SOL
    </h2>
    <form onSubmit={handleTransfer}>
      <div className="mb-4">
        <label htmlFor="sender-wallet" className="mb-1 block text-sm font-medium text-gray-300">
          From
        </label>
        <select
          name="sender-wallet"
          id="sender-wallet"
          defaultValue={selectedWalletKey || ''}
          className="form-input w-full rounded-lg border border-gray-600 bg-gray-700 p-2.5 text-white"
          required
        >
          {wallets.map((wallet) => (
            <option key={wallet.publicKey} value={wallet.publicKey}>
              Wallet {wallet.id} ({wallet.balance.toFixed(2)} SOL)
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label htmlFor="recipient-address" className="mb-1 block text-sm font-medium text-gray-300">
          To
        </label>
        <input
          type="text"
          name="recipient-address"
          id="recipient-address"
          className="form-input w-full rounded-lg border border-gray-600 bg-gray-700 p-2 text-white"
          placeholder="Enter recipient's address"
          required
        />
      </div>
      <div className="mb-6">
        <label htmlFor="transfer-amount" className="mb-1 block text-sm font-medium text-gray-300">
          Amount (SOL)
        </label>
        <input
          type="number"
          name="transfer-amount"
          id="transfer-amount"
          className="form-input w-full rounded-lg border border-gray-600 bg-gray-700 p-2 text-white"
          placeholder="0.0"
          step="0.001"
          min="0"
          required
        />
      </div>
      <button
        type="submit"
        className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 font-bold text-white transition-transform duration-200 hover:scale-105 hover:bg-indigo-500"
      >
        <i className="fas fa-paper-plane mr-2"></i> Send
      </button>
    </form>
  </div>
);

const TransactionHistory = ({ transactions, wallets }) => (
  <div className="flex flex-grow flex-col rounded-xl border border-gray-700/50 bg-gray-800/50 p-4">
    <h2 className="mb-4 px-2 text-xl font-semibold">
      <i className="fas fa-history mr-2 text-indigo-400"></i>Recent Activity
    </h2>
    <div className="flex-grow space-y-3 overflow-y-auto pr-2">
      {transactions.length === 0 ? (
        <p className="py-5 text-center text-gray-500">No transactions yet.</p>
      ) : (
        transactions.map((tx) => {
          const senderId = wallets.find((wallet) => wallet.publicKey === tx.from)?.id || 'N/A';
          const recipientId = wallets.find((wallet) => wallet.publicKey === tx.to)?.id || 'External';
          return (
            <div key={tx.timestamp} className="rounded-lg bg-gray-900/50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{tx.amount} SOL</p>
                  <p className="text-xs text-gray-400">
                    From Wallet {senderId} to{' '}
                    {recipientId === 'External' ? 'External' : `Wallet ${recipientId}`}
                  </p>
                </div>
                <i className="fas fa-check-circle text-green-400"></i>
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>
);

const SeedPhraseView = ({
  importSeedPhrase,
  isImporting,
  isLoading,
  onConfirm,
  onCopy,
  onGenerate,
  onImportChange,
  onImportSubmit,
  onSwitchMode,
  seedPhrase,
}) => (
  <div className="flex h-screen items-center justify-center">
    <div className="mx-4 w-full max-w-2xl rounded-xl border border-gray-700/50 bg-gray-800/50 p-8 shadow-2xl">
      {!seedPhrase ? (
        <div className="grid gap-6 md:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              onSwitchMode(false);
              onGenerate();
            }}
            className={`rounded-xl border p-6 text-left transition-all ${!isImporting ? 'border-indigo-500 bg-indigo-600/15' : 'border-gray-700/50 bg-gray-900/40 hover:border-gray-500'}`}
          >
            <i className="fas fa-shield-alt mb-4 text-4xl text-indigo-400"></i>
            <h2 className="mb-2 text-2xl font-bold text-gray-100">Create New Wallet</h2>
            <p className="mb-6 text-gray-400">
              Generate a fresh 12-word recovery phrase and start a brand-new wallet.
            </p>
            <span className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white">
              New Seed Phrase
            </span>
          </button>

          <div
            className={`rounded-xl border p-6 transition-all ${isImporting ? 'border-indigo-500 bg-indigo-600/15' : 'border-gray-700/50 bg-gray-900/40 hover:border-gray-500'}`}
          >
            <button
              type="button"
              onClick={() => onSwitchMode(true)}
              className="mb-4 text-left"
            >
              <i className="fas fa-key mb-4 text-4xl text-indigo-400"></i>
              <h2 className="mb-2 text-2xl font-bold text-gray-100">Import Existing Wallet</h2>
              <p className="text-gray-400">
                Paste your own 12 or 24-word seed phrase to recover previous accounts.
              </p>
            </button>

            {isImporting && (
              <form onSubmit={onImportSubmit} className="space-y-4">
                <textarea
                  value={importSeedPhrase}
                  onChange={(event) => onImportChange(event.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-3 text-sm text-white outline-none transition focus:border-indigo-400"
                  placeholder="Enter your recovery phrase"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? 'Restoring...' : 'Restore Wallet'}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        <>
          <h2 className="mb-3 text-2xl font-bold text-gray-100">Your Secret Phrase</h2>
          <p className="mb-6 text-gray-400">
            Write down these words in order and keep them safe. This is the only time you will
            see them.
          </p>
          <div className="mb-6 grid grid-cols-3 gap-4 rounded-lg bg-gray-900/50 p-4 text-gray-200">
            {seedPhrase.split(' ').map((word, index) => (
              <div key={index} className="flex items-center">
                <span className="mr-2 text-sm text-gray-500">{index + 1}.</span>
                <span>{word}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <button
              onClick={onCopy}
              className="flex w-full items-center justify-center rounded-lg bg-gray-600 px-4 py-3 font-bold text-white transition-colors duration-200 hover:bg-gray-500"
            >
              <i className="fas fa-copy mr-2"></i> Copy Phrase
            </button>
            <button
              onClick={onConfirm}
              className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 font-bold text-white transition-transform duration-200 hover:scale-105 hover:bg-indigo-500"
            >
              I've Saved It, Continue <i className="fas fa-arrow-right ml-2"></i>
            </button>
          </div>
        </>
      )}
    </div>
  </div>
);

export default function App() {
  const [wallets, setWallets] = useState([]);
  const [selectedWalletKey, setSelectedWalletKey] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', isError: false });
  const [activeTab, setActiveTab] = useState('balance');
  const [seedPhrase, setSeedPhrase] = useState(null);
  const [importSeedPhrase, setImportSeedPhrase] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshingWalletKey, setRefreshingWalletKey] = useState(null);
  const [isWalletInitialized, setWalletInitialized] = useState(false);

  const selectedWallet = wallets.find((wallet) => wallet.publicKey === selectedWalletKey) || null;

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast((current) => ({ ...current, show: false })), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const showToast = (message, isError = false) => {
    setToast({ show: true, message, isError });
  };

  const handleGenerateSeedPhrase = () => {
    setIsImporting(false);
    setImportSeedPhrase('');
    setSeedPhrase(generateMnemonic());
  };

  const handleCopySeedPhrase = () => {
    if (seedPhrase) {
      copyToClipboard(seedPhrase, showToast, 'Seed phrase copied!');
    }
  };

  const handleConfirmSeedPhrase = async () => {
    setWalletInitialized(true);
    if (wallets.length === 0 && seedPhrase) {
      setIsLoading(true);
      try {
        const firstWallet = await getWalletFromSeedPhrase(seedPhrase, 0);
        setWallets([firstWallet]);
        setSelectedWalletKey(firstWallet.publicKey);
        setActiveTab('balance');
      } catch (err) {
        showToast('Unable to create the first wallet.', true);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleImportWallet = async (event) => {
    event.preventDefault();
    const normalizedMnemonic = normalizeSeedPhrase(importSeedPhrase);

    if (!validateMnemonic(normalizedMnemonic)) {
      showToast('Enter a valid 12 or 24-word seed phrase.', true);
      return;
    }

    setIsLoading(true);
    try {
      const restoredWallet = await getWalletFromSeedPhrase(normalizedMnemonic, 0);
      setSeedPhrase(normalizedMnemonic);
      setWallets([restoredWallet]);
      setSelectedWalletKey(restoredWallet.publicKey);
      setTransactions([]);
      setWalletInitialized(true);
      setActiveTab('balance');
      showToast('Wallet restored from seed phrase!');
    } catch (err) {
      showToast('Failed to restore wallet from the provided seed phrase.', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWallet = async () => {
    if (!seedPhrase) {
      showToast('Generate or import a seed phrase first.', true);
      return;
    }

    setIsLoading(true);
    try {
      const newWallet = await getWalletFromSeedPhrase(seedPhrase, wallets.length);
      setWallets((currentWallets) => [...currentWallets, newWallet]);
      setSelectedWalletKey((currentKey) => currentKey || newWallet.publicKey);
      showToast(`Wallet ${newWallet.id} created!`);
    } catch (err) {
      showToast('Failed to derive a wallet from this seed phrase.', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshWalletBalance = async (publicKey) => {
    setRefreshingWalletKey(publicKey);
    try {
      const balance = await getBalanceInSol(publicKey);
      setWallets((currentWallets) =>
        currentWallets.map((wallet) =>
          wallet.publicKey === publicKey ? { ...wallet, balance } : wallet
        )
      );
      showToast('Wallet balance updated!');
    } catch (err) {
      showToast('Failed to refresh wallet balance.', true);
    } finally {
      setRefreshingWalletKey(null);
    }
  };

  const handleTransfer = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const senderKey = formData.get('sender-wallet');
    const recipientKey = formData.get('recipient-address').trim();
    const amount = parseFloat(formData.get('transfer-amount'));

    if (!senderKey || !recipientKey || !amount || amount <= 0) {
      showToast('Please fill all fields correctly.', true);
      return;
    }
    if (senderKey === recipientKey) {
      showToast('Cannot send to the same wallet.', true);
      return;
    }

    const senderWallet = wallets.find((wallet) => wallet.publicKey === senderKey);
    if (!senderWallet || senderWallet.balance < amount) {
      showToast('Insufficient balance.', true);
      return;
    }

    setWallets((currentWallets) =>
      currentWallets.map((wallet) => {
        if (wallet.publicKey === senderKey) return { ...wallet, balance: wallet.balance - amount };
        if (wallet.publicKey === recipientKey) {
          return { ...wallet, balance: wallet.balance + amount };
        }
        return wallet;
      })
    );

    setTransactions((prev) => [
      {
        from: senderKey,
        to: recipientKey,
        amount,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);

    showToast('Transfer successful!');
    event.target.reset();
  };

  if (!isWalletInitialized) {
    return (
      <>
        <style>{`body { background-color: #111827; font-family: 'Inter', sans-serif; }`}</style>
        <Toast message={toast.message} show={toast.show} isError={toast.isError} />
        <SeedPhraseView
          importSeedPhrase={importSeedPhrase}
          isImporting={isImporting}
          isLoading={isLoading}
          onConfirm={handleConfirmSeedPhrase}
          onCopy={handleCopySeedPhrase}
          onGenerate={handleGenerateSeedPhrase}
          onImportChange={setImportSeedPhrase}
          onImportSubmit={handleImportWallet}
          onSwitchMode={setIsImporting}
          seedPhrase={seedPhrase}
        />
      </>
    );
  }

  const renderMobileContent = () => {
    if (!selectedWallet && activeTab !== 'wallets') {
      return (
        <div className="pt-10 text-center text-gray-500">
          <p>Please create or select a wallet first.</p>
        </div>
      );
    }
    switch (activeTab) {
      case 'wallets':
        return (
          <WalletList
            wallets={wallets}
            selectedWalletKey={selectedWalletKey}
            onSelectWallet={setSelectedWalletKey}
            handleCreateWallet={handleCreateWallet}
          />
        );
      case 'balance':
        return (
          <BalanceDisplay
            wallet={selectedWallet}
            isRefreshing={refreshingWalletKey === selectedWallet?.publicKey}
            onRefresh={handleRefreshWalletBalance}
            showToast={showToast}
          />
        );
      case 'send':
        return (
          <TransferForm
            wallets={wallets}
            selectedWalletKey={selectedWalletKey}
            handleTransfer={handleTransfer}
          />
        );
      case 'activity':
        return <TransactionHistory transactions={transactions} wallets={wallets} />;
      default:
        return null;
    }
  };

  return (
    <>
      <style>{`body { background-color: #111827; font-family: 'Inter', sans-serif; }`}</style>
      <Toast message={toast.message} show={toast.show} isError={toast.isError} />
      <div className="flex h-screen flex-col text-gray-200">
        <Navbar selectedWallet={selectedWallet} />
        <main className="container mx-auto flex flex-grow flex-col gap-8 overflow-hidden p-4 sm:p-6 lg:flex-row lg:p-8">
          <div className="hidden max-h-full md:block md:w-1/3 lg:w-2/5">
            <WalletList
              wallets={wallets}
              selectedWalletKey={selectedWalletKey}
              onSelectWallet={setSelectedWalletKey}
              handleCreateWallet={handleCreateWallet}
            />
          </div>
          <div className="hidden max-h-full overflow-y-auto md:block md:w-2/3 lg:w-3/5">
            {selectedWallet ? (
              <div className="space-y-8">
                <BalanceDisplay
                  wallet={selectedWallet}
                  isRefreshing={refreshingWalletKey === selectedWallet?.publicKey}
                  onRefresh={handleRefreshWalletBalance}
                  showToast={showToast}
                />
                <TransferForm
                  wallets={wallets}
                  selectedWalletKey={selectedWalletKey}
                  handleTransfer={handleTransfer}
                />
                <TransactionHistory transactions={transactions} wallets={wallets} />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                <p>Create a new wallet to get started.</p>
              </div>
            )}
          </div>

          <div className="min-h-0 flex-grow pb-16 md:hidden">{renderMobileContent()}</div>
        </main>
        <Footer activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </>
  );
}
