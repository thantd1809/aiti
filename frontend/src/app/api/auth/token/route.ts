import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  return NextResponse.json({
    access_token: token?.access_token,
    refresh_token: token?.refresh_token,
  });
}
