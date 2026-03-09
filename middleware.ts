import { auth } from "@/lib/auth-edge";

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const role = req.auth?.user?.role;
  const isAdminRoute = path.startsWith("/admin");
  const isAdminLogin = path === "/admin/login";
  const isProducerRoute = path.startsWith("/producer");
  const isProducerLogin = path === "/producer/login";

  if (isAdminRoute) {
    if (isAdminLogin) {
      if (req.auth && role === "producer") return Response.redirect(new URL("/producer", req.nextUrl));
      if (req.auth) return Response.redirect(new URL("/admin", req.nextUrl));
      return;
    }
    if (!req.auth) return Response.redirect(new URL("/admin/login", req.nextUrl));
    if (role === "producer") return Response.redirect(new URL("/producer", req.nextUrl));
    return;
  }

  if (isProducerRoute) {
    if (isProducerLogin) {
      if (req.auth && role === "admin") return Response.redirect(new URL("/admin", req.nextUrl));
      if (req.auth && role === "producer") return Response.redirect(new URL("/producer", req.nextUrl));
      return;
    }
    if (req.auth && role === "admin") return Response.redirect(new URL("/admin", req.nextUrl));
    return;
  }

  return;
});

export const config = {
  matcher: ["/admin(/.*)?", "/producer(/.*)?"],
};
