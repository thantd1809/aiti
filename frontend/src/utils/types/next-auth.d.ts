import { User } from "next-auth";

declare module "next-auth" {
  // Custome user interface
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    user_id?: string;
    pwd_status: boolean;
    access_token: string;
    refresh_token: string;
    status: string;
    code: string;
    msg: string;
    role: number;
  }
  // Add the user'info to the session
  interface Session {
    user: {
      // id: number;
      user_id: number;
      name: string;
      email: string;
      pwd_status: boolean;
      access_token: string;
      refresh_token: string;
      status: string;
      code: string;
      msg: string;
      role: number;
    };
  }
}
