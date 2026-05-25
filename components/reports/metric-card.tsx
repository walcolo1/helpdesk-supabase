import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  colorClass?: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
}

export function MetricCard({ title, value, description, icon: Icon, colorClass = "text-gray-600" }: MetricCardProps) {
  return (
    <Card className="overflow-hidden border-none shadow-md bg-white dark:bg-slate-950 transition-all hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${colorClass.replace("text-", "bg-").replace("600", "50").replace("500", "50")} dark:bg-opacity-10`}>
          <Icon className={`h-4 w-4 ${colorClass}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {description && (
          <p className="text-xs text-gray-400 mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
