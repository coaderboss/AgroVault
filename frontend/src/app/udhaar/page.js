"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie"; // <-- Bouncer ki chaabi
import { Wallet, Search, Phone, MapPin, Receipt, CheckCircle, Clock, X, Check, Trash2, User } from "lucide-react";
export default function Ledger() {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // ─── MODAL STATE ───
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, order: null, amountInput: "" });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchUdhaar();
  }, []);

  const fetchUdhaar = async () => {
    try {
      const token = Cookies.get("auth_token"); 
      const res = await axios.get("https://agrovault.onrender.com/api/udhaar", {
        headers: { Authorization: `Bearer ${token}` } 
      });
      setPendingOrders(res.data.data);
      setLoading(false);
    } catch (error) {
      console.error("Udhaar fetch error", error);
      setLoading(false);
    }
  };

  // 👇 YEH LINE GALTI SE DELETE HO GAYI THI 👇
  const totalMarketDue = pendingOrders.reduce((total, order) => {
    return total + (order.totalAmount - order.paidAmount);
  }, 0);

  const filteredOrders = pendingOrders.filter(order => 
    order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customer.village.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCancelBill = async (orderId) => {
    const isConfirmed = window.confirm("Kya aap sach mein yeh bill cancel karna chahte hain? Samaan wapas stock mein chala jayega.");
    if (!isConfirmed) return;

    try {
      const token = Cookies.get("auth_token");
      await axios.put(`https://agrovault.onrender.com/api/orders/${orderId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert("Bill successfully cancel ho gaya!");
      fetchUdhaar(); // <-- FIX: Function ka sahi naam
    } catch (error) {
      alert(error.response?.data?.message || "Cancel karne mein error aaya");
    }
  };

  // ─── SUBMIT PAYMENT TO BACKEND (BULK PAY ENABLED) ───
  const handlePaymentSubmit = async () => {
    if (!paymentModal.amountInput || Number(paymentModal.amountInput) <= 0) {
      return alert("Kripya sahi amount dalein!");
    }

    setIsProcessing(true);
    try {
      const token = Cookies.get("auth_token"); 
      
      await axios.post(`https://agrovault.onrender.com/api/customers/${paymentModal.order.customerId}/bulk-pay`, {
        amount: Number(paymentModal.amountInput)
      }, {
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      setPaymentModal({ isOpen: false, order: null, amountInput: "" });
      await fetchUdhaar(); 
    } catch (error) {
      console.error(error);
      alert("Payment update karne mein error aagaya!");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-bold tracking-widest text-sm uppercase">Loading Ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto flex flex-col space-y-4 md:space-y-6 relative px-2 sm:px-4 md:px-0 pb-2 md:pb-10">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight">Udhaar Khata</h1>
          <p className="text-gray-500 text-xs md:text-lg font-medium mt-0.5 md:mt-1">Track and collect your pending dues.</p>
        </div>
        
        <div className="bg-rose-50 border border-rose-100 rounded-xl md:rounded-2xl p-3 md:p-5 flex items-center gap-3 md:gap-5 shadow-sm w-full md:w-auto">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/30 shrink-0">
            <Wallet size={20} className="md:w-6 md:h-6" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-rose-600 text-[10px] md:text-xs font-bold uppercase tracking-widest">Total Market Due</div>
            <div className="text-xl md:text-3xl font-black text-rose-700">₹{totalMarketDue.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="bg-white p-1 md:p-2 rounded-xl md:rounded-2xl border border-gray-200 shadow-sm flex items-center">
        <div className="px-3 md:px-4 text-gray-400"><Search size={18} className="md:w-5 md:h-5" /></div>
        <input 
          type="text" placeholder="Search customer or village..." 
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full py-2.5 md:py-3 pr-3 md:pr-4 bg-transparent outline-none font-medium text-sm md:text-base text-gray-800 placeholder-gray-400"
        />
      </div>

      {/* BILLS LIST */}
      <div className="flex flex-col pb-28 md:pb-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 md:py-20 bg-white rounded-2xl md:rounded-3xl border border-gray-100">
            <CheckCircle size={40} className="mx-auto text-emerald-400 mb-3 md:mb-4 md:w-12 md:h-12" />
            <h2 className="text-lg md:text-xl font-bold text-gray-800">All Clear!</h2>
            <p className="text-xs md:text-sm text-gray-500 mt-1">Market mein koi udhaar pending nahi hai.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-5">
            {filteredOrders.map((order) => {
              const dueAmount = order.totalAmount - order.paidAmount;
              const isPartial = order.status === "PARTIAL";

              return (
                <div key={order.id} className="bg-white rounded-2xl md:rounded-3xl border border-gray-200 shadow-sm hover:shadow-md hover:border-rose-200 transition-all overflow-hidden flex flex-col">
                  
                  <div className="p-3.5 md:p-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                    <div className="overflow-hidden pr-2">
                      <div className="font-black text-lg md:text-xl text-gray-900 truncate">{order.customer.name}</div>
                      <div className="flex items-center gap-2 md:gap-4 mt-1 md:mt-2">
                        <span className="flex items-center gap-1 text-[10px] md:text-xs font-bold text-gray-500 truncate"><MapPin size={12} className="md:w-[14px] md:h-[14px] shrink-0"/> <span className="truncate">{order.customer.village}</span></span>
                        <span className="flex items-center gap-1 text-[10px] md:text-xs font-bold text-gray-500 shrink-0"><Phone size={12} className="md:w-[14px] md:h-[14px] shrink-0"/> {order.customer.mobile}</span>
                      </div>
                    </div>
                    <div className={`shrink-0 px-2 md:px-3 py-1 rounded-md md:rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${isPartial ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-rose-100 text-rose-700 border border-rose-200'}`}>
                      <Clock size={10} className="md:w-3 md:h-3" /> {order.status}
                    </div>
                  </div>

                  <div className="p-3.5 md:p-5 flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
                      <Receipt size={14} className="text-gray-400 md:w-4 md:h-4" />
                      <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      {/* ─── NAYA: Employee ka naam kisne udhaar diya ─── */}
                      <span className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-[9px] md:text-[10px] font-bold text-gray-500 uppercase">
                        <User size={10} /> {order.createdByName || 'Owner'}
                      </span>
                    </div>
                    
                    <div className="space-y-1 md:mb-4">
                      {order.items.map(item => (
                        <div key={item.id} className="text-xs md:text-sm font-medium text-gray-700 flex justify-between">
                          <div className="flex flex-col">
                                <span className="text-xs md:text-sm font-bold">{item.product.name}</span>
                                <span className="text-[10px] md:text-xs text-gray-500 font-medium">{item.qty} {item.product.unit || 'Pcs'} @ ₹{item.priceAtSale}/unit</span>
                          </div>
                          <span className="font-bold text-gray-900">₹{(item.qty * item.priceAtSale).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3.5 md:p-5 bg-rose-50/30 border-t border-gray-100 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] md:text-xs font-bold text-gray-500">Bill: ₹{order.totalAmount} | Paid: ₹{order.paidAmount}</div>
                      <div className="text-lg md:text-2xl font-black text-rose-600 mt-0.5 md:mt-1">Due: ₹{dueAmount.toLocaleString('en-IN')}</div>
                    </div>
                    
                    {/* ─── BUTTONS LAYOUT FIX ─── */}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleCancelBill(order.id)}
                        className="p-2 md:p-3 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg md:rounded-xl transition-all shadow-sm"
                        title="Cancel Bill"
                      >
                        <Trash2 size={16} className="md:w-5 md:h-5" />
                      </button>
                      <button 
                        onClick={() => setPaymentModal({ isOpen: true, order: order, amountInput: dueAmount.toString() })}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl text-xs md:text-base shadow-sm shadow-rose-600/20 transition-all active:scale-95 whitespace-nowrap"
                      >
                        Collect Due
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── PREMIUM PAYMENT MODAL ─── */}
      {paymentModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-4 md:p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-black text-gray-900 text-base md:text-lg flex items-center gap-2">
                <Wallet size={18} className="text-emerald-500 md:w-5 md:h-5" /> Receive Payment
              </h3>
              <button onClick={() => setPaymentModal({ isOpen: false, order: null, amountInput: "" })} className="text-gray-400 hover:bg-gray-200 p-1.5 md:p-2 rounded-full transition-colors">
                <X size={18} className="md:w-5 md:h-5" />
              </button>
            </div>

            <div className="p-5 md:p-6">
              <div className="text-center mb-5 md:mb-6">
                <div className="text-[10px] md:text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Customer</div>
                <div className="text-xl md:text-2xl font-black text-gray-900">{paymentModal.order.customer.name}</div>
                <div className="text-xs md:text-sm text-gray-500 mt-1">Total Due: <span className="font-bold text-rose-600">₹{(paymentModal.order.totalAmount - paymentModal.order.paidAmount).toLocaleString()}</span></div>
              </div>

              <div>
                <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 md:mb-2 px-1">Amount Receiving (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg md:text-xl">₹</span>
                  <input 
                    type="number" 
                    value={paymentModal.amountInput}
                    onChange={(e) => setPaymentModal({...paymentModal, amountInput: e.target.value})}
                    className="w-full pl-9 md:pl-10 pr-4 py-3 md:py-4 bg-gray-50 border border-gray-200 rounded-xl md:rounded-2xl text-xl md:text-2xl text-gray-900 font-black focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-right"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 md:p-5 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button 
                onClick={() => setPaymentModal({ isOpen: false, order: null, amountInput: "" })}
                className="flex-1 py-3 md:py-4 text-sm md:text-base font-bold text-gray-600 bg-white border border-gray-200 rounded-xl md:rounded-2xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handlePaymentSubmit}
                disabled={isProcessing}
                className="flex-1 py-3 md:py-4 text-sm md:text-base font-bold text-white bg-emerald-600 rounded-xl md:rounded-2xl hover:bg-emerald-700 shadow-md shadow-emerald-600/30 transition-all flex justify-center items-center gap-2 active:scale-95 disabled:opacity-70"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <><Check size={18} className="md:w-5 md:h-5" /> Confirm</>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}