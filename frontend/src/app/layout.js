"use client";
import "./globals.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { 
  LayoutDashboard, ReceiptText, NotebookTabs, Boxes, 
  Users, Bell, Search, Truck, PackagePlus, LogOut, 
  UserCircle, Store, Phone, X 
} from "lucide-react";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [userData, setUserData] = useState({ name: "User", shopName: "AgroVault Store", phone: "", shopType: "" });
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user_info");
    if (storedUser) setUserData(JSON.parse(storedUser));
  }, [pathname]);

  const handleLogout = () => {
    Cookies.remove("auth_token");
    localStorage.removeItem("user_info");
    setIsProfileOpen(false);
    router.push("/login");
  };

  if (pathname === "/login") {
    return <html lang="en"><body className="bg-gray-50 antialiased">{children}</body></html>;
  }

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard, color: "text-blue-600", bg: "bg-blue-50" },
    { name: "New Sale", path: "/sales", icon: ReceiptText, color: "text-emerald-600", bg: "bg-emerald-50" },
    { name: "Buy Stock", path: "/purchases/new", icon: PackagePlus, color: "text-purple-600", bg: "bg-purple-50" },
    { name: "Ledger", path: "/udhaar", icon: NotebookTabs, color: "text-rose-600", bg: "bg-rose-50" },
    { name: "Inventory", path: "/inventory", icon: Boxes, color: "text-indigo-600", bg: "bg-indigo-50" },
    { name: "Customers", path: "/customers", icon: Users, color: "text-amber-600", bg: "bg-amber-50" },
    { name: "Suppliers", path: "/suppliers", icon: Truck, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <html lang="en">
      <body className="bg-gray-50 font-sans text-gray-900 antialiased overflow-hidden">
        <div className="flex h-[100dvh] w-full">
          
          {/* ─── DESKTOP SIDEBAR ─── */}
          <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-200 shadow-sm z-30">
            <div className="h-20 flex items-center px-8 border-b border-gray-100">
              <div className="text-3xl font-black tracking-tight text-gray-900">
                Agro<span className="text-emerald-600">Vault</span>
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
            <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-200 flex justify-between items-center px-4 md:px-8 z-20 sticky top-0">
              <div className="md:hidden text-2xl font-black text-gray-900">Agro<span className="text-emerald-600">Vault</span></div>
              <div className="hidden md:flex items-center bg-gray-100 rounded-full px-4 py-2 w-96"><Search size={18} className="text-gray-400 mr-3" /><input type="text" placeholder="Search..." className="bg-transparent outline-none w-full text-sm" /></div>
              <div className="flex items-center gap-4">
                <button className="relative p-2.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm"><Bell size={20} /><span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span></button>
                {/* Mobile Profile Avatar */}
                <div onClick={() => setIsProfileOpen(true)} className="md:hidden w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm cursor-pointer">
                  {userData.name.charAt(0).toUpperCase()}
                </div>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-28 md:pb-8">
              <div className="max-w-7xl mx-auto h-full">{children}</div>
            </main>

            {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-50">
        <div className="flex items-center h-16 px-4 overflow-x-auto gap-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.name} 
                href={item.path} 
                className="flex flex-col items-center justify-center gap-1 shrink-0 min-w-[64px]"
              >
                <Icon 
                  size={22} 
                  className={isActive ? item.color : 'text-gray-400'} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={`text-[10px] font-bold ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
          </div>
        </div>

        {/* ─── PREMIUM PROFILE MODAL ─── */}
        {isProfileOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-emerald-600 p-6 pb-12 relative flex justify-between items-start">
                <h3 className="text-white font-black tracking-widest uppercase text-xs opacity-80">Workspace Profile</h3>
                <button onClick={() => setIsProfileOpen(false)} className="text-white/70 hover:text-white bg-black/10 hover:bg-black/20 p-1.5 rounded-full transition-colors"><X size={20}/></button>
              </div>
              <div className="px-6 pb-6 relative -mt-10">
                <div className="w-20 h-20 bg-white rounded-2xl p-1.5 shadow-lg mx-auto mb-4 border border-gray-100">
                  <div className="w-full h-full bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center text-3xl font-black">
                    {userData.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-black text-gray-900">{userData.name}</h2>
                  <p className="text-sm font-bold text-gray-500 flex justify-center items-center gap-1.5 mt-1">
                    <Store size={14}/> {userData.shopName}
                  </p>
                </div>
                <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6">
                  <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                    <Phone size={16} className="text-gray-400"/> +91 {userData.phone || "Not Provided"}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                    <Boxes size={16} className="text-gray-400"/> {userData.shopType || "Retail Store"}
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-black py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <LogOut size={18}/> Secure Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}