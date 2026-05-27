import { Outlet, Link, useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { MessageSquare, LayoutDashboard, FileText, Users, LogOut, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function AppLayout() {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const clearChat = useStore((state) => state.clearChat);
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    clearChat();
    setUser(null);
  };

  const navItems = [
    { name: 'Chat', href: '/chat', icon: MessageSquare, adminOnly: false },
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, adminOnly: true },
    { name: 'Documents', href: '/admin/documents', icon: FileText, adminOnly: true },
    { name: 'Users', href: '/admin/users', icon: Users, adminOnly: true },
  ];

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-white flex text-gray-900 font-sans">
      {/* Navigation Sidebar (Desktop Only) */}
      <aside className="w-16 border-r border-gray-200 bg-gray-50/50 backdrop-blur-md flex-col items-center relative z-20 hidden md:flex shrink-0">
        <div className="p-3 mt-2 mb-4">
          <div className="bg-red-500/20 p-2 rounded-xl ring-1 ring-red-500/30">
            <MessageSquare className="w-5 h-5 text-red-400" />
          </div>
        </div>

        <nav className="flex-1 flex flex-col items-center gap-1 px-1.5">
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                title={item.name}
                className={cn(
                  "flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 group relative",
                  isActive
                    ? "bg-red-500/15 text-red-400"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                )}
              >
                <item.icon className="w-5 h-5" />
                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Admin Badge */}
        {isAdmin && (
          <div className="mb-2" title="Admin">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 ring-1 ring-amber-500/20">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
          </div>
        )}

        {/* User Avatar & Logout or Login */}
        <div className="p-3 mb-2 border-t border-gray-200/50 flex flex-col items-center gap-2">
          {user ? (
            <>
              <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-sm font-bold text-white shadow-md" title={user.name}>
                {user.name.charAt(0)}
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link
              to="/login"
              title="Sign In"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-all border border-gray-300"
            >
              <Users className="w-4 h-4" />
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-gray-200/80 bg-white/95 backdrop-blur-lg flex items-center justify-around px-4 z-40 shadow-lg shrink-0">
        {navItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          const isActive = location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200",
                isActive
                  ? "text-red-600 font-semibold"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <item.icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
        {user ? (
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center text-gray-500 hover:text-gray-700 py-1 px-3"
          >
            <LogOut className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium">Logout</span>
          </button>
        ) : (
          <Link
            to="/login"
            className="flex flex-col items-center justify-center text-gray-500 hover:text-gray-700 py-1 px-3"
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium">Login</span>
          </Link>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen relative overflow-hidden bg-white pb-16 md:pb-0">
        {/* Subtle background glow for main area */}
        <div className="flex-1 overflow-hidden z-10 relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
