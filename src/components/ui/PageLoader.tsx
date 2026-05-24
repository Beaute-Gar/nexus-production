import { motion } from 'framer-motion';

export default function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      {/* Hexagone animé */}
      <div className="relative w-16 h-16">
        {/* Anneaux orbitaux */}
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border border-cyan-500/30"
            animate={{ scale: [1, 1.5 + i * 0.3, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, delay: i * 0.4, repeat: Infinity, ease: 'easeOut' }}
          />
        ))}

        {/* Centre */}
        <motion.div
          className="absolute inset-2 rounded-xl bg-cyan-500/10 border border-cyan-500/40
                     flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        >
          <motion.div
            className="w-3 h-3 rounded-sm bg-cyan-400"
            animate={{ scale: [1, 0.6, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>

      {/* Texte */}
      <div className="text-center space-y-1">
        <motion.p
          className="text-sm font-medium text-text-secondary"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          Chargement du module…
        </motion.p>
        <p className="text-xs text-text-muted">Nexus Analytics Pro</p>
      </div>

      {/* Barre de progression */}
      <div className="w-48 h-0.5 rounded-full bg-border overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}