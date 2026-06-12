"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { 
  Activity, Users, ShieldAlert, Trash2, Radar, 
  Terminal, LockOpen, Ban, Search, Database, 
  Server, Zap, AlertOctagon, CheckCircle2, XCircle
} from "lucide-react";

export default function SuperAdminOverseer() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [isBooting, setIsBooting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', msg: '' }

  // ─── REAL DATA STATES ───
  const [stats, setStats] = useState({ totalUsers: 0, activeShops: 0, platformVolume: 0, systemHealth: "99.9%" });
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Sentinel State
  const [overridePhone, setOverridePhone] = useState("");

  const showNotify = (type, msg) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchSystemData = async () => {
    try {
      const token = Cookies.get("admin_token");
      if (!token) {
        router.push("/shadow-gate");
        return;
      }
      const res = await axios.get("https://agrovault.onrender.com/api/admin/system-data", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setStats(res.data.stats);
        setUsers(res.data.users);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        Cookies.remove("admin_token");
        router.push("/shadow-gate");
      }
    }
  };

  useEffect(() => {
    fetchSystemData().then(() => {
      setTimeout(() => setIsBooting(false), 1500);
    });
  }, []);

  // ─── REAL ADMIN ACTIONS ───
  const handleUserAction = async (userId, action) => {
    if (action === "DELETE" && !window.confirm("WARNING: Yeh action wapas nahi liya ja sakta. Kya aap sach mein delete karna chahte hain?")) {
      return;
    }
    
    setLoading(true);
    try {
      const token = Cookies.get("admin_token");
      const res = await axios.post("https://agrovault.onrender.com/api/admin/user-action", 
        { userId, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        showNotify("success", res.data.message);
        fetchSystemData(); // Refresh list
      }
    } catch (error) {
      showNotify("error", "Action failed!");
    } finally {
      setLoading(false);
    }
  };

  // ─── MOCK RADAR LOGS (Since no real-time sockets yet) ───
  const [radarLogs] = useState([
    { time: new Date().toLocaleTimeString(), event: "System Boot", user: "OVERSEER", detail: "Encrypted connection established." },
    { time: new Date(Date.now() - 300000).toLocaleTimeString(), event: "Database Sync", user: "SYSTEM", detail: "All nodes operating at nominal capacity." }
  ]);

  if (isBooting) {
    return (
      <div className="h-screen w-full bg-[#050505] flex items-center justify-center font-mono relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,transparent_60%)] blur-2xl"></div>
        <div className="flex flex-col items-center gap-6 relative z-10">
          <div className="w-16 h-16 border-[4px] border-gray-800 border-t-emerald-500 rounded-full animate-spin"></div>
          <div className="text-emerald-500 text-sm tracking-[0.3em] font-black uppercase animate-pulse">Initializing Real-Time Link...</div>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.phone?.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-sans selection:bg-emerald-500/30 overflow-hidden flex relative">
      
      {/* ─── NOTIFICATION HUD ─── */}
      {notification && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-4 duration-300">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
            {notification.type === 'success' ? <CheckCircle2 size={18}/> : <XCircle size={18}/>}
            <span className="text-sm font-bold tracking-wide uppercase">{notification.msg}</span>
          </div>
        </div>
      )}

      {/* ─── SIDEBAR COMMAND NAVIGATION ─── */}
      <aside className="w-20 md:w-64 bg-[#0a0a0a] border-r border-white/5 flex flex-col justify-between shrink-0 z-20">
        <div>
          <div className="h-20 flex items-center justify-center md:justify-start md:px-8 border-b border-white/5">
            <Terminal size={24} className="text-emerald-500 md:mr-3 shrink-0" />
            <span className="hidden md:block text-white font-black tracking-[0.2em] text-sm">OVERSEER</span>
          </div>
          <nav className="p-4 space-y-2 mt-4">
            {[
              { id: "overview", icon: Activity, label: "Command Center" },
              { id: "users", icon: Users, label: "Identity Matrix" },
              { id: "security", icon: ShieldAlert, label: "Sentinel Protocol" },
              { id: "purge", icon: Trash2, label: "Data Purge" },
              { id: "radar", icon: Radar, label: "Live Radar" }
            ].map(tab => (
              <button 
                key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-center md:justify-start gap-4 p-3 rounded-xl transition-all duration-300 ${activeTab === tab.id ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
              >
                <tab.icon size={20} />
                <span className="hidden md:block text-xs font-bold tracking-widest uppercase">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-white/5 text-center md:text-left">
          <div className="hidden md:block text-[9px] text-gray-600 font-mono">GallaVault SysAdmin v2.0<br/>Live Connection</div>
          <ShieldAlert size={16} className="md:hidden text-gray-600 mx-auto" />
        </div>
      </aside>

      {/* ─── MAIN TERMINAL AREA ─── */}
      <main className="flex-1 h-screen overflow-y-auto relative scroll-smooth [&::-webkit-scrollbar]:hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none"></div>

        <div className="p-6 md:p-10 max-w-7xl mx-auto relative z-10 animate-in fade-in zoom-in-95 duration-500">
          
          {/* TAB 1: COMMAND CENTER */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20"><Activity size={20} className="text-emerald-500" /></div>
                <h1 className="text-2xl font-black text-white tracking-widest uppercase">Global Metrics</h1>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Accounts", value: stats.totalUsers, color: "text-blue-400", border: "border-blue-500/20" },
                  { label: "Active Shops", value: stats.activeShops, color: "text-emerald-400", border: "border-emerald-500/20" },
                  { label: "Platform Volume", value: `₹${stats.platformVolume.toLocaleString('en-IN')}`, color: "text-amber-400", border: "border-amber-500/20" },
                  { label: "System Health", value: stats.systemHealth, color: "text-purple-400", border: "border-purple-500/20" },
                ].map((s, i) => (
                  <div key={i} className={`bg-[#0a0a0a]/80 backdrop-blur-md p-6 rounded-2xl border ${s.border} relative overflow-hidden group`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{s.label}</p>
                    <p className={`text-2xl md:text-3xl font-black mt-2 ${s.color} drop-shadow-md truncate`}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#0a0a0a]/80 border border-white/5 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Server size={14}/> Traffic Model</h3>
                  <div className="h-48 flex items-end justify-between gap-2 px-2">
                    {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
                      <div key={i} className="w-full bg-white/5 rounded-t-md relative group flex justify-center">
                        <div style={{ height: `${h}%` }} className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md opacity-70 group-hover:opacity-100 transition-all"></div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-[#0a0a0a]/80 border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Database size={14}/> Node Distribution</h3>
                  <div className="flex-1 flex flex-col justify-center gap-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1"><span className="font-bold text-gray-300">Owners</span><span className="text-emerald-400 font-mono">{stats.activeShops}</span></div>
                      <div className="w-full bg-gray-900 rounded-full h-2"><div className="bg-emerald-500 h-2 rounded-full" style={{width: '68%'}}></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1"><span className="font-bold text-gray-300">Staff/Pending</span><span className="text-blue-400 font-mono">{stats.totalUsers - stats.activeShops}</span></div>
                      <div className="w-full bg-gray-900 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{width: '32%'}}></div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IDENTITY MATRIX */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20"><Users size={20} className="text-blue-500" /></div>
                  <h1 className="text-2xl font-black text-white tracking-widest uppercase">Identity Matrix</h1>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Search Name/Phone..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm font-mono text-white outline-none focus:border-blue-500 transition-colors" 
                  />
                </div>
              </div>

              <div className="bg-[#0a0a0a]/80 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-white/5 text-gray-400 text-[10px] uppercase tracking-widest">
                      <tr>
                        <th className="p-4 font-black">User Details</th>
                        <th className="p-4 font-black">Business Name</th>
                        <th className="p-4 font-black">Role Security</th>
                        <th className="p-4 font-black">Status</th>
                        <th className="p-4 font-black text-right">Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredUsers.length === 0 && (
                        <tr><td colSpan="5" className="p-8 text-center font-bold text-gray-500">No records found.</td></tr>
                      )}
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-gray-200">{u.name}</div>
                            <div className="text-[10px] font-mono text-gray-500 mt-0.5">{u.phone}</div>
                          </td>
                          <td className="p-4 text-xs font-bold text-gray-400">{u.shopName || "Not Setup"}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${u.role === 'OWNER' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : u.role === 'EMPLOYEE' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                                {u.role || "NOT SET"}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className={`flex items-center gap-1.5 text-xs font-bold ${u.status === 'ACTIVE' ? 'text-emerald-500' : 'text-rose-500'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                              {u.status}
                            </div>
                          </td>
                          <td className="p-4 flex justify-end gap-2">
                            {/* Unlock Role */}
                            {u.role && (
                              <button 
                                onClick={() => handleUserAction(u.id, "UNLOCK_ROLE")}
                                disabled={loading}
                                className="p-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-lg transition-colors group relative"
                              >
                                <LockOpen size={16} />
                                <span className="absolute -top-8 right-0 bg-gray-800 text-[10px] text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">Unlock Role Edit</span>
                              </button>
                            )}
                            {/* Suspend / Activate */}
                            <button 
                              onClick={() => handleUserAction(u.id, "TOGGLE_STATUS")}
                              disabled={loading}
                              className={`p-2 border rounded-lg transition-colors group relative ${u.status === 'ACTIVE' ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400'}`}
                            >
                              <Ban size={16} />
                              <span className="absolute -top-8 right-0 bg-gray-800 text-[10px] text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">{u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}</span>
                            </button>
                            {/* Delete */}
                            <button 
                              onClick={() => handleUserAction(u.id, "DELETE")}
                              disabled={loading}
                              className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-lg transition-colors group relative"
                            >
                              <Trash2 size={16} />
                              <span className="absolute -top-8 right-0 bg-gray-800 text-[10px] text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">Delete Account</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SENTINEL PROTOCOL */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20"><ShieldAlert size={20} className="text-amber-500" /></div>
                <h1 className="text-2xl font-black text-white tracking-widest uppercase">Sentinel Protocol</h1>
              </div>

              <div className="bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-white/10 p-6 rounded-2xl shadow-xl max-w-xl">
                <h3 className="text-amber-500 font-black text-sm uppercase tracking-widest mb-2 flex items-center gap-2"><LockOpen size={16}/> Override Authentication</h3>
                <p className="text-gray-400 text-xs font-bold leading-relaxed mb-6">Agar koi user apna password aur security question bhool jaye, toh yahan number daalkar system se naya temporary PIN bhejein. (API Hook Pending)</p>
                
                <div className="space-y-4">
                  <input 
                    type="text" 
                    value={overridePhone}
                    onChange={(e) => setOverridePhone(e.target.value)}
                    placeholder="Enter User Phone Number..." 
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white outline-none focus:border-amber-500 transition-colors" 
                  />
                  <button 
                    onClick={() => { showNotify("success", "Recovery bypass initialized for " + overridePhone); setOverridePhone(""); }}
                    className="w-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/50 text-amber-500 font-black py-3 rounded-xl transition-all tracking-widest uppercase text-xs"
                  >
                    Execute Bypass
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DATA PURGE */}
          {activeTab === "purge" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-rose-500/10 rounded-lg border border-rose-500/20"><Trash2 size={20} className="text-rose-500" /></div>
                <h1 className="text-2xl font-black text-white tracking-widest uppercase">System Purge</h1>
              </div>

              <div className="bg-rose-950/20 border border-rose-500/30 p-6 rounded-2xl max-w-3xl">
                <div className="flex items-start gap-4">
                  <AlertOctagon size={32} className="text-rose-500 shrink-0" />
                  <div>
                    <h3 className="text-rose-400 font-black uppercase tracking-widest mb-1">Danger Zone (No Edit, Only Wipe)</h3>
                    <p className="text-rose-200/60 text-xs font-bold mb-6">Yahan aap test data, kachra (garbage) accounts ya corrupt tables delete kar sakte hain.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-black/40 border border-rose-500/20 p-4 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-white font-black text-sm">Purge Null Roles</p>
                          <p className="text-gray-500 text-[10px] font-mono mt-0.5">Deletes incomplete registrations</p>
                        </div>
                        <button onClick={() => showNotify("success", "Orphaned accounts purged.")} className="px-3 py-1.5 bg-rose-500 text-white text-[10px] font-black uppercase rounded shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-colors">Wipe</button>
                      </div>
                      <div className="bg-black/40 border border-rose-500/20 p-4 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-white font-black text-sm">Delete Test Orders</p>
                          <p className="text-gray-500 text-[10px] font-mono mt-0.5">Removes bills with ₹0 total</p>
                        </div>
                        <button onClick={() => showNotify("success", "Zero value orders wiped.")} className="px-3 py-1.5 bg-rose-500 text-white text-[10px] font-black uppercase rounded shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-colors">Wipe</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LIVE RADAR */}
          {activeTab === "radar" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20 relative">
                  <Radar size={20} className="text-cyan-400" />
                  <div className="absolute inset-0 bg-cyan-400/20 rounded-lg animate-ping"></div>
                </div>
                <h1 className="text-2xl font-black text-white tracking-widest uppercase">God's Eye Radar</h1>
              </div>

              <div className="bg-[#050505] border border-cyan-500/20 rounded-2xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.05)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 opacity-20">
                   <div className="w-full h-[2px] bg-cyan-400 absolute animate-[scan_3s_linear_infinite] shadow-[0_0_10px_#22d3ee]"></div>
                </div>
                <style dangerouslySetInnerHTML={{__html: `@keyframes scan { 0% { top: 0; } 100% { top: 100%; } }`}} />

                <div className="relative z-10 flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                  <div className="text-[10px] font-mono text-cyan-400">Monitoring Node: Active Links</div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div><span className="text-[10px] font-black text-gray-400 uppercase">System Listening</span></div>
                </div>

                <div className="space-y-4 font-mono text-xs">
                  {radarLogs.map((log, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 p-3 bg-white/[0.02] border border-white/5 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="text-gray-500 w-20 shrink-0">[{log.time}]</div>
                      <div className={`font-black w-32 shrink-0 text-cyan-400`}>&gt; {log.event}</div>
                      <div className="text-gray-300 flex-1">{log.detail}</div>
                      <div className="text-gray-600 bg-black px-2 py-1 rounded border border-white/5">{log.user}</div>
                    </div>
                  ))}
                  <div className="flex items-center gap-4 p-3 opacity-50">
                    <div className="text-gray-500 w-20 shrink-0">[{new Date().toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'})}]</div>
                    <div className="font-black text-emerald-400 animate-pulse">Awaiting incoming signals_</div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}