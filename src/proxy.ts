import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/admin/login" },
});

// Proxy (бывший middleware): защищаем все /admin/* кроме /admin/login.
// Регэксп исключает страницу логина (и её под-сегменты, если появятся).
export const config = {
  matcher: ["/admin((?!/login).*)"],
};
