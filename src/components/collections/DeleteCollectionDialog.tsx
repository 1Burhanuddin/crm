
import React from "react";

export function DeleteCollectionDialog({
  deleteDialog,
  setDeleteDialog,
  isDeleting,
  performDelete
}: {
  deleteDialog: { id: string; name: string } | null;
  setDeleteDialog: (d: any) => void;
  isDeleting: boolean;
  performDelete: () => void;
}) {
  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center bg-black/30 ${deleteDialog ? "" : "hidden"}`}
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white rounded-lg shadow p-6 min-w-[320px] max-w-[90vw]">
        <h3 className="font-semibold text-lg mb-3">Delete Collection</h3>
        <p>
          Are you sure you want to delete the collection for{" "}
          <span className="font-bold">{deleteDialog?.name}</span>?
        </p>
        <div className="flex gap-3 justify-end mt-5">
          <button
            className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded"
            onClick={() => setDeleteDialog(null)}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
            onClick={performDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
