"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createResource } from "@/actions/resources";
import { Upload, FilePlus, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useRef } from "react";

const initialState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 h-10 px-5 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Subiendo...
        </>
      ) : (
        <>
          <Upload size={16} />
          Subir Recurso
        </>
      )}
    </button>
  );
}

export function ResourceUploadForm() {
  const [state, formAction] = useFormState(createResource, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  if (state?.success && formRef.current) {
    formRef.current.reset();
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
          <FilePlus size={18} />
        </div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Nuevo Recurso</h2>
      </div>

      <form action={formAction} ref={formRef} className="p-6 space-y-5">
        {state?.success && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm">
            <CheckCircle2 size={16} className="shrink-0" />
            {state.success}
          </div>
        )}

        {state?.error && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            {state.error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Título
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="Ej. Manual de Onboarding"
            className="flex h-10 w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Descripción <span className="text-gray-400 font-normal">(Opcional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            placeholder="Breve descripción del documento..."
            className="flex w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="file" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Archivo
          </label>
          <input
            id="file"
            name="file"
            type="file"
            required
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg"
            className="flex w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer dark:file:bg-indigo-900/30 dark:file:text-indigo-400 dark:hover:file:bg-indigo-900/50 transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1">
            Max 10 MB. Formatos permitidos: PDF, Word, Excel, CSV, Imágenes.
          </p>
        </div>

        <div className="pt-2 flex justify-end">
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
