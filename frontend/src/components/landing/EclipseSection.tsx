import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BoltIcon, ClockIcon, FireIcon } from '@/components/icons';

export default function EclipseSection() {
  return (
    <section className="py-28 px-4 relative">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card p-10 md:p-14 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal/30 to-transparent" />
          <motion.div className="absolute top-0 right-0 w-60 h-60 rounded-full" style={{ background: 'radial-gradient(circle, rgba(99, 229, 246, 0.08), transparent 70%)', filter: 'blur(40px)' }} animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 6, repeat: Infinity }} />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5" style={{ background: 'rgba(52, 201, 225, 0.08)', border: '1px solid rgba(52, 201, 225, 0.15)' }}>
                <BoltIcon className="w-4 h-4 text-teal" />
                <span className="text-sm text-teal font-heading font-medium">Eclipse Rounds</span>
              </div>

              <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-5">
                Capture fast-moving pricing,{' '}
                <span className="gradient-text">stay privately positioned</span>
              </h2>

              <p className="text-smoke/60 leading-relaxed mb-8">
                Eclipse Rounds compress short-horizon market conviction into a private 15-minute cycle. Oracle snapshots open and close the session, delegated proving settles the result, and your exposure remains encrypted.
              </p>

              <Link to="/rounds" className="btn-primary inline-flex items-center gap-2">
                Open Session Board
                <motion.span animate={{ x: [0, 3, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>→</motion.span>
              </Link>
            </div>

            {/* Glass chart mockup */}
            <motion.div
              className="glass-card p-5 relative"
              style={{ boxShadow: '0 0 40px -10px rgba(255, 107, 53, 0.1), 0 20px 40px -12px rgba(0, 0, 0, 0.6)' }}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              {/* Tab bar */}
              <div className="flex items-center gap-2 mb-4">
                {['15M', 'BTC', 'ETH', 'ALEO'].map((t, i) => (
                  <span key={t} className={`px-2.5 py-1 rounded-full text-[10px] font-mono ${i === 0 ? 'bg-teal text-white' : 'text-smoke/40'}`}>{t}</span>
                ))}
              </div>

              {/* Chart */}
              <div className="relative h-28 mb-3">
                <svg viewBox="0 0 300 100" className="w-full h-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="lgChartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" style={{ stopColor: '#63E5F6', stopOpacity: 0.15 }} />
                      <stop offset="100%" style={{ stopColor: '#63E5F6', stopOpacity: 0 }} />
                    </linearGradient>
                  </defs>
                  <path d="M0 70 Q50 50 80 65 T160 35 T240 55 T300 20" fill="none" stroke="#63E5F6" strokeWidth="2.5" />
                  <path d="M0 70 Q50 50 80 65 T160 35 T240 55 T300 20 V100 H0 Z" fill="url(#lgChartGrad)" />
                </svg>
              </div>

              <div className="flex items-center justify-between text-[10px]">
                <span className="text-smoke/30">Your balance</span>
                <span className="font-mono text-white">0.000000 ETH</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

