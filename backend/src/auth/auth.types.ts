export interface SessionUser {
  id: string;
  code: number;
  username: string;
  fullName: string;
  mobile: string;
  email: string | null;
  role: {
    id: string;
    code: string;
    name: string;
    level: number;
  };
}

export interface AuthenticatedRequest {
  user?: SessionUser;
  sessionToken?: string;
  headers: Record<string, string | string[] | undefined>;
}
