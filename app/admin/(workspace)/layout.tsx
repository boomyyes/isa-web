import { AdminFrame } from "@/components/admin/AdminFrame";
import { requireAdmin } from "@/lib/admin/session";

/**
 * The sidebar and header, kept on screen across navigations. Not a gate: each
 * page still checks its own role, and the notice page must render here too.
 */
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin("jointcore", { notice: false });
  return (
    <AdminFrame session={session} base={session.base}>
      {children}
    </AdminFrame>
  );
}
