"use client";
import "./globals.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { 
  LayoutDashboard, ReceiptText, NotebookTabs, Boxes, 
  Users, Bell, Search, Truck, PackagePlus, LogOut, 
  UserCircle, Store, Phone, X, Download, ShieldAlert, Settings, Info, AlertTriangle, CheckCircle2, ArrowLeft, ShieldCheck,
  Megaphone, Send, Clock, Activity 
} from "lucide-react";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  
const [userData, setUserData] = useState({ name: "User", shopName: "", phone: "", shopType: "", role: "", shopKey: "" });  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // ─── ADVANCED PROFILE STATES ───
  const [profileTab, setProfileTab] = useState("info"); // info, settings, danger
  const [activeSettingSection, setActiveSettingSection] = useState("general"); // NAYA: general, edit, security
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // NAYA: Delete confirmation box
  const [settingsData, setSettingsData] = useState({ role: "", securityQuestion: "", securityAnswer: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ show: false, type: "", message: "" });
  
  // ─── PWA INSTALL STATES ───
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // ─── LIVE FEED (NOTIFICATION) STATES & LOGIC ───
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [sendingNotif, setSendingNotif] = useState(false);

  const fetchNotifications = async () => {
    setLoadingNotifs(true);
    try {
      const token = Cookies.get("auth_token");
      const res = await axios.get("https://agrovault.onrender.com/api/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data.data || []);
    } catch (error) {
      console.error("Notif fetch error", error);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleBellClick = () => {
    if (!isNotifOpen) fetchNotifications();
    setIsNotifOpen(!isNotifOpen);
    setIsProfileOpen(false); // Bell khule toh profile band ho jaye
  };

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.trim()) return;
    setSendingNotif(true);
    try {
      const token = Cookies.get("auth_token");
      await axios.post("https://agrovault.onrender.com/api/notifications", {
        message: newAnnouncement,
        type: "ANNOUNCEMENT"
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setNewAnnouncement("");
      fetchNotifications(); // Turant list refresh karo
    } catch (error) {
      showPremiumAlert("error", "Message bhejne mein error aaya");
    } finally {
      setSendingNotif(false);
    }
  };

  const showPremiumAlert = (type, message) => {
    setAlertInfo({ show: true, type, message });
    setTimeout(() => setAlertInfo({ show: false, type: "", message: "" }), 4000);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user_info");
    if (storedUser) setUserData(JSON.parse(storedUser));

    // ─── PWA SETUP ───
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => console.log('SW registration failed', err));
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [pathname]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstallable(false);
    setDeferredPrompt(null);
  };

  const handleLogout = () => {
    Cookies.remove("auth_token");
    localStorage.removeItem("user_info");
    setIsProfileOpen(false);
    router.push("/login");
  };

  // ─── SETTINGS API LOGIC ───
  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = Cookies.get("auth_token");
      const res = await axios.put("https://agrovault.onrender.com/api/settings/update", settingsData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const updatedUser = { ...userData, ...settingsData };
      // Backend se aayi hui nayi key profile mein update karein
      if (res.data.shopKey) {
        updatedUser.shopKey = res.data.shopKey;
      }
      
      setUserData(updatedUser);
      localStorage.setItem("user_info", JSON.stringify(updatedUser));

      showPremiumAlert("success", "Settings update ho gayi hain!");
      setProfileTab("info");
    } catch (error) {
      showPremiumAlert("error", "Settings save karne mein error aaya.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const token = Cookies.get("auth_token");
      await axios.delete("https://agrovault.onrender.com/api/account/delete", {
        headers: { Authorization: `Bearer ${token}` }
      });
      handleLogout(); // Delete hote hi bahar phek do
    } catch (error) {
      showPremiumAlert("error", "Account delete nahi ho paya!");
    }
  };

  // Phone Masking Logic
  const maskedPhone = userData.phone ? `+91 XXXXXX${userData.phone.slice(-4)}` : "Not Provided";

  if (pathname === "/login") {
    return <html lang="en"><body className="bg-gray-50 antialiased">{children}</body></html>;
  }

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard, color: "text-blue-600", bg: "bg-blue-50" },
    { name: "New Sale", path: "/sales", icon: ReceiptText, color: "text-emerald-600", bg: "bg-emerald-50" },
    { name: "Buy Stock", path: "/purchases/new", icon: PackagePlus, color: "text-amber-600", bg: "bg-amber-50" },  
    { name: "Ledger", path: "/udhaar", icon: NotebookTabs, color: "text-rose-600", bg: "bg-rose-50" },
    { name: "Inventory", path: "/inventory", icon: Boxes, color: "text-indigo-600", bg: "bg-indigo-50" },
    { name: "Customers", path: "/customers", icon: Users, color: "text-amber-600", bg: "bg-amber-50" },
    { name: "Suppliers", path: "/suppliers", icon: Truck, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10b981" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className="bg-gray-50 font-sans text-gray-900 antialiased overflow-hidden">
        <div className="flex h-[100dvh] w-full">
          
          {/* ─── DESKTOP SIDEBAR ─── */}
          <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-200 shadow-sm z-30 print:hidden">
            <div className="h-20 flex items-center px-8 border-b border-gray-100">
              <div className="text-3xl font-black tracking-tight text-gray-900">
                Galla<span className="text-amber-500">Vault</span>
              </div>
            </div>
            
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <Link key={item.name} href={item.path} 
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                      isActive ? `${item.bg} ${item.color} font-bold shadow-sm` : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'
                    }`}>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-[15px]">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            
            {/* PROFILE BUTTON (OPENS MODAL) */}
            <div 
              onClick={() => setIsProfileOpen(true)}
              className="p-4 border-t border-gray-100 m-4 rounded-2xl bg-gray-50 hover:bg-gray-100 flex items-center gap-3 cursor-pointer transition-colors shadow-sm"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                {userData.name.charAt(0).toUpperCase()}
              </div>
              <div className="truncate pr-2 flex-1">
                <div className="text-sm font-bold text-gray-900 truncate">{userData.name.split(" ")[0]}</div>
                <div className="text-xs text-gray-500 truncate">{userData.shopName}</div>
              </div>
            </div>
          </aside>

          {/* ─── MAIN CONTENT ─── */}
          <div className="flex-1 flex flex-col h-[100dvh] w-full bg-gray-50/50">
           {/* HEIGHT aur TEXT SIZE ko phone ke liye chhota kar diya (h-14 aur text-xl) */}
            <header className="h-14 md:h-20 bg-white/80 backdrop-blur-md border-b border-gray-200 flex justify-between items-center px-3 md:px-8 z-20 sticky top-0 print:hidden">
              <div className="md:hidden text-xl font-black text-gray-900">Agro<span className="text-emerald-600">Vault</span></div>              <div className="hidden md:flex items-center bg-gray-100 rounded-full px-4 py-2 w-96"><Search size={18} className="text-gray-400 mr-3" /><input type="text" placeholder="Search..." className="bg-transparent outline-none w-full text-sm" /></div>
              <div className="flex items-center gap-3 md:gap-4">
                {/* ─── PWA INSTALL BUTTON ─── */}
                {isInstallable && (
                  <button 
                    onClick={handleInstallClick}
                    className="hidden md:flex items-center gap-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 hover:text-emerald-800 px-3 py-1.5 rounded-full text-xs font-bold transition-colors border border-emerald-200 shadow-sm"
                  >
                    <Download size={14} /> Install App
                  </button>
                )}
                
                {isInstallable && (
                  <button 
                    onClick={handleInstallClick}
                    className="md:hidden relative p-2.5 rounded-full bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 active:scale-95 transition-all"
                  >
                    <Download size={18} />
                  </button>
                )}

               <button onClick={handleBellClick} className="relative p-2.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm transition-all active:scale-95">
                <Bell size={20} />
                {notifications.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>}
                 </button>                  
                   {/* Mobile Profile Avatar */}
                <div onClick={() => setIsProfileOpen(true)} className="md:hidden w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm cursor-pointer">
                  {userData.name.charAt(0).toUpperCase()}
                </div>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-28 md:pb-8 relative">
              {/* ─── GLOBAL ALERT BANNER ─── */}
              <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[150] transition-all duration-500 ease-in-out transform w-11/12 md:w-auto min-w-[300px] ${alertInfo.show ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0 pointer-events-none"}`}>
                <div className={`p-4 rounded-2xl shadow-xl flex items-start gap-3 border ${alertInfo.type === "error" ? "bg-rose-50 border-rose-200" : "bg-emerald-50 border-emerald-200"}`}>
                  {alertInfo.type === "error" ? <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={20} /> : <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={20} />}
                  <div>
                    <h4 className={`text-sm font-black ${alertInfo.type === "error" ? "text-rose-900" : "text-emerald-900"}`}>{alertInfo.type === "error" ? "Action Failed" : "Success"}</h4>
                    <p className={`text-xs font-bold mt-0.5 ${alertInfo.type === "error" ? "text-rose-700" : "text-emerald-700"}`}>{alertInfo.message}</p>
                  </div>
                </div>
              </div>

              <div className="max-w-7xl mx-auto h-full">{children}</div>
            </main>

            {/* ─── MOBILE BOTTOM NAV (Safe & Intact) ─── */}
            <nav className="md:hidden fixed bottom-0 w-full bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-50 print:hidden">
              <div className="flex items-center h-16 px-4 overflow-x-auto gap-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path;
                  return (
                    <Link key={item.name} href={item.path} className="flex flex-col items-center justify-center gap-1 shrink-0 min-w-[64px]">
                      <Icon size={22} className={isActive ? item.color : 'text-gray-400'} strokeWidth={isActive ? 2.5 : 2} />
                      <span className={`text-[10px] font-bold ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
        </div>

        {/* ─── LIVE SHOP FEED (NOTIFICATIONS PANEL) ─── */}
        {isNotifOpen && (
          <>
            {/* Mobile background overlay */}
            <div className="md:hidden fixed inset-0 z-[190] bg-gray-900/20 backdrop-blur-sm" onClick={() => setIsNotifOpen(false)}></div>
            
            <div className="fixed top-[70px] md:top-[85px] right-2 md:right-8 z-[195] w-[95%] md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-top-4 fade-in duration-200 flex flex-col max-h-[80vh]">
              
              <div className="bg-gray-900 p-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2 text-white">
                  <Activity size={18} className="text-emerald-400" />
                  <h3 className="font-black text-sm tracking-widest uppercase">Live Shop Feed</h3>
                </div>
                <button onClick={() => setIsNotifOpen(false)} className="text-gray-400 hover:text-white transition-colors"><X size={18}/></button>
              </div>

              {/* Owner Broadcast Feature */}
              {userData.role === "OWNER" && (
                <div className="p-3 bg-gray-50 border-b border-gray-100 shrink-0">
                  <form onSubmit={handleSendAnnouncement} className="flex gap-2">
                    <input 
                      type="text" placeholder="Broadcast a message to staff..." 
                      value={newAnnouncement} onChange={(e) => setNewAnnouncement(e.target.value)}
                      className="flex-1 bg-white border border-gray-200 px-3 py-2 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
                    />
                    <button type="submit" disabled={sendingNotif || !newAnnouncement.trim()} className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white p-2 rounded-xl transition-colors shadow-sm">
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              )}

              {/* Feed List */}
              <div className="p-2 flex-1 overflow-y-auto space-y-1 bg-gray-50/50">
                {loadingNotifs ? (
                   <div className="py-10 text-center text-gray-400 font-bold text-xs animate-pulse">Loading Live Feed...</div>
                ) : notifications.length === 0 ? (
                   <div className="py-10 flex flex-col items-center justify-center text-gray-400">
                     <Bell size={32} className="mb-2 opacity-20" />
                     <p className="font-bold text-xs">No recent activity in the last 36 hours.</p>
                   </div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex gap-3 hover:border-emerald-200 transition-colors">
                      <div className="shrink-0 mt-0.5">
                        {notif.type === 'ANNOUNCEMENT' ? (
                          <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100"><Megaphone size={14}/></div>
                        ) : notif.type === 'ALERT' ? (
                          <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100"><AlertTriangle size={14}/></div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100"><ReceiptText size={14}/></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] font-bold text-gray-800 leading-snug">{notif.message}</p>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <span className="text-gray-500">{notif.createdBy}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5"><Clock size={10}/> {new Date(notif.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* ─── PREMIUM MINIMALIST PROFILE MODAL ─── */}
        {isProfileOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            {/* HEIGHT FIX: max-h-[85vh] lagaya hai */}
            <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
              
              {/* ─── MAIN PROFILE VIEW ─── */}
              {profileTab === "info" && (
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="p-4 md:p-5 flex justify-between items-center border-b border-gray-50 shrink-0">
                    <h3 className="font-black text-gray-800 text-sm tracking-wide">My Account</h3>
                    <button onClick={() => setIsProfileOpen(false)} className="text-gray-400 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors"><X size={18}/></button>
                  </div>
                  
                  {/* PADDING FIX: p-5 kiya aur pb-6 lagaya */}
                  <div className="p-5 flex-1 overflow-y-auto pb-6">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-3xl font-black mb-3 shadow-sm border border-emerald-100">
                        {userData.name.charAt(0).toUpperCase()}
                      </div>
                      <h2 className="text-xl font-black text-gray-900">{userData.name}</h2>
                      <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 px-2.5 py-0.5 rounded-full border ${userData.role ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-rose-100 text-rose-600 border-rose-200'}`}>
                        {userData.role || "ROLE NOT SET"}
                      </span>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div className="flex items-center gap-4 p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-400"><Phone size={18}/></div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Mobile Number</p>
                          <p className="text-sm font-black text-gray-800">{userData.phone ? `+91 XXXXXX${userData.phone.slice(-4)}` : "Not Provided"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-400"><Store size={18}/></div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Business</p>
                          <p className="text-sm font-black text-gray-800">{userData.shopName || "Not Set"}</p>
                        </div>
                      </div>
                      
                      {/* ─── SHOW SHOP KEY IF OWNER ─── */}
                      {userData.role === "OWNER" && userData.shopKey && (
                        <div className="flex items-center justify-between p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm mt-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-emerald-500"><ShieldCheck size={18}/></div>
                            <div>
                              <p className="text-[10px] font-bold text-emerald-600 uppercase">Shop Key (For Staff)</p>
                              <p className="text-sm font-black text-emerald-900">{userData.shopKey}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <button 
                        onClick={() => {
                          setProfileTab("settings");
                          setActiveSettingSection("general");
                          setSettingsData({ 
                            role: userData.role || "", shopName: userData.shopName || "", 
                            address: userData.address || "", email: userData.email || "", 
                            shopKey: "", securityQuestion: "", securityAnswer: "" 
                          });
                        }} 
                        className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                      >
                        <Settings size={18}/> Account Settings
                      </button>
                      <button 
                        onClick={handleLogout} 
                        className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors border border-rose-100"
                      >
                        <LogOut size={18}/> Secure Logout
                      </button>
                    </div>
                  </div>
              )}

              {/* ─── SETTINGS VIEW (Nested) ─── */}
              {profileTab === "settings" && (
                <div className="flex flex-col h-full bg-gray-50/50">
                  <div className="p-5 flex justify-between items-center border-b border-gray-200 bg-white shadow-sm z-10">
                    <button onClick={() => setProfileTab("info")} className="text-gray-500 hover:text-gray-900 flex items-center gap-2 font-bold text-sm"><ArrowLeft size={18}/> Back</button>
                    <h3 className="font-black text-gray-800 text-sm">Settings</h3>
                    <div className="w-5"></div> {/* Spacer */}
                  </div>

                  <div className="p-4 flex-1 overflow-y-auto space-y-3">
                    
                    {/* Section 1: General Info (Read Only) */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                      <button onClick={() => setActiveSettingSection("general")} className="w-full p-4 flex justify-between items-center text-left font-black text-gray-800">
                        <span className="flex items-center gap-2"><Info size={18} className="text-blue-500"/> General Info</span>
                      </button>
                      {activeSettingSection === "general" && (
                        <div className="p-4 pt-0 border-t border-gray-100 space-y-3 bg-gray-50/50">
                          <div><p className="text-[10px] font-bold text-gray-400 uppercase">Name</p><p className="text-sm font-bold text-gray-900">{userData.name}</p></div>
                          <div><p className="text-[10px] font-bold text-gray-400 uppercase">Role</p><p className="text-sm font-bold text-gray-900">{userData.role || "Not Set"}</p></div>
                          <div><p className="text-[10px] font-bold text-gray-400 uppercase">Shop Name</p><p className="text-sm font-bold text-gray-900">{userData.shopName || "Not Set"}</p></div>
                          <div><p className="text-[10px] font-bold text-gray-400 uppercase">Email ID</p><p className="text-sm font-bold text-gray-900">{userData.email || "Not Provided"}</p></div>
                          <div><p className="text-[10px] font-bold text-gray-400 uppercase">Address</p><p className="text-sm font-bold text-gray-900">{userData.address || "Not Provided"}</p></div>
                        </div>
                      )}
                    </div>

                    {/* Section 2: Edit Details */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                      <button onClick={() => setActiveSettingSection("edit")} className="w-full p-4 flex justify-between items-center text-left font-black text-gray-800">
                        <span className="flex items-center gap-2"><Store size={18} className="text-emerald-500"/> Edit Details</span>
                      </button>
                      {activeSettingSection === "edit" && (
                        <div className="p-4 pt-0 border-t border-gray-100 space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Shop Name</label>
                            <input type="text" value={settingsData.shopName} onChange={(e) => setSettingsData({...settingsData, shopName: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-gray-400" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Address</label>
                            <input type="text" value={settingsData.address} onChange={(e) => setSettingsData({...settingsData, address: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-gray-400" />
                          </div>

                          {/* Role Lock Logic */}
                          <div className="pt-2 border-t border-gray-100">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 flex justify-between">
                              Account Role 
                              {(userData.role === "OWNER" || userData.role === "EMPLOYEE") && <span className="text-rose-500 font-bold">Locked by Admin</span>}
                            </label>
                            <select 
                              value={settingsData.role} 
                              onChange={(e) => setSettingsData({...settingsData, role: e.target.value})} 
                              disabled={userData.role === "OWNER" || userData.role === "EMPLOYEE"}
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              <option value="">Select Role</option>
                              <option value="OWNER">OWNER</option>
                              <option value="EMPLOYEE">EMPLOYEE</option>
                            </select>
                          </div>

                          {/* Employee Key Box */}
                          {settingsData.role === "EMPLOYEE" && !(userData.role === "OWNER" || userData.role === "EMPLOYEE") && (
                            <div className="animate-in fade-in zoom-in-95 duration-200">
                              <label className="block text-[10px] font-bold text-blue-500 uppercase mb-1.5">Owner's Shop Key</label>
                              <input type="text" placeholder="e.g. AGRO-XYZ" value={settingsData.shopKey} onChange={(e) => setSettingsData({...settingsData, shopKey: e.target.value})} className="w-full p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm font-bold text-blue-900 outline-none uppercase placeholder-blue-300" />
                            </div>
                          )}

                          <button onClick={handleUpdateSettings} disabled={isSaving} className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3.5 rounded-xl shadow-md transition-all">
                            {isSaving ? "Saving..." : "Save Details"}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Section 3: Security & Danger */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                      <button onClick={() => setActiveSettingSection("security")} className="w-full p-4 flex justify-between items-center text-left font-black text-gray-800">
                        <span className="flex items-center gap-2"><ShieldAlert size={18} className="text-amber-500"/> Security Setup</span>
                      </button>
                      {activeSettingSection === "security" && (
                        <div className="p-4 pt-0 border-t border-gray-100">
                          <div className="space-y-4 mb-6">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Security Question</label>
                              <select value={settingsData.securityQuestion} onChange={(e) => setSettingsData({...settingsData, securityQuestion: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-gray-400">
                                <option value="">Select a Question...</option>
                                <option value="Bachpan ke dost ka naam?">Bachpan ke dost ka naam?</option>
                                <option value="School ka naam kya tha?">School ka naam kya tha?</option>
                                <option value="Pehli gaadi ka number?">Pehli gaadi ka number?</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Secret Answer</label>
                              <input type="text" placeholder="Type your answer..." value={settingsData.securityAnswer} onChange={(e) => setSettingsData({...settingsData, securityAnswer: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-gray-400" />
                            </div>
                            <button onClick={handleUpdateSettings} disabled={isSaving} className="w-full bg-amber-100 text-amber-700 hover:bg-amber-200 font-bold py-3.5 rounded-xl transition-all">
                              Set Security Key
                            </button>
                          </div>

                          {/* Quiet Delete Section */}
                          <div className="border-t border-gray-100 pt-6 flex flex-col items-center">
                            {!showDeleteConfirm ? (
                              <button onClick={() => setShowDeleteConfirm(true)} className="text-xs font-bold text-gray-400 hover:text-rose-500 underline transition-colors">
                                I want to delete my account
                              </button>
                            ) : (
                              <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl w-full animate-in zoom-in-95 duration-200">
                                <p className="text-xs font-bold text-rose-800 text-center mb-4">Are you sure? This cannot be undone.</p>
                                <div className="flex gap-2">
                                  <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                                  <button onClick={handleDeleteAccount} className="flex-1 py-2.5 bg-rose-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-rose-700">Yes, Delete</button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js');
            });
          }
        `}} />
      </body>
    </html>
  );
}