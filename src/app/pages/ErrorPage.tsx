import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

/**
 * Route-level error boundary. Replaces React Router's default
 * "Unexpected Application Error" screen with a branded status page that
 * handles both unknown routes (404) and unexpected runtime errors.
 */
export function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  let code = 'Error';
  let title = 'Something went wrong';
  let message =
    'An unexpected error occurred. You can head back home or try again.';

  const notFound =
    (isRouteErrorResponse(error) && error.status === 404) || error == null;

  if (notFound) {
    code = '404';
    title = 'Page not found';
    message =
      "We couldn't find the page you were looking for. It may have moved or no longer exists.";
  } else if (isRouteErrorResponse(error)) {
    code = String(error.status);
    title = error.statusText || title;
    message = error.data?.message || message;
  } else if (error instanceof Error) {
    message = error.message || message;
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center px-8">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-[#fee2e2] border border-[#991b1b]">
          <AlertTriangle className="size-8 text-[#991b1b]" strokeWidth={2.2} />
        </div>

        <p className="mb-2 text-[11px] font-bold tracking-[1.4px] uppercase text-[#4b5563]">
          {code}
        </p>
        <h1 className="mb-3 text-[24px] font-bold text-[#1a3010]">{title}</h1>
        <p className="mb-8 text-[15px] leading-relaxed text-[#4b6b3a]">{message}</p>

        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={() => navigate('/')}
            className="h-12 w-full inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#2c4a1e] text-white text-[15px] font-bold hover:bg-[#1a3010] transition-colors"
          >
            <Home className="size-[18px]" />
            Back to Home
          </button>
          <button
            onClick={() => window.location.reload()}
            className="h-12 w-full inline-flex items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-[#e5e7eb] bg-white text-[#1a1a1a] text-[15px] font-bold hover:border-[#2c4a1e] transition-colors"
          >
            <RotateCcw className="size-[18px]" />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
