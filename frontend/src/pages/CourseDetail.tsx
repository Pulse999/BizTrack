// frontend/src/pages/CourseDetail.tsx

import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlayCircle,
  CheckCircle,
  Clock,
  Users,
  Star,
  FileQuestion,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiGet, apiPost } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";

const CourseDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();

  const [course, setCourse] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ⭐ store review details per quizId
  const [quizReviews, setQuizReviews] = useState<Record<number, any>>({});
  const [quizOpen, setQuizOpen] = useState<Record<number, boolean>>({});

  const [userRating, setUserRating] = useState<number | null>(null);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [submittingRating, setSubmittingRating] = useState(false);

  // ⭐ NEW: certificate debounce + loading indicator
  const [certLoading, setCertLoading] = useState(false);
  const certDebounceRef = useRef(false);

  useEffect(() => {
    if (!id) return;

    const loadCourse = async () => {
      try {
        const data = await apiGet(`/courses/${id}`);
        if (data.success) {
          setCourse(data.course);
          setVideos(data.videos || []);

          const ratingValue = Number(data.course?.avg_rating);
          setAvgRating(!isNaN(ratingValue) ? ratingValue : null);

          setRatingCount(data.course?.rating_count ?? 0);
          setUserRating(data.course?.user_rating ?? null);
        }
      } catch (err) {
        console.error("Failed to load course:", err);
      } finally {
        setLoading(false);
      }
    };
    loadCourse();
  }, [id]);

  const fetchQuizReview = async (quizId: number) => {
    if (quizReviews[quizId]) return; // already loaded

    try {
      const res = await apiGet(`/quiz/${quizId}/attempt/latest`);
      if (res.success && res.attempt) {
        // Normalize structure expected by UI (some backends return different fields)
        setQuizReviews((prev) => ({
          ...prev,
          [quizId]: res.attempt,
        }));
      } else {
        // Keep a lightweight placeholder so we don't re-request repeatedly
        setQuizReviews((prev) => ({
          ...prev,
          [quizId]: { results: [] },
        }));
      }
    } catch (err) {
      console.error("Failed to fetch quiz review:", err);
      setQuizReviews((prev) => ({
        ...prev,
        [quizId]: { results: [] },
      }));
    }
  };

  const toggleQuizReview = async (quizId: number) => {
    const isOpen = quizOpen[quizId] || false;

    if (!isOpen) {
      await fetchQuizReview(quizId);
    }

    setQuizOpen((prev) => ({
      ...prev,
      [quizId]: !isOpen,
    }));
  };

  /** -------------------------------------------------------
   *  ⭐ DEBOUNCED CERTIFICATE GENERATION
   * ------------------------------------------------------ */
  const generateCertificate = async () => {
    if (certDebounceRef.current) return; // block double click
    certDebounceRef.current = true;
    setCertLoading(true);

    try {
      const res = await apiPost(`/certificates/generate/${id}`, {}, false);

      if (res.success && res.certificate) {
        toast({
          title: "🎓 Certificate Ready!",
          description: "Scroll down to download.",
        });

        setCourse((prev: any) => ({
          ...prev,
          certificate: res.certificate,
        }));
      } else {
        toast({
          title: "Not Ready",
          description: res.message || "You must pass all quizzes first.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Certificate generation failed:", err);
      toast({
        title: "Error",
        description: "Unable to generate certificate.",
        variant: "destructive",
      });
    } finally {
      // keep loading text active until certificate section replaces the button
      // do NOT reset certDebounceRef.current (prevents double fire)
      setCertLoading(false);
    }
  };

  const handleRateCourse = async (value: number) => {
    if (!id) return;
    setSubmittingRating(true);
    try {
      const res = await apiPost(`/courses/${id}/rate`, { rating: value });

      if (res.success) {
        setUserRating(res.user_rating ?? value);

        const ratingValue = Number(res.avg_rating);
        setAvgRating(!isNaN(ratingValue) ? ratingValue : null);

        setRatingCount(res.rating_count ?? ratingCount);

        toast({
          title: "Thanks for your rating!",
          description: "Your feedback has been saved.",
        });
      } else {
        toast({
          title: "Rating failed",
          description: res.error || "Could not save your rating.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Failed to rate course:", err);
      toast({
        title: "Rating failed",
        description: "Something went wrong while saving your rating.",
        variant: "destructive",
      });
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/20 flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading course...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-secondary/20 flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Course not found.</p>
      </div>
    );
  }

  const completedQuizzes = videos.filter((v) => v.quiz && v.quiz.passed).length;
  const totalQuizzes = videos.filter((v) => v.quiz).length;

  const computedProgress = totalQuizzes
    ? Math.round((completedQuizzes / totalQuizzes) * 100)
    : 0;

  const progress =
    typeof course.progress_percent === "number"
      ? Math.round(course.progress_percent)
      : computedProgress;

  const ratingDisplay =
    avgRating !== null && !isNaN(avgRating) ? avgRating.toFixed(1) : "N/A";

  return (
    <div className="min-h-screen bg-secondary/20">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Back */}
        <div className="mb-4">
          <Link to="/courses" className="text-primary hover:underline">
            ← Back to Courses
          </Link>
        </div>

        {/* HEADER */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
              <p className="text-muted-foreground max-w-3xl">
                {course.description}
              </p>
            </div>
            <Badge className="bg-primary">In Progress</Badge>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{videos.length} videos</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>
                {course.students_count !== undefined
                  ? `${course.students_count} enrolled`
                  : "Enrolled"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="font-medium">{ratingDisplay}</span>
            </div>
          </div>
        </div>

        {/* PROGRESS */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">Your Progress</p>
                <p className="text-sm text-muted-foreground">
                  {completedQuizzes} of {totalQuizzes} quizzes passed
                </p>
              </div>
              <span className="text-2xl font-bold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </CardContent>
        </Card>

        {/* CERTIFICATE */}
        {progress === 100 && !course.certificate && (
          <div className="mb-8 flex justify-end">
            <Button onClick={generateCertificate} disabled={certLoading}>
              {certLoading ? "⏳ Generating…" : "🎓 Generate Certificate"}
            </Button>
          </div>
        )}

        {course.certificate && (
          <Card className="mb-8 p-6 bg-primary/10 border-primary/50">
            <p className="font-semibold mb-2">🎉 Certificate Ready!</p>
            <p className="mb-1">
              Certificate ID:{" "}
              <strong>{course.certificate.certificate_number}</strong>
            </p>
            <p className="text-sm mb-4 text-muted-foreground">
              You can now download and share your certificate.
            </p>
            <Button asChild>
              <a
                href={course.certificate.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Download Certificate (PDF)
              </a>
            </Button>
          </Card>
        )}

        {/* TABS */}
        <Tabs defaultValue="materials" className="space-y-6">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="materials">Learning Materials</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          {/* MATERIALS */}
          <TabsContent value="materials">
            <div className="space-y-6">
              {videos.map((v) => {
                const quiz = v.quiz;

                const videoComplete = v.completed;
                const quizUnlocked = videoComplete;
                const quizPassed = quiz?.passed;
                const bestScore = quiz?.best_score || quiz?.score || null;
                const attemptsLeft = quiz?.attempts_left ?? null;
                const attemptsExceeded = attemptsLeft === 0 && !quizPassed;

                return (
                  <Card key={v.video_id}>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/50 transition-colors">
                        <div className="flex items-center gap-3">
                          {videoComplete ? (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          ) : (
                            <PlayCircle className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div className="flex flex-col">
                            <p className="font-medium">{v.title}</p>
                          </div>
                        </div>

                        <Button
                          asChild
                          variant={videoComplete ? "secondary" : "default"}
                        >
                          <Link to={`/video/${v.video_id}`}>
                            {videoComplete ? "Rewatch" : "Watch Video"}
                          </Link>
                        </Button>
                      </div>

                      {quiz && (
                        <div
                          className={`p-4 border rounded-lg ${
                            attemptsExceeded
                              ? "bg-red-50"
                              : quizPassed
                                ? "bg-green-50"
                                : "bg-secondary/30"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileQuestion
                                className={`h-5 w-5 ${
                                  attemptsExceeded
                                    ? "text-red-600"
                                    : quizPassed
                                      ? "text-green-600"
                                      : "text-primary"
                                }`}
                              />
                              <div>
                                <p className="font-medium">{quiz.title}</p>

                                {quizPassed ? (
                                  <p className="text-xs text-green-600 mt-1">
                                    ✓ Quiz passed successfully!
                                  </p>
                                ) : !quizUnlocked ? (
                                  <p className="text-xs text-muted-foreground mt-1 italic">
                                    Complete video to unlock
                                  </p>
                                ) : attemptsExceeded ? (
                                  <p className="text-xs text-red-600 mt-1 font-medium">
                                    ❌ Attempts exceeded
                                  </p>
                                ) : (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Take this quiz to test your knowledge.
                                  </p>
                                )}
                              </div>
                            </div>

                            {attemptsExceeded ? (
                              <Button variant="destructive" disabled>
                                Unavailable
                              </Button>
                            ) : (
                              <Button
                                asChild
                                disabled={!quizUnlocked}
                                variant={quizPassed ? "outline" : "default"}
                              >
                                <Link to={`/video/${v.video_id}#quiz`}>
                                  {quizPassed ? "Review Answers" : "Take Quiz"}
                                </Link>
                              </Button>
                            )}
                          </div>

                          {quizPassed && (
                            <div className="mt-3">
                              <button
                                className="flex items-center gap-2 text-sm text-primary font-medium"
                                onClick={() => toggleQuizReview(quiz.quiz_id)}
                              >
                                {quizOpen[quiz.quiz_id] ? (
                                  <>
                                    <ChevronUp className="h-4 w-4" />
                                    Hide Review
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-4 w-4" />
                                    View Review
                                  </>
                                )}
                              </button>

                              {quizOpen[quiz.quiz_id] && (
                                <div className="mt-4 space-y-3 p-3 bg-white border rounded-md">
                                  {quizReviews[quiz.quiz_id]?.results?.length >
                                  0 ? (
                                    quizReviews[quiz.quiz_id].results.map(
                                      (r: any, idx: number) => (
                                        <div
                                          key={idx}
                                          className="p-3 border rounded-md bg-white shadow-sm"
                                        >
                                          <div className="flex items-center justify-between">
                                            <p className="font-medium">
                                              {r.question_text ??
                                                `Question ${idx + 1}`}
                                            </p>
                                            <span
                                              className={`text-sm font-semibold ${
                                                r.correct
                                                  ? "text-green-600"
                                                  : "text-red-600"
                                              }`}
                                            >
                                              {r.correct
                                                ? "Correct"
                                                : "Incorrect"}
                                            </span>
                                          </div>

                                          <p className="mt-2 text-sm text-muted-foreground">
                                            Your answer: {r.user_answer_text}
                                          </p>

                                          {!r.correct && (
                                            <p className="mt-1 text-sm text-green-600">
                                              Correct answer:{" "}
                                              {r.correct_answer_text}
                                            </p>
                                          )}
                                        </div>
                                      ),
                                    )
                                  ) : (
                                    <p className="text-sm text-muted-foreground">
                                      No review available.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Course Overview</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p>{course.description}</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Rate this course</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => {
                const activeValue = hoverRating ?? userRating ?? 0;
                const isActive = value <= activeValue;
                return (
                  <button
                    key={value}
                    type="button"
                    className="p-1"
                    onMouseEnter={() => setHoverRating(value)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={() => handleRateCourse(value)}
                    disabled={submittingRating}
                  >
                    <Star
                      className={`h-6 w-6 ${
                        isActive
                          ? "fill-primary text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-muted-foreground">
              {ratingCount > 0
                ? `Average rating: ${ratingDisplay} (${ratingCount} ${
                    ratingCount === 1 ? "rating" : "ratings"
                  })`
                : "No ratings yet. Be the first to rate this course."}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CourseDetail;
