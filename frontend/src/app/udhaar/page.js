"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie"; // <-- Bouncer ki chaabi
import { Wallet, Search, Phone, MapPin, Receipt, CheckCircle, Clock, X, Check } from "lucide-react";

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
      const res = await axios.get("http://localhost:5000/api/udhaar", {
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

  // ─── SUBMIT PAYMENT TO BACKEND (BULK PAY ENABLED) ───
  const handlePaymentSubmit = async () => {
    if (!paymentModal.amountInput || Number(paymentModal.amountInput) <= 0) {
      return alert("Kripya sahi amount dalein!");
    }

    setIsProcessing(true);
    try {
      const token = Cookies.get("auth_token"); 
      
      await axios.post(`http://localhost:5000/api/customers/${paymentModal.order.customerId}/bulk-pay`, {
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
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto h-full flex flex-col space-y-6 relative">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Khata-Book</h1>
          <p className="text-gray-500 text-lg font-medium mt-1">Track and collect your pending dues.</p>
        </div>
        
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 flex items-center gap-5 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/30">
            <Wallet size={24} strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-rose-600 text-xs font-bold uppercase tracking-widest">Total Market Due</div>
            <div className="text-3xl font-black text-rose-700">₹{totalMarketDue.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm flex items-center">
        <div className="px-4 text-gray-400"><Search size={20} /></div>
        <input 
          type="text" placeholder="Search by customer name or village..." 
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full py-3 pr-4 bg-transparent outline-none font-medium text-gray-800 placeholder-gray-400"
        />
      </div>

      {/* BILLS LIST */}
      <div className="flex-1 overflow-y-auto pb-10">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
            <CheckCircle size={48} className="mx-auto text-emerald-400 mb-4" />
            <h2 className="text-xl font-bold text-gray-800">All Clear!</h2>
            <p className="text-gray-500 mt-1">Market mein koi udhaar pending nahi hai.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredOrders.map((order) => {
              const dueAmount = order.totalAmount - order.paidAmount;
              const isPartial = order.status === "PARTIAL";

              return (
                <div key={order.id} className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-md hover:border-rose-200 transition-all overflow-hidden flex flex-col">
                  
                  <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                    <div>
                      <div className="font-black text-xl text-gray-900">{order.customer.name}</div>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1 text-xs font-bold text-gray-500"><MapPin size={14} className="text-gray-400"/> {order.customer.village}</span>
                        <span className="flex items-center gap-1 text-xs font-bold text-gray-500"><Phone size={14} className="text-gray-400"/> {order.customer.mobile}</span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${isPartial ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-rose-100 text-rose-700 border border-rose-200'}`}>
                      <Clock size={12} /> {order.status}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-3">
                      <Receipt size={16} className="text-gray-400" />
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Bill Date: {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="space-y-1 mb-4">
                      {order.items.map(item => (
                        <div key={item.id} className="text-sm font-medium text-gray-700 flex justify-between">
                          <div className="flex flex-col">
                                <span className="text-sm font-bold">{item.product.name}</span>
                                <span className="text-xs text-gray-500 font-medium">{item.qty} {item.product.unit || 'Pcs'} @ ₹{item.priceAtSale}/unit</span>
                          </div>
                                <span className="font-bold text-gray-900">₹{(item.qty * item.priceAtSale).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-5 bg-rose-50/30 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-gray-500">Bill: ₹{order.totalAmount} | Paid: ₹{order.paidAmount}</div>
                      <div className="text-2xl font-black text-rose-600 mt-1">Due: ₹{dueAmount.toLocaleString('en-IN')}</div>
                    </div>
                    <button 
                      onClick={() => setPaymentModal({ isOpen: true, order: order, amountInput: dueAmount.toString() })}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-3 rounded-xl shadow-sm shadow-rose-600/20 transition-all active:scale-95"
                    >
                      Collect Due
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── PREMIUM PAYMENT MODAL ─── */}
      {paymentModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                <Wallet className="text-emerald-500" size={20} /> Receive Payment
              </h3>
              <button onClick={() => setPaymentModal({ isOpen: false, order: null, amountInput: "" })} className="text-gray-400 hover:bg-gray-200 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Customer</div>
                <div className="text-2xl font-black text-gray-900">{paymentModal.order.customer.name}</div>
                <div className="text-sm text-gray-500 mt-1">Total Due: <span className="font-bold text-rose-600">₹{(paymentModal.order.totalAmount - paymentModal.order.paidAmount).toLocaleString()}</span></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Amount Receiving (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">₹</span>
                  <input 
                    type="number" 
                    value={paymentModal.amountInput}
                    onChange={(e) => setPaymentModal({...paymentModal, amountInput: e.target.value})}
                    className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-2xl text-gray-900 font-black focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-right"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button 
                onClick={() => setPaymentModal({ isOpen: false, order: null, amountInput: "" })}
                className="flex-1 py-4 font-bold text-gray-600 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handlePaymentSubmit}
                disabled={isProcessing}
                className="flex-1 py-4 font-bold text-white bg-emerald-600 rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition-all flex justify-center items-center gap-2 active:scale-95 disabled:opacity-70"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <><Check size={20} /> Confirm Payment</>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}