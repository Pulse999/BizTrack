// src/components/modals/QuizModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;

  quizForm: any;
  setQuizForm: (v: any) => void;

  activeQuizId: number | null;

  modalError: string | null;
  modalLoading: boolean;

  runModalAction: (fn: () => Promise<void>) => Promise<void>;
  submitQuiz: () => Promise<void>;
};

const QuizModal = ({
  open,
  setOpen,
  quizForm,
  setQuizForm,
  activeQuizId,
  modalError,
  modalLoading,
  runModalAction,
  submitQuiz,
}: Props) => (
  <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{activeQuizId ? "Edit Quiz" : "Add Quiz"}</DialogTitle>
      </DialogHeader>

      {modalError && <div className="text-red-600 text-sm mb-2">{modalError}</div>}

      <div className="space-y-3">
        <Label>Quiz Title</Label>
        <Input
          value={quizForm.title}
          onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
        />

        <Label>Passing Score (%)</Label>
        <Input
          type="number"
          min={1}
          max={100}
          value={quizForm.passing_score}
          onChange={(e) => {
            let num = Number(e.target.value);
            if (num < 1) num = 1;
            if (num > 100) num = 100;
            setQuizForm({ ...quizForm, passing_score: num });
          }}
        />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button onClick={() => runModalAction(submitQuiz)}>
          {modalLoading
            ? activeQuizId
              ? "Saving..."
              : "Creating..."
            : activeQuizId
            ? "Save Changes"
            : "Create Quiz"}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default QuizModal;
