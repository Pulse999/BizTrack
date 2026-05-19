import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CoursePanel from "@/components/CoursePanel";
import { Plus } from "lucide-react";

export type Course = {
  course_id: number;
  title: string;
  description: string;
  difficulty_level: string;
  image_url?: string;
  company_id: number | null;
  is_active?: boolean;
};

export type Company = {
  company_id: number;
  name: string;
};

type Props = {
  isSuperAdmin: boolean;
  user: { company_id?: number | null };

  courses: Course[];
  companies: Company[];

  courseVideos: Record<number, any>;
  courseLoading: Record<number, boolean>;

  expandedCourse: number | null;
  expandedVideos: Record<number, boolean>;

  toggleExpandCourse: (id: number) => void;
  toggleExpandVideo: (id: number) => void;

  onAddCourseClick: (companyId: number | null) => void;

  handleEditCourse: (course: Course) => void;
  toggleCourseActive: any;
  handleDeleteCourse: (id: number) => void;

  openAddVideo: (id: number) => void;
  openEditVideo: (v: any) => void;

  openAddQuiz: (id: number) => void;
  fetchCourseNested: (id: number) => void;

  setActiveQuizId: (id: number | null) => void;
  openEditQuestion: (q: any) => void;
  setQuizForm: any;
  setQuizModalOpen: (b: boolean) => void;
};

const CoursesTab: React.FC<Props> = (props) => {
  const panelProps = {
    expandedCourse: props.expandedCourse,
    expandedVideos: props.expandedVideos,
    toggleExpandCourse: props.toggleExpandCourse,
    toggleExpandVideo: props.toggleExpandVideo,

    openAddVideo: props.openAddVideo,
    openEditVideo: props.openEditVideo,
    openAddQuiz: props.openAddQuiz,

    handleEditCourse: props.handleEditCourse,
    toggleCourseActive: props.toggleCourseActive,
    handleDeleteCourse: props.handleDeleteCourse,

    courseVideos: props.courseVideos,
    courseLoading: props.courseLoading,
    fetchCourseNested: props.fetchCourseNested,

    setActiveQuizId: props.setActiveQuizId,
    openEditQuestion: props.openEditQuestion,
    setQuizForm: props.setQuizForm,
    setQuizModalOpen: props.setQuizModalOpen,

    user: props.user,
    isSuperAdmin: props.isSuperAdmin,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div>
            <CardTitle>Courses</CardTitle>
            <CardDescription>
              Manage courses, videos, quizzes and content
            </CardDescription>
          </div>

          {/* NORMAL ADMIN add button */}
          {!props.isSuperAdmin && (
            <Button
              size="sm"
              onClick={() =>
                props.onAddCourseClick(props.user?.company_id ?? null)
              }
            >
              <Plus className="h-4 w-4 mr-2" /> Add Course
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* SUPER ADMIN – GENERAL COURSES */}
        {props.isSuperAdmin && (
          <section className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">General Courses</h3>
                <p className="text-muted-foreground">
                  Courses visible to all companies
                </p>
              </div>

              <Button size="sm" onClick={() => props.onAddCourseClick(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Course
              </Button>
            </div>

            <div className="space-y-3">
              {props.courses
                .filter((c) => !c.company_id)
                .map((c) => (
                  <CoursePanel
                    key={c.course_id}
                    course={c}
                    {...panelProps}
                  />
                ))}
            </div>
          </section>
        )}

        {/* SUPER ADMIN – COMPANY GROUPS */}
        {props.isSuperAdmin &&
          props.companies.map((company) => {
            const list = props.courses.filter(
              (c) => c.company_id === company.company_id
            );
            if (!list.length) return null;

            return (
              <section key={company.company_id} className="mt-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{company.name} Courses</h3>
                    <p className="text-muted-foreground">
                      Courses belonging to {company.name}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => props.onAddCourseClick(company.company_id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Course
                  </Button>
                </div>

                <div className="space-y-3">
                  {list.map((c) => (
                    <CoursePanel
                      key={c.course_id}
                      course={c}
                      {...panelProps}
                    />
                  ))}
                </div>
              </section>
            );
          })}

        {/* NORMAL ADMIN */}
        {!props.isSuperAdmin && (
          <section className="mt-6 space-y-3">
            {props.courses
              .filter((c) => c.company_id === props.user?.company_id)
              .map((c) => (
                <CoursePanel
                  key={c.course_id}
                  course={c}
                  {...panelProps}
                />
              ))}
          </section>
        )}
      </CardContent>
    </Card>
  );
};

export default CoursesTab;
