import Constants from "expo-constants";

const SENTRY_DSN = Constants.expoConfig?.extra?.sentryDsn;

interface Breadcrumb {
  category: string;
  message: string;
  level: "info" | "warning" | "error";
  timestamp: number;
}

const breadcrumbs: Breadcrumb[] = [];
const MAX_BREADCRUMBS = 50;

export function addBreadcrumb(category: string, message: string, level: Breadcrumb["level"] = "info") {
  breadcrumbs.push({ category, message, level, timestamp: Date.now() });
  if (breadcrumbs.length > MAX_BREADCRUMBS) breadcrumbs.shift();
}

function sanitize(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  const PII_KEYS = ["email", "password", "token", "authorization", "cookie", "ssn", "phone"];
  for (const [key, value] of Object.entries(data)) {
    if (PII_KEYS.some((p) => key.toLowerCase().includes(p))) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  const sanitizedContext = context ? sanitize(context) : {};

  if (!SENTRY_DSN) {
    console.error("[Sentry placeholder]", error, sanitizedContext);
    return;
  }

  // When @sentry/react-native is installed, replace with:
  // Sentry.captureException(error, { extra: sanitizedContext, breadcrumbs });
  console.error("[Sentry]", error, sanitizedContext);
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
  if (!SENTRY_DSN) {
    console.log(`[Sentry ${level}]`, message);
    return;
  }

  console.log(`[Sentry ${level}]`, message);
}

export function initSentry() {
  if (!SENTRY_DSN) {
    console.log("[Sentry] No DSN configured — running in placeholder mode");
    return;
  }

  // When @sentry/react-native is installed:
  // Sentry.init({
  //   dsn: SENTRY_DSN,
  //   enableAutoSessionTracking: true,
  //   tracesSampleRate: 0.2,
  //   beforeBreadcrumb(breadcrumb) {
  //     if (breadcrumb.data) breadcrumb.data = sanitize(breadcrumb.data);
  //     return breadcrumb;
  //   },
  // });
  console.log("[Sentry] Initialized with DSN");
}
