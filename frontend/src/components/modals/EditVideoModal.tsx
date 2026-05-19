// src/components/modals/EditVideoModal.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditVideoModalProps {
  open: boolean;
  setOpen: (v: boolean) => void;

  videoForm: {
    title: string;
    description?: string;
    video_url: string;
  };
  setVideoForm: (v: any) => void;

  modalError: string | null;
  modalLoading: boolean;

  runModalAction: (fn: () => Promise<void>) => Promise<void>;
  submitEditVideo: () => Promise<void>;
}

const EditVideoModal: React.FC<EditVideoModalProps> = ({
  open,
  setOpen,

  videoForm,
  setVideoForm,

  modalError,
  modalLoading,

  runModalAction,
  submitEditVideo,
}) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Video</DialogTitle>
        </DialogHeader>

        {/* ERROR MESSAGE */}
        {modalError && (
          <div className="text-red-600 text-sm mb-2">{modalError}</div>
        )}

        {/* FORM */}
        <div className="space-y-3">
          <Label>Title</Label>
          <Input
            value={videoForm.title}
            onChange={(e) =>
              setVideoForm({ ...videoForm, title: e.target.value })
            }
          />

          <Label>Description (optional)</Label>
          <Input
            value={videoForm.description}
            onChange={(e) =>
              setVideoForm({ ...videoForm, description: e.target.value })
            }
          />

          <Label>Video URL</Label>
          <Input
            value={videoForm.video_url}
            onChange={(e) =>
              setVideoForm({ ...videoForm, video_url: e.target.value })
            }
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => runModalAction(submitEditVideo)}>
            {modalLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditVideoModal;
