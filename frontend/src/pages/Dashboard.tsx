// frontend/src/pages/Dashboard.tsx
 
import Navigation from "@/components/Navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, PlayCircle, Award, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAuth } from "../services/auth";
import { apiGet } from "@/services/api";
 
type BookmarkedCourse = {
  course_id: number;
  title: string;
  progress_percent?: number;
};
 
type EnrolledCourse = {
  course_id: number;
  title: string;
  progress_percent?: number;
  videos_count?: number;
  quizzes_count?: number;
};
 
const Dashboard = () => {
  const [userName, setUserName] = useState("User");
  const [bookmarkedCourses, setBookmarkedCourses] = useState<BookmarkedCourse[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(true);
 
  const [statsLoading, setStatsLoading] = useState(true);
  const [coursesEnrolled, setCoursesEnrolled] = useState<number>(0);
  const [videosWatched, setVideosWatched] = useState<number>(0);
  const [certificatesEarned, setCertificatesEarned] = useState<number>(0);
  const [averageScore, setAverageScore] = useState<number | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
 
  useEffect(() => {
    const { user } = getAuth();
    if (user) {
      const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");
      setUserName(fullName || user.email || "User");
    }
 
    // fetch bookmarks (existing)
    const fetchBookmarks = async () => {
      try {
        const data = await apiGet("/api/courses/bookmarks");
        if (data.success && Array.isArray(data.courses)) {
          setBookmarkedCourses(data.courses);
        } else {
          setBookmarkedCourses([]);
        }
      } catch (err) {
        console.error("Failed to load bookmarked courses", err);
        setBookmarkedCourses([]);
      } finally {
        setLoadingBookmarks(false);
      }
    };
 
    // fetch user stats & enrolled courses
    const fetchUserStats = async () => {
      setStatsLoading(true);
      try {
        const data = await apiGet("/api/stats/me");
        if (data.success && data.stats) {
          const s = data.stats;
          setCoursesEnrolled(s.coursesEnrolled ?? 0);
          setVideosWatched(s.videosWatched ?? 0);
          setCertificatesEarned(s.certificatesEarned ?? 0);
          setAverageScore(s.averageScore !== undefined ? s.averageScore : null);
          // enrolledCourses returned as array
          setEnrolledCourses(Array.isArray(data.enrolledCourses) ? data.enrolledCourses : []);
        } else {
          setCoursesEnrolled(0);
          setVideosWatched(0);
          setCertificatesEarned(0);
          setAverageScore(null);
          setEnrolledCourses([]);
        }
      } catch (err) {
        console.error("Failed to load user stats", err);
        setCoursesEnrolled(0);
        setVideosWatched(0);
        setCertificatesEarned(0);
        setAverageScore(null);
        setEnrolledCourses([]);
      } finally {
        setStatsLoading(false);
      }
    };
 
    fetchBookmarks();
    fetchUserStats();
  }, []);
 
  const stats = [
    {
      label: "Courses Enrolled",
      value: statsLoading ? "…" : String(coursesEnrolled),
      icon: BookOpen,
      color: "text-primary",
    },
    {
      label: "Videos Watched",
      value: statsLoading ? "…" : String(videosWatched),
      icon: PlayCircle,
      color: "text-primary",
    },
    {
      label: "Certificates Earned",
      value: statsLoading ? "…" : String(certificatesEarned),
      icon: Award,
      color: "text-primary",
    },
    {
      label: "Average Score",
      value: statsLoading ? "…" : (averageScore !== null ? `${Math.round(averageScore)}%` : "N/A"),
      icon: TrendingUp,
      color: "text-primary",
    },
  ];
 
  return (
    <div className="min-h-screen bg-secondary/20">
      <Navigation />
 
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {userName}!</h1>
          <p className="text-muted-foreground">
            Track your learning progress and continue where you left off
          </p>
        </div>
 
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
 
        {/* Bookmarked Courses */}
        {!loadingBookmarks && bookmarkedCourses.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Bookmarked Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarkedCourses.map((course) => {
                const progress = Math.round(course.progress_percent ?? 0);
                return (
                  <Card
                    key={course.course_id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <CardDescription>Bookmarked course</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Progress</span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                        <Button asChild className="w-full">
                          <Link to={`/course/${course.course_id}`}>
                            {progress === 100
                              ? "Review Course"
                              : "Continue Course"}
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
 
        {/* Continue Learning */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Continue Learning</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.length === 0 && !statsLoading ? (
              <p className="text-muted-foreground">You are not enrolled in any courses yet.</p>
            ) : (
              enrolledCourses.map((course) => {
                const progress = Math.round(course.progress_percent ?? 0);
                // Skip fully completed courses from "Continue Learning" (as requested)
                if (progress >= 100) return null;
                // Show in continue learning
                return (
                  <Card
                    key={course.course_id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <CardDescription>
                        {/* Keep the same wording, approximate completed count */}
                        {course.videos_count ? `0 of ${course.videos_count} videos completed` : ""}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Progress</span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                        <Button asChild className="w-full">
                          <Link to={`/course/${course.course_id}`}>
                            {progress === 100 ? "Review Course" : "Continue"}
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
 
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium">
                    Completed: Effective Communication
                  </p>
                  <p className="text-sm text-muted-foreground">2 hours ago</p>
                </div>
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium">
                    Watched: Handling Customer Complaints
                  </p>
                  <p className="text-sm text-muted-foreground">Yesterday</p>
                </div>
                <PlayCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    Quiz Passed: Safety Procedures - Score 92%
                  </p>
                  <p className="text-sm text-muted-foreground">2 days ago</p>
                </div>
                <Award className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
 
export default Dashboard;