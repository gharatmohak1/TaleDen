import { cn } from "@/lib/utils";

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionLabel({ children, className }: SectionLabelProps) {
  return (
    <span className={cn("text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground", className)}>
      {children}
    </span>
  );
}
