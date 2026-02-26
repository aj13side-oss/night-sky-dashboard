import AppNav from "@/components/AppNav";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

const STEPS = ["Location & Time", "Equipment", "Preferences"];

const WhatToWatch = () => {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");

  const [location, setLocation] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [timeWindow, setTimeWindow] = useState("21:00 – 03:00");
  const [focalLength, setFocalLength] = useState("");
  const [aperture, setAperture] = useState("");
  const [pixelSize, setPixelSize] = useState("");
  const [sensorWidth, setSensorWidth] = useState("");
  const [sensorHeight, setSensorHeight] = useState("");
  const [imagingType, setImagingType] = useState("rgb");
  const [targetType, setTargetType] = useState("any");
  const [experience, setExperience] = useState("intermediate");
  const [moonTolerance, setMoonTolerance] = useState("moderate");

  const canProceed = step === 0 ? location.length > 0 : true;

  const handleGenerate = async () => {
    setIsLoading(true);
    setResult("");

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/recommend-targets`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            location,
            date,
            timeWindow,
            equipment: { focalLength, aperture, pixelSize, sensorWidth, sensorHeight, imagingType },
            targetType,
            experience,
            moonTolerance,
          }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        if (resp.status === 429) {
          toast.error("Rate limit reached. Please wait a moment and try again.");
        } else if (resp.status === 402) {
          toast.error("AI credits exhausted. Top up in Settings → Workspace → Usage.");
        } else {
          toast.error(err.error || "Something went wrong");
        }
        setIsLoading(false);
        return;
      }

      if (!resp.body) throw new Error("No stream body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullText = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullText += content;
              setResult(fullText);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullText += content;
              setResult(fullText);
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate recommendations");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background star-field">
      <AppNav />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            What Should I Watch Tonight?
          </h2>
          <p className="text-muted-foreground mt-1">
            Tell us about your setup and we'll recommend the best targets for tonight
          </p>
        </motion.div>

        {!result ? (
          <>
            <div className="flex gap-2">
              {STEPS.map((s, i) => (
                <button
                  key={s}
                  onClick={() => i <= step && setStep(i)}
                  className={`flex-1 text-xs py-2 rounded-lg transition-colors ${
                    i === step
                      ? "bg-primary/20 text-primary font-medium"
                      : i < step
                      ? "bg-secondary/50 text-foreground"
                      : "bg-muted/30 text-muted-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card rounded-2xl p-6 space-y-4"
              >
                {step === 0 && (
                  <>
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Where & When</h3>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Location *</Label>
                        <Input placeholder="e.g. Brullioles, France or 45.73°N, 4.48°E" value={location} onChange={(e) => setLocation(e.target.value)} className="bg-secondary/50" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Date</Label>
                          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-secondary/50 font-mono" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Time window</Label>
                          <Input placeholder="21:00 – 03:00" value={timeWindow} onChange={(e) => setTimeWindow(e.target.value)} className="bg-secondary/50 font-mono" />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Your Equipment</h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Focal Length (mm)</Label>
                          <Input type="number" placeholder="e.g. 1000" value={focalLength} onChange={(e) => setFocalLength(e.target.value)} className="bg-secondary/50 font-mono" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Aperture (mm)</Label>
                          <Input type="number" placeholder="e.g. 200" value={aperture} onChange={(e) => setAperture(e.target.value)} className="bg-secondary/50 font-mono" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Pixel Size (µm)</Label>
                          <Input type="number" step="0.01" placeholder="e.g. 3.76" value={pixelSize} onChange={(e) => setPixelSize(e.target.value)} className="bg-secondary/50 font-mono" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Sensor W (mm)</Label>
                          <Input type="number" step="0.1" placeholder="e.g. 23.5" value={sensorWidth} onChange={(e) => setSensorWidth(e.target.value)} className="bg-secondary/50 font-mono" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Sensor H (mm)</Label>
                          <Input type="number" step="0.1" placeholder="e.g. 15.7" value={sensorHeight} onChange={(e) => setSensorHeight(e.target.value)} className="bg-secondary/50 font-mono" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Imaging Type</Label>
                        <Select value={imagingType} onValueChange={setImagingType}>
                          <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rgb">RGB (One-shot color / LRGB)</SelectItem>
                            <SelectItem value="narrowband">Narrowband (Ha, OIII, SII...)</SelectItem>
                            <SelectItem value="both">Both — I have both setups</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Preferences</h3>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">What do you want to shoot?</Label>
                        <Select value={targetType} onValueChange={setTargetType}>
                          <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Anything — surprise me!</SelectItem>
                            <SelectItem value="galaxies">Galaxies</SelectItem>
                            <SelectItem value="nebulae">Nebulae</SelectItem>
                            <SelectItem value="clusters">Star Clusters</SelectItem>
                            <SelectItem value="planets">Planets</SelectItem>
                            <SelectItem value="comets">Comets & Asteroids</SelectItem>
                            <SelectItem value="widefield">Wide-field / Milky Way</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Experience level</Label>
                        <Select value={experience} onValueChange={setExperience}>
                          <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner — just starting out</SelectItem>
                            <SelectItem value="intermediate">Intermediate — comfortable with basics</SelectItem>
                            <SelectItem value="advanced">Advanced — looking for challenges</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Moon tolerance</Label>
                        <Select value={moonTolerance} onValueChange={setMoonTolerance}>
                          <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="strict">Dark skies only — avoid the moon</SelectItem>
                            <SelectItem value="moderate">Moderate — can work around it</SelectItem>
                            <SelectItem value="any">Don't care — I have narrowband filters</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 0} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>

              {step < 2 ? (
                <Button onClick={() => setStep(step + 1)} disabled={!canProceed} className="gap-2">
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleGenerate} disabled={isLoading} className="gap-2">
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Thinking...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Get Recommendations</>
                  )}
                </Button>
              )}
            </div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="glass-card rounded-2xl p-6">
              <div className="prose prose-invert prose-sm max-w-none">
                <MarkdownRenderer content={result} />
              </div>
              {isLoading && (
                <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </div>
              )}
            </div>

            {!isLoading && (
              <Button variant="outline" onClick={() => { setResult(""); setStep(0); }} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Start Over
              </Button>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
};

const MarkdownRenderer = ({ content }: { content: string }) => {
  const lines = content.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith("### ")) {
          return <h3 key={i} className="text-base font-semibold text-foreground mt-4">{line.slice(4)}</h3>;
        }
        if (line.startsWith("## ")) {
          return <h2 key={i} className="text-lg font-bold text-primary mt-6">{line.slice(3)}</h2>;
        }
        if (line.startsWith("# ")) {
          return <h1 key={i} className="text-xl font-bold text-foreground mt-6">{line.slice(2)}</h1>;
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return <li key={i} className="text-sm text-secondary-foreground ml-4">{formatInline(line.slice(2))}</li>;
        }
        if (line.trim() === "") return <div key={i} className="h-2" />;
        return <p key={i} className="text-sm text-secondary-foreground leading-relaxed">{formatInline(line)}</p>;
      })}
    </div>
  );
};

function formatInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default WhatToWatch;
