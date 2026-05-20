import Link from "next/link";
import {
  ArrowUpRight,
  Sparkles,
  Wrench,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  RELEASE_NOTES,
  type ReleaseCategory,
} from "@/lib/release-notes";

const CATEGORY_META: Record<
  ReleaseCategory,
  { label: string; icon: typeof Sparkles; tone: string }
> = {
  feature: {
    label: "Neu",
    icon: Sparkles,
    tone: "bg-[#003856]/8 text-[#003856] ring-[#003856]/15",
  },
  fix: {
    label: "Fix",
    icon: Wrench,
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  },
  compliance: {
    label: "Compliance",
    icon: ShieldCheck,
    tone: "bg-[#C8985A]/10 text-[#7d5a2e] ring-[#C8985A]/25",
  },
  performance: {
    label: "Performance",
    icon: Zap,
    tone: "bg-amber-50 text-amber-700 ring-amber-600/15",
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ReleaseNotesWidget({ count = 3 }: { count?: number }) {
  const latest = RELEASE_NOTES.slice(0, count);

  return (
    <section
      aria-label="Release Notes"
      className="rounded-2xl bg-white ring-1 ring-stone-200/60 shadow-[0_1px_3px_rgba(0,56,86,0.04)]"
    >
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-stone-200/60">
        <div>
          <h3 className="text-sm font-semibold text-[#003856] tracking-tight">
            Was ist neu
          </h3>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Releases und Compliance-Updates
          </p>
        </div>
        <Link
          href="/release-notes"
          className="inline-flex items-center gap-1 text-xs font-medium text-[#003856]/70 hover:text-[#003856] transition-colors"
        >
          Alle
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </header>

      {/* Entries */}
      <ul className="divide-y divide-stone-100/80">
        {latest.map((note) => {
          const meta = CATEGORY_META[note.category];
          const Icon = meta.icon;

          return (
            <li
              key={note.version}
              className="px-5 py-4 group hover:bg-stone-50/50 transition-colors"
            >
              {/* Meta Row */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-mono font-medium text-stone-400 tracking-tight">
                  {note.version}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-[2px] rounded-md ring-1 ${meta.tone}`}
                >
                  <Icon className="w-2.5 h-2.5" />
                  {meta.label}
                </span>
                <time
                  dateTime={note.date}
                  className="text-[11px] text-stone-400 ml-auto tabular-nums"
                >
                  {formatDate(note.date)}
                </time>
              </div>

              {/* Title */}
              <h4 className="text-[13px] font-semibold text-stone-900 mb-2 leading-snug">
                {note.title}
              </h4>

              {/* Highlights */}
              <ul className="space-y-1">
                {note.highlights.slice(0, 3).map((h, i) => (
                  <li
                    key={i}
                    className="text-xs text-stone-600 leading-relaxed flex gap-2"
                  >
                    <span className="text-[#C8985A]/70 mt-[3px] flex-shrink-0 select-none">
                      •
                    </span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
