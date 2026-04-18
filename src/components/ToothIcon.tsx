import { Bluetooth as Tooth } from "lucide-react";

// "Tooth" icon — Lucide doesn't ship a tooth icon by default in this version,
// so we render a clean inline SVG matching the brand.
export function ToothIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2c-3 0-5 1.5-6.5 2C4 4.5 3 6 3 8.5c0 2 .5 3.5 1 5s.5 3 1 4.5c.5 1.5 1 4 2.5 4s2-2 2-3.5.5-3 2-3 1.5 1.5 2 3 .5 3.5 2 3.5 2-2.5 2.5-4c.5-1.5.5-3 1-4.5s1-3 1-5C21 6 20 4.5 18.5 4 17 3.5 15 2 12 2z" />
    </svg>
  );
}

// Re-export for any place importing from lucide
export { Tooth };
