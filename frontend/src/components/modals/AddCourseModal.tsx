// frontend/src/components/modals/AddCourseModal.tsx
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { apiPost } from "@/services/api";

export interface AddCourseModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  companyId: number | null; 
  onCreated: (course: any) => void;
  modalError?: string | null;
  modalLoading?: boolean;
  handleImageUpload: (file: File) => Promise<string | null>;
}

const AddCourseModal: React.FC<AddCourseModalProps> = ({
  open,
  setOpen,
  companyId,
  onCreated,
  modalError,
  modalLoading = false,
  handleImageUpload,
}) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    difficulty_level: "Beginner",
    image_url: "",
  });

  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const resetForm = () =>
    setForm({
      title: "",
      description: "",
      difficulty_level: "Beginner",
      image_url: "",
    });

  const submit = async () => {
    setLocalError(null);
    setLocalLoading(true);

    try {
      const payload = {
        title: form.title,
        description: form.description,
        difficulty_level: form.difficulty_level,
        image_url: form.image_url,
        company_id: companyId, // null = general
      };

      // ✔ correct backend route
      const data = await apiPost("/api/courses", payload);

      if (data?.success) {
        onCreated(data.course);
        resetForm();
        setOpen(false);
      } else {
        setLocalError(data?.error || "Failed to create course");
      }
    } catch (err: any) {
      console.error("AddCourse error", err);
      setLocalError(err?.message || "Failed to create course");
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {companyId === null ? "Add General Course" : "Add Company Course"}
          </DialogTitle>
        </DialogHeader>

        {(modalError || localError) && (
          <div className="text-red-600 text-sm mb-2">
            {modalError || localError}
          </div>
        )}

        <div className="space-y-3">
          <Label>Title</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            disabled={modalLoading || localLoading}
          />

          <Label>Description</Label>
          <Input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            disabled={modalLoading || localLoading}
          />

          <Label>Difficulty</Label>
          <select
            className="border rounded p-2 w-full"
            value={form.difficulty_level}
            onChange={(e) =>
              setForm({ ...form, difficulty_level: e.target.value })
            }
            disabled={modalLoading || localLoading}
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>

          <Label>Image (optional)</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const url = await handleImageUpload(file);
                if (url) setForm((s) => ({ ...s, image_url: url }));
              } catch {
                setLocalError("Failed to upload image");
              }
            }}
            disabled={modalLoading || localLoading}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={modalLoading || localLoading}
          >
            Cancel
          </Button>

          <Button onClick={submit} disabled={modalLoading || localLoading}>
            {modalLoading || localLoading ? "Creating..." : "Create Course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCourseModal;
