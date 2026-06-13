"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { 
  Wallet, Search, Phone, MapPin, Receipt, CheckCircle, 
  Clock, X, Check, Trash2, User, Package, AlertTriangle, CheckCircle2, MessageCircle 
} from "lucide-react";

export default function Ledger() {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // ─── PREMIUM ALERTS & MODALS STATE ───
  const [localAlert, setLocalAlert] = useState({ show: false, type: "", message: "" });
  const [cancelConfirm, setCancelConfirm] = useState({ show: false, orderId: null });
  const [isCancelling, setIsCancelling] = useState(false);
  
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

  const showLocalAlert = (type, message) => {
    setLocalAlert({ show: true, type, message });
    setTimeout(() => setLocalAlert({ show: false, type: "", message: "" }), 4000);
  };

  const totalMarketDue = pendingOrders.reduce((total, order) => {
    return total + (order.totalAmount - order.paidAmount);
  }, 0);

  // ─── SMART SEARCH ENGINE ───
  const filteredOrders = pendingOrders.filter(order => {
    const searchLower = searchQuery.toLowerCase();
    const billNo = order.id.slice(-6).toLowerCase(); 
    
    return (
      order.customer.name.toLowerCase().includes(searchLower) ||
      order.customer.village.toLowerCase().includes(searchLower) ||
      billNo.includes(searchLower) 
    );
  });

  // ─── CUSTOM CANCEL BILL LOGIC ───
  const triggerCancel = (orderId) => {
    setCancelConfirm({ show: true, orderId });
  };

  const confirmCancelBill = async () => {
    if (!cancelConfirm.orderId) return;
    setIsCancelling(true);

    try {
      const token = Cookies.get("auth_token");
      await axios.put(`https://agrovault.onrender.com/api/orders/${cancelConfirm.orderId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showLocalAlert("success", "Bill successfully void ho gaya aur stock wapas jud gaya!");
      fetchUdhaar(); 
    } catch (error) {
      showLocalAlert("error", error.response?.data?.message || "Cancel karne mein error aaya!");
    } finally {
      setIsCancelling(false);
      setCancelConfirm({ show: false, orderId: null });
    }
  };

  // ─── SUBMIT PAYMENT LOGIC ───
  const handlePaymentSubmit = async () => {
    if (!paymentModal.amountInput || Number(paymentModal.amountInput) <= 0) {
      return showLocalAlert("error", "Kripya sahi amount dalein!");
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
      showLocalAlert("success", "Payment successfully update ho gayi!");
      await fetchUdhaar(); 
    } catch (error) {
      console.error(error);
      showLocalAlert("error", "Payment update karne mein error aagaya!");
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── SMART WHATSAPP REMINDER LOGIC ───
  const sendWhatsAppReminder = (order) => {
    const dueAmount = order.totalAmount - order.paidAmount;
    
    // Ekdum professional aur desi touch wala message
    const text = `Namaskar ${order.customer.name} ji, 🙏\n\n` +
                 `Aapka humari dukaan par ek hisaab baaki hai.\n` +
                 `📄 Bill No: #${order.id.slice(-6).toUpperCase()}\n` +
                 `💰 Total Bill: ₹${order.totalAmount}\n` +
                 `✅ Jama Kiya: ₹${order.paidAmount}\n` +
                 `🔴 *Baaki Udhaar (Due): ₹${dueAmount}*\n\n` +
                 `Kripya apna udhaar samay par clear karein. Dhanyawad! 🌾`;
    
    const phone = order.customer.mobile;
    
    if(phone && phone.length === 10) {
      // Direct WhatsApp open karne ka link (Phone par app mein khulega, PC par WhatsApp Web)
      const url = `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    } else {
      showLocalAlert("error", "Kisaan ka mobile number theek nahi hai, WhatsApp nahi bhej sakte.");
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

      {/* ─── PREMIUM LOCAL ALERT BANNER ─── */}
      <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[300] transition-all duration-500 ease-in-out transform w-11/12 md:w-auto min-w-[300px] ${localAlert.show ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0 pointer-events-none"}`}>
        <div className={`p-4 rounded-2xl shadow-xl flex items-start gap-3 border ${localAlert.type === "error" ? "bg-rose-50 border-rose-200" : "bg-emerald-50 border-emerald-200"}`}>
          {localAlert.type === "error" ? <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={20} /> : <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={20} />}
          <div>
            <h4 className={`text-sm font-black ${localAlert.type === "error" ? "text-rose-900" : "text-emerald-900"}`}>{localAlert.type === "error" ? "Action Failed" : "Success"}</h4>
            <p className={`text-xs font-bold mt-0.5 ${localAlert.type === "error" ? "text-rose-700" : "text-emerald-700"}`}>{localAlert.message}</p>
          </div>
        </div>
      </div>

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
          type="text" placeholder="Search customer, village or bill no..." 
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full py-2.5 md:py-3 pr-3 md:pr-4 bg-transparent outline-none font-medium text-sm md:text-base text-gray-800 placeholder-gray-400"
        />
      </div>

      {/* BILLS LIST (COMPACT UI) */}
      <div className="flex flex-col pb-28 md:pb-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 md:py-20 bg-white rounded-2xl md:rounded-3xl border border-gray-100">
            <CheckCircle size={40} className="mx-auto text-emerald-400 mb-3 md:mb-4 md:w-12 md:h-12" />
            <h2 className="text-lg md:text-xl font-bold text-gray-800">All Clear!</h2>
            <p className="text-xs md:text-sm text-gray-500 mt-1">Market mein koi udhaar pending nahi hai.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 md:gap-4">
            {filteredOrders.map((order) => {
              const dueAmount = order.totalAmount - order.paidAmount;
              const isPartial = order.status === "PARTIAL";

              return (
                <div key={order.id} className="bg-white rounded-2xl md:rounded-3xl border border-gray-200 shadow-sm hover:shadow-md hover:border-rose-200 transition-all overflow-hidden flex flex-col">
                  
                  {/* CARD HEADER */}
                  <div className="p-3 md:p-4 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                    <div className="overflow-hidden pr-2">
                      <div className="flex items-center gap-2">
                        <div className="font-black text-base md:text-lg text-gray-900 truncate">{order.customer.name}</div>
                        <span className="px-1.5 py-0.5 bg-white border border-gray-200 text-gray-500 font-black text-[9px] uppercase tracking-widest rounded shadow-sm">
                          #{order.id.slice(-6)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[9px] md:text-[10px] font-bold text-gray-500 truncate"><MapPin size={10} className="shrink-0"/> <span className="truncate">{order.customer.village}</span></span>
                        <span className="flex items-center gap-1 text-[9px] md:text-[10px] font-bold text-gray-500 shrink-0"><Phone size={10} className="shrink-0"/> {order.customer.mobile}</span>
                      </div>
                    </div>
                    <div className={`shrink-0 px-2 py-1 rounded-md md:rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${isPartial ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-rose-100 text-rose-700 border border-rose-200'}`}>
                      <Clock size={10} /> {order.status}
                    </div>
                  </div>

                  {/* CARD BODY (HORIZONTAL ITEMS SCROLL) */}
                  <div className="p-3 md:p-4 flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 mb-2 md:mb-3">
                      <Receipt size={12} className="text-gray-400" />
                      <span className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="ml-auto flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 rounded text-[8px] md:text-[9px] font-bold text-gray-500 uppercase">
                        <User size={10} /> {order.createdByName || 'Owner'}
                      </span>
                    </div>
                    
                    {/* THE HORIZONTAL SCROLL AREA */}
                    <div className="mt-1">
                      <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Package size={10}/> Items Purchased</div>
                      <div className="flex overflow-x-auto gap-2 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {order.items.map(item => {
                           const displayQty = item.enteredQty || item.qty;
                           const displayUnit = item.enteredUnit || item.product.unit || 'Pcs';
                           const displayPrice = item.enteredPrice || item.priceAtSale;
                           const displayName = item.customLabel || item.product.name;
                           
                           return (
                              <div key={item.id} className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 shrink-0 min-w-[130px] max-w-[160px] flex flex-col justify-between">
                                <div>
                                  <div className="font-black text-[11px] text-gray-900 truncate leading-tight" title={displayName}>{displayName}</div>
                                  <div className="text-[9px] font-bold text-gray-500 mt-0.5">
                                    {displayQty} {displayUnit} <span className="font-medium text-gray-400">@ ₹{displayPrice}</span>
                                  </div>
                                </div>
                                <div className="font-black text-gray-800 text-sm mt-2 text-right">
                                  ₹{(displayQty * displayPrice).toLocaleString('en-IN')}
                                </div>
                              </div>
                           );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* CARD FOOTER */}
                  <div className="p-3 md:p-4 bg-rose-50/30 border-t border-gray-100 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[9px] md:text-[10px] font-bold text-gray-500">Bill: ₹{order.totalAmount} | Paid: ₹{order.paidAmount}</div>
                      <div className="text-base md:text-xl font-black text-rose-600 mt-0.5">Due: ₹{dueAmount.toLocaleString('en-IN')}</div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <button 
                        onClick={() => triggerCancel(order.id)}
                        className="p-2 md:p-2.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg transition-all shadow-sm active:scale-95"
                        title="Cancel Bill"
                      >
                        <Trash2 size={16} />
                      </button>
                      
                      {/* NAYA WHATSAPP BUTTON */}
                      <button 
                        onClick={() => sendWhatsAppReminder(order)}
                        className="p-2 md:p-2.5 bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all shadow-sm active:scale-95"
                        title="Send WhatsApp Reminder"
                      >
                        <MessageCircle size={16} />
                      </button>

                      <button 
                        onClick={() => setPaymentModal({ isOpen: true, order: order, amountInput: dueAmount.toString() })}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-black px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-[10px] md:text-sm shadow-sm shadow-rose-600/20 transition-all active:scale-95 whitespace-nowrap uppercase tracking-widest"
                      >
                        Collect
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── DANGER: CUSTOM CANCEL CONFIRMATION MODAL ─── */}
      {cancelConfirm.show && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 p-6 text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-rose-100">
              <Trash2 size={28} className="text-rose-600" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Void this Bill?</h3>
            <p className="text-xs font-bold text-gray-500 mb-6 px-2">Kisaan ka bill cancel ho jayega, udhaar kam ho jayega aur bika hua samaan Godown mein wapas jud jayega.</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setCancelConfirm({ show: false, orderId: null })} disabled={isCancelling}
                className="flex-1 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-black text-gray-600 hover:bg-gray-100 transition-colors uppercase tracking-widest"
              >
                Cancel
              </button>
              <button 
                onClick={confirmCancelBill} disabled={isCancelling}
                className="flex-1 py-3.5 bg-rose-600 rounded-xl text-xs font-black text-white hover:bg-rose-700 shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 uppercase tracking-widest active:scale-95"
              >
                {isCancelling ? "Voiding..." : "Yes, Void Bill"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PREMIUM PAYMENT MODAL ─── */}
      {paymentModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-4 md:p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-black text-gray-900 text-base md:text-lg flex items-center gap-2">
                <Wallet size={18} className="text-emerald-500" /> Receive Payment
              </h3>
              <button onClick={() => setPaymentModal({ isOpen: false, order: null, amountInput: "" })} className="text-gray-400 hover:bg-gray-200 p-1.5 md:p-2 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 md:p-6">
              <div className="text-center mb-5 md:mb-6">
                <div className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Customer</div>
                <div className="text-xl md:text-2xl font-black text-gray-900 truncate">{paymentModal.order.customer.name}</div>
                <div className="text-xs md:text-sm text-gray-500 mt-1">Total Due: <span className="font-black text-rose-600">₹{(paymentModal.order.totalAmount - paymentModal.order.paidAmount).toLocaleString('en-IN')}</span></div>
              </div>

              <div>
                <label className="block text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Amount Receiving (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xl">₹</span>
                  <input 
                    type="number" 
                    value={paymentModal.amountInput}
                    onChange={(e) => setPaymentModal({...paymentModal, amountInput: e.target.value})}
                    className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-xl md:text-2xl text-gray-900 font-black focus:outline-none focus:border-emerald-500 transition-all text-right shadow-inner"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 md:p-5 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button 
                onClick={() => setPaymentModal({ isOpen: false, order: null, amountInput: "" })}
                className="flex-1 py-4 text-xs md:text-sm font-black text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest"
              >
                Cancel
              </button>
              <button 
                onClick={handlePaymentSubmit}
                disabled={isProcessing}
                className="flex-1 py-4 text-xs md:text-sm font-black text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-600/30 transition-all flex justify-center items-center gap-2 active:scale-95 disabled:opacity-70 uppercase tracking-widest"
              >
                {isProcessing ? "Processing..." : <><Check size={18} /> Confirm</>}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}