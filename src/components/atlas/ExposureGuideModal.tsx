import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onClose: () => void;
}

const ExposureGuideModal = ({ open, onClose }: Props) => (
  <Dialog open={open} onOpenChange={() => onClose()}>
    <DialogContent className="max-w-lg bg-card border-border/50 text-foreground max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold">📘 Understanding Exposure Times</DialogTitle>
      </DialogHeader>

      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>
          On NightSky Companion, we provide two baseline values for each object:{" "}
          <span className="text-accent font-medium">Fast Capture</span> and{" "}
          <span className="text-primary font-medium">Deep Imaging</span>. These are not absolute rules, but mathematical guides to help you plan your session.
        </p>

        <div>
          <h3 className="text-foreground font-semibold mb-1">1. The "Rule of 500" for Deep Sky</h3>
          <p>
            Just like the "Rule of 500" used in wide-field Milky Way photography, our calculator provides a baseline. It is a heuristic tool designed to give you a high signal-to-noise ratio under specific conditions.
          </p>
        </div>

        <div>
          <h3 className="text-foreground font-semibold mb-1">2. The Science Behind the Numbers</h3>
          <p>
            Our formula uses <span className="text-foreground font-medium">Pogson's Ratio</span>. In astronomy, a difference of 1 magnitude equals a brightness factor of 2.512.
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
            <li><span className="text-foreground">Baseline:</span> Calculations assume a pristine Bortle 1 sky (Zénith SB 22.0).</li>
            <li><span className="text-foreground">Synthetic Surface Brightness:</span> For objects missing native data, we calculate brightness based on their angular size to ensure the estimates remain realistic for large, diffused targets like the Orion Nebula or the Triangulum Galaxy.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-foreground font-semibold mb-1">3. Why 30 Minutes Can Look Great</h3>
          <p>You might find that with only 30 minutes on a bright target like M42, you already get a stunning image.</p>
          <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
            <li><span className="text-accent font-medium">Fast Capture:</span> Enough to reveal the main structure and colors. Perfect for social media or quick sessions.</li>
            <li><span className="text-primary font-medium">Deep Imaging:</span> The time required to reveal faint outer dust, minimize background grain, and allow for professional-level post-processing.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-foreground font-semibold mb-1">4. Adjusting for Your Location</h3>
          <p className="mb-2">Since our guide assumes a perfect dark sky, you must apply a multiplier based on your local light pollution (Bortle Scale):</p>
          <div className="rounded-lg overflow-hidden border border-border/30">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="px-3 py-2 text-left text-foreground">Bortle</th>
                  <th className="px-3 py-2 text-left text-foreground">Environment</th>
                  <th className="px-3 py-2 text-right text-foreground">Multiplier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                <tr><td className="px-3 py-1.5">1–2</td><td className="px-3 py-1.5">Excellent (Mountains)</td><td className="px-3 py-1.5 text-right font-mono text-accent">×1</td></tr>
                <tr><td className="px-3 py-1.5">3–4</td><td className="px-3 py-1.5">Rural / Countryside</td><td className="px-3 py-1.5 text-right font-mono text-primary">×2</td></tr>
                <tr><td className="px-3 py-1.5">5–6</td><td className="px-3 py-1.5">Suburban</td><td className="px-3 py-1.5 text-right font-mono text-orange-400">×4</td></tr>
                <tr><td className="px-3 py-1.5">7–8+</td><td className="px-3 py-1.5">Urban / City</td><td className="px-3 py-1.5 text-right font-mono text-destructive">×10</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export default ExposureGuideModal;
