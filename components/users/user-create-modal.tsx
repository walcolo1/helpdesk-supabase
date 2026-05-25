"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createUser } from "@/actions/users";
import { UserPlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const initialState: { error?: string; success?: string } = {};

export function UserCreateModal({ onClose }: { onClose: () => void }) {
  const [state, formAction] = useFormState(createUser, initialState);

  if (state?.success) {
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-xl w-full max-w-md border border-gray-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <UserPlus size={20} className="text-indigo-600" />
            Crear Nuevo Usuario
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form action={formAction} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {state?.error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
              {state.error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Nombre Completo</label>
            <input required type="text" name="name" className="w-full h-10 px-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej: Juan Pérez" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Correo Electrónico</label>
            <input required type="email" name="email" className="w-full h-10 px-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="ejemplo@empresa.com" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Rol</label>
            <select name="role" required className="w-full h-10 px-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="user">Usuario Final</option>
              <option value="agent">Agente</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Departamento (Opcional)</label>
            <input type="text" name="department" className="w-full h-10 px-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej: IT, RRHH" />
          </div>

          <div className="border-t border-gray-100 pt-4 mt-2">
            <label className="text-sm font-medium text-gray-700 block mb-1">Contraseña Temporal</label>
            <input required type="text" name="password" minLength={6} className="w-full h-10 px-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Mínimo 6 caracteres" />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input type="checkbox" id="createMustChangePassword" name="mustChangePassword" defaultChecked className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
            <label htmlFor="createMustChangePassword" className="text-sm text-gray-600">
              Requerir cambio de contraseña al primer ingreso
            </label>
          </div>

          <div className="border-t border-gray-100 pt-4 mt-2">
            <label className="text-sm font-medium text-gray-700 block mb-1">Fecha de Vencimiento (Opcional)</label>
            <input type="date" name="expiresAt" className="w-full h-10 px-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <p className="text-xs text-gray-500 mt-1">Si se deja en blanco, el acceso no expirará automáticamente.</p>
          </div>

          <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-950 pb-2 border-t mt-4 border-gray-100">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
      {pending ? <><Loader2 size={16} className="mr-2 animate-spin" /> Creando...</> : "Crear Usuario"}
    </Button>
  );
}
