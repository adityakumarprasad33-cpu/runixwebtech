"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ShieldAlert, Users, FolderKanban, ShoppingCart, ShieldCheck } from "lucide-react";
import { projects as defaultProjects } from "@/data/projects";

export default function AdminPanel() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<"users" | "cms" | "orders" | "logs">("cms");
  
  // Data States
  const [users, setUsers] = useState<any[]>([]);
  const [dbProjects, setDbProjects] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (profile?.role !== "admin") {
        router.push("/dashboard");
      } else {
        fetchData();
      }
    }
  }, [loading, profile, router]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      // Parallel fetch could fail if rules block, using try-catch for each
      const fetchCollection = async (col: string) => {
        try {
          const snap = await getDocs(collection(db, col));
          return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) {
          console.error(`Failed to fetch ${col}:`, e);
          return [];
        }
      };

      const [usersData, projectsData, ordersData, logsData] = await Promise.all([
        fetchCollection("users"),
        fetchCollection("projects"),
        fetchCollection("orders"),
        fetchCollection("login_logs")
      ]);

      setUsers(usersData);
      setDbProjects(projectsData);
      setOrders(ordersData);
      setLogs(logsData);
    } catch (err) {
      console.error(err);
    }
    setLoadingData(false);
  };

  const handleSeedProjects = async () => {
    if (!confirm("This will write the hardcoded projects to Firestore. Continue?")) return;
    try {
      for (const p of defaultProjects) {
        await setDoc(doc(db, "projects", p.slug), p);
      }
      alert("Projects seeded successfully!");
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Failed to seed projects");
    }
  };

  if (loading || profile?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4 border-b border-white/10 pb-6">
        <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-jakarta font-bold text-white">System Administration</h1>
          <p className="text-sm text-zinc-400">Full access control and content management</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-4">
        {[
          { id: "cms", label: "Content (CMS)", icon: FolderKanban },
          { id: "users", label: "Personnel", icon: Users },
          { id: "orders", label: "Orders", icon: ShoppingCart },
          { id: "logs", label: "Security Logs", icon: ShieldCheck }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.id ? "bg-indigo-500/20 text-indigo-300" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {loadingData ? (
        <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl p-6">
          
          {/* CMS TAB */}
          {activeTab === "cms" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white">Manage Projects & Work</h2>
                <div className="flex gap-2">
                  <button onClick={handleSeedProjects} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm transition-colors">
                    Seed Local Projects to DB
                  </button>
                  <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">
                    + Add New Project
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dbProjects.map((p) => (
                  <div key={p.id} className="p-4 border border-white/5 rounded-xl bg-black/40 flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-medium">{p.title}</h3>
                      <p className="text-xs text-zinc-500 mt-1">{p.slug}</p>
                    </div>
                    <div className="text-xs px-2 py-1 bg-white/10 rounded-md text-zinc-300">
                      {p.status}
                    </div>
                  </div>
                ))}
                {dbProjects.length === 0 && (
                  <div className="col-span-2 text-center py-10 text-zinc-500">
                    No projects found in database. Click "Seed Local Projects" to migrate.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Personnel Directory</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-zinc-500 border-b border-white/10">
                    <tr>
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Email</th>
                      <th className="pb-3 font-medium">Role</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map(u => (
                      <tr key={u.id} className="text-zinc-300">
                        <td className="py-4">{u.displayName || "Unknown"}</td>
                        <td className="py-4">{u.email}</td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-semibold ${u.role === "admin" ? "bg-indigo-500/20 text-indigo-400" : "bg-white/10 text-zinc-400"}`}>
                            {u.role || "user"}
                          </span>
                        </td>
                        <td className="py-4">
                          <button className="text-xs text-indigo-400 hover:text-indigo-300">Edit Role</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Platform Orders</h2>
              <div className="space-y-3">
                {orders.map(o => (
                  <div key={o.id} className="p-4 border border-white/5 rounded-xl bg-black/40 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-white">{o.planName} Plan</p>
                      <p className="text-xs text-zinc-500">{o.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">₹{o.price}</p>
                      <p className="text-xs text-zinc-500">{o.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LOGS TAB */}
          {activeTab === "logs" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Security & Login Logs</h2>
              <div className="space-y-3">
                {logs.map(l => (
                  <div key={l.id} className="p-4 border border-white/5 rounded-xl bg-black/40">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-mono text-indigo-400">{l.action?.toUpperCase()}</span>
                      <span className="text-xs text-zinc-500">{l.localTime}</span>
                    </div>
                    <p className="text-sm text-zinc-300 mb-1">{l.email}</p>
                    <p className="text-xs text-zinc-500">{l.city}, {l.country} &bull; {l.ip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
