import { Progress } from "@/components/ui/progress";
import { Trophy } from "lucide-react";

interface XPProgressProps {
  currentXP: number;
  level: number;
}

export const XPProgress = ({ currentXP, level }: XPProgressProps) => {
  const xpForCurrentLevel = (level - 1) * 100;
  const xpForNextLevel = level * 100;
  const progressInLevel = currentXP - xpForCurrentLevel;
  const progressPercent = (progressInLevel / 100) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <span className="font-semibold text-lg">Level {level}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {progressInLevel} / 100 XP
        </span>
      </div>
      <Progress value={progressPercent} className="h-2" />
      <p className="text-xs text-muted-foreground">
        {100 - progressInLevel} XP until Level {level + 1}
      </p>
    </div>
  );
};
