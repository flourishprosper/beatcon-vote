import { auth } from "@/lib/auth-edge";

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const isAdminRoute = path.startsWith("/admin");
  const isAdminLogin = path === "/admin/login";

  if (!isAdminRoute) return;

  if (isAdminLogin) {
    if (req.auth) return Response.redirect(new URL("/admin", req.nextUrl));
    return;
  }

  if (!req.auth) return Response.redirect(new URL("/admin/login", req.nextUrl));
});

export const config = {
  matcher: ["/admin", "/admin/((?!login).*)"],
};
