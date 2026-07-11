// frontend/src/pages/admin/Admin.tsx
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect, useMemo, useRef } from "react";
import { apiGet, apiPost, apiDelete, apiPatch } from "@/services/api";
import { getAuth, isSuperAdminUser } from "@/services/auth";

import EditCourseModal from "@/components/modals/EditCourseModal";
import AddCourseModal from "@/components/modals/AddCourseModal";
import AddVideoModal from "@/components/modals/AddVideoModal";
import EditVideoModal from "@/components/modals/EditVideoModal";
import QuizModal from "@/components/modals/QuizModal";
import QuestionModal from "@/components/modals/QuestionModal";

import UserAnalyticsTab from "@/pages/admin/UserAnalyticsTab";
import UserControllerTab from "@/pages/admin/UserControllerTab";
import CoursesTab from "@/pages/admin/CoursesTab";

/* local types omitted for brevity — keep as you had them in your file */

const Admin: React.FC = () => {
  const { user } = getAuth();
  const isSuperAdmin = isSuperAdminUser(user);

  // UI state
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);
  const [expandedVideos, setExpandedVideos] = useState<Record<number, boolean>>(
    {},
  );

  // Courses & nested content
  const [courses, setCourses] = useState<any[]>([]);
  const [courseVideos, setCourseVideos] = useState<Record<number, any>>({});

  // Edit course modal
  const [editCourseModal, setEditCourseModal] = useState(false);
  const [courseEditForm, setCourseEditForm] = useState({
    id: 0,
    title: "",
    description: "",
    difficulty_level: "Beginner",
    image_url: "",
  });

  // Add Course modal
  const [addCourseModalOpen, setAddCourseModalOpen] = useState(false);
  const [addCourseCompanyId, setAddCourseCompanyId] = useState<number | null>(
    null,
  );

  // Stats / metrics (top cards)
  const [stats, setStats] = useState<{
    activeCourses: number;
    totalVideos: number;
    totalQuizzes: number;
  } | null>(null);

  // Modals & forms for videos / quizzes / questions
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [editVideoModalOpen, setEditVideoModalOpen] = useState(false);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);

  const [activeCourseId, setActiveCourseId] = useState<number | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<number | null>(null);
  const [activeQuizId, setActiveQuizId] = useState<number | null>(null);

  const [videoForm, setVideoForm] = useState({
    title: "",
    description: "",
    video_url: "",
  });
  const [quizForm, setQuizForm] = useState({ title: "", passing_score: 80 });

  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(
    null,
  );
  const [removedAnswerIds, setRemovedAnswerIds] = useState<number[]>([]);

  const [questionForm, setQuestionForm] = useState({
    text: "",
    answers: [
      { text: "", is_correct: true },
      { text: "", is_correct: false },
    ] as any[],
  });

  // Universal modal state helpers
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Analytics & user-controller related state
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Filters / companies / unlocking used by analytics/user-controller
  const [companies, setCompanies] = useState<
    { company_id: number; name: string }[]
  >([]);
  const [companyQuery, setCompanyQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<{
    company_id: number;
    name: string;
  } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dateRange, setDateRange] = useState<"30" | "7" | "1" | "all">("30");

  // Per-quiz user filter (all/passed/failed)
  const [userFilterBy, setUserFilterBy] = useState<
    Record<number, "all" | "passed" | "failed">
  >({});

  // Unlocking state for per-user quizzes
  const [unlocking, setUnlocking] = useState<Record<string, boolean>>({});

  // Company list filter (live)
  const companiesFiltered = useMemo(() => {
    if (!companyQuery || companyQuery.trim().length === 0) return companies;
    return companies.filter((c) =>
      c.name.toLowerCase().includes(companyQuery.toLowerCase()),
    );
  }, [companies, companyQuery]);

  /* -------------------------------------
     helper: image upload (shared)
     ------------------------------------- */
  const handleImageUpload = async (file: File) => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiPost("/courses/upload", fd, false);
      return res.success ? res.image_url : null;
    } catch (err) {
      console.error("Image upload failed", err);
      return null;
    }
  };

  /* -------------------------------------
     Data fetches & helpers
     ------------------------------------- */

  // build stats/analytics query string (company + date)
  const statsQueryString = () => {
    const params = new URLSearchParams();
    if (selectedCompany)
      params.set("company_id", String(selectedCompany.company_id));
    if (dateRange) params.set("date_range", dateRange);
    const s = params.toString();
    return s ? `?${s}` : "";
  };

  // Fetch courses & stats when date changes or on mount
  useEffect(() => {
    const load = async () => {
      try {
        // Courses: do NOT use posing/selectedCompany here (posing only affects analytics)
        const res = await apiGet("/courses");
        if (res.success) setCourses(res.courses || []);
        else setCourses([]);
      } catch (err) {
        console.error("Failed to fetch courses", err);
        setCourses([]);
      }

      try {
        const res2 = await apiGet(`/stats${statsQueryString()}`);
        if (res2.success)
          setStats(
            res2.stats || { activeCourses: 0, totalVideos: 0, totalQuizzes: 0 },
          );
        else setStats({ activeCourses: 0, totalVideos: 0, totalQuizzes: 0 });
      } catch (err) {
        setStats({ activeCourses: 0, totalVideos: 0, totalQuizzes: 0 });
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  // Fetch companies ONLY for super admins (live search will filter client-side)
  useEffect(() => {
    if (!isSuperAdmin) return;
    const loadCompanies = async () => {
      try {
        const res = await apiGet("/stats/companies");
        if (res.success) setCompanies(res.companies || []);
      } catch (err) {
        console.error("Failed load companies", err);
      }
    };
    loadCompanies();
  }, [isSuperAdmin]);

  // Fetch analytics (for UserControllerTab)
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await apiGet(`/admin/analytics${statsQueryString()}`);
      if (res.success && Array.isArray(res.analytics)) {
        setAnalytics(res.analytics);

        // initialize per-quiz filter map
        const initial: Record<number, "all" | "passed" | "failed"> = {};
        res.analytics.forEach((c: any) => {
          c.quizzes.forEach((q: any) => (initial[q.quiz_id] = "all"));
        });
        setUserFilterBy(initial);
      } else {
        setAnalytics([]);
      }
    } catch (err) {
      console.error("Failed to fetch analytics", err);
      setAnalytics([]);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    // analytics depends on selectedCompany & dateRange (posing only affects analytics)
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany, dateRange]);

  /* -------------------------------------
   Close dropdown on click outside
   ------------------------------------- */
  useEffect(() => {
    // previously handled company dropdown close — now removed
  }, []);

  /* -------------------------------------
    Fetch nested course content (videos + quiz)
  -------------------------------------- */
  const fetchCourseNested = async (courseId: number) => {
    try {
      const data = await apiGet(`/courses/${courseId}`);
      const videos: any[] = data.videos || [];

      const hydrated: any[] = [];

      for (const v of videos) {
        const full = await apiGet(`/videos/${v.video_id}`);
        hydrated.push({
          ...v,
          quiz: full.quiz
            ? {
                ...full.quiz,
                questions: (full.quiz.questions || []).map((q: any) => ({
                  ...q,
                  quiz_id: full.quiz.quiz_id, // 🔥 ADD THIS
                })),
              }
            : null,
        });
      }

      setCourseVideos((prev) => ({ ...prev, [courseId]: hydrated }));
    } catch (err) {
      console.error("fetchCourseNested error:", err);
      setCourseVideos((prev) => ({ ...prev, [courseId]: [] }));
    }
  };

  /* -------------------------------------
    Course expand debounced loading
  -------------------------------------- */

  const [courseLoading, setCourseLoading] = useState<Record<number, boolean>>(
    {},
  );

  // Store timeout reference safely so React doesn't recreate it every render
  const expandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleExpandCourse = (courseId: number) => {
    const alreadyOpen = expandedCourse === courseId;

    // Collapse if open
    if (alreadyOpen) {
      setExpandedCourse(null);
      return;
    }

    // Mark this course as loading
    setCourseLoading((s) => ({ ...s, [courseId]: true }));
    setExpandedCourse(courseId);

    // Debounce
    if (expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current);
    }

    expandTimeoutRef.current = setTimeout(async () => {
      await fetchCourseNested(courseId);

      setCourseLoading((s) => ({ ...s, [courseId]: false }));
    }, 250);
  };

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);
    };
  }, []);

  const toggleExpandVideo = (videoId: number) => {
    setExpandedVideos((prev) => ({ ...prev, [videoId]: !prev[videoId] }));
  };

  const handleEditCourse = (course: any) => {
    setCourseEditForm({
      id: course.course_id,
      title: course.title,
      description: course.description,
      difficulty_level: course.difficulty_level || "Beginner",
      image_url: course.image_url || "",
    });
    setEditCourseModal(true);
  };

  const submitEditCourse = async () => {
    await apiPatch(`/courses/${courseEditForm.id}`, {
      title: courseEditForm.title,
      description: courseEditForm.description,
      difficulty_level: courseEditForm.difficulty_level,
      image_url: courseEditForm.image_url,
    });

    // refresh list
    const res = await apiGet("/courses");
    if (res.success) setCourses(res.courses || []);
    setEditCourseModal(false);
  };

  const handleDeleteCourse = async (id: number) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    await apiDelete(`/courses/${id}`);
    setCourses((prev) => prev.filter((c) => c.course_id !== id));
  };

  const toggleCourseActive = async (courseId: number, current: boolean) => {
    const res = await apiPatch(`/courses/${courseId}/toggle`, {
      is_active: !current,
    });

    if (res.success) {
      const data = await apiGet("/courses");
      if (data.success) setCourses(data.courses || []);
    }
  };

  /* -------------------------------------
     Add Course flow
     ------------------------------------- */
  const onAddCourseClick = (companyId: number | null) => {
    setAddCourseCompanyId(companyId);
    setAddCourseModalOpen(true);
  };

  const submitAddCourse = async () => {
    const res = await apiGet("/courses");
    if (res.success) setCourses(res.courses || []);
  };

  /* -------------------------------------
     Video / quiz / question handlers (modals)
     ------------------------------------- */

  const runModalAction = async (action: () => Promise<void>) => {
    if (modalLoading) return;
    setModalError(null);
    setModalLoading(true);
    try {
      await action();
    } catch (err: any) {
      console.error(err);
      setModalError(err?.message || "Something went wrong.");
    } finally {
      setModalLoading(false);
    }
  };

  // Videos
  const openAddVideo = (courseId: number) => {
    setActiveCourseId(courseId);
    setVideoForm({ title: "", description: "", video_url: "" });
    setModalError(null);
    setVideoModalOpen(true);
  };

  const openEditVideo = (video: any) => {
    setActiveCourseId(video.course_id);
    setActiveVideoId(video.video_id);
    setVideoForm({
      title: video.title,
      description: video.description || "",
      video_url: video.video_url,
    });
    setModalError(null);
    setEditVideoModalOpen(true);
  };

  const submitAddVideo = async () => {
    if (!activeCourseId) throw new Error("Missing course ID.");
    if (!videoForm.title.trim()) throw new Error("Title is required.");
    if (!videoForm.video_url.trim()) throw new Error("Video URL is required.");

    await apiPost(
      `/content/courses/${activeCourseId}/videos`,
      videoForm,
      false,
    );
    await fetchCourseNested(activeCourseId);
    setVideoModalOpen(false);
  };

  const submitEditVideo = async () => {
    if (!activeVideoId) throw new Error("Missing video ID.");

    await apiPatch(`/content/videos/${activeVideoId}`, {
      title: videoForm.title,
      description: videoForm.description,
      video_url: videoForm.video_url,
    });

    if (activeCourseId) {
      await fetchCourseNested(activeCourseId);
      setCourseVideos((prev) => ({ ...prev }));
    }

    setEditVideoModalOpen(false);
  };

  // Quizzes
  const openAddQuiz = (videoId: number) => {
    setActiveQuizId(null);
    setActiveVideoId(videoId);
    setQuizForm({ title: "", passing_score: 80 });
    setModalError(null);
    setQuizModalOpen(true);
  };

  const submitAddQuiz = async () => {
    if (!quizForm.title.trim()) throw new Error("Quiz title is required.");

    let ps = Number(quizForm.passing_score);
    if (!ps || ps < 1) ps = 1;
    if (ps > 100) ps = 100;

    if (activeQuizId) {
      await apiPatch(`/content/quizzes/${activeQuizId}`, {
        title: quizForm.title,
        passing_score: ps,
      });
    } else {
      if (!activeVideoId) throw new Error("Missing video ID.");
      await apiPost(`/content/videos/${activeVideoId}/quiz`, {
        title: quizForm.title,
        passing_score: ps,
      });
    }

    for (const cid in courseVideos) {
      await fetchCourseNested(Number(cid));
    }

    setQuizModalOpen(false);
    setActiveQuizId(null);
  };

  // Questions
  const openEditQuestion = (qOrId: any, quizIdOverride?: number) => {
    setModalError(null);
    if (typeof qOrId === "object" && qOrId.quiz_id) {
      setActiveQuizId(qOrId.quiz_id);
    }
    if (typeof quizIdOverride === "number") {
      setActiveQuizId(quizIdOverride);
    }

    if (typeof qOrId === "number") {
      setIsEditingQuestion(false);
      setEditingQuestionId(null);
      setRemovedAnswerIds([]);
      setQuestionForm({
        text: "",
        answers: [
          { text: "", is_correct: true },
          { text: "", is_correct: false },
        ],
      });
      setActiveQuizId(qOrId);
      setQuestionModalOpen(true);
      return;
    }

    const q = qOrId as any;
    setIsEditingQuestion(true);
    setEditingQuestionId(q.question_id);
    setRemovedAnswerIds([]);

    setQuestionForm({
      text: q.text,
      answers: (q.answers || []).map((a: any) => ({
        answer_id: a.answer_id,
        text: a.text,
        is_correct: a.is_correct,
      })),
    });

    setActiveQuizId(q.quiz_id);
    setQuestionModalOpen(true);
  };

  const setCorrectAnswer = (index: number) => {
    setQuestionForm((prev) => ({
      ...prev,
      answers: prev.answers.map((a: any, i: number) => ({
        ...a,
        is_correct: i === index,
      })),
    }));
  };

  const addAnswerField = () => {
    if (questionForm.answers.length >= 4) return;
    setQuestionForm({
      ...questionForm,
      answers: [...questionForm.answers, { text: "", is_correct: false }],
    });
  };

  const removeAnswerField = (index: number) => {
    const copy = [...questionForm.answers];
    const removed = copy[index];
    if (removed.answer_id) {
      setRemovedAnswerIds((prev) => [...prev, removed.answer_id as number]);
    }
    copy.splice(index, 1);
    if (!copy.some((a: any) => a.is_correct) && copy.length > 0) {
      copy[0].is_correct = true;
    }
    setQuestionForm({ ...questionForm, answers: copy });
  };

  const submitQuestion = async () => {
    if (!activeQuizId) throw new Error("Missing quiz ID.");
    if (!questionForm.text.trim())
      throw new Error("Question text is required.");

    const validAnswers = questionForm.answers.filter((a: any) => a.text.trim());
    if (validAnswers.length < 2)
      throw new Error("At least 2 answers required.");
    if (validAnswers.length > 4) throw new Error("Max 4 answers allowed.");
    if (!validAnswers.some((a: any) => a.is_correct))
      throw new Error("You must mark a correct answer.");

    if (isEditingQuestion && editingQuestionId) {
      await apiPatch(`/content/questions/${editingQuestionId}`, {
        text: questionForm.text,
      });

      for (const a of validAnswers) {
        if (a.answer_id) {
          await apiPatch(`/content/answers/${a.answer_id}`, {
            text: a.text,
            is_correct: a.is_correct,
          });
        } else {
          await apiPost(
            `/content/questions/${editingQuestionId}/answers`,
            {
              text: a.text,
              is_correct: a.is_correct,
            },
            false,
          );
        }
      }

      for (const id of removedAnswerIds) {
        await apiDelete(`/content/answers/${id}`);
      }
    } else {
      await apiPost(
        `/content/quizzes/${activeQuizId}/questions`,
        {
          text: questionForm.text,
          answers: validAnswers,
        },
        false,
      );
    }

    for (const cid in courseVideos) {
      await fetchCourseNested(Number(cid));
    }

    setQuestionModalOpen(false);
    setIsEditingQuestion(false);
    setEditingQuestionId(null);
  };

  /* -------------------------------------
     User-controller helpers (unlock per-user quiz)
     ------------------------------------- */
  const handleUnlockUserQuiz = async (quiz_id: number, user_id: number) => {
    const key = `${quiz_id}:${user_id}`;
    setUnlocking((s) => ({ ...s, [key]: true }));
    try {
      const res = await apiPost(
        `/admin/analytics/unlock`,
        { quiz_id, user_id },
        false,
      );
      if (res.success) {
        await fetchAnalytics();
      }
    } catch (err) {
      console.error("Unlock error", err);
    } finally {
      setUnlocking((s) => ({ ...s, [key]: false }));
    }
  };

  /* -------------------------------------
     Render
     ------------------------------------- */
  return (
    <div className="min-h-screen bg-secondary/20">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage courses, videos, quizzes and questions
          </p>
        </div>

        {/* SUPER ADMIN: global search + dropdown */}
        {isSuperAdmin && (
          <div className="mb-6 company-filter-wrapper relative">
            <div className="flex items-center gap-4">
              {/* GLOBAL SEARCHBAR */}
              <input
                className="w-full md:w-96 border rounded-md px-3 py-2 text-sm"
                placeholder="Search companies..."
                value={companyQuery}
                onChange={(e) => {
                  const q = e.target.value;
                  setCompanyQuery(q);

                  if (q.trim() === "") {
                    setSelectedCompany(null); // reset to ALL COMPANIES
                  }
                }}
                onFocus={() => setDropdownOpen(true)}
              />

              {/* POSING BADGE */}
              {selectedCompany ? (
                <span className="inline-flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-full border-2 border-emerald-500 text-emerald-700 bg-emerald-50">
                  POSING AS: {selectedCompany.name}
                  <button
                    className="ml-1 text-emerald-600"
                    onClick={() => {
                      setSelectedCompany(null);
                      setCompanyQuery("");
                    }}
                  >
                    ✕
                  </button>
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 bg-sky-500 text-white text-sm font-medium px-3 py-1 rounded-full">
                  All Companies
                </span>
              )}
            </div>

            {/* DROPDOWN */}
            {dropdownOpen && (
              <div className="absolute w-full md:w-96 bg-white border rounded-md shadow-lg mt-1 max-h-64 overflow-auto z-20">
                {/* ALL COMPANIES OPTION */}
                <div
                  className="px-3 py-2 hover:bg-slate-100 cursor-pointer font-medium"
                  onClick={() => {
                    setSelectedCompany(null);
                    setCompanyQuery("");
                    setDropdownOpen(false);
                  }}
                >
                  All Companies
                </div>

                <div className="border-t my-1" />

                {/* FILTERED LIST */}
                {companies
                  .filter((c) =>
                    companyQuery.trim() === ""
                      ? true
                      : c.name
                          .toLowerCase()
                          .includes(companyQuery.toLowerCase()),
                  )
                  .map((c) => (
                    <div
                      key={c.company_id}
                      className="px-3 py-2 hover:bg-slate-100 cursor-pointer"
                      onClick={() => {
                        setSelectedCompany(c);
                        setCompanyQuery(c.name);
                        setDropdownOpen(false);
                      }}
                    >
                      {c.name}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold">
                  {stats?.activeCourses ?? 0}
                </p>
                <p className="text-sm text-muted-foreground">Active Courses</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold">{stats?.totalVideos ?? 0}</p>
                <p className="text-sm text-muted-foreground">Total Videos</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold">{stats?.totalQuizzes ?? 0}</p>
                <p className="text-sm text-muted-foreground">Total Quizzes</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList>
            <TabsTrigger value="courses">Courses & Content</TabsTrigger>
            <TabsTrigger value="user-controller">User Controller</TabsTrigger>
            <TabsTrigger value="user-analytics">User Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="courses">
            <CoursesTab
              isSuperAdmin={isSuperAdmin}
              user={user ?? { company_id: null }}
              courses={courses}
              companies={companiesFiltered}
              expandedCourse={expandedCourse}
              expandedVideos={expandedVideos}
              toggleExpandCourse={toggleExpandCourse}
              toggleExpandVideo={toggleExpandVideo}
              openAddVideo={openAddVideo}
              handleEditCourse={handleEditCourse}
              toggleCourseActive={toggleCourseActive}
              handleDeleteCourse={handleDeleteCourse}
              courseVideos={courseVideos}
              openAddQuiz={openAddQuiz}
              openEditVideo={openEditVideo}
              fetchCourseNested={fetchCourseNested}
              setActiveQuizId={setActiveQuizId}
              openEditQuestion={openEditQuestion}
              setQuizForm={setQuizForm}
              setQuizModalOpen={setQuizModalOpen}
              onAddCourseClick={onAddCourseClick}
              courseLoading={courseLoading}
            />
          </TabsContent>

          <TabsContent value="user-controller">
            <UserControllerTab
              loadingAnalytics={loadingAnalytics}
              analytics={analytics}
              userFilterBy={userFilterBy}
              setUserFilterBy={setUserFilterBy}
              handleUnlockUserQuiz={handleUnlockUserQuiz}
              unlocking={unlocking}
              companies={companies} // <-- NEW LINE (REQUIRED)
            />
          </TabsContent>

          <TabsContent value="user-analytics">
            <UserAnalyticsTab
              dateRange={dateRange}
              setDateRange={setDateRange}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* EDIT COURSE */}
      <EditCourseModal
        open={editCourseModal}
        setOpen={setEditCourseModal}
        courseEditForm={courseEditForm}
        setCourseEditForm={setCourseEditForm}
        modalError={modalError}
        modalLoading={modalLoading}
        runModalAction={runModalAction}
        submitEditCourse={submitEditCourse}
        handleImageUpload={handleImageUpload}
      />

      {/* ADD COURSE MODAL */}
      <AddCourseModal
        open={addCourseModalOpen}
        setOpen={setAddCourseModalOpen}
        companyId={addCourseCompanyId}
        onCreated={submitAddCourse}
        modalError={null}
        modalLoading={false}
        handleImageUpload={handleImageUpload}
      />

      {/* ADD VIDEO */}
      <AddVideoModal
        open={videoModalOpen}
        onOpenChange={setVideoModalOpen}
        videoForm={videoForm}
        setVideoForm={setVideoForm}
        modalError={modalError}
        modalLoading={modalLoading}
        onSubmit={() => runModalAction(submitAddVideo)}
      />

      {/* EDIT VIDEO */}
      <EditVideoModal
        open={editVideoModalOpen}
        setOpen={setEditVideoModalOpen}
        videoForm={videoForm}
        setVideoForm={setVideoForm}
        modalError={modalError}
        modalLoading={modalLoading}
        runModalAction={runModalAction}
        submitEditVideo={submitEditVideo}
      />

      {/* QUIZ MODAL */}
      <QuizModal
        open={quizModalOpen}
        setOpen={setQuizModalOpen}
        quizForm={quizForm}
        setQuizForm={setQuizForm}
        modalError={modalError}
        modalLoading={modalLoading}
        runModalAction={runModalAction}
        submitQuiz={submitAddQuiz}
        activeQuizId={activeQuizId}
      />

      {/* QUESTION MODAL */}
      <QuestionModal
        open={questionModalOpen}
        setOpen={setQuestionModalOpen}
        questionForm={questionForm}
        setQuestionForm={setQuestionForm}
        isEditingQuestion={isEditingQuestion}
        modalError={modalError}
        modalLoading={modalLoading}
        setCorrectAnswer={setCorrectAnswer}
        addAnswerField={addAnswerField}
        removeAnswerField={removeAnswerField}
        runModalAction={runModalAction}
        submitQuestion={submitQuestion}
      />
    </div>
  );
};

export default Admin;
