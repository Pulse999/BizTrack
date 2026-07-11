import { useState } from "react";
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
import { apiPost } from "@/services/api";

interface Props {
  quizId: number;
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddQuestionDialog({
  quizId,
  open,
  onClose,
  onAdded,
}: Props) {
  const [text, setText] = useState("");
  const [answers, setAnswers] = useState([
    { text: "", is_correct: true },
    { text: "", is_correct: false },
  ]);

  const setCorrect = (i: number) => {
    setAnswers(answers.map((a, idx) => ({ ...a, is_correct: idx === i })));
  };

  const addAnswer = () => {
    if (answers.length < 4)
      setAnswers([...answers, { text: "", is_correct: false }]);
  };

  const removeAnswer = (i: number) => {
    if (answers.length <= 2) return;
    const updated = answers.filter((_, idx) => idx !== i);
    if (!updated.some((a) => a.is_correct)) updated[0].is_correct = true;
    setAnswers(updated);
  };

  const handleSubmit = async () => {
    const valid = answers.filter((a) => a.text.trim() !== "");
    if (!text || valid.length < 2) return;
    try {
      await apiPost(`/content/quizzes/${quizId}/questions`, {
        text,
        answers: valid,
      });
      onAdded();
      onClose();
      setText("");
      setAnswers([
        { text: "", is_correct: true },
        { text: "", is_correct: false },
      ]);
    } catch (err) {
      console.error("Error adding question:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Question</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Question Text</Label>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type the question"
            />
          </div>

          <div className="space-y-2">
            <Label>Answers (2–4)</Label>
            {answers.map((a, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  className="flex-1"
                  value={a.text}
                  placeholder={`Answer ${i + 1}`}
                  onChange={(e) => {
                    const updated = [...answers];
                    updated[i].text = e.target.value;
                    setAnswers(updated);
                  }}
                />
                <Button
                  variant={a.is_correct ? "default" : "outline"}
                  onClick={() => setCorrect(i)}
                >
                  {a.is_correct ? "Correct" : "Set Correct"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => removeAnswer(i)}
                  disabled={answers.length <= 2}
                >
                  Remove
                </Button>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={addAnswer}
              disabled={answers.length >= 4}
            >
              Add Answer
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Question</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
