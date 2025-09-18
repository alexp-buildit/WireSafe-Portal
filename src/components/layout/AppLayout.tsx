import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Outlet } from "react-router-dom";

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="h-14 border-b bg-card flex items-center px-6">
            <SidebarTrigger className="hover:bg-muted" />
            <div className="ml-4">
              <h1 className="text-lg font-semibold text-foreground">WireSafe Portal</h1>
            </div>
          </header>
          <div className="flex-1 p-6">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}