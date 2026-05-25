import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DistributionItem {
  name: string;
  value: number;
}

interface DistributionChartProps {
  title: string;
  data: DistributionItem[];
  colorScheme?: "blue" | "emerald" | "amber" | "rose" | "indigo";
}

const colorMap = {
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  indigo: "bg-indigo-500",
};

const bgMap = {
  blue: "bg-blue-50",
  emerald: "bg-emerald-50",
  amber: "bg-amber-50",
  rose: "bg-rose-50",
  indigo: "bg-indigo-50",
};

export function DistributionChart({ title, data, colorScheme = "blue" }: DistributionChartProps) {
  const total = data.reduce((acc, item) => acc + item.value, 0);

  // Ordenar de mayor a menor
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  return (
    <Card className="border-none shadow-md bg-white dark:bg-slate-950">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No hay datos suficientes</p>
        ) : (
          sortedData.map((item) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={item.name} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="capitalize">{item.name.replace("_", " ")}</span>
                  <span className="text-gray-400">{item.value} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className={`h-2 w-full rounded-full ${bgMap[colorScheme]} dark:bg-slate-900`}>
                  <div 
                    className={`h-full rounded-full ${colorMap[colorScheme]} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
