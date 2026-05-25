import { 
  Ticket, 
  FolderOpen, 
  Clock, 
  AlertOctagon, 
  CheckCircle2 
} from "lucide-react";

interface DashboardStatsProps {
  stats: {
    total: number;
    open: number;
    inProgress: number;
    critical: number;
    resolvedOrClosed: number;
  };
  role: string;
}

export function DashboardStats({ stats, role }: DashboardStatsProps) {
  const isAgentOrAdmin = role === "admin" || role === "agent";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard 
        title={isAgentOrAdmin ? "Total Histórico" : "Mis Tickets"} 
        value={stats.total} 
        icon={<Ticket size={24} className="text-blue-600" />} 
        bgColor="bg-blue-50" 
      />
      <StatCard 
        title="Abiertos" 
        value={stats.open} 
        icon={<FolderOpen size={24} className="text-gray-600" />} 
        bgColor="bg-gray-50" 
      />
      <StatCard 
        title="En Progreso" 
        value={stats.inProgress} 
        icon={<Clock size={24} className="text-amber-600" />} 
        bgColor="bg-amber-50" 
      />
      <StatCard 
        title="Críticos" 
        value={stats.critical} 
        icon={<AlertOctagon size={24} className="text-red-600" />} 
        bgColor="bg-red-50" 
      />
      <StatCard 
        title="Resueltos / Cerrados" 
        value={stats.resolvedOrClosed} 
        icon={<CheckCircle2 size={24} className="text-emerald-600" />} 
        bgColor="bg-emerald-50" 
      />
    </div>
  );
}

function StatCard({ title, value, icon, bgColor }: { title: string, value: number, icon: React.ReactNode, bgColor: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <div className={`p-2 rounded-lg ${bgColor} dark:bg-slate-800`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white">
        {value}
      </div>
    </div>
  );
}
