import { useState } from "react";
import { LayoutDashboard, FileText, User, Lock, LogOut } from "lucide-react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
];

// Mock user data - in a real app, this would come from context/auth
const mockUser = {
  firstName: "John",
  lastName: "Doe",
  username: "john.doe",
  email: "john.doe@example.com",
  roles: ["Main Escrow Officer", "Buyer"],
};

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted/50";

  const handleLogout = () => {
    // In a real app, this would clear auth state
    navigate("/login");
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-card border-r">
        {/* Brand Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Lock className="w-4 h-4 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-bold text-gray-900">WireSafe</h2>
                <p className="text-xs text-gray-600">Portal</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="w-4 h-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Profile Section */}
        <div className="mt-auto p-4 border-t">
          {!isCollapsed ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-blue-600 text-white text-sm">
                    {getInitials(mockUser.firstName, mockUser.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {mockUser.firstName} {mockUser.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {mockUser.username}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                {mockUser.roles.map((role) => (
                  <div
                    key={role}
                    className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded"
                  >
                    {role}
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-blue-600 text-white text-sm">
                  {getInitials(mockUser.firstName, mockUser.lastName)}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="p-1"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}