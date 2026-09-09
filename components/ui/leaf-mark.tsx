export function LeafMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path
        d="M8 24c6-1 14-8 16-18-10 2-17 10-16 18Z"
        fill="currentColor"
        fillOpacity="0.16"
      />
      <path
        d="M9 23.5c5.5-1.2 13.2-8.2 15.2-17.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M12.5 20c3.2-2.4 6.2-7 7.4-11"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M10.5 16.5c2.8.4 5.8-.4 8.2-2.4"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}
