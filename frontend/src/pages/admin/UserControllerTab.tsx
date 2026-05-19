// src/pages/admin/UserControllerTab.tsx

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

type AttemptAnswer = {
  text: string;
  correct: boolean;
  answer?: string;
};

type Attempt = {
  score: number;
  passed: boolean;
  date: string;
  answers: AttemptAnswer[];
};

type AnalyticsUser = {
  user_id: number;
  name: string;
  email: string;
  passed: boolean;
  attempts: Attempt[];
};

type AnalyticsQuiz = {
  quiz_id: number;
  title: string;
  users: AnalyticsUser[];
};

type AnalyticsCourse = {
  course_id: number;
  title: string;
  company_id: number | null; // <-- REQUIRED FOR GROUPING
  company_name?: string;
  quizzes: AnalyticsQuiz[];
};

type Props = {
  loadingAnalytics: boolean;
  analytics: AnalyticsCourse[];
  userFilterBy: Record<number, "all" | "passed" | "failed">;
  setUserFilterBy: React.Dispatch<
    React.SetStateAction<Record<number, "all" | "passed" | "failed">>
  >;
  handleUnlockUserQuiz: (quizId: number, userId: number) => void;
  unlocking: Record<string, boolean>;

  // NEW: companies list passed from Admin (already fetched there)
  companies?: { company_id: number; name: string }[];
};

const UserControllerTab = ({
  loadingAnalytics,
  analytics,
  userFilterBy,
  setUserFilterBy,
  handleUnlockUserQuiz,
  unlocking,
  companies = [],
}: Props) => {
  const applyUserFilter = (quizId: number, users: AnalyticsUser[]) => {
    const f = userFilterBy[quizId] || "all";
    if (f === "all") return users;
    if (f === "passed") return users.filter((u) => u.passed);
    return users.filter((u) => !u.passed);
  };

  /* -------------------------------------------------------------
     GROUP ANALYTICS EXACTLY LIKE CoursesTab.tsx
     ------------------------------------------------------------- */

  // GENERAL COURSES (no company_id)
  const generalCourses = analytics.filter((c) => !c.company_id);

  // GROUP BY COMPANY
  const groupedByCompany: Record<number, AnalyticsCourse[]> = {};
  analytics.forEach((c) => {
    if (c.company_id) {
      if (!groupedByCompany[c.company_id]) {
        groupedByCompany[c.company_id] = [];
      }
      groupedByCompany[c.company_id].push(c);
    }
  });

  const getCompanyName = (companyId: number) => {
    const found = companies.find((c) => c.company_id === companyId);
    return found ? found.name : `Company ${companyId}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Controller</CardTitle>
        <CardDescription>
          Manage quiz attempts and view detailed user performance
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        {loadingAnalytics ? (
          <p className="text-muted-foreground">Loading analytics...</p>
        ) : analytics.length === 0 ? (
          <p className="text-muted-foreground">
            No analytics available for this company.
          </p>
        ) : (
          <>
            {/* ---------------------------------------------------------
                GENERAL COURSES (company_id = null)
               --------------------------------------------------------- */}
            {generalCourses.length > 0 && (
              <section>
                <h3 className="text-xl font-bold mb-3">General Courses</h3>

                <div className="space-y-4">
                  {generalCourses.map((course) => (
                    <CourseAnalyticsBlock
                      key={course.course_id}
                      course={course}
                      userFilterBy={userFilterBy}
                      setUserFilterBy={setUserFilterBy}
                      applyUserFilter={applyUserFilter}
                      handleUnlockUserQuiz={handleUnlockUserQuiz}
                      unlocking={unlocking}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ---------------------------------------------------------
                COMPANY GROUPS
               --------------------------------------------------------- */}
            {Object.keys(groupedByCompany).map((companyId) => {
              const cid = Number(companyId);
              const list = groupedByCompany[cid];
              const companyName = getCompanyName(cid);

              return (
                <section key={companyId} className="mt-10">
                  <h3 className="text-xl font-bold mb-3">
                    {companyName} Courses
                  </h3>

                  <div className="space-y-4">
                    {list.map((course) => (
                      <CourseAnalyticsBlock
                        key={course.course_id}
                        course={course}
                        userFilterBy={userFilterBy}
                        setUserFilterBy={setUserFilterBy}
                        applyUserFilter={applyUserFilter}
                        handleUnlockUserQuiz={handleUnlockUserQuiz}
                        unlocking={unlocking}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        )}
      </CardContent>
    </Card>
  );
};

/* ---------------------------------------------------------
   COMPONENT: Course Block (same UI, just reused)
   --------------------------------------------------------- */

const CourseAnalyticsBlock = ({
  course,
  userFilterBy,
  setUserFilterBy,
  applyUserFilter,
  handleUnlockUserQuiz,
  unlocking,
}: any) => (
  <details className="group border rounded-lg p-4 bg-secondary/20">
    <summary className="cursor-pointer flex items-center gap-3">
      <ChevronRight className="h-5 w-5 text-muted-foreground group-open:rotate-90 transition-transform" />
      <p className="font-semibold text-lg">{course.title}</p>
    </summary>

    <div className="mt-4 space-y-4">
      {course.quizzes.map((quiz: any) => (
        <details
          key={quiz.quiz_id}
          className="group border rounded-lg p-3 bg-background"
        >
          <summary className="cursor-pointer flex items-center gap-3">
            <ChevronRight className="h-4 w-4 text-muted-foreground group-open:rotate-90 transition-transform" />
            <p className="font-medium">{quiz.title}</p>
          </summary>

          {/* FILTER BUTTONS */}
          <div className="mt-3 flex gap-3 text-sm">
            <FilterButton
              active={userFilterBy[quiz.quiz_id] === "all"}
              onClick={() =>
                setUserFilterBy((s: any) => ({
                  ...s,
                  [quiz.quiz_id]: "all",
                }))
              }
            >
              All
            </FilterButton>

            <FilterButton
              active={userFilterBy[quiz.quiz_id] === "passed"}
              color="green"
              onClick={() =>
                setUserFilterBy((s: any) => ({
                  ...s,
                  [quiz.quiz_id]: "passed",
                }))
              }
            >
              Passed
            </FilterButton>

            <FilterButton
              active={userFilterBy[quiz.quiz_id] === "failed"}
              color="red"
              onClick={() =>
                setUserFilterBy((s: any) => ({
                  ...s,
                  [quiz.quiz_id]: "failed",
                }))
              }
            >
              Failed
            </FilterButton>
          </div>

          {/* USERS */}
          <div className="mt-4 space-y-3">
            {applyUserFilter(quiz.quiz_id, quiz.users).map((user: any) => (
              <UserAttempts
                key={user.user_id}
                user={user}
                quizId={quiz.quiz_id}
                unlocking={unlocking}
                handleUnlockUserQuiz={handleUnlockUserQuiz}
              />
            ))}
          </div>
        </details>
      ))}
    </div>
  </details>
);

/* ---------------------------------------------------------
   Filter Buttons (unchanged)
   --------------------------------------------------------- */

const FilterButton = ({ children, active, color, onClick }: any) => (
  <button
    className={`px-3 py-1 rounded ${
      active
        ? color === "green"
          ? "bg-green-600 text-white"
          : color === "red"
          ? "bg-red-600 text-white"
          : "bg-primary text-white"
        : ""
    }`}
    onClick={onClick}
  >
    {children}
  </button>
);

/* ---------------------------------------------------------
   User attempts (unchanged)
   --------------------------------------------------------- */

const UserAttempts = ({
  user,
  quizId,
  unlocking,
  handleUnlockUserQuiz,
}: any) => (
  <details className="group border rounded-lg p-3 bg-secondary/30">
    <summary className="cursor-pointer flex items-center justify-between">
      <div className="flex items-center gap-3">
        <ChevronRight className="h-4 w-4 text-muted-foreground group-open:rotate-90 transition-transform" />
        <div>
          <p className="font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <span
        className={`text-sm font-semibold ${
          user.passed ? "text-green-600" : "text-red-600"
        }`}
      >
        {user.passed ? "Passed" : "Failed"}
      </span>
    </summary>

    <div className="mt-3 space-y-3">
      <div className="flex justify-end">
        <button
          onClick={() => handleUnlockUserQuiz(quizId, user.user_id)}
          disabled={!!unlocking[`${quizId}:${user.user_id}`]}
          className="text-sm px-3 py-1 border rounded hover:bg-secondary"
        >
          {unlocking[`${quizId}:${user.user_id}`]
            ? "Unlocking..."
            : "Refresh Attempts"}
        </button>
      </div>

      {user.attempts.map((att: any, i: number) => (
        <details key={i} className="group border rounded-lg p-3 bg-background">
          <summary className="cursor-pointer flex justify-between items-center">
            <div className="flex items-center gap-3">
              <ChevronRight className="h-4 w-4 group-open:rotate-90 transition-transform" />
              <p className="text-sm">
                Attempt #{i + 1} —{" "}
                {new Date(att.date).toLocaleDateString()}
              </p>
            </div>

            <p className={att.passed ? "text-green-600" : "text-red-600"}>
              {att.score}% ({att.passed ? "Passed" : "Failed"})
            </p>
          </summary>

          <ul className="ml-5 mt-2 list-disc text-sm">
            {att.answers.map((ans: any, idx: number) => (
              <li
                key={idx}
                className={ans.correct ? "text-green-600" : "text-red-600"}
              >
                {ans.text} {ans.correct ? "✓" : "✗"}
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  </details>
);

export default UserControllerTab;
