// Platform-neutral client error reporting. Previously routed to Lovable's editor
// telemetry; now it logs locally and forwards to a hook if one is installed, so a
// host (or a future Sentry/OTel bridge) can pick errors up without this file changing.
type ErrorSink = (payload: {
  message: string;
  stack?: string;
  route?: string;
  context?: Record<string, unknown>;
}) => void;

declare global {
  interface Window {
    __reportRuntimeError?: ErrorSink;
  }
}

export function reportClientError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  // Loaders and server fns commonly throw a raw Response; String(it) is the
  // opaque "[object Response]", so pull out the status and URL instead.
  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  window.__reportRuntimeError?.({
    message,
    ...(stack !== undefined && { stack }),
    route: window.location.pathname,
    context,
  });
}
