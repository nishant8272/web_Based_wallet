import { Link, NavLink } from 'react-router-dom';
import { SOL_ICON_URL } from '../lib/wallet';

function NavItem({ label, to }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-full px-4 py-2 text-sm font-medium transition ${
          isActive
            ? 'bg-cyan-400 text-slate-950'
            : 'text-slate-300 hover:bg-slate-900 hover:text-white'
        }`
      }
    >
      {label}
    </NavLink>
  );
}

export default function AppNavbar({ isWalletInitialized, selectedWallet }) {
  return (
    <nav className="sticky top-0 z-20 border-b border-slate-800/70 bg-slate-950/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300">
            <i className="fas fa-wallet text-xl"></i>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Devnet Wallet</p>
            <h1 className="text-lg font-semibold text-white">Solana Router Wallet</h1>
          </div>
        </Link>
        <div className="hidden items-center gap-3 md:flex">
          <NavItem to="/" label="Home" />
          <NavItem to="/setup" label="Setup" />
          <NavItem to="/wallet" label="Dashboard" />
        </div>
        {isWalletInitialized && selectedWallet && (
          <div className="hidden items-center gap-2 rounded-full border border-cyan-400/20 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-100 lg:flex">
            <img src={SOL_ICON_URL} alt="SOL" className="h-4 w-4 rounded-full" />
            <span>{selectedWallet.balance} SOL</span>
          </div>
        )}
      </div>
    </nav>
  );
}
