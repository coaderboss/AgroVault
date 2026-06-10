"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie"; 
import { 
  TrendingUp, Wallet, Boxes, UserPlus, Store, 
  ReceiptText, ShieldCheck, AlertCircle, ArrowUpRight, 
  Clock, Activity, Zap, BarChart3, ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const [stats, setStats] = useState({ 
    products: 0, 
    customers: 0, 
    lowStock: 0,
    todayRevenue: 0,
    pendingDues: 0
  });
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({ name: "User", shopName: "AgroVault Workspace", role: "", shopKey: "" });

  useEffect(() => {
    const storedUser = localStorage.getItem("user_info");
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }

    const fetchData = async () => {
      try {
        const token = Cookies.get("auth_token"); 
        const config = { headers: { Authorization: `Bearer ${token}` } }; 

        const prodRes = await axios.get("https://agrovault.onrender.com/api/products", config);
        const custRes = await axios.get("https://agrovault.onrender.com/api/customers", config);
        
        let ordersData = [];
        try {
          const ordersRes = await axios.get("https://agrovault.onrender.com/api/orders", config);
          ordersData = ordersRes.data.data || [];
        } catch (err) {
          console.log("Orders API setup pending.");
        }

        const lowStockItems = prodRes.data.data.filter(p => p.stockQty < 10).length;
        const todayStr = new Date().toDateString();
        const todayRevenueSum = ordersData
          .filter(o => new Date(o.createdAt).toDateString() === todayStr)
          .reduce((sum, o) => sum + (o.paidAmount || 0), 0);
        const totalPendingDues = custRes.data.data.reduce((sum, c) => sum + (c.totalDue || 0), 0);

        setStats({ 
          products: prodRes.data.data.length, 
          customers: custRes.data.data.length,
          lowStock: lowStockItems,
          todayRevenue: todayRevenueSum,
          pendingDues: totalPendingDues
        });
        setLoading(false);
      } catch (error) {
        console.error("Dashboard sync fatal error:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[70dvh] items-center justify-center bg-transparent">
        <div className="relative flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-[3px] border-gray-100 border-t-gray-900 rounded-full animate-spin"></div>
          <div className="absolute inset-0 blur-xl bg-gray-400/20 rounded-full"></div>
          <p className="text-gray-900 font-black tracking-widest text-[10px] uppercase z-10">Initializing Workspace...</p>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 md:space-y-8 animate-in fade-in zoom-in-[0.98] duration-700 pb-28 md:pb-8">
      
      {/* ─── MISSING ROLE BANNER (Glassmorphic) ─── */}
      {!userData?.role && (
        <div className="bg-amber-500/10 backdrop-blur-xl border border-amber-500/20 p-4 rounded-3xl flex items-start sm:items-center gap-4 shadow-[0_8px_30px_rgb(245,158,11,0.1)] transition-all max-w-4xl">
          <div className="bg-amber-500/20 p-2.5 rounded-full shrink-0"><AlertCircle className="text-amber-600" size={20} /></div>
          <div className="flex-1">
            <h4 className="text-xs font-black text-amber-900 uppercase tracking-widest">Action Required</h4>
            <p className="text-[11px] font-bold text-amber-800/80 mt-0.5 leading-relaxed">
              Aapka system role set nahi hai. Kripya Profile Settings mein jaakar apni identity (OWNER/EMPLOYEE) verify karein taaki secure keys activate ho sakein.
            </p>
          </div>
        </div>
      )}

      {/* ─── THE HERO BANNER (Premium Dark Gradient - Mobile Optimized) ─── */}
      <div className="relative bg-gray-900 rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-10 overflow-hidden shadow-2xl shadow-gray-900/20 border border-gray-800 group">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-emerald-500/20 blur-[80px] md:blur-[100px] rounded-full mix-blend-screen group-hover:bg-emerald-500/30 transition-all duration-1000"></div>
        <div className="absolute bottom-0 left-10 md:left-20 w-32 md:w-48 h-32 md:h-48 bg-blue-500/20 blur-[60px] md:blur-[80px] rounded-full mix-blend-screen"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-5 md:gap-6">
          <div className="space-y-3 md:space-y-4">
            
            <div className="flex items-center justify-between md:justify-start gap-3">
              <span className="bg-white/10 backdrop-blur-md border border-white/10 text-white/90 font-black text-[9px] uppercase tracking-[0.2em] px-2.5 py-1 md:px-3 md:py-1.5 rounded-full flex items-center gap-1.5 shadow-xl">
                <Activity size={12} className="text-emerald-400 animate-pulse"/> Live Sync
              </span>
              <span className="text-gray-400 font-bold text-[10px] md:text-xs flex items-center gap-1.5"><Clock size={12}/> {today}</span>
            </div>
            
            {/* TEXT SIZE ADJUSTED FOR MOBILE */}
            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight mt-1 md:mt-2">
              Namaste, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">{userData?.name?.split(" ")[0]?.toUpperCase() || 'USER'}</span>
            </h1>

            {/* ─── LIVE GLOWING HUD (Mobile Wrapped) ─── */}
            <div className="flex items-center gap-3 md:gap-4 mt-2 md:mt-4 bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-2xl w-full sm:w-fit">
              <div className="flex-1 sm:flex-none pr-3 md:pr-4 border-r border-white/10">
                <p className="text-[9px] md:text-[10px] text-emerald-400/80 font-black uppercase tracking-widest">Today's Sales</p>
                <p className="text-lg md:text-2xl font-black text-white tracking-tight">₹{stats.todayRevenue.toLocaleString('en-IN')}</p>
              </div>
              <div className="flex-1 sm:flex-none pl-1 md:pl-2">
                <p className="text-[9px] md:text-[10px] text-rose-400/80 font-black uppercase tracking-widest">Total Market Due</p>
                <p className="text-lg md:text-2xl font-black text-white tracking-tight">₹{stats.pendingDues.toLocaleString('en-IN')}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 md:gap-3 pt-2 md:pt-4">
              <div className="flex items-center gap-1.5 md:gap-2 bg-white/5 backdrop-blur-sm border border-white/5 px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-xl text-gray-300 font-bold text-xs md:text-sm">
                <Store size={14} className="text-gray-400" /> {userData?.shopName || 'Setup Business'}
              </div>
              
              {/* SHOP KEY RENDER (Ab Owner banne ke baad yahan pakka dikhegi) */}
              {userData?.role === "OWNER" && userData?.shopKey && (
                <div className="flex items-center gap-1.5 md:gap-2 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-xl text-emerald-50 font-black text-[10px] md:text-xs tracking-widest uppercase shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <ShieldCheck size={14} className="text-emerald-400" /> KEY: {userData.shopKey}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* ─── BENTO GRID METRICS (Neo-Glassmorphism) ─── */}
      <div>
        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1 flex items-center gap-2">
          <BarChart3 size={14}/> Core Analytics
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
          
          {/* REVENUE (Span 2 on mobile) */}
          <div className="col-span-2 lg:col-span-1 bg-white rounded-[2rem] p-5 md:p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.1)] transition-all duration-300 group relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full blur-2xl group-hover:bg-emerald-100 transition-colors"></div>
            <div className="relative flex justify-between items-start mb-6">
              <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 group-hover:scale-110 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all duration-300">
                <TrendingUp size={18} className="text-gray-400 group-hover:text-emerald-600" />
              </div>
              <ArrowUpRight size={18} className="text-gray-300 group-hover:text-emerald-500 transition-colors"/>
            </div>
            <div className="relative">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Today's Revenue</p>
              <h3 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter">₹{stats.todayRevenue.toLocaleString('en-IN')}</h3>
            </div>
          </div>

          {/* LEDGER */}
          <div className="col-span-2 lg:col-span-1 bg-white rounded-[2rem] p-5 md:p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(244,63,94,0.1)] transition-all duration-300 group relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-50 rounded-full blur-2xl group-hover:bg-rose-100 transition-colors"></div>
            <div className="relative flex justify-between items-start mb-6">
              <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 group-hover:scale-110 group-hover:bg-rose-50 group-hover:text-rose-600 transition-all duration-300">
                <Wallet size={18} className="text-gray-400 group-hover:text-rose-600" />
              </div>
              <ArrowUpRight size={18} className="text-gray-300 group-hover:text-rose-500 transition-colors"/>
            </div>
            <div className="relative">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Market Dues</p>
              <h3 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter">₹{stats.pendingDues.toLocaleString('en-IN')}</h3>
            </div>
          </div>

          {/* INVENTORY */}
          <div className="bg-white rounded-[2rem] p-5 md:p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(59,130,246,0.1)] transition-all duration-300 group relative overflow-hidden flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 group-hover:scale-110 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all duration-300">
                <Boxes size={18} className="text-gray-400 group-hover:text-blue-600" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Products</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter">{stats.products}</h3>
                {stats.lowStock > 0 && <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">{stats.lowStock} Low</span>}
              </div>
            </div>
          </div>

          {/* CUSTOMERS */}
          <div className="bg-white rounded-[2rem] p-5 md:p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(168,85,247,0.1)] transition-all duration-300 group relative overflow-hidden flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 group-hover:scale-110 group-hover:bg-purple-50 group-hover:text-purple-600 transition-all duration-300">
                <UserPlus size={18} className="text-gray-400 group-hover:text-purple-600" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Network</p>
              <h3 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter">{stats.customers}</h3>
            </div>
          </div>

        </div>
      </div>

      {/* ─── QUICK COMMAND MODULE ─── */}
      <div className="pt-2">
        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1 flex items-center gap-2">
          <Zap size={14}/> Operations
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-5">
          
          <Link href="/sales" className="relative overflow-hidden bg-white border border-gray-100 rounded-[1.5rem] p-5 flex items-center justify-between group shadow-sm hover:shadow-[0_8px_30px_rgb(16,185,129,0.12)] hover:border-emerald-200 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 text-gray-600 rounded-2xl flex items-center justify-center border border-gray-100 group-hover:bg-emerald-500 group-hover:text-white group-hover:rotate-3 transition-all duration-300 shadow-sm"><ReceiptText size={20}/></div>
              <div>
                <h3 className="font-black text-gray-900 text-sm">Generate Bill</h3>
                <p className="text-[10px] font-bold text-gray-400 mt-0.5 tracking-wide">POS Terminal</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors"><ArrowRight size={14} className="text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all"/></div>
          </Link>

          <Link href="/udhaar" className="relative overflow-hidden bg-white border border-gray-100 rounded-[1.5rem] p-5 flex items-center justify-between group shadow-sm hover:shadow-[0_8px_30px_rgb(244,63,94,0.12)] hover:border-rose-200 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 text-gray-600 rounded-2xl flex items-center justify-center border border-gray-100 group-hover:bg-rose-500 group-hover:text-white group-hover:-rotate-3 transition-all duration-300 shadow-sm"><Wallet size={20}/></div>
              <div>
                <h3 className="font-black text-gray-900 text-sm">Collect Ledger</h3>
                <p className="text-[10px] font-bold text-gray-400 mt-0.5 tracking-wide">Pending Dues</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-rose-50 transition-colors"><ArrowRight size={14} className="text-gray-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all"/></div>
          </Link>

          <Link href="/customers" className="relative overflow-hidden bg-white border border-gray-100 rounded-[1.5rem] p-5 flex items-center justify-between group shadow-sm hover:shadow-[0_8px_30px_rgb(168,85,247,0.12)] hover:border-purple-200 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 text-gray-600 rounded-2xl flex items-center justify-center border border-gray-100 group-hover:bg-purple-500 group-hover:text-white group-hover:scale-105 transition-all duration-300 shadow-sm"><UserPlus size={20}/></div>
              <div>
                <h3 className="font-black text-gray-900 text-sm">Add Customer</h3>
                <p className="text-[10px] font-bold text-gray-400 mt-0.5 tracking-wide">Network Data</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-purple-50 transition-colors"><ArrowRight size={14} className="text-gray-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all"/></div>
          </Link>

        </div>
      </div>

    </div>
  );
}