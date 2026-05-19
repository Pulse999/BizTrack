import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiPost } from "@/services/api";

interface Props {
  questionId: number;
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddAnswerDialog({ questionId, open, onClose, onAdded }: Props) {
  const [text, setText] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    try {
      await apiPost(`/api/content/questions/${questionId}/answers`, {
        text,
        is_correct: isCorrect,
      });
      onAdded();
      onClose();
      setText("");
      setIsCorrect(false);
    } catch (err) {
      console.error("Error adding answer:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Answer</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Answer Text</Label>
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type answer text" />
          </div>

          <div>
            <Label>Correct?</Label>
            <Button variant={isCorrect ? "default" : "outline"} onClick={() => setIsCorrect(!isCorrect)}>
              {isCorrect ? "Correct Answer" : "Mark as Correct"}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Add Answer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
