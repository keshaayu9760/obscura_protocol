import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MenuIcon, CloseIcon } from '@/components/icons';
import LogoIcon from '@/components/icons/LogoIcon';
import WalletButton from './WalletButton';

const navLinks = [
  { path: '/', label: 'Portal' },
  { path: '/markets', label: 'Signal Board' },
  { path: '/rounds', label: 'Pulse Sessions' },
  { path: '/portfolio', label: 'Vault' },
  { path: '/create', label: 'Studio' },
  { path: '/governance', label: 'Council' },
  { path: '/admin', label: 'Control' },
];

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <div className="mx-auto max-w-[1380px]">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(36,27,22,0.9),rgba(20,16,13,0.88))] shadow-card backdrop-blur-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(227,166,93,0.14),transparent_26%),radial-gradient(circle_at_80%_22%,rgba(136,190,159,0.12),transparent_24%)]" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-teal/35 to-transparent" />

          <div className="relative flex h-[78px] items-center justify-between gap-4 px-4 sm:px-6">
            <Link to="/" className="group flex min-w-0 items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-teal/30 blur-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <LogoIcon className="relative h-11 w-11" />
              </div>
              <div className="min-w-0 leading-none">
                <span className="block truncate font-heading text-[17px] font-semibold tracking-[0.08em] text-white">
                  Obscura Protocol
                </span>
                <span className="block truncate pt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-smoke/70">
                  Private event books on Aleo
                </span>
              </div>
            </Link>

            <div className="hidden xl:flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    isActive(link.path)
                      ? 'bg-gradient-to-r from-teal/30 to-accent-green/25 text-white shadow-glow-sm'
                      : 'text-smoke/75 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/docs"
                className="hidden rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] font-mono uppercase tracking-[0.22em] text-smoke/75 transition-colors hover:text-white lg:inline-flex"
              >
                Field Manual
              </Link>
              <WalletButton />
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="rounded-full border border-white/10 bg-white/[0.04] p-2.5 text-smoke transition-colors hover:text-white xl:hidden"
              >
                {mobileOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden xl:hidden"
              >
                <div className="space-y-2 border-t border-white/10 px-4 py-4 sm:px-6">
                  {navLinks.map((link, i) => (
                    <motion.div
                      key={link.path}
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Link
                        to={link.path}
                        onClick={() => setMobileOpen(false)}
                        className={`block rounded-2xl border px-4 py-3 text-sm font-medium transition-all duration-300 ${
                          isActive(link.path)
                            ? 'border-teal/30 bg-teal/15 text-white'
                            : 'border-white/8 bg-white/[0.03] text-smoke/80 hover:text-white'
                        }`}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}
                  <Link
                    to="/stats"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm font-medium text-smoke/80 transition-colors hover:text-white"
                  >
                    Atlas
                  </Link>
                  <Link
                    to="/docs"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm font-medium text-smoke/80 transition-colors hover:text-white"
                  >
                    Field Manual
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}
