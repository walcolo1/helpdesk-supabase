"use client";

import { createTicket } from "@/actions/tickets";
import Link from "next/link";
import { useState } from "react";
import { useFormStatus, useFormState } from "react-dom";
import { Category, Service } from "@prisma/client";
import { AlertCircle, Loader2, Save } from "lucide-react";

interface TicketFormProps {
  categories: Category[];
  services: Service[];
}

export function TicketForm({ categories, services }: TicketFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [state, formAction] = useFormState(createTicket, null);

  const filteredServices = services.filter(
    (service) => service.categoryId === selectedCategory
  );

  return (
    <form action={formAction} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {state?.error && (
        <div className="p-4 bg-red-50 border-b border-red-100 flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle size={18} />
          <p>{state.error}</p>
        </div>
      )}
      <div className="p-6 md:p-8 space-y-6">
        <div className="space-y-2">
          <label htmlFor="subject" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Asunto
          </label>
          <input 
            type="text" 
            id="subject" 
            name="subject" 
            placeholder="Breve resumen del problema"
            required 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Descripción Detallada
          </label>
          <textarea 
            id="description" 
            name="description" 
            rows={5} 
            placeholder="Describe el problema con el mayor nivel de detalle posible..."
            required 
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="categoryId" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Categoría
            </label>
            <select 
              id="categoryId" 
              name="categoryId" 
              required
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="" disabled>Seleccione una categoría</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="serviceId" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Servicio
            </label>
            <select 
              id="serviceId" 
              name="serviceId" 
              required 
              defaultValue=""
              disabled={!selectedCategory}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="" disabled>Seleccione un servicio</option>
              {filteredServices.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="priority" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Prioridad
          </label>
          <select 
            id="priority" 
            name="priority" 
            required 
            defaultValue="medium"
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
            <option value="critical">Crítica</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="attachments" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Archivos Adjuntos
          </label>
          <input 
            type="file" 
            id="attachments" 
            name="attachments" 
            multiple
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
          />
          <p className="text-xs text-gray-500">Puedes seleccionar uno o varios archivos (Máx. 10MB por archivo)</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 p-6 bg-gray-50 border-t border-gray-100">
        <Link 
          href="/dashboard/tickets" 
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
        >
          Cancelar
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button 
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gray-900 text-white hover:bg-gray-900/90 h-10 px-4 py-2"
    >
      {pending ? (
        <>
          <Loader2 className="animate-spin" size={18} />
          Guardando...
        </>
      ) : (
        <>
          <Save size={18} />
          Guardar Ticket
        </>
      )}
    </button>
  );
}
