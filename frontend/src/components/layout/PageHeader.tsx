import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="mb-10 overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(160deg,rgba(36,27,22,0.9),rgba(20,16,13,0.82))] p-6 sm:flex sm:items-end sm:justify-between sm:p-8"
    >
      <div className="max-w-3xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal/20 bg-teal/8 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-teal">
          <span className="h-1.5 w-1.5 rounded-full bg-teal" />
          Obscura Interface
        </div>
        <h1 className="font-heading text-3xl font-semibold leading-tight text-white md:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mt-3 max-w-2xl text-sm leading-6 text-smoke/74 md:text-base"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
      {action && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-5 sm:mt-0"
        >
          {action.href ? (
            <Link to={action.href} className="btn-primary inline-flex items-center gap-2 px-5 py-3 text-sm">
              {action.label}
            </Link>
          ) : (
            <button onClick={action.onClick} className="btn-primary inline-flex items-center gap-2 px-5 py-3 text-sm">
              {action.label}
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
