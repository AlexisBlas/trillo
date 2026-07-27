import { Outlet } from 'react-router';
import { AnimatePresence } from 'motion/react';
import { BottomNav } from './BottomNav';
import { ScrollToTop } from './ScrollToTop';
import { PageTransition } from './PageTransition';
import { AddToHomeScreenPrompt } from './AddToHomeScreenPrompt';
import { AnalyticsPageViews } from './AnalyticsPageViews';
import { useNavKind } from './useNavKind';

export function Layout() {
  const { pathname, kind } = useNavKind();

  return (
    <div className="min-h-dvh bg-[#F5F0E8] overflow-x-hidden">
      <ScrollToTop />
      <AnalyticsPageViews />
      {/* Fixed-height stage so push/pop pages can stack with absolute positioning */}
      <main className="relative h-[calc(100dvh-79px)] md:h-dvh overflow-hidden">
        <AnimatePresence mode="sync" initial={false} custom={kind}>
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
