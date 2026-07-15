import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { useLocation, useNavigationType } from 'react-router';

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const navType = useNavigationType();
  const isBack = navType === 'POP';

  return (
    <motion.div
      key={location.pathname}
      initial={{ x: isBack ? '-30%' : '100%', opacity: 0.6 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: isBack ? '100%' : '-30%', opacity: 0.6 }}
      transition={{ type: 'tween', ease: [0.22, 0.61, 0.36, 1], duration: 0.28 }}
      // Clear transform once at rest so sticky descendants (TopNav) work normally.
      transformTemplate={({ x }, generated) =>
        x === '0px' || x === 0 ? 'none' : generated
      }
    >
      {children}
    </motion.div>
  );
}
