import { ReactNode } from 'react';
import {
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from 'motion/react';
import { cn } from '../ui/utils';
import type { NavKind } from './useNavKind';

interface PageTransitionProps {
  children: ReactNode;
  kind: NavKind;
}

/** Deceleration into place — iOS-like, no overshoot. */
const iosEase = [0.32, 0.72, 0, 1] as const;

const tabTransition: Transition = {
  duration: 0.14,
  ease: 'easeOut',
};

const stackTransition: Transition = {
  duration: 0.32,
  ease: iosEase,
};

const instant: Transition = { duration: 0 };

/**
 * `custom` is the active navigation kind from AnimatePresence, so exiting
 * pages still animate with the latest direction (push vs pop).
 */
const variants: Variants = {
  enter: (kind: NavKind) => {
    if (kind === 'tab') return { opacity: 0.01, x: 0 };
    if (kind === 'pop') return { x: '-24%', opacity: 0.9 };
    return { x: '100%', opacity: 1 };
  },
  center: { x: 0, opacity: 1 },
  exit: (kind: NavKind) => {
    if (kind === 'tab') return { opacity: 0, x: 0, transition: { duration: 0.1 } };
    if (kind === 'pop') return { x: '100%', opacity: 1 };
    return { x: '-24%', opacity: 0.9 };
  },
};

const reducedVariants: Variants = {
  enter: { opacity: 1, x: 0 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 1, x: 0, transition: instant },
};

export function PageTransition({ children, kind }: PageTransitionProps) {
  const reduceMotion = useReducedMotion();
  const isTab = kind === 'tab';

  return (
    <motion.div
      data-page-scroll
      custom={kind}
      variants={reduceMotion ? reducedVariants : variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={
        reduceMotion ? instant : isTab ? tabTransition : stackTransition
      }
      className={cn(
        'absolute inset-0 w-full overflow-x-hidden overflow-y-auto overscroll-y-contain bg-background',
        // Push/tab: incoming on top. Pop: incoming underneath so the
        // outgoing screen can slide off above it.
        kind === 'pop' ? 'z-[1]' : 'z-[2]'
      )}
    >
      {children}
    </motion.div>
  );
}
