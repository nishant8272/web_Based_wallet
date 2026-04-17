import { Navigate } from 'react-router-dom';
import WalletFooter from '../components/WalletFooter';
import BalanceDisplay from '../components/wallet/BalanceDisplay';
import TransactionHistory from '../components/wallet/TransactionHistory';
import TransferForm from '../components/wallet/TransferForm';
import WalletList from '../components/wallet/WalletList';

export default function DashboardPage({
  activeTab,
  activityLoading,
  handleCreateWallet,
  handleRefreshActivity,
  handleRefreshWalletBalance,
  handleTransfer,
  isLoading,
  isWalletInitialized,
  refreshingWalletKey,
  selectedWallet,
  selectedWalletKey,
  setActiveTab,
  setSelectedWalletKey,
  showToast,
  transactions,
  wallets,
}) {
  if (!isWalletInitialized) {
    return <Navigate to="/setup" replace />;
  }

  const statCards = [
    { label: 'Wallets', value: wallets.length },
    {
      label: 'Total Balance',
      value: `${wallets.reduce((total, wallet) => total + wallet.balance, 0)} SOL`,
    },
    { label: 'Transactions', value: transactions.length },
  ];

  const renderMobileContent = () => {
    if (!selectedWallet && activeTab !== 'wallets') {
      return (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-950/50 p-8 text-center text-slate-500">
          Please create or select a wallet first.
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
            isLoading={isLoading}
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
            isLoading={isLoading}
            wallets={wallets}
            selectedWalletKey={selectedWalletKey}
            handleTransfer={handleTransfer}
          />
        );
      case 'activity':
        return (
          <TransactionHistory
            transactions={transactions}
            wallets={wallets}
            isLoading={activityLoading}
            onRefresh={handleRefreshActivity}
            selectedWalletKey={selectedWalletKey}
          />
        );
      default:
        return null;
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-8 grid gap-4 md:grid-cols-3">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-slate-950/30">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="hidden gap-8 md:grid md:grid-cols-[360px_minmax(0,1fr)]">
        <div className="min-h-[620px]">
          <WalletList
            wallets={wallets}
            selectedWalletKey={selectedWalletKey}
            onSelectWallet={setSelectedWalletKey}
            handleCreateWallet={handleCreateWallet}
            isLoading={isLoading}
          />
        </div>

        {selectedWallet ? (
          <div className="space-y-8">
            <BalanceDisplay
              wallet={selectedWallet}
              isRefreshing={refreshingWalletKey === selectedWallet.publicKey}
              onRefresh={handleRefreshWalletBalance}
              showToast={showToast}
            />
            <TransferForm
              isLoading={isLoading}
              wallets={wallets}
              selectedWalletKey={selectedWalletKey}
              handleTransfer={handleTransfer}
            />
            <TransactionHistory
              transactions={transactions}
              wallets={wallets}
              isLoading={activityLoading}
              onRefresh={handleRefreshActivity}
              selectedWalletKey={selectedWalletKey}
            />
          </div>
        ) : (
          <div className="flex min-h-[620px] items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-950/50 text-slate-500">
            Create a wallet to get started.
          </div>
        )}
      </section>

      <section className="pb-20 md:hidden">{renderMobileContent()}</section>
      <WalletFooter activeTab={activeTab} setActiveTab={setActiveTab} />
    </main>
  );
}
