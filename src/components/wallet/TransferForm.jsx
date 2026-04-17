export default function TransferForm({ isLoading, wallets, selectedWalletKey, handleTransfer }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/40">
      <h2 className="mb-4 text-xl font-semibold text-white">
        <i className="fas fa-exchange-alt mr-2 text-cyan-300"></i>Transfer On Devnet
      </h2>
      <form onSubmit={handleTransfer}>
        <div className="mb-4">
          <label htmlFor="sender-wallet" className="mb-1 block text-sm font-medium text-slate-300">
            From
          </label>
          <select
            name="sender-wallet"
            id="sender-wallet"
            defaultValue={selectedWalletKey || ''}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
            required
          >
            {wallets.map((wallet) => (
              <option key={wallet.publicKey} value={wallet.publicKey}>
                Wallet {wallet.id} ({wallet.balance} SOL)
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="recipient-address" className="mb-1 block text-sm font-medium text-slate-300">
            To
          </label>
          <input
            type="text"
            name="recipient-address"
            id="recipient-address"
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
            placeholder="Enter recipient address"
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="transfer-amount" className="mb-1 block text-sm font-medium text-slate-300">
            Amount (SOL)
          </label>
          <input
            type="number"
            name="transfer-amount"
            id="transfer-amount"
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
            placeholder="0.0"
            step="0.001"
            min="0"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center rounded-full bg-cyan-400 px-4 py-3 font-bold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-paper-plane'} mr-2`}></i>
          {isLoading ? 'Sending...' : 'Send Transaction'}
        </button>
      </form>
    </div>
  );
}
