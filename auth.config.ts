import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnProtectedUrl = nextUrl.pathname.startsWith('/dashboard') || nextUrl.pathname.startsWith('/app');
      const isOnProfile = nextUrl.pathname.startsWith('/dashboard/profile');

      if (isOnProtectedUrl) {
        if (isLoggedIn) {
          // Forzar cambio de contraseña en primer login
          const mustChange = (auth as any)?.user?.mustChangePassword;
          if (mustChange === true && !isOnProfile) {
            return Response.redirect(new URL('/dashboard/profile?mustChange=1', nextUrl));
          }
          return true;
        }
        return false; // Redirect to /login
      } else if (isLoggedIn && (nextUrl.pathname === '/login' || nextUrl.pathname === '/register' || nextUrl.pathname === '/')) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.mustChangePassword = user.mustChangePassword ?? false;
      }
      if (trigger === "update" && session) {
        if (session.mustChangePassword !== undefined) {
          token.mustChangePassword = session.mustChangePassword;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.mustChangePassword = (token.mustChangePassword as boolean) ?? false;
      }
      return session;
    }
  },
  providers: [], // we add providers with Prisma in auth.ts
} satisfies NextAuthConfig;
