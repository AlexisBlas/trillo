import { ReactNode } from 'react';
import { motion, Transition, Variants } from 'motion/react';
import type { NavKind } from './useNavKind';

interface PageTransitionProps {
  children: ReactNode;
  kind: NavKind;
}

/** Deceleration into place — no overshoot (iOS-like). */
const iosEase = [0.32, 0.72, 0, 1] as const;

const tabTransition: Transition = {
  duration: 0.1,
  ease: iosEase,
};

const stackTransition: Transition = {
  duration: 0.3,
  ease: iosEase,
};

const instant: Transition = { duration: 0 };

const variants: Record<NavKind, Variants> = {
  tab: {
    enter: { opacity: 0 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0 },
  },
  // Push: only the new screen moves in from the right (opaque)
  push: {
    enter: { x: '100%' },
    center: { x: 0 },
    exit: { x: 0, transition: instant },
  },
  // Pop: current screen slides off to the right; previous is already underneath
  pop: {
    enter: { x: 0, transition: instant },
    center: { x: 0 },
    exit: { x: '100%' },
  },
};

export function PageTransition({ children, kind }: PageTransitionProps) {
  const isTab = kind === 'tab';

  return (
    <motion.div
      variants={variants[kind]}
      initial="enter"
      animate="center"
      exit="exit"
      transition={isTab ? tabTransition : stackTransition}
      className="w-full min-h-full bg-[#F5F0E8]"
    >
      {children}
    </motion.div>
  );
}
