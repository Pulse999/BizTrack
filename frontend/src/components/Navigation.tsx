import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, BookOpen, Settings, User } from "lucide-react";
import biztrackLogo from "@/assets/biztrack-logo.png";
import { Button } from "@/components/ui/button";
import { getAuth, clearAuth } from "@/services/auth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { supabase } from "@/services/supabase.ts";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = getAuth();

  const [uploading, setUploading] = useState(false);

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/courses", label: "Courses", icon: BookOpen },
  ];

  if (user?.is_admin || user?.is_super_admin) {
    navItems.push({ path: "/admin", label: "Admin", icon: Settings });
  }

  const isActive = (path: string) => location.pathname === path;

  const roleLabel = user?.is_super_admin
    ? "Super Admin"
    : user?.is_admin
      ? "Admin"
      : "Member";

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  // --------------------------------------------------
  // PROFILE IMAGE UPLOAD
  // --------------------------------------------------
  const handleProfileUpload = async () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";

    fileInput.onchange = async () => {
      const file = fileInput.files?.[0];
      if (!file || !user) return;

      setUploading(true);

      const ext = file.name.split(".").pop();
      const filePath = `profile-${user.user_id}-${Date.now()}.${ext}`;

      // DELETE OLD FILE
      if (user.profile_image_url) {
        try {
          const match = user.profile_image_url.match(/profile-pictures\/(.+)$/);
          if (match?.[1]) {
            await supabase.storage.from("profile-pictures").remove([match[1]]);
          }
        } catch (err) {
          console.error("DELETE ERROR:", err);
        }
      }

      // UPLOAD NEW IMAGE
      const { error } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, file);

      if (error) {
        console.error("UPLOAD FAILED:", error);
        setUploading(false);
        return;
      }

      const publicUrl = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(filePath).data.publicUrl;

      // SEND TO BACKEND
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/profile-image`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("lt_token")}`,
          },
          body: JSON.stringify({ image_url: publicUrl }),
        },
      );

      const json = await response.json();
      console.log("BACKEND RESPONSE:", json);

      // UPDATE LOCAL STORAGE
      const updated = { ...user, profile_image_url: publicUrl };
      localStorage.setItem("lt_user", JSON.stringify(updated));

      setUploading(false);
      window.location.reload();
    };

    fileInput.click();
  };

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center">
            <img src={biztrackLogo} alt="BizTrack" className="h-10" />
          </Link>

          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.path}
                asChild
                variant={isActive(item.path) ? "default" : "ghost"}
              >
                <Link to={item.path} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </Button>
            ))}
          </div>

          {/* Profile menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full border p-1 hover:bg-accent transition">
                {user?.profile_image_url ? (
                  <img
                    src={user.profile_image_url}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-6 w-6 text-muted-foreground" />
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>
                <div className="flex items-center gap-3">
                  {user?.profile_image_url ? (
                    <img
                      src={user.profile_image_url}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-muted">
                      <User className="h-6 w-6" />
                    </div>
                  )}

                  <div>
                    <p className="font-medium">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{roleLabel}</p>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <button
                  onClick={handleProfileUpload}
                  className="w-full text-left"
                >
                  {uploading ? "Uploading..." : "Upload Profile Picture"}
                </button>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <button onClick={handleLogout} className="w-full text-left">
                  Sign Out
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
