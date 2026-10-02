import type { Opportunity } from "@/data/demo";
import { openCivoraAiChat } from "@/components/ai/CivoraAiChat";
import { toast } from "sonner";

export interface SkillGapDetail {
  skill: string;
  current: number;
  gap: number;
  level: "Strong" | "Moderate" | "Needs Prep";
  description: string;
}

export interface EligibilityAnalysis {
  matchPercent: number;
  gapPercent: number;
  skillsGaps: SkillGapDetail[];
  primaryGaps: SkillGapDetail[];
  prompt: string;
}

export function calculateSkillGap(opp: Opportunity): EligibilityAnalysis {
  const matchPercent = opp.overallMatch ?? 78;
  const gapPercent = Math.max(0, 100 - matchPercent);

  const skillsGaps: SkillGapDetail[] = (opp.skillsBreakdown ?? []).map((s) => ({
    skill: s.skill,
    current: s.percentage,
    gap: Math.max(0, 100 - s.percentage),
    level: s.level,
    description: s.description,
  }));

  const primaryGaps = skillsGaps.filter((s) => s.gap > 0).sort((a, b) => b.gap - a.gap);

  const prompt = `I want to improve my eligibility for the "${opp.role}" role at ${opp.org}.

Based on the Eligibility Checker:
• Current Capability Score: ${matchPercent}%
• Overall Skill Gap: ${gapPercent}%
• Specific Skill Gap Percentages:
${
  primaryGaps.length > 0
    ? primaryGaps
        .map(
          (s) => `  - ${s.skill}: ${s.gap}% gap remaining (currently evaluated at ${s.current}%)`,
        )
        .join("\n")
    : "  - Minor domain refinements and interview practice"
}

Please provide a personalized, high-yield learning and project roadmap to help me bridge this ${gapPercent}% skill gap and reach 100% eligibility. Include:
1. Targeted technical concepts to study first to close the biggest skill gaps.
2. A concrete proof-of-work project to build and publish on GitHub.
3. Common technical screening and interview questions expected for this role at ${opp.org}.`;

  return {
    matchPercent,
    gapPercent,
    skillsGaps,
    primaryGaps,
    prompt,
  };
}

export function triggerImproveEligibility(opp: Opportunity) {
  const { gapPercent, prompt } = calculateSkillGap(opp);
  toast.success(`Opening AI roadmap to bridge your ${gapPercent}% skill gap for ${opp.role}`);
  openCivoraAiChat(prompt);
}
