import { Link, useNavigate } from 'react-router-dom';
import SeedPhraseView from '../components/setup/SeedPhraseView';

export default function SetupPage({
  importSeedPhrase,
  isImporting,
  isLoading,
  onConfirmSeedPhrase,
  onCopySeedPhrase,
  onGenerateSeedPhrase,
  onImportChange,
  onImportSubmit,
  onSwitchMode,
  seedPhrase,
}) {
  const navigate = useNavigate();

  const handleConfirm = async () => {
    const didInitialize = await onConfirmSeedPhrase();
    if (didInitialize) {
      navigate('/wallet');
    }
  };

  const handleImport = async (event) => {
    const didInitialize = await onImportSubmit(event);
    if (didInitialize) {
      navigate('/wallet');
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Setup Route</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Choose how you want to enter the wallet.</h2>
        </div>
        <Link to="/" className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-white hover:border-cyan-400/50 hover:text-cyan-200">
          Back Home
        </Link>
      </div>
      <SeedPhraseView
        importSeedPhrase={importSeedPhrase}
        isImporting={isImporting}
        isLoading={isLoading}
        onConfirm={handleConfirm}
        onCopy={onCopySeedPhrase}
        onGenerate={onGenerateSeedPhrase}
        onImportChange={onImportChange}
        onImportSubmit={handleImport}
        onSwitchMode={onSwitchMode}
        seedPhrase={seedPhrase}
      />
    </main>
  );
}
