// frontend/src/pages/VideoPlayer.tsx

import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  PlayCircle,
  ChevronDown,
  ChevronUp,
  Star,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useRef, useState, useMemo } from "react";
import { apiGet, apiPost } from "@/services/api";
import parseYouTube from "@/utils/parseYouTube";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const VideoPlayer = () => {
  const { id } = useParams();
  const [video, setVideo] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [quiz, setQuiz] = useState<any>(null);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [quizStatus, setQuizStatus] = useState<any>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>(
    {}
  );
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [missingAnswers, setMissingAnswers] = useState(false);
  const [unansweredIds, setUnansweredIds] = useState<number[]>([]);
  const [showFailDetails, setShowFailDetails] = useState(false);
  const [certReadyOpen, setCertReadyOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [courseSummary, setCourseSummary] = useState<any>(null);
  const [animResult, setAnimResult] = useState(false);
  const [latestAttemptFetched, setLatestAttemptFetched] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const embedUrl = useMemo(
    () => parseYouTube(video?.video_url || ""),
    [video?.video_url]
  );
  const { toast } = useToast();

  // Load YouTube API
  useEffect(() => {
    if (window.YT && window.YT.Player) return;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
  }, []);

  // Load video + quiz
  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const data = await apiGet(`/api/videos/${id}`);
        if (data.success) {
          setVideo(data.video);
          setCourse(data.course);
          setPlaylist(data.playlist || []);
          setQuiz(data.quiz || null);
        }
      } catch (err) {
        console.error("load video error:", err);
      }
    };
    load();
  }, [id]);

  // Load status (video progress + quiz status)
  useEffect(() => {
    const loadStatus = async () => {
      try {
        if (video?.video_id) {
          const v = await apiGet(`/api/progress/video/${video.video_id}/status`);
          setVideoCompleted(v.completed || false);
        }
        if (quiz?.quiz_id) {
          const s = await apiGet(`/api/progress/quiz/${quiz.quiz_id}/status`);
          setQuizStatus(s);
        }
      } catch (err) {
        console.error("loadStatus error:", err);
      }
    };
    loadStatus();
  }, [video?.video_id, quiz?.quiz_id]);

  /**
   * AUTO-LOAD LATEST ATTEMPT WHEN ALREADY PASSED
   * (Requirement A: always auto-load review for passed quizzes)
   */
  useEffect(() => {
    const fetchLatestAttemptReview = async () => {
      if (!quiz?.quiz_id || !quizStatus?.passed || latestAttemptFetched) return;
      setLatestAttemptFetched(true);

      try {
        const res = await apiGet(`/api/quiz/${quiz.quiz_id}/attempt/latest`);
        if (res && res.success && res.attempt) {
          setResult({
            passed: !!res.attempt.passed,
            score: res.attempt.score,
            results: res.attempt.results || [],
            certificateReady: res.attempt.certificateReady || false,
          });
          // ensure inputs and submit are disabled (quizStatus already marks passed)
          return;
        }
      } catch (err) {
        // ignore - fallback below
      }

      // Fallback: fetch /api/quiz to synthesize a conservative review (don't reveal user answers)
      try {
        const q = await apiGet(`/api/quiz/${quiz.quiz_id}`);
        if (q && q.success && q.quiz) {
          const questions = q.quiz.questions || [];
          const synthesizedResults = questions.map((question: any) => {
            const correctAnswer = (question.answers || []).find(
              (a: any) => a.is_correct
            );
            return {
              question_id: question.question_id,
              correct: true,
              user_answer_text: null,
              correct_answer_text: correctAnswer ? correctAnswer.text : null,
            };
          });

          setResult({
            passed: true,
            score: quiz.best_score ?? null,
            results: synthesizedResults,
            certificateReady: false,
          });
        }
      } catch (err) {
        setResult({
          passed: true,
          score: quiz.best_score ?? null,
          results: [],
          certificateReady: false,
        });
      }
    };

    fetchLatestAttemptReview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz?.quiz_id, quizStatus?.passed, latestAttemptFetched]);

  // Attach YouTube player and mark complete on ended
  useEffect(() => {
    if (!iframeRef.current || !embedUrl) return;
    const attach = () => {
      new window.YT.Player(iframeRef.current as any, {
        events: {
          onStateChange: (event: any) => {
            if (event.data === 0) markComplete();
          },
        },
      });
    };
    if (window.YT?.Player) attach();
    else window.onYouTubeIframeAPIReady = attach;
  }, [embedUrl]);

  const markComplete = async () => {
    if (!video?.video_id) return;
    try {
      await apiPost(
        `/api/progress/video/${video.video_id}/complete`,
        {},
        false
      );
      setVideoCompleted(true);
      if (quiz?.quiz_id) {
        const s = await apiGet(`/api/progress/quiz/${quiz.quiz_id}/status`);
        setQuizStatus(s);
      }
    } catch (err) {
      console.error("markComplete error:", err);
    }
  };

  const handleQuizSubmitClick = () => {
    if (!quiz?.questions?.length) return;

    const unanswered = quiz.questions
      .filter((q: any) => !selectedAnswers[q.question_id])
      .map((q: any) => q.question_id);

    if (unanswered.length > 0) {
      setUnansweredIds(unanswered);
      setMissingAnswers(true);
      return;
    }

    setConfirmOpen(true);
  };

  // helper: compute badge from score (Gold >=90, Silver >=75, Bronze >=50)
  const badgeForScore = (score: number | null | undefined) => {
    if (score == null) return null;
    if (score >= 90) return { label: "Gold", color: "bg-yellow-400", icon: "★" };
    if (score >= 75) return { label: "Silver", color: "bg-slate-300", icon: "★" };
    if (score >= 50) return { label: "Bronze", color: "bg-amber-200", icon: "★" };
    return null;
  };

  const submitQuiz = async () => {
    if (!quiz?.quiz_id) return;
    setSubmitting(true);
    setConfirmOpen(false);

    const answers = Object.entries(selectedAnswers).map(([question_id, answer_id]) => ({
      question_id: Number(question_id),
      selected_answer_id: Number(answer_id),
    }));

    try {
      const r = await apiPost(`/api/quiz/${quiz.quiz_id}/attempt`, { answers }, false);

      // refresh quiz status
      const s = await apiGet(`/api/progress/quiz/${quiz.quiz_id}/status`);
      setQuizStatus(s);

      // refresh video status (backend may have reset it on lock)
      if (video?.video_id) {
        const v = await apiGet(`/api/progress/video/${video.video_id}/status`);
        setVideoCompleted(v.completed || false);
      }

      if (r.success) {
        // small animation trigger (result card)
        setAnimResult(false);
        setTimeout(() => setAnimResult(true), 50);

        // set result from backend if present; backend returns results array and certificateReady
        setResult({
          passed: r.passed,
          score: r.score,
          results: r.results || [],
          certificateReady: r.certificateReady || false,
        });

        // If backend says certificateReady, show congratulatory popup
        if (r.passed && r.certificateReady) {
          toast({
            title: "🎉 Congrats — Certificate Ready!",
            description: "You've completed all course quizzes. You can generate and download your certificate on the course page.",
          });
          setCertReadyOpen(true);
        }

        // If the user just became locked (exhausted attempts without passing), warn them
        if (r.locked && !r.passed) {
          toast({
            title: "❌ Quiz locked — attempts exhausted",
            description:
              "You have used all allowed attempts for this quiz and cannot attempt again. Contact an admin to reset attempts.",
            variant: "destructive",
          });
        }
      } else {
        console.warn("Quiz submission response missing success:", r);
        setResult(null);
      }

      // Clear some local UI state
      setUnansweredIds([]);
      setShowFailDetails(false);

      // failed 2nd attempt prompt
      if (!r.passed && s.attemptsUsed === 2) {
        toast({
          title: "Try rewatching the video 🎥",
          description:
            "You didn’t pass the quiz. We recommend rewatching the lesson to prepare for your final attempt.",
          variant: "destructive",
        });
      }

      // After successful pass or lock, fetch the latest attempt review to ensure review UI has the exact attempt data.
      if (s.passed || s.locked) {
        try {
          const latest = await apiGet(`/api/quiz/${quiz.quiz_id}/attempt/latest`);
          if (latest && latest.success && latest.attempt) {
            setResult({
              passed: !!latest.attempt.passed,
              score: latest.attempt.score,
              results: latest.attempt.results || [],
              certificateReady: latest.attempt.certificateReady || false,
            });
          }
        } catch (err) {
          // ignore — we already set a result
        }
      }
    } catch (err) {
      console.error("Quiz submission failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // fetch course summary (for end of course modal)
  const fetchCourseSummary = async () => {
    if (!course?.course_id) return;
    try {
      const res = await apiGet(`/api/courses/${course.course_id}`);
      if (res.success) {
        setCourseSummary(res.course || null);
      } else {
        setCourseSummary(null);
      }
    } catch (err) {
      console.error("fetchCourseSummary error:", err);
      setCourseSummary(null);
    }
  };

  // Animate result card in when result changes
  useEffect(() => {
    if (result) {
      setAnimResult(false);
      const t = setTimeout(() => setAnimResult(true), 40);
      return () => clearTimeout(t);
    }
  }, [result]);

  if (!video || !course) {
    return (
      <div className="min-h-screen bg-secondary/20 flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading video...</p>
      </div>
    );
  }

  const currentIndex = playlist.findIndex((v) => v.video_id === video.video_id);
  const prevVideo = playlist[currentIndex - 1];
  const nextVideo = playlist[currentIndex + 1];

  const attemptsLeft = quizStatus
    ? Math.max(0, (quizStatus.attemptsAllowed ?? 3) - (quizStatus.attemptsUsed ?? 0))
    : 0;

  const isQuizLocked = !!quizStatus?.locked;
  const isQuizPassed = !!quizStatus?.passed;

  // helper to decide per-answer classes (selected, reveal)
  const answerClass = (qId: number, aId: number) => {
    const isSelected = selectedAnswers[qId] === aId;
    // before result: highlight selected
    if (!result) {
      return `flex items-center gap-2 cursor-pointer p-2 rounded-md transition-all duration-150 ${
        isSelected ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-slate-50"
      }`;
    }
    // after result: reveal styling
    const resEntry = result.results?.find((r: any) => r.question_id === qId);
    if (!resEntry) return "flex items-center gap-2 cursor-default p-2 rounded-md";
    // when passed — show correct and incorrect (reveal correct answer)
    if (result.passed) {
      if (resEntry.correct) {
        return isSelected
          ? "flex items-center gap-2 p-2 rounded-md bg-green-50 ring-1 ring-green-300"
          : "flex items-center gap-2 p-2 rounded-md";
      } else {
        return isSelected
          ? "flex items-center gap-2 p-2 rounded-md bg-red-50 ring-1 ring-red-300"
          : "flex items-center gap-2 p-2 rounded-md";
      }
    } else {
      // failed: do NOT reveal correct answer. Highlight only user's selected as subtle red.
      return isSelected
        ? "flex items-center gap-2 p-2 rounded-md bg-red-50 ring-1 ring-red-300"
        : "flex items-center gap-2 p-2 rounded-md";
    }
  };

  // Prevent changing answers if quiz is passed/locked or result present (review)
  const canChangeAnswers = !(isQuizPassed || isQuizLocked || (result && result.passed));

  return (
    <div className="min-h-screen bg-secondary/20">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to={`/course/${course.course_id}`} className="text-primary hover:underline">
            ← Back to {course.title}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* VIDEO */}
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-black">
                  <iframe
                    ref={iframeRef}
                    src={embedUrl}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
                <div className="p-4 border-t flex justify-between">
                  <Button variant="outline" disabled={!prevVideo} asChild>
                    <Link to={prevVideo ? `/video/${prevVideo.video_id}` : "#"}>
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Link>
                  </Button>

                  <Button
                    onClick={markComplete}
                    variant={videoCompleted ? "secondary" : "default"}
                  >
                    {videoCompleted ? "Video Completed ✓" : "Mark as Complete"}
                  </Button>

                  <Button variant="outline" disabled={!nextVideo} asChild>
                    <Link to={nextVideo ? `/video/${nextVideo.video_id}` : "#"}>
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* QUIZ wrapper starts */}
            {quiz && (
              <Card className="p-4 space-y-4">
                <p className="font-semibold">{quiz.title}</p>

                {/* STATUS + IMMEDIATE REVIEW (if passed) */}
                {!quizStatus ? (
                  <p>Loading quiz status…</p>
                ) : isQuizPassed ? (
                  <>
                    <p className="text-green-600 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" /> Passed
                    </p>

                    {/* Show the result/review card immediately beneath the Passed label */}
                    {result && (
                      <div
                        className={`p-4 rounded-lg mt-2 transform transition-all duration-300 ${
                          animResult ? "opacity-100 scale-100" : "opacity-0 scale-95"
                        } ${result.passed ? "bg-green-50" : "bg-red-50"}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`font-semibold ${result.passed ? "text-green-700" : "text-red-700"}`}>
                              {result.passed ? "✅ Passed!" : "❌ Not Passed"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Score: <strong>{result.score ?? "—"}%</strong>
                            </p>
                          </div>

                          {/* BADGE */}
                          {badgeForScore(result.score) ? (
                            <div
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${badgeForScore(result.score)!.color} text-sm font-semibold shadow-sm`}
                            >
                              <Star className="h-4 w-4" />
                              <span>{badgeForScore(result.score)!.label}</span>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">No badge</div>
                          )}
                        </div>

                        {/* PASS REVIEW */}
                        {result.passed && result.results && result.results.length > 0 ? (
                          <div className="mt-4 space-y-3">
                            {result.results.map((r: any, idx: number) => {
                              const q = (quiz.questions || []).find((x: any) => x.question_id === r.question_id);
                              return (
                                <div key={idx} className="p-3 border rounded-md bg-white shadow-sm">
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium">{q?.text ?? "Question"}</p>
                                    <span className={`text-sm font-semibold ${r.correct ? "text-green-600" : "text-red-600"}`}>
                                      {r.correct ? "Correct" : "Incorrect"}
                                    </span>
                                  </div>

                                  {r.correct ? (
                                    <p className="mt-2 text-sm text-green-600">✅ Your answer: {r.user_answer_text ?? "—"}</p>
                                  ) : (
                                    <>
                                      <p className="mt-2 text-sm text-red-600">❌ Your answer: {r.user_answer_text ?? "—"}</p>
                                      <p className="mt-1 text-sm text-green-600">✅ Correct answer: {r.correct_answer_text ?? "—"}</p>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="mt-3 text-sm text-muted-foreground">Review not available for this attempt.</p>
                        )}
                      </div>
                    )}
                  </>
                ) : isQuizLocked ? (
                  <p className="text-red-600 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" /> Attempts exceeded
                  </p>
                ) : !videoCompleted ? (
                  <p className="text-yellow-600 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" /> Finish video to unlock quiz
                  </p>
                ) : (
                  <div className="flex items-center gap-3">
                    <Button onClick={() => setQuizOpen(!quizOpen)} disabled={isQuizPassed || isQuizLocked}>
                      {quizOpen ? "Hide Quiz" : "Take Quiz"}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={async () => {
                        await fetchCourseSummary();
                        setSummaryOpen(true);
                      }}
                      size="sm"
                    >
                      View Course Summary
                    </Button>
                  </div>
                )}

                {/* QUIZ OPEN: questions and submit */}
                {quizOpen && (
                  <div className="p-4 border rounded-lg bg-secondary/20 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Attempts left: {attemptsLeft} / {quizStatus?.attemptsAllowed ?? 3}
                    </p>

                    {/* QUESTIONS */}
                    {quiz.questions?.length > 0 ? (
                      quiz.questions.map((q: any, idx: number) => {
                        const isUnanswered = unansweredIds.includes(q.question_id);
                        return (
                          <div
                            key={q.question_id}
                            className={`space-y-2 p-3 rounded-md border transition-all ${
                              isUnanswered ? "bg-red-50 border-red-300" : "border-transparent hover:shadow-sm"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <p className="font-medium">{q.text}</p>
                              <span className="text-xs text-muted-foreground">Q{idx + 1}</span>
                            </div>

                            {isUnanswered && (
                              <p className="text-xs text-red-600 font-medium">⚠️ Please answer this question</p>
                            )}

                            {q.answers?.length > 0 ? (
                              q.answers.map((a: any) => (
                                <label
                                  key={a.answer_id}
                                  className={`${answerClass(q.question_id, a.answer_id)} select-none`}
                                >
                                  <input
                                    type="radio"
                                    name={`q_${q.question_id}`}
                                    checked={selectedAnswers[q.question_id] === a.answer_id}
                                    disabled={!canChangeAnswers}
                                    onChange={() => {
                                      if (!canChangeAnswers) return;
                                      setSelectedAnswers((prev) => ({ ...prev, [q.question_id]: a.answer_id }));
                                      setUnansweredIds((prev) => prev.filter((id) => id !== q.question_id));
                                    }}
                                  />
                                  <span className="ml-2">{a.text}</span>
                                </label>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">No answers.</p>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p>No questions in this quiz.</p>
                    )}

                    <Button disabled={submitting || isQuizPassed || isQuizLocked} onClick={handleQuizSubmitClick} className="w-full">
                      {submitting ? "Submitting…" : "Submit Quiz"}
                    </Button>

                    {/* RESULT BLOCK (also shown above when passed; keep here for immediate feedback after submission) */}
                    {result && (
                      <div
                        className={`p-4 rounded-lg mt-4 transform transition-all duration-300 ${
                          animResult ? "opacity-100 scale-100" : "opacity-0 scale-95"
                        } ${result.passed ? "bg-green-50" : "bg-red-50"}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`font-semibold ${result.passed ? "text-green-700" : "text-red-700"}`}>
                              {result.passed ? "✅ Passed! " : "❌ Not Passed"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Score: <strong>{result.score}%</strong>
                            </p>
                          </div>

                          {/* BADGE */}
                          {badgeForScore(result.score) ? (
                            <div
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${badgeForScore(result.score)!.color} text-sm font-semibold shadow-sm`}
                            >
                              <Star className="h-4 w-4" />
                              <span>{badgeForScore(result.score)!.label}</span>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">No badge</div>
                          )}
                        </div>

                        {/* PASS REVIEW */}
                        {result.passed && result.results && result.results.length > 0 ? (
                          <div className="mt-4 space-y-3">
                            {result.results.map((r: any, idx: number) => {
                              const q = (quiz.questions || []).find((x: any) => x.question_id === r.question_id);
                              return (
                                <div key={idx} className="p-3 border rounded-md bg-white shadow-sm">
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium">{q?.text ?? "Question"}</p>
                                    <span className={`text-sm font-semibold ${r.correct ? "text-green-600" : "text-red-600"}`}>
                                      {r.correct ? "Correct" : "Incorrect"}
                                    </span>
                                  </div>

                                  {r.correct ? (
                                    <p className="mt-2 text-sm text-green-600">✅ Your answer: {r.user_answer_text ?? "—"}</p>
                                  ) : (
                                    <>
                                      <p className="mt-2 text-sm text-red-600">❌ Your answer: {r.user_answer_text ?? "—"}</p>
                                      <p className="mt-1 text-sm text-green-600">✅ Correct answer: {r.correct_answer_text ?? "—"}</p>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="mt-3 text-sm text-muted-foreground">Review not available for this attempt.</p>
                        )}

                        {/* FAIL FEEDBACK */}
                        {!result.passed && (
                          <>
                            <p className="mt-2 text-sm">
                              Correct answers: {result.results ? result.results.filter((r: any) => r.correct).length : 0} / {result.results ? result.results.length : 0}
                            </p>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowFailDetails((p) => !p)}
                              className="mt-3 flex items-center gap-2"
                            >
                              {showFailDetails ? (
                                <>
                                  <ChevronUp className="h-4 w-4" /> Hide Feedback
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4" /> View Feedback
                                </>
                              )}
                            </Button>

                            {showFailDetails && (
                              <div className="mt-3 space-y-3">
                                {result.results.map((r: any, idx: number) => {
                                  const q = quiz.questions.find((x: any) => x.question_id === r.question_id);
                                  return (
                                    <div key={idx} className="p-3 border rounded-md bg-white shadow-sm">
                                      <div className="flex items-center justify-between">
                                        <p className="font-medium">{q?.text}</p>
                                        <span className={`text-sm font-semibold ${r.correct ? "text-green-600" : "text-red-600"}`}>
                                          {r.correct ? "Correct" : "Incorrect"}
                                        </span>
                                      </div>

                                      <p className="mt-2 text-sm text-muted-foreground">Your answer: {r.user_answer_text}</p>

                                      <p className="mt-1 text-xs text-gray-500">Tip: Rewatch the related section of the video.</p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* PLAYLIST */}
          <div>
            <Card>
              <CardContent className="pt-6">
                <h2 className="font-semibold mb-4">Course Videos</h2>
                <div className="space-y-2">
                  {playlist.map((v) => (
                    <Link
                      key={v.video_id}
                      to={`/video/${v.video_id}`}
                      className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                        v.video_id === video.video_id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-secondary"
                      }`}
                    >
                      {v.completed ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <PlayCircle className="h-5 w-5" />
                      )}
                      <p className="text-sm font-medium">{v.title}</p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* CONFIRM SUBMIT */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Quiz?</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit? You have <strong>{attemptsLeft}</strong> attempt{attemptsLeft !== 1 && "s"} remaining.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={submitQuiz} disabled={submitting}>Yes, Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MISSING ANSWERS */}
      <Dialog open={missingAnswers} onOpenChange={setMissingAnswers}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 font-semibold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" /> Incomplete Quiz
            </DialogTitle>
            <DialogDescription className="text-red-600 font-medium">⚠️ You haven’t answered all questions yet.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setMissingAnswers(false)}>Okay</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CERT READY */}
      <Dialog open={certReadyOpen} onOpenChange={setCertReadyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🎉 Congratulations!</DialogTitle>
            <DialogDescription>
              You have completed all quizzes for this course. Your certificate is ready.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCertReadyOpen(false)}>Close</Button>
            <Button asChild>
              <Link to={`/course/${course.course_id}`}>Go to Course</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SUMMARY MODAL */}
      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Course Summary</DialogTitle>
          </DialogHeader>

          {courseSummary ? (
            <div className="space-y-4 mt-3">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold">{courseSummary.title}</p>
                  <p className="text-sm text-muted-foreground">{courseSummary.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-xl font-bold">{courseSummary.progress_percent ?? 0}%</p>
                </div>
              </div>

              <div className="p-3 border rounded-md bg-white">
                <p className="font-medium mb-2">Quizzes</p>
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm">Total quizzes</p>
                    <p className="font-semibold">{courseSummary.quizzes_count ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm">Students</p>
                    <p className="font-semibold">{courseSummary.students_count ?? "—"}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Estimated badge</p>
                  <div className="mt-2">
                    {badgeForScore(courseSummary.progress_percent) ? (
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${badgeForScore(courseSummary.progress_percent)!.color} text-sm font-semibold shadow-sm`}
                      >
                        <Star className="h-4 w-4" />
                        <span>{badgeForScore(courseSummary.progress_percent)!.label}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No badge yet</span>
                    )}
                  </div>
                </div>

                <Button onClick={() => setSummaryOpen(false)}>Close</Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">Could not load summary.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VideoPlayer;
