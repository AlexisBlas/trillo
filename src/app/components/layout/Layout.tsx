import { Outlet } from 'react-router';
import { AnimatePresence } from 'motion/react';
import { BottomNav } from './BottomNav';
import { ScrollToTop } from './ScrollToTop';
import { PageTransition } from './PageTransition';
import { AddToHomeScreenPrompt } from './AddToHomeScreenPrompt';
import { useNavKind } from './useNavKind';

export function Layout() {
  const { pathname, kind } = useNavKind();

  return (
    <div className="min-h-screen bg-[#F5F0E8] overflow-x-hidden">
      <ScrollToTop />
      <main className="pb-[79px] md:pb-0 relative">
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={pathname} kind={kind}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      <AddToHomeScreenPrompt />
      <BottomNav />
    </div>
  );
}
