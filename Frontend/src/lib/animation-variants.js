/**
 * Medisphere – Shared Framer Motion animation variants
 * Used across all pages for consistent, premium micro-interactions.
 */

// ── Spring configs ──────────────────────────────────────────────
export const spring = { type: 'spring', stiffness: 300, damping: 24 };
export const gentleSpring = { type: 'spring', stiffness: 200, damping: 20 };
export const snappySpring = { type: 'spring', stiffness: 400, damping: 28 };

// ── Page transitions ────────────────────────────────────────────
export const pageVariants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: 'easeIn' } },
};

// ── Fade variants ───────────────────────────────────────────────
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
};

export const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export const fadeInDown = {
  initial: { opacity: 0, y: -16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export const fadeInLeft = {
  initial: { opacity: 0, x: -24 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

export const fadeInRight = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

// ── Scale variants ──────────────────────────────────────────────
export const scaleIn = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export const popIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 20 } },
};

// ── Stagger containers ──────────────────────────────────────────
export const staggerContainer = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

export const staggerFast = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

export const staggerSlow = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

// ── Stagger children (pair with a stagger container) ────────────
export const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export const staggerItemScale = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
};

// ── Hover / tap interactions ────────────────────────────────────
export const cardHover = {
  rest: { y: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  hover: {
    y: -4,
    boxShadow: '0 12px 32px rgba(0,0,0,0.10)',
    transition: { duration: 0.25, ease: 'easeOut' },
  },
};

export const buttonTap = { scale: 0.97 };

export const iconSpin = {
  animate: { rotate: 360, transition: { duration: 1, repeat: Infinity, ease: 'linear' } },
};

// ── Slide variants (for sidebars, sheets) ───────────────────────
export const slideInLeft = {
  initial: { x: '-100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit: { x: '-100%', opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
};

export const slideInRight = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
};

export const slideInUp = {
  initial: { y: '100%', opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit: { y: '100%', opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
};

// ── Number counter helper ───────────────────────────────────────
// Usage: <motion.span>{Math.round(value)}</motion.span> with useMotionValue + useTransform
export const counterTransition = { duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] };

// ── Navbar scroll ───────────────────────────────────────────────
export const navbarVariants = {
  transparent: { backgroundColor: 'rgba(255,255,255,0)', backdropFilter: 'blur(0px)' },
  solid: { backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)' },
};

