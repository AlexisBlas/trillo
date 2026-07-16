import { ReactNode } from 'react';
import { motion, Transition, Variants } from 'motion/react';
import type { NavKind } from './useNavKind';

interface PageTransitionProps {
  children: ReactNode;
  kind: NavKind;
}

const ease = [0.22, 0.61, 0.36, 1] as const;

const tabTransition: Transition = {
  duration: 0.16,
  ease,
};

const stackTransition: Transition = {
  duration: 0.22,
  ease,
};

/** Soft stack slide (not full-screen iOS push). */
const STACK_OFFSET = 28;

const variants: Record<NavKind, Variants> = {
  tab: {
    enter: { opacity: 0 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0 },
  },
  push: {
    enter: { opacity: 0.6, x: STACK_OFFSET },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0.6, x: -STACK_OFFSET },
  },
  pop: {
    enter: { opacity: 0.6, x: -STACK_OFFSET },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0.6, x: STACK_OFFSET },
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
      className="w-full min-h-full"
    >
      {children}
    </motion.div>
  );
}
