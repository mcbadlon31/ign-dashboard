
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const DEV_BYPASS = process.env.DEV_BYPASS_AUTH === "true";

const handler = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ account }) {
      if (DEV_BYPASS) return true;
      // Allow Google if configured
      if (account?.provider === "google") return true;
      return false;
    },
  },
});

export { handler as GET, handler as POST };
