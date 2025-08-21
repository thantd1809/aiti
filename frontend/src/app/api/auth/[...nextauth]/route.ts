import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { continueGoogle } from "@/src/utils/ApiService";

//Login with Google
const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_ID as string,
      clientSecret: process.env.NEXT_PUBLIC_GOOGLE_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60,
  },
  callbacks: {
      async jwt({ token, user, account }) {
        if (user && account?.provider === "google") {
          const res = await continueGoogle({ email: user.email as string, password: "", name: "" });
    
          token.access_token = res.data.data.access_token;
          token.refresh_token = res.data.data.refresh_token;
        }
        //save access_token and refresh_token to jwt 
        return token;
      },
    },
  },
);

export { handler as GET, handler as POST };
