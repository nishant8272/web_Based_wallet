import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import AppNavbar from './components/AppNavbar';
import Toast from './components/Toast';
import { copyToClipboard } from './lib/clipboard';
import DashboardPage from './pages/DashboardPage';
import LandingPage from './pages/LandingPage';
import NotFoundPage from './pages/NotFoundPage';
import SetupPage from './pages/SetupPage';
import {
  createSeedPhrase,
  getBalanceInSol,
  getWalletActivity,
  getWalletFromSeedPhrase,
  isValidSeedPhrase,
  normalizeSeedPhrase,
  sendSolTransaction,
  validatePublicKey,
} from './lib/wallet';

function WalletRouterApp() {
  const location = useLocation();
  const [wallets, setWallets] = useState([]);
  const [selectedWalletKey, setSelectedWalletKey] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', isError: false });
  const [activeTab, setActiveTab] = useState('balance');
  const [seedPhrase, setSeedPhrase] = useState(null);
  const [importSeedPhrase, setImportSeedPhrase] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [refreshingWalletKey, setRefreshingWalletKey] = useState(null);
  const [isWalletInitialized, setWalletInitialized] = useState(false);

  const selectedWallet = wallets.find((wallet) => wallet.publicKey === selectedWalletKey) || null;

  useEffect(() => {
    document.body.style.backgroundColor = '#020617';
    document.body.style.fontFamily = 'Inter, sans-serif';
  }, []);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast((current) => ({ ...current, show: false })), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  useEffect(() => {
    if (!location.pathname.startsWith('/wallet')) {
      setActiveTab('balance');
    }
  }, [location.pathname]);

  useEffect(() => {
    if (selectedWalletKey && isWalletInitialized) {
      handleRefreshActivity(selectedWalletKey);
    }
  }, [selectedWalletKey, isWalletInitialized]);

  const showToast = (message, isError = false) => {
    setToast({ show: true, message, isError });
  };

  const initializeWalletFromMnemonic = async (mnemonic) => {
    setIsLoading(true);
    try {
      const firstWallet = await getWalletFromSeedPhrase(mnemonic, 0);
      setWallets([firstWallet]);
      setSelectedWalletKey(firstWallet.publicKey);
      setTransactions([]);
      setWalletInitialized(true);
      setActiveTab('balance');
      return true;
    } catch (err) {
      showToast('Unable to initialize wallet from this seed phrase.', true);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSeedPhrase = () => {
    setIsImporting(false);
    setImportSeedPhrase('');
    setSeedPhrase(createSeedPhrase());
  };

  const handleCopySeedPhrase = async () => {
    if (seedPhrase) {
      copyToClipboard(seedPhrase, showToast, 'Seed phrase copied!');
    }
  };

  const handleConfirmSeedPhrase = async () => {
    if (!seedPhrase) {
      showToast('Generate a seed phrase first.', true);
      return false;
    }

    const didInitialize = await initializeWalletFromMnemonic(seedPhrase);
    if (didInitialize) {
      showToast('Wallet created successfully!');
    }
    return didInitialize;
  };

  const handleImportWallet = async (event) => {
    event.preventDefault();
    const normalizedMnemonic = normalizeSeedPhrase(importSeedPhrase);

    if (!isValidSeedPhrase(normalizedMnemonic)) {
      showToast('Enter a valid 12 or 24-word seed phrase.', true);
      return false;
    }

    setSeedPhrase(normalizedMnemonic);
    const didInitialize = await initializeWalletFromMnemonic(normalizedMnemonic);
    if (didInitialize) {
      showToast('Wallet restored from seed phrase!');
    }
    return didInitialize;
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
      setSelectedWalletKey(newWallet.publicKey);
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

  const refreshAllWalletBalances = async () => {
    const refreshedWallets = await Promise.all(
      wallets.map(async (wallet) => ({
        ...wallet,
        balance: await getBalanceInSol(wallet.publicKey),
      }))
    );

    setWallets(refreshedWallets);
  };

  const handleRefreshActivity = async (publicKey) => {
    if (!publicKey) {
      return;
    }

    setActivityLoading(true);
    try {
      const activity = await getWalletActivity(publicKey);
      setTransactions(activity);
    } catch (err) {
      showToast('Failed to load blockchain activity.', true);
    } finally {
      setActivityLoading(false);
    }
  };

  const handleTransfer = async (event) => {
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

    try {
      validatePublicKey(recipientKey);
    } catch (err) {
      showToast('Enter a valid Solana recipient address.', true);
      return;
    }

    setIsLoading(true);
    try {
      await sendSolTransaction({
        senderPrivateKey: senderWallet.privateKey,
        recipientPublicKey: recipientKey,
        amountInSol: amount,
      });

      await refreshAllWalletBalances();
      await handleRefreshActivity(senderKey);

      showToast('Transaction sent on Solana devnet!');
      event.target.reset();
    } catch (err) {
      showToast('Transaction failed on Solana devnet.', true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#020617_0%,_#020617_38%,_#0f172a_100%)] text-slate-200">
      <Toast message={toast.message} show={toast.show} isError={toast.isError} />
      <AppNavbar isWalletInitialized={isWalletInitialized} selectedWallet={selectedWallet} />
      <Routes>
        <Route path="/" element={<LandingPage isWalletInitialized={isWalletInitialized} />} />
        <Route
          path="/setup"
          element={
            <SetupPage
              importSeedPhrase={importSeedPhrase}
              isImporting={isImporting}
              isLoading={isLoading}
              onConfirmSeedPhrase={handleConfirmSeedPhrase}
              onCopySeedPhrase={handleCopySeedPhrase}
              onGenerateSeedPhrase={handleGenerateSeedPhrase}
              onImportChange={setImportSeedPhrase}
              onImportSubmit={handleImportWallet}
              onSwitchMode={setIsImporting}
              seedPhrase={seedPhrase}
            />
          }
        />
        <Route
          path="/wallet"
          element={
            <DashboardPage
              activeTab={activeTab}
              activityLoading={activityLoading}
              handleCreateWallet={handleCreateWallet}
              handleRefreshActivity={handleRefreshActivity}
              handleRefreshWalletBalance={handleRefreshWalletBalance}
              handleTransfer={handleTransfer}
              isLoading={isLoading}
              isWalletInitialized={isWalletInitialized}
              refreshingWalletKey={refreshingWalletKey}
              selectedWallet={selectedWallet}
              selectedWalletKey={selectedWalletKey}
              setActiveTab={setActiveTab}
              setSelectedWalletKey={setSelectedWalletKey}
              showToast={showToast}
              transactions={transactions}
              wallets={wallets}
            />
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <WalletRouterApp />
    </BrowserRouter>
  );
}
