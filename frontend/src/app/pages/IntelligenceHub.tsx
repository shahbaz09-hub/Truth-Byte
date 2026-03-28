import { useState, type ComponentType } from "react";
import { motion } from "motion/react";
import {
  ingestForwardedMessage,
  type BotIngestResponse,
} from "../services/api";
import { AlertTriangle, Bot, Globe2, MessageSquare } from "lucide-react";

const verdictColor = (verdict: "TRUE" | "FALSE" | "MISLEADING") => {
  if (verdict === "TRUE") return "#00FF88";
  if (verdict === "FALSE") return "#FF2D55";
  return "#FFB800";
};

type FeatureKey =
  | "bot"
  | "deepfake"
  | "image"
  | "extension"
  | "liveScanner";

export function IntelligenceHub() {
  const [botForm, setBotForm] = useState({
    platform: "WHATSAPP" as "WHATSAPP" | "TELEGRAM",
    chatType: "GROUP" as "PRIVATE" | "GROUP",
    chatId: "",
    groupName: "",
    senderId: "",
    text: "",
    language: "hi",
    region: "IN",
  });
  const [botResult, setBotResult] = useState<BotIngestResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [activeFeature, setActiveFeature] = useState<FeatureKey>("bot");

  async function handleIngestForwardedMessage() {
    if (!botForm.chatId.trim() || !botForm.text.trim()) {
      setError("chatId and forwarded text are required.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await ingestForwardedMessage({ ...botForm });
      setBotResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bot ingestion failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[var(--electric-cyan)] uppercase tracking-[0.25em] text-xs mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
              Intelligence Hub
            </p>
            <h1 className="text-white">Messaging Bot & Intelligence Roadmap</h1>
            <p className="text-white/55 mt-2" style={{ fontFamily: "Outfit, sans-serif" }}>
              Forwarded message verification via WhatsApp/Telegram bot today, plus a roadmap of advanced detection features coming soon.
            </p>
          </div>
        </motion.div>

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm text-red-300 border border-red-500/40 bg-red-500/10" style={{ fontFamily: "Outfit, sans-serif" }}>
            {error}
          </div>
        )}

        <div className="grid xl:grid-cols-[1.1fr_2fr] gap-6 items-start">
          <div className="space-y-3">
            <FeatureRow
              icon={Bot}
              title="WhatsApp / Telegram Bot"
              description="Forward WhatsApp/Telegram messages aur turant verdict dekho."
              active={activeFeature === "bot"}
              onClick={() => setActiveFeature("bot")}
            />
            <FeatureRow
              icon={AlertTriangle}
              title="Deepfake Video Detection Suite"
              description="Video/Image deepfake analysis — Coming Soon."
              active={activeFeature === "deepfake"}
              onClick={() => setActiveFeature("deepfake")}
            />
            <FeatureRow
              icon={AlertTriangle}
              title="Image Manipulation Forensics"
              description="Edited images ke liye forensic checks — Coming Soon."
              active={activeFeature === "image"}
              onClick={() => setActiveFeature("image")}
            />
            <FeatureRow
              icon={Globe2}
              title="Browser Extension (One-Click)"
              description="Right-click se instant verification — Coming Soon."
              active={activeFeature === "extension"}
              onClick={() => setActiveFeature("extension")}
            />
            <FeatureRow
              icon={Globe2}
              title="Live Social Media Claim Scanner"
              description="Timeline par live claim scanning — Coming Soon."
              active={activeFeature === "liveScanner"}
              onClick={() => setActiveFeature("liveScanner")}
            />
          </div>

          <motion.div
            key={activeFeature}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {activeFeature === "bot" && (
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
                <Header icon={Bot} title="WhatsApp / Telegram Bot" />
                <p className="text-xs text-white/55 mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
                  Forwarded message ko yahan paste karo – system ussi message ka real verdict deta hai.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Select label="Platform" value={botForm.platform} onChange={(v) => setBotForm((p) => ({ ...p, platform: v as "WHATSAPP" | "TELEGRAM" }))} options={["WHATSAPP", "TELEGRAM"]} />
                  <Select label="Chat Type" value={botForm.chatType} onChange={(v) => setBotForm((p) => ({ ...p, chatType: v as "PRIVATE" | "GROUP" }))} options={["GROUP", "PRIVATE"]} />
                  <Input label="Chat ID" value={botForm.chatId} onChange={(v) => setBotForm((p) => ({ ...p, chatId: v }))} placeholder="group-xyz" />
                  <Input label="Group Name" value={botForm.groupName} onChange={(v) => setBotForm((p) => ({ ...p, groupName: v }))} placeholder="Family News" />
                  <Input label="Sender ID" value={botForm.senderId} onChange={(v) => setBotForm((p) => ({ ...p, senderId: v }))} placeholder="+9199xxxxxxx" />
                  <Input label="Language Code" value={botForm.language} onChange={(v) => setBotForm((p) => ({ ...p, language: v }))} placeholder="hi / ur / bn / ta" />
                </div>

                <label className="block text-sm text-white/70" style={{ fontFamily: "Outfit, sans-serif" }}>
                  Forwarded Message
                  <textarea
                    className="mt-2 w-full rounded-xl bg-black/40 border border-white/15 p-3 text-white min-h-28"
                    value={botForm.text}
                    onChange={(e) => setBotForm((p) => ({ ...p, text: e.target.value }))}
                    placeholder="WhatsApp/Telegram se aaya hua full message yahan paste karein..."
                  />
                </label>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleIngestForwardedMessage}
                  className="w-full rounded-xl px-4 py-3 text-sm text-[var(--deep-black)] bg-[var(--electric-cyan)] hover:brightness-110 transition disabled:opacity-60"
                  style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600 }}
                >
                  {loading ? "Analyzing..." : "Forward Message To Bot"}
                </button>

                {botResult && (
                  <div className="rounded-xl border border-white/12 p-4 bg-black/25 mt-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/45 mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
                      Instant Fact-Check Response
                    </p>
                    <p className="text-sm mb-2" style={{ color: verdictColor(botResult.verdict), fontFamily: "Outfit, sans-serif", fontWeight: 600 }}>
                      {botResult.verdict} ({Math.round(botResult.confidence)}% confidence)
                    </p>
                    <p className="text-sm text-white/80" style={{ fontFamily: "Outfit, sans-serif" }}>{botResult.summary}</p>
                    <p className="text-xs text-white/50 mt-2" style={{ fontFamily: "Outfit, sans-serif" }}>
                      Occurrence: {botResult.occurrenceCount} | Viral: {botResult.viral ? "Yes" : "No"}
                    </p>
                  </div>
                )}
              </section>
            )}

            {activeFeature === "deepfake" && (
              <ComingSoonPanel
                title="Deepfake Video Detection Suite"
                lines={[
                  "Video/Image upload se deepfake detection.",
                  "Face & voice manipulation spotting.",
                  "Timeline-ready forensic score.",
                ]}
              />
            )}

            {activeFeature === "image" && (
              <ComingSoonPanel
                title="Image Manipulation Forensics"
                lines={[
                  "Reverse image search + metadata analysis.",
                  "Crop/clone detection for social posts.",
                  "Context verification for viral images.",
                ]}
              />
            )}

            {activeFeature === "extension" && (
              <ComingSoonPanel
                title="Browser Extension (One-Click Verification)"
                lines={[
                  "Chrome/Firefox extension with context-menu actions.",
                  "Right-click → Verify with TruthByte.",
                  "Inline warnings on suspicious content.",
                ]}
              />
            )}

            {activeFeature === "liveScanner" && (
              <ComingSoonPanel
                title="Live Social Media Claim Scanner"
                lines={[
                  "Live Twitter/X + Facebook stream monitoring.",
                  "Automatic claim extraction from timelines.",
                  "Real-time alerts for high-risk posts.",
                ]}
              />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: ComponentType<{ size?: number; className?: string }>; label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl border border-white/10 p-4 bg-white/[0.03]">
      <div className="flex items-center gap-2 mb-2" style={{ color }}>
        <Icon size={14} />
        <span className="text-xs uppercase tracking-[0.2em]" style={{ fontFamily: "Outfit, sans-serif" }}>{label}</span>
      </div>
      <p className="text-3xl text-white font-mono">{value}</p>
    </div>
  );
}

function FeatureRow({
  icon: Icon,
  title,
  description,
  active,
  onClick,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl px-4 py-3 border transition flex items-start gap-3"
      style={{
        borderColor: active ? "rgba(0,245,255,0.35)" : "rgba(255,255,255,0.12)",
        background: active ? "rgba(0,245,255,0.08)" : "rgba(255,255,255,0.02)",
      }}
    >
      <div className="mt-0.5">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{
            background: active ? "rgba(0,245,255,0.15)" : "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.16)",
          }}
        >
          <Icon size={16} className="text-[var(--electric-cyan)]" />
        </div>
      </div>
      <div>
        <p className="text-sm text-white" style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600 }}>{title}</p>
        <p className="text-xs text-white/60 mt-0.5" style={{ fontFamily: "Outfit, sans-serif" }}>{description}</p>
      </div>
    </button>
  );
}

function Header({ icon: Icon, title }: { icon: ComponentType<{ size?: number; className?: string }>; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={18} className="text-[var(--electric-cyan)]" />
      <h3 className="text-xl text-white" style={{ fontFamily: "Outfit, sans-serif", letterSpacing: "0.02em" }}>{title}</h3>
    </div>
  );
}

function ComingSoonPanel({ title, lines }: { title: string; lines: string[] }) {
  return (
    <section className="rounded-2xl border border-dashed border-white/18 bg-white/[0.02] p-6 space-y-3">
      <Header icon={AlertTriangle} title={title} />
      <p className="inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-full bg-[var(--amber)]/10 text-[var(--amber)] border border-[var(--amber)]/40" style={{ fontFamily: "Outfit, sans-serif" }}>
        Coming Soon
      </p>
      <ul className="mt-2 space-y-1.5">
        {lines.map((line) => (
          <li key={line} className="text-sm text-white/75" style={{ fontFamily: "Outfit, sans-serif" }}>• {line}</li>
        ))}
      </ul>
    </section>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/12 bg-black/25 px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.15em] text-white/45" style={{ fontFamily: "Outfit, sans-serif" }}>{label}</p>
      <p className="text-lg text-white font-mono mt-1">{value}</p>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block text-sm text-white/70" style={{ fontFamily: "Outfit, sans-serif" }}>
      {label}
      <input
        className="mt-2 w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block text-sm text-white/70" style={{ fontFamily: "Outfit, sans-serif" }}>
      {label}
      <select
        className="mt-2 w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
