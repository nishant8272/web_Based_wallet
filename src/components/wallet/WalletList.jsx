export default function WalletList({
  wallets,
  selectedWalletKey,
  onSelectWallet,
  handleCreateWallet,
  isLoading,
}) {
  return (
    <div className="flex h-full flex-col rounded-3xl border border-slate-800 bg-slate-900/70 shadow-2xl shadow-slate-950/40">
      <div className="flex items-center justify-between border-b border-slate-800 p-5">
        <div>
          <h2 className="text-lg font-semibold text-white">My Wallets</h2>
          <p className="text-sm text-slate-400">Derived from your current seed phrase.</p>
        </div>
        <button
          onClick={handleCreateWallet}
          disabled={isLoading}
          className="inline-flex items-center rounded-full bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-plus'} mr-2`}></i>
          {isLoading ? 'Working...' : 'New'}
        </button>
      </div>
      <div className="flex-grow space-y-3 overflow-y-auto p-5">
        {wallets.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/50 p-6 text-center text-slate-500">
            <p>Create or restore a wallet to get started.</p>
          </div>
        ) : (
          wallets.map((wallet) => (
            <button
              key={wallet.publicKey}
              onClick={() => onSelectWallet(wallet.publicKey)}
              className={`w-full rounded-2xl border p-4 text-left transition ${selectedWalletKey === wallet.publicKey ? 'border-cyan-400/70 bg-cyan-400/10' : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900'}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold text-slate-100">Wallet {wallet.id}</h3>
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Devnet</span>
              </div>
              <p className="truncate text-xs text-slate-400">{wallet.publicKey}</p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
