import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { useNavigationType } from 'react-router';

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const navType = useNavigationType();
  const isBack = navType === 'POP';

  return (
    <motion.div
      initial={{ opacity: 0.6, x: isBack ? -24 : 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0.6, x: isBack ? 24 : -24 }}
      transition={{ type: 'tween', ease: [0.22, 0.61, 0.36, 1], duration: 0.22 }}
      className="w-full min-h-full"
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
}
