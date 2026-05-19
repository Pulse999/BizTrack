import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Clock,
  Users,
  Star,
  Search,
  Play,
  Bookmark,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { apiGet, apiPost, apiDelete } from "@/services/api";
import { Progress } from "@/components/ui/progress";
import { getAuth } from "@/services/auth";

interface Course {
  course_id: number;
  title: string;
  description: string | null;
  image_url?: string | null;
  difficulty_level?: string;
  progress_percent?: number;
  avg_rating?: number | string | null;
  rating_count?: number;
  quizzes_count?: number;
  students_count?: number;
  is_bookmarked?: boolean;
  is_enrolled?: boolean;

  company_id?: number | null;
}

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [companyName, setCompanyName] = useState("Company");

  const auth = getAuth();
  const user = auth?.user;

  const userCompanyId = user?.company_id ?? null;


  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // if user is admin (not super), request include_general so backend returns both general + company courses
        const isAdmin = !!user?.is_admin;
        const qs = isAdmin ? "?include_general=true" : "";
        const data = await apiGet(`/api/courses${qs}`);
        if (data.success) {
          setCourses(data.courses);
        } else {
          setCourses([]);
        }
      } catch (err) {
        console.error("Failed to fetch courses:", err);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };


    fetchCourses();
  }, []);

  // ⭐ Fetch company name from backend
  useEffect(() => {
    if (!userCompanyId) return;

    // debug
    console.log("Fetching company name for id:", userCompanyId);

    apiGet(`/api/companies/${userCompanyId}/name`)
      .then((res) => {
        console.log("Company name response:", res);
        if (res.success && res.name) {
          setCompanyName(res.name);
        } else {
          // fallback name remains "Company"
        }
      })
      .catch((err) => {
        console.error("Failed to fetch company name:", err);
      });
  }, [userCompanyId]);

  const handleBookmarkToggle = async (course: Course) => {
    try {
      if (course.is_bookmarked) {
        await apiDelete(`/api/courses/${course.course_id}/bookmark`);
        setCourses((prev) =>
          prev.map((c) =>
            c.course_id === course.course_id
              ? { ...c, is_bookmarked: false }
              : c
          )
        );
      } else {
        await apiPost(`/api/courses/${course.course_id}/bookmark`, {});
        setCourses((prev) =>
          prev.map((c) =>
            c.course_id === course.course_id
              ? { ...c, is_bookmarked: true }
              : c
          )
        );
      }
    } catch (err) {
      console.error("Bookmark toggle failed:", err);
    }
  };

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  // ⭐ Split courses
  const generalCourses = filteredCourses.filter((c) => !c.company_id);
  const companyCourses = filteredCourses.filter(
    (c) => c.company_id === userCompanyId
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/20 flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading courses...</p>
      </div>
    );
  }

  const renderCourseCard = (course: Course, idx: number) => {
    const progressPercent = Math.round(course.progress_percent ?? 0);

    const rating =
      course.avg_rating === null ||
      course.avg_rating === undefined ||
      course.avg_rating === "NaN"
        ? "N/A"
        : Number(course.avg_rating).toFixed(1);

    const buttonText = course.is_enrolled
      ? "Continue Course"
      : "Enroll First";

    return (
      <Card
        key={course.course_id}
        className="group overflow-hidden rounded-2xl border bg-gradient-to-b from-background to-secondary/10"
      >
        <div className="h-60 relative">
          <img
            src={
              course.image_url ||
              `https://picsum.photos/seed/course${idx}/600/300`
            }
            className="w-full h-full object-cover"
          />

          <Button
            size="icon"
            variant="secondary"
            className="absolute top-3 right-3 bg-white/70"
            onClick={() => handleBookmarkToggle(course)}
          >
            <Bookmark
              className="h-4 w-4"
              fill={course.is_bookmarked ? "currentColor" : "none"}
            />
          </Button>
        </div>

        <CardHeader className="p-5">
          <CardTitle className="text-xl flex justify-between items-center">
            {course.title}
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardTitle>
          <CardDescription className="line-clamp-2 text-sm">
            {course.description || "No description"}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-5 pb-5">
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {course.quizzes_count ?? 0} quizzes
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {course.students_count ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400" />
              {rating}
            </span>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          <Button asChild className="w-full">
            <Link to={`/course/${course.course_id}`}>
              <Play className="h-4 w-4 mr-2" />
              {buttonText}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-secondary/20">
      <Navigation />

      <main className="container mx-auto px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-black to-black bg-clip-text text-transparent">
            Explore Our Courses
          </h1>
        </div>

        <div className="mb-10 flex flex-col sm:flex-row gap-4 items-center justify-center">
          <div className="relative w-full sm:w-2/3 lg:w-1/2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for courses..."
              className="pl-10 py-6 text-lg rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ⭐ GENERAL COURSES SECTION */}
        {generalCourses.length > 0 && (
          <section className="mb-14">
            <h2 className="text-2xl font-bold mb-4">General Courses</h2>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {generalCourses.map((course, idx) =>
                renderCourseCard(course, idx)
              )}
            </div>
          </section>
        )}

        {/* ⭐ COMPANY COURSES SECTION */}
        {companyCourses.length > 0 && (
          <section className="mb-14">
            <h2 className="text-2xl font-bold mb-4">
              {companyName} Courses
            </h2>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {companyCourses.map((course, idx) =>
                renderCourseCard(course, idx)
              )}
            </div>
          </section>
        )}

        {filteredCourses.length === 0 && (
          <p className="text-center mt-10 text-muted-foreground">
            No courses found.
          </p>
        )}
      </main>
    </div>
  );
};

export default Courses;
