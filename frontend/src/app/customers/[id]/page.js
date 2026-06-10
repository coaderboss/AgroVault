"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Wallet, ReceiptText, Phone, MapPin, 
  ArrowDownToLine, TrendingUp, Layers, Search, 
  Undo2, AlertCircle, CheckCircle2, X, User, Check
} from "lucide-react";
import Cookies from "js-cookie";

export default function CustomerProfile() {
  const { id } = useParams();
  const router = useRouter();
  
  // ─── ALERTS & UI STATES ───
  const [alertInfo, setAlertInfo] = useState({ show: false, type: "", message: "" });
  const showPremiumAlert = (type, message) => {
    setAlertInfo({ show: true, type, message });
    setTimeout(() => setAlertInfo({ show: false, type: "", message: "" }), 4000);
  };

  // ─── SAMAAN WAPSI (RETURN) STATES ───
  const [returnModal, setReturnModal] = useState({ show: false, order: null });
  const [returnFormData, setReturnFormData] = useState({ refundAmount: "", reason: "" });
  const [returnItemSelections, setReturnItemSelections] = useState({});
  const [isReturning, setIsReturning] = useState(false);
  
  // ─── DATA STATES ───
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("transactions"); 
  const [searchQuery, setSearchQuery] = useState("");
  
  // ─── PAYMENT STATES ───
  const [bulkPayAmount, setBulkPayAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // ─── PAGINATION STATES ───
  const [creditLogs, setCreditLogs] = useState([]);
  const [creditPage, setCreditPage] = useState(1);
  const [hasMoreCredits, setHasMoreCredits] = useState(true);
  const [loadingCredits, setLoadingCredits] = useState(false);

  const fetchProfile = async () => {
    try {
      const token = Cookies.get("auth_token");
      const res = await axios.get(`https://agrovault.onrender.com/api/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
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
      const token = Cookies.get("auth_token");
      const res = await axios.get(`https://agrovault.onrender.com/api/customers/${id}/payments?page=${pageToFetch}&limit=5`, {
        headers: { Authorization: `Bearer ${token}` }
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

  // ─── SMART SEARCH ENGINE ───
  const filteredOrders = profile?.orders?.filter(order => {
    const searchLower = searchQuery.toLowerCase();
    const billNo = order.id.slice(-6).toLowerCase();
    return billNo.includes(searchLower);
  }) || [];

  const handleBulkPayment = async () => {
    if (!bulkPayAmount || Number(bulkPayAmount) <= 0) return showPremiumAlert("error", "Sahi amount daalein!");
    if (Number(bulkPayAmount) > profile.totalDue) return showPremiumAlert("error", "Udhaar se zyada paisa jama kar rahe ho!");

    setIsProcessing(true);
    try {
      const token = Cookies.get("auth_token");
      await axios.post(`https://agrovault.onrender.com/api/customers/${id}/bulk-pay`, 
        { amount: Number(bulkPayAmount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBulkPayAmount(""); 
      await fetchProfile(); 
      fetchCreditLogs(1); 
      setActiveTab("credits"); 
      showPremiumAlert("success", "Paisa successfully jama ho gaya!");
    } catch (error) {
      showPremiumAlert("error", "Payment fail ho gayi!");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    setIsReturning(true);
    try {
      const itemsToReturn = returnModal.order.items
        .filter(item => returnItemSelections[item.productId] > 0)
        .map(item => ({
            productId: item.productId,
            qty: returnItemSelections[item.productId],
            returnPrice: item.priceAtSale,
            enteredQty: returnItemSelections[item.productId],
            enteredUnit: item.enteredUnit
        }));

      if (itemsToReturn.length === 0 && !returnFormData.refundAmount) {
        showPremiumAlert("error", "Kam se kam ek item ya amount toh select karein!");
        setIsReturning(false); 
        return;
      }

      const token = Cookies.get("auth_token");
      await axios.post('https://agrovault.onrender.com/api/returns', {
        orderId: returnModal.order.id,
        returnItems: itemsToReturn,
        refundAmount: Number(returnFormData.refundAmount) || 0,
        reason: returnFormData.reason || "Customer Return"
      }, { headers: { Authorization: `Bearer ${token}` } });

      showPremiumAlert("success", "Samaan wapsi aur stock successfully update ho gaya!");
      setReturnModal({ show: false, order: null });
      setReturnFormData({ refundAmount: "", reason: "" });
      setReturnItemSelections({});
      fetchProfile(); 
    } catch (err) {
      showPremiumAlert("error", "Wapsi record karne mein dikkat aayi.");
    } finally {
      setIsReturning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[70dvh] items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-gray-400 font-bold tracking-widest text-[10px] uppercase">Loading Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-24 md:pb-12 animate-in fade-in duration-500 relative">

      {/* ─── GLOBAL ALERT BANNER ─── */}
      <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[150] transition-all duration-500 ease-in-out transform w-11/12 md:w-auto min-w-[300px] ${alertInfo.show ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0 pointer-events-none"}`}>
        <div className={`p-4 rounded-2xl shadow-xl flex items-start gap-3 border ${alertInfo.type === "error" ? "bg-rose-50 border-rose-200" : "bg-emerald-50 border-emerald-200"}`}>
          {alertInfo.type === "error" ? <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={20} /> : <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={20} />}
          <div>
            <h4 className={`text-sm font-black ${alertInfo.type === "error" ? "text-rose-900" : "text-emerald-900"}`}>{alertInfo.type === "error" ? "Action Failed" : "Success"}</h4>
            <p className={`text-xs font-bold mt-0.5 ${alertInfo.type === "error" ? "text-rose-700" : "text-emerald-700"}`}>{alertInfo.message}</p>
          </div>
        </div>
      </div>
      
      {/* ─── PREMIUM CUSTOMER HEADER ─── */}
      <div className="bg-white p-5 md:p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        
        <div className="flex items-center gap-4 relative z-10">
          <button onClick={() => router.push('/customers')} className="w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors shrink-0">
            <ArrowLeft size={18} />
          </button>
          <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 border border-emerald-200 shadow-sm">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-none mb-1.5">{profile.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-gray-500">
              <span className="flex items-center gap-1.5"><MapPin size={12} className="text-gray-400"/> {profile.village}</span>
              <span className="flex items-center gap-1.5"><Phone size={12} className="text-gray-400"/> +91 {profile.mobile}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── METRICS MATRIX ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 md:p-6 rounded-[1.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className={`absolute top-0 left-0 w-1 h-full ${profile.totalDue > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Total Market Due</div>
          <div className={`text-3xl font-black ${profile.totalDue > 0 ? 'text-rose-600' : 'text-emerald-600'} tracking-tighter`}>
            ₹{profile.totalDue.toLocaleString('en-IN')}
          </div>
          <Wallet size={60} className={`absolute -bottom-4 -right-2 opacity-[0.04] transition-transform group-hover:scale-110 ${profile.totalDue > 0 ? 'text-rose-900' : 'text-emerald-900'}`} />
        </div>
        <div className="bg-white p-5 md:p-6 rounded-[1.5rem] border border-gray-100 shadow-sm">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Total Purchased</div>
          <div className="text-2xl font-black text-gray-800 tracking-tight">₹{profile.totalPurchased.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white p-5 md:p-6 rounded-[1.5rem] border border-gray-100 shadow-sm">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Total Paid</div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight">₹{profile.totalPaid.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* ─── BULK PAYMENT ACTION CARD ─── */}
      {profile.totalDue > 0 && (
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-[1.5rem] p-5 md:p-6 mb-8 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-5 border border-gray-700">
          <div>
            <h4 className="font-black text-white text-sm md:text-base flex items-center gap-2"><Wallet size={16} className="text-emerald-400"/> Clear Outstanding Dues</h4>
            <p className="text-[11px] md:text-xs text-gray-400 font-bold mt-1">Paise jama karein, system apne aap purani parchiyan clear kar dega.</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">₹</span>
              <input 
                type="number" placeholder="Enter amount..."
                value={bulkPayAmount} onChange={(e) => setBulkPayAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl font-black text-white outline-none focus:border-emerald-400 placeholder-gray-500 text-sm transition-colors"
              />
            </div>
            <button 
              onClick={handleBulkPayment} disabled={isProcessing}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-6 py-3 rounded-xl shadow-md transition-all active:scale-95 flex justify-center items-center gap-2 text-sm disabled:opacity-70"
            >
              {isProcessing ? "Processing..." : "Deposit"}
            </button>
          </div>
        </div>
      )}

      {/* ─── TABS NAVIGATION ─── */}
      <div className="flex space-x-1 border-b border-gray-200 mb-6 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <button onClick={() => setActiveTab("transactions")} className={`flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-black border-b-2 transition-all whitespace-nowrap ${activeTab === "transactions" ? "border-emerald-500 text-emerald-600 bg-emerald-50/50 rounded-t-xl" : "border-transparent text-gray-500 hover:text-gray-900"}`}>
          <ReceiptText size={16} /> Ledger Logs
        </button>
        <button onClick={() => setActiveTab("credits")} className={`flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-black border-b-2 transition-all whitespace-nowrap ${activeTab === "credits" ? "border-indigo-500 text-indigo-600 bg-indigo-50/50 rounded-t-xl" : "border-transparent text-gray-500 hover:text-gray-900"}`}>
          <ArrowDownToLine size={16} /> Jama History
        </button>
        <button onClick={() => setActiveTab("analytics")} className={`flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-black border-b-2 transition-all whitespace-nowrap ${activeTab === "analytics" ? "border-amber-500 text-amber-600 bg-amber-50/50 rounded-t-xl" : "border-transparent text-gray-500 hover:text-gray-900"}`}>
          <TrendingUp size={16} /> Analytics
        </button>
      </div>

      {/* ─── TAB CONTENT ─── */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {/* TAB 1: PARCHI LOGS */}
        {activeTab === "transactions" && (
          <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm p-4 md:p-6">
            <div className="mb-6 bg-gray-50 p-2.5 rounded-xl border border-gray-200 flex items-center shadow-inner">
              <Search size={18} className="text-gray-400 mx-3 shrink-0" />
              <input 
                type="text" 
                placeholder="Search invoice by #BillNo..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-sm font-bold text-gray-800 placeholder-gray-400"
              />
            </div>

            <div className="space-y-6">
              {filteredOrders.length === 0 && <p className="text-gray-400 font-bold text-center py-10">Koi parchi nahi mili.</p>}
              
              {filteredOrders.map((order) => {
                const isPaid = order.status === "PAID";
                return (
                  // FIXED DIV STRUCTURE: Left aligned clean timeline
                  <div key={order.id} className="relative flex items-start gap-4 md:gap-5 group">
                    <div className="flex flex-col items-center">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shrink-0 shadow-sm z-10 ${isPaid ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                        <ReceiptText size={14} className="text-white" />
                      </div>
                      <div className="w-[2px] h-full bg-gray-100 absolute top-10 -z-0"></div>
                    </div>
                    
                    <div className="flex-1 bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group-hover:border-gray-200 mb-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-50">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="inline-block px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-700 font-black text-[10px] uppercase tracking-widest rounded-md shadow-sm">
                              #{order.id.slice(-6)}
                            </span>
                            <span className="text-xs font-bold text-gray-400">
                              {new Date(order.createdAt).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          <div className="text-sm font-black text-gray-900 mt-2">Bill Amount: ₹{order.totalAmount.toLocaleString('en-IN')}</div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {order.status !== "CANCELLED" && (
                            <button 
                              onClick={() => {
                                setReturnModal({ show: true, order });
                                const initialSelections = {};
                                order.items.forEach(i => initialSelections[i.productId] = 0);
                                setReturnItemSelections(initialSelections);
                              }}
                              className="text-[10px] font-black text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                            >
                              <Undo2 size={12}/> Return
                            </button>
                          )}
                          <div className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest border shadow-sm ${isPaid ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                            {order.status}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs font-bold text-gray-600 space-y-2 mb-4">
                        {order.items.map(i => (
                          <div key={i.id} className="flex justify-between items-start bg-gray-50/50 p-2 rounded-lg border border-gray-50">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-gray-800">{i.product.name}</span>
                              <span className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">{i.qty} {i.enteredUnit || 'Unit'} @ ₹{i.priceAtSale}/unit</span>
                            </div>
                            <span className="font-black text-gray-900">₹{(i.qty * i.priceAtSale).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-between text-xs font-black bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <span className="text-emerald-600 flex items-center gap-1"><Check size={14}/> Paid: ₹{order.paidAmount.toLocaleString('en-IN')}</span>
                        <span className="text-rose-600 flex items-center gap-1">Due: ₹{(order.totalAmount - order.paidAmount).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: CREDITS */}
        {activeTab === "credits" && (
          <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm p-4 md:p-6">
            {creditLogs.length === 0 ? (
               <p className="text-gray-400 font-bold text-center py-10">Abhi tak koi paisa jama nahi kiya gaya.</p>
            ) : (
              <div className="space-y-3">
                {creditLogs.map(payment => (
                  <div key={payment.id} className="flex justify-between items-center bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                        <ArrowDownToLine size={18} />
                      </div>
                      <div>
                        <div className="font-black text-gray-900 text-sm">Payment Received</div>
                        <div className="text-xs font-bold text-gray-400 mt-0.5 uppercase tracking-widest">
                           {new Date(payment.createdAt).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                    <div className="font-black text-xl text-indigo-600">+ ₹{payment.amount.toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </div>
            )}
            
            {hasMoreCredits && (
              <div className="mt-6 text-center">
                <button 
                  onClick={() => {
                    const nextPage = creditPage + 1;
                    setCreditPage(nextPage);
                    fetchCreditLogs(nextPage);
                  }}
                  disabled={loadingCredits}
                  className="bg-gray-50 border border-gray-200 text-gray-600 font-black text-xs uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {loadingCredits ? "Loading..." : "Load Older Payments ⬇"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ANALYTICS */}
        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:border-amber-200 transition-colors">
               <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-50 rounded-full blur-2xl group-hover:bg-amber-100 transition-colors"></div>
               <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4 border border-amber-100">
                 <Layers size={20} />
               </div>
               <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Purchase Frequency</div>
               <div className="text-3xl font-black text-gray-900 mt-1">{profile.orders.length} <span className="text-sm font-bold text-gray-400">bills</span></div>
             </div>
             
             <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
               <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-50 rounded-full blur-2xl group-hover:bg-emerald-100 transition-colors"></div>
               <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100">
                 <TrendingUp size={20} />
               </div>
               <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Average Bill Value</div>
               <div className="text-3xl font-black text-gray-900 mt-1">
                 ₹{profile.orders.length > 0 ? Math.round(profile.totalPurchased / profile.orders.length).toLocaleString('en-IN') : 0}
               </div>
             </div>
          </div>
        )}

      </div>

      {/* ─── PREMIUM SALES RETURN MODAL ─── */}
      {returnModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90dvh]">
            
            <div className="bg-amber-50 px-6 py-5 border-b border-amber-100 flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/40 rounded-full blur-xl pointer-events-none"></div>
              <div className="relative z-10">
                <h3 className="font-black text-amber-900 flex items-center gap-2 text-lg"><Undo2 size={20}/> Samaan Wapsi</h3>
                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mt-1 bg-white/50 w-fit px-2 py-0.5 rounded border border-amber-200">Bill #{returnModal.order.id.slice(-6)}</p>
              </div>
              <button onClick={() => setReturnModal({show: false, order: null})} className="text-amber-500 hover:text-amber-700 bg-white/50 hover:bg-white p-2 rounded-full transition-colors border border-amber-200 relative z-10"><X size={18}/></button>
            </div>

            <form onSubmit={handleReturnSubmit} className="p-6 flex-1 overflow-y-auto bg-gray-50/50">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><CheckCircle2 size={14}/> Select Items to Return</h4>
              
              <div className="space-y-3 mb-6 bg-white border border-gray-100 p-3 rounded-2xl shadow-sm">
                {returnModal.order.items.map(item => (
                  <div key={item.id} className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-black text-gray-800">{item.product.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Sold: {item.qty} {item.enteredUnit || 'Unit'}</p>
                    </div>
                    <div className="w-24 relative">
                      <input 
                        type="number" 
                        min="0" 
                        max={item.qty} 
                        step="any"
                        value={returnItemSelections[item.productId] || ""}
                        onChange={(e) => setReturnItemSelections({...returnItemSelections, [item.productId]: Number(e.target.value)})}
                        placeholder={`Max ${item.qty}`}
                        className="w-full px-3 py-2 text-xs font-black bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-center"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Refund / Deduct Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-lg">₹</span>
                    <input 
                      type="number" required
                      value={returnFormData.refundAmount} onChange={(e) => setReturnFormData({...returnFormData, refundAmount: e.target.value})}
                      className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-black text-lg text-gray-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-[9px] font-bold text-gray-400 mt-2">Enter the exact amount to reduce from the customer's pending due or cash refunded.</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Return Reason <span className="text-gray-300">(Optional)</span></label>
                  <input 
                    type="text" 
                    value={returnFormData.reason} onChange={(e) => setReturnFormData({...returnFormData, reason: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm text-gray-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    placeholder="e.g. Quality issue, wrong item..."
                  />
                </div>
              </div>

              <button type="submit" disabled={isReturning} className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_8px_30px_rgb(245,158,11,0.2)] transition-all active:scale-95 disabled:opacity-70 text-sm">
                {isReturning ? "Processing Return..." : "Confirm & Update Ledger"}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}