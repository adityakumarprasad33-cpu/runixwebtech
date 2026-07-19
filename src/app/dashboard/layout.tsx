"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FolderKanban,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  Menu,
  Bell,
  Search,
  Shield,
} from "lucide-react";

import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const sidebarLinks = [
  { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", path: "/dashboard/projects", icon: FolderKanban },
  { name: "Billing", path: "/dashboard/billing", icon: CreditCard },
  { name: "Support", path: "/dashboard/support", icon: HelpCircle },
  { name: "Settings", path: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      fetchNotifications();
    }
  }, [user, loading, router]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const snap = await getDocs(collection(db, "notifications"));
      const allNotifs = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
      // Filter broadcast or targeted to current user
      const userNotifs = allNotifs.filter(
        (n) =>
          n.targetType === "broadcast" ||
          n.targetUserId === user.uid ||
          n.targetEmail === user.email
      );

      // Sort by date if available
      userNotifs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      if (userNotifs.length > 0) {
        setNotifications(userNotifs);
        setUnreadCount(userNotifs.filter((n) => !n.readBy?.includes(user.uid)).length);
      } else {
        // Fallback default notification
        setNotifications([
          {
            id: "default-1",
            title: "Welcome to Runix Web Tech!",
            message: "Your dashboard is ready. Submit your project requirements anytime to begin.",
            createdAt: new Date().toISOString(),
          },
        ]);
        setUnreadCount(1);
      }
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-10 h-10 border-[3px] border-white/10 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const initials = user.displayName
    ? user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const links = profile?.role === "admin"
    ? [...sidebarLinks, { name: "Admin Panel", path: "/dashboard/admin", icon: Shield }]
    : sidebarLinks;

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a]">
      {/* ── Sidebar ── */}
      <aside
        className={`
          hidden lg:flex flex-col fixed top-0 left-0 h-full z-40
          bg-[#0e0e0e] border-r border-white/5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${collapsed ? "w-[72px]" : "w-[260px]"}
        `}
      >
        {/* Logo area */}
        <div className={`flex items-center h-16 px-4 border-b border-white/5 ${collapsed ? "justify-center" : "gap-3"}`}>
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="relative w-8 h-8">
              <Image src="/logo-v2.png" alt="Runix" fill className="object-contain" />
            </div>
            {!collapsed && (
              <span className="font-jakarta font-bold text-lg text-white tracking-tight">Runix</span>
            )}
          </Link>
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="ml-auto p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 flex flex-col gap-1 px-3 py-6 overflow-y-auto">
          {links.map((link) => {
            const isActive = pathname === link.path;
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                href={link.path}
                title={collapsed ? link.name : undefined}
                className={`
                  relative flex items-center gap-3 rounded-xl transition-all duration-200
                  ${collapsed ? "justify-center px-0 py-3" : "px-4 py-3"}
                  ${isActive
                    ? "text-white bg-white/[0.08]"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="dashboardActiveTab"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-indigo-500 rounded-r-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="w-[18px] h-[18px] shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{link.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User section at bottom */}
        <div className={`border-t border-white/5 p-3 ${collapsed ? "flex flex-col items-center gap-2" : ""}`}>
          {collapsed ? (
            <>
              <button
                onClick={() => setCollapsed(false)}
                className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Menu className="w-4 h-4" />
              </button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.displayName || "User"}</p>
                <p className="text-xs text-zinc-500 truncate">{user.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-full w-[280px] z-50 bg-[#0e0e0e] border-r border-white/5 flex flex-col lg:hidden"
            >
              <div className="flex items-center h-16 px-5 border-b border-white/5 gap-3">
                <div className="relative w-8 h-8">
                  <Image src="/logo-v2.png" alt="Runix" fill className="object-contain" />
                </div>
                <span className="font-jakarta font-bold text-lg text-white tracking-tight">Runix</span>
              </div>
              <nav className="flex-1 flex flex-col gap-1 px-3 py-6">
                {links.map((link) => {
                  const isActive = pathname === link.path;
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.path}
                      href={link.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        isActive ? "text-white bg-white/[0.08]" : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
                      }`}
                    >
                      <Icon className="w-[18px] h-[18px]" />
                      {link.name}
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-white/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user.displayName || "User"}</p>
                    <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                  </div>
                  <button onClick={handleSignOut} className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${collapsed ? "lg:ml-[72px]" : "lg:ml-[260px]"}`}>
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-white/[0.04] border border-white/5 rounded-lg px-3 py-2 w-72">
              <Search className="w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent text-sm text-white placeholder:text-zinc-600 outline-none w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              )}
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-[#111] border border-white/10 rounded-2xl shadow-2xl p-4 overflow-hidden"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">Notifications</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full">
                          {notifications.length} New
                        </span>
                      </div>
                      <button 
                        onClick={() => {
                          setUnreadCount(0);
                        }}
                        className="text-xs text-zinc-500 hover:text-white transition-colors"
                      >
                        Mark all as read
                      </button>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {notifications.map((n) => (
                        <div key={n.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors">
                          <p className="text-xs font-semibold text-white mb-1">{n.title}</p>
                          <p className="text-xs text-zinc-400 leading-relaxed mb-2">{n.message}</p>
                          <span className="text-[10px] text-zinc-500">{n.time}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 font-medium px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors hidden sm:block">
              ← Back to Site
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
