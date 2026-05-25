"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { UserCreateModal } from "./user-create-modal";

export function UsersClientControls() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      <button 
        onClick={() => setShowCreateModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
      >
        <UserPlus size={16} />
        <span>Crear Usuario</span>
      </button>

      {showCreateModal && <UserCreateModal onClose={() => setShowCreateModal(false)} />}
    </>
  );
}
