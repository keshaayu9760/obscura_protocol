import { useState } from 'react';
import { WalletIcon } from '@/components/icons';
import { useWalletStore } from '@/stores/walletStore';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { useWalletModal } from '@provablehq/aleo-wallet-adaptor-react-ui';

export default function WalletButton() {
  const { connected, address } = useWalletStore();
  const { disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [showMenu, setShowMenu] = useState(false);

  if (!connected) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal/15 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-all duration-200 hover:border-teal/50 hover:bg-teal/20 active:scale-[0.98]"
      >
        <WalletIcon className="w-4 h-4" />
        Link Vault
      </button>
    );
  }

  const displayAddr = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : 'Connected';

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-mono text-white transition-all hover:border-teal/30"
      >
        <div className="h-2 w-2 rounded-full bg-accent-green" />
        {displayAddr}
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 z-50 mt-2 w-52 rounded-2xl border border-white/10 bg-dark-100/95 py-2 shadow-card backdrop-blur-xl">
            <button
              onClick={() => {
                navigator.clipboard.writeText(address || '');
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-smoke/80 transition-colors hover:bg-white/[0.04] hover:text-white"
            >
              Copy identity
            </button>
            <button
              onClick={() => {
                disconnect();
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-accent-red hover:bg-accent-red/10 transition-colors"
            >
              Detach wallet
            </button>
          </div>
        </>
      )}
    </div>
  );
}
