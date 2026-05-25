import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = date.getTime() - now.getTime();
  const diffInMinutes = Math.round(diffInMs / 60000);
  const diffInHours = Math.round(diffInMs / 3600000);
  const diffInDays = Math.round(diffInMs / 86400000);

  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

  if (Math.abs(diffInMinutes) < 1) return "ahora mismo";
  if (Math.abs(diffInMinutes) < 60) return rtf.format(diffInMinutes, 'minute');
  if (Math.abs(diffInHours) < 24) return rtf.format(diffInHours, 'hour');
  return rtf.format(diffInDays, 'day');
}

interface TicketSLABadgeProps {
  slaDeadline: Date | null;
  resolvedAt: Date | null;
  status: string;
}

export function TicketSLABadge({ slaDeadline, resolvedAt, status }: TicketSLABadgeProps) {
  if (!slaDeadline) return null;

  const now = new Date();
  const isResolved = status === "resolved" || status === "closed";
  const completionDate = resolvedAt || now;
  
  const isBreached = completionDate > slaDeadline;
  
  if (isResolved) {
    return (
      <Badge variant={isBreached ? "destructive" : "outline"} className={!isBreached ? "border-green-500 text-green-600 bg-green-50" : ""}>
        {isBreached ? (
          <><AlertTriangle className="w-3 h-3 mr-1" /> SLA Incumplido</>
        ) : (
          <><CheckCircle2 className="w-3 h-3 mr-1" /> SLA Cumplido</>
        )}
      </Badge>
    );
  }

  const timeLeft = formatRelativeTime(slaDeadline);
  
  return (
    <Badge variant={isBreached ? "destructive" : "secondary"} className="flex items-center gap-1">
      <Clock className="w-3 h-3" />
      {isBreached ? `Vencido ${timeLeft}` : `Vence ${timeLeft}`}
    </Badge>
  );
}
