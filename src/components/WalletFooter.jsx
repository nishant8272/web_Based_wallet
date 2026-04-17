function FooterButton({ icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex h-full w-full flex-col items-center justify-center transition-colors ${isActive ? 'text-cyan-300' : 'text-slate-500 hover:text-cyan-200'}`}
    >
      <i className={`fas ${icon} text-xl`}></i>
      <span className="mt-1 text-xs">{label}</span>
      {isActive && <div className="absolute bottom-0 h-1 w-10 rounded-t-full bg-cyan-300"></div>}
    </button>
  );
}

export default function WalletFooter({ activeTab, setActiveTab }) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-800/70 bg-slate-950/90 backdrop-blur-xl md:hidden">
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
}
