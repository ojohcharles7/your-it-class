import type { Metadata } from "next";
import { Link } from "@/components/console-link";
import { Download, Receipt, Search, TrendingUp, Wallet } from "lucide-react";
import { CopyButton } from "@/components/admin/copy-button";
import { LocalEmptyPage } from "@/components/admin/local-empty-page";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { formatDate, initials, naira, percent } from "@/lib/utils";

export const metadata: Metadata = { title: "Payments" };
export const dynamic = "force-dynamic";

type PaymentRow = {
  id: string;
  reference: string;
  user_id: string;
  course_id: string;
  amount_kobo: number;
  status: "pending" | "success" | "failed";
  provider: string;
  created_at: string;
  courses: { title: string } | { title: string }[] | null;
};

type Filters = { q?: string; status?: string };

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<Filters> }) {
  await requireAdmin();
  const filters = await searchParams;
  const query = (filters.q ?? "").trim();
  const status = ["success", "pending", "failed"].includes(filters.status ?? "") ? filters.status : "all";

  if (!isSupabaseAdminConfigured) {
    return (
      <LocalEmptyPage
        eyebrow="Finance"
        title="Payments"
        description="Paystack and test-mode transactions in one ledger."
        banner="The payment ledger is stored in Supabase. Connect your project and switch PAYMENTS_PROVIDER to start recording real or mock transactions."
        stats={[
          { label: "Total revenue", value: naira(0), hint: "No live ledger", icon: TrendingUp },
          { label: "This month", value: naira(0), hint: "Awaiting connection", icon: Wallet },
          { label: "Average order", value: naira(0), hint: "No transactions", icon: Receipt },
          { label: "Pending", value: 0, hint: "Nothing to review", icon: Receipt },
        ]}
        columns={["Student", "Course", "Reference", "Date", "Amount", "Provider", "Status"]}
        emptyTitle="No payment records in local mode"
        emptyDescription="Local preview mode never writes payments. After connecting Supabase, Paystack webhooks and the mock provider will populate this ledger automatically."
      />
    );
  }

  const admin = createSupabaseAdminClient();
  const [{ data: paymentRows }, { data: profileRows }] = await Promise.all([
    admin.from("payments").select("*, courses(title)").order("created_at", { ascending: false }),
    admin.from("profiles").select("id, full_name"),
  ]);

  const payments = (paymentRows ?? []) as PaymentRow[];
  const names = new Map((profileRows ?? []).map((profile) => [profile.id, profile.full_name as string | null]));
  const successful = payments.filter((payment) => payment.status === "success");
  const pending = payments.filter((payment) => payment.status === "pending");
  const failed = payments.filter((payment) => payment.status === "failed");
  const revenue = successful.reduce((sum, payment) => sum + Number(payment.amount_kobo), 0);
  const average = successful.length ? Math.round(revenue / successful.length) : 0;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthRevenue = successful
    .filter((payment) => new Date(payment.created_at) >= monthStart)
    .reduce((sum, payment) => sum + Number(payment.amount_kobo), 0);

  const filtered = payments.filter((payment) => {
    const course = Array.isArray(payment.courses) ? payment.courses[0] : payment.courses;
    const name = names.get(payment.user_id) || "Student";
    const haystack = `${name} ${payment.reference} ${course?.title ?? ""} ${payment.provider}`.toLowerCase();
    const matchesStatus = status === "all" || payment.status === status;
    return matchesStatus && haystack.includes(query.toLowerCase());
  });

  const hrefFor = (nextStatus: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (nextStatus !== "all") params.set("status", nextStatus);
    const suffix = params.toString();
    return `/admin/payments${suffix ? `?${suffix}` : ""}`;
  };

  const tabs = [
    { value: "all", label: "All transactions", count: payments.length },
    { value: "success", label: "Successful", count: successful.length },
    { value: "pending", label: "Pending", count: pending.length },
    { value: "failed", label: "Failed", count: failed.length },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Finance</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">Payments</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Paystack and test-mode transactions in one ledger.</p>
        </div>
        <a href="/admin/export?type=payments" className="btn btn-sm self-start sm:self-auto">
          <Download size={14} /> Export ledger
        </a>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total revenue", value: naira(revenue), hint: `${successful.length} successful`, icon: TrendingUp, tone: "text-[var(--success)] bg-[color-mix(in_srgb,var(--success)_12%,transparent)]" },
          { label: "This month", value: naira(monthRevenue), hint: "Cleared revenue", icon: Wallet, tone: "text-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]" },
          { label: "Average order", value: naira(average), hint: "Per successful payment", icon: Receipt, tone: "text-[var(--accent-2)] bg-[color-mix(in_srgb,var(--accent-2)_12%,transparent)]" },
          { label: "Pending", value: pending.length.toLocaleString(), hint: `${percent(pending.length, payments.length)}% of ledger`, icon: Receipt, tone: "text-[var(--warning)] bg-[color-mix(in_srgb,var(--warning)_14%,transparent)]" },
        ].map((stat) => (
          <div key={stat.label} className="admin-card p-4">
            <span className={`grid h-9 w-9 place-items-center rounded-xl ${stat.tone}`}>
              <stat.icon size={16} />
            </span>
            <p className="mt-3 text-lg font-bold tracking-tight">{stat.value}</p>
            <p className="text-[11px] font-semibold text-[var(--muted)]">{stat.label}</p>
            <p className="mt-0.5 text-[10px] text-[var(--muted)]">{stat.hint}</p>
          </div>
        ))}
      </div>

      <div className="admin-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--line)] p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1">
            {tabs.map((tab) => (
              <Link key={tab.value} href={hrefFor(tab.value)} className="admin-tab" data-active={status === tab.value}>
                {tab.label}
                <span className="rounded bg-[color-mix(in_srgb,var(--muted)_12%,transparent)] px-1.5 py-0.5 text-[10px] font-bold">
                  {tab.count}
                </span>
              </Link>
            ))}
          </div>

          <form action="/admin/payments" className="flex w-full gap-2 lg:w-auto">
            {status !== "all" && <input type="hidden" name="status" value={status} />}
            <label className="relative flex-1 lg:w-64">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Search student, course or reference…"
                className="input h-9 py-0 pl-8 text-xs"
                aria-label="Search payments"
              />
            </label>
            <button type="submit" className="btn btn-sm">Search</button>
            {query && <Link href={hrefFor(status as string)} className="btn btn-ghost btn-sm">Clear</Link>}
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="table admin-table min-w-[940px]">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Reference</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Provider</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((payment) => {
                const course = Array.isArray(payment.courses) ? payment.courses[0] : payment.courses;
                const name = names.get(payment.user_id) || "Student";
                return (
                  <tr key={payment.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-[10px] font-bold text-white">
                          {initials(name)}
                        </span>
                        <span className="font-semibold">{name}</span>
                      </div>
                    </td>
                    <td className="max-w-[220px] truncate">{course?.title ?? "Course"}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-[11px] text-[var(--muted)]">{payment.reference}</span>
                        <CopyButton value={payment.reference} />
                      </div>
                    </td>
                    <td className="text-[var(--muted)]">{formatDate(payment.created_at)}</td>
                    <td className="font-semibold">{naira(Number(payment.amount_kobo))}</td>
                    <td>
                      <span className="badge badge-muted">{payment.provider}</span>
                    </td>
                    <td>
                      <span className={`badge ${payment.status === "success" ? "badge-success" : payment.status === "pending" ? "badge-warning" : "badge-muted"}`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="px-6 py-14 text-center">
            <Receipt size={24} className="mx-auto text-[var(--muted)]" />
            <h2 className="mt-3 text-sm font-semibold">{payments.length === 0 ? "No payments recorded yet" : "No matching transactions"}</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {payments.length === 0 ? "Successful and pending transactions will appear here." : "Try a different search or status filter."}
            </p>
            {payments.length > 0 && <Link href="/admin/payments" className="btn btn-sm mt-4">Reset filters</Link>}
          </div>
        )}
      </div>
    </div>
  );
}
