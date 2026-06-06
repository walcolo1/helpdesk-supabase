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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
      <StatCard 
        title={isAgentOrAdmin ? "Total Histórico" : "Mis Tickets"} 
        value={stats.total} 
        icon={<Ticket size={20} className="text-[#0051d5]" />} 
        bgColor="bg-[#0051d5]/10 border-[#0051d5]/20" 
      />
      <StatCard 
        title="Abiertos" 
        value={stats.open} 
        icon={<FolderOpen size={20} className="text-gray-600" />} 
        bgColor="bg-gray-100 border-gray-200" 
      />
      <StatCard 
        title="En Progreso" 
        value={stats.inProgress} 
        icon={<Clock size={20} className="text-amber-600" />} 
        bgColor="bg-amber-50 border-amber-200" 
      />
      <StatCard 
        title="Críticos" 
        value={stats.critical} 
        icon={<AlertOctagon size={20} className="text-[#ba1a1a]" />} 
        bgColor="bg-red-50 border-red-200" 
      />
      <StatCard 
        title="Resueltos / Cerrados" 
        value={stats.resolvedOrClosed} 
        icon={<CheckCircle2 size={20} className="text-emerald-600" />} 
        bgColor="bg-emerald-50 border-emerald-200" 
      />
    </div>
  );
}

function StatCard({ title, value, icon, bgColor }: { title: string, value: number, icon: React.ReactNode, bgColor: string }) {
  return (
    <div className="bg-white border border-[#c6c6cd] rounded-xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-gray-400 transition-all duration-200 group">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
        <div className={`p-2 rounded-lg border ${bgColor} transition-transform duration-200 group-hover:scale-105`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-[#131b2e] tracking-tight">
        {value}
      </div>
    </div>
  );
}
