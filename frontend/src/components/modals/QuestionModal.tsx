// src/components/modals/QuestionModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;

  questionForm: any;
  setQuestionForm: (v: any) => void;

  isEditingQuestion: boolean;
  modalLoading: boolean;
  modalError: string | null;

  setCorrectAnswer: (i: number) => void;
  addAnswerField: () => void;
  removeAnswerField: (i: number) => void;

  runModalAction: (fn: () => Promise<void>) => Promise<void>;
  submitQuestion: () => Promise<void>;
};

const QuestionModal = ({
  open,
  setOpen,
  questionForm,
  setQuestionForm,
  isEditingQuestion,
  modalLoading,
  modalError,
  setCorrectAnswer,
  addAnswerField,
  removeAnswerField,
  runModalAction,
  submitQuestion,
}: Props) => (
  <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEditingQuestion ? "Edit Question" : "Add Question"}</DialogTitle>
      </DialogHeader>

      {modalError && <div className="text-red-600 text-sm mb-2">{modalError}</div>}

      <div className="space-y-3">
        <Label>Question</Label>
        <Input
          value={questionForm.text}
          onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
        />

        <Label>Answers (2–4)</Label>
        {questionForm.answers.map((a: any, idx: number) => (
          <div key={idx} className="flex gap-2">
            <Input
              className="flex-1"
              value={a.text}
              onChange={(e) => {
                const copy = [...questionForm.answers];
                copy[idx].text = e.target.value;
                setQuestionForm({ ...questionForm, answers: copy });
              }}
            />

            <Button
              variant={a.is_correct ? "default" : "outline"}
              onClick={() => setCorrectAnswer(idx)}
            >
              {a.is_correct ? "✓" : "Correct"}
            </Button>

            <Button
              variant="outline"
              disabled={questionForm.answers.length <= 2}
              onClick={() => removeAnswerField(idx)}
            >
              Remove
            </Button>
          </div>
        ))}

        <Button
          variant="outline"
          disabled={questionForm.answers.length >= 4}
          onClick={addAnswerField}
        >
          Add Answer
        </Button>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button onClick={() => runModalAction(submitQuestion)}>
          {modalLoading
            ? isEditingQuestion
              ? "Saving..."
              : "Adding..."
            : isEditingQuestion
            ? "Save Changes"
            : "Add Question"}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default QuestionModal;
