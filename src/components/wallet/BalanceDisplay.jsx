import { useState } from 'react';
import { copyToClipboard } from '../../lib/clipboard';
import { SOL_ICON_URL } from '../../lib/wallet';
import InfoCard from './InfoCard';

export default function BalanceDisplay({ wallet, isRefreshing, onRefresh, showToast }) {
  const [isPkVisible, setPkVisible] = useState(false);
  if (!wallet) return null;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/40">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Selected Wallet</p>
          <h2 className="text-2xl font-semibold text-cyan-300">Wallet {wallet.id} Balance</h2>
        </div>
        <button
          type="button"
          onClick={() => onRefresh(wallet.publicKey)}
          disabled={isRefreshing}
          className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-400/50 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <i className={`fas ${isRefreshing ? 'fa-spinner fa-spin' : 'fa-rotate-right'} mr-2`}></i>
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      <div className="mb-6 flex items-center gap-3 text-4xl font-bold text-white">
        <img src={SOL_ICON_URL} alt="SOL" className="h-9 w-9 rounded-full" />
        <span>{wallet.balance} SOL</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <InfoCard
          label="Public Key"
          value={wallet.publicKey}
          onCopy={() => copyToClipboard(wallet.publicKey, showToast, 'Public Key copied!')}
        />
        <InfoCard
          label="Secret Key"
          value={isPkVisible ? wallet.privateKey : '****************************************'}
          onCopy={() => copyToClipboard(wallet.privateKey, showToast, 'Secret Key copied!')}
          trailingAction={
            <button onClick={() => setPkVisible(!isPkVisible)} className="text-slate-400 hover:text-white">
              <i className={`fas ${isPkVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          }
        />
      </div>
    </div>
  );
}
