import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  compact = false,
  onDark = false,
  href = "/",
  className,
}: {
  compact?: boolean;
  onDark?: boolean;
  href?: string;
  className?: string;
}) {
  return (
    <Link href={href} aria-label="LearnHub home" className={cn("inline-flex items-center", className)}>
      <Image
        src="/images/site/logo.png"
        alt="LearnHub"
        width={464}
        height={246}
        priority
        className={cn(
          "w-auto object-contain",
          compact ? "h-7" : "h-8 sm:h-9",
          !onDark && "invert dark:invert-0",
        )}
      />
    </Link>
  );
}
