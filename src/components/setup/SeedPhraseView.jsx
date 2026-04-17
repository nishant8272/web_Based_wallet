import FeatureStat from './FeatureStat';

export default function SeedPhraseView({
  importSeedPhrase,
  isImporting,
  isLoading,
  onConfirm,
  onCopy,
  onGenerate,
  onImportChange,
  onImportSubmit,
  onSwitchMode,
  seedPhrase,
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-[2rem] border border-slate-800 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_45%),linear-gradient(135deg,_rgba(15,23,42,0.95),_rgba(2,6,23,0.98))] p-8 shadow-2xl shadow-slate-950/50">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-cyan-300">Wallet Setup</p>
        <h2 className="max-w-lg text-4xl font-semibold text-white">Create or restore your Solana devnet workspace.</h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
          Start with a new seed phrase, or recover your previous accounts from an existing phrase. The dashboard route will stay focused on balances, transfers, and activity.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <FeatureStat value="3" label="Route groups" />
          <FeatureStat value="12/24" label="Word phrase import" />
          <FeatureStat value="Devnet" label="Network mode" />
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/50">
        {!seedPhrase ? (
          <div className="space-y-5">
            <button
              type="button"
              onClick={() => {
                onSwitchMode(false);
                onGenerate();
              }}
              className={`w-full rounded-3xl border p-6 text-left transition ${!isImporting ? 'border-cyan-400/70 bg-cyan-400/10' : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'}`}
            >
              <i className="fas fa-sparkles mb-4 text-3xl text-cyan-300"></i>
              <h3 className="text-2xl font-semibold text-white">Create New Wallet</h3>
              <p className="mt-2 text-slate-400">
                Generate a fresh 12-word recovery phrase and start clean.
              </p>
              <span className="mt-6 inline-flex rounded-full bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950">
                New Seed Phrase
              </span>
            </button>

            <div
              className={`rounded-3xl border p-6 transition ${isImporting ? 'border-cyan-400/70 bg-cyan-400/10' : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'}`}
            >
              <button type="button" onClick={() => onSwitchMode(true)} className="w-full text-left">
                <i className="fas fa-key mb-4 text-3xl text-cyan-300"></i>
                <h3 className="text-2xl font-semibold text-white">Import Existing Wallet</h3>
                <p className="mt-2 text-slate-400">
                  Paste your own seed phrase to recover your previous accounts.
                </p>
              </button>

              {isImporting && (
                <form onSubmit={onImportSubmit} className="mt-5 space-y-4">
                  <textarea
                    value={importSeedPhrase}
                    onChange={(event) => onImportChange(event.target.value)}
                    rows={5}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                    placeholder="Enter your recovery phrase"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex w-full items-center justify-center rounded-full bg-cyan-400 px-4 py-3 font-bold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLoading ? 'Restoring...' : 'Restore Wallet'}
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-semibold text-white">Your Secret Phrase</h3>
            <p className="mt-3 text-slate-400">
              Save these words safely. You will use them to recover every account derived from this wallet.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 rounded-3xl border border-slate-800 bg-slate-950/60 p-5 text-slate-200 sm:grid-cols-3">
              {seedPhrase.split(' ').map((word, index) => (
                <div key={index} className="rounded-2xl bg-slate-900 px-3 py-3">
                  <span className="mr-2 text-xs text-slate-500">{index + 1}.</span>
                  <span>{word}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-4 sm:flex-row">
              <button
                onClick={onCopy}
                className="flex w-full items-center justify-center rounded-full border border-slate-700 bg-slate-950 px-4 py-3 font-bold text-white transition hover:border-slate-600 hover:bg-slate-900"
              >
                <i className="fas fa-copy mr-2"></i> Copy Phrase
              </button>
              <button
                onClick={onConfirm}
                className="flex w-full items-center justify-center rounded-full bg-cyan-400 px-4 py-3 font-bold text-slate-950 transition hover:scale-[1.01]"
              >
                Continue To Dashboard <i className="fas fa-arrow-right ml-2"></i>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
