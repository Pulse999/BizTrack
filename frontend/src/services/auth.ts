// frontend/src/services/auth.ts

export type User = {
  user_id: number;
  company_id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_admin: boolean;
  is_super_admin: boolean;
  profile_image_url?: string;
};

export type LoginResponse = {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
};

// Uses your Vercel backend in production and localhost during development
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Centralized role logic
export function isAdminUser(user?: User | null): boolean {
  return !!(user?.is_super_admin || user?.is_admin);
}

export function isSuperAdminUser(user?: User | null): boolean {
  return !!user?.is_super_admin;
}

export async function apiLogin(
  email: string,
  password: string
): Promise<LoginResponse> {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);

      return {
        success: false,
        error:
          errorData?.error || `Login failed with status ${res.status}`,
      };
    }

    const data = await res.json();

    return {
      ...data,
      success: true,
    } as LoginResponse;
  } catch (error) {
    console.error("Login error:", error);

    return {
      success: false,
      error: "Network error occurred. Please check your connection.",
    };
  }
}

export function saveAuth(token: string, user: User): void {
  try {
    localStorage.setItem("lt_token", token);
    localStorage.setItem("lt_user", JSON.stringify(user));
  } catch (error) {
    console.error("Error saving auth data:", error);
    throw new Error("Failed to save authentication data");
  }
}

export function clearAuth(): void {
  try {
    localStorage.removeItem("lt_token");
    localStorage.removeItem("lt_user");
  } catch (error) {
    console.error("Error clearing auth data:", error);
  }
}

export function getAuth(): { token: string | null; user: User | null } {
  try {
    const token = localStorage.getItem("lt_token");
    const userStr = localStorage.getItem("lt_user");

    const user = userStr ? (JSON.parse(userStr) as User) : null;

    return {
      token,
      user,
    };
  } catch (error) {
    console.error("Error getting auth data:", error);

    return {
      token: null,
      user: null,
    };
  }
}

export function isAuthenticated(): boolean {
  const { token, user } = getAuth();
  return !!(token && user);
}

export function isAdmin(): boolean {
  const { user } = getAuth();
  return isAdminUser(user);
}