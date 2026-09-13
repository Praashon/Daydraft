import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname === "/login" || pathname === "/signup";
  const isSetupRoute = pathname === "/auth/setup";

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    const providers = user.app_metadata?.providers || [];
    const hasEmailProvider = providers.includes("email");
    const isProfileComplete = hasEmailProvider || Boolean(
      user.user_metadata?.profile_completed && user.user_metadata?.has_password
    );

    if (!isProfileComplete && !isSetupRoute && !isAuthRoute) {
      const skipSetup = request.cookies.get("daydraft_setup_later")?.value === "true";
      if (!skipSetup) {
        return NextResponse.redirect(new URL("/auth/setup", request.url));
      }
    }

    if (isProfileComplete && (isAuthRoute || isSetupRoute)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tasks/:path*",
    "/calendar/:path*",
    "/notes/:path*",
    "/trash/:path*",
    "/profile/:path*",
    "/auth/setup",
    "/login",
    "/signup",
  ],
};
