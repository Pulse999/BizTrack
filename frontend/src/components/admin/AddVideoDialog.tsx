import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiPost } from "@/services/api";
import parseYouTube from "@/utils/parseYouTube";

interface Props {
  courseId: number;
  open: boolean;
  onClose: () => void;
  onAdded: (video: any) => void;
}

export default function AddVideoDialog({ courseId, open, onClose, onAdded }: Props) {
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    if (!title || !videoUrl) return;

    // ✅ Convert YouTube link to consistent watch?v= format before saving
    const embedUrl = parseYouTube(videoUrl);
    const cleanedUrl = embedUrl.replace("https://www.youtube.com/embed/", "https://www.youtube.com/watch?v=").replace("?enablejsapi=1", "");

    try {
      const data = await apiPost(`/api/content/courses/${courseId}/videos`, {
        title,
        video_url: cleanedUrl,
        description,
      });

      if (data.success) {
        onAdded(data.video);
        setTitle("");
        setVideoUrl("");
        setDescription("");
        onClose();
      }
    } catch (err) {
      console.error("Error adding video:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Video</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Video Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Example: Safety Overview" />
          </div>

          <div>
            <Label>Video URL (YouTube)</Label>
            <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Paste YouTube link" />
          </div>

          <div>
            <Label>Description (optional)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Add Video</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
