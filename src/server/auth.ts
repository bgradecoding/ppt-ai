// import { PrismaAdapter } from "@auth/prisma-adapter"; // Removed
// import { type Adapter } from "next-auth/adapters"; // Removed
// import GoogleProvider from "next-auth/providers/google"; // Removed
import { env } from "@/env";
import { db } from "@/server/db";
// NextAuth, Session, DefaultSession are not used, so their import is removed.

// declare module "next-auth" block removed as no other files import Session or User from "next-auth"

// Removed NextAuth(...) call and its options
// export const { auth, handlers, signIn, signOut } = NextAuth({
//   trustHost: true,
//   session: {
//     strategy: "jwt",
//   },
//   callbacks: {
//     async jwt({ token, user, trigger, session }) {
//       if (user) {
//         token.id = user.id;
//         token.name = user.name;
//         token.image = user.image;
//         token.picture = user.image;
//       }

//       // Handle updates
//       if (trigger === "update" && (session as Session)?.user) {
//         const user = await db.user.findUnique({
//           where: { id: token.id as string },
//         });
//         console.log("Session", session, user);
//         if (session) {
//           token.name = (session as Session).user.name;
//           token.image = (session as Session).user.image;
//           token.picture = (session as Session).user.image;
//         }
//       }

//       return token;
//     },
//     async session({ session, token }) {
//       session.user.id = token.id as string;
//       return session;
//     },
//     async signIn({ user, account }) {
//       if (account?.provider === "google") {
//         const dbUser = await db.user.findUnique({
//           where: { email: user.email! },
//           select: { id: true },
//         });

//         if (!dbUser) {
//           // Potentially create user or handle as needed
//         }
//       }

//       return true;
//     },
//   },

//   adapter: PrismaAdapter(db) as Adapter,
//   providers: [
//     GoogleProvider({
//       clientId: env.GOOGLE_CLIENT_ID,
//       clientSecret: env.GOOGLE_CLIENT_SECRET,
//     }),
//   ],
// });

// Add any other necessary exports or code here if needed, otherwise the file can be deleted if empty.
// For now, let's keep the imports that might be used by other files,
// but if not, this file might be deleted later.
export { env, db }; // PrismaAdapter, GoogleProvider, Adapter removed from exports
// export type { Adapter }; // Adapter type removed
