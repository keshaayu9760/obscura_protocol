import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExternalLinkIcon } from '@/components/icons';
import LogoIcon from '@/components/icons/LogoIcon';

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Footer() {
  return (
    <footer className="relative overflow-hidden pt-10">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal/20 to-transparent" />
      <div className="absolute bottom-0 left-0 h-[520px] w-[520px] rounded-full bg-gradient-radial from-teal/[0.06] to-transparent blur-3xl" />
      <div className="absolute right-0 top-10 h-[440px] w-[440px] rounded-full bg-gradient-radial from-accent-green/[0.05] to-transparent blur-3xl" />

      <div className="relative mx-auto max-w-[1320px] px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          variants={stagger}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 gap-10 md:grid-cols-4"
        >
          <motion.div variants={fadeUp} className="col-span-1">
            <Link to="/" className="group mb-5 inline-flex items-center gap-3">
              <LogoIcon className="h-10 w-10" />
              <div className="leading-none">
                <span className="block font-heading text-[16px] font-semibold tracking-[0.08em] text-white">
                  Obscura Protocol
                </span>
                <span className="block pt-1 text-[10px] uppercase tracking-[0.24em] text-smoke/70">
                  Quiet infrastructure for private books
                </span>
              </div>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-smoke/72">
              Obscura wraps the same market engine in a slower, more deliberate surface:
              private positions, governed market control, and rapid oracle-driven sessions.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-accent-green animate-pulse" />
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-smoke/55">Testnet surface active</span>
            </div>
          </motion.div>

          <motion.div variants={fadeUp}>
            <h4 className="mb-5 font-mono text-[10px] uppercase tracking-[0.22em] text-smoke/55">Navigate</h4>
            <ul className="space-y-3">
              {[
                { to: '/markets', label: 'Signal Board' },
                { to: '/rounds', label: 'Pulse Sessions' },
                { to: '/portfolio', label: 'Vault Ledger' },
                { to: '/stats', label: 'Atlas' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="inline-block text-sm text-smoke/68 transition-all duration-300 hover:translate-x-1 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={fadeUp}>
            <h4 className="mb-5 font-mono text-[10px] uppercase tracking-[0.22em] text-smoke/55">Resources</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/docs" className="inline-block text-sm text-smoke/68 transition-all duration-300 hover:translate-x-1 hover:text-white">
                  Field Manual
                </Link>
              </li>
              <li>
                <Link to="/governance" className="inline-block text-sm text-smoke/68 transition-all duration-300 hover:translate-x-1 hover:text-white">
                  Council
                </Link>
              </li>
              <li>
                <Link to="/faq" className="inline-block text-sm text-smoke/68 transition-all duration-300 hover:translate-x-1 hover:text-white">
                  Briefing
                </Link>
              </li>
              <li>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-smoke/68 transition-all duration-300 hover:translate-x-1 hover:text-white">
                  GitHub <ExternalLinkIcon className="w-3 h-3 opacity-40" />
                </a>
              </li>
            </ul>
          </motion.div>

          <motion.div variants={fadeUp}>
            <h4 className="mb-5 font-mono text-[10px] uppercase tracking-[0.22em] text-smoke/55">Stack</h4>
            <ul className="space-y-3">
              <li>
                <a href="https://aleo.org" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-smoke/68 transition-all duration-300 hover:translate-x-1 hover:text-white">
                  Aleo <ExternalLinkIcon className="w-3 h-3 opacity-40" />
                </a>
              </li>
              <li>
                <a href="https://shieldwallet.io" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-smoke/68 transition-all duration-300 hover:translate-x-1 hover:text-white">
                  Shield Wallet <ExternalLinkIcon className="w-3 h-3 opacity-40" />
                </a>
              </li>
              <li>
                <Link to="/create" className="inline-block text-sm text-smoke/68 transition-all duration-300 hover:translate-x-1 hover:text-white">
                  Market Studio
                </Link>
              </li>
            </ul>
          </motion.div>
        </motion.div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-7 sm:flex-row">
          <div className="flex items-center gap-4">
            <Link to="/terms" className="text-xs text-smoke/35 transition-colors hover:text-smoke/70">Terms</Link>
            <Link to="/risk" className="text-xs text-smoke/35 transition-colors hover:text-smoke/70">Risk</Link>
            <Link to="/privacy" className="text-xs text-smoke/35 transition-colors hover:text-smoke/70">Privacy</Link>
            <Link to="/faq" className="text-xs text-smoke/35 transition-colors hover:text-smoke/70">Briefing</Link>
          </div>
          <p className="flex items-center gap-2 text-xs text-smoke/35">
            <span className="h-1 w-1 rounded-full bg-teal/60" />
            Obscura Protocol interface on Aleo
          </p>
        </div>
      </div>
    </footer>
  );
}
