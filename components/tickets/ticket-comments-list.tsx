import { TicketDetail } from "@/actions/tickets";
import { User, Lock, Clock } from "lucide-react";

type Comment = NonNullable<TicketDetail>["comments"][0];

interface TicketCommentsListProps {
  comments: Comment[];
  currentUserId: string | undefined;
}

export function TicketCommentsList({ comments, currentUserId }: TicketCommentsListProps) {
  if (!comments || comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <p className="text-sm text-gray-400">No hay comentarios aún.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Comentarios</h3>
      <div className="flex flex-col gap-4">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className={`flex flex-col gap-2 p-4 rounded-xl border ${
              comment.isInternal
                ? "bg-amber-50 border-amber-100 shadow-sm"
                : "bg-white border-gray-100 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                  {comment.user.image ? (
                    <img src={comment.user.image} alt={comment.user.name} className="h-full w-full object-cover" />
                  ) : (
                    <User size={16} className="text-gray-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {comment.user.name}
                    {comment.userId === currentUserId && (
                      <span className="ml-2 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase">Tú</span>
                    )}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">
                    {comment.user.role === 'admin' ? 'Administrador' : comment.user.role === 'agent' ? 'Agente' : 'Usuario'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {comment.isInternal && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 uppercase">
                    <Lock size={10} />
                    Interno
                  </span>
                )}
                <span className="flex items-center gap-1 text-[10px] text-gray-400 whitespace-nowrap">
                  <Clock size={10} />
                  {new Intl.DateTimeFormat("es-ES", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(comment.createdAt))}
                </span>
              </div>
            </div>
            
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap pl-10">
              {comment.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
