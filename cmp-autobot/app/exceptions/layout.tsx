import type { ReactNode } from "react";

export default function ExceptionsLayout({ children }: { children: ReactNode }) {
  return <div className="min-w-0">{children}</div>;
}
