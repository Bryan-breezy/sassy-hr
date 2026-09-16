export default function LoadingScreen({ label = "Loading" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black"
    >
      <div className="flex flex-col items-center gap-7">
        <div className="relative grid place-items-center">
          {/* Soft ambient glow behind the ring */}
          <div
            aria-hidden="true"
            className="absolute size-24 rounded-full bg-white/10 blur-2xl"
          />

          {/* Thin circular progress ring */}
          <svg
            aria-hidden="true"
            viewBox="0 0 48 48"
            className="loading-screen__ring relative size-12 text-white"
          >
            {/* Faint full track */}
            <circle
              cx="24"
              cy="24"
              r="21"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.14"
              strokeWidth="1.25"
            />
            {/* Bright rotating arc */}
            <circle
              cx="24"
              cy="24"
              r="21"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeDasharray="34 98"
            />
          </svg>
        </div>

        <div className="text-[13px] font-light tracking-[.32em] uppercase text-white/70">
          {label}
        </div>
      </div>

      <style>{`
        .loading-screen__ring {
          animation: loading-screen-spin 1.4s linear infinite;
          filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.35));
          transform-origin: center;
        }
        @keyframes loading-screen-spin {
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .loading-screen__ring {
            animation: loading-screen-pulse 1.8s ease-in-out infinite;
          }
          @keyframes loading-screen-pulse {
            0%, 100% { opacity: 0.45; }
            50% { opacity: 1; }
          }
        }
      `}</style>
    </div>
  )
}
