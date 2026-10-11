import { PortalSessionProvider } from "@/lib/portal/session";

export default function PortalRootLayout({ children }: { children: React.ReactNode }) {
  return <PortalSessionProvider>{children}</PortalSessionProvider>;
}
