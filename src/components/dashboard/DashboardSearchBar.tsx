"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, onSnapshot, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  FolderKanban,
  LayoutDashboard,
  CreditCard,
  Tag,
  Settings,
  HelpCircle,
  MessageSquare,
  Shield,
  Code2,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Globe,
  Receipt,
  Users,
  Wallet,
  CornerDownLeft,
} from "lucide-react";

interface SearchOrder {
  id: string;
  planName?: string;
  status?: string;
  totalPrice?: number;
  currency?: string;
  createdAt?: any;
  userEmail?: string;
  formData?: {
    name?: string;
    company?: string;
    projectType?: string;
  };
}

interface NavItem {
  id: string;
  title: string;
  category: "Navigation" | "Action" | "Admin";
  path: string;
  icon: any;
  description?: string;
  keywords?: string[];
  badge?: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  awaiting_advance: { label: "Awaiting 50% Advance", color: "text-[#315EF7] bg-[#315EF7]/10 border-[#315EF7]/20", icon: Clock },
  pending_payment: { label: "Pending Payment", color: "text-[#B77900] bg-[#B77900]/10 border-[#B77900]/20", icon: Clock },
  awaiting_verification: { label: "Awaiting Verification", color: "text-[#B77900] bg-[#B77900]/15 border-[#B77900]/25", icon: Clock },
  in_progress: { label: "In Active Sprint", color: "text-[#315EF7] bg-[#315EF7]/10 border-[#315EF7]/20", icon: FolderKanban },
  testing: { label: "QA & Testing", color: "text-[#B77900] bg-[#B77900]/10 border-[#B77900]/20", icon: FolderKanban },
  staging_deployed: { label: "Staging Demo Ready", color: "text-[#111317] bg-[#E5E7EB] border-[rgba(21,24,29,0.16)]", icon: Globe },
  awaiting_final_payment: { label: "Final 50% Due", color: "text-[#B77900] bg-[#B77900]/15 border-[#B77900]/30", icon: Clock },
  completed: { label: "Completed & Handed Over", color: "text-[#169B62] bg-[#169B62]/10 border-[#169B62]/20", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "text-[#D83A3A] bg-[#D83A3A]/10 border-[#D83A3A]/20", icon: AlertCircle },
  rejected: { label: "Rejected", color: "text-[#D83A3A] bg-[#D83A3A]/10 border-[#D83A3A]/20", icon: AlertCircle },
};

function formatOrderDate(createdAt: any): string {
  if (!createdAt) return "";
  try {
    if (createdAt._seconds) {
      return new Intl.DateTimeFormat("en-IN", { dateStyle: "short" }).format(new Date(createdAt._seconds * 1000));
    }
    if (createdAt.seconds) {
      return new Intl.DateTimeFormat("en-IN", { dateStyle: "short" }).format(new Date(createdAt.seconds * 1000));
    }
    if (typeof createdAt === "string") {
      const d = new Date(createdAt);
      if (!isNaN(d.getTime())) {
        return new Intl.DateTimeFormat("en-IN", { dateStyle: "short" }).format(d);
      }
    }
    if (createdAt?.toDate) {
      return new Intl.DateTimeFormat("en-IN", { dateStyle: "short" }).format(createdAt.toDate());
    }
  } catch {}
  return "";
}

export default function DashboardSearchBar() {
  const router = useRouter();
  const { user, isAdmin, isSuperAdmin, isDeveloper } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [queryText, setQueryText] = useState("");
  const [orders, setOrders] = useState<SearchOrder[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K and '/')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }

      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setIsOpen(true);
        return;
      }

      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQueryText("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Real-time synchronization of user orders for instant searching
  useEffect(() => {
    if (!user) return;

    let unsubUid: (() => void) | null = null;
    let unsubEmail: (() => void) | null = null;
    let unsubAdmin: (() => void) | null = null;

    const isStaff = isAdmin || isSuperAdmin;

    if (isStaff) {
      // For Admins: load recent orders to enable full dashboard search across clients
      try {
        const qAdmin = query(collection(db, "orders"), limit(100));
        unsubAdmin = onSnapshot(
          qAdmin,
          (snap) => {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SearchOrder));
            setOrders(list);
          },
          (err) => console.warn("Admin search orders listener notice:", err?.message || err)
        );
      } catch (err) {
        console.warn("Admin search query init notice:", err);
      }
    } else {
      // For Clients: listen to their own orders by userId and userEmail
      let uidList: SearchOrder[] = [];
      let emailList: SearchOrder[] = [];

      const merge = () => {
        const map = new Map<string, SearchOrder>();
        for (const o of uidList) map.set(o.id, o);
        for (const o of emailList) map.set(o.id, o);
        setOrders(Array.from(map.values()));
      };

      try {
        const qUid = query(collection(db, "orders"), where("userId", "==", user.uid));
        unsubUid = onSnapshot(
          qUid,
          (snap) => {
            uidList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SearchOrder));
            merge();
          },
          (err) => console.warn("Search orders uid listener notice:", err?.message || err)
        );
      } catch {}

      const cleanEmail = (user.email || "").toLowerCase().trim();
      if (cleanEmail) {
        try {
          const qEmail = query(collection(db, "orders"), where("userEmail", "==", cleanEmail));
          unsubEmail = onSnapshot(
            qEmail,
            (snap) => {
              emailList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SearchOrder));
              merge();
            },
            (err) => console.warn("Search orders email listener notice:", err?.message || err)
          );
        } catch {}
      }
    }

    return () => {
      if (unsubUid) unsubUid();
      if (unsubEmail) unsubEmail();
      if (unsubAdmin) unsubAdmin();
    };
  }, [user, isAdmin, isSuperAdmin]);

  // Static navigation and quick action items
  const navItems: NavItem[] = useMemo(() => {
    const list: NavItem[] = [
      {
        id: "nav-overview",
        title: "Overview Workspace",
        category: "Navigation",
        path: "/dashboard",
        icon: LayoutDashboard,
        description: "Dashboard metrics, live sprints & recent activity",
        keywords: ["home", "main", "stats", "overview"],
      },
      {
        id: "nav-projects",
        title: "My Projects & Deliverables",
        category: "Navigation",
        path: "/dashboard/projects",
        icon: FolderKanban,
        description: "Sprint roadmaps, staging demos & GitHub handovers",
        keywords: ["code", "builds", "staging", "repo", "deliverables", "status"],
      },
      {
        id: "nav-billing",
        title: "Milestone Billing & Invoices",
        category: "Navigation",
        path: "/dashboard/billing",
        icon: CreditCard,
        description: "50% advance, final settlements and payment receipts",
        keywords: ["invoices", "payment", "utr", "advance", "receipt", "settled"],
      },
      {
        id: "nav-workspace",
        title: "Developer Workspace Room",
        category: "Navigation",
        path: "/dashboard/workspace",
        icon: MessageSquare,
        description: "Real-time communication room with assigned developers",
        keywords: ["chat", "room", "messages", "dev", "engineer"],
      },
      {
        id: "nav-offers",
        title: "Special Deals & Discounts",
        category: "Navigation",
        path: "/dashboard/offers",
        icon: Tag,
        description: "Active coupons and seasonal build discounts",
        keywords: ["coupon", "promo", "voucher", "deal", "discount"],
      },
      {
        id: "nav-support",
        title: "Support & Engineering Helpdesk",
        category: "Navigation",
        path: "/dashboard/support",
        icon: HelpCircle,
        description: "Direct assistance, technical tickets and contact",
        keywords: ["help", "ticket", "assistance", "problem", "issue"],
      },
      {
        id: "nav-settings",
        title: "Account Settings & Security",
        category: "Navigation",
        path: "/dashboard/settings",
        icon: Settings,
        description: "Profile credentials, company information & authentication",
        keywords: ["profile", "password", "security", "email", "credentials"],
      },
      {
        id: "act-new-build",
        title: "Start New Build Sprint",
        category: "Action",
        path: "/pricing",
        icon: Sparkles,
        description: "Book an Essential, Professional or Enterprise package",
        keywords: ["order", "plan", "package", "buy", "pricing", "create"],
        badge: "New",
      },
    ];

    if (isAdmin || isSuperAdmin) {
      list.push(
        {
          id: "admin-orders",
          title: "Client Projects & Orders (Admin)",
          category: "Admin",
          path: "/dashboard/admin?tab=orders",
          icon: FolderKanban,
          description: "Verify advances, assign developers, and track sprints",
          keywords: ["admin", "verify", "utr", "client", "assignment"],
          badge: "Admin",
        },
        {
          id: "admin-users",
          title: "Personnel & Users (Admin)",
          category: "Admin",
          path: "/dashboard/admin?tab=users",
          icon: Users,
          description: "Manage client accounts, roles & developer credentials",
          keywords: ["admin", "accounts", "roles", "staff", "permissions"],
          badge: "Admin",
        },
        {
          id: "admin-ledger",
          title: "Financial Ledger & P&L (Admin)",
          category: "Admin",
          path: "/dashboard/admin?tab=ledger",
          icon: Receipt,
          description: "Authoritative revenue, expenses, and net profit ledger",
          keywords: ["admin", "finance", "profit", "loss", "revenue"],
          badge: "Admin",
        },
        {
          id: "admin-salaries",
          title: "Staff Salaries & Payouts (Admin)",
          category: "Admin",
          path: "/dashboard/admin?tab=salaries",
          icon: Wallet,
          description: "Disburse and record developer and staff compensation",
          keywords: ["admin", "payout", "payroll", "salary", "compensation"],
          badge: "Admin",
        },
        {
          id: "admin-cms",
          title: "Portfolio Showcase CMS (Admin)",
          category: "Admin",
          path: "/dashboard/admin?tab=cms",
          icon: Globe,
          description: "Curate public web agency portfolio showcase items",
          keywords: ["admin", "portfolio", "showcase", "cms", "case studies"],
          badge: "Admin",
        }
      );
    }

    if (isDeveloper) {
      list.push({
        id: "dev-tasks",
        title: "Developer Tasks & Sprints",
        category: "Navigation",
        path: "/dashboard/developer",
        icon: Code2,
        description: "Active assigned tasks, stage progression & work submissions",
        keywords: ["developer", "tasks", "stage", "submission", "sprint"],
        badge: "Dev",
      });
    }

    return list;
  }, [isAdmin, isSuperAdmin, isDeveloper]);

  // Filtered Results Calculation
  const filteredResults = useMemo(() => {
    const q = queryText.toLowerCase().trim();

    // 1. Matched Orders / Projects
    const matchedOrders = orders.filter((o) => {
      if (!q) return true;
      const plan = (o.planName || "").toLowerCase();
      const id = (o.id || "").toLowerCase();
      const status = (o.status || "").toLowerCase();
      const company = (o.formData?.company || "").toLowerCase();
      const name = (o.formData?.name || "").toLowerCase();
      const email = (o.userEmail || "").toLowerCase();
      const projectType = (o.formData?.projectType || "").toLowerCase();

      return (
        plan.includes(q) ||
        id.includes(q) ||
        status.includes(q) ||
        company.includes(q) ||
        name.includes(q) ||
        email.includes(q) ||
        projectType.includes(q)
      );
    });

    // 2. Matched Nav / Action Items
    const matchedNav = navItems.filter((item) => {
      if (!q) return true;
      const title = item.title.toLowerCase();
      const desc = (item.description || "").toLowerCase();
      const kw = (item.keywords || []).some((k) => k.toLowerCase().includes(q));
      return title.includes(q) || desc.includes(q) || kw;
    });

    return {
      orders: matchedOrders.slice(0, 5),
      nav: matchedNav.slice(0, 6),
      total: matchedOrders.length + matchedNav.length,
    };
  }, [queryText, orders, navItems]);

  // Flattened items for keyboard arrow navigation
  const flatSelectable = useMemo(() => {
    const items: Array<{ type: "order" | "nav"; data: any }> = [];
    filteredResults.orders.forEach((o) => items.push({ type: "order", data: o }));
    filteredResults.nav.forEach((n) => items.push({ type: "nav", data: n }));
    return items;
  }, [filteredResults]);

  // Handle keyboard selection (ArrowDown, ArrowUp, Enter)
  const handleKeyDownInput = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (flatSelectable.length ? (prev + 1) % flatSelectable.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (flatSelectable.length ? (prev - 1 + flatSelectable.length) % flatSelectable.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatSelectable.length > 0 && flatSelectable[selectedIndex]) {
        executeSelection(flatSelectable[selectedIndex]);
      }
    }
  };

  const executeSelection = (item: { type: "order" | "nav"; data: any }) => {
    setIsOpen(false);
    if (item.type === "order") {
      // Direct navigation to user projects or admin order view
      if (isAdmin || isSuperAdmin) {
        router.push(`/dashboard/admin?tab=orders&search=${encodeURIComponent(item.data.id)}`);
      } else {
        router.push(`/dashboard/projects`);
      }
    } else {
      router.push(item.data.path);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* ── Desktop Search Bar Trigger ── */}
      <div
        onClick={() => setIsOpen(true)}
        className="hidden sm:flex items-center justify-between gap-2.5 bg-[#FAFAFA] hover:bg-[#F3F4F6] border border-[rgba(21,24,29,0.12)] hover:border-[rgba(21,24,29,0.20)] rounded-xl px-3 py-2 w-72 lg:w-80 cursor-pointer transition-all duration-200 group shadow-sm"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Search className="w-4 h-4 text-[#6B7280] group-hover:text-[#111317] transition-colors shrink-0" />
          <span className="text-sm text-[#6B7280] group-hover:text-[#111317] truncate select-none">
            {queryText ? queryText : "Search projects, pages, bills…"}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <kbd className="hidden md:inline-flex items-center justify-center text-[10px] font-semibold text-[#6B7280] bg-[#FFFFFF] border border-[rgba(21,24,29,0.12)] px-1.5 py-0.5 rounded shadow-2xs">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* ── Mobile Search Trigger Button ── */}
      <button
        onClick={() => setIsOpen(true)}
        className="sm:hidden p-2 text-[#4B5563] hover:text-[#111317] hover:bg-[rgba(21,24,29,0.05)] rounded-xl transition-colors cursor-pointer"
        title="Search projects and pages"
        aria-label="Search"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* ── Command Palette / Search Spotlight Dropdown ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for focus */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-[#111317]/30 backdrop-blur-xs sm:bg-transparent sm:backdrop-blur-none"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-x-3 top-20 sm:absolute sm:inset-auto sm:left-0 sm:top-0 z-50 sm:w-[500px] lg:w-[560px] bg-[#FFFFFF] border border-[rgba(21,24,29,0.14)] rounded-2xl shadow-[0_24px_60px_rgba(21,24,29,0.14)] overflow-hidden"
            >
              {/* Input header */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[rgba(21,24,29,0.08)] bg-[#FAFAFA]">
                <Search className="w-4 h-4 text-[#315EF7] shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={queryText}
                  onChange={(e) => {
                    setQueryText(e.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={handleKeyDownInput}
                  placeholder="Type to search projects, invoices, status, actions..."
                  className="bg-transparent text-sm text-[#111317] placeholder:text-[#9CA3AF] outline-none w-full font-medium"
                />
                {queryText && (
                  <button
                    onClick={() => {
                      setQueryText("");
                      setSelectedIndex(0);
                      inputRef.current?.focus();
                    }}
                    className="p-1 text-[#9CA3AF] hover:text-[#111317] rounded-md transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-[11px] font-semibold text-[#6B7280] hover:text-[#111317] px-2 py-1 bg-white border border-[rgba(21,24,29,0.10)] rounded-md shadow-2xs"
                >
                  ESC
                </button>
              </div>

              {/* Results Body */}
              <div
                ref={listRef}
                className="max-h-[380px] overflow-y-auto p-2 space-y-4 custom-scrollbar divide-y divide-[rgba(21,24,29,0.05)]"
              >
                {/* 1. Projects & Orders Section */}
                {filteredResults.orders.length > 0 && (
                  <div className="pt-1 first:pt-0">
                    <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                      <span className="flex items-center gap-1.5">
                        <FolderKanban className="w-3.5 h-3.5 text-[#315EF7]" />
                        Projects & Build Orders
                      </span>
                      <span className="text-[10px] text-[#9CA3AF]">{filteredResults.orders.length} found</span>
                    </div>
                    <div className="space-y-1">
                      {filteredResults.orders.map((o) => {
                        const globalIdx = flatSelectable.findIndex(
                          (item) => item.type === "order" && item.data.id === o.id
                        );
                        const isSelected = selectedIndex === globalIdx;
                        const statusObj = statusConfig[o.status || ""] || {
                          label: o.status || "Active",
                          color: "text-[#4B5563] bg-[#E5E7EB] border-[rgba(21,24,29,0.10)]",
                          icon: Clock,
                        };
                        const StatusIcon = statusObj.icon;
                        const dateStr = formatOrderDate(o.createdAt);

                        return (
                          <div
                            key={o.id}
                            onClick={() => executeSelection({ type: "order", data: o })}
                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                            className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                              isSelected
                                ? "bg-[#315EF7]/10 border border-[#315EF7]/20"
                                : "hover:bg-[rgba(21,24,29,0.03)] border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-[#315EF7]/10 flex items-center justify-center shrink-0">
                                <FolderKanban className="w-4 h-4 text-[#315EF7]" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-bold text-[#111317] truncate">
                                    {o.planName || o.formData?.projectType || "Custom Sprint Build"}
                                  </p>
                                  {dateStr && (
                                    <span className="text-[10px] text-[#9CA3AF] shrink-0 font-medium">
                                      {dateStr}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-[#6B7280] font-mono">
                                    #{o.id.slice(0, 8)}
                                  </span>
                                  {o.formData?.company && (
                                    <>
                                      <span className="text-[10px] text-[#D1D5DB]">•</span>
                                      <span className="text-[10px] text-[#6B7280] truncate">
                                        {o.formData.company}
                                      </span>
                                    </>
                                  )}
                                  {o.totalPrice && (
                                    <>
                                      <span className="text-[10px] text-[#D1D5DB]">•</span>
                                      <span className="text-[10px] font-semibold text-[#111317]">
                                        ₹{o.totalPrice.toLocaleString()}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusObj.color}`}
                              >
                                <StatusIcon className="w-3 h-3" />
                                {statusObj.label}
                              </span>
                              {isSelected && (
                                <CornerDownLeft className="w-3.5 h-3.5 text-[#315EF7] hidden sm:block shrink-0" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Navigation & Pages Section */}
                {filteredResults.nav.length > 0 && (
                  <div className="pt-2 first:pt-0">
                    <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                      <span className="flex items-center gap-1.5">
                        <LayoutDashboard className="w-3.5 h-3.5 text-[#6B7280]" />
                        Pages & Actions
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {filteredResults.nav.map((item) => {
                        const globalIdx = flatSelectable.findIndex(
                          (i) => i.type === "nav" && i.data.id === item.id
                        );
                        const isSelected = selectedIndex === globalIdx;
                        const ItemIcon = item.icon;

                        return (
                          <div
                            key={item.id}
                            onClick={() => executeSelection({ type: "nav", data: item })}
                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                            className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all ${
                              isSelected
                                ? "bg-[#315EF7]/10 border border-[#315EF7]/20"
                                : "hover:bg-[rgba(21,24,29,0.03)] border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  item.category === "Action"
                                    ? "bg-amber-500/10 text-amber-600"
                                    : item.category === "Admin"
                                    ? "bg-purple-500/10 text-purple-600"
                                    : "bg-[rgba(21,24,29,0.05)] text-[#4B5563]"
                                }`}
                              >
                                <ItemIcon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-bold text-[#111317] truncate">{item.title}</p>
                                  {item.badge && (
                                    <span
                                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                                        item.badge === "Admin"
                                          ? "bg-purple-100 text-purple-700"
                                          : "bg-amber-100 text-amber-700"
                                      }`}
                                    >
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-[11px] text-[#6B7280] truncate">{item.description}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 text-[#9CA3AF]">
                              {isSelected ? (
                                <CornerDownLeft className="w-3.5 h-3.5 text-[#315EF7] hidden sm:block shrink-0" />
                              ) : (
                                <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Empty State */}
                {filteredResults.total === 0 && (
                  <div className="py-10 text-center px-4">
                    <Search className="w-7 h-7 mx-auto text-[#9CA3AF] mb-2 opacity-50" />
                    <p className="text-xs font-bold text-[#111317]">No results found for &ldquo;{queryText}&rdquo;</p>
                    <p className="text-[11px] text-[#6B7280] mt-1">
                      Check your spelling or try searching for keywords like &ldquo;projects&rdquo;, &ldquo;billing&rdquo;, or &ldquo;settings&rdquo;.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAFAFA] border-t border-[rgba(21,24,29,0.08)] text-[11px] text-[#6B7280]">
                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline-flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white border border-[rgba(21,24,29,0.12)] rounded text-[10px] font-semibold text-[#4B5563] shadow-2xs">
                      ↑
                    </kbd>
                    <kbd className="px-1.5 py-0.5 bg-white border border-[rgba(21,24,29,0.12)] rounded text-[10px] font-semibold text-[#4B5563] shadow-2xs">
                      ↓
                    </kbd>
                    to navigate
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white border border-[rgba(21,24,29,0.12)] rounded text-[10px] font-semibold text-[#4B5563] shadow-2xs">
                      ↵
                    </kbd>
                    to select
                  </span>
                </div>
                <span className="text-[10px] font-medium text-[#9CA3AF]">
                  Press <kbd className="px-1 py-0.5 bg-white border border-[rgba(21,24,29,0.10)] rounded text-[9px]">ESC</kbd> to exit
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
