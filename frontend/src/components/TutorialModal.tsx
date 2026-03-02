import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Info } from 'lucide-react';
// ─── FIXED-LAYOUT TUTORIAL MODAL ────────────────────────────────────────────
// The card is always exactly 480 px tall (flex column with pinned header/footer).
// This prevents ANY size jumping when navigating between steps.

export interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  tip?: string;
}

interface TutorialModalProps {
  steps: TutorialStep[];
  pageTitle: string;
  pageDescription: string;
  accentColor?: 'green' | 'blue' | 'purple' | 'orange';
  /** Tailwind bottom-* class for the FAB. Default: 'bottom-6'. Override when a fixed toolbar is present. */
  fabBottom?: string;
}

const colorMap = {
  green: {
    gradient: 'from-green-500 to-emerald-600',
    border: 'border-green-300/60 dark:border-green-700/60',
    badge: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
    activeDot: 'bg-green-500',
    doneDot: 'bg-green-400',
    stepRing: 'ring-green-200 dark:ring-green-800',
    nextBtn: 'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700',
    fab: 'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700',
    tipBorder: 'border-green-200 dark:border-green-800/60',
    tipBg: 'bg-green-50 dark:bg-green-900/20',
    tipText: 'text-green-700 dark:text-green-300',
    stepLabel: 'text-green-600 dark:text-green-400',
  },
  blue: {
    gradient: 'from-blue-500 to-indigo-600',
    border: 'border-blue-300/60 dark:border-blue-700/60',
    badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    activeDot: 'bg-blue-500',
    doneDot: 'bg-blue-400',
    stepRing: 'ring-blue-200 dark:ring-blue-800',
    nextBtn: 'from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700',
    fab: 'from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700',
    tipBorder: 'border-blue-200 dark:border-blue-800/60',
    tipBg: 'bg-blue-50 dark:bg-blue-900/20',
    tipText: 'text-blue-700 dark:text-blue-300',
    stepLabel: 'text-blue-600 dark:text-blue-400',
  },
  purple: {
    gradient: 'from-purple-500 to-violet-600',
    border: 'border-purple-300/60 dark:border-purple-700/60',
    badge: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
    activeDot: 'bg-purple-500',
    doneDot: 'bg-purple-400',
    stepRing: 'ring-purple-200 dark:ring-purple-800',
    nextBtn: 'from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700',
    fab: 'from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700',
    tipBorder: 'border-purple-200 dark:border-purple-800/60',
    tipBg: 'bg-purple-50 dark:bg-purple-900/20',
    tipText: 'text-purple-700 dark:text-purple-300',
    stepLabel: 'text-purple-600 dark:text-purple-400',
  },
  orange: {
    gradient: 'from-orange-500 to-amber-600',
    border: 'border-orange-300/60 dark:border-orange-700/60',
    badge: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300',
    activeDot: 'bg-orange-500',
    doneDot: 'bg-orange-400',
    stepRing: 'ring-orange-200 dark:ring-orange-800',
    nextBtn: 'from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700',
    fab: 'from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700',
    tipBorder: 'border-orange-200 dark:border-orange-800/60',
    tipBg: 'bg-orange-50 dark:bg-orange-900/20',
    tipText: 'text-orange-700 dark:text-orange-300',
    stepLabel: 'text-orange-600 dark:text-orange-400',
  },
};

const TutorialModal: React.FC<TutorialModalProps> = ({
  steps,
  pageTitle,
  pageDescription,
  accentColor = 'green',
  fabBottom = 'bottom-6',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const colors = colorMap[accentColor];
  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const handleClose = () => {
    setIsOpen(false);
    // Reset to first step after close animation
    setTimeout(() => setCurrentStep(0), 300);
  };

  const handleNext = () => {
    if (!isLast) setCurrentStep((prev) => prev + 1);
    else handleClose();
  };

  const handlePrev = () => {
    if (!isFirst) setCurrentStep((prev) => prev - 1);
  };

  return (
    <>
      {/* ── Floating Info Button (FAB) — portalled to body so CSS transform
           on any ancestor never breaks `position: fixed` on mobile ── */}
      {createPortal(
        <motion.button
          onClick={() => setIsOpen(true)}
          aria-label="Open tutorial"
          className={`fixed ${fabBottom} right-6 z-50 rounded-full bg-gradient-to-br ${colors.fab} text-white shadow-lg flex items-center justify-center ring-2 ring-white/40 dark:ring-black/40 focus:outline-none overflow-hidden`}
          whileHover={{ scale: 1.12, rotate: 8 }}
          whileTap={{ scale: 0.92 }}
          initial={{ opacity: 0, scale: 0, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.6 }}
          style={{ width: '52px', height: '52px' }}
        >
          <Info size={22} strokeWidth={2.5} />
          <span className={`absolute inset-0 rounded-full bg-gradient-to-br ${colors.gradient} opacity-30 animate-ping pointer-events-none`} />
        </motion.button>,
        document.body
      )}

      {/* ── Modal Portal ── */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Backdrop */}
              <motion.div
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={handleClose}
              />

              {/*
               * ── CARD ─────────────────────────────────────────────────────
               * Fixed height + flex-col so the card NEVER resizes between steps.
               * Layout:  accent bar  |  header  |  dots  |  body (flex-1)  |  footer
               */}
              <motion.div
                className={`
                  relative z-10 flex flex-col
                  w-full max-w-md rounded-3xl shadow-2xl overflow-hidden
                  bg-white dark:bg-gray-900
                  border-2 ${colors.border}
                `}
                style={{ height: '490px' }}
                initial={{ scale: 0.85, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 30 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Top accent bar */}
                <div className={`h-1.5 w-full shrink-0 bg-gradient-to-r ${colors.gradient}`} />

                {/* ── HEADER (always visible, never conditionally rendered) ── */}
                <div className="shrink-0 flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="pr-8 min-w-0">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors.badge} mb-1.5`}>
                      How It Works
                    </span>
                    <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 leading-tight truncate">
                      {pageTitle}
                    </h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-snug line-clamp-2">
                      {pageDescription}
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    aria-label="Close tutorial"
                    className="shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* ── DOT PROGRESS (always present — no conditional) ── */}
                <div className="shrink-0 flex items-center justify-center gap-1.5 pt-3 pb-1">
                  {steps.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentStep(idx)}
                      aria-label={`Go to step ${idx + 1}`}
                      className={`rounded-full transition-all duration-300 ${
                        idx === currentStep
                          ? `w-6 h-2 ${colors.activeDot}`
                          : idx < currentStep
                          ? `w-2 h-2 ${colors.doneDot} opacity-60`
                          : 'w-2 h-2 bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>

                {/* ── STEP BODY (flex-1 → fills remaining height, no resize) ── */}
                <div className="flex-1 overflow-hidden relative px-6">
                  <AnimatePresence mode="sync" initial={false}>
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.16, ease: 'easeOut' }}
                      className="absolute inset-0 px-6 pt-4 flex flex-col"
                    >
                      {/* Icon */}
                      <div className="flex justify-center mb-3 shrink-0">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${colors.gradient} text-white shadow-md ring-4 ${colors.stepRing}`}>
                          {step.icon}
                        </div>
                      </div>

                      {/* Step counter + title */}
                      <div className="text-center mb-2 shrink-0">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${colors.stepLabel}`}>
                          Step {currentStep + 1} of {steps.length}
                        </span>
                        <h3 className="mt-0.5 text-lg font-bold text-gray-800 dark:text-gray-100">
                          {step.title}
                        </h3>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed mb-3 shrink-0">
                        {step.description}
                      </p>

                      {/*
                       * Tip — always rendered so it always occupies the same space.
                       * When there is no tip, it's invisible but still takes up room,
                       * preventing the card body from changing height.
                       */}
                      <div
                        className={`shrink-0 flex items-start gap-2 rounded-xl border px-4 py-2.5 text-xs leading-relaxed
                          ${colors.tipBorder} ${colors.tipBg} ${colors.tipText}
                          transition-opacity duration-200
                          ${step.tip ? 'opacity-100' : 'opacity-0 pointer-events-none select-none'}`}
                        aria-hidden={!step.tip}
                      >
                        <span className="mt-0.5 text-sm shrink-0">💡</span>
                        {/* Non-breaking space keeps the block height when tip is absent */}
                        <span>{step.tip ?? '\u00A0'}</span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* ── FOOTER (always pinned to the bottom) ── */}
                <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 gap-3">
                  <motion.button
                    onClick={handlePrev}
                    disabled={isFirst}
                    whileHover={!isFirst ? { scale: 1.04 } : {}}
                    whileTap={!isFirst ? { scale: 0.96 } : {}}
                    className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-200 ${
                      isFirst
                        ? 'opacity-0 pointer-events-none border-transparent'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <ChevronLeft size={15} />
                    Back
                  </motion.button>

                  <motion.button
                    onClick={handleNext}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className={`flex items-center gap-1 px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r ${colors.nextBtn} text-white shadow-md hover:shadow-lg transition-all duration-200`}
                  >
                    {isLast ? 'Got it!' : 'Next'}
                    {!isLast && <ChevronRight size={15} />}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default TutorialModal;
