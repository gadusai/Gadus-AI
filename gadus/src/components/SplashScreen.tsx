import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeOut" } }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0a]"
        >
          {/* Radial glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)" }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {/* Orbiting particles */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-emerald-500/70"
              style={{ top: "50%", left: "50%" }}
              animate={{
                x: Math.cos((i / 6) * 2 * Math.PI) * 100,
                y: Math.sin((i / 6) * 2 * Math.PI) * 100,
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 1.8,
                delay: i * 0.12,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative flex flex-col items-center"
          >
            <motion.div
              className="w-20 h-20 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center mb-5 shadow-[0_0_60px_rgba(16,185,129,0.3)]"
              animate={{ boxShadow: ["0 0 40px rgba(16,185,129,0.2)", "0 0 80px rgba(16,185,129,0.4)", "0 0 40px rgba(16,185,129,0.2)"] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            >
              <span className="text-emerald-400 font-bold text-4xl tracking-tighter">G</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-4xl font-bold text-white tracking-tight"
            >
              Gadus
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-emerald-400/70 text-sm mt-2 tracking-widest uppercase font-medium"
            >
              Your AI. Amplified.
            </motion.p>

            {/* Loading bar */}
            <motion.div className="mt-8 w-48 h-0.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.8, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
