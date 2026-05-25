import { Card } from "@/components";
import { cn } from "@/lib";

export interface ChartPoint {
  key: string;
  label: string;
  value: number;
}

export const AdminChartCard = ({
  title,
  description,
  points,
  accent = "accent"
}: {
  title: string;
  description: string;
  points: ChartPoint[];
  accent?: "accent" | "primary" | "coral";
}) => {
  const maxValue = Math.max(...points.map((point) => point.value), 1);

  return (
    <Card className="space-y-5 bg-surface-elevated/95">
      <div>
        <h3 className="font-display text-2xl text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-4">
        {points.length ? (
          points.map((point) => (
            <div key={point.key} className="space-y-2">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-foreground">{point.label}</span>
                <span className="font-semibold text-foreground">{point.value}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-surface-soft">
                <div
                  className={cn(
                    "h-full rounded-full",
                    accent === "accent" && "bg-accent",
                    accent === "primary" && "bg-primary",
                    accent === "coral" && "bg-coral"
                  )}
                  style={{ width: `${Math.max((point.value / maxValue) * 100, 4)}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No chart data yet.</p>
        )}
      </div>
    </Card>
  );
};
