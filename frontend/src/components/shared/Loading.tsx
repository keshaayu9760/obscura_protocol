import { motion } from 'framer-motion';

interface LoadingProps {
  text?: string;
  fullScreen?: boolean;
}

export default function Loading({ text = 'Loading...', fullScreen = false }: LoadingProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-5">
      <div className="relative h-16 w-16">
        <motion.div
          className="absolute inset-0 rounded-[22px] border border-white/10 bg-white/[0.03]"
          animate={{ rotate: [0, 2, -2, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-3 rounded-[18px] border border-teal/35"
          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-green"
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 1.3, repeat: Infinity }}
        />
      </div>
      <div className="flex items-center gap-1.5">
        <p className="font-heading text-sm text-smoke/72">{text}</p>
        <motion.span className="inline-flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1 w-1 rounded-full bg-teal/60"
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </motion.span>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-dark/82 backdrop-blur-lg"
      >
        {content}
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center py-20">
      {content}
    </motion.div>
  );
}
