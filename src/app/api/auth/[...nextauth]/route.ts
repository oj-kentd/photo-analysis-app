import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Configure NextAuth with Google provider
const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/photoslibrary.readonly https://www.googleapis.com/auth/photoslibrary.appendonly https://www.googleapis.com/auth/photoslibrary.edit.appcreateddata",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    // Save the access token and refresh token in the session
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    // Make the access token available on the client
    async session({ session, token }) {
      if (session.user) {
        // @ts-ignore
        session.accessToken = token.accessToken;
        // @ts-ignore
        session.refreshToken = token.refreshToken;
        // @ts-ignore
        session.expiresAt = token.expiresAt;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
