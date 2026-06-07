"use client";

import { useState, useTransition } from "react";
import { 
  getOldTicketsForCleanup, 
  deleteSelectedTickets, 
  updateStorageQuota 
} from "@/actions/storage";
import { 
  Database, 
  Paperclip, 
  FileText, 
  HardDrive, 
  Search, 
  Trash2, 
  AlertTriangle, 
  Check, 
  Loader2, 
  Info
} from "lucide-react";

interface StorageOverview {
  dbSize: number | null;
  resourcesSize: number;
  attachmentsSize: number;
  totalUsedBytes: number;
  quotaMb: number;
  success: boolean;
}

interface CandidateTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
  attachmentCount: number;
  attachmentSize: number;
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

const statusLabels: Record<string, { label: string; badge: string }> = {
  open:         { label: "Abierto",          badge: "bg-blue-50 text-blue-700 ring-blue-200" },
  in_progress:  { label: "En Progreso",      badge: "bg-amber-50 text-amber-700 ring-amber-200" },
  waiting_user: { label: "Espera Usuario",   badge: "bg-purple-50 text-purple-700 ring-purple-200" },
  resolved:     { label: "Resuelto",         badge: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  tracking:     { label: "Seguimiento",      badge: "bg-teal-50 text-teal-700 ring-teal-200" },
  closed:       { label: "Cerrado",          badge: "bg-gray-50 text-gray-600 ring-gray-200" },
  auto_closed:  { label: "Auto Cerrado",     badge: "bg-gray-50 text-gray-600 ring-gray-200" },
  on_hold:      { label: "En Espera",        badge: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
};

export function StorageClient({
  initialOverview,
  initialCandidates,
}: {
  initialOverview: StorageOverview;
  initialCandidates: CandidateTicket[];
}) {
  const [overview, setOverview] = useState<StorageOverview>(initialOverview);
  const [candidates, setCandidates] = useState<CandidateTicket[]>(initialCandidates);
  
  // Quota form states
  const [quotaInput, setQuotaInput] = useState(overview.quotaMb.toString());
  const [isUpdatingQuota, setIsUpdatingQuota] = useState(false);
  const [quotaMessage, setQuotaMessage] = useState<string | null>(null);

  // Filter states
  const [filterOlderThanOneYear, setFilterOlderThanOneYear] = useState(false);
  const [filterClosed, setFilterClosed] = useState(false);
  const [filterResolved, setFilterResolved] = useState(false);
  const [filterHasAttachments, setFilterHasAttachments] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPendingFilter, startTransitionFilter] = useTransition();

  // Selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Result alert state
  const [deleteResult, setDeleteResult] = useState<{
    success: boolean;
    ticketsDeleted: number;
    attachmentsDeleted: number;
    storageDeleted: number;
    errors: string[] | null;
  } | null>(null);

  // Math helper
  const quotaBytes = overview.quotaMb * 1024 * 1024;
  const usagePercentage = Math.min(100, (overview.totalUsedBytes / quotaBytes) * 100);
  const availableBytes = Math.max(0, quotaBytes - overview.totalUsedBytes);

  // Progress bar colors
  let progressColor = "bg-emerald-500 shadow-emerald-500/20";
  let progressTextClass = "text-emerald-600";
  if (usagePercentage >= 90) {
    progressColor = "bg-rose-500 shadow-rose-500/20 animate-pulse";
    progressTextClass = "text-rose-600 font-bold";
  } else if (usagePercentage >= 70) {
    progressColor = "bg-amber-500 shadow-amber-500/20";
    progressTextClass = "text-amber-600";
  }

  // Quota handler
  const handleUpdateQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingQuota(true);
    setQuotaMessage(null);
    try {
      const quotaNum = parseInt(quotaInput, 10);
      if (isNaN(quotaNum) || quotaNum <= 0) {
        throw new Error("Ingrese una cuota válida en MB.");
      }
      await updateStorageQuota(quotaNum);
      setOverview(prev => ({ ...prev, quotaMb: quotaNum }));
      setQuotaMessage("Cuota actualizada correctamente.");
      setTimeout(() => setQuotaMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || "Error al actualizar la cuota");
    } finally {
      setIsUpdatingQuota(false);
    }
  };

  // Filter application
  const applyFilters = (
    older: boolean, 
    closed: boolean, 
    resolved: boolean, 
    hasAtt: boolean, 
    query: string
  ) => {
    startTransitionFilter(async () => {
      try {
        const data = await getOldTicketsForCleanup({
          olderThanOneYear: older,
          isClosed: closed,
          isResolved: resolved,
          hasAttachments: hasAtt,
          searchQuery: query,
        });
        setCandidates(data);
        setSelectedIds([]); // reset selection
      } catch (err) {
        console.error("Error aplicando filtros:", err);
      }
    });
  };

  const handleFilterToggle = (type: string) => {
    let nextOlder = filterOlderThanOneYear;
    let nextClosed = filterClosed;
    let nextResolved = filterResolved;
    let nextHasAtt = filterHasAttachments;

    if (type === "older") {
      nextOlder = !filterOlderThanOneYear;
      setFilterOlderThanOneYear(nextOlder);
    } else if (type === "closed") {
      nextClosed = !filterClosed;
      setFilterClosed(nextClosed);
      if (nextClosed) {
        nextResolved = false; // mutually exclusive for simplicity
        setFilterResolved(false);
      }
    } else if (type === "resolved") {
      nextResolved = !filterResolved;
      setFilterResolved(nextResolved);
      if (nextResolved) {
        nextClosed = false;
        setFilterClosed(false);
      }
    } else if (type === "attachments") {
      nextHasAtt = !filterHasAttachments;
      setFilterHasAttachments(nextHasAtt);
    }

    applyFilters(nextOlder, nextClosed, nextResolved, nextHasAtt, searchQuery);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(filterOlderThanOneYear, filterClosed, filterResolved, filterHasAttachments, searchQuery);
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(candidates.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  // Deletion logic
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setDeleteResult(null);
    try {
      const result = await deleteSelectedTickets(selectedIds);
      if (result.success) {
        setDeleteResult({
          success: true,
          ticketsDeleted: result.ticketsDeleted || 0,
          attachmentsDeleted: result.attachmentsDeleted || 0,
          storageDeleted: result.storageDeleted || 0,
          errors: result.errors ?? null,
        });

        // Recargar la página para recalcular el almacenamiento y refrescar la tabla
        window.location.reload();
      } else {
        alert(result.error || "Ocurrió un error al eliminar los tickets.");
      }
    } catch (err: any) {
      alert(err.message || "Error al eliminar tickets.");
    } finally {
      setIsDeleting(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ── ALERTA DE RESULTADOS DE BORRADO ────────────────────────────── */}
      {deleteResult && (
        <div className={`p-4 rounded-xl border flex flex-col gap-2 shadow-sm ${
          deleteResult.errors 
            ? "bg-amber-50 border-amber-200 text-amber-800" 
            : "bg-emerald-50 border-emerald-200 text-emerald-800"
        }`}>
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
            {deleteResult.errors ? <AlertTriangle size={16} /> : <Check size={16} />}
            {deleteResult.errors ? "Limpieza completada con advertencias" : "Limpieza exitosa de almacenamiento"}
          </div>
          <p className="text-xs">
            Se han eliminado definitivamente <strong>{deleteResult.ticketsDeleted}</strong> tickets y{" "}
            <strong>{deleteResult.attachmentsDeleted}</strong> registros de adjuntos. Se liberaron{" "}
            <strong>{deleteResult.storageDeleted}</strong> archivos de Supabase Storage.
          </p>
          {deleteResult.errors && (
            <div className="mt-2 text-[10px] bg-white/50 p-2 rounded border border-amber-200/50 font-mono">
              <p className="font-bold mb-1">Errores de almacenamiento detectados (revisar consola):</p>
              <ul className="list-disc pl-4 space-y-1">
                {deleteResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── SECCIÓN 1: CONTROLES DE CUOTA Y PROGRESO ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Progress Bar & Summary */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#131b2e] uppercase tracking-wider">Capacidad de Almacenamiento</h2>
            <span className={`text-xs font-bold ${progressTextClass}`}>
              {usagePercentage.toFixed(1)}% Usado
            </span>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden border border-gray-200/50 p-0.5">
            <div 
              className={`h-2.5 rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${usagePercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Usado: <strong>{formatBytes(overview.totalUsedBytes)}</strong></span>
            <span>Disponible aproximado: <strong>{formatBytes(availableBytes)}</strong></span>
            <span>Límite cuota: <strong>{overview.quotaMb} MB</strong></span>
          </div>
        </div>

        {/* Quota Config Form */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between">
          <h2 className="text-xs font-bold text-[#131b2e] uppercase tracking-wider mb-2">Cuota Configurada (Límite)</h2>
          <form onSubmit={handleUpdateQuota} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                value={quotaInput}
                onChange={(e) => setQuotaInput(e.target.value)}
                placeholder="Ej. 500"
                min="1"
                disabled={isUpdatingQuota}
                className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-[#0051d5] focus:border-[#0051d5] font-semibold"
              />
              <span className="absolute right-3 top-2 text-[10px] text-gray-400 font-bold">MB</span>
            </div>
            <button
              type="submit"
              disabled={isUpdatingQuota}
              className="h-9 px-4 rounded-lg bg-[#131b2e] text-white hover:bg-[#25324e] font-bold text-xs uppercase tracking-wider transition-colors shrink-0 disabled:opacity-50 inline-flex items-center justify-center"
            >
              {isUpdatingQuota ? <Loader2 className="animate-spin" size={14} /> : "Definir"}
            </button>
          </form>
          {quotaMessage && (
            <p className="text-[10px] font-bold text-emerald-600 mt-2 flex items-center gap-1">
              <Check size={12} /> {quotaMessage}
            </p>
          )}
          <p className="text-[10px] text-gray-400 mt-3 flex items-start gap-1">
            <Info size={12} className="shrink-0 mt-0.5" />
            <span>Ajusta este límite para estimar la capacidad libre según tu plan de Supabase.</span>
          </p>
        </div>

      </div>

      {/* ── SECCIÓN 2: CARDS VISUALES DE CAPACIDAD DETALLADA ────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Base de datos */}
        <div className="bg-[#f8fafc] border border-gray-200 rounded-xl p-4 shadow-sm flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
            <Database size={18} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Base de Datos</p>
            <p className="text-sm font-black text-[#131b2e] mt-1">
              {overview.dbSize !== null ? formatBytes(overview.dbSize) : "No disponible"}
            </p>
          </div>
        </div>

        {/* Archivos de recursos */}
        <div className="bg-[#f8fafc] border border-gray-200 rounded-xl p-4 shadow-sm flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-teal-50 text-teal-600 shrink-0">
            <FileText size={18} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Recursos Globales</p>
            <p className="text-sm font-black text-[#131b2e] mt-1">{formatBytes(overview.resourcesSize)}</p>
          </div>
        </div>

        {/* Adjuntos de tickets */}
        <div className="bg-[#f8fafc] border border-gray-200 rounded-xl p-4 shadow-sm flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 shrink-0">
            <Paperclip size={18} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Adjuntos Tickets</p>
            <p className="text-sm font-black text-[#131b2e] mt-1">{formatBytes(overview.attachmentsSize)}</p>
          </div>
        </div>

        {/* Total usado */}
        <div className="bg-[#f8fafc] border border-gray-200 rounded-xl p-4 shadow-sm flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
            <HardDrive size={18} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total Usado</p>
            <p className="text-sm font-black text-[#131b2e] mt-1">{formatBytes(overview.totalUsedBytes)}</p>
          </div>
        </div>

        {/* Disponible estimado */}
        <div className="bg-[#f8fafc] border border-gray-200 rounded-xl p-4 shadow-sm flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
            <Check size={18} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Disponible Est.</p>
            <p className="text-sm font-black text-[#131b2e] mt-1">{formatBytes(availableBytes)}</p>
          </div>
        </div>

      </div>

      {/* ── SECCIÓN 3: FILTROS CANDIDATOS DE LIMPIEZA ───────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-[#131b2e]">Tickets Candidatos para Limpieza</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Selecciona manualmente los tickets que deseas eliminar permanentemente del sistema.
            </p>
          </div>

          {/* Botón flotante/acción */}
          {selectedIds.length > 0 && (
            <button
              onClick={() => setShowConfirmModal(true)}
              className="inline-flex items-center gap-2 bg-[#ba1a1a] text-white hover:bg-[#931111] px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors shadow-sm shadow-red-600/10"
            >
              <Trash2 size={14} />
              Eliminar Seleccionados ({selectedIds.length})
            </button>
          )}
        </div>

        {/* Buscador & Checkbox filtros */}
        <div className="flex flex-col gap-4">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center max-w-md w-full">
            <span className="absolute left-3 text-gray-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Buscar por número de ticket (ej. 60001)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-20 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#0051d5]"
            />
            <button
              type="submit"
              className="absolute right-1 h-8 px-4 rounded bg-[#131b2e] hover:bg-[#25324e] text-white text-[10px] font-bold uppercase tracking-wider"
            >
              Filtrar
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-gray-600 select-none">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterOlderThanOneYear}
                onChange={() => handleFilterToggle("older")}
                className="h-4 w-4 rounded border-gray-300 text-[#0051d5] focus:ring-[#0051d5]"
              />
              <span>Mayores a 1 año</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterClosed}
                onChange={() => handleFilterToggle("closed")}
                className="h-4 w-4 rounded border-gray-300 text-[#0051d5] focus:ring-[#0051d5]"
              />
              <span>Cerrados</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterResolved}
                onChange={() => handleFilterToggle("resolved")}
                className="h-4 w-4 rounded border-gray-300 text-[#0051d5] focus:ring-[#0051d5]"
              />
              <span>Resueltos</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterHasAttachments}
                onChange={() => handleFilterToggle("attachments")}
                className="h-4 w-4 rounded border-gray-300 text-[#0051d5] focus:ring-[#0051d5]"
              />
              <span>Con adjuntos</span>
            </label>

            {isPendingFilter && (
              <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5 uppercase animate-pulse">
                <Loader2 size={12} className="animate-spin" /> Cargando lista...
              </span>
            )}
          </div>
        </div>

        {/* ── LISTADO TABLE (DESKTOP) / CARDS (MOBILE) ─────────────────── */}
        {candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <Info className="text-gray-400 mb-2" size={24} />
            <p className="text-sm font-medium text-gray-500">Ningún ticket coincide con los criterios de búsqueda.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-center w-12">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === candidates.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-[#0051d5] focus:ring-[#0051d5]"
                      />
                    </th>
                    <th className="px-4 py-3">Ticket</th>
                    <th className="px-4 py-3">Asunto</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Creado por</th>
                    <th className="px-4 py-3">Fecha Creación</th>
                    <th className="px-4 py-3 text-center">Adjuntos</th>
                    <th className="px-4 py-3 text-right">Peso Adjuntos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {candidates.map((ticket) => {
                    const status = statusLabels[ticket.status] || { label: ticket.status, badge: "bg-gray-100" };
                    return (
                      <tr key={ticket.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(ticket.id)}
                            onChange={(e) => handleSelectRow(ticket.id, e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-[#0051d5] focus:ring-[#0051d5]"
                          />
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-[#131b2e]">
                          {ticket.ticketNumber}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-700 max-w-[200px] truncate" title={ticket.subject}>
                          {ticket.subject}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ring-inset ${status.badge}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 font-semibold">{ticket.creatorName}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(ticket.createdAt))}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-xs text-gray-700">
                          {ticket.attachmentCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                              <Paperclip size={10} /> {ticket.attachmentCount}
                            </span>
                          ) : (
                            <span className="text-gray-400 font-normal">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-bold text-gray-700">
                          {ticket.attachmentSize > 0 ? formatBytes(ticket.attachmentSize) : "0 B"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Lista de tickets</span>
                <label className="flex items-center gap-2 text-xs font-bold text-[#0051d5]">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === candidates.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-gray-300 text-[#0051d5]"
                  />
                  Seleccionar Todo
                </label>
              </div>

              {candidates.map((ticket) => {
                const status = statusLabels[ticket.status] || { label: ticket.status, badge: "bg-gray-100" };
                const isSelected = selectedIds.includes(ticket.id);
                return (
                  <div 
                    key={ticket.id}
                    onClick={() => handleSelectRow(ticket.id, !isSelected)}
                    className={`p-4 border rounded-xl shadow-sm transition-all flex flex-col gap-2.5 active:bg-gray-50 ${
                      isSelected ? "border-[#0051d5] bg-blue-50/10" : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectRow(ticket.id, e.target.checked);
                          }}
                          className="h-4.5 w-4.5 rounded border-gray-300 text-[#0051d5]"
                        />
                        <span className="font-mono font-bold text-sm text-[#131b2e]">{ticket.ticketNumber}</span>
                      </div>
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-[9px] font-bold uppercase ring-1 ring-inset ${status.badge}`}>
                        {status.label}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-gray-700 leading-snug line-clamp-2">{ticket.subject}</p>
                    
                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-semibold mt-1">
                      <span>Autor: {ticket.creatorName}</span>
                      <span>{new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" }).format(new Date(ticket.createdAt))}</span>
                    </div>

                    {ticket.attachmentCount > 0 && (
                      <div className="flex items-center justify-between mt-1 pt-2 border-t border-gray-100 text-[10px] text-gray-500 font-bold">
                        <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                          <Paperclip size={10} /> {ticket.attachmentCount} adjuntos
                        </span>
                        <span className="text-gray-700">{formatBytes(ticket.attachmentSize)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>

      {/* ── MODAL DE CONFIRMACIÓN DE ELIMINACIÓN ────────────────────────── */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 text-[#ba1a1a] mb-4">
                <div className="p-2 rounded-lg bg-red-50 text-red-600">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-base font-black uppercase tracking-tight">Confirmar Eliminación</h3>
              </div>
              
              <p className="text-xs text-gray-600 leading-relaxed">
                Esta acción eliminará definitivamente los <strong>{selectedIds.length}</strong> tickets seleccionados, sus comentarios, historial y adjuntos del almacenamiento físico en Supabase.
              </p>
              
              <div className="mt-3 p-3 bg-red-50 border border-red-100 text-[10px] font-bold text-red-800 rounded-lg">
                ¡Esta acción no se puede deshacer!
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-xs font-bold text-gray-500 hover:text-gray-800 uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 rounded-lg bg-[#ba1a1a] text-white hover:bg-[#931111] font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 inline-flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="animate-spin" size={14} /> Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} /> Sí, eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
