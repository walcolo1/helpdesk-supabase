"use client";

import { useState, useTransition } from "react";
import { CategoryList } from "./category-list";
import { ServiceList } from "./service-list";
import { createCategory, createService } from "@/actions/catalog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function CatalogManager({ categories, services }: { categories: any[], services: any[] }) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(categories[0]?.id || null);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showSvcModal, setShowSvcModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredServices = services.filter(s => s.categoryId === selectedCategoryId);
  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  const handleAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      color: formData.get("color") as string,
    };

    startTransition(async () => {
      await createCategory(data);
      setShowCatModal(false);
    });
  };

  const handleEditCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCategory) return;
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      color: formData.get("color") as string,
    };

    startTransition(async () => {
      import("@/actions/catalog").then(({ updateCategory }) => {
        updateCategory(editingCategory.id, data).then(() => {
          setEditingCategory(null);
        });
      });
    });
  };

  const handleAddService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCategoryId) return;
    const formData = new FormData(e.currentTarget);
    const data = {
      categoryId: selectedCategoryId,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      slaHours: parseInt(formData.get("slaHours") as string),
      defaultPriority: formData.get("priority") as any,
    };

    startTransition(async () => {
      await createService(data);
      setShowSvcModal(false);
    });
  };

  const handleEditService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingService) return;
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      slaHours: parseInt(formData.get("slaHours") as string),
      defaultPriority: formData.get("priority") as any,
    };

    startTransition(async () => {
      import("@/actions/catalog").then(({ updateService }) => {
        updateService(editingService.id, data).then(() => {
          setEditingService(null);
        });
      });
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[calc(100vh-220px)] min-h-[500px]">
      <div className="lg:col-span-1">
        <CategoryList 
          categories={categories} 
          selectedId={selectedCategoryId} 
          onSelect={setSelectedCategoryId}
          onAdd={() => setShowCatModal(true)}
          onEdit={setEditingCategory}
        />
      </div>
      <div className="lg:col-span-2">
        <ServiceList 
          services={filteredServices} 
          categoryId={selectedCategoryId}
          categoryName={selectedCategory?.name}
          onAdd={() => setShowSvcModal(true)}
          onEdit={setEditingService}
        />
      </div>

      {/* Modal Categoría */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold">Nueva Categoría</h3>
              <button onClick={() => setShowCatModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nombre</label>
                <Input name="name" required placeholder="Ej: Hardware, Redes..." />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Color</label>
                <div className="flex gap-2">
                  <Input name="color" type="color" defaultValue="#4f46e5" className="w-12 h-10 p-1" />
                  <Input name="color_text" type="text" placeholder="#000000" className="flex-1" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Descripción</label>
                <Textarea name="description" placeholder="Breve descripción de la categoría..." rows={3} />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setShowCatModal(false)}>Cancelar</Button>
                <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700">Crear Categoría</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Servicio */}
      {showSvcModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold">Nuevo Servicio en {selectedCategory?.name}</h3>
              <button onClick={() => setShowSvcModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddService} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nombre del Servicio</label>
                <Input name="name" required placeholder="Ej: Reparación de Laptop, WiFi Lento..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Horas SLA</label>
                  <Input name="slaHours" type="number" required defaultValue={24} min={1} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Prioridad Base</label>
                  <select name="priority" className="w-full h-10 px-3 py-1 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none">
                    <option value="low">Baja</option>
                    <option value="medium" selected>Media</option>
                    <option value="high">Alta</option>
                    <option value="critical">Crítica</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Descripción</label>
                <Textarea name="description" placeholder="Describe qué incluye este servicio..." rows={3} />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setShowSvcModal(false)}>Cancelar</Button>
                <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700">Crear Servicio</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Categoría */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold">Editar Categoría</h3>
              <button onClick={() => setEditingCategory(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditCategory} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nombre</label>
                <Input name="name" required defaultValue={editingCategory.name} placeholder="Ej: Hardware, Redes..." />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Color</label>
                <div className="flex gap-2">
                  <Input name="color" type="color" defaultValue={editingCategory.color || "#4f46e5"} className="w-12 h-10 p-1" />
                  <Input name="color_text" type="text" placeholder="#000000" defaultValue={editingCategory.color || ""} className="flex-1" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Descripción</label>
                <Textarea name="description" defaultValue={editingCategory.description || ""} placeholder="Breve descripción de la categoría..." rows={3} />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setEditingCategory(null)}>Cancelar</Button>
                <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700">Guardar Cambios</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Servicio */}
      {editingService && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold">Editar Servicio</h3>
              <button onClick={() => setEditingService(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditService} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nombre del Servicio</label>
                <Input name="name" required defaultValue={editingService.name} placeholder="Ej: Reparación de Laptop, WiFi Lento..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Horas SLA</label>
                  <Input name="slaHours" type="number" required defaultValue={editingService.slaHours} min={1} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Prioridad Base</label>
                  <select name="priority" defaultValue={editingService.defaultPriority} className="w-full h-10 px-3 py-1 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none">
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="critical">Crítica</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Descripción</label>
                <Textarea name="description" defaultValue={editingService.description || ""} placeholder="Describe qué incluye este servicio..." rows={3} />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setEditingService(null)}>Cancelar</Button>
                <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700">Guardar Cambios</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
