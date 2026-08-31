import { domainBySlug } from "@/lib/domains";

/** Placeholder stub — page agents replace their own domain page. */
export function DomainStub({ slug }: { slug: string }) {
  const domain = domainBySlug(slug);
  if (!domain) return null;
  const Icon = domain.icon;
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-xl border border-dashed border-hairline bg-surface-1/50 p-10 text-center">
      <div className="rounded-xl border border-hairline bg-surface-2 p-4" style={{ color: domain.color }}>
        <Icon className="h-8 w-8" />
      </div>
      <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight">{domain.name}</h2>
      <p className="mt-2 max-w-md text-sm text-text-secondary">{domain.tagline}</p>
      <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted">
        Module loading — dashboard under construction
      </p>
    </div>
  );
}

export default DomainStub;
