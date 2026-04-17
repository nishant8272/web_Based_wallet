import { Link } from 'react-router-dom';

function LandingCard({ icon, text, title }) {
  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/40">
      <i className={`fas ${icon} text-2xl text-cyan-300`}></i>
      <h3 className="mt-4 text-2xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-slate-400">{text}</p>
    </div>
  );
}

export default function LandingPage({ isWalletInitialized }) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.22),_transparent_35%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(2,6,23,1))] p-8 shadow-2xl shadow-slate-950/50 sm:p-12">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Solana Devnet Wallet</p>
          <h2 className="mt-6 max-w-2xl text-5xl font-semibold leading-tight text-white">
            Create, recover, and manage Solana wallets with real devnet activity.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Generate a secure seed phrase, restore existing accounts, track live balances, and view blockchain-backed transaction history for every wallet you manage.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              to="/setup"
              className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:scale-[1.01]"
            >
              Open Setup
            </Link>
            <Link
              to={isWalletInitialized ? '/wallet' : '/setup'}
              className="inline-flex items-center justify-center rounded-full border border-slate-700 px-6 py-3 font-bold text-white transition hover:border-cyan-400/60 hover:text-cyan-200"
            >
              {isWalletInitialized ? 'Open Dashboard' : 'Create First Wallet'}
            </Link>
          </div>
        </div>

        <div className="grid gap-5">
          <LandingCard
            icon="fa-wallet"
            title="Multi-wallet control"
            text="Create multiple Solana accounts from one seed phrase and manage them from a single dashboard."
          />
          <LandingCard
            icon="fa-seedling"
            title="Seed phrase recovery"
            text="Import your own recovery phrase to restore previously derived Solana wallets anytime."
          />
          <LandingCard
            icon="fa-bolt"
            title="Live devnet activity"
            text="Refresh balances, send real devnet transactions, and view on-chain activity pulled directly from the Solana blockchain."
          />
        </div>
      </section>
    </main>
  );
}
