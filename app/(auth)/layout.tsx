import Image from "next/image";
import { Award, CheckCircle2, TrendingUp } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="wrap grid min-h-[72vh] items-center gap-10 py-12 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="mx-auto w-full max-w-lg rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-xl shadow-black/5 sm:p-8">
        {children}
      </div>
      <aside className="relative hidden overflow-hidden rounded-[26px] bg-[#050b18] p-8 text-white lg:block">
        <Image
          src="/images/site/log.jpg"
          alt="Students collaborating in a modern coding workspace"
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#050b18]/92 via-[#050b18]/78 to-[#0b1a38]/88" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050b18]/85 via-transparent to-transparent" />
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-wider text-white/75">Your learning workspace</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">One account. Every skill.</h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/85">
            Track progress, take exams, and collect verifiable certificates — all in one dashboard built for busy
            Nigerian learners.
          </p>

          <div className="mt-7 space-y-3">
            {[
              { icon: TrendingUp, text: "Progress saved after every lesson" },
              { icon: Award, text: "Certificates with public verification" },
              { icon: CheckCircle2, text: "Lifetime access to every course you buy" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 rounded-xl bg-white/10 p-3 backdrop-blur-sm">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15">
                  <item.icon size={15} />
                </span>
                <p className="text-sm text-white/90">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-sm italic leading-relaxed text-white/90">
              “I shipped my capstone to a real client two weeks after finishing. The projects made the difference.”
            </p>
            <p className="mt-2 text-xs font-semibold text-white/75">Amina Bello · Full-Stack graduate</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
