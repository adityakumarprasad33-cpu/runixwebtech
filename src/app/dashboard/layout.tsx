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
  MessageSquare,
  X,
  Tag,
  ArrowRight,
  Code2,
} from "lucide-react";

import { collection, onSnapshot, updateDoc, doc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";

const sidebarLinks = [
  { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
  { name: "Offers", path: "/dashboard/offers", icon: Tag },
  { name: "Projects", path: "/dashboard/projects", icon: FolderKanban },
  { name: "Workspace", path: "/dashboard/workspace", icon: MessageSquare },
  { name: "Billing", path: "/dashboard/billing", icon: CreditCard },
  { name: "Support", path: "/dashboard/support", icon: HelpCircle },
  { name: "Settings", path: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut, isSuperAdmin, isAdmin, isDeveloper } = useAuth();
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
      return;
    }
    if (!user) return;

    // Real-time synchronization for notifications
    const unsub = onSnapshot(
      collection(db, "notifications"),
      (snap) => {
        const allNotifs = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
        const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

        const currentRole = profile?.role || "user";
        const isUserAdmin = isAdmin || isSuperAdmin || currentRole === "admin" || currentRole === "super_admin";
        const isUserDev = isDeveloper || currentRole === "developer";
        const isStaff = isUserAdmin || isUserDev;

        const userNotifs = allNotifs.filter((n) => {
          // 1. Cleared check
          if (n.clearedBy?.includes(user.uid)) return false;

          // 2. Date window check (last 30 days)
          if (new Date(n.createdAt || 0).getTime() <= oneMonthAgo) return false;

          // 3. Direct personal notification (targeted to user ID or email)
          if (
            n.targetUserId === user.uid ||
            (n.targetEmail && n.targetEmail.toLowerCase() === (user.email || "").toLowerCase())
          ) {
            return true;
          }

          // 4. Role-based array targeting (e.g. targetRoles: ["admin", "super_admin", "developer"])
          if (Array.isArray(n.targetRoles) && n.targetRoles.length > 0) {
            return n.targetRoles.includes(currentRole) || (isUserAdmin && n.targetRoles.includes("admin"));
          }

          // 5. Explicit targetType
          if (n.targetType === "admin_dev") {
            return isStaff;
          }
          if (n.targetType === "admin" || n.targetType === "super_admin") {
            return isUserAdmin;
          }
          if (n.targetType === "developer") {
            return isUserDev || isUserAdmin;
          }

          // 6. Broadcast targeting
          if (n.targetType === "broadcast") {
            // Guard: Internal system booking/admin alerts are strictly for staff (Admins, Devs), NEVER regular clients!
            const title = (n.title || "").toLowerCase();
            const sender = (n.senderName || "").toLowerCase();
            const isInternalProjectAlert = 
              title.includes("new project submitted") ||
              title.includes("new booking") ||
              title.includes("advance due") ||
              sender.includes("project booking engine");

            if (isInternalProjectAlert) {
              return isStaff;
            }

            // General public announcements (e.g. promotional offers, platform updates) can be seen by all
            return true;
          }

          return false;
        });

        userNotifs.sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );

        if (userNotifs.length > 0) {
          setNotifications(userNotifs);
          setUnreadCount(userNotifs.filter((n) => !n.readBy?.includes(user.uid)).length);
        } else {
          setNotifications([
            {
              id: "default-1",
              title: "Welcome to Runix Web Tech!",
              message: "Your dashboard is ready. Submit your project requirements anytime to begin.",
              createdAt: new Date().toISOString(),
              senderName: "Runix",
              senderRole: "System",
            },
          ]);
          setUnreadCount(1);
        }
      },
      (err) => {
        console.error("Realtime notifications listener error:", err);
      }
    );

    return () => unsub();
  }, [user, profile, loading, router, isAdmin, isSuperAdmin, isDeveloper]);

  const handleClearNotification = async (notifId: string) => {
    // Optimistic UI update
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    // Persist to Firestore (clearedBy array — does NOT delete the document)
    if (notifId === "default-1") return;
    try {
      await updateDoc(doc(db, "notifications", notifId), {
        clearedBy: arrayUnion(user?.uid || ""),
      });
    } catch (e) {
      console.error("Failed to clear notification:", e);
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

  const isDev = profile?.role === "developer";
  const isAdm = profile?.role === "admin" || profile?.role === "super_admin";

  let links: { name: string; path: string; icon: any }[] = [];
  if (isDev) {
    links = [
      { name: "Dev Portal", path: "/dashboard/developer", icon: Code2 },
      { name: "Workspace", path: "/dashboard/workspace", icon: MessageSquare },
      { name: "Support", path: "/dashboard/support", icon: HelpCircle },
      { name: "Settings", path: "/dashboard/settings", icon: Settings },
    ];
  } else if (isAdm) {
    links = [
      { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
      { name: "Admin Panel", path: "/dashboard/admin", icon: Shield },
      { name: "Workspace", path: "/dashboard/workspace", icon: MessageSquare },
      { name: "Offers", path: "/dashboard/offers", icon: Tag },
      { name: "Settings", path: "/dashboard/settings", icon: Settings },
    ];
  } else {
    links = [
      { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
      { name: "Projects", path: "/dashboard/projects", icon: FolderKanban },
      { name: "Workspace", path: "/dashboard/workspace", icon: MessageSquare },
      { name: "Offers", path: "/dashboard/offers", icon: Tag },
      { name: "Billing", path: "/dashboard/billing", icon: CreditCard },
      { name: "Support", path: "/dashboard/support", icon: HelpCircle },
      { name: "Settings", path: "/dashboard/settings", icon: Settings },
    ];
  }

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
              <Image src="/logo-v2.png" alt="Runix" fill sizes="32px" className="object-contain" />
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
                  <Image src="/logo-v2.png" alt="Runix" fill sizes="32px" className="object-contain" />
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
        <header className="relative z-40 h-16 flex items-center justify-between px-4 sm:px-8 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl shrink-0">
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
              className="relative p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
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
                    className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-[#111113] border border-white/15 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] p-4 overflow-hidden"
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
                        className="text-xs text-zinc-500 hover:text-white transition-colors cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-zinc-500 text-xs">
                          <Bell className="w-5 h-5 mx-auto mb-2 text-zinc-600 opacity-60" />
                          No new notifications
                        </div>
                      ) : (
                        notifications.map((n) => {
                          let timeStr = "";
                          try {
                            const diff = (Date.now() - new Date(n.createdAt).getTime()) / 1000;
                            if (diff < 60) timeStr = "just now";
                            else if (diff < 3600) timeStr = `${Math.floor(diff / 60)}m ago`;
                            else if (diff < 86400) timeStr = `${Math.floor(diff / 3600)}h ago`;
                            else timeStr = new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(n.createdAt));
                          } catch { timeStr = ""; }

                          // Compose sender label: "[Name] • [Role/Designation]"
                          const officialTitle = n.senderDesignation 
                            ? `${n.senderDesignation}${n.senderDepartment ? ` (${n.senderDepartment})` : ""}`
                            : (n.senderRole || "Admin");
                            
                          const senderLabel = n.senderName
                            ? `${n.senderName} • ${officialTitle}`
                            : n.targetType === "broadcast"
                            ? "Runix Team • Admin"
                            : "Admin";

                          return (
                            <div key={n.id} className="rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors overflow-hidden group">
                              {/* Image Banner if attached */}
                              {n.imageUrl && (
                                <div className="w-full h-24 overflow-hidden bg-black/40 border-b border-white/5 relative">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={n.imageUrl}
                                    alt={n.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}

                              <div className="px-3 pt-3 pb-2 flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-white mb-1">{n.title}</p>
                                  <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">{n.message}</p>
                                  
                                  {/* Action CTA link if provided */}
                                  {n.actionLink && (
                                    <div className="mt-2.5">
                                      <Link
                                        href={n.actionLink}
                                        onClick={() => setShowNotifications(false)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-[11px] font-bold border border-indigo-500/30 transition-colors"
                                      >
                                        <span>{n.actionText || "View Offer"}</span>
                                        <ArrowRight className="w-3 h-3" />
                                      </Link>
                                    </div>
                                  )}
                                </div>
                                {/* Clear (X) button */}
                                <button
                                  onClick={() => handleClearNotification(n.id)}
                                  title="Dismiss"
                                  className="shrink-0 p-0.5 rounded text-zinc-600 hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              {/* Footer: [Name] • [Role] + timestamp */}
                              <div className="flex items-center justify-between px-3 py-1.5 border-t border-white/5 bg-white/[0.02]">
                                <span className="text-[10px] font-medium text-indigo-400 truncate">
                                  {senderLabel}
                                </span>
                                <span className="text-[10px] text-zinc-600 shrink-0 ml-2">{timeStr}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
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
