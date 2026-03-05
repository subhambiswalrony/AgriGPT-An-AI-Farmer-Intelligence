import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * Cinematic AI-Agriculture logo animation
 *
 * Phase 0  (0 ms)    → Glowing seed pulses
 * Phase 1  (350 ms)  → Leaf outline draws itself
 * Phase 2  (900 ms)  → Leaf fills green + centre spine grows
 * Phase 3  (1400 ms) → Circuit lines draw across the leaf
 * Phase 4  (2000 ms) → Nodes light up with pulse rings
 * Phase 5  (2600 ms) → Whole logo breathes forever
 */

const LEAF =
  'M 100 182 C 52 150, 40 88, 100 36 C 160 88, 148 150, 100 182 Z';

const SPINE = 'M 100 182 L 100 36';

const CIRCUITS = [
  'M 97 152 L 63 152 L 63 136',
  'M 97 120 L 57 120 L 57 102',
  'M 97 91  L 64 91  L 64 75',
  'M 103 152 L 137 152 L 137 136',
  'M 103 120 L 143 120 L 143 102',
  'M 103 91  L 136 91  L 136 75',
];

const NODES: { cx: number; cy: number; delay: number }[] = [
  { cx: 63,  cy: 136, delay: 0.00 },
  { cx: 57,  cy: 102, delay: 0.12 },
  { cx: 64,  cy: 75,  delay: 0.24 },
  { cx: 137, cy: 136, delay: 0.06 },
  { cx: 143, cy: 102, delay: 0.18 },
  { cx: 136, cy: 75,  delay: 0.30 },
  { cx: 100, cy: 152, delay: 0.08 },
  { cx: 100, cy: 120, delay: 0.20 },
  { cx: 100, cy: 91,  delay: 0.32 },
];

const AgriGPTLogoAnimated: React.FC = () => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 350),
      setTimeout(() => setPhase(2), 900),
      setTimeout(() => setPhase(3), 1400),
      setTimeout(() => setPhase(4), 2000),
      setTimeout(() => setPhase(5), 2600),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="relative flex-shrink-0 w-20 h-20">

      {/* Outer ambient glow — phase 5 */}
      <motion.div
        className="absolute inset-0 rounded-full bg-green-500 blur-2xl pointer-events-none"
        animate={
          phase >= 5
            ? { opacity: [0.15, 0.45, 0.15], scale: [1, 1.35, 1] }
            : { opacity: 0 }
        }
        transition={
          phase >= 5
            ? { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }
            : undefined
        }
      />

      {/* Breathe wrapper — phase 5 */}
      <motion.div
        className="w-20 h-20"
        animate={phase >= 5 ? { scale: [1, 1.05, 1] } : { scale: 1 }}
        transition={
          phase >= 5
            ? { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }
            : undefined
        }
      >
        <svg viewBox="18 26 164 168" width="80" height="80">

          {/* ── Phase 0: seed ── */}
          <motion.circle
            cx="100" cy="182" fill="#22C55E" r="0"
            animate={{ r: phase >= 1 ? 0 : 4 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
          <motion.circle
            cx="100" cy="182" fill="none"
            stroke="#22C55E" strokeWidth="1.2" r="0"
            animate={phase < 1 ? { r: [0, 14], opacity: [0.8, 0] } : { r: 0, opacity: 0 }}
            transition={phase < 1
              ? { duration: 0.7, repeat: Infinity, ease: 'easeOut' }
              : { duration: 0.2 }}
          />
          <motion.circle
            cx="100" cy="182" fill="none"
            stroke="#22C55E" strokeWidth="0.8" r="0"
            animate={phase < 1 ? { r: [0, 22], opacity: [0.45, 0] } : { r: 0, opacity: 0 }}
            transition={phase < 1
              ? { duration: 0.7, delay: 0.26, repeat: Infinity, ease: 'easeOut' }
              : { duration: 0.2 }}
          />

          {/* ── Phase 1: leaf outline draws ── */}
          <motion.path
            d={LEAF} fill="none"
            stroke="#22C55E" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: phase >= 1 ? 1 : 0 }}
            transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
          />

          {/* ── Phase 2: leaf fill ── */}
          <motion.path
            d={LEAF} fill="#15803D"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 2 ? 0.82 : 0 }}
            transition={{ duration: 0.9, ease: 'easeInOut' }}
          />

          {/* Soft inner glow on leaf */}
          <motion.path
            d={LEAF} fill="none"
            stroke="#22C55E" strokeWidth="10"
            style={{ filter: 'blur(6px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 2 ? 0.18 : 0 }}
            transition={{ duration: 1.0 }}
          />

          {/* ── Phase 2: spine grows up ── */}
          <motion.path
            d={SPINE} fill="none"
            stroke="white" strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: phase >= 2 ? 1 : 0 }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
          />

          {/* ── Phase 3: circuit lines (staggered) ── */}
          {CIRCUITS.map((d, i) => (
            <motion.path
              key={i} d={d} fill="none"
              stroke="white" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: phase >= 3 ? 1 : 0,
                opacity: phase >= 3 ? 1 : 0,
              }}
              transition={{
                pathLength: { duration: 0.42, delay: i * 0.13, ease: 'easeOut' },
                opacity:     { duration: 0.1,  delay: i * 0.13 },
              }}
            />
          ))}

          {/* ── Phase 4: nodes light up + pulse ── */}
          {NODES.map((n, i) => (
            <g key={i}>
              <motion.circle
                cx={n.cx} cy={n.cy} fill="white" r="0"
                animate={{ r: phase >= 4 ? 3.2 : 0 }}
                transition={{ duration: 0.3, delay: n.delay, ease: 'easeOut' }}
              />
              <motion.circle
                cx={n.cx} cy={n.cy} fill="#22C55E" r="0"
                animate={{ r: phase >= 4 ? 1.3 : 0 }}
                transition={{ duration: 0.3, delay: n.delay + 0.1, ease: 'easeOut' }}
              />
              {phase >= 4 && (
                <motion.circle
                  cx={n.cx} cy={n.cy}
                  fill="none" stroke="white" strokeWidth="1"
                  r="3.2"
                  animate={{ r: [3.2, 11], opacity: [0.9, 0] }}
                  transition={{
                    duration: 1.5,
                    delay: n.delay + 0.25,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />
              )}
            </g>
          ))}

          {/* ── Phase 5: leaf glow pulse ── */}
          {phase >= 5 && (
            <motion.path
              d={LEAF} fill="none"
              stroke="#22C55E" strokeWidth="6"
              style={{ filter: 'blur(5px)' }}
              animate={{ opacity: [0.08, 0.3, 0.08] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

        </svg>
      </motion.div>
    </div>
  );
};

export default AgriGPTLogoAnimated;
