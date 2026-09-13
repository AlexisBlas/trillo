import { Outlet } from 'react-router';
import { AnimatePresence } from 'motion/react';
import { BottomNav } from './BottomNav';
import { ScrollToTop } from './ScrollToTop';
import { PageTransition } from './PageTransition';
import { AddToHomeScreenPrompt } from './AddToHomeScreenPrompt';
import { AnalyticsPageViews } from './AnalyticsPageViews';
import { useNavKind } from './useNavKind';
import { PreviewBridge } from './PreviewBridge';

export function Layout() {
  const { pathname, kind } = useNavKind();

  return (
    <div className="min-h-dvh bg-[#0E1510] overflow-x-hidden">
      <PreviewBridge />
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
