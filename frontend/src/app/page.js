"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie"; // Token nikalne ke liye
import { 
  TrendingUp, AlertOctagon, PackageSearch, ArrowRight,
  Wallet, ReceiptText, UserPlus, Boxes, Store
} from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, customers: 0, lowStock: 0 });
  const [loading, setLoading] = useState(true);
  
  // 1. User ki details save karne ke liye state
  const [userData, setUserData] = useState({ name: "User", shopName: "AgroVault Workspace" });

  useEffect(() => {
    // 2. Page load hote hi LocalStorage se user ka data nikalo
    const storedUser = localStorage.getItem("user_info");
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }

    const fetchData = async () => {
      try {
        const token = Cookies.get("auth_token"); // Bouncer ko dikhane ke liye chaabi
        const config = { headers: { Authorization: `Bearer ${token}` } }; // Chaabi ko envelop mein dala

        // APIs call karte waqt config (chaabi) sath bheji
        const prodRes = await axios.get("https://agrovault.onrender.com/api/products", config);
        const custRes = await axios.get("https://agrovault.onrender.com/api/customers", config);
        
        const lowStockItems = prodRes.data.data.filter(p => p.stockQty < 10).length;

        setStats({ 
          products: prodRes.data.data.length, 
          customers: custRes.data.data.length,
          lowStock: lowStockItems
        });
        setLoading(false);
      } catch (error) {
        console.error("Data fetch error", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-bold tracking-widest text-sm uppercase">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // Current Date nikalne ka formula
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="flex flex-col gap-4 md:gap-6 animate-in fade-in duration-500 pb-28 md:pb-10">
    
      {/* ─── HEADER (Namaste & Shop Name) ─── */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Namaste, {userInfo?.name?.toUpperCase() || 'USER'}!</h1>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
            <p className="text-gray-500 font-medium flex items-center gap-2 text-sm md:text-base">
              <Store size={16} className="text-emerald-500" /> {userInfo?.shopName || 'Shop'}
            </p>
            
            {/* ─── SHOP KEY BADGE (Sirf Owner ko dikhega) ─── */}
            {userInfo?.role === "OWNER" && userInfo?.shopKey && (
              <div className="bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-2 w-fit">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Staff Key:</span>
                <span className="font-black text-indigo-700 tracking-wider text-sm">{userInfo.shopKey}</span>
              </div>
            )}
          </div>
        </div>
        <div className="text-[10px] md:text-sm font-bold text-gray-600 uppercase tracking-widest bg-gray-200/50 px-3 py-2 md:px-5 md:py-3 rounded-lg md:rounded-xl inline-block text-center">
          {today}
        </div>
      </div>

      {/* ─── COLORFUL METRICS CARDS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {/* GREEN CARD: Sales */}
        <div className="bg-emerald-500 rounded-2xl md:rounded-3xl p-4 md:p-6 text-white shadow-lg shadow-emerald-500/30 flex flex-col justify-between min-h-[110px] md:min-h-[160px] transform transition hover:-translate-y-1">
          <div className="flex justify-between items-start">
            <div className="bg-white/20 p-2 md:p-3 rounded-xl md:rounded-2xl"><TrendingUp className="w-5 h-5 md:w-7 md:h-7 text-white" /></div>
            <div className="text-emerald-100 text-[10px] md:text-xs font-bold uppercase tracking-widest">Sales</div>
          </div>
          <div className="mt-2 md:mt-0">
            <div className="text-xl md:text-4xl font-black mb-0 md:mb-1">₹0</div>
            <div className="text-[10px] md:text-sm text-emerald-100 font-medium leading-tight">Today's Revenue</div>
          </div>
        </div>

        {/* RED CARD: Ledger/Pending */}
        <div className="bg-rose-500 rounded-2xl md:rounded-3xl p-4 md:p-6 text-white shadow-lg shadow-rose-500/30 flex flex-col justify-between min-h-[110px] md:min-h-[160px] transform transition hover:-translate-y-1">
          <div className="flex justify-between items-start">
            <div className="bg-white/20 p-2 md:p-3 rounded-xl md:rounded-2xl"><Wallet className="w-5 h-5 md:w-7 md:h-7 text-white" /></div>
            <div className="text-rose-100 text-[10px] md:text-xs font-bold uppercase tracking-widest">Ledger</div>
          </div>
          <div className="mt-2 md:mt-0">
            <div className="text-xl md:text-4xl font-black mb-0 md:mb-1">₹0</div>
            <div className="text-[10px] md:text-sm text-rose-100 font-medium leading-tight">Pending Dues</div>
          </div>
        </div>

        {/* BLUE CARD: Inventory */}
        <div className="bg-blue-600 rounded-2xl md:rounded-3xl p-4 md:p-6 text-white shadow-lg shadow-blue-600/30 flex flex-col justify-between min-h-[110px] md:min-h-[160px] transform transition hover:-translate-y-1">
          <div className="flex justify-between items-start">
            <div className="bg-white/20 p-2 md:p-3 rounded-xl md:rounded-2xl"><Boxes className="w-5 h-5 md:w-7 md:h-7 text-white" /></div>
            <div className="text-blue-100 text-[10px] md:text-xs font-bold uppercase tracking-widest">Stock</div>
          </div>
          <div className="mt-2 md:mt-0">
            <div className="text-xl md:text-4xl font-black mb-0 md:mb-1">{stats.products}</div>
            <div className="text-[10px] md:text-sm text-blue-100 font-medium leading-tight">Total Products</div>
          </div>
        </div>

        {/* PURPLE CARD: Alerts/Customers */}
        <div className="bg-purple-600 rounded-2xl md:rounded-3xl p-4 md:p-6 text-white shadow-lg shadow-purple-600/30 flex flex-col justify-between min-h-[110px] md:min-h-[160px] transform transition hover:-translate-y-1">
          <div className="flex justify-between items-start">
            <div className="bg-white/20 p-2 md:p-3 rounded-xl md:rounded-2xl"><UserPlus className="w-5 h-5 md:w-7 md:h-7 text-white" /></div>
            <div className="text-purple-100 text-[10px] md:text-xs font-bold uppercase tracking-widest">Network</div>
          </div>
          <div className="mt-2 md:mt-0">
            <div className="text-xl md:text-4xl font-black mb-0 md:mb-1">{stats.customers}</div>
            <div className="text-[10px] md:text-sm text-purple-100 font-medium leading-tight">Active Customers</div>
          </div>
        </div>
      </div>

      {/* ─── QUICK ACTIONS ─── */}
      <div>
        <h2 className="text-xs md:text-sm font-black text-gray-400 uppercase tracking-widest mb-3 md:mb-5">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-2 md:gap-6">
          <Link href="/sales" className="bg-white border-2 border-emerald-100 hover:border-emerald-500 rounded-xl md:rounded-3xl p-3 md:p-6 flex flex-col items-center justify-center gap-2 md:gap-4 transition-all shadow-sm hover:shadow-md group">
            <div className="w-10 h-10 md:w-16 md:h-16 bg-emerald-50 text-emerald-600 rounded-lg md:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><ReceiptText className="w-5 h-5 md:w-8 md:h-8" strokeWidth={2.5} /></div>
            <span className="font-bold text-gray-800 text-[10px] md:text-lg text-center leading-tight">Generate<br className="md:hidden"/> Bill</span>
          </Link>
          <Link href="/udhaar" className="bg-white border-2 border-rose-100 hover:border-rose-500 rounded-xl md:rounded-3xl p-3 md:p-6 flex flex-col items-center justify-center gap-2 md:gap-4 transition-all shadow-sm hover:shadow-md group">
            <div className="w-10 h-10 md:w-16 md:h-16 bg-rose-50 text-rose-600 rounded-lg md:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Wallet className="w-5 h-5 md:w-8 md:h-8" strokeWidth={2.5} /></div>
            <span className="font-bold text-gray-800 text-[10px] md:text-lg text-center leading-tight">Collect<br className="md:hidden"/> Due</span>
          </Link>
          <Link href="/customers" className="bg-white border-2 border-purple-100 hover:border-purple-500 rounded-xl md:rounded-3xl p-3 md:p-6 flex flex-col items-center justify-center gap-2 md:gap-4 transition-all shadow-sm hover:shadow-md group">
            <div className="w-10 h-10 md:w-16 md:h-16 bg-purple-50 text-purple-600 rounded-lg md:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><UserPlus className="w-5 h-5 md:w-8 md:h-8" strokeWidth={2.5} /></div>
            <span className="font-bold text-gray-800 text-[10px] md:text-lg text-center leading-tight">Add<br className="md:hidden"/> Customer</span>
          </Link>
        </div>
      </div>

    </div>
  );
}