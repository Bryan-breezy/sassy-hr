import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";

// Older builds persisted bearer tokens in localStorage. They could outlive an
// account switch and override the newly issued HttpOnly session cookie.
try {
  localStorage.removeItem("app_session_token");
} catch {}

const queryClient = new QueryClient();

// After a new release, a tab that was already open still points at old script file names, which no
// longer exist. Vite reports that as "vite:preloadError"; reload once to pick up the current files.
// The timestamp guard stops a reload loop if the files are genuinely missing.
window.addEventListener("vite:preloadError", event => {
  event.preventDefault();
  try {
    const last = Number(sessionStorage.getItem("chunk-reload-at") || 0);
    if (Date.now() - last < 30_000) return;
    sessionStorage.setItem("chunk-reload-at", String(Date.now()));
  } catch {
    // sessionStorage unavailable: reload anyway, the page will just load fresh files
  }
  window.location.reload();
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = "/login";
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);

