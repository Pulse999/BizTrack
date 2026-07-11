import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Power,
} from "lucide-react";
import { apiDelete } from "@/services/api";

/* Skeleton shimmer */
const SkeletonLine = ({ w = "100%" }: { w?: string }) => (
  <div
    className="animate-pulse bg-gray-300/60 rounded h-4"
    style={{ width: w }}
  ></div>
);

const CoursePanel = ({
  course,
  user,
  isSuperAdmin,
  expandedCourse,
  expandedVideos,
  toggleExpandCourse,
  toggleExpandVideo,
  openAddVideo,
  handleEditCourse,
  toggleCourseActive,
  handleDeleteCourse,
  courseVideos,
  courseLoading,
  openAddQuiz,
  openEditVideo,
  fetchCourseNested,
  setActiveQuizId,
  openEditQuestion,
  setQuizForm,
  setQuizModalOpen,
}: any) => {
  const videos = courseVideos?.[course.course_id] || [];

  return (
    <div
      className={`border rounded-lg transition mb-3 ${
        course.is_active ? "" : "opacity-70 bg-gray-50"
      }`}
    >
      {/* COURSE HEADER */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/50"
        onClick={() => toggleExpandCourse(course.course_id)}
      >
        <div className="flex items-center gap-3 flex-1">
          {expandedCourse === course.course_id ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}

          <div className="flex-1">
            <p className="font-medium">{course.title}</p>
            <p className="text-sm text-muted-foreground">
              {course.description}
            </p>
          </div>
        </div>

        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openAddVideo(course.course_id)}
          >
            <Plus className="h-4 w-4" /> Video
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditCourse(course)}
          >
            <Pencil className="h-4 w-4" />
          </Button>

          {(isSuperAdmin || course.company_id === user.company_id) && (
            <Button
              variant={course.is_active ? "outline" : "destructive"}
              size="sm"
              onClick={() =>
                toggleCourseActive(course.course_id, course.is_active)
              }
            >
              <Power className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteCourse(course.course_id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* COURSE EXPANDED CONTENT */}
      {expandedCourse === course.course_id && (
        <div className="p-4 space-y-3 bg-secondary/20 border-t">
          {/* LOADING SKELETONS */}
          {courseLoading?.[course.course_id] && (
            <div className="space-y-4 py-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="border rounded-lg bg-white p-4 space-y-3 animate-pulse"
                >
                  <SkeletonLine w="40%" />
                  <SkeletonLine w="60%" />
                  <SkeletonLine w="30%" />
                </div>
              ))}
            </div>
          )}

          {/* REAL VIDEOS */}
          {!courseLoading?.[course.course_id] &&
            videos.map((v: any) => (
              <div key={v.video_id} className="border rounded-lg bg-white mb-3">
                {/* VIDEO HEADER */}
                <div
                  className="flex justify-between items-center p-4 cursor-pointer hover:bg-secondary/40"
                  onClick={() => toggleExpandVideo(v.video_id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {expandedVideos[v.video_id] ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}

                    <div className="flex-1">
                      <p className="font-medium">{v.title}</p>
                      {v.description && (
                        <p className="text-sm text-muted-foreground">
                          {v.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {v.video_url}
                      </p>
                    </div>
                  </div>

                  <div
                    className="flex gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!v.quiz ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAddQuiz(v.video_id)}
                      >
                        <Plus className="h-4 w-4" /> Quiz
                      </Button>
                    ) : (
                      <div className="flex items-center text-sm text-muted-foreground px-2">
                        Quiz exists
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditVideo(v)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (!confirm("Delete this video?")) return;
                        await apiDelete(`/content/videos/${v.video_id}`);
                        await fetchCourseNested(course.course_id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* QUIZ + QUESTIONS */}
                {expandedVideos[v.video_id] && v.quiz && (
                  <div className="p-4 pt-0">
                    <div className="rounded-lg border p-3 bg-secondary/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{v.quiz.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Passing score: {v.quiz.passing_score}%
                          </p>
                        </div>

                        <div
                          className="flex gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setActiveQuizId(v.quiz.quiz_id);
                              openEditQuestion(v.quiz.quiz_id);
                            }}
                          >
                            Add Question
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setQuizForm({
                                title: v.quiz.title,
                                passing_score: v.quiz.passing_score,
                              });
                              setActiveQuizId(v.quiz.quiz_id);
                              setQuizModalOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              if (!confirm("Delete this quiz?")) return;
                              await apiDelete(
                                `/content/quizzes/${v.quiz.quiz_id}`,
                              );
                              await fetchCourseNested(course.course_id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2">
                        {(v.quiz.questions || []).map((q: any) => (
                          <div
                            key={q.question_id}
                            className="border rounded p-2 bg-white"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{q.text}</p>
                                <ul className="mt-1 text-sm text-muted-foreground list-disc pl-5">
                                  {(q.answers || []).map((a: any) => (
                                    <li key={a.answer_id}>
                                      {a.text} {a.is_correct ? "— ✓" : ""}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div
                                className="flex gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditQuestion(q)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    if (!confirm("Delete this question?"))
                                      return;
                                    await apiDelete(
                                      `/content/questions/${q.question_id}`,
                                    );
                                    await fetchCourseNested(course.course_id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default CoursePanel;
