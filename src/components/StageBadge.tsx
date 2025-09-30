import stages from "@/config/stages.json";
import { cn } from "@/lib/cn";

type Props = {
  stage?: string | null;
  className?: string;
};

type StageConfig = { key: string; short: string; color: string; label: string };

const stageList = stages as StageConfig[];

export function StageBadge({ stage, className }: Props) {
  if (!stage) return null;
  const config = stageList.find(item => item.key === stage);
  if (!config) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide",
        className,
      )}
      style={{ backgroundColor: config.color + "22", color: config.color }}
      title={config.label}
    >
      {config.short}
    </span>
  );
}
