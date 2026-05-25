"use client";

import { useTransition } from "react";
import { updateCategory, deleteCategory } from "@/actions/catalog";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Plus, Layout } from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  isActive: boolean;
  _count: { services: number };
}

export function CategoryList({ categories, onSelect, selectedId, onAdd, onEdit }: { 
  categories: Category[], 
  onSelect: (id: string) => void, 
  selectedId: string | null,
  onAdd: () => void,
  onEdit: (category: Category) => void
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar la categoría "${name}"? No debe tener servicios asociados.`)) {
      startTransition(async () => {
        try {
          await deleteCategory(id);
        } catch (error: any) {
          alert(error.message);
        }
      });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-900/50">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Layout size={18} className="text-indigo-600" />
          Categorías
        </h3>
        <Button size="sm" onClick={onAdd} className="h-8 px-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus size={16} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {categories.map((cat) => (
          <div 
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
              selectedId === cat.id 
                ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800 border" 
                : "hover:bg-gray-50 dark:hover:bg-slate-900 border border-transparent"
            }`}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: cat.color }}
              />
              <div className="flex flex-col">
                <span className={`text-sm font-semibold ${selectedId === cat.id ? "text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-gray-300"}`}>
                  {cat.name}
                </span>
                <span className="text-[10px] text-gray-500">{cat._count.services} servicios</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600" onClick={(e) => { e.stopPropagation(); onEdit(cat); }}>
                <Edit2 size={14} />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-600" onClick={(e) => { e.stopPropagation(); handleDelete(cat.id, cat.name); }}>
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm">
            No hay categorías creadas.
          </div>
        )}
      </div>
    </div>
  );
}
