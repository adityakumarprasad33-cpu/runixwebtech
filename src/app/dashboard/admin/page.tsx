"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { logAdminAction } from "@/lib/logAdminAction";
import DeveloperInteractionRoom from "@/components/dashboard/DeveloperInteractionRoom";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Users,
  FolderKanban,
  ShoppingCart,
  ShieldCheck,
  Trash2,
  Plus,
  X,
  Globe,
  IndianRupee,
  Save,
  CheckCircle2,
  ExternalLink,
  Copy,
  Bell,
  Send,
  MessageSquare,
  XCircle,
  Award,
  Check,
  HelpCircle,
  FileText,
  Activity,
  MessageCircle,
  Search,
  Crown,
  ToggleLeft,
  ToggleRight,
  UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ProjectForm {
  title: string;
  slug: string;
  description: string;
  websiteLink: string;
  status: string;
}

const emptyProject: ProjectForm = {
  title: "",
  slug: "",
  description: "",
  websiteLink: "",
  status: "in progress",
};

export default function AdminPanel() {
  const { profile, loading, user, isSuperAdmin, isAdmin, canDo } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<
    "users" | "cms" | "orders" | "notifications" | "logs" | "activity" | "team"
  >("cms");

  // Team management state (super_admin only)
  const [savingPermissions, setSavingPermissions] = useState<string | null>(null);
  const [promotingUser, setPromotingUser] = useState<string | null>(null);

  // Developer Room state
  const [openRoomOrderId, setOpenRoomOrderId] = useState<string | null>(null);

  // Global Search
  const [globalSearch, setGlobalSearch] = useState("");

  // Data States
  const [users, setUsers] = useState<any[]>([]);
  const [dbProjects, setDbProjects] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  const [loadingData, setLoadingData] = useState(true);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [projectForm, setProjectForm] = useState<ProjectForm>(emptyProject);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment Settings State
  const [upiId, setUpiId] = useState("");
  const [upiNumber, setUpiNumber] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentSaved, setPaymentSaved] = useState(false);

  // UTR Edit State & Expand Details State
  const [editingUtrOrderId, setEditingUtrOrderId] = useState<string | null>(null);
  const [editUtrValue, setEditUtrValue] = useState("");
  const [expandedOrderDetails, setExpandedOrderDetails] = useState<string | null>(null);

  const handleSaveUtr = async (orderId: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        utrNumber: editUtrValue.trim(),
        status: "awaiting_verification",
      });
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, utrNumber: editUtrValue.trim(), status: "awaiting_verification" }
            : o
        )
      );
      setEditingUtrOrderId(null);
      setEditUtrValue("");
    } catch (e) {
      console.error("Failed to update UTR:", e);
      alert("Failed to update UTR");
    }
  };

  // Hero Stats State
  const [heroStats, setHeroStats] = useState({
    stat1Value: "50+",
    stat1Label: "PROJECTS COMPLETED",
    stat2Value: "100%",
    stat2Label: "CLIENT SATISFACTION",
    stat3Value: "< 2 Wks",
    stat3Label: "AVERAGE DELIVERY",
    stat4Value: "Next.js 16",
    stat4Label: "MODERN STACK",
  });
  const [savingHeroStats, setSavingHeroStats] = useState(false);
  const [heroStatsSaved, setHeroStatsSaved] = useState(false);

  // Notifications Form State
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifTargetType, setNotifTargetType] = useState<"broadcast" | "user">("broadcast");
  const [notifTargetUserId, setNotifTargetUserId] = useState("");
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifSent, setNotifSent] = useState(false);

  // Order Query Modal State
  const [queryOrder, setQueryOrder] = useState<any | null>(null);
  const [queryText, setQueryText] = useState("");
  const [sendingQuery, setSendingQuery] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!isAdmin) {
        router.push("/dashboard");
      } else {
        fetchData();
        fetchPaymentSettings();
        fetchHeroStats();
      }
    }
  }, [loading, isAdmin, router]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const fetchCollection = async (col: string) => {
        try {
          const snap = await getDocs(collection(db, col));
          return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        } catch (e) {
          console.error(`Failed to fetch ${col}:`, e);
          return [];
        }
      };

      const [usersData, projectsData, ordersData, logsData, activityLogsData] =
        await Promise.all([
          fetchCollection("users"),
          fetchCollection("projects"),
          fetchCollection("orders"),
          fetchCollection("login_logs"),
          fetchCollection("admin_activity_logs"),
        ]);

      setUsers(usersData);
      setDbProjects(projectsData);
      setOrders(ordersData);
      setLogs(logsData);
      setActivityLogs(
        activityLogsData.sort(
          (a: any, b: any) =>
            new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
        )
      );
    } catch (err) {
      console.error(err);
    }
    setLoadingData(false);
  };

  const fetchPaymentSettings = async () => {
    try {
      const docSnap = await getDoc(doc(db, "settings", "payment"));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUpiId(data.upiId || "");
        setUpiNumber(data.upiNumber || "");
      }
    } catch (e) {
      console.error("Failed to fetch payment settings:", e);
    }
  };

  const fetchHeroStats = async () => {
    try {
      const docSnap = await getDoc(doc(db, "settings", "hero_stats"));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setHeroStats({
          stat1Value: data.stat1Value || "50+",
          stat1Label: data.stat1Label || "PROJECTS COMPLETED",
          stat2Value: data.stat2Value || "100%",
          stat2Label: data.stat2Label || "CLIENT SATISFACTION",
          stat3Value: data.stat3Value || "< 2 Wks",
          stat3Label: data.stat3Label || "AVERAGE DELIVERY",
          stat4Value: data.stat4Value || "Next.js 16",
          stat4Label: data.stat4Label || "MODERN STACK",
        });
      }
    } catch (e) {
      console.error("Failed to fetch hero stats:", e);
    }
  };

  const handleSavePaymentSettings = async () => {
    setSavingPayment(true);
    try {
      await setDoc(doc(db, "settings", "payment"), {
        upiId,
        upiNumber,
        updatedAt: new Date().toISOString(),
      });
      setPaymentSaved(true);
      setTimeout(() => setPaymentSaved(false), 3000);
    } catch (e) {
      console.error("Failed to save payment settings:", e);
      alert("Failed to save payment settings");
    } finally {
      setSavingPayment(false);
    }
  };

  const handleSaveHeroStats = async () => {
    setSavingHeroStats(true);
    try {
      await setDoc(doc(db, "settings", "hero_stats"), {
        ...heroStats,
        updatedAt: new Date().toISOString(),
      });
      setHeroStatsSaved(true);
      setTimeout(() => setHeroStatsSaved(false), 3000);
    } catch (e) {
      console.error("Failed to save hero stats:", e);
      alert("Failed to save hero stats");
    } finally {
      setSavingHeroStats(false);
    }
  };

  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) {
      alert("Please fill in notification title and message.");
      return;
    }
    setSendingNotif(true);
    try {
      await addDoc(collection(db, "notifications"), {
        title: notifTitle.trim(),
        message: notifMessage.trim(),
        targetType: notifTargetType,
        targetUserId: notifTargetType === "user" ? notifTargetUserId : null,
        senderName: user?.displayName || profile?.name || "Admin",
        senderRole: "Admin",
        senderEmail: user?.email || "",
        createdAt: new Date().toISOString(),
        readBy: [],
        clearedBy: [],
      });
      // Audit log
      logAdminAction({
        adminId: user?.uid || "",
        adminName: user?.displayName || profile?.name || "Admin",
        adminEmail: user?.email || "",
        action: "SENT_NOTIFICATION",
        details: { title: notifTitle.trim(), targetType: notifTargetType, targetUserId: notifTargetUserId || null },
      });
      setNotifSent(true);
      setNotifTitle("");
      setNotifMessage("");
      setTimeout(() => setNotifSent(false), 3000);
    } catch (e) {
      console.error("Failed to send notification:", e);
      alert("Failed to send notification");
    } finally {
      setSendingNotif(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string, userEmail?: string, userId?: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      // Send system notification to user
      const statusLabel = newStatus === "completed" ? "Approved & Activated" : newStatus === "in_progress" ? "Approved (In Progress)" : "Rejected";
      await addDoc(collection(db, "notifications"), {
        title: `Payment ${statusLabel}`,
        message: `Your project payment has been marked as ${statusLabel.toLowerCase()}. Check your dashboard for details.`,
        targetType: "user",
        targetUserId: userId || null,
        targetEmail: userEmail || null,
        senderName: user?.displayName || profile?.name || "Admin",
        senderRole: "Admin",
        senderEmail: user?.email || "",
        createdAt: new Date().toISOString(),
        readBy: [],
        clearedBy: [],
      });
      // Audit log
      logAdminAction({
        adminId: user?.uid || "",
        adminName: user?.displayName || profile?.name || "Admin",
        adminEmail: user?.email || "",
        action: newStatus === "rejected" ? "REJECTED_PAYMENT" : "APPROVED_PAYMENT",
        details: { orderId, newStatus, targetUserId: userId, targetEmail: userEmail },
      });
    } catch (e) {
      console.error("Failed to update order status:", e);
      alert("Failed to update order status");
    }
  };

  const handleSendOrderQuery = async () => {
    if (!queryOrder || !queryText.trim()) return;
    setSendingQuery(true);
    try {
      await updateDoc(doc(db, "orders", queryOrder.id), {
        adminQuery: queryText.trim(),
        hasPendingQuery: true,
        queryCreatedAt: new Date().toISOString(),
      });

      // Send notification to user
      await addDoc(collection(db, "notifications"), {
        title: "Action Required: Project Query",
        message: `Admin has asked a question regarding your order "${queryOrder.planName}". Please respond on your dashboard.`,
        targetType: "user",
        targetUserId: queryOrder.userId || null,
        targetEmail: queryOrder.userEmail || queryOrder.email || null,
        senderName: user?.displayName || profile?.name || "Admin",
        senderRole: "Admin",
        senderEmail: user?.email || "",
        createdAt: new Date().toISOString(),
        readBy: [],
        clearedBy: [],
      });

      // Audit log
      logAdminAction({
        adminId: user?.uid || "",
        adminName: user?.displayName || profile?.name || "Admin",
        adminEmail: user?.email || "",
        action: "SENT_ORDER_QUERY",
        details: { orderId: queryOrder.id, planName: queryOrder.planName, targetEmail: queryOrder.userEmail },
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.id === queryOrder.id
            ? { ...o, adminQuery: queryText.trim(), hasPendingQuery: true }
            : o
        )
      );
      setQueryOrder(null);
      setQueryText("");
      alert("Query sent to user successfully!");
    } catch (e) {
      console.error("Failed to send query:", e);
      alert("Failed to send query");
    } finally {
      setSendingQuery(false);
    }
  };

  const handleDeleteProject = async (projectId: string, title: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${title}"? This cannot be undone.`
      )
    )
      return;
    try {
      await deleteDoc(doc(db, "projects", projectId));
      setDbProjects((prev) => prev.filter((p) => p.id !== projectId));
      logAdminAction({
        adminId: user?.uid || "",
        adminName: user?.displayName || profile?.name || "Admin",
        adminEmail: user?.email || "",
        action: "DELETED_PROJECT",
        details: { projectId, title },
      });
    } catch (e) {
      console.error(e);
      alert("Failed to delete project");
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleAddProject = async () => {
    if (!projectForm.title || !projectForm.slug || !projectForm.websiteLink) {
      alert("Please fill in all required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      const projectData = {
        title: projectForm.title,
        slug: projectForm.slug,
        description: projectForm.description,
        websiteLink: projectForm.websiteLink,
        status: projectForm.status,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "projects", projectForm.slug), projectData);
      setDbProjects((prev) => [
        ...prev,
        { id: projectForm.slug, ...projectData },
      ]);
      logAdminAction({
        adminId: user?.uid || "",
        adminName: user?.displayName || profile?.name || "Admin",
        adminEmail: user?.email || "",
        action: "ADDED_PROJECT",
        details: { slug: projectForm.slug, title: projectForm.title },
      });
      setProjectForm(emptyProject);
      setShowAddModal(false);
    } catch (e) {
      console.error(e);
      alert("Failed to add project");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const inputClasses =
    "w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors";
  const labelClasses =
    "text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-2 block";

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4 border-b border-white/10 pb-6">
        <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-jakarta font-bold text-white">
            System Administration
          </h1>
          <p className="text-sm text-zinc-400">
            Full access control, content management & notification engine
          </p>
      </div>
      </div>

      {/* Tabs — permission-gated */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-4">
        {[
          { id: "cms",           label: "Content (CMS)",    icon: FolderKanban,  show: canDo("cms") },
          { id: "users",         label: "Personnel",        icon: Users,         show: true },
          { id: "orders",        label: "Orders & Payments",icon: ShoppingCart,  show: canDo("payments") },
          { id: "notifications", label: "Notifications",    icon: Bell,          show: canDo("notifications") },
          { id: "logs",          label: "Security Logs",    icon: ShieldCheck,   show: canDo("logs") },
          { id: "activity",      label: "Admin Activity",   icon: Activity,      show: canDo("logs") },
          { id: "team",          label: "Team Management",  icon: Crown,         show: isSuperAdmin },
        ]
          .filter((tab) => tab.show)
          .map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.id
                  ? tab.id === "team"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === "team" && (
                <span className="ml-1 text-[9px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                  Super
                </span>
              )}
            </button>
          ))}
      </div>

      {/* Global Search Bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl">
        <Search className="w-4 h-4 text-zinc-500 shrink-0" />
        <input
          type="text"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          placeholder="Search by name, email, user ID, order name, or IP…"
          className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 outline-none"
        />
        {globalSearch && (
          <button onClick={() => setGlobalSearch("")}
            className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
        {globalSearch && (
          <span className="text-[11px] text-zinc-500 shrink-0">Filtering all tabs…</span>
        )}
      </div>

      {/* Content Area */}
      {loadingData ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (() => {
        // ── Search filter helpers ──────────────────────────────
        const q = globalSearch.toLowerCase().trim();
        const filteredUsers = q
          ? users.filter(
              (u: any) =>
                u.name?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q) ||
                u.uid?.toLowerCase().includes(q) ||
                u.id?.toLowerCase().includes(q) ||
                u.role?.toLowerCase().includes(q)
            )
          : users;
        const filteredOrders = q
          ? orders.filter(
              (o: any) =>
                o.planName?.toLowerCase().includes(q) ||
                o.userEmail?.toLowerCase().includes(q) ||
                o.email?.toLowerCase().includes(q) ||
                o.userId?.toLowerCase().includes(q) ||
                o.utrNumber?.toLowerCase().includes(q) ||
                o.status?.toLowerCase().includes(q)
            )
          : orders;
        const filteredLogs = q
          ? logs.filter(
              (l: any) =>
                l.email?.toLowerCase().includes(q) ||
                l.ip?.toLowerCase().includes(q) ||
                l.action?.toLowerCase().includes(q) ||
                l.city?.toLowerCase().includes(q)
            )
          : logs;
        const filteredActivity = q
          ? activityLogs.filter(
              (l: any) =>
                l.adminName?.toLowerCase().includes(q) ||
                l.adminEmail?.toLowerCase().includes(q) ||
                l.adminId?.toLowerCase().includes(q) ||
                l.action?.toLowerCase().includes(q) ||
                l.ip?.toLowerCase().includes(q)
            )
          : activityLogs;

        return (
        <div className="space-y-6">
          {/* CMS TAB */}
          {activeTab === "cms" && (
            <div className="space-y-8">
              {/* ── Projects Section ── */}
              <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-white">
                    Manage Projects & Work
                  </h2>
                  <Button
                    onClick={() => setShowAddModal(true)}
                    variant="accent"
                    size="sm"
                    className="rounded-xl"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add New Project
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dbProjects.map((p) => (
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-4 border border-white/5 rounded-xl bg-black/40 group hover:border-white/10 transition-all"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium truncate">
                            {p.title}
                          </h3>
                          <p className="text-xs text-zinc-500 mt-1">
                            {p.slug}
                          </p>
                          {p.websiteLink && (
                            <a
                              href={p.websiteLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mt-2 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {p.websiteLink.replace(/^https?:\/\//, "")}
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-xs px-2 py-1 rounded-md font-medium ${
                              p.status === "live"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : p.status === "in progress"
                                ? "bg-amber-500/10 text-amber-400"
                                : "bg-white/10 text-zinc-300"
                            }`}
                          >
                            {p.status}
                          </span>
                          <button
                            onClick={() =>
                              handleDeleteProject(p.id, p.title)
                            }
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all shrink-0"
                            title="Delete project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {dbProjects.length === 0 && (
                    <div className="col-span-2 text-center py-10 text-zinc-500">
                      <FolderKanban className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
                      <p className="font-medium">No projects yet</p>
                      <p className="text-xs text-zinc-600 mt-1">
                        Click "Add New Project" to create one.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Hero Trust Metrics Section (CMS Editable) ── */}
              <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Award className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Homepage Hero Trust Metrics
                    </h2>
                    <p className="text-xs text-zinc-500">
                      Customize the 4 social proof statistics displayed on the homepage hero
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Stat 1</p>
                    <div>
                      <label className={labelClasses}>Value</label>
                      <input
                        type="text"
                        value={heroStats.stat1Value}
                        onChange={(e) => setHeroStats({ ...heroStats, stat1Value: e.target.value })}
                        className={inputClasses}
                        placeholder="50+"
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Label</label>
                      <input
                        type="text"
                        value={heroStats.stat1Label}
                        onChange={(e) => setHeroStats({ ...heroStats, stat1Label: e.target.value })}
                        className={inputClasses}
                        placeholder="PROJECTS COMPLETED"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Stat 2</p>
                    <div>
                      <label className={labelClasses}>Value</label>
                      <input
                        type="text"
                        value={heroStats.stat2Value}
                        onChange={(e) => setHeroStats({ ...heroStats, stat2Value: e.target.value })}
                        className={inputClasses}
                        placeholder="100%"
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Label</label>
                      <input
                        type="text"
                        value={heroStats.stat2Label}
                        onChange={(e) => setHeroStats({ ...heroStats, stat2Label: e.target.value })}
                        className={inputClasses}
                        placeholder="CLIENT SATISFACTION"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Stat 3</p>
                    <div>
                      <label className={labelClasses}>Value</label>
                      <input
                        type="text"
                        value={heroStats.stat3Value}
                        onChange={(e) => setHeroStats({ ...heroStats, stat3Value: e.target.value })}
                        className={inputClasses}
                        placeholder="< 2 Wks"
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Label</label>
                      <input
                        type="text"
                        value={heroStats.stat3Label}
                        onChange={(e) => setHeroStats({ ...heroStats, stat3Label: e.target.value })}
                        className={inputClasses}
                        placeholder="AVERAGE DELIVERY"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Stat 4</p>
                    <div>
                      <label className={labelClasses}>Value</label>
                      <input
                        type="text"
                        value={heroStats.stat4Value}
                        onChange={(e) => setHeroStats({ ...heroStats, stat4Value: e.target.value })}
                        className={inputClasses}
                        placeholder="Next.js 16"
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Label</label>
                      <input
                        type="text"
                        value={heroStats.stat4Label}
                        onChange={(e) => setHeroStats({ ...heroStats, stat4Label: e.target.value })}
                        className={inputClasses}
                        placeholder="MODERN STACK"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-6 pt-5 border-t border-white/5">
                  <Button
                    onClick={handleSaveHeroStats}
                    variant="accent"
                    size="sm"
                    className="rounded-xl"
                    disabled={savingHeroStats}
                  >
                    {savingHeroStats ? (
                      "Saving..."
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="w-4 h-4" /> Save Hero Stats
                      </span>
                    )}
                  </Button>
                  {heroStatsSaved && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Saved & Updated Live
                    </motion.span>
                  )}
                </div>
              </div>

              {/* ── Payment Settings Section ── */}
              <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <IndianRupee className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Payment Settings
                    </h2>
                    <p className="text-xs text-zinc-500">
                      Set your UPI details for receiving client payments
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClasses}>
                      UPI ID <span className="text-indigo-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="yourname@upi"
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>
                      UPI Number (Phone) <span className="text-indigo-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={upiNumber}
                      onChange={(e) => setUpiNumber(e.target.value)}
                      placeholder="9876543210"
                      className={inputClasses}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-6 pt-5 border-t border-white/5">
                  <Button
                    onClick={handleSavePaymentSettings}
                    variant="accent"
                    size="sm"
                    className="rounded-xl"
                    disabled={savingPayment}
                  >
                    {savingPayment ? (
                      "Saving..."
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="w-4 h-4" /> Save Payment Info
                      </span>
                    )}
                  </Button>
                  {paymentSaved && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Saved
                    </motion.span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === "users" && (
            <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl p-6 space-y-6">
              <h2 className="text-lg font-semibold text-white">
                Personnel Directory
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-zinc-500 border-b border-white/10">
                    <tr>
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Email</th>
                      <th className="pb-3 font-medium">Role</th>
                      <th className="pb-3 font-medium">User ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="text-zinc-300">
                        <td className="py-4">{u.displayName || u.name || "Unknown"}</td>
                        <td className="py-4">{u.email}</td>
                        <td className="py-4">
                          <span
                            className={`px-2 py-1 rounded-md text-xs font-semibold ${
                              u.role === "super_admin"
                                ? "bg-amber-500/20 text-amber-400"
                                : u.role === "admin"
                                ? "bg-indigo-500/20 text-indigo-400"
                                : "bg-white/10 text-zinc-400"
                            }`}
                          >
                            {u.role || "user"}
                          </span>
                        </td>
                        <td className="py-4 font-mono text-xs text-zinc-500">{u.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ORDERS TAB (With Approval & Query functionality) */}
          {activeTab === "orders" && (
            <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white">
                  Platform Orders & Payment Approvals
                </h2>
                <span className="text-xs text-zinc-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                  {globalSearch ? `${filteredOrders.length} of ${orders.length}` : `Total: ${orders.length}`}
                </span>
              </div>

              <div className="space-y-4">
                {filteredOrders.map((o) => (
                  <div
                    key={o.id}
                    className="p-5 border border-white/10 rounded-2xl bg-black/50 space-y-4"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-base font-bold text-white">
                            {o.planName}
                          </h3>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                              o.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : o.status === "in_progress"
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : o.status === "awaiting_verification"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}
                          >
                            {o.status?.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">
                          Client: <span className="text-white font-medium">{o.userEmail || o.email}</span>
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {o.utrNumber ? (
                            <span className="text-xs text-indigo-400 font-mono px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-1.5">
                              <Copy className="w-3 h-3" /> UTR Ref: {o.utrNumber}
                            </span>
                          ) : (
                            <span className="text-xs text-amber-400 font-medium px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                              UTR: Not Provided
                            </span>
                          )}

                          <button
                            onClick={() => {
                              setEditingUtrOrderId(o.id);
                              setEditUtrValue(o.utrNumber || "");
                            }}
                            className="text-[11px] text-zinc-400 hover:text-white underline transition-colors"
                          >
                            {o.utrNumber ? "Edit UTR" : "+ Add UTR"}
                          </button>

                          {(o.formData || o.details) && (
                            <button
                              onClick={() =>
                                setExpandedOrderDetails(
                                  expandedOrderDetails === o.id ? null : o.id
                                )
                              }
                              className="text-[11px] text-indigo-300 hover:text-indigo-200 transition-colors ml-2"
                            >
                              {expandedOrderDetails === o.id
                                ? "Hide Requirements"
                                : "View Requirements"}
                            </button>
                          )}
                        </div>

                        {/* Inline UTR Edit Form */}
                        {editingUtrOrderId === o.id && (
                          <div className="flex items-center gap-2 mt-3 pt-2">
                            <input
                              type="text"
                              value={editUtrValue}
                              onChange={(e) => setEditUtrValue(e.target.value)}
                              placeholder="Enter 12-digit UTR Number..."
                              className="bg-black/60 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                            />
                            <button
                              onClick={() => handleSaveUtr(o.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                            >
                              Save UTR
                            </button>
                            <button
                              onClick={() => setEditingUtrOrderId(null)}
                              className="px-2 py-1.5 text-xs text-zinc-400 hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        )}

                        {/* Expandable Form Details */}
                        {expandedOrderDetails === o.id && (o.formData || o.details) && (
                          <div className="mt-3 p-4 bg-white/[0.02] border border-white/10 rounded-xl text-xs space-y-2 text-zinc-300">
                            <p className="font-bold text-white uppercase text-[10px] tracking-wider mb-2">
                              Project Requirements & Client Details
                            </p>
                            {o.formData?.company && (
                              <p><span className="text-zinc-500">Company:</span> {o.formData.company}</p>
                            )}
                            {o.formData?.projectType && (
                              <p><span className="text-zinc-500">Project Type:</span> {o.formData.projectType}</p>
                            )}
                            {o.formData?.budget && (
                              <p><span className="text-zinc-500">Budget Range:</span> {o.formData.budget}</p>
                            )}
                            {o.formData?.timeline && (
                              <p><span className="text-zinc-500">Timeline:</span> {o.formData.timeline}</p>
                            )}
                            {(o.formData?.details || o.details) && (
                              <div>
                                <span className="text-zinc-500 block mb-1">Details:</span>
                                <p className="p-2.5 bg-black/40 rounded-lg border border-white/5 text-zinc-200 leading-relaxed whitespace-pre-wrap">
                                  {o.formData?.details || o.details}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-black text-white">
                          ₹{o.price?.toLocaleString()}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {o.createdAt?.toDate?.()
                            ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(o.createdAt.toDate())
                            : "Recent"}
                        </p>
                      </div>
                    </div>

                    {/* Order Query & Actions Bar */}
                    <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {/* Approval buttons */}
                        {o.status !== "completed" && o.status !== "rejected" && (
                          <>
                            <button
                              onClick={() => handleUpdateOrderStatus(o.id, "in_progress", o.userEmail || o.email, o.userId)}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all cursor-pointer shadow-md"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve Payment
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(o.id, "rejected", o.userEmail || o.email, o.userId)}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 transition-all cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject Payment
                            </button>
                          </>
                        )}
                        {o.status === "in_progress" && (
                          <button
                            onClick={() => handleUpdateOrderStatus(o.id, "completed", o.userEmail || o.email, o.userId)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                          </button>
                        )}

                        {/* Ask Query Button */}
                        <button
                          onClick={() => {
                            setQueryOrder(o);
                            setQueryText(o.adminQuery || "");
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          {o.adminQuery ? "Edit Admin Query" : "Ask Query"}
                        </button>
                      </div>

                      {/* Display active query/response indicators */}
                      <div className="text-xs">
                        {o.adminQuery && (
                          <span className="text-indigo-400 flex items-center gap-1">
                            <HelpCircle className="w-3 h-3" /> Query Sent
                          </span>
                        )}
                        {o.userResponse && (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1 ml-2">
                            <CheckCircle2 className="w-3 h-3" /> User Replied!
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Display existing Query & Response text */}
                    {(o.adminQuery || o.userResponse) && (
                      <div className="mt-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs space-y-2">
                        {o.adminQuery && (
                          <div>
                            <span className="text-indigo-400 font-semibold">Admin Question: </span>
                            <span className="text-zinc-300">{o.adminQuery}</span>
                          </div>
                        )}
                        {o.userResponse && (
                          <div>
                            <span className="text-emerald-400 font-semibold">User Answer: </span>
                            <span className="text-white">{o.userResponse}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Developer Interaction Room */}
                    <div className="mt-3">
                      <button
                        onClick={() =>
                          setOpenRoomOrderId(openRoomOrderId === o.id ? null : o.id)
                        }
                        className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                          openRoomOrderId === o.id
                            ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300"
                            : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
                        }`}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        {openRoomOrderId === o.id ? "Close" : "Open"} Developer Room
                      </button>

                      {openRoomOrderId === o.id && (
                        <DeveloperInteractionRoom
                          orderId={o.id}
                          orderStatus={o.status}
                          planName={o.planName}
                          currentUserId={user?.uid || ""}
                          currentUserName={user?.displayName || profile?.name || "Admin"}
                          currentUserRole="admin"
                        />
                      )}
                    </div>
                  </div>
                ))}

                {orders.length === 0 && (
                  <div className="text-center py-10 text-zinc-500">
                    No orders found.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB (Broadcast & Targeted) */}
          {activeTab === "notifications" && (
            <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Send Notifications
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Broadcast updates to all users or send targeted messages to specific individuals
                  </p>
                </div>
              </div>

              <div className="space-y-5 max-w-2xl">
                <div>
                  <label className={labelClasses}>
                    Target Audience <span className="text-indigo-400">*</span>
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setNotifTargetType("broadcast")}
                      className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold border transition-all ${
                        notifTargetType === "broadcast"
                          ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50"
                          : "bg-white/[0.02] text-zinc-400 border-white/10"
                      }`}
                    >
                      📢 Broadcast to All Users
                    </button>
                    <button
                      onClick={() => setNotifTargetType("user")}
                      className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold border transition-all ${
                        notifTargetType === "user"
                          ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50"
                          : "bg-white/[0.02] text-zinc-400 border-white/10"
                      }`}
                    >
                      👤 Specific Individual User
                    </button>
                  </div>
                </div>

                {notifTargetType === "user" && (
                  <div>
                    <label className={labelClasses}>Select Target User</label>
                    <select
                      value={notifTargetUserId}
                      onChange={(e) => setNotifTargetUserId(e.target.value)}
                      className="w-full bg-[#161618] border border-white/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer shadow-lg"
                    >
                      <option value="" disabled className="bg-[#161618] text-zinc-400">
                        Select a user...
                      </option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id} className="bg-[#161618] text-white py-2">
                          {u.displayName || u.name || u.email} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className={labelClasses}>
                    Title <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="e.g. Platform Maintenance / Special Offer"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className={labelClasses}>
                    Message Body <span className="text-indigo-400">*</span>
                  </label>
                  <textarea
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    rows={4}
                    placeholder="Enter the notification message details..."
                    className={`${inputClasses} resize-none`}
                  />
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <Button
                    onClick={handleSendNotification}
                    variant="accent"
                    size="sm"
                    className="rounded-xl px-6"
                    disabled={sendingNotif}
                  >
                    {sendingNotif ? (
                      "Sending..."
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-4 h-4" /> Send Notification
                      </span>
                    )}
                  </Button>
                  {notifSent && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Notification Sent!
                    </motion.span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* LOGS TAB */}
          {activeTab === "logs" && (
            <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl p-6 space-y-6">
              <h2 className="text-lg font-semibold text-white">
                Security & Login Logs
              </h2>
              <div className="space-y-3">
                {filteredLogs.map((l) => (
                  <div
                    key={l.id}
                    className="p-4 border border-white/5 rounded-xl bg-black/40"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-mono text-indigo-400">
                        {l.action?.toUpperCase()}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {l.localTime}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-300 mb-1">{l.email}</p>
                    <p className="text-xs text-zinc-500">
                      {l.city}, {l.country} &bull; {l.ip}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ADMIN ACTIVITY LOGS TAB */}
          {activeTab === "activity" && (
            <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Admin Activity Audit Log</h2>
                  <p className="text-xs text-zinc-500">
                    All admin actions are automatically recorded — including IP address, location, user, and action details.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {filteredActivity.length === 0 && (
                  <p className="text-center text-zinc-500 py-8 text-sm">No admin actions logged yet.</p>
                )}
                {filteredActivity.map((l) => (
                  <div
                    key={l.id}
                    className="p-4 border border-white/5 rounded-xl bg-black/40 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-purple-400 px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20">
                        {l.action}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {l.timestamp
                          ? new Intl.DateTimeFormat("en", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(l.timestamp))
                          : "—"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs">
                      <span className="text-zinc-300 font-medium">{l.adminName}</span>
                      <span className="text-zinc-500">{l.adminEmail}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-zinc-600">
                      <span>IP: <span className="font-mono text-zinc-400">{l.ip || "—"}</span></span>
                      <span>Location: <span className="text-zinc-400">{l.location || "—"}</span></span>
                      <span>UID: <span className="font-mono text-zinc-600 text-[10px]">{l.adminId}</span></span>
                    </div>
                    {l.details && Object.keys(l.details).length > 0 && (
                      <div className="mt-1 pt-2 border-t border-white/5 text-[11px] text-zinc-500 flex flex-wrap gap-3">
                        {Object.entries(l.details).map(([k, v]) =>
                          v != null ? (
                            <span key={k}>
                              <span className="text-zinc-600">{k}:</span>{" "}
                              <span className="text-zinc-400">{String(v)}</span>
                            </span>
                          ) : null
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TEAM MANAGEMENT TAB — super_admin only */}
          {activeTab === "team" && isSuperAdmin && (
            <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Team Management</h2>
                  <p className="text-xs text-zinc-500">
                    Assign work permissions to admins and promote users to admin role. Only you can see this tab.
                  </p>
                </div>
              </div>

              {/* Promote user to admin */}
              <div className="border border-white/5 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <UserCog className="w-4 h-4 text-indigo-400" /> Promote / Demote Users
                </h3>
                <div className="space-y-2">
                  {filteredUsers
                    .filter((u: any) => u.role !== "super_admin")
                    .map((u: any) => (
                      <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <div>
                          <p className="text-sm text-white font-medium">{u.name || u.email}</p>
                          <p className="text-xs text-zinc-500">{u.email} • <span className="font-mono">{u.id}</span></p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            u.role === "admin" ? "text-indigo-400 border-indigo-500/30 bg-indigo-500/10" : "text-zinc-400 border-zinc-700 bg-white/[0.02]"
                          }`}>{u.role || "user"}</span>
                          <button
                            disabled={promotingUser === u.id}
                            onClick={async () => {
                              setPromotingUser(u.id);
                              const newRole = u.role === "admin" ? "user" : "admin";
                              try {
                                await updateDoc(doc(db, "users", u.id), { role: newRole });
                                setUsers((prev: any[]) => prev.map((x: any) => x.id === u.id ? { ...x, role: newRole } : x));
                                logAdminAction({ adminId: user?.uid || "", adminName: user?.displayName || profile?.name || "Admin", adminEmail: user?.email || "", action: newRole === "admin" ? "PROMOTED_TO_ADMIN" : "DEMOTED_TO_USER", details: { targetUid: u.id, targetEmail: u.email } });
                              } catch { alert("Failed to update role"); }
                              finally { setPromotingUser(null); }
                            }}
                            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                              u.role === "admin"
                                ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                                : "border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
                            }`}
                          >
                            {promotingUser === u.id ? "Saving…" : u.role === "admin" ? "Demote to User" : "Promote to Admin"}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Permission toggles per admin */}
              <div className="border border-white/5 rounded-xl p-4 space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Admin Work Distribution
                </h3>
                <p className="text-xs text-zinc-500">
                  Toggle which tasks each admin is responsible for. Super admin always has full access.
                </p>
                {users
                  .filter((u: any) => u.role === "admin")
                  .map((admin: any) => {
                    const perms = admin.adminPermissions || {};
                    const PERM_LIST: { key: string; label: string }[] = [
                      { key: "cms",           label: "CMS / Content" },
                      { key: "payments",      label: "Payment Verification" },
                      { key: "notifications", label: "Send Notifications" },
                      { key: "queries",       label: "User Queries" },
                      { key: "logs",          label: "View Logs" },
                    ];
                    return (
                      <div key={admin.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-300">
                            {(admin.name || admin.email || "A")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{admin.name || "—"}</p>
                            <p className="text-[11px] text-zinc-500">{admin.email}</p>
                          </div>
                          {savingPermissions === admin.id && (
                            <span className="ml-auto text-[11px] text-indigo-400 animate-pulse">Saving…</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {PERM_LIST.map(({ key, label }) => {
                            const enabled = !!perms[key];
                            return (
                              <button
                                key={key}
                                onClick={async () => {
                                  setSavingPermissions(admin.id);
                                  const newPerms = { ...perms, [key]: !enabled };
                                  try {
                                    await updateDoc(doc(db, "users", admin.id), { adminPermissions: newPerms });
                                    setUsers((prev: any[]) => prev.map((u: any) => u.id === admin.id ? { ...u, adminPermissions: newPerms } : u));
                                    logAdminAction({ adminId: user?.uid || "", adminName: user?.displayName || profile?.name || "Admin", adminEmail: user?.email || "", action: "UPDATED_ADMIN_PERMISSIONS", details: { targetAdminId: admin.id, permission: key, enabled: !enabled } });
                                  } catch { alert("Failed to update permissions"); }
                                  finally { setSavingPermissions(null); }
                                }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                                  enabled
                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                    : "border-white/10 bg-white/[0.02] text-zinc-500 hover:border-white/20 hover:text-zinc-300"
                                }`}
                              >
                                {enabled ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                {users.filter((u: any) => u.role === "admin").length === 0 && (
                  <p className="text-sm text-zinc-500 text-center py-4">No admins yet. Promote a user above first.</p>
                )}
              </div>
            </div>
          )}
        </div>
        );
      })()}

      {/* ── Ask Query Modal ── */}
      <AnimatePresence>
        {queryOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setQueryOrder(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg p-6 sm:p-8 relative shadow-2xl">
                <button
                  onClick={() => setQueryOrder(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Ask User a Question
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Order: {queryOrder.planName} ({queryOrder.userEmail || queryOrder.email})
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={labelClasses}>
                      Question / Clarification Request <span className="text-indigo-400">*</span>
                    </label>
                    <textarea
                      value={queryText}
                      onChange={(e) => setQueryText(e.target.value)}
                      rows={4}
                      placeholder="e.g. Please provide your design reference links, logo SVG files, or confirm your preferred domain name..."
                      className={`${inputClasses} resize-none`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-white/5">
                  <Button
                    onClick={() => setQueryOrder(null)}
                    variant="ghost"
                    size="sm"
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendOrderQuery}
                    variant="accent"
                    size="sm"
                    className="rounded-xl"
                    disabled={sendingQuery}
                  >
                    {sendingQuery ? (
                      "Sending..."
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-4 h-4" /> Send Query to User
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Add Project Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg p-6 sm:p-8 relative shadow-2xl">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <FolderKanban className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Add New Project
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Add a project to your portfolio
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className={labelClasses}>
                      Title <span className="text-indigo-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={projectForm.title}
                      onChange={(e) => {
                        const title = e.target.value;
                        setProjectForm({
                          ...projectForm,
                          title,
                          slug: generateSlug(title),
                        });
                      }}
                      placeholder="My Awesome Project"
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className={labelClasses}>Slug</label>
                    <input
                      type="text"
                      value={projectForm.slug}
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          slug: e.target.value,
                        })
                      }
                      placeholder="my-awesome-project"
                      className={inputClasses}
                    />
                    <p className="text-xs text-zinc-600 mt-1">
                      Auto-generated from title. Editable.
                    </p>
                  </div>

                  <div>
                    <label className={labelClasses}>Description</label>
                    <textarea
                      value={projectForm.description}
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      placeholder="Brief description of the project..."
                      className={`${inputClasses} resize-none`}
                    />
                  </div>

                  <div>
                    <label className={labelClasses}>
                      Website Link{" "}
                      <span className="text-indigo-400">*</span>
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                      <input
                        type="url"
                        value={projectForm.websiteLink}
                        onChange={(e) =>
                          setProjectForm({
                            ...projectForm,
                            websiteLink: e.target.value,
                          })
                        }
                        placeholder="https://example.com"
                        className={`${inputClasses} pl-11`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClasses}>Status</label>
                    <select
                      value={projectForm.status}
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          status: e.target.value,
                        })
                      }
                      className="w-full bg-[#161618] border border-white/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer shadow-lg"
                    >
                      <option value="demo / concept" className="bg-[#161618] text-white">Demo / Concept</option>
                      <option value="in progress" className="bg-[#161618] text-white">In Progress</option>
                      <option value="live" className="bg-[#161618] text-white">Live</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-white/5">
                  <Button
                    onClick={() => setShowAddModal(false)}
                    variant="ghost"
                    size="sm"
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddProject}
                    variant="accent"
                    size="sm"
                    className="rounded-xl"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      "Adding..."
                    ) : (
                      <span className="flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add Project
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
