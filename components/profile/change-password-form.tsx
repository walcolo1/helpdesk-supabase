"use client";

import { useFormState, useFormStatus } from "react-dom";
import { changeUserPassword } from "@/actions/profile";
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";

const inputClass =
  "flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm " +
  "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1 " +
  "disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

function PasswordInput({
  id,
  name,
  placeholder,
}: {
  id: string;
  name: string;
  placeholder: string;
}) {
  const [show, setShow] = useState(false);
  const { pending } = useFormStatus();
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        required
        disabled={pending}
        className={`${inputClass} pr-10`}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        tabIndex={-1}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

const initialState: { error?: string; success?: string } = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <div className="flex justify-end pt-2">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 h-10 px-5 rounded-md text-sm font-medium bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Guardando...
          </>
        ) : (
          <>
            <KeyRound size={14} />
            Actualizar Contraseña
          </>
        )}
      </button>
    </div>
  );
}

export function ChangePasswordForm() {
  const [state, formAction] = useFormState(changeUserPassword, initialState);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
          <KeyRound size={18} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">Cambiar Contraseña</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Debes conocer tu contraseña actual para poder cambiarla.
          </p>
        </div>
      </div>

      {/* Form */}
      <form action={formAction} className="p-6 space-y-5">
        {/* Estado de éxito */}
        {state?.success && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm">
            <CheckCircle2 size={16} className="shrink-0" />
            {state.success}
          </div>
        )}

        {/* Estado de error */}
        {state?.error && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            {state.error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
            Contraseña Actual
          </label>
          <PasswordInput
            id="currentPassword"
            name="currentPassword"
            placeholder="Tu contraseña actual"
          />
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
              Nueva Contraseña
            </label>
            <PasswordInput
              id="newPassword"
              name="newPassword"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              Confirmar Nueva Contraseña
            </label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Repite la nueva contraseña"
            />
          </div>
        </div>

        <SubmitButton />
      </form>
    </div>
  );
}
