// backend/src/types/index.ts
export interface BiztrackUser {
  UserID: number;
  Firstname: string;
  Lastname: string;
  Email: string;
  // New fields
  company_id?: number;
  is_super_admin?: boolean;
  profile_image_url?: string;
}

export interface DbUser {
  user_id: number;
  biztrack_user_id: number;
  biztrack_company_id?: number | null;
  email: string;
  first_name: string;
  last_name: string;
  is_admin: number;
  // New fields added to support company scoping and super-admin
  company_id?: number;
  is_super_admin?: boolean;
  profile_image_url?: string;
}
