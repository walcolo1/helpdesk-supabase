"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportButtonProps {
  type: "tickets" | "metrics";
  label?: string;
  params?: Record<string, string>;
  variant?: "default" | "outline" | "ghost";
}

export function ExportButton({ type, label, params = {}, variant = "outline" }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ""))
      ).toString();
      const url = `/api/export/${type}${query ? `?${query}` : ""}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al exportar");

      const blob = await res.blob();
      const filename = res.headers.get("Content-Disposition")
        ?.split("filename=")[1]
        ?.replace(/"/g, "") ?? `${type}.csv`;

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={loading}
      variant={variant}
      size="sm"
      className="gap-2 h-9"
    >
      {loading
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : <Download className="w-4 h-4" />
      }
      {label ?? (type === "tickets" ? "Exportar Tickets" : "Exportar Métricas")}
    </Button>
  );
}
