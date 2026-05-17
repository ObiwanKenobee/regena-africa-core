export function AtlasMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="atlas-g" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0" stopColor="oklch(0.78 0.13 85)" />
          <stop offset="1" stopColor="oklch(0.55 0.115 45)" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18" stroke="url(#atlas-g)" strokeWidth="1.5" />
      <path
        d="M20 6c4 6 6 10 6 14s-2 8-6 14c-4-6-6-10-6-14s2-8 6-14z"
        fill="url(#atlas-g)"
        opacity="0.9"
      />
      <circle cx="20" cy="20" r="2" fill="oklch(0.975 0.012 95)" />
    </svg>
  );
}
