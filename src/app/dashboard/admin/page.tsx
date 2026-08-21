"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { logAdminAction } from "@/lib/logAdminAction";
import DeveloperInteractionRoom from "@/components/dashboard/DeveloperInteractionRoom";
import {
  collection,
  getDocs,
  onSnapshot,
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
  Tag,
  Flame,
  Percent,
  Calendar,
  Sparkles,
  Clock,
  Radio,
  Eye,
  Image as ImageIcon,
  Code2,
  UserCheck,
  ChevronDown,
  Briefcase,
  Layers,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ProjectForm {
  title: string;
  slug: string;
  description: string;
  websiteLink: string;
  status: string;
}

interface OfferForm {
  title: string;
  description: string;
  imageUrl: string;
  discountBadge: string;
  promoCode: string;
  actionLink: string;
  buttonText: string;
  startDate: string;
  endDate: string;
  targetType: "broadcast" | "user";
  targetUserId: string;
  targetEmail: string;
  isActive: boolean;
  sendNotification: boolean;
}

const emptyProject: ProjectForm = {
  title: "",
  slug: "",
  description: "",
  websiteLink: "",
  status: "in progress",
};

const defaultOfferForm: OfferForm = {
  title: "",
  description: "",
  imageUrl: "",
  discountBadge: "",
  promoCode: "",
  actionLink: "/dashboard",
  buttonText: "Claim Offer",
  startDate: new Date().toISOString().slice(0, 16),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  targetType: "broadcast",
  targetUserId: "",
  targetEmail: "",
  isActive: true,
  sendNotification: true,
};

const dedupeById = <T extends { id?: string }>(arr: T[]): T[] => {
  const seen = new Set<string>();
  return (arr || []).filter((item) => {
    if (!item?.id) return true;
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

export default function AdminPanel() {
  const { profile, loading, user, isSuperAdmin, isAdmin, canDo } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<
    "users" | "cms" | "orders" | "offers" | "notifications" | "logs" | "activity" | "team"
  >("cms");

  // Team management state (super_admin only)
  const [savingPermissions, setSavingPermissions] = useState<string | null>(null);
  const [promotingUser, setPromotingUser] = useState<string | null>(null);

  // Developer Room state
  const [openRoomOrderId, setOpenRoomOrderId] = useState<string | null>(null);

  // Developer Assignment state
  const [assigningDevOrderId, setAssigningDevOrderId] = useState<string | null>(null);
  const [assigningDevLoading, setAssigningDevLoading] = useState(false);

  // Global Search
  const [globalSearch, setGlobalSearch] = useState("");

  // Data States
  const [users, setUsers] = useState<any[]>([]);
  const [dbProjects, setDbProjects] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);

  const [loadingData, setLoadingData] = useState(true);

  // Modal State (Projects)
  const [showAddModal, setShowAddModal] = useState(false);
  const [projectForm, setProjectForm] = useState<ProjectForm>(emptyProject);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Offers State
  const [showAddOfferModal, setShowAddOfferModal] = useState(false);
  const [offerForm, setOfferForm] = useState<OfferForm>(defaultOfferForm);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [offerSearch, setOfferSearch] = useState("");

  // Coupons State
  const [showAddCouponModal, setShowAddCouponModal] = useState(false);
  const [couponSearch, setCouponSearch] = useState("");
  const [isSubmittingCoupon, setIsSubmittingCoupon] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: "",
    type: "percentage" as "percentage" | "flat",
    value: 0,
    maxDiscount: 0,
    minOrderValue: 0,
    scope: "all" as "all" | "plans" | "addons" | "maintenance",
    applicablePlans: ["all"] as string[],
    applicableAddons: ["all"] as string[],
    usageLimitMode: "unlimited" as "unlimited" | "custom",
    usageLimit: 0,
    showAsBanner: false,
    bannerText: "",
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    isActive: true,
  });
  const defaultCouponForm = {
    code: "",
    type: "percentage" as "percentage" | "flat",
    value: 0,
    maxDiscount: 0,
    minOrderValue: 0,
    scope: "all" as "all" | "plans" | "addons" | "maintenance",
    applicablePlans: ["all"] as string[],
    applicableAddons: ["all"] as string[],
    usageLimitMode: "unlimited" as "unlimited" | "custom",
    usageLimit: 0,
    showAsBanner: false,
    bannerText: "",
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    isActive: true,
  };

  // Notifications Subtab & Filter State
  const [notifSubTab, setNotifSubTab] = useState<"broadcast" | "individual">("broadcast");
  const [notifSearch, setNotifSearch] = useState("");
  const [notifImageUrl, setNotifImageUrl] = useState("");
  const [notifActionLink, setNotifActionLink] = useState("");
  const [notifActionText, setNotifActionText] = useState("");

  // Payment Settings State
  const [paymentMode, setPaymentMode] = useState<"manual" | "paytm">("manual");
  const [upiId, setUpiId] = useState("paytmqr281005050101y218u1d161d0@paytm");
  const [upiName, setUpiName] = useState("Runix Web Technologies");
  const [upiNumber, setUpiNumber] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [paymentInstructions, setPaymentInstructions] = useState(
    "Scan the QR code or pay via UPI. After payment, enter your 12-digit UTR transaction ID below to verify your sprint."
  );
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentSaved, setPaymentSaved] = useState(false);

  // UTR Edit State & Expand Details State
  const [editingUtrOrderId, setEditingUtrOrderId] = useState<string | null>(null);
  const [editUtrValue, setEditUtrValue] = useState("");
  const [expandedOrderDetails, setExpandedOrderDetails] = useState<string | null>(null);

  // Status Caption State
  const [editingCaptionOrderId, setEditingCaptionOrderId] = useState<string | null>(null);
  const [captionValue, setCaptionValue] = useState("");

  // Maintenance Assignment State
  const [assigningMaintDevOrderId, setAssigningMaintDevOrderId] = useState<string | null>(null);
  const [assigningMaintLoading, setAssigningMaintLoading] = useState(false);

  // Orders Tab Category Filter, Plan Filter & Dev Filter State
  const [orderCategoryTab, setOrderCategoryTab] = useState<
    "all" | "pending" | "in_progress" | "awaiting_final" | "completed" | "cancelled"
  >("all");
  const [orderPlanFilter, setOrderPlanFilter] = useState<
    "all" | "essential" | "professional" | "enterprise"
  >("all");
  const [orderDevFilter, setOrderDevFilter] = useState<string>("all");

  const handleAssignMaintenanceDeveloper = async (
    orderId: string,
    devId: string,
    devName: string,
    devEmail: string,
    order: any
  ) => {
    setAssigningMaintLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/orders/assign-developer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, developerId: devId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to assign developer");
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                maintenanceAssignedDevId: devId,
                maintenanceAssignedDevName: devName,
                maintenanceAssignedDevEmail: devEmail,
              }
            : o
        )
      );

      setAssigningMaintDevOrderId(null);
      alert(`Maintenance Engineer ${devName} assigned successfully!`);
    } catch (e: any) {
      console.error("Failed to assign maintenance dev:", e);
      alert(e.message || "Failed to assign maintenance developer.");
    } finally {
      setAssigningMaintLoading(false);
    }
  };

  const handleGrantMaintenanceCoverage = async (order: any) => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/orders/grant-maintenance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId: order.id, days: 30 }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to grant maintenance");
      }

      const expirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                maintenanceActive: true,
                maintenanceExpiresAt: expirationDate,
                maintenancePaid: true,
              }
            : o
        )
      );

      alert("30-Day Maintenance Retainer granted successfully!");
    } catch (e: any) {
      console.error("Failed to grant maintenance coverage:", e);
      alert(e.message || "Failed to grant maintenance coverage.");
    }
  };

  const handleSaveUtr = async (orderId: string) => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/orders/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, status: "awaiting_verification" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update UTR");
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, utrNumber: editUtrValue.trim(), status: "awaiting_verification" }
            : o
        )
      );
      setEditingUtrOrderId(null);
      setEditUtrValue("");
    } catch (e: any) {
      console.error("Failed to update UTR:", e);
      alert(e.message || "Failed to update UTR");
    }
  };

  const handleSaveCaption = async (orderId: string) => {
    try {
      const currentOrder = orders.find((o) => o.id === orderId);
      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/orders/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          status: currentOrder?.status || "in_progress",
          statusCaption: captionValue.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update status caption");
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, statusCaption: captionValue.trim() }
            : o
        )
      );
      setEditingCaptionOrderId(null);
      setCaptionValue("");
    } catch (e: any) {
      console.error("Failed to update caption:", e);
      alert(e.message || "Failed to update status caption");
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

  // Staging Deployment Modal State
  const [stagingModalOrder, setStagingModalOrder] = useState<any | null>(null);
  const [stagingInputUrl, setStagingInputUrl] = useState("");
  const [deployingStaging, setDeployingStaging] = useState(false);

  // Final Handover Modal State
  const [handoverModalOrder, setHandoverModalOrder] = useState<any | null>(null);
  const [handoverForm, setHandoverForm] = useState({
    githubRepo: "",
    liveUrl: "",
    driveZip: "",
    handoverNotes: "",
  });
  const [completingHandover, setCompletingHandover] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!isAdmin) {
        router.push("/dashboard");
      } else {
        fetchData();
        fetchPaymentSettings();
        fetchHeroStats();

        // Real-time synchronization for admin views
        const unsubUsers = onSnapshot(
          collection(db, "users"),
          (snap) => {
            setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          },
          (err) => console.warn("Realtime users listener notice:", err?.message || err)
        );

        const unsubOrders = onSnapshot(
          collection(db, "orders"),
          (snap) => {
            setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          },
          (err) => console.warn("Realtime orders listener notice:", err?.message || err)
        );

        const unsubProjects = onSnapshot(
          collection(db, "projects"),
          (snap) => {
            setDbProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          },
          (err) => console.warn("Realtime projects listener notice:", err?.message || err)
        );

        const unsubNotifs = onSnapshot(
          collection(db, "notifications"),
          (snap) => {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setNotifications(
              list.sort(
                (a: any, b: any) =>
                  new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
              )
            );
          },
          (err) => console.warn("Realtime notifications listener notice:", err?.message || err)
        );

        const unsubActivity = onSnapshot(
          collection(db, "admin_activity_logs"),
          (snap) => {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setActivityLogs(
              list.sort(
                (a: any, b: any) =>
                  new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
              )
            );
          },
          (err) => console.warn("Realtime activity logs listener notice:", err?.message || err)
        );

        const unsubOffers = onSnapshot(
          collection(db, "offers"),
          (snap) => {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setOffers(
              list.sort(
                (a: any, b: any) =>
                  new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
              )
            );
          },
          (err) => console.warn("Realtime offers listener notice:", err?.message || err)
        );

        return () => {
          unsubUsers();
          unsubOrders();
          unsubProjects();
          unsubNotifs();
          unsubActivity();
          unsubOffers();
        };
      }
    }
  }, [loading, isAdmin, router]);

  const fetchData = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/data", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let data;
      try {
        data = await res.json();
      } catch (err) {
        console.warn("Failed to parse admin data response, falling back to client-side fetch.", err);
        await fallbackClientFetch();
        return;
      }

      if (res.ok && data.success) {
        setUsers(dedupeById(data.users || []));
        setDbProjects(dedupeById(data.dbProjects || []));
        setOrders(dedupeById(data.orders || []));
        setLogs(dedupeById(data.logs || []));
        setOffers(
          dedupeById(
            (data.offers || []).sort(
              (a: any, b: any) =>
                new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            )
          )
        );
        setActivityLogs(
          dedupeById(
            (data.activityLogs || []).sort(
              (a: any, b: any) =>
                new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
            )
          )
        );
        setNotifications(
          dedupeById(
            (data.notifications || []).sort(
              (a: any, b: any) =>
                new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            )
          )
        );
        setCoupons(
          dedupeById(
            (data.coupons || []).sort(
              (a: any, b: any) =>
                new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            )
          )
        );
        setLoadingData(false);
      } else {
        console.warn("Failed to fetch admin data, falling back to client-side fetch:", data?.error);
        await fallbackClientFetch();
      }
    } catch (err) {
      console.error(err);
      await fallbackClientFetch();
    } finally {
      setLoadingData(false);
    }
  };

  const fallbackClientFetch = async () => {
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

      const [usersData, projectsData, ordersData, logsData, activityLogsData, notificationsData, offersData, couponsData] =
        await Promise.all([
          fetchCollection("users"),
          fetchCollection("projects"),
          fetchCollection("orders"),
          fetchCollection("login_logs"),
          fetchCollection("admin_activity_logs"),
          fetchCollection("notifications"),
          fetchCollection("offers"),
          fetchCollection("coupons"),
        ]);

      setUsers(dedupeById(usersData));
      setDbProjects(dedupeById(projectsData));
      setOrders(dedupeById(ordersData));
      setLogs(dedupeById(logsData));
      setOffers(
        dedupeById(
          offersData.sort(
            (a: any, b: any) =>
              new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          )
        )
      );
      setActivityLogs(
        dedupeById(
          activityLogsData.sort(
            (a: any, b: any) =>
              new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
          )
        )
      );
      setNotifications(
        dedupeById(
          notificationsData.sort(
            (a: any, b: any) =>
              new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          )
        )
      );
      setCoupons(
        dedupeById(
          couponsData.sort(
            (a: any, b: any) =>
              new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          )
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchPaymentSettings = async () => {
    try {
      const docSnap = await getDoc(doc(db, "settings", "payment"));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPaymentMode(data.paymentMode || "manual");
        setUpiId(data.upiId || "paytmqr281005050101y218u1d161d0@paytm");
        setUpiName(data.upiName || "Runix Web Technologies");
        setUpiNumber(data.upiNumber || "");
        setQrCodeUrl(data.qrCodeUrl || "");
        setPaymentInstructions(
          data.paymentInstructions ||
            "Scan the QR code or pay via UPI. After payment, enter your 12-digit UTR transaction ID below to verify your sprint."
        );
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
      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/settings/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentMode,
          upiId,
          upiName,
          upiNumber,
          qrCodeUrl,
          paymentInstructions,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save payment settings");
      }

      setPaymentSaved(true);
      setTimeout(() => setPaymentSaved(false), 3000);
    } catch (e: any) {
      console.error("Failed to save payment settings:", e);
      alert(e.message || "Failed to save payment settings");
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
    if (notifTargetType === "user" && !notifTargetUserId) {
      alert("Please select a target user.");
      return;
    }
    setSendingNotif(true);
    try {
      const targetUserObj = users.find((u) => u.id === notifTargetUserId || u.uid === notifTargetUserId);
      await addDoc(collection(db, "notifications"), {
        title: notifTitle.trim(),
        message: notifMessage.trim(),
        imageUrl: notifImageUrl.trim() || null,
        actionLink: notifActionLink.trim() || null,
        actionText: notifActionText.trim() || null,
        targetType: notifTargetType,
        targetUserId: notifTargetType === "user" ? notifTargetUserId : null,
        targetEmail: notifTargetType === "user" ? targetUserObj?.email || null : null,
        senderName: user?.displayName || profile?.name || "Admin",
        senderRole: "Admin",
        senderDesignation: profile?.designation || null,
        senderDepartment: profile?.department || null,
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
        details: {
          title: notifTitle.trim(),
          targetType: notifTargetType,
          targetUserId: notifTargetUserId || null,
          hasImage: !!notifImageUrl.trim(),
          actionLink: notifActionLink.trim() || null,
        },
      });
      setNotifSent(true);
      setNotifTitle("");
      setNotifMessage("");
      setNotifImageUrl("");
      setNotifActionLink("");
      setNotifActionText("");
      setTimeout(() => setNotifSent(false), 3000);
    } catch (e) {
      console.error("Failed to send notification:", e);
      alert("Failed to send notification");
    } finally {
      setSendingNotif(false);
    }
  };

  const handleDeleteNotification = async (notifId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete notification "${title}"?`)) return;
    try {
      await deleteDoc(doc(db, "notifications", notifId));
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      logAdminAction({
        adminId: user?.uid || "",
        adminName: user?.displayName || profile?.name || "Admin",
        adminEmail: user?.email || "",
        action: "DELETED_NOTIFICATION",
        details: { notifId, title },
      });
    } catch (e) {
      console.error("Failed to delete notification:", e);
      alert("Failed to delete notification");
    }
  };

  const handleSaveOffer = async () => {
    if (!offerForm.title.trim() || !offerForm.description.trim()) {
      alert("Please fill in Offer Title and Description");
      return;
    }
    if (!offerForm.startDate || !offerForm.endDate) {
      alert("Please set both Start Date and End Date for the offer time limit");
      return;
    }
    if (offerForm.targetType === "user" && !offerForm.targetUserId) {
      alert("Please select a target user for this individual offer");
      return;
    }

    setIsSubmittingOffer(true);
    try {
      const targetUserObj = users.find((u) => u.id === offerForm.targetUserId || u.uid === offerForm.targetUserId);
      const offerData = {
        title: offerForm.title.trim(),
        description: offerForm.description.trim(),
        imageUrl: offerForm.imageUrl.trim() || "",
        discountBadge: offerForm.discountBadge.trim() || "",
        promoCode: offerForm.promoCode.trim().toUpperCase() || "",
        actionLink: offerForm.actionLink.trim() || "/dashboard",
        buttonText: offerForm.buttonText.trim() || "Claim Offer",
        startDate: new Date(offerForm.startDate).toISOString(),
        endDate: new Date(offerForm.endDate).toISOString(),
        targetType: offerForm.targetType,
        targetUserId: offerForm.targetType === "user" ? offerForm.targetUserId : undefined,
        targetEmail: offerForm.targetType === "user" ? targetUserObj?.email || offerForm.targetEmail || undefined : undefined,
        isActive: offerForm.isActive,
      };

      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/offers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(offerData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create offer");
      }

      setOffers((prev) => dedupeById([{ id: data.id, ...offerData }, ...prev]));
      setOfferForm(defaultOfferForm);
      setShowAddOfferModal(false);
      alert("Offer created and published successfully!");
    } catch (e: any) {
      console.error("Failed to create offer:", e);
      alert(e.message || "Failed to create offer");
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  const handleDeleteOffer = async (offerId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete offer "${title}"? This cannot be undone.`)) return;
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/admin/offers?id=${offerId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete offer");
      }

      setOffers((prev) => prev.filter((o) => o.id !== offerId));
    } catch (e: any) {
      console.error("Failed to delete offer:", e);
      alert(e.message || "Failed to delete offer");
    }
  };

  const handleToggleOfferStatus = async (offerId: string, currentStatus: boolean, title: string) => {
    try {
      const nextStatus = !currentStatus;
      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/offers", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: offerId, isActive: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update offer status");
      }

      setOffers((prev) =>
        prev.map((o) => (o.id === offerId ? { ...o, isActive: nextStatus } : o))
      );
    } catch (e: any) {
      console.error("Failed to toggle offer status:", e);
      alert(e.message || "Failed to update offer status");
    }
  };

  // ── Coupon CRUD Handlers ──

  const handleCreateCoupon = async () => {
    if (!couponForm.code.trim()) {
      alert("Please enter a coupon code");
      return;
    }
    if (couponForm.value <= 0) {
      alert("Please enter a valid discount value");
      return;
    }

    setIsSubmittingCoupon(true);
    try {
      const normalizedCode = couponForm.code.trim().toUpperCase();

      const couponData = {
        code: normalizedCode,
        type: couponForm.type,
        value: Number(couponForm.value),
        maxDiscount: couponForm.type === "percentage" ? Number(couponForm.maxDiscount) || 0 : 0,
        minOrderValue: Number(couponForm.minOrderValue) || 0,
        scope: couponForm.scope,
        applicablePlans: couponForm.scope === "plans" ? couponForm.applicablePlans : ["all"],
        applicableAddons: couponForm.scope === "addons" ? couponForm.applicableAddons : ["all"],
        usageLimit: couponForm.usageLimitMode === "unlimited" ? 0 : Number(couponForm.usageLimit) || 1,
        isActive: couponForm.isActive,
        startDate: new Date(couponForm.startDate).toISOString(),
        endDate: new Date(couponForm.endDate).toISOString(),
      };

      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(couponData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create coupon");
      }

      setCoupons((prev) => dedupeById([{ id: data.id, ...couponData, usedCount: 0 }, ...prev]));
      setCouponForm(defaultCouponForm);
      setShowAddCouponModal(false);
      alert(`Coupon "${normalizedCode}" created successfully!`);
    } catch (e: any) {
      console.error("Failed to create coupon:", e);
      alert(e.message || "Failed to create coupon");
    } finally {
      setIsSubmittingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (couponId: string, code: string) => {
    if (!confirm(`Are you sure you want to delete coupon "${code}"? This cannot be undone.`)) return;
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/admin/coupons?id=${couponId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete coupon");
      }

      setCoupons((prev) => prev.filter((c) => c.id !== couponId));
    } catch (e: any) {
      console.error("Failed to delete coupon:", e);
      alert(e.message || "Failed to delete coupon");
    }
  };

  const handleToggleCouponStatus = async (couponId: string, currentStatus: boolean, code: string) => {
    try {
      const nextStatus = !currentStatus;
      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/coupons", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: couponId, isActive: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update coupon status");
      }

      setCoupons((prev) =>
        prev.map((c) => (c.id === couponId ? { ...c, isActive: nextStatus } : c))
      );
    } catch (e: any) {
      console.error("Failed to toggle coupon status:", e);
      alert(e.message || "Failed to update coupon status");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/orders/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update order status");
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (e: any) {
      console.error("Failed to update order status:", e);
      alert(e.message || "Failed to update order status");
    }
  };

  const handleVerifyAdvance = async (orderId: string) => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/orders/verify-advance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to verify advance payment");
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, advancePaid: true, status: "in_progress" } : o))
      );
      alert("50% Advance verified! Project marked in progress.");
    } catch (e: any) {
      console.error("Failed to verify advance payment:", e);
      alert(e.message || "Failed to verify advance payment");
    }
  };

  /** Dynamic Auto-Assignment: Finds the developer with lowest active load (< 5) and assigns */
  const handleAutoAssignDeveloper = async (orderId: string, order: any) => {
    const available = users
      .filter((u: any) => u.role === "developer" && (u.activeProjectCount || 0) < (u.maxProjects || 5))
      .sort((a: any, b: any) => (a.activeProjectCount || 0) - (b.activeProjectCount || 0));

    if (available.length === 0) {
      alert("No developers available. All developers are at maximum capacity (5/5) or no developers have been promoted yet.");
      return;
    }

    const selectedDev = available[0];
    await handleAssignDeveloper(orderId, selectedDev.id, selectedDev.name || selectedDev.email, selectedDev.email, order);
  };

  /** Assign a developer to an order. Handles reassignment (decrement old, increment new). */
  const handleAssignDeveloper = async (orderId: string, devId: string, devName: string, devEmail: string, order: any) => {
    setAssigningDevLoading(true);
    try {
      const oldDevId = order?.assignedDeveloperId;
      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/orders/assign-developer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, developerId: devId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to assign developer");
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                assignedDeveloperId: devId,
                assignedDeveloperName: devName,
                assignedDeveloperEmail: devEmail,
                assignedAt: new Date().toISOString(),
              }
            : o
        )
      );

      setAssigningDevOrderId(null);
      alert(oldDevId ? `Project successfully transferred to ${devName}!` : `Project assigned to ${devName}!`);
    } catch (e: any) {
      console.error("Failed to assign developer:", e);
      alert(e.message || "Failed to assign developer");
    } finally {
      setAssigningDevLoading(false);
    }
  };

  const handleDeployStagingAndRequestFinal = async () => {
    if (!stagingModalOrder || !stagingInputUrl.trim()) {
      alert("Please provide a valid Staging Demo URL");
      return;
    }
    setDeployingStaging(true);
    try {
      const orderId = stagingModalOrder.id;
      const stagingUrl = stagingInputUrl.trim();
      const token = await user?.getIdToken();

      const res = await fetch("/api/admin/orders/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          status: "awaiting_final_payment",
          statusCaption: "Work Completed — Staging Ready for Client Review 🚀",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update staging deployment");
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, stagingUrl, status: "awaiting_final_payment" } : o))
      );

      setStagingModalOrder(null);
      setStagingInputUrl("");
      alert("Staging link attached and final payment requested from client!");
    } catch (e: any) {
      console.error("Failed to deploy staging:", e);
      alert(e.message || "Failed to update order with staging link");
    } finally {
      setDeployingStaging(false);
    }
  };

  const handleCompleteHandover = async () => {
    if (!handoverModalOrder) return;
    setCompletingHandover(true);
    try {
      const orderId = handoverModalOrder.id;
      const token = await user?.getIdToken();

      const res = await fetch("/api/admin/orders/verify-final", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to complete handover");
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                finalPaid: true,
                status: "completed",
                handoverLinks: {
                  githubRepo: handoverForm.githubRepo.trim() || null,
                  liveUrl: handoverForm.liveUrl.trim() || null,
                  driveZip: handoverForm.driveZip.trim() || null,
                },
                handoverNotes: handoverForm.handoverNotes.trim() || null,
              }
            : o
        )
      );

      setHandoverModalOrder(null);
      setHandoverForm({ githubRepo: "", liveUrl: "", driveZip: "", handoverNotes: "" });
      alert("Project marked completed and handover assets unlocked for client!");
    } catch (e: any) {
      console.error("Failed to complete handover:", e);
      alert(e.message || "Failed to complete project handover");
    } finally {
      setCompletingHandover(false);
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
        senderDesignation: profile?.designation || null,
        senderDepartment: profile?.department || null,
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
      const token = await user?.getIdToken();
      const res = await fetch(`/api/admin/projects?id=${projectId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete project");
      }

      setDbProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to delete project");
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
        title: projectForm.title.trim(),
        category: projectForm.status || "Web Application",
        description: projectForm.description.trim(),
        client: projectForm.websiteLink.trim(),
      };

      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(projectData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to add project");
      }

      setDbProjects((prev) => [
        ...prev,
        { id: data.id, ...projectData },
      ]);
      setProjectForm(emptyProject);
      setShowAddModal(false);
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to add project");
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
          { id: "offers",        label: "Offers & Deals",   icon: Tag,           show: canDo("cms") || canDo("offers") },
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
        // Category counts
        const countAll = orders.length;
        const countPending = orders.filter((o: any) => o.status === "pending_payment" || o.status === "awaiting_verification" || o.status === "awaiting_advance").length;
        const countInProgress = orders.filter((o: any) => o.status === "in_progress" || o.status === "testing" || o.status === "staging_deployed").length;
        const countAwaitingFinal = orders.filter((o: any) => o.status === "awaiting_final_payment").length;
        const countCompleted = orders.filter((o: any) => o.status === "completed").length;
        const countCancelled = orders.filter((o: any) => o.status === "rejected" || o.status === "cancelled").length;

        // Package Tier counts
        const countEssential = orders.filter((o: any) => o.planName?.toLowerCase().includes("essential")).length;
        const countProfessional = orders.filter((o: any) => o.planName?.toLowerCase().includes("professional")).length;
        const countEnterprise = orders.filter((o: any) => o.planName?.toLowerCase().includes("enterprise")).length;

        const filteredOrders = orders.filter((o: any) => {
          // 1. Search Query
          if (q) {
            const matchSearch =
              o.planName?.toLowerCase().includes(q) ||
              o.userEmail?.toLowerCase().includes(q) ||
              o.email?.toLowerCase().includes(q) ||
              o.userId?.toLowerCase().includes(q) ||
              o.utrNumber?.toLowerCase().includes(q) ||
              o.status?.toLowerCase().includes(q) ||
              o.assignedDeveloperName?.toLowerCase().includes(q) ||
              o.assignedDeveloperEmail?.toLowerCase().includes(q);
            if (!matchSearch) return false;
          }

          // 2. Category / Status Tab
          if (orderCategoryTab === "pending") {
            if (!(o.status === "pending_payment" || o.status === "awaiting_verification" || o.status === "awaiting_advance")) return false;
          } else if (orderCategoryTab === "in_progress") {
            if (!(o.status === "in_progress" || o.status === "testing" || o.status === "staging_deployed")) return false;
          } else if (orderCategoryTab === "awaiting_final") {
            if (o.status !== "awaiting_final_payment") return false;
          } else if (orderCategoryTab === "completed") {
            if (o.status !== "completed") return false;
          } else if (orderCategoryTab === "cancelled") {
            if (!(o.status === "rejected" || o.status === "cancelled")) return false;
          }

          // 3. Package Scope / Tier Filter
          if (orderPlanFilter === "essential") {
            if (!o.planName?.toLowerCase().includes("essential")) return false;
          } else if (orderPlanFilter === "professional") {
            if (!o.planName?.toLowerCase().includes("professional")) return false;
          } else if (orderPlanFilter === "enterprise") {
            if (!o.planName?.toLowerCase().includes("enterprise")) return false;
          }

          // 4. Developer Filter
          if (orderDevFilter === "unassigned") {
            if (o.assignedDeveloperId) return false;
          } else if (orderDevFilter !== "all") {
            if (o.assignedDeveloperId !== orderDevFilter) return false;
          }

          return true;
        });

        // Developer list for assignment dropdown
        const availableDevelopers = users.filter(
          (u: any) => u.role === "developer" && (u.activeProjectCount || 0) < (u.maxProjects || 5)
        );
        const allDevelopers = users.filter((u: any) => u.role === "developer");
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

              {/* ── Payment Settings & Gateway Switcher ── */}
              <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <IndianRupee className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        Payment Gateway & Verification Mode
                      </h2>
                      <p className="text-xs text-zinc-500">
                        Toggle between zero-credential Manual UPI/QR Verification or automated Paytm API Gateway
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider border ${
                      paymentMode === "manual"
                        ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                        : "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                    }`}
                  >
                    {paymentMode === "manual" ? "Manual QR / UPI Mode Active" : "Paytm API Gateway Active"}
                  </span>
                </div>

                {/* Gateway Mode Switcher */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMode("manual")}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      paymentMode === "manual"
                        ? "bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5"
                        : "bg-white/[0.02] border-white/5 hover:border-white/15"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Option 1: Manual QR / UPI (Zero Creds)
                      </span>
                      {paymentMode === "manual" && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                    </div>
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                      Clients scan your UPI QR code or pay to your UPI ID and enter their 12-digit UTR reference ID. You verify and activate the project with 1 click. Ready for Netlify/Vercel right now!
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode("paytm")}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      paymentMode === "paytm"
                        ? "bg-indigo-500/10 border-indigo-500/40 shadow-lg shadow-indigo-500/5"
                        : "bg-white/[0.02] border-white/5 hover:border-white/15"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Option 2: Automated Paytm Gateway API
                      </span>
                      {paymentMode === "paytm" && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                    </div>
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                      Automated checkout redirect using Paytm for Business credentials (<code className="text-[11px] text-indigo-300 font-mono">PAYTM_MID</code> & <code className="text-[11px] text-indigo-300 font-mono">PAYTM_MERCHANT_KEY</code>). Instant callback verification.
                    </p>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-white/5">
                  <div>
                    <label className={labelClasses}>
                      UPI ID <span className="text-indigo-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. paytmqr281005050101y218u1d161d0@paytm"
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>
                      UPI Beneficiary / Business Name
                    </label>
                    <input
                      type="text"
                      value={upiName}
                      onChange={(e) => setUpiName(e.target.value)}
                      placeholder="e.g. Runix Web Technologies"
                      className={inputClasses}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClasses}>
                      UPI Phone Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={upiNumber}
                      onChange={(e) => setUpiNumber(e.target.value)}
                      placeholder="9876543210"
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>
                      Custom QR Code Image URL (Optional)
                    </label>
                    <input
                      type="text"
                      value={qrCodeUrl}
                      onChange={(e) => setQrCodeUrl(e.target.value)}
                      placeholder="Leave blank for auto dynamic UPI QR code"
                      className={inputClasses}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClasses}>
                    Payment Instructions for Clients
                  </label>
                  <textarea
                    rows={2}
                    value={paymentInstructions}
                    onChange={(e) => setPaymentInstructions(e.target.value)}
                    placeholder="Instructions displayed in checkout..."
                    className={inputClasses}
                  />
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-white/5">
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
                        <Save className="w-4 h-4" /> Save Payment Configuration
                      </span>
                    )}
                  </Button>
                  {paymentSaved && (
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
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === "users" && (
            <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl p-6 space-y-6">
              <h2 className="text-lg font-semibold text-white">
                Personnel Directory
              </h2>
              <div className="space-y-4">
                {filteredUsers.map((u) => {
                  const userOrders = orders.filter((o) => o.userId === u.id);
                  return (
                    <div key={u.id} className="p-5 border border-white/5 rounded-2xl bg-black/40">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-lg font-bold text-zinc-400">
                            {(u.displayName || u.name || "U")[0].toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-white font-medium text-base flex items-center gap-2">
                              {u.displayName || u.name || "Unknown User"}
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  u.role === "super_admin"
                                    ? "bg-amber-500/20 text-amber-400"
                                    : u.role === "admin"
                                    ? "bg-indigo-500/20 text-indigo-400"
                                    : "bg-white/10 text-zinc-400"
                                }`}
                              >
                                {u.role || "user"}
                              </span>
                            </h3>
                                {(u.designation || u.department) && (
                                  <div className="flex items-center gap-2 mt-1.5 mb-1">
                                    {u.designation && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                        {u.designation}
                                      </span>
                                    )}
                                    {u.department && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        {u.department}
                                      </span>
                                    )}
                                  </div>
                                )}
                                <p className="text-sm text-zinc-500 mt-0.5">{u.email}</p>
                                <p className="text-[10px] text-zinc-600 font-mono mt-0.5">ID: {u.id}</p>
                              </div>
                            </div>
                          </div>

                      {/* User's Projects / Orders */}
                      {userOrders.length > 0 ? (
                        <div className="mt-4 pt-4 border-t border-white/5">
                          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-3">
                            Associated Projects & Orders
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {userOrders.map((o) => (
                              <div key={o.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex justify-between items-center">
                                <div>
                                  <p className="text-xs font-semibold text-white">{o.planName}</p>
                                  <p className="text-[10px] text-zinc-500 mt-0.5">
                                    {o.createdAt?.toDate?.() ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(o.createdAt.toDate()) : "Recent"}
                                  </p>
                                </div>
                                <span
                                  className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                    o.status === "completed"
                                      ? "bg-emerald-500/10 text-emerald-400"
                                      : o.status === "in_progress"
                                      ? "bg-blue-500/10 text-blue-400"
                                      : "bg-zinc-500/10 text-zinc-400"
                                  }`}
                                >
                                  {o.status?.replace(/_/g, " ")}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 pt-4 border-t border-white/5">
                          <p className="text-[11px] text-zinc-600 italic">No projects or orders associated with this user.</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ORDERS TAB (With Approval, Query & Categorized Classification) */}
          {activeTab === "orders" && (
            <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Platform Orders & Payment Approvals
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Classified pipeline for milestone payments, active developer assignments, and client handovers
                  </p>
                </div>
                <span className="text-xs text-zinc-400 bg-white/5 px-3 py-1 rounded-full border border-white/10 self-start sm:self-auto">
                  {globalSearch || orderCategoryTab !== "all" || orderDevFilter !== "all"
                    ? `${filteredOrders.length} of ${orders.length}`
                    : `Total: ${orders.length}`}
                </span>
              </div>

              {/* ── Order Categories, Package Tiers & Developer Filter Bar ── */}
              <div className="flex flex-col gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                {/* Row 1: Status Classification Pills & Developer Dropdown */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Status Classification Pills */}
                  <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-wrap">
                    {[
                      { id: "all", label: "All Orders", count: countAll, icon: ShoppingCart, color: "text-zinc-400" },
                      { id: "pending", label: "Awaiting Advance", count: countPending, icon: Clock, color: "text-amber-400" },
                      { id: "in_progress", label: "In Development", count: countInProgress, icon: FolderKanban, color: "text-blue-400" },
                      { id: "awaiting_final", label: "Awaiting Final 50%", count: countAwaitingFinal, icon: IndianRupee, color: "text-purple-400" },
                      { id: "completed", label: "Completed", count: countCompleted, icon: CheckCircle2, color: "text-emerald-400" },
                      { id: "cancelled", label: "Cancelled", count: countCancelled, icon: XCircle, color: "text-red-400" },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setOrderCategoryTab(cat.id as any)}
                        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border whitespace-nowrap shrink-0 ${
                          orderCategoryTab === cat.id
                            ? "bg-white/10 text-white border-white/20 shadow-md"
                            : "bg-white/[0.02] text-zinc-500 border-white/5 hover:text-zinc-300 hover:bg-white/[0.05]"
                        }`}
                      >
                        <cat.icon className={`w-3.5 h-3.5 ${orderCategoryTab === cat.id ? "text-white" : cat.color}`} />
                        <span>{cat.label}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                            orderCategoryTab === cat.id
                              ? "bg-white/20 text-white"
                              : "bg-white/5 text-zinc-400"
                          }`}
                        >
                          {cat.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Developer Filter Dropdown */}
                  <div className="flex items-center gap-2 shrink-0 self-start lg:self-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-white/5 w-full lg:w-auto justify-end">
                    <Code2 className="w-3.5 h-3.5 text-zinc-500" />
                    <select
                      value={orderDevFilter}
                      onChange={(e) => setOrderDevFilter(e.target.value)}
                      className="bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer max-w-full"
                    >
                      <option value="all">Filter: All Developers</option>
                      <option value="unassigned">Filter: Unassigned Only</option>
                      {allDevelopers.map((dev: any) => (
                        <option key={dev.id} value={dev.id}>
                          Dev: {dev.name || dev.email} ({dev.activeProjectCount || 0}/5)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: 3 Package Scope Sections / Plan Tier Classification */}
                <div className="flex items-center gap-2 pt-2.5 border-t border-white/5 flex-wrap">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider mr-1">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" /> Package Tier:
                  </span>
                  {[
                    { id: "all", label: "All Plans", count: countAll, badge: "All Tiers" },
                    { id: "essential", label: "Essential", count: countEssential, badge: "₹3,999 • 3-5d" },
                    { id: "professional", label: "Professional", count: countProfessional, badge: "₹9,999 • 7-10d" },
                    { id: "enterprise", label: "Enterprise MVP", count: countEnterprise, badge: "₹24,999 • 14-21d" },
                  ].map((tier) => (
                    <button
                      key={tier.id}
                      onClick={() => setOrderPlanFilter(tier.id as any)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                        orderPlanFilter === tier.id
                          ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm"
                          : "bg-white/[0.02] text-zinc-400 border-white/5 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <span>{tier.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                          orderPlanFilter === tier.id
                            ? "bg-indigo-500/30 text-indigo-200 font-bold"
                            : "bg-white/5 text-zinc-500"
                        }`}
                      >
                        {tier.count}
                      </span>
                      <span className="text-[9px] text-zinc-500 font-mono hidden sm:inline">
                        ({tier.badge})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {filteredOrders.length === 0 && (
                  <div className="text-center py-16 text-zinc-500 bg-white/[0.01] border border-white/5 rounded-2xl space-y-2">
                    <p className="text-sm font-semibold text-zinc-400">No orders match this category filter.</p>
                    <p className="text-xs text-zinc-600">Try selecting "All Orders" or clearing your search query.</p>
                  </div>
                )}
                {filteredOrders.map((o) => {
                  const advanceAmount = o.advancePrice || (o.totalPrice ? Math.round(o.totalPrice * 0.5) : o.price ? Math.round(o.price * 0.5) : 0);
                  const finalAmount = o.finalPrice || (o.totalPrice ? o.totalPrice - advanceAmount : o.price ? o.price - advanceAmount : 0);
                  const isAdvancePaid = o.advancePaid || o.status === "in_progress" || o.status === "awaiting_final_payment" || o.status === "completed";
                  const isFinalPaid = o.finalPaid || o.status === "completed";

                  return (
                    <div
                      key={o.id}
                      className="p-5 border border-white/10 rounded-2xl bg-black/50 space-y-4"
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-base font-bold text-white">
                              {o.planName}
                            </h3>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                o.status === "completed"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : o.status === "awaiting_final_payment"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : o.status === "in_progress"
                                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                  : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              }`}
                            >
                              {o.status?.replace(/_/g, " ")}
                            </span>
                            {o.status === "awaiting_verification" && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                                Awaiting UTR Verification
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 mt-1">
                            Client: <span className="text-white font-medium">{o.userEmail || o.email}</span>
                          </p>

                          {o.utrNumber && (
                            <div className="flex items-center gap-2 mt-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 w-fit">
                              <span className="text-[10px] uppercase font-bold text-amber-400 font-mono tracking-wider">
                                UTR / Ref:
                              </span>
                              <span className="text-xs font-mono font-bold text-white tracking-wider">
                                {o.utrNumber}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(o.utrNumber);
                                  alert(`Copied UTR "${o.utrNumber}" to clipboard`);
                                }}
                                className="text-[10px] text-amber-300 hover:text-white underline cursor-pointer ml-1"
                              >
                                Copy
                              </button>
                            </div>
                          )}

                          {/* Assigned Developer Badge & Assignment Controls (Dynamic & Manual) */}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {o.assignedDeveloperId ? (
                              <span className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-medium">
                                <Code2 className="w-3 h-3" />
                                Dev: {o.assignedDeveloperName || o.assignedDeveloperEmail}
                                {o.assignmentMode && (
                                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono uppercase ${
                                    o.assignmentMode === "dynamic" ? "bg-amber-500/20 text-amber-300" : "bg-indigo-500/20 text-indigo-300"
                                  }`}>
                                    {o.assignmentMode}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-zinc-800 text-zinc-500 border border-zinc-700">
                                <Code2 className="w-3 h-3" /> No Dev Assigned
                              </span>
                            )}

                            {/* Dynamic Auto-Assign Button */}
                            {!o.assignedDeveloperId && (
                              <button
                                disabled={assigningDevLoading}
                                onClick={() => handleAutoAssignDeveloper(o.id, o)}
                                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer font-medium"
                                title="Auto-assign to the least loaded available developer (< 5 active projects)"
                              >
                                <Sparkles className="w-3 h-3 text-amber-400" />
                                Auto-Assign
                              </button>
                            )}

                            {/* Manual Assign / Reassign Dropdown */}
                            <div className="relative">
                              <button
                                onClick={() => setAssigningDevOrderId(assigningDevOrderId === o.id ? null : o.id)}
                                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors cursor-pointer font-medium"
                              >
                                <UserCheck className="w-3 h-3" />
                                {o.assignedDeveloperId ? "Transfer / Reassign" : "Manual Assign"}
                                <ChevronDown className="w-3 h-3" />
                              </button>

                              {assigningDevOrderId === o.id && (
                                <div className="absolute top-full left-0 mt-1 z-40 w-72 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                                  <div className="p-2 border-b border-white/5">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold px-2 py-1">
                                      Available Developers ({availableDevelopers.length})
                                    </p>
                                  </div>
                                  <div className="max-h-48 overflow-y-auto">
                                    {availableDevelopers.length === 0 && (
                                      <p className="text-xs text-zinc-500 p-3 text-center">
                                        No developers available. All at max capacity or none promoted yet.
                                      </p>
                                    )}
                                    {availableDevelopers.map((dev: any) => (
                                      <button
                                        key={dev.id}
                                        disabled={assigningDevLoading}
                                        onClick={() => handleAssignDeveloper(o.id, dev.id, dev.name || dev.email, dev.email, o)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-colors border-b border-white/[0.03] last:border-0 ${
                                          o.assignedDeveloperId === dev.id ? "bg-indigo-500/10" : ""
                                        }`}
                                      >
                                        <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px] font-bold text-cyan-300 shrink-0">
                                          {(dev.name || dev.email || "D")[0].toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs text-white font-medium truncate">{dev.name || "Unnamed"}</p>
                                          <p className="text-[10px] text-zinc-500 truncate">{dev.email}</p>
                                        </div>
                                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                                          (dev.activeProjectCount || 0) >= 4
                                            ? "text-amber-400 border-amber-500/20 bg-amber-500/10"
                                            : "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                                        }`}>
                                          {dev.activeProjectCount || 0}/{dev.maxProjects || 5}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                  <button
                                    onClick={() => setAssigningDevOrderId(null)}
                                    className="w-full text-center text-[10px] text-zinc-500 hover:text-white py-2 border-t border-white/5 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Maintenance Coverage & Maintenance Developer Controls */}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {o.maintenanceActive ? (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/30 font-medium">
                                  <Wrench className="w-3 h-3 text-purple-400" />
                                  Maint: {o.maintenanceAssignedDevName || "Unassigned"}
                                  {o.maintenanceExpiresAt && (
                                    <span className="text-[9px] text-zinc-400 font-mono">
                                      (Exp: {new Date(o.maintenanceExpiresAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })})
                                    </span>
                                  )}
                                </span>

                                {/* Manual Assign Maintenance Dev Dropdown */}
                                <div className="relative">
                                  <button
                                    onClick={() =>
                                      setAssigningMaintDevOrderId(
                                        assigningMaintDevOrderId === o.id ? null : o.id
                                      )
                                    }
                                    className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 transition-colors cursor-pointer font-medium"
                                  >
                                    <UserCheck className="w-3 h-3" />
                                    Assign Maint Dev
                                    <ChevronDown className="w-3 h-3" />
                                  </button>

                                  {assigningMaintDevOrderId === o.id && (
                                    <div className="absolute top-full left-0 mt-1 z-40 w-72 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                                      <div className="p-2 border-b border-white/5">
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold px-2 py-1">
                                          Assign Maintenance Engineer
                                        </p>
                                      </div>
                                      <div className="max-h-48 overflow-y-auto">
                                        {allDevelopers.map((dev: any) => (
                                          <button
                                            key={dev.id}
                                            disabled={assigningMaintLoading}
                                            onClick={() =>
                                              handleAssignMaintenanceDeveloper(
                                                o.id,
                                                dev.id,
                                                dev.name || dev.email,
                                                dev.email,
                                                o
                                              )
                                            }
                                            className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-white/5 transition-colors border-b border-white/[0.03] last:border-0 ${
                                              o.maintenanceAssignedDevId === dev.id
                                                ? "bg-purple-500/10"
                                                : ""
                                            }`}
                                          >
                                            <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px] font-bold text-purple-300 shrink-0">
                                              {(dev.name || dev.email || "D")[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs text-white font-medium truncate">
                                                {dev.name || "Unnamed"}
                                              </p>
                                              <p className="text-[10px] text-zinc-500 truncate">
                                                {dev.email}
                                              </p>
                                            </div>
                                          </button>
                                        ))}
                                      </div>
                                      <button
                                        onClick={() => setAssigningMaintDevOrderId(null)}
                                        className="w-full text-center text-[10px] text-zinc-500 hover:text-white py-1.5 border-t border-white/5 transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : o.status === "completed" ? (
                              <button
                                onClick={() => handleGrantMaintenanceCoverage(o)}
                                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 transition-colors cursor-pointer font-medium"
                              >
                                <Sparkles className="w-3 h-3 text-purple-400" />
                                Grant 30-Day Maintenance
                              </button>
                            ) : null}
                          </div>

                          {/* 50/50 Split Summary Chips */}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-300 font-mono">
                              Total: ₹{(o.totalPrice || o.price || 0).toLocaleString()}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded font-mono border ${
                                isAdvancePaid
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
                              }`}
                            >
                              Advance (50%): ₹{advanceAmount.toLocaleString()} {isAdvancePaid ? "✓ Paid" : "• Due"}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded font-mono border ${
                                isFinalPaid
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-purple-500/10 text-purple-300 border-purple-500/20"
                              }`}
                            >
                              Final (50%): ₹{finalAmount.toLocaleString()} {isFinalPaid ? "✓ Settled" : "• Due at Handover"}
                            </span>

                            {(o.formData || o.details) && (
                              <button
                                onClick={() =>
                                  setExpandedOrderDetails(
                                    expandedOrderDetails === o.id ? null : o.id
                                  )
                                }
                                className="text-[11px] text-indigo-300 hover:text-indigo-200 transition-colors ml-2 cursor-pointer"
                              >
                                {expandedOrderDetails === o.id
                                  ? "Hide Requirements"
                                  : "View Requirements"}
                              </button>
                            )}
                          </div>

                          {/* Staging URL Link if present */}
                          {o.stagingUrl && (
                            <div className="mt-2 text-xs text-zinc-400 flex items-center gap-1.5">
                              <span className="text-purple-400 font-semibold">Staging Demo:</span>
                              <a
                                href={o.stagingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-300 underline hover:text-white"
                              >
                                {o.stagingUrl}
                              </a>
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
                            ₹{(o.totalPrice || o.price || 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {o.createdAt?._seconds
                              ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(o.createdAt._seconds * 1000))
                              : o.createdAt?.seconds
                              ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(o.createdAt.seconds * 1000))
                              : typeof o.createdAt === "string"
                              ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(o.createdAt))
                              : "Recent"}
                          </p>
                        </div>
                      </div>

                      {/* Milestone Actions & Query Bar */}
                      <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* 1. Advance Verification Button */}
                          {!isAdvancePaid && o.status !== "rejected" && (
                            <button
                              onClick={() => handleVerifyAdvance(o.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all cursor-pointer shadow-md"
                            >
                              <Check className="w-3.5 h-3.5" /> Verify 50% Advance
                            </button>
                          )}

                          {/* 2. Deploy Staging & Request Final 50% */}
                          {o.status === "in_progress" && (
                            <button
                              onClick={() => {
                                setStagingModalOrder(o);
                                setStagingInputUrl(o.stagingUrl || "");
                              }}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition-all cursor-pointer shadow-md"
                            >
                              <Globe className="w-3.5 h-3.5" /> Deploy Staging & Request Final 50%
                            </button>
                          )}

                          {/* 3. Verify Final 50% & Complete Handover */}
                          {o.status === "awaiting_final_payment" && (
                            <button
                              onClick={() => {
                                setHandoverModalOrder(o);
                                setHandoverForm({
                                  githubRepo: o.handoverLinks?.githubRepo || "",
                                  liveUrl: o.handoverLinks?.liveUrl || "",
                                  driveZip: o.handoverLinks?.driveZip || "",
                                  handoverNotes: o.handoverNotes || "",
                                });
                              }}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all cursor-pointer shadow-md"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Complete Handover & Verify Final
                            </button>
                          )}

                          {/* Ask Query Button */}
                          <button
                            onClick={() => {
                              setQueryOrder(o);
                              setQueryText(o.adminQuery || "");
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            {o.adminQuery ? "Edit Query" : "Ask Query"}
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
                          className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
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
                            currentUserDesignation={profile?.designation}
                            currentUserDepartment={profile?.department}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}

                {orders.length === 0 && (
                  <div className="text-center py-10 text-zinc-500">
                    No orders found.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* OFFERS & DEALS TAB */}
          {activeTab === "offers" && (
            <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl p-6 space-y-6">
              {/* Header with CTA */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Promotional Offers & Deals</h2>
                    <p className="text-xs text-zinc-500">
                      Create, time-limit, target, and broadcast exclusive platform deals to clients
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setOfferForm(defaultOfferForm);
                    setShowAddOfferModal(true);
                  }}
                  variant="accent"
                  size="sm"
                  className="rounded-xl flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Create New Offer
                </Button>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.02] border border-white/10 rounded-xl">
                <Search className="w-4 h-4 text-zinc-500 shrink-0" />
                <input
                  type="text"
                  value={offerSearch}
                  onChange={(e) => setOfferSearch(e.target.value)}
                  placeholder="Search offers by title, promo code, discount tag, or target user..."
                  className="flex-1 bg-transparent text-xs text-white placeholder:text-zinc-600 outline-none"
                />
                {offerSearch && (
                  <button onClick={() => setOfferSearch("")} className="text-zinc-500 hover:text-white cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Offers List */}
              <div className="space-y-4">
                {(() => {
                  const q = offerSearch.toLowerCase().trim();
                  const filteredOffers = offers.filter((o) => {
                    if (!q) return true;
                    return (
                      o.title?.toLowerCase().includes(q) ||
                      o.description?.toLowerCase().includes(q) ||
                      o.promoCode?.toLowerCase().includes(q) ||
                      o.discountBadge?.toLowerCase().includes(q) ||
                      o.targetEmail?.toLowerCase().includes(q)
                    );
                  });

                  if (filteredOffers.length === 0) {
                    return (
                      <div className="text-center py-12 text-zinc-500 text-xs italic bg-black/20 rounded-xl border border-white/5">
                        No promotional offers found. Click &quot;Create New Offer&quot; to launch a new deal!
                      </div>
                    );
                  }

                  const now = Date.now();
                  const uniqueFilteredOffers = dedupeById(filteredOffers);

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {uniqueFilteredOffers.map((offer, idx) => {
                        const start = new Date(offer.startDate).getTime();
                        const end = new Date(offer.endDate).getTime();
                        const isScheduled = now < start;
                        const isExpired = now > end;

                        return (
                          <div
                            key={offer.id || `offer-${idx}`}
                            className={`rounded-2xl border p-5 transition-all flex flex-col justify-between space-y-4 ${
                              !offer.isActive
                                ? "bg-zinc-950/40 border-white/5 opacity-60"
                                : isExpired
                                ? "bg-red-950/10 border-red-500/20"
                                : "bg-black/40 border-white/10 hover:border-indigo-500/30"
                            }`}
                          >
                            <div className="space-y-3">
                              {/* Header & Badges */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  {offer.discountBadge && (
                                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold uppercase tracking-wider">
                                      {offer.discountBadge}
                                    </span>
                                  )}
                                  {offer.targetType === "broadcast" ? (
                                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold">
                                      📢 Broadcast (All)
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-bold">
                                      👤 {offer.targetEmail || offer.targetUserId || "Individual User"}
                                    </span>
                                  )}
                                </div>

                                {/* Status Tag */}
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    !offer.isActive
                                      ? "bg-zinc-800 text-zinc-400"
                                      : isExpired
                                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                      : isScheduled
                                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  }`}
                                >
                                  {!offer.isActive
                                    ? "Disabled"
                                    : isExpired
                                    ? "Expired"
                                    : isScheduled
                                    ? "Scheduled"
                                    : "Active Live"}
                                </span>
                              </div>

                              {/* Image Preview if provided */}
                              {offer.imageUrl && (
                                <div className="w-full h-32 rounded-xl overflow-hidden bg-black/60 border border-white/5 relative">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={offer.imageUrl}
                                    alt={offer.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}

                              {/* Title & Description */}
                              <div>
                                <h3 className="text-base font-bold text-white leading-snug">{offer.title}</h3>
                                <p className="text-xs text-zinc-400 mt-1 line-clamp-3 leading-relaxed">
                                  {offer.description}
                                </p>
                              </div>

                              {/* Promo Code & Time Window */}
                              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                                {offer.promoCode && (
                                  <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between">
                                    <span className="text-zinc-500 font-mono">CODE:</span>
                                    <span className="text-white font-mono font-bold">{offer.promoCode}</span>
                                  </div>
                                )}
                                <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5 flex flex-col justify-center">
                                  <span className="text-[10px] text-zinc-500">Ends:</span>
                                  <span className="text-zinc-300 font-medium truncate">
                                    {new Date(offer.endDate).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Actions Toolbar */}
                            <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                              <button
                                onClick={() => handleToggleOfferStatus(offer.id, offer.isActive, offer.title)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                  offer.isActive
                                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                                    : "bg-zinc-800 text-zinc-400 border-white/10 hover:bg-zinc-700"
                                }`}
                              >
                                {offer.isActive ? (
                                  <>
                                    <ToggleRight className="w-4 h-4 text-emerald-400" /> Active
                                  </>
                                ) : (
                                  <>
                                    <ToggleLeft className="w-4 h-4" /> Disabled
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => handleDeleteOffer(offer.id, offer.title)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* ── COUPONS & DISCOUNT CODES SUB-SECTION ── */}
              <div className="mt-8 pt-8 border-t border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <Percent className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Coupons & Discount Codes</h2>
                      <p className="text-xs text-zinc-500">
                        Create discount codes with usage limits, plan targeting, and auto-banner visibility
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setCouponForm(defaultCouponForm);
                      setShowAddCouponModal(true);
                    }}
                    variant="accent"
                    size="sm"
                    className="rounded-xl flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Create Coupon Code
                  </Button>
                </div>

                {/* Coupon Search */}
                <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.02] border border-white/10 rounded-xl mb-4">
                  <Search className="w-4 h-4 text-zinc-500 shrink-0" />
                  <input
                    type="text"
                    value={couponSearch}
                    onChange={(e) => setCouponSearch(e.target.value)}
                    placeholder="Search coupons by code, type, or plan..."
                    className="flex-1 bg-transparent text-xs text-white placeholder:text-zinc-600 outline-none"
                  />
                  {couponSearch && (
                    <button onClick={() => setCouponSearch("")} className="text-zinc-500 hover:text-white cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Coupon List */}
                <div className="space-y-4">
                  {(() => {
                    const cq = couponSearch.toLowerCase().trim();
                    const filteredCoupons = dedupeById(coupons).filter((c) => {
                      if (!cq) return true;
                      return (
                        c.code?.toLowerCase().includes(cq) ||
                        c.type?.toLowerCase().includes(cq) ||
                        c.applicablePlans?.join(",").toLowerCase().includes(cq)
                      );
                    });

                    if (filteredCoupons.length === 0) {
                      return (
                        <div className="text-center py-12 text-zinc-500 text-xs italic bg-black/20 rounded-xl border border-white/5">
                          No coupon codes found. Click &quot;Create Coupon Code&quot; to launch a new discount!
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredCoupons.map((coupon, idx) => {
                          const now = Date.now();
                          const start = new Date(coupon.startDate).getTime();
                          const end = new Date(coupon.endDate).getTime();
                          const isExpired = now > end;
                          const isScheduled = now < start;
                          const usagePercent = coupon.usageLimit > 0
                            ? Math.min(100, Math.round(((coupon.usedCount || 0) / coupon.usageLimit) * 100))
                            : 0;
                          const isExhausted = coupon.usageLimit > 0 && (coupon.usedCount || 0) >= coupon.usageLimit;

                          return (
                            <div
                              key={coupon.id || `coupon-${idx}`}
                              className={`rounded-2xl border p-5 transition-all flex flex-col justify-between space-y-4 ${
                                !coupon.isActive || isExhausted
                                  ? "bg-zinc-950/40 border-white/5 opacity-60"
                                  : isExpired
                                  ? "bg-red-950/10 border-red-500/20"
                                  : "bg-black/40 border-white/10 hover:border-emerald-500/30"
                              }`}
                            >
                              <div className="space-y-3">
                                {/* Code Badge & Status */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-extrabold text-sm tracking-wider border border-emerald-500/30">
                                      {coupon.code}
                                    </span>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(coupon.code);
                                        alert("Coupon code copied!");
                                      }}
                                      className="p-1 rounded-md hover:bg-white/10 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                                      title="Copy code"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                      !coupon.isActive
                                        ? "bg-zinc-800 text-zinc-400"
                                        : isExhausted
                                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                        : isExpired
                                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                        : isScheduled
                                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                    }`}
                                  >
                                    {!coupon.isActive
                                      ? "Disabled"
                                      : isExhausted
                                      ? "Exhausted"
                                      : isExpired
                                      ? "Expired"
                                      : isScheduled
                                      ? "Scheduled"
                                      : "Active"}
                                  </span>
                                </div>

                                {/* Discount Description */}
                                <div className="text-sm font-bold text-white">
                                  {coupon.type === "percentage" ? (
                                    <>
                                      {coupon.value}% OFF
                                      {coupon.maxDiscount > 0 && (
                                        <span className="text-xs text-zinc-400 font-normal ml-1">
                                          (up to ₹{coupon.maxDiscount.toLocaleString()})
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <>₹{coupon.value.toLocaleString()} Flat OFF</>
                                  )}
                                </div>

                                {/* Usage Meter */}
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-zinc-500">
                                      {coupon.usedCount || 0} / {coupon.usageLimit > 0 ? coupon.usageLimit : "∞"} redeemed
                                    </span>
                                    {coupon.usageLimit > 0 && (
                                      <span className="text-zinc-400 font-mono">{usagePercent}%</span>
                                    )}
                                  </div>
                                  {coupon.usageLimit > 0 && (
                                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all ${
                                          usagePercent >= 100
                                            ? "bg-red-500"
                                            : usagePercent >= 75
                                            ? "bg-amber-500"
                                            : "bg-emerald-500"
                                        }`}
                                        style={{ width: `${usagePercent}%` }}
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* Scope & Target Meta Info */}
                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                  <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                                    <span className="text-zinc-500 block text-[10px] uppercase tracking-wider font-semibold">Scope:</span>
                                    <span className="text-zinc-300 font-medium truncate block">
                                      {coupon.scope === "maintenance"
                                        ? "Maintenance Retainer"
                                        : coupon.scope === "addons"
                                        ? coupon.applicableAddons?.includes("all")
                                          ? "All Add-ons"
                                          : `Add-ons (${coupon.applicableAddons?.length || 0})`
                                        : coupon.scope === "plans"
                                        ? coupon.applicablePlans?.includes("all")
                                          ? "All Plans"
                                          : `Plans (${coupon.applicablePlans?.length || 0})`
                                        : "Universal (All)"}
                                    </span>
                                  </div>
                                  <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                                    <span className="text-zinc-500 block text-[10px] uppercase tracking-wider font-semibold">Valid Until:</span>
                                    <span className="text-zinc-300 font-medium">
                                      {new Date(coupon.endDate).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </span>
                                  </div>
                                </div>

                                {/* Min Order & Banner Indicators */}
                                <div className="flex flex-wrap gap-2 text-[10px]">
                                  {coupon.scope && (
                                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-zinc-300 border border-white/10 font-mono">
                                      {coupon.scope.toUpperCase()}
                                    </span>
                                  )}
                                  {coupon.minOrderValue > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/5">
                                      Min ₹{coupon.minOrderValue.toLocaleString()}
                                    </span>
                                  )}
                                  {coupon.showAsBanner && (
                                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
                                      <Sparkles className="w-3 h-3 text-indigo-400" /> Auto-Banner
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                                <button
                                  onClick={() => handleToggleCouponStatus(coupon.id, coupon.isActive, coupon.code)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                    coupon.isActive
                                      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                                      : "bg-zinc-800 text-zinc-400 border-white/10 hover:bg-zinc-700"
                                  }`}
                                >
                                  {coupon.isActive ? (
                                    <>
                                      <ToggleRight className="w-4 h-4 text-emerald-400" /> Active
                                    </>
                                  ) : (
                                    <>
                                      <ToggleLeft className="w-4 h-4" /> Disabled
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB (Broadcast & Individual with Search, Image Support & Deletion) */}
          {activeTab === "notifications" && (
            <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl p-6 space-y-8">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Notification Control Center
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Dispatch broadcast alerts, send targeted personal messages with images, and manage past dispatches
                  </p>
                </div>
              </div>

              {/* Notification Creation Form */}
              <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-indigo-400" /> Send New Notification
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Audience selector */}
                  <div className="md:col-span-2">
                    <label className={labelClasses}>
                      Target Audience <span className="text-indigo-400">*</span>
                    </label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setNotifTargetType("broadcast")}
                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          notifTargetType === "broadcast"
                            ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50"
                            : "bg-white/[0.02] text-zinc-400 border-white/10"
                        }`}
                      >
                        📢 Broadcast to All Users
                      </button>
                      <button
                        onClick={() => setNotifTargetType("user")}
                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
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
                    <div className="md:col-span-2">
                      <label className={labelClasses}>Select Target User <span className="text-indigo-400">*</span></label>
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

                  {/* Title */}
                  <div className="md:col-span-2">
                    <label className={labelClasses}>
                      Notification Title <span className="text-indigo-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      placeholder="e.g. Platform Launch Discount / Maintenance Update"
                      className={inputClasses}
                    />
                  </div>

                  {/* Message Body */}
                  <div className="md:col-span-2">
                    <label className={labelClasses}>
                      Message Body <span className="text-indigo-400">*</span>
                    </label>
                    <textarea
                      value={notifMessage}
                      onChange={(e) => setNotifMessage(e.target.value)}
                      rows={3}
                      placeholder="Enter the notification message details..."
                      className={`${inputClasses} resize-none`}
                    />
                  </div>

                  {/* Optional Image URL */}
                  <div>
                    <label className={labelClasses}>
                      Banner / Graphic Image URL <span className="text-zinc-500">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={notifImageUrl}
                      onChange={(e) => setNotifImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className={inputClasses}
                    />
                  </div>

                  {/* Action Link & Text */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelClasses}>Action Link <span className="text-zinc-500">(Optional)</span></label>
                      <input
                        type="text"
                        value={notifActionLink}
                        onChange={(e) => setNotifActionLink(e.target.value)}
                        placeholder="/dashboard/offers"
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Button Text</label>
                      <input
                        type="text"
                        value={notifActionText}
                        onChange={(e) => setNotifActionText(e.target.value)}
                        placeholder="View Offer"
                        className={inputClasses}
                      />
                    </div>
                  </div>

                  {/* Image Live Preview */}
                  {notifImageUrl.trim() && (
                    <div className="md:col-span-2 p-3 bg-black/60 rounded-xl border border-white/10 space-y-2">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                        Attached Image Preview:
                      </span>
                      <div className="h-28 w-full max-w-sm rounded-lg overflow-hidden border border-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={notifImageUrl}
                          alt="Notification Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80";
                          }}
                        />
                      </div>
                    </div>
                  )}
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
                      <CheckCircle2 className="w-4 h-4" /> Notification Sent & Synced!
                    </motion.span>
                  )}
                </div>
              </div>

              {/* Notification History with Sub-Tabs & Search */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Subtabs: Broadcasted vs Individual */}
                  <div className="flex items-center gap-2 p-1 rounded-xl bg-white/[0.03] border border-white/10 w-fit">
                    <button
                      onClick={() => setNotifSubTab("broadcast")}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        notifSubTab === "broadcast"
                          ? "bg-indigo-500 text-white shadow-md"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      📢 Broadcasted ({notifications.filter((n) => n.targetType === "broadcast").length})
                    </button>
                    <button
                      onClick={() => setNotifSubTab("individual")}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        notifSubTab === "individual"
                          ? "bg-indigo-500 text-white shadow-md"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      👤 Individual ({notifications.filter((n) => n.targetType !== "broadcast").length})
                    </button>
                  </div>

                  {/* Search Bar for Subtab */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/10 rounded-xl sm:w-72">
                    <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <input
                      type="text"
                      value={notifSearch}
                      onChange={(e) => setNotifSearch(e.target.value)}
                      placeholder={`Search ${notifSubTab} notifications...`}
                      className="flex-1 bg-transparent text-xs text-white placeholder:text-zinc-600 outline-none"
                    />
                    {notifSearch && (
                      <button onClick={() => setNotifSearch("")} className="text-zinc-500 hover:text-white cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Subtab Notifications List */}
                <div className="space-y-3">
                  {(() => {
                    const q = notifSearch.toLowerCase().trim();
                    const subList = notifications.filter((n) => {
                      if (notifSubTab === "broadcast") {
                        if (n.targetType !== "broadcast") return false;
                      } else {
                        if (n.targetType === "broadcast") return false;
                      }

                      if (!q) return true;
                      return (
                        n.title?.toLowerCase().includes(q) ||
                        n.message?.toLowerCase().includes(q) ||
                        n.targetUserId?.toLowerCase().includes(q) ||
                        n.targetEmail?.toLowerCase().includes(q) ||
                        n.senderName?.toLowerCase().includes(q)
                      );
                    });

                    if (subList.length === 0) {
                      return (
                        <div className="text-center py-10 text-zinc-500 text-xs italic bg-black/20 rounded-xl border border-white/5">
                          No {notifSubTab} notifications found.
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 gap-3">
                        {subList.map((n) => (
                          <div
                            key={n.id}
                            className="p-4 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <h4 className="text-sm font-semibold text-white">{n.title}</h4>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                      n.targetType === "broadcast"
                                        ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    }`}
                                  >
                                    {n.targetType === "broadcast"
                                      ? "Broadcast"
                                      : `To: ${n.targetEmail || n.targetUserId || "User"}`}
                                  </span>
                                </div>
                                <p className="text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed">
                                  {n.message}
                                </p>
                              </div>

                              <span className="text-[10px] text-zinc-500 shrink-0 font-mono">
                                {n.createdAt?._seconds
                                  ? new Intl.DateTimeFormat("en", {
                                      dateStyle: "medium",
                                      timeStyle: "short",
                                    }).format(new Date(n.createdAt._seconds * 1000))
                                  : n.createdAt?.seconds
                                  ? new Intl.DateTimeFormat("en", {
                                      dateStyle: "medium",
                                      timeStyle: "short",
                                    }).format(new Date(n.createdAt.seconds * 1000))
                                  : typeof n.createdAt === "string"
                                  ? new Intl.DateTimeFormat("en", {
                                      dateStyle: "medium",
                                      timeStyle: "short",
                                    }).format(new Date(n.createdAt))
                                  : "Recent"}
                              </span>
                            </div>

                            {/* Attached Image and/or Action link */}
                            {(n.imageUrl || n.actionLink) && (
                              <div className="flex flex-wrap items-center gap-3 pt-2">
                                {n.imageUrl && (
                                  <div className="w-24 h-16 rounded-lg overflow-hidden bg-black/60 border border-white/10 shrink-0">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={n.imageUrl} alt={n.title} className="w-full h-full object-cover" />
                                  </div>
                                )}
                                {n.actionLink && (
                                  <div className="text-xs">
                                    <span className="text-zinc-500 mr-1.5">Action:</span>
                                    <span className="text-indigo-400 font-mono font-medium">
                                      {n.actionLink} ({n.actionText || "View"})
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Footer: Admin sender & Delete action */}
                            <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px]">
                              <span className="text-zinc-500">
                                Sender:{" "}
                                <span className="text-zinc-300 font-medium">
                                  {n.senderName || n.senderEmail || "Admin"}
                                  {n.senderDesignation ? ` (${n.senderDesignation})` : ""}
                                </span>
                              </span>

                              <button
                                onClick={() => handleDeleteNotification(n.id, n.title)}
                                className="flex items-center gap-1 text-red-400 hover:text-red-300 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
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

              {/* Promote user to admin or developer */}
              <div className="border border-white/5 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <UserCog className="w-4 h-4 text-indigo-400" /> Promote / Demote Users
                </h3>
                <p className="text-[11px] text-zinc-500">Assign roles: <span className="text-zinc-400">User</span> → <span className="text-cyan-400">Developer</span> → <span className="text-indigo-400">Admin</span></p>
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
                            u.role === "admin" ? "text-indigo-400 border-indigo-500/30 bg-indigo-500/10"
                            : u.role === "developer" ? "text-cyan-400 border-cyan-500/30 bg-cyan-500/10"
                            : "text-zinc-400 border-zinc-700 bg-white/[0.02]"
                          }`}>{u.role || "user"}</span>

                          {/* Role cycle buttons */}
                          {u.role !== "developer" && (
                            <button
                              disabled={promotingUser === u.id}
                              onClick={async () => {
                                setPromotingUser(u.id);
                                try {
                                  const token = await user?.getIdToken();
                                  const res = await fetch("/api/admin/users", {
                                    method: "PUT",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({ targetUserId: u.id, role: "developer" }),
                                  });
                                  const data = await res.json();
                                  if (!res.ok || !data.success) throw new Error(data.error);
                                  setUsers((prev: any[]) => prev.map((x: any) => x.id === u.id ? { ...x, role: "developer", activeProjectCount: u.activeProjectCount || 0, maxProjects: u.maxProjects || 5 } : x));
                                } catch (e: any) { alert(e.message || "Failed to update role"); }
                                finally { setPromotingUser(null); }
                              }}
                              className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 cursor-pointer"
                            >
                              {promotingUser === u.id ? "Saving…" : "Make Developer"}
                            </button>
                          )}

                          <button
                            disabled={promotingUser === u.id}
                            onClick={async () => {
                              setPromotingUser(u.id);
                              const newRole = u.role === "admin" ? "user" : u.role === "developer" ? "user" : "admin";
                              try {
                                const token = await user?.getIdToken();
                                const res = await fetch("/api/admin/users", {
                                  method: "PUT",
                                  headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`,
                                  },
                                  body: JSON.stringify({ targetUserId: u.id, role: newRole }),
                                });
                                const data = await res.json();
                                if (!res.ok || !data.success) throw new Error(data.error);
                                setUsers((prev: any[]) => prev.map((x: any) => x.id === u.id ? { ...x, role: newRole } : x));
                              } catch (e: any) { alert(e.message || "Failed to update role"); }
                              finally { setPromotingUser(null); }
                            }}
                            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
                              u.role === "admin" || u.role === "developer"
                                ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                                : "border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
                            }`}
                          >
                            {promotingUser === u.id ? "Saving…" : (u.role === "admin" || u.role === "developer") ? "Demote to User" : "Promote to Admin"}
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
                        
                        {/* Designation and Department Inputs */}
                        <div className="flex gap-2 mt-4 pt-3 border-t border-white/5">
                          <input 
                            type="text" 
                            defaultValue={admin.designation || ""} 
                            placeholder="Designation (e.g. Lead Developer)"
                            className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                            onBlur={async (e) => {
                              const newVal = e.target.value;
                              if(newVal !== admin.designation) {
                                setSavingPermissions(admin.id);
                                try {
                                  await updateDoc(doc(db, "users", admin.id), { designation: newVal });
                                  setUsers((prev: any[]) => prev.map((u: any) => u.id === admin.id ? { ...u, designation: newVal } : u));
                                  logAdminAction({ adminId: user?.uid || "", adminName: user?.displayName || profile?.name || "Admin", adminEmail: user?.email || "", action: "UPDATED_ADMIN_DESIGNATION", details: { targetAdminId: admin.id, designation: newVal } });
                                } catch { alert("Failed to update designation"); }
                                finally { setSavingPermissions(null); }
                              }
                            }}
                          />
                          <input 
                            type="text" 
                            defaultValue={admin.department || ""} 
                            placeholder="Department (e.g. Engineering)"
                            className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                            onBlur={async (e) => {
                              const newVal = e.target.value;
                              if(newVal !== admin.department) {
                                setSavingPermissions(admin.id);
                                try {
                                  await updateDoc(doc(db, "users", admin.id), { department: newVal });
                                  setUsers((prev: any[]) => prev.map((u: any) => u.id === admin.id ? { ...u, department: newVal } : u));
                                  logAdminAction({ adminId: user?.uid || "", adminName: user?.displayName || profile?.name || "Admin", adminEmail: user?.email || "", action: "UPDATED_ADMIN_DEPARTMENT", details: { targetAdminId: admin.id, department: newVal } });
                                } catch { alert("Failed to update department"); }
                                finally { setSavingPermissions(null); }
                              }
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                {users.filter((u: any) => u.role === "admin").length === 0 && (
                  <p className="text-sm text-zinc-500 text-center py-4">No admins yet. Promote a user above first.</p>
                )}
              </div>

              {/* Developer Workload Overview */}
              <div className="border border-white/5 rounded-xl p-4 space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-cyan-400" /> Developer Workload Overview
                </h3>
                <p className="text-xs text-zinc-500">
                  Monitor each developer's capacity. Max 5 active projects per developer.
                </p>
                {allDevelopers.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-4">No developers yet. Promote a user to Developer above.</p>
                ) : (
                  <div className="space-y-3">
                    {allDevelopers.map((dev: any) => {
                      const activeCount = dev.activeProjectCount || 0;
                      const maxCount = dev.maxProjects || 5;
                      const pct = Math.round((activeCount / maxCount) * 100);
                      const devOrders = orders.filter((o: any) => o.assignedDeveloperId === dev.id && o.status !== "completed");
                      return (
                        <div key={dev.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-300">
                                {(dev.name || dev.email || "D")[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-white">{dev.name || "Unnamed"}</p>
                                <p className="text-[11px] text-zinc-500">{dev.email}{dev.designation ? ` • ${dev.designation}` : ""}</p>
                              </div>
                            </div>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                              activeCount >= maxCount
                                ? "text-red-400 border-red-500/30 bg-red-500/10"
                                : activeCount >= 4
                                ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                                : "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                            }`}>
                              {activeCount} / {maxCount} Active
                            </span>
                          </div>
                          {/* Capacity Bar */}
                          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-cyan-500"
                              }`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          {/* Assigned Projects List */}
                          {devOrders.length > 0 && (
                            <div className="space-y-1">
                              {devOrders.map((o: any) => (
                                <div key={o.id} className="flex items-center justify-between text-[11px] px-2 py-1 rounded bg-white/[0.02] border border-white/[0.03]">
                                  <span className="text-zinc-300 truncate">{o.planName}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                                    o.status === "in_progress" ? "text-blue-400 bg-blue-500/10" 
                                    : o.status === "awaiting_final_payment" ? "text-amber-400 bg-amber-500/10"
                                    : "text-purple-400 bg-purple-500/10"
                                  }`}>{o.status?.replace(/_/g, " ")}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {devOrders.length === 0 && (
                            <p className="text-[11px] text-zinc-600 italic">No active projects assigned</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
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

      {/* ── Create Offer Modal ── */}
      <AnimatePresence>
        {showAddOfferModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
              onClick={() => setShowAddOfferModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            >
              <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl p-6 sm:p-8 relative shadow-2xl my-8">
                <button
                  onClick={() => setShowAddOfferModal(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Create New Promotional Offer</h3>
                    <p className="text-xs text-zinc-500">
                      Configure terms, discount tags, expiration window, and automatic notification dispatch
                    </p>
                  </div>
                </div>

                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                  {/* Audience Target Type */}
                  <div>
                    <label className={labelClasses}>Target Audience <span className="text-indigo-400">*</span></label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setOfferForm({ ...offerForm, targetType: "broadcast", targetUserId: "", targetEmail: "" })}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          offerForm.targetType === "broadcast"
                            ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50"
                            : "bg-white/[0.02] text-zinc-400 border-white/10"
                        }`}
                      >
                        📢 Broadcast to All Users
                      </button>
                      <button
                        type="button"
                        onClick={() => setOfferForm({ ...offerForm, targetType: "user" })}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          offerForm.targetType === "user"
                            ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50"
                            : "bg-white/[0.02] text-zinc-400 border-white/10"
                        }`}
                      >
                        👤 Individual User Deal
                      </button>
                    </div>
                  </div>

                  {/* Target User select if user */}
                  {offerForm.targetType === "user" && (
                    <div>
                      <label className={labelClasses}>Select Target User <span className="text-indigo-400">*</span></label>
                      <select
                        value={offerForm.targetUserId}
                        onChange={(e) => {
                          const u = users.find((usr) => usr.id === e.target.value || usr.uid === e.target.value);
                          setOfferForm({
                            ...offerForm,
                            targetUserId: e.target.value,
                            targetEmail: u?.email || "",
                          });
                        }}
                        className="w-full bg-[#161618] border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer shadow-lg"
                      >
                        <option value="" disabled className="bg-[#161618] text-zinc-400">
                          Select a user...
                        </option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id} className="bg-[#161618] text-white">
                            {u.displayName || u.name || u.email} ({u.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Offer Title */}
                  <div>
                    <label className={labelClasses}>Offer Title <span className="text-indigo-400">*</span></label>
                    <input
                      type="text"
                      value={offerForm.title}
                      onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                      placeholder="e.g. Independence Day Special — 30% OFF All Tiers"
                      className={inputClasses}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className={labelClasses}>Offer Description & Terms <span className="text-indigo-400">*</span></label>
                    <textarea
                      value={offerForm.description}
                      onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                      rows={3}
                      placeholder="e.g. Get 30% off any web development or dashboard package when starting your project this week."
                      className={`${inputClasses} resize-none`}
                    />
                  </div>

                  {/* Discount Badge & Promo Code */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClasses}>Discount Badge Tag</label>
                      <input
                        type="text"
                        value={offerForm.discountBadge}
                        onChange={(e) => setOfferForm({ ...offerForm, discountBadge: e.target.value })}
                        placeholder="e.g. 30% OFF or FLAT ₹5,000 OFF"
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Promo Code</label>
                      <input
                        type="text"
                        value={offerForm.promoCode}
                        onChange={(e) => setOfferForm({ ...offerForm, promoCode: e.target.value.toUpperCase() })}
                        placeholder="e.g. RUNIX30"
                        className={inputClasses}
                      />
                    </div>
                  </div>

                  {/* Image URL & Preview */}
                  <div>
                    <label className={labelClasses}>Banner Image URL <span className="text-zinc-500">(Optional)</span></label>
                    <input
                      type="text"
                      value={offerForm.imageUrl}
                      onChange={(e) => setOfferForm({ ...offerForm, imageUrl: e.target.value })}
                      placeholder="https://images.unsplash.com/photo-..."
                      className={inputClasses}
                    />
                    {offerForm.imageUrl.trim() && (
                      <div className="mt-2 h-28 w-full rounded-xl overflow-hidden bg-black border border-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={offerForm.imageUrl}
                          alt="Offer Banner Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80";
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Action CTA link & Button Text */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClasses}>Action CTA Link</label>
                      <input
                        type="text"
                        value={offerForm.actionLink}
                        onChange={(e) => setOfferForm({ ...offerForm, actionLink: e.target.value })}
                        placeholder="/dashboard"
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Button Text</label>
                      <input
                        type="text"
                        value={offerForm.buttonText}
                        onChange={(e) => setOfferForm({ ...offerForm, buttonText: e.target.value })}
                        placeholder="Claim Offer Now"
                        className={inputClasses}
                      />
                    </div>
                  </div>

                  {/* Time Window Settings: Start & End Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClasses}>Offer Starting Date & Time <span className="text-indigo-400">*</span></label>
                      <input
                        type="datetime-local"
                        value={offerForm.startDate}
                        onChange={(e) => setOfferForm({ ...offerForm, startDate: e.target.value })}
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Offer Ending Date & Time <span className="text-indigo-400">*</span></label>
                      <input
                        type="datetime-local"
                        value={offerForm.endDate}
                        onChange={(e) => setOfferForm({ ...offerForm, endDate: e.target.value })}
                        className={inputClasses}
                      />
                    </div>
                  </div>

                  {/* Automatic Notification Option */}
                  <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="sendNotificationCheck"
                      checked={offerForm.sendNotification}
                      onChange={(e) => setOfferForm({ ...offerForm, sendNotification: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded border-white/20 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="sendNotificationCheck" className="text-xs text-indigo-200 cursor-pointer">
                      <span className="font-bold text-white block">Automatically push notification to users</span>
                      Dispatch a notification with the offer image, description, and link to the recipient(s) immediately upon publishing.
                    </label>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-white/5">
                  <Button
                    onClick={() => setShowAddOfferModal(false)}
                    variant="ghost"
                    size="sm"
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveOffer}
                    variant="accent"
                    size="sm"
                    className="rounded-xl"
                    disabled={isSubmittingOffer}
                  >
                    {isSubmittingOffer ? (
                      "Publishing..."
                    ) : (
                      <span className="flex items-center gap-2">
                        <Tag className="w-4 h-4" /> Publish & Push Offer
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* ── Create Coupon Modal ── */}
        {showAddCouponModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
              onClick={() => setShowAddCouponModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            >
              <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl p-6 sm:p-8 relative shadow-2xl my-8">
                <button
                  onClick={() => setShowAddCouponModal(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Percent className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Create New Coupon / Discount Code</h3>
                    <p className="text-xs text-zinc-500">
                      Configure promo codes with percentage or flat discounts, usage limits, and plan targeting
                    </p>
                  </div>
                </div>

                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                  {/* Coupon Code */}
                  <div>
                    <label className={labelClasses}>
                      Coupon Code <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={couponForm.code}
                      onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. LAUNCH50, FLAT500, SUMMER25"
                      className={`${inputClasses} uppercase font-mono font-bold tracking-wider`}
                    />
                  </div>

                  {/* Discount Type: Percentage vs Flat */}
                  <div>
                    <label className={labelClasses}>
                      Discount Type <span className="text-emerald-400">*</span>
                    </label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setCouponForm({ ...couponForm, type: "percentage" })}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          couponForm.type === "percentage"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                            : "bg-white/[0.02] text-zinc-400 border-white/10"
                        }`}
                      >
                        % Percentage Discount
                      </button>
                      <button
                        type="button"
                        onClick={() => setCouponForm({ ...couponForm, type: "flat" })}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          couponForm.type === "flat"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                            : "bg-white/[0.02] text-zinc-400 border-white/10"
                        }`}
                      >
                        ₹ Flat Amount Discount
                      </button>
                    </div>
                  </div>

                  {/* Discount Value & Max Cap */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClasses}>
                        {couponForm.type === "percentage" ? "Discount Percentage (%)" : "Discount Amount (₹)"}{" "}
                        <span className="text-emerald-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={couponForm.type === "percentage" ? 100 : undefined}
                        value={couponForm.value || ""}
                        onChange={(e) => setCouponForm({ ...couponForm, value: Number(e.target.value) })}
                        placeholder={couponForm.type === "percentage" ? "e.g. 25" : "e.g. 1000"}
                        className={inputClasses}
                      />
                    </div>
                    {couponForm.type === "percentage" ? (
                      <div>
                        <label className={labelClasses}>
                          Max Discount Cap (₹) <span className="text-zinc-500">(0 = No Cap)</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={couponForm.maxDiscount || ""}
                          onChange={(e) => setCouponForm({ ...couponForm, maxDiscount: Number(e.target.value) })}
                          placeholder="e.g. 2500"
                          className={inputClasses}
                        />
                      </div>
                    ) : (
                      <div>
                        <label className={labelClasses}>
                          Minimum Order Total (₹) <span className="text-zinc-500">(0 = No Min)</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={couponForm.minOrderValue || ""}
                          onChange={(e) => setCouponForm({ ...couponForm, minOrderValue: Number(e.target.value) })}
                          placeholder="e.g. 5000"
                          className={inputClasses}
                        />
                      </div>
                    )}
                  </div>

                  {/* Min Order Value for percentage */}
                  {couponForm.type === "percentage" && (
                    <div>
                      <label className={labelClasses}>
                        Minimum Order Total (₹) <span className="text-zinc-500">(0 = No Min)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={couponForm.minOrderValue || ""}
                        onChange={(e) => setCouponForm({ ...couponForm, minOrderValue: Number(e.target.value) })}
                        placeholder="e.g. 3999"
                        className={inputClasses}
                      />
                    </div>
                  )}

                  {/* Discount Scope Selector */}
                  <div>
                    <label className={labelClasses}>
                      Discount Scope & Target <span className="text-emerald-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                      {[
                        { id: "all", label: "Universal (All)", icon: Globe },
                        { id: "plans", label: "Package Plans", icon: FolderKanban },
                        { id: "addons", label: "Add-ons & Boosters", icon: Sparkles },
                        { id: "maintenance", label: "Maintenance SLA", icon: Wrench },
                      ].map((sc) => {
                        const isSelected = couponForm.scope === sc.id;
                        const Icon = sc.icon;
                        return (
                          <button
                            key={sc.id}
                            type="button"
                            onClick={() => setCouponForm({ ...couponForm, scope: sc.id as any })}
                            className={`py-2.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              isSelected
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm"
                                : "bg-white/[0.02] text-zinc-400 border-white/10 hover:border-white/20"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{sc.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Sub-selectors based on scope */}
                    {couponForm.scope === "plans" && (
                      <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                        <span className="text-[11px] text-zinc-400 font-semibold block">Select Applicable Package Plans:</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { id: "all", label: "All Plans" },
                            { id: "essential", label: "Essential" },
                            { id: "professional", label: "Professional" },
                            { id: "enterprise", label: "Enterprise MVP" },
                          ].map((plan) => {
                            const isSelected = couponForm.applicablePlans.includes(plan.id);
                            return (
                              <button
                                key={plan.id}
                                type="button"
                                onClick={() => {
                                  if (plan.id === "all") {
                                    setCouponForm({ ...couponForm, applicablePlans: ["all"] });
                                  } else {
                                    let updated = couponForm.applicablePlans.filter((p) => p !== "all");
                                    if (updated.includes(plan.id)) {
                                      updated = updated.filter((p) => p !== plan.id);
                                      if (updated.length === 0) updated = ["all"];
                                    } else {
                                      updated.push(plan.id);
                                    }
                                    setCouponForm({ ...couponForm, applicablePlans: updated });
                                  }
                                }}
                                className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                    : "bg-white/[0.02] text-zinc-400 border-white/5 hover:border-white/15"
                                }`}
                              >
                                {plan.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {couponForm.scope === "addons" && (
                      <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                        <span className="text-[11px] text-zinc-400 font-semibold block">Select Applicable Add-ons & Boosters:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            { id: "all", label: "All Add-ons & Boosters" },
                            { id: "addon-express", label: "Express Delivery (48h)" },
                            { id: "addon-seo", label: "SEO & Schema Mastery" },
                            { id: "addon-cms", label: "Dynamic CMS Content Engine" },
                            { id: "addon-paytm", label: "Payment Gateway Setup" },
                          ].map((addon) => {
                            const isSelected = couponForm.applicableAddons.includes(addon.id);
                            return (
                              <button
                                key={addon.id}
                                type="button"
                                onClick={() => {
                                  if (addon.id === "all") {
                                    setCouponForm({ ...couponForm, applicableAddons: ["all"] });
                                  } else {
                                    let updated = couponForm.applicableAddons.filter((a) => a !== "all");
                                    if (updated.includes(addon.id)) {
                                      updated = updated.filter((a) => a !== addon.id);
                                      if (updated.length === 0) updated = ["all"];
                                    } else {
                                      updated.push(addon.id);
                                    }
                                    setCouponForm({ ...couponForm, applicableAddons: updated });
                                  }
                                }}
                                className={`py-1.5 px-3 rounded-lg text-xs font-semibold border text-left transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                    : "bg-white/[0.02] text-zinc-400 border-white/5 hover:border-white/15"
                                }`}
                              >
                                {addon.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {couponForm.scope === "maintenance" && (
                      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-purple-400 shrink-0" />
                        <span>This promo code applies directly to the standard ₹1,999/mo Website Maintenance & SLA Retainer subscription.</span>
                      </div>
                    )}
                  </div>

                  {/* Usage Limit (First-Come-First-Served) */}
                  <div>
                    <label className={labelClasses}>Usage Limit (First-Come-First-Served)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setCouponForm({ ...couponForm, usageLimitMode: "unlimited", usageLimit: 0 })}
                          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            couponForm.usageLimitMode === "unlimited"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                              : "bg-white/[0.02] text-zinc-400 border-white/10"
                          }`}
                        >
                          <Layers className="w-3.5 h-3.5" /> Unlimited Users
                        </button>
                        <button
                          type="button"
                          onClick={() => setCouponForm({ ...couponForm, usageLimitMode: "custom", usageLimit: couponForm.usageLimit || 10 })}
                          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            couponForm.usageLimitMode === "custom"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                              : "bg-white/[0.02] text-zinc-400 border-white/10"
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" /> Limited Spots
                        </button>
                      </div>
                      {couponForm.usageLimitMode === "custom" && (
                        <input
                          type="number"
                          min="1"
                          value={couponForm.usageLimit || ""}
                          onChange={(e) => setCouponForm({ ...couponForm, usageLimit: Number(e.target.value) })}
                          placeholder="e.g. 10 (first 10 users)"
                          className={inputClasses}
                        />
                      )}
                    </div>
                  </div>

                  {/* Auto-Banner Visibility */}
                  <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="showAsBannerCheck"
                        checked={couponForm.showAsBanner}
                        onChange={(e) => setCouponForm({ ...couponForm, showAsBanner: e.target.checked })}
                        className="mt-0.5 w-4 h-4 rounded border-white/20 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                      />
                      <label htmlFor="showAsBannerCheck" className="text-xs text-indigo-200 cursor-pointer">
                        <span className="font-bold text-white block">Auto-Show Promo Banner on Pricing Page</span>
                        Automatically highlights this coupon for eligible first-time and loyal clients on the pricing page.
                      </label>
                    </div>
                    {couponForm.showAsBanner && (
                      <input
                        type="text"
                        value={couponForm.bannerText}
                        onChange={(e) => setCouponForm({ ...couponForm, bannerText: e.target.value })}
                        placeholder="e.g. Special Launch Offer: Use code LAUNCH50 for 25% off!"
                        className={inputClasses}
                      />
                    )}
                  </div>

                  {/* Start & End Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClasses}>
                        Valid From <span className="text-emerald-400">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={couponForm.startDate}
                        onChange={(e) => setCouponForm({ ...couponForm, startDate: e.target.value })}
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>
                        Valid Until <span className="text-emerald-400">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={couponForm.endDate}
                        onChange={(e) => setCouponForm({ ...couponForm, endDate: e.target.value })}
                        className={inputClasses}
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-white/5">
                  <Button
                    onClick={() => setShowAddCouponModal(false)}
                    variant="ghost"
                    size="sm"
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateCoupon}
                    variant="accent"
                    size="sm"
                    className="rounded-xl"
                    disabled={isSubmittingCoupon}
                  >
                    {isSubmittingCoupon ? (
                      "Creating..."
                    ) : (
                      <span className="flex items-center gap-2">
                        <Percent className="w-4 h-4" /> Create Coupon Code
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* ── STAGING DEPLOYMENT MODAL ── */}
        {stagingModalOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
              onClick={() => setStagingModalOrder(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-[#111] border border-white/15 rounded-3xl w-full max-w-lg p-6 sm:p-8 relative shadow-2xl space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Deploy Staging Preview</h3>
                      <p className="text-xs text-zinc-400">{stagingModalOrder.planName} • {stagingModalOrder.userEmail}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setStagingModalOrder(null)}
                    className="text-zinc-500 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold text-zinc-300 block">
                    Staging Live Demo URL <span className="text-purple-400">*</span>
                  </label>
                  <input
                    type="url"
                    value={stagingInputUrl}
                    onChange={(e) => setStagingInputUrl(e.target.value)}
                    placeholder="https://staging.runixtech.com/demo-client-project"
                    className="w-full bg-[#18181b] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 font-mono"
                  />
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Attaching this URL updates the project status to <strong>Awaiting Final Payment</strong> and automatically notifies the client with a preview link and prompt to settle the remaining 50% milestone.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <Button
                    onClick={() => setStagingModalOrder(null)}
                    variant="ghost"
                    size="sm"
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeployStagingAndRequestFinal}
                    variant="accent"
                    size="sm"
                    disabled={deployingStaging}
                    className="rounded-xl bg-purple-600 hover:bg-purple-700"
                  >
                    {deployingStaging ? "Deploying..." : "Deploy Staging & Request 50% Final"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* ── FINAL HANDOVER MODAL ── */}
        {handoverModalOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
              onClick={() => setHandoverModalOrder(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-[#111] border border-white/15 rounded-3xl w-full max-w-lg p-6 sm:p-8 relative shadow-2xl space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Complete Handover & Release Assets</h3>
                      <p className="text-xs text-zinc-400">{handoverModalOrder.planName} • {handoverModalOrder.userEmail}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setHandoverModalOrder(null)}
                    className="text-zinc-500 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="text-zinc-300 font-semibold mb-1 block">Live Production URL</label>
                    <input
                      type="url"
                      value={handoverForm.liveUrl}
                      onChange={(e) => setHandoverForm({ ...handoverForm, liveUrl: e.target.value })}
                      placeholder="https://clientdomain.com"
                      className="w-full bg-[#18181b] border border-white/15 rounded-xl px-4 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-300 font-semibold mb-1 block">GitHub Repository Link</label>
                    <input
                      type="url"
                      value={handoverForm.githubRepo}
                      onChange={(e) => setHandoverForm({ ...handoverForm, githubRepo: e.target.value })}
                      placeholder="https://github.com/runix/client-repo"
                      className="w-full bg-[#18181b] border border-white/15 rounded-xl px-4 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-300 font-semibold mb-1 block">Source Code Download / Drive Zip Link</label>
                    <input
                      type="url"
                      value={handoverForm.driveZip}
                      onChange={(e) => setHandoverForm({ ...handoverForm, driveZip: e.target.value })}
                      placeholder="https://drive.google.com/file/d/..."
                      className="w-full bg-[#18181b] border border-white/15 rounded-xl px-4 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-300 font-semibold mb-1 block">Handover Notes & Deployment Instructions</label>
                    <textarea
                      rows={2}
                      value={handoverForm.handoverNotes}
                      onChange={(e) => setHandoverForm({ ...handoverForm, handoverNotes: e.target.value })}
                      placeholder="Deployment notes, admin logins, DNS records, or handover greetings..."
                      className="w-full bg-[#18181b] border border-white/15 rounded-xl px-4 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <Button
                    onClick={() => setHandoverModalOrder(null)}
                    variant="ghost"
                    size="sm"
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCompleteHandover}
                    variant="accent"
                    size="sm"
                    disabled={completingHandover}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold"
                  >
                    {completingHandover ? "Releasing..." : "Verify Final 50% & Release Assets"}
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
