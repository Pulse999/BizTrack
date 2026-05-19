import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiPost } from "@/services/api";

interface Props {
  videoId: number;
  open: boolean;
  onClose: () => void;
  onAdded: (quiz: any) => void;
}

export default function AddQuizDialog({ videoId, open, onClose, onAdded }: Props) {
  const [title, setTitle] = useState("");
  const [passingScore, setPassingScore] = useState(80);

  const handleSubmit = async () => {
    if (!title) return;

    try {
      const data = await apiPost(`/api/content/videos/${videoId}/quiz`, {
        title,
        passing_score: passingScore,
      });

      if (data.success) {
        onAdded(data.quiz);
        setTitle("");
        setPassingScore(80);
        onClose();
      }
    } catch (err) {
      console.error("Error adding quiz:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Quiz to Video</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Quiz Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Example: Safety Knowledge Quiz" />
          </div>

          <div>
            <Label>Passing Score (%)</Label>
            <Input type="number" value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Add Quiz</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
