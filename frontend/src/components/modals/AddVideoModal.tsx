// src/components/modals/AddVideoModal.tsx
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

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  videoForm: { title: string; description: string; video_url: string };
  setVideoForm: (v: any) => void;

  modalLoading: boolean;
  modalError: string | null;

  onSubmit: () => Promise<void>; // wrapped with runModalAction in parent
};

const AddVideoModal = ({
  open,
  onOpenChange,
  videoForm,
  setVideoForm,
  modalLoading,
  modalError,
  onSubmit,
}: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Video</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {modalError && (
            <p className="text-red-600 text-sm">{modalError}</p>
          )}

          <div>
            <Label>Title</Label>
            <Input
              value={videoForm.title}
              onChange={(e) =>
                setVideoForm({ ...videoForm, title: e.target.value })
              }
              disabled={modalLoading}
            />
          </div>

          <div>
            <Label>Description (optional)</Label>
            <Input
              value={videoForm.description}
              onChange={(e) =>
                setVideoForm({ ...videoForm, description: e.target.value })
              }
              disabled={modalLoading}
            />
          </div>

          <div>
            <Label>Video URL</Label>
            <Input
              value={videoForm.video_url}
              onChange={(e) =>
                setVideoForm({ ...videoForm, video_url: e.target.value })
              }
              disabled={modalLoading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={modalLoading}
          >
            Cancel
          </Button>

          <Button
            onClick={onSubmit}
            disabled={modalLoading}
          >
            {modalLoading ? "Saving..." : "Add Video"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddVideoModal;
