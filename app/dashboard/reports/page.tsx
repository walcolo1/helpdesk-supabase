import { getDashboardMetrics } from "@/actions/reports";
import { MetricCard } from "@/components/reports/metric-card";
import { DistributionChart } from "@/components/reports/distribution-chart";
import { ReportFilters } from "@/components/reports/report-filters";
import { ExportButton } from "@/components/export-button";
import { 
  Ticket, 
  CircleDot, 
  CheckCircle, 
  Clock, 
  ShieldCheck,
  BarChart3
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams
}: {
  searchParams: { from?: string; to?: string };
}) {
  const startDate = searchParams.from ? new Date(searchParams.from) : undefined;
  const endDate = searchParams.to ? new Date(searchParams.to) : undefined;

  const metrics = await getDashboardMetrics(startDate, endDate);

  return (
    <div className="flex flex-col gap-8 p-1 sm:p-4 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <BarChart3 className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wider">Métricas &amp; Analytics</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Panel de Desempeño
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Visualiza el estado real del soporte técnico y el cumplimiento de SLAs.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-1">
          <ExportButton 
            type="tickets" 
            label="Exportar Tickets"
            params={{ from: searchParams.from ?? "", to: searchParams.to ?? "" }}
          />
          <ExportButton 
            type="metrics"
            label="Exportar Métricas"
            params={{ from: searchParams.from ?? "", to: searchParams.to ?? "" }}
            variant="default"
          />
        </div>
      </div>

      {/* Filters */}
      <ReportFilters />

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Tickets" 
          value={metrics.totalTickets} 
          icon={Ticket} 
          colorClass="text-indigo-600" 
          description="Tickets en el periodo"
        />
        <MetricCard 
          title="En Proceso" 
          value={metrics.openTickets} 
          icon={CircleDot} 
          colorClass="text-amber-500" 
          description="Abiertos o en progreso"
        />
        <MetricCard 
          title="Resueltos/Cerrados" 
          value={metrics.resolvedTickets + metrics.closedTickets} 
          icon={CheckCircle} 
          colorClass="text-emerald-500" 
          description="Finalizados exitosamente"
        />
        <MetricCard 
          title="Cumplimiento SLA" 
          value={`${metrics.slaComplianceRate.toFixed(1)}%`} 
          icon={ShieldCheck} 
          colorClass="text-blue-600" 
          description={`${metrics.slaBreached} tickets vencidos`}
        />
      </div>

      {/* Distribution Section 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DistributionChart 
          title="Distribución por Estado" 
          data={metrics.statusDistribution} 
          colorScheme="indigo" 
        />
        <DistributionChart 
          title="Prioridad de Atención" 
          data={metrics.priorityDistribution} 
          colorScheme="rose" 
        />
      </div>

      {/* Second Row of Metrics & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <DistributionChart 
            title="Tickets por Categoría" 
            data={metrics.categoryDistribution} 
            colorScheme="emerald" 
          />
          <DistributionChart 
            title="Tickets por Agente" 
            data={metrics.agentDistribution} 
            colorScheme="indigo" 
          />
        </div>
        <div className="flex flex-col gap-6">
          <MetricCard 
            title="Promedio Resolución" 
            value={`${metrics.avgResolutionTime.toFixed(1)}h`} 
            icon={Clock} 
            colorClass="text-purple-600" 
            description="Tiempo desde apertura a resolución"
          />
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <ShieldCheck className="w-8 h-8 opacity-50" />
              <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded">SLA</span>
            </div>
            <h3 className="text-xl font-bold mb-1">Status de Servicio</h3>
            <p className="text-indigo-100 text-sm mb-4">Eficiencia operativa actual</p>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span>Cumplimiento</span>
                  <span>{metrics.slaComplianceRate.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full bg-white/20 rounded-full">
                  <div 
                    className="h-full bg-white rounded-full" 
                    style={{ width: `${metrics.slaComplianceRate}%` }} 
                  />
                </div>
              </div>
              <p className="text-[10px] text-indigo-200">
                * Calculado sobre {metrics.totalTickets} tickets totales.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
