function formatTimestamp(value) {
  return new Date(value).toLocaleString();
}

function shortenAddress(value) {
  if (!value || value.length < 12) return value;
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export default function TransactionHistory({
  transactions,
  wallets,
  isLoading,
  onRefresh,
  selectedWalletKey,
}) {
  return (
    <div className="flex flex-grow flex-col rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/40">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-white">
          <i className="fas fa-history mr-2 text-cyan-300"></i>Recent Activity
        </h2>
        <button
          type="button"
          onClick={() => onRefresh(selectedWalletKey)}
          disabled={isLoading || !selectedWalletKey}
          className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-400/50 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-rotate-right'} mr-2`}></i>
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      <div className="flex-grow space-y-3 overflow-y-auto pr-2">
        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/50 p-6 text-center text-slate-500">
            Loading blockchain activity...
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/50 p-6 text-center text-slate-500">
            No on-chain activity found for this wallet.
          </div>
        ) : (
          transactions.map((tx) => {
            const linkedWallet = wallets.find((wallet) => wallet.publicKey === tx.counterparty);
            const counterpartyLabel = linkedWallet
              ? `Wallet ${linkedWallet.id}`
              : shortenAddress(tx.counterparty);

            return (
              <div key={tx.signature} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">
                      {tx.direction} {tx.amount} SOL
                    </p>
                    <p className="text-xs text-slate-400">Counterparty: {counterpartyLabel || 'Unknown'}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatTimestamp(tx.timestamp)} • Fee {tx.fee} SOL
                    </p>
                    {tx.signature && (
                      <a
                        href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-xs text-cyan-300 hover:text-cyan-200"
                      >
                        View signature
                      </a>
                    )}
                  </div>
                  <i
                    className={`fas ${tx.error ? 'fa-circle-exclamation text-red-400' : 'fa-check-circle text-green-400'} pt-1`}
                  ></i>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
