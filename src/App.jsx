import { generateMnemonic,mnemonicToSeedSync } from 'bip39';
import React, { useState, useEffect } from 'react';
import { Keypair } from '@solana/web3.js';
import { derivePath } from "ed25519-hd-key";
import nacl from "tweetnacl";

// You can include Font Awesome via a link in your main HTML file
// <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
// And Google Fonts:
// <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

const SOL_ICON_URL = `https://panoramacrypto.transfero.com/wp-content/uploads/2021/05/solana-ethereum.jpg`
// A mock word list for seed phrase generation. In a real app, use a library like bip39.
const MOCK_WORD_LIST = [
  'apple', 'banana', 'orange', 'grape', 'lemon', 'lime', 'kiwi', 'mango',
  'peach', 'pear', 'plum', 'cherry', 'crypto', 'solana', 'wallet', 'secure',
  'digital', 'asset', 'token', 'future', 'decentral', 'phantom', 'magic', 'eden'
];
let i = 0;


// --- HELPER & UTILITY FUNCTIONS ---
const generateKey = (length) => {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
};

const copyToClipboard = (text, showToast, message) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        showToast(message);
    } catch (err) {
        showToast("Failed to copy.", true);
    }
    document.body.removeChild(textArea);
};

// --- UI COMPONENTS ---
const Toast = ({ message, show, isError }) => {
    if (!show) return null;
    return (
        <div className={`fixed top-20 right-5 text-white px-6 py-3 rounded-lg shadow-lg z-50 text-base transition-transform duration-300 ${show ? 'translate-x-0' : 'translate-x-full'} ${isError ? 'bg-red-500' : 'bg-green-500'}`}>
            {message}
        </div>
    );
};

const Navbar = ({ selectedWallet }) => (
    <nav className="bg-gray-800/70 backdrop-blur-lg border-b border-gray-700/50 sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-3">
                    <i className="fas fa-wallet text-indigo-400 text-2xl"></i>
                    <h1 className="text-xl font-bold tracking-tight text-gray-100">Solana Phantom Wallet</h1>
                </div>
                {selectedWallet && (
                    <div className="flex items-center gap-2 text-lg font-semibold text-gray-100">
                        <img src={SOL_ICON_URL} alt="SOL" className="w-5 h-5" />
                        <span>{selectedWallet.balance.toFixed(4)} SOL</span>
                    </div>
                )}
            </div>
        </div>
    </nav>
);

const Footer = ({ activeTab, setActiveTab }) => (
    <footer className="md:hidden bg-gray-800/80 backdrop-blur-lg border-t border-gray-700/50 fixed bottom-0 left-0 right-0 z-20">
        <div className="flex justify-around items-center h-16">
            <FooterButton icon="fa-list-ul" label="Wallets" isActive={activeTab === 'wallets'} onClick={() => setActiveTab('wallets')} />
            <FooterButton icon="fa-search-dollar" label="Balance" isActive={activeTab === 'balance'} onClick={() => setActiveTab('balance')} />
            <FooterButton icon="fa-paper-plane" label="Send" isActive={activeTab === 'send'} onClick={() => setActiveTab('send')} />
            <FooterButton icon="fa-history" label="Activity" isActive={activeTab === 'activity'} onClick={() => setActiveTab('activity')} />
        </div>
    </footer>
);

const FooterButton = ({ icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${isActive ? 'text-indigo-400' : 'text-gray-400 hover:text-indigo-300'}`}>
        <i className={`fas ${icon} text-xl`}></i>
        <span className="text-xs mt-1">{label}</span>
        {isActive && <div className="absolute bottom-0 h-1 w-10 bg-indigo-400 rounded-t-full"></div>}
    </button>
);

const WalletList = ({ wallets, selectedWalletKey, onSelectWallet, handleCreateWallet }) => (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 h-full flex flex-col">
        <div className="p-4 border-b border-gray-700/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold">My Wallets</h2>
            <button onClick={handleCreateWallet} className="bg-indigo-600 text-white font-bold text-sm py-2 px-3 rounded-lg flex items-center transition-transform duration-200 hover:scale-105 hover:bg-indigo-500">
                <i className="fas fa-plus mr-2"></i> New
            </button>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto flex-grow">
            {wallets.length === 0 ? (
                <div className="text-gray-500 text-center py-10 h-full flex items-center justify-center">
                    <p>Click "New" to create a wallet.</p>
                </div>
            ) : (
                wallets.map(wallet => (
                    <button key={wallet.publicKey} onClick={() => onSelectWallet(wallet.publicKey)} className={`w-full text-left wallet-card p-4 rounded-lg transition-all duration-200 ${selectedWalletKey === wallet.publicKey ? 'bg-indigo-600/30 border border-indigo-500' : 'bg-gray-900/50 hover:bg-gray-700/40'}`}>
                         <h3 className="text-md font-semibold text-gray-200">Wallet {wallet.id}</h3>
                         <p className="text-xs text-gray-400 truncate">{wallet.publicKey}</p>
                    </button>
                ))
            )}
        </div>
    </div>
);

const BalanceDisplay = ({ wallet, showToast }) => {
    const [isPkVisible, setPkVisible] = useState(false);
    if (!wallet) return null;

    return (
        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">Wallet {wallet.id} Balance</h2>
            <div className="text-4xl font-bold mb-6 flex items-center gap-3">
                <img src={SOL_ICON_URL} alt="SOL" className="w-8 h-8" />
                <span>{wallet.balance.toFixed(4)} SOL</span>
            </div>
            
            <div className="space-y-3 text-sm">
                <div>
                    <label className="text-xs text-gray-400">Public Key</label>
                    <div className="flex items-center gap-2">
                        <p className="font-mono text-gray-300 truncate">{wallet.publicKey}</p>
                        <button onClick={() => copyToClipboard(wallet.publicKey, showToast, "Public Key copied!")} className="text-gray-400 hover:text-white"><i className="fas fa-copy"></i></button>
                    </div>
                </div>
                <div>
                    <label className="text-xs text-gray-400">Secret Key</label>
                    <div className="flex items-center gap-2">
                        <p className="font-mono text-gray-300 truncate">{isPkVisible ? wallet.privateKey : '•••••••••••••••••••••••••••••••••'}</p>
                        <button onClick={() => setPkVisible(!isPkVisible)} className="text-gray-400 hover:text-white"><i className={`fas ${isPkVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
                        <button onClick={() => copyToClipboard(wallet.privateKey, showToast, "Secret Key copied!")} className="text-gray-400 hover:text-white"><i className="fas fa-copy"></i></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TransferForm = ({ wallets, selectedWalletKey, handleTransfer }) => (
     <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 shadow-lg">
        <h2 className="text-xl font-semibold mb-4"><i className="fas fa-exchange-alt text-indigo-400 mr-2"></i>Transfer SOL</h2>
        <form onSubmit={handleTransfer}>
            <div className="mb-4">
                <label htmlFor="sender-wallet" className="block text-sm font-medium text-gray-300 mb-1">From</label>
                <select name="sender-wallet" id="sender-wallet" defaultValue={selectedWalletKey || ""} className="form-input w-full p-2.5 rounded-lg text-white bg-gray-700 border border-gray-600" required>
                    {wallets.map(w => <option key={w.publicKey} value={w.publicKey}>Wallet {w.id} ({w.balance.toFixed(2)} SOL)</option>)}
                </select>
            </div>
            <div className="mb-4">
                <label htmlFor="recipient-address" className="block text-sm font-medium text-gray-300 mb-1">To</label>
                <input type="text" name="recipient-address" id="recipient-address" className="form-input w-full p-2 rounded-lg text-white bg-gray-700 border border-gray-600" placeholder="Enter recipient's address" required />
            </div>
            <div className="mb-6">
                <label htmlFor="transfer-amount" className="block text-sm font-medium text-gray-300 mb-1">Amount (SOL)</label>
                <input type="number" name="transfer-amount" id="transfer-amount" className="form-input w-full p-2 rounded-lg text-white bg-gray-700 border border-gray-600" placeholder="0.0" step="0.001" min="0" required />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-transform duration-200 hover:scale-105 hover:bg-indigo-500">
                <i className="fas fa-paper-plane mr-2"></i> Send
            </button>
        </form>
    </div>
);

const TransactionHistory = ({ transactions, wallets }) => (
     <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50 flex-grow flex flex-col">
         <h2 className="text-xl font-semibold mb-4 px-2"><i className="fas fa-history text-indigo-400 mr-2"></i>Recent Activity</h2>
         <div className="space-y-3 flex-grow overflow-y-auto pr-2">
            {transactions.length === 0 ? (
                 <p className="text-gray-500 text-center py-5">No transactions yet.</p>
            ) : (
                transactions.map(tx => {
                    const senderId = wallets.find(w => w.publicKey === tx.from)?.id || 'N/A';
                    const recipientId = wallets.find(w => w.publicKey === tx.to)?.id || 'External';
                    return (
                        <div key={tx.timestamp} className="bg-gray-900/50 p-3 rounded-lg text-sm">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{tx.amount} SOL</p>
                                    <p className="text-xs text-gray-400">From Wallet {senderId} to {recipientId === 'External' ? 'External' : `Wallet ${recipientId}`}</p>
                                </div>
                                 <i className="fas fa-check-circle text-green-400"></i>
                            </div>
                        </div>
                    )
                })
            )}
         </div>
     </div>
);

const SeedPhraseView = ({ seedPhrase, onGenerate, onCopy, onConfirm }) => (
    <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-lg w-full p-8 bg-gray-800/50 rounded-xl border border-gray-700/50 shadow-2xl mx-4">
            {!seedPhrase ? (
                <>
                    <i className="fas fa-shield-alt text-5xl text-indigo-400 mb-4"></i>
                    <h2 className="text-2xl font-bold mb-3 text-gray-100">Create Your Wallet</h2>
                    <p className="text-gray-400 mb-8">Click the button below to generate your secret 12-word recovery phrase. This is the only way to recover your wallet.</p>
                    <button onClick={onGenerate} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-transform duration-200 hover:scale-105 hover:bg-indigo-500">
                        Generate Seed Phrase
                    </button>
                </>
            ) : (
                <>
                    <h2 className="text-2xl font-bold mb-3 text-gray-100">Your Secret Phrase</h2>
                    <p className="text-gray-400 mb-6">Write down these words in order and keep them safe. This is the only time you will see them.</p>
                    <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-gray-900/50 mb-6 text-gray-200">
                       {(Array.isArray(seedPhrase) ? seedPhrase : seedPhrase.split(' ')).map((word, index) => (
                           <div key={index} className="flex items-center">
                               <span className="text-gray-500 text-sm mr-2">{index + 1}.</span>
                               <span>{word}</span>
                           </div>
                       ))}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button onClick={onCopy} className="w-full bg-gray-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors duration-200 hover:bg-gray-500">
                            <i className="fas fa-copy mr-2"></i> Copy Phrase
                        </button>
                        <button onClick={onConfirm} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-transform duration-200 hover:scale-105 hover:bg-indigo-500">
                            I've Saved It, Continue <i className="fas fa-arrow-right ml-2"></i>
                        </button>
                    </div>
                </>
            )}
        </div>
    </div>
);


export default function App() {
    // --- STATE MANAGEMENT ---
    const [wallets, setWallets] = useState([]);
    const [selectedWalletKey, setSelectedWalletKey] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [toast, setToast] = useState({ show: false, message: '', isError: false });
    const [activeTab, setActiveTab] = useState('balance');
    const [seedPhrase, setSeedPhrase] = useState(null);
    const [isWalletInitialized, setWalletInitialized] = useState(false);

    // --- DERIVED STATE ---
    const selectedWallet = wallets.find(w => w.publicKey === selectedWalletKey) || null;

    // --- EFFECT FOR TOAST TIMEOUT ---
    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => setToast({ ...toast, show: false }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = (message, isError = false) => {
        setToast({ show: true, message, isError });
    };

    // --- SEED PHRASE HANDLERS ---
    const handleGenerateSeedPhrase = () => {
       const seed = generateMnemonic()
        setSeedPhrase(seed);
    };
    
    const handleCopySeedPhrase = () => {
        if (seedPhrase) copyToClipboard(seedPhrase, showToast, "Seed phrase copied!");
    };
    
    const handleConfirmSeedPhrase = () => setWalletInitialized(true);

    const handleCreateWallet = () => {
        if (!seedPhrase) {
            showToast('Generate a seed phrase first.', true);
            return;
        }

        const mnemonic = Array.isArray(seedPhrase) ? seedPhrase.join(' ') : seedPhrase;
        const seed = mnemonicToSeedSync(mnemonic);
        const path = `m/44'/501'/${wallets.length}'/0'`;
        
  const derivedSeed = derivePath(path, seed.toString("hex")).key;
  const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
  const publickey = Keypair.fromSecretKey(secret).publicKey.toBase58();
  const secretkey = Buffer.from(secret).toString("hex")
        const newWallet = {
            id: wallets.length + 1,
            publicKey: publickey,
            privateKey: secretkey,
            balance: 10
        };
        setWallets([...wallets, newWallet]);
        if (!selectedWalletKey) {
            setSelectedWalletKey(newWallet.publicKey);
        }
        showToast(`Wallet ${newWallet.id} created!`);
    };

    const handleTransfer = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const senderKey = formData.get('sender-wallet');
        const recipientKey = formData.get('recipient-address').trim();
        const amount = parseFloat(formData.get('transfer-amount'));

        if (!senderKey || !recipientKey || !amount || amount <= 0) {
            showToast("Please fill all fields correctly.", true);
            return;
        }
        if (senderKey === recipientKey) {
            showToast("Cannot send to the same wallet.", true);
            return;
        }

        const senderWallet = wallets.find(w => w.publicKey === senderKey);
        if (senderWallet.balance < amount) {
            showToast("Insufficient balance.", true);
            return;
        }

        setWallets(wallets.map(w => {
            if (w.publicKey === senderKey) return { ...w, balance: w.balance - amount };
            if (w.publicKey === recipientKey) return { ...w, balance: w.balance + amount };
            return w;
        }));

        setTransactions(prev => [{
            from: senderKey, to: recipientKey, amount, timestamp: new Date().toISOString()
        }, ...prev]);

        showToast("Transfer successful!");
        e.target.reset();
    };

    // --- CONDITIONAL RENDER ---
    if (!isWalletInitialized) {
        return (
             <>
                <style>{`body { background-color: #111827; font-family: 'Inter', sans-serif; }`}</style>
                <Toast message={toast.message} show={toast.show} isError={toast.isError} />
                <SeedPhraseView 
                    seedPhrase={seedPhrase}
                    onGenerate={handleGenerateSeedPhrase}
                    onCopy={handleCopySeedPhrase}
                    onConfirm={handleConfirmSeedPhrase}
                />
            </>
        )
    }

    const renderMobileContent = () => {
        if (!selectedWallet && activeTab !== 'wallets') {
            return (
                 <div className="text-center text-gray-500 pt-10">
                    <p>Please create or select a wallet first.</p>
                </div>
            )
        }
        switch (activeTab) {
            case 'wallets':
                return <WalletList wallets={wallets} selectedWalletKey={selectedWalletKey} onSelectWallet={setSelectedWalletKey} handleCreateWallet={handleCreateWallet} />;
            case 'balance':
                return <BalanceDisplay wallet={selectedWallet} showToast={showToast} />;
            case 'send':
                return <TransferForm wallets={wallets} selectedWalletKey={selectedWalletKey} handleTransfer={handleTransfer} />;
            case 'activity':
                 return <TransactionHistory transactions={transactions} wallets={wallets} />;
            default:
                return null;
        }
    }

    return (
        <>
            <style>{`body { background-color: #111827; font-family: 'Inter', sans-serif; }`}</style>
            <Toast message={toast.message} show={toast.show} isError={toast.isError} />
            <div className="flex flex-col h-screen text-gray-200">
                <Navbar selectedWallet={selectedWallet} />
                <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col md:flex-row gap-8 overflow-hidden">
                
                    {/* --- Desktop Layout --- */}
                    <div className="hidden md:block md:w-1/3 lg:w-2/5 max-h-full">
                        <WalletList wallets={wallets} selectedWalletKey={selectedWalletKey} onSelectWallet={setSelectedWalletKey} handleCreateWallet={handleCreateWallet} />
                    </div>
                    <div className="hidden md:block md:w-2/3 lg:w-3/5 max-h-full overflow-y-auto">
                        {selectedWallet ? (
                            <div className="space-y-8">
                                <BalanceDisplay wallet={selectedWallet} showToast={showToast} />
                                <TransferForm wallets={wallets} selectedWalletKey={selectedWalletKey} handleTransfer={handleTransfer} />
                                <TransactionHistory transactions={transactions} wallets={wallets} />
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                <p>Create a new wallet to get started.</p>
                            </div>
                        )}
                    </div>

                    <div className="md:hidden flex-grow min-h-0 pb-16">
                        {renderMobileContent()}
                    </div>

                </main>
                <Footer activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
        </>
    );
}

