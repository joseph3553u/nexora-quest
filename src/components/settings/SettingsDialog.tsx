import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme, type Theme } from "@/hooks/use-theme";
import { useGameScores } from "@/hooks/use-game-scores";
import {
  Sun,
  Moon,
  Laptop,
  Volume2,
  RotateCcw,
  ShieldCheck,
  Gamepad2,
  Palette,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme();
  const { resetScores } = useGameScores();
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("civora_sound") !== "false";
  });

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("civora_sound", String(next));
    toast.success(next ? "Game & UI audio effects enabled" : "Game & UI audio effects muted");
  };

  const handleResetScores = () => {
    resetScores();
    toast.success("Cognitive scores reset to baseline");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md surface border border-border/80 p-6 shadow-lift rounded-3xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Palette className="size-4" />
            </span>
            <DialogTitle className="font-display text-lg font-bold">
              Settings &amp; Preferences
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Personalize your Civora workspace, appearance, and cognitive game options.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-3">
          {/* Theme Selection */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sun className="size-3.5 text-primary" />
                <span>Interface Theme</span>
              </label>
              <Badge variant="outline" className="text-[10px] font-mono capitalize">
                {theme} Mode
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTheme("light");
                  toast.success("Switched to Light mode");
                }}
                className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-3.5 text-xs font-medium transition-all cursor-pointer ${
                  theme === "light"
                    ? "border-primary bg-primary/15 text-primary shadow-xs font-semibold"
                    : "border-border/70 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sun className="size-4.5" />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheme("dark");
                  toast.success("Switched to Dark mode");
                }}
                className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-3.5 text-xs font-medium transition-all cursor-pointer ${
                  theme === "dark"
                    ? "border-primary bg-primary/15 text-primary shadow-xs font-semibold"
                    : "border-border/70 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Moon className="size-4.5" />
                <span>Dark</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheme("system");
                  toast.success("Theme synced to system");
                }}
                className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-3.5 text-xs font-medium transition-all cursor-pointer ${
                  theme === "system"
                    ? "border-primary bg-primary/15 text-primary shadow-xs font-semibold"
                    : "border-border/70 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Laptop className="size-4.5" />
                <span>System</span>
              </button>
            </div>
          </div>

          {/* Sound & Audio Effects */}
          <div className="flex items-center justify-between rounded-2xl border border-border/70 p-3.5 bg-muted/20">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Volume2 className="size-3.5 text-primary" />
                <span>Brain Game Audio Effects</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Synthesizer audio cues for chess moves, word tiles, and memory matrix.
              </p>
            </div>
            <Button
              type="button"
              variant={soundEnabled ? "default" : "outline"}
              size="sm"
              onClick={toggleSound}
              className="h-8 text-xs font-semibold cursor-pointer shrink-0"
            >
              {soundEnabled ? "Enabled" : "Muted"}
            </Button>
          </div>

          {/* Cognitive Scores Management */}
          <div className="flex items-center justify-between rounded-2xl border border-border/70 p-3.5 bg-muted/20">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Gamepad2 className="size-3.5 text-primary" />
                <span>Cognitive Game Scores</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Reset your offline Chess ELO, Word Puzzle streak, and Memory matrix score.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetScores}
              className="h-8 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40 cursor-pointer shrink-0 gap-1.5"
            >
              <RotateCcw className="size-3" />
              <span>Reset</span>
            </Button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-3 text-emerald-500" />
              <span>Settings stored locally &amp; securely</span>
            </span>
            <Button
              type="button"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 rounded-xl font-semibold"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
