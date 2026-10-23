import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

type InfoAction = {
  href: string;
  label: string;
  primary?: boolean;
};

export function InfoPage({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions = [],
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  actions?: InfoAction[];
  children?: React.ReactNode;
}) {
  return (
    <main className="wrap-wide py-14 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <span className="badge badge-accent">
          <Icon size={11} /> {eyebrow}
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[var(--muted)]">{description}</p>
        {actions.length > 0 && (
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {actions.map((action) => (
              <Link
                key={`${action.href}-${action.label}`}
                href={action.href}
                className={action.primary ? "btn btn-primary" : "btn"}
              >
                {action.label} {action.primary && <ArrowRight size={15} />}
              </Link>
            ))}
          </div>
        )}
      </div>
      {children && <div className="mx-auto mt-12 max-w-5xl">{children}</div>}
    </main>
  );
}
