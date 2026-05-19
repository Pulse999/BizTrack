// frontend/src/components/modals/EditCourseModal.tsx
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

export interface EditCourseModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;

  courseEditForm: {
    id: number;
    title: string;
    description: string;
    difficulty_level: string;
    image_url: string;
  };

  setCourseEditForm: React.Dispatch<
    React.SetStateAction<{
      id: number;
      title: string;
      description: string;
      difficulty_level: string;
      image_url: string;
    }>
  >;

  modalError: string | null;
  modalLoading: boolean;

  runModalAction: (fn: () => Promise<void>) => Promise<void>;
  submitEditCourse: () => Promise<void>;

  handleImageUpload: (file: File) => Promise<string | null>;
}

const EditCourseModal: React.FC<EditCourseModalProps> = ({
  open,
  setOpen,
  courseEditForm,
  setCourseEditForm,
  modalError,
  modalLoading,
  runModalAction,
  submitEditCourse,
  handleImageUpload,
}) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Course</DialogTitle>
        </DialogHeader>

        {modalError && (
          <div className="text-red-600 text-sm mb-2">{modalError}</div>
        )}

        <div className="space-y-3">
          {/* Title */}
          <Label>Title</Label>
          <Input
            value={courseEditForm.title}
            onChange={(e) =>
              setCourseEditForm({
                ...courseEditForm,
                title: e.target.value,
              })
            }
            disabled={modalLoading}
          />

          {/* Description */}
          <Label>Description</Label>
          <Input
            value={courseEditForm.description}
            onChange={(e) =>
              setCourseEditForm({
                ...courseEditForm,
                description: e.target.value,
              })
            }
            disabled={modalLoading}
          />

          {/* Difficulty */}
          <Label>Difficulty</Label>
          <select
            className="border rounded p-2 w-full"
            value={courseEditForm.difficulty_level}
            onChange={(e) =>
              setCourseEditForm({
                ...courseEditForm,
                difficulty_level: e.target.value,
              })
            }
            disabled={modalLoading}
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>

          {/* Image */}
          <Label>Image (optional)</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              const url = await handleImageUpload(file);
              if (url) {
                setCourseEditForm({
                  ...courseEditForm,
                  image_url: url,
                });
              }
            }}
            disabled={modalLoading}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={modalLoading}
          >
            Cancel
          </Button>

          <Button
            onClick={() => runModalAction(submitEditCourse)}
            disabled={modalLoading}
          >
            {modalLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditCourseModal;
