import { Sparkles, MapPin, Building, CheckCircle2, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  calculateSkillGap,
  triggerImproveEligibility,
} from "@/components/opportunities/opportunity-eligibility";
import type { Opportunity } from "@/data/demo";
import { toast } from "sonner";

interface OpportunityDetailDialogProps {
  opportunity: Opportunity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OpportunityDetailDialog({
  opportunity,
  open,
  onOpenChange,
}: OpportunityDetailDialogProps) {
  if (!opportunity) return null;

  const analysis = calculateSkillGap(opportunity);
  const { matchPercent, gapPercent, skillsGaps } = analysis;

  const matchColor =
    matchPercent >= 80
      ? "text-emerald-500"
      : matchPercent >= 70
        ? "text-primary"
        : "text-amber-500";

  function handleImproveEligibility() {
    if (!opportunity) return;
    onOpenChange(false);
    triggerImproveEligibility(opportunity);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-6 sm:p-7">
        <DialogHeader className="space-y-2 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{opportunity.type}</Badge>
            <Badge variant="outline" className="border-primary/30 text-primary">
              {opportunity.stipend}
            </Badge>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-semibold">
            {opportunity.role}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground flex items-center gap-1.5">
              <Building className="size-4 text-primary" /> {opportunity.org}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" /> {opportunity.location}
            </span>
            <span>Posted {opportunity.posted}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Role Overview */}
          {opportunity.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {opportunity.description}
            </p>
          )}

          {/* Overall Match & Skill Gap Card */}
          <div className="rounded-xl border border-primary/20 bg-primary-softer/50 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Eligibility Evaluation
                </span>
                <h4 className="mt-0.5 text-lg font-semibold flex items-center gap-2">
                  Role Readiness: <span className={matchColor}>{matchPercent}% Eligible</span>
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Calculated Skill Gap:{" "}
                  <span className="font-semibold text-foreground">
                    {gapPercent}% to reach 100% eligibility
                  </span>
                </p>
              </div>
              <Badge
                variant="outline"
                className={`self-start sm:self-center font-medium ${
                  matchPercent >= 80
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-primary/40 bg-primary/10 text-primary"
                }`}
              >
                {matchPercent >= 80 ? "Strong Contender" : "Competitive Match"}
              </Badge>
            </div>
            <div className="mt-3">
              <Progress value={matchPercent} className="h-2.5" />
            </div>
          </div>

          {/* Detailed Skill Breakdown with Specific Gap % */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Skills Capability & Gap Breakdown</h4>
              <span className="text-xs text-muted-foreground">
                Evaluated by Eligibility Checker
              </span>
            </div>

            <div className="space-y-3">
              {skillsGaps.map((item) => (
                <div
                  key={item.skill}
                  className="rounded-lg border border-border bg-card/60 p-3.5 transition-colors hover:border-primary/30"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.skill}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs">{item.current}%</span>
                      {item.gap > 0 ? (
                        <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                          {item.gap}% gap
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          100% match
                        </span>
                      )}
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-1.5 py-0 ${
                          item.level === "Strong"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : item.level === "Moderate"
                              ? "bg-primary/15 text-primary"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {item.level}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={item.current} className="mt-2 h-1.5" />
                  <p className="mt-2 text-xs text-muted-foreground leading-normal">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* What to Cover to reach 100% */}
          {opportunity.whatToCoverHighlights && opportunity.whatToCoverHighlights.length > 0 && (
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2.5">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" /> Key Focus Areas to Close the{" "}
                {gapPercent}% Gap
              </h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {opportunity.whatToCoverHighlights.map((topic) => (
                  <li key={topic} className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                className="flex-1 sm:flex-initial border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 gap-1.5 font-medium"
                onClick={handleImproveEligibility}
              >
                <Sparkles className="size-4 text-primary animate-pulse" />
                <span>Improve Eligibility</span>
                <ArrowRight className="size-3.5" />
              </Button>
              <Button
                className="flex-1 sm:flex-initial"
                onClick={() => {
                  toast.success(
                    `Application submitted for ${opportunity.role} at ${opportunity.org}`,
                  );
                  onOpenChange(false);
                }}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
