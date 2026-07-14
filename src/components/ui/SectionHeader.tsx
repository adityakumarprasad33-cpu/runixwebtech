import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  className?: string;
  align?: "left" | "center";
}

export default function SectionHeader({
  title,
  description,
  eyebrow,
  className,
  align = "left",
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 mb-12",
        align === "center" ? "items-center text-center mx-auto" : "items-start text-left",
        className
      )}
    >
      {eyebrow && (
        <span className="text-sm font-medium text-brand-accent uppercase tracking-widest">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-brand-text tracking-tight">
        {title}
      </h2>
      {description && (
        <p className="text-lg text-brand-muted max-w-2xl leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
