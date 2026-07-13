import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

// Cloudflare Turnstile — swap for your production site key.
// `1x00000000000000000000AA` is Cloudflare's official "always passes" test key.
const TURNSTILE_SITE_KEY = "1x00000000000000000000AA";
const TURNSTILE_SCRIPT_ID = "cf-turnstile-script";

const MIN = 10;
const MAX = 1000;

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          size?: "invisible" | "normal" | "compact";
          callback?: (token: string) => void;
          "error-callback"?: () => void;
        },
      ) => string;
      remove: (widgetId: string) => void;
      execute: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

const ensureTurnstileScript = () => {
  if (typeof document === "undefined") return;
  if (document.getElementById(TURNSTILE_SCRIPT_ID)) return;
  const s = document.createElement("script");
  s.id = TURNSTILE_SCRIPT_ID;
  s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  s.async = true;
  s.defer = true;
  document.head.appendChild(s);
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FeedbackModal = ({ open, onOpenChange }: Props) => {
  const { t, i18n } = useTranslation("footer");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const turnstileHost = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);

  const locale: "fr" | "en" = i18n.language?.startsWith("fr") ? "fr" : "en";
  const len = content.trim().length;
  const canSubmit = len >= MIN && len <= MAX && !submitting;

  useEffect(() => {
    if (!open) return;
    ensureTurnstileScript();
    setContent("");
    setSuccess(false);

    let cancelled = false;
    const mount = () => {
      if (cancelled) return;
      if (!window.turnstile || !turnstileHost.current) {
        requestAnimationFrame(mount);
        return;
      }
      if (widgetId.current) return;
      try {
        widgetId.current = window.turnstile.render(turnstileHost.current, {
          sitekey: TURNSTILE_SITE_KEY,
          size: "invisible",
        });
      } catch {
        /* ignore */
      }
    };
    mount();

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try { window.turnstile.remove(widgetId.current); } catch { /* ignore */ }
      }
      widgetId.current = null;
    };
  }, [open]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);

    // Trigger invisible challenge (best-effort — never blocks submission).
    if (widgetId.current && window.turnstile) {
      try { window.turnstile.execute(widgetId.current); } catch { /* ignore */ }
    }

    const { error } = await supabase
      .from("feedbacks" as never)
      .insert({ content: content.trim(), locale } as never);

    setSubmitting(false);

    if (error) {
      toast.error(t("feedback.error"));
      return;
    }

    setSuccess(true);
    setTimeout(() => onOpenChange(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("feedback.title")}</DialogTitle>
          <DialogDescription>{t("feedback.intro")}</DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
            <CheckCircle2 className="w-10 h-10 text-primary" />
            <p className="text-sm text-foreground">{t("feedback.success")}</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, MAX))}
                placeholder={t("feedback.placeholder")}
                rows={6}
                maxLength={MAX}
                aria-label={t("feedback.title")}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {len < MIN
                    ? t("feedback.minHint", { min: MIN })
                    : "\u00A0"}
                </span>
                <span aria-live="polite">{len} / {MAX}</span>
              </div>
              <div ref={turnstileHost} aria-hidden="true" />
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                {t("feedback.cancel")}
              </Button>
              <Button onClick={handleSubmit} disabled={!canSubmit}>
                {submitting ? t("feedback.sending") : t("feedback.submit")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;
