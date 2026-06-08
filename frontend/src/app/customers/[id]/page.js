"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Wallet, ReceiptText, Phone, MapPin, History, Check, ArrowDownToLine, TrendingUp, Layers } from "lucide-react";
import Cookies from "js-cookie";

export default function CustomerProfile() {
  const { id } = useParams();
  const router = useRouter();
  
  // States
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("transactions"); // 'transactions', 'credits', 'analytics'
  
  // Bulk Pay States
  const [bulkPayAmount, setBulkPayAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Pagination for Credits
  const [creditLogs, setCreditLogs] = useState([]);
  const [creditPage, setCreditPage] = useState(1);
  const [hasMoreCredits, setHasMoreCredits] = useState(true);
  const [loadingCredits, setLoadingCredits] = useState(false);

  const fetchProfile = async () => {
    try {
      const token = Cookies.get("auth_token"); // <-- Chaabi
      const res = await axios.get(`http://localhost:5000/api/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` } // <-- Envelop
      });
      setProfile(res.data.data);
      setLoading(false);
    } catch (error) {
      router.push('/customers');
    }
  };

  const fetchCreditLogs = async (pageToFetch) => {
    setLoadingCredits(true);
    try {
      const token = Cookies.get("auth_token"); // <-- Chaabi
      const res = await axios.get(`http://localhost:5000/api/customers/${id}/payments?page=${pageToFetch}&limit=5`, {
        headers: { Authorization: `Bearer ${token}` } // <-- Envelop
      });
      if (pageToFetch === 1) {
        setCreditLogs(res.data.data);
      } else {
        setCreditLogs(prev => [...prev, ...res.data.data]); 
      }
      setHasMoreCredits(pageToFetch < res.data.pagination.totalPages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingCredits(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchCreditLogs(1);
  }, [id]);

  const handleBulkPayment = async () => {
    if (!bulkPayAmount || Number(bulkPayAmount) <= 0) return alert("Sahi amount daalein!");
    if (Number(bulkPayAmount) > profile.totalDue) return alert("Udhaar se zyada paisa jama kar rahe ho!");

    setIsProcessing(true);
    try {
      const token = Cookies.get("auth_token"); // <-- Chaabi
      await axios.post(`http://localhost:5000/api/customers/${id}/bulk-pay`, 
        { amount: Number(bulkPayAmount) },
        { headers: { Authorization: `Bearer ${token}` } } // <-- Envelop
      );
      setBulkPayAmount(""); 
      await fetchProfile(); 
      fetchCreditLogs(1); 
      setActiveTab("credits"); 
    } catch (error) {
      alert("Payment fail ho gayi!");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center font-bold text-gray-500 animate-pulse">Khata Book Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-in fade-in duration-300">
      
      {/* ─── HEADER ─── */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.push('/customers')} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-gray-900 leading-tight">{profile.name}</h1>
          <div className="flex items-center gap-3 text-sm font-bold text-gray-500 mt-1">
            <span className="flex items-center gap-1.5"><MapPin size={14}/> {profile.village}</span>
            <span className="flex items-center gap-1.5"><Phone size={14}/> {profile.mobile}</span>
          </div>
        </div>
      </div>

      {/* ─── MAIN LEDGER METRICS ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">Total Market Due</div>
          <div className={`text-3xl font-black relative z-10 ${profile.totalDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            ₹{profile.totalDue.toLocaleString('en-IN')}
          </div>
          <Wallet size={80} className={`absolute -bottom-4 -right-4 opacity-5 ${profile.totalDue > 0 ? 'text-rose-900' : 'text-emerald-900'}`} />
        </div>
        <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Purchased</div>
          <div className="text-2xl font-black text-gray-800">₹{profile.totalPurchased.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100">
          <div className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1">Total Paid</div>
          <div className="text-2xl font-black text-emerald-800">₹{profile.totalPaid.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* ─── BULK PAYMENT ─── */}
      {profile.totalDue > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 mb-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-amber-900 flex items-center gap-2"><Wallet size={18}/> Deposit Payment</h4>
            <p className="text-xs text-amber-700 font-medium mt-1">Paise jama karein, purani slip auto-clear hogi.</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-48">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
              <input 
                type="number" placeholder="Amount..."
                value={bulkPayAmount} onChange={(e) => setBulkPayAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-white border border-amber-200 rounded-xl font-black text-gray-900 outline-none focus:border-amber-500"
              />
            </div>
            <button 
              onClick={handleBulkPayment} disabled={isProcessing}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all active:scale-95 flex justify-center items-center gap-2 whitespace-nowrap disabled:opacity-70"
            >
              {isProcessing ? "Wait..." : "Jama Karein"}
            </button>
          </div>
        </div>
      )}

      {/* ─── TABS NAVIGATION ─── */}
      <div className="flex space-x-2 border-b border-gray-200 mb-6 overflow-x-auto pb-1">
        <button onClick={() => setActiveTab("transactions")} className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === "transactions" ? "border-emerald-500 text-emerald-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
          <ReceiptText size={18} /> Parchi Logs (Bills)
        </button>
        <button onClick={() => setActiveTab("credits")} className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === "credits" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
          <ArrowDownToLine size={18} /> Jama Details (Credits)
        </button>
        <button onClick={() => setActiveTab("analytics")} className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === "analytics" ? "border-amber-500 text-amber-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
          <TrendingUp size={18} /> Business Summary
        </button>
      </div>

      {/* ─── TAB CONTENT ─── */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        
        {/* TAB 1: PARCHI LOGS */}
        {activeTab === "transactions" && (
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gray-100">
            {profile.orders.length === 0 && <p className="text-gray-400 font-medium text-center py-10">Koi parchi nahi kati hai.</p>}
            {profile.orders.map((order) => {
              const isPaid = order.status === "PAID";
              return (
                <div key={order.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 ${isPaid ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                    <ReceiptText size={16} className="text-white" />
                  </div>
                  
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-xs font-black text-gray-400 uppercase tracking-widest">
                        {new Date(order.createdAt).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}
                      </div>
                      <div className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase border ${isPaid ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                        {order.status}
                      </div>
                    </div>
                    
                    <div className="text-sm font-bold text-gray-900 mb-2 border-b border-gray-50 pb-2">Bill Generated: ₹{order.totalAmount}</div>
                    <div className="text-xs font-medium text-gray-600 space-y-1 mb-3">
                      {order.items.map(i => (
                       <div key={i.id} className="flex justify-between items-start border-b border-gray-50 last:border-0 pb-1 mb-1 last:pb-0 last:mb-0">
                      <div className="flex flex-col">
                       <span className="text-sm font-bold text-gray-800">• {i.product.name}</span>
                       <span className="text-[10px] text-gray-500 font-medium ml-2">{i.qty} {i.product.unit || 'Pcs'} @ ₹{i.priceAtSale}/unit</span>
                      </div>
                       <span className="font-bold text-gray-900 mt-0.5">₹{(i.qty * i.priceAtSale).toLocaleString('en-IN')}</span>
                    </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-xs font-black bg-gray-50 p-2 rounded-lg">
                      <span className="text-emerald-600">Paid: ₹{order.paidAmount}</span>
                      <span className="text-rose-600">Due: ₹{order.totalAmount - order.paidAmount}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: CREDITS (JAMA DETAILS WITH ON-DEMAND FETCHING) */}
        {activeTab === "credits" && (
          <div>
            {creditLogs.length === 0 ? (
               <p className="text-gray-400 font-medium text-center py-10">Abhi tak koi paisa jama nahi kiya gaya.</p>
            ) : (
              <div className="space-y-3">
                {creditLogs.map(payment => (
                  <div key={payment.id} className="flex justify-between items-center bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                        <ArrowDownToLine size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-sm">Payment Received</div>
                        <div className="text-xs font-bold text-gray-400 mt-0.5">
                           {new Date(payment.createdAt).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                    <div className="font-black text-xl text-indigo-600">+ ₹{payment.amount}</div>
                  </div>
                ))}
              </div>
            )}
            
            {/* On-Demand Fetching Button */}
            {hasMoreCredits && (
              <div className="mt-6 text-center">
                <button 
                  onClick={() => {
                    const nextPage = creditPage + 1;
                    setCreditPage(nextPage);
                    fetchCreditLogs(nextPage);
                  }}
                  disabled={loadingCredits}
                  className="text-indigo-600 font-bold text-sm hover:underline disabled:opacity-50"
                >
                  {loadingCredits ? "Loading..." : "Load Older Payments ⬇"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BUSINESS SUMMARY (BONUS FEATURE) */}
        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-3xl border border-amber-100">
               <Layers className="text-amber-500 mb-3" size={24} />
               <div className="text-sm font-bold text-gray-600">Total Purchase Frequency</div>
               <div className="text-3xl font-black text-gray-900 mt-1">{profile.orders.length} <span className="text-lg font-medium text-gray-500">bills generated</span></div>
               <p className="text-xs text-gray-500 mt-2 font-medium">Yeh kisaan dukaan se {profile.orders.length} baar samaan le ja chuka hai.</p>
             </div>
             <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-3xl border border-emerald-100">
               <TrendingUp className="text-emerald-500 mb-3" size={24} />
               <div className="text-sm font-bold text-gray-600">Average Bill Value</div>
               <div className="text-3xl font-black text-gray-900 mt-1">
                 ₹{profile.orders.length > 0 ? Math.round(profile.totalPurchased / profile.orders.length).toLocaleString('en-IN') : 0}
               </div>
               <p className="text-xs text-gray-500 mt-2 font-medium">Har baar aane par lagbhag itne rupaye ka samaan lete hain.</p>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}