"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { 
  ArrowLeft, Factory, Phone, MapPin, Wallet, 
  ReceiptText, ArrowUpRight, Check, ShoppingCart, 
  FileText, ArrowDownLeft, Package, Trash2, AlertOctagon, X
} from "lucide-react";

export default function SupplierPassbook() {
  const { id } = useParams();
  const router = useRouter();

  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ledger"); 

  const [payAmount, setPayAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // ─── DELETE BILL STATES ───
  const [deleteModal, setDeleteModal] = useState({ show: false, billId: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSupplierDetails = async () => {
    try {
      const token = Cookies.get("auth_token");
      const res = await axios.get(`https://agrovault.onrender.com/api/suppliers/${id}`, {
        headers: { Authorization: `Bearer ${token}` } 
      });
      setSupplier(res.data.data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      router.push('/suppliers');
    }
  };

  useEffect(() => {
    fetchSupplierDetails();
  }, [id]);

  const handlePayment = async () => {
    if (!payAmount || Number(payAmount) <= 0) return alert("Please enter a valid amount.");
    
    setIsProcessing(true);
    try {
      const token = Cookies.get("auth_token"); 
      await axios.post(`https://agrovault.onrender.com/api/suppliers/${id}/pay`, 
        { amount: Number(payAmount) },
        { headers: { Authorization: `Bearer ${token}` } } 
      );
      setPayAmount("");
      await fetchSupplierDetails();
      setActiveTab("ledger"); 
    } catch (error) {
      alert("Failed to process payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── CANCEL / DELETE BILL LOGIC ───
  const confirmDeleteBill = async () => {
    setIsDeleting(true);
    try {
      const token = Cookies.get("auth_token");
      await axios.delete(`https://agrovault.onrender.com/api/purchases/${deleteModal.billId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeleteModal({ show: false, billId: null });
      await fetchSupplierDetails(); // Refresh everything
    } catch (error) {
      alert("Bill delete karne mein error aaya!");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="text-gray-400 font-bold tracking-widest text-sm uppercase">Syncing Ledger...</p>
      </div>
    </div>
  );

  // ─── FINANCIAL CALCULATIONS ───
  const totalBilled = supplier.purchases.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const paidInBills = supplier.purchases.reduce((acc, curr) => acc + curr.paidAmount, 0);
  const standalonePayments = supplier.payments.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = paidInBills + standalonePayments;
  const currentDue = totalBilled - totalPaid;

  // ─── COMBINED LEDGER (RUNNING BALANCE LOGIC) ───
  const ledgerItems = [];
  
  supplier.purchases.forEach(p => {
    ledgerItems.push({
      id: `pur_${p.id}`,
      date: new Date(p.createdAt),
      type: 'PURCHASE',
      description: `Invoice #${p.id.slice(-6).toUpperCase()}`,
      credit: p.totalAmount,
      debit: 0
    });
    if (p.paidAmount > 0) {
      ledgerItems.push({
        id: `pur_pay_${p.id}`,
        date: new Date(p.createdAt),
        type: 'ADVANCE',
        description: `Advance on Invoice #${p.id.slice(-6).toUpperCase()}`,
        credit: 0,
        debit: p.paidAmount
      });
    }
  });

  supplier.payments.forEach(p => {
    ledgerItems.push({
      id: `pay_${p.id}`,
      date: new Date(p.createdAt),
      type: 'PAYMENT',
      description: 'Payment Settled',
      credit: 0,
      debit: p.amount
    });
  });

  ledgerItems.sort((a, b) => a.date - b.date);

  let balanceTracker = 0;
  const ledgerWithBalance = ledgerItems.map(item => {
    balanceTracker += (item.credit - item.debit);
    return { ...item, balance: balanceTracker };
  }).reverse();

  return (
    <div className="max-w-5xl mx-auto pb-24 md:pb-20 animate-in fade-in duration-300 px-3 md:px-0">
      
      {/* ─── HEADER ─── */}
      <div className="flex items-start md:items-center gap-3 md:gap-4 mb-6">
        <button onClick={() => router.push('/suppliers')} className="p-2.5 mt-1 md:mt-0 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors shadow-sm shrink-0">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">{supplier.name}</h1>
          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[10px] md:text-xs font-bold text-gray-500 mt-2 uppercase tracking-widest">
            {supplier.company && (
              <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md">
                <Factory size={12}/> {supplier.company}
              </span>
            )}
            <span className="flex items-center gap-1.5"><Phone size={12}/> {supplier.mobile}</span>
            {supplier.address && <span className="flex items-center gap-1.5"><MapPin size={12}/> {supplier.address}</span>}
          </div>
        </div>
      </div>

     {/* ─── FINANCIAL METRICS (COMPACT DESIGN) ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
        
        {/* Net Payable Card (Full width on mobile, 1 column on PC) */}
        <div className="col-span-2 md:col-span-1 bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group">
          <div className="text-[9px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-1 relative z-10">Net Payable (Due)</div>
          <div className={`text-2xl md:text-4xl font-black relative z-10 ${currentDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            ₹{currentDue.toLocaleString('en-IN')}
          </div>
          <Wallet size={60} className={`absolute -bottom-2 -right-2 opacity-[0.03] md:w-[100px] md:h-[100px] ${currentDue > 0 ? 'text-rose-900' : 'text-emerald-900'}`} />
        </div>

        {/* Small Cards (Side-by-Side on mobile) */}
        <div className="bg-gray-50 p-3 md:p-6 rounded-2xl border border-gray-100 flex flex-col justify-center">
          <div className="text-[8px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Purchases (Cr)</div>
          <div className="text-sm md:text-2xl font-black text-gray-800 truncate">₹{totalBilled.toLocaleString('en-IN')}</div>
        </div>
        
        <div className="bg-gray-50 p-3 md:p-6 rounded-2xl border border-gray-100 flex flex-col justify-center">
          <div className="text-[8px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Paid (Dr)</div>
          <div className="text-sm md:text-2xl font-black text-gray-800 truncate">₹{totalPaid.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* ─── RECORD PAYMENT ACTION (COMPACT DESIGN) ─── */}
      {currentDue > 0 && (
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-4 md:p-6 mb-5 md:mb-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="font-black text-white flex items-center gap-1.5 text-base md:text-lg">
              <ArrowUpRight size={18} className="text-amber-500"/> Record Payment
            </h4>
            <p className="text-[9px] md:text-xs text-gray-400 font-bold mt-0.5 tracking-widest uppercase">Clear outstanding dues from ledger.</p>
          </div>
          
          {/* Input and Button on the same line for Mobile */}
          <div className="flex flex-row gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:w-56">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm md:text-lg">₹</span>
              <input 
                type="number" placeholder="Amount..."
                value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 md:py-3.5 bg-white/10 border border-white/20 rounded-xl font-black text-white text-sm md:text-lg outline-none focus:border-amber-500 transition-colors placeholder-gray-500"
              />
            </div>
            <button 
              onClick={handlePayment} disabled={isProcessing}
              className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-black px-4 md:px-8 py-2.5 md:py-3.5 rounded-xl shadow-md transition-all active:scale-95 flex justify-center items-center gap-1.5 whitespace-nowrap disabled:opacity-70 text-[10px] md:text-sm tracking-widest uppercase shrink-0"
            >
              {isProcessing ? "Wait..." : "Settle"}
            </button>
          </div>
        </div>
      )}

      {/* ─── TABS NAVIGATION ─── */}
      <div className="flex space-x-2 border-b border-gray-200 mb-4 md:mb-6 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <button onClick={() => setActiveTab("ledger")} className={`flex items-center gap-2 px-5 py-3 text-sm font-black border-b-2 transition-colors whitespace-nowrap uppercase tracking-widest ${activeTab === "ledger" ? "border-amber-500 text-amber-600 bg-amber-50/50 rounded-t-xl" : "border-transparent text-gray-500 hover:text-gray-900"}`}>
          <FileText size={16} /> Ledger
        </button>
        <button onClick={() => setActiveTab("purchases")} className={`flex items-center gap-2 px-5 py-3 text-sm font-black border-b-2 transition-colors whitespace-nowrap uppercase tracking-widest ${activeTab === "purchases" ? "border-amber-500 text-amber-600 bg-amber-50/50 rounded-t-xl" : "border-transparent text-gray-500 hover:text-gray-900"}`}>
          <ShoppingCart size={16} /> Invoices
        </button>
        <button onClick={() => setActiveTab("payments")} className={`flex items-center gap-2 px-5 py-3 text-sm font-black border-b-2 transition-colors whitespace-nowrap uppercase tracking-widest ${activeTab === "payments" ? "border-amber-500 text-amber-600 bg-amber-50/50 rounded-t-xl" : "border-transparent text-gray-500 hover:text-gray-900"}`}>
          <ArrowUpRight size={16} /> Payments
        </button>
      </div>

      {/* ─── TAB CONTENT ─── */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        
        {/* TAB 1: STATEMENT (LEDGER) */}
        {activeTab === "ledger" && (
          <div className="overflow-x-auto">
            {ledgerWithBalance.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                <FileText size={48} strokeWidth={1} className="mb-4 opacity-50"/>
                <p className="font-bold">No financial records found.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date & Details</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Debit (Paid)</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Credit (Billed)</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ledgerWithBalance.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${item.type === 'PURCHASE' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                            {item.type === 'PURCHASE' ? <ShoppingCart size={16}/> : <ArrowUpRight size={16}/>}
                          </div>
                          <div>
                            <div className="font-black text-gray-900 text-sm">{item.description}</div>
                            <div className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest">
                              {item.date.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-emerald-600">
                        {item.debit > 0 ? `₹${item.debit.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-rose-600">
                        {item.credit > 0 ? `₹${item.credit.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-black text-gray-900 text-base">₹{Math.abs(item.balance).toLocaleString()}</div>
                        <div className={`text-[9px] font-black uppercase mt-0.5 tracking-widest ${item.balance > 0 ? 'text-rose-500' : item.balance < 0 ? 'text-emerald-500' : 'text-gray-400'}`}>
                          {item.balance > 0 ? 'Payable' : item.balance < 0 ? 'Advance' : 'Settled'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 2: PURCHASE INVOICES (COMPACT & HORIZONTAL SCROLL) */}
        {activeTab === "purchases" && (
          <div className="p-3 md:p-6 space-y-4 md:space-y-5 bg-gray-50/30">
            {supplier.purchases.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                <ShoppingCart size={48} strokeWidth={1} className="mb-4 opacity-50"/>
                <p className="font-bold text-sm uppercase tracking-widest">No purchase invoices</p>
              </div>
            )}
            
            {supplier.purchases.map((bill) => (
              <div key={bill.id} className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col">
                
               {/* ─── COMPACT INVOICE HEADER ─── */}
                <div className="flex flex-wrap sm:flex-nowrap justify-between items-start gap-x-2 gap-y-3 mb-4 border-b border-gray-100 pb-3">
                  
                  {/* Left Side: Invoice Details */}
                  <div className="flex items-start gap-2.5 flex-1 min-w-[55%]">
                    <div className="w-8 h-8 md:w-12 md:h-12 bg-amber-50 border border-amber-100 text-amber-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-sm shrink-0">
                      <ReceiptText size={16} className="md:w-5 md:h-5" />
                    </div>
                    <div className="overflow-hidden w-full">
                      <h3 className="font-black text-gray-900 text-sm md:text-lg truncate">Invoice #{bill.id.slice(-6).toUpperCase()}</h3>
                      <div className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 truncate">
                         {new Date(bill.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Total Amount (Ab sirf ek hi baar aayega) */}
                  <div className="text-right shrink-0 ml-auto mt-0.5 sm:mt-0">
                    <div className="font-black text-base md:text-2xl text-gray-900">₹{bill.totalAmount.toLocaleString('en-IN')}</div>
                    <div className="text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mt-0.5">
                      Paid: <span className="text-emerald-600">₹{bill.paidAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  
                </div>

                {/* ─── HORIZONTAL SCROLL ITEMS ─── */}
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Package size={12} className="md:w-[14px] md:h-[14px]" /> Items Purchased
                  </div>
                  {/* COMPACT DELETE BUTTON */}
                  <button 
                    onClick={() => setDeleteModal({ show: true, billId: bill.id })}
                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors border border-rose-100 flex items-center gap-1 shadow-sm active:scale-95"
                    title="Delete Invoice"
                  >
                    <Trash2 size={12} /> <span className="text-[9px] font-black uppercase tracking-widest">Delete</span>
                  </button>
                </div>

                <div className="flex overflow-x-auto gap-2.5 pb-2 pt-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {bill.items && bill.items.map(item => {
                    const baseName = item.product ? item.product.name : 'Unknown Product';
                    const prodName = item.customLabel || baseName;
                    const baseUnitText = item.product?.unit || "Unit";
                    
                    const displayUnit = item.enteredUnit && item.enteredUnit !== "Base" ? item.enteredUnit : baseUnitText;
                    const displayRate = item.enteredPrice || item.buyPrice;
                    const displayQty = item.enteredQty || item.qty;
                    
                    const itemTotal = item.enteredPrice ? (item.enteredQty * item.enteredPrice) : (item.qty * item.buyPrice);
                    const showSubtext = item.enteredUnit && item.enteredUnit !== "Base" && item.enteredUnit !== "KG" && item.enteredUnit !== "Gram" && item.enteredUnit !== "Ltr" && item.enteredUnit !== "ml";

                    return (
                      <div key={item.id} className="bg-gray-50 border border-gray-100 rounded-xl p-3 shrink-0 min-w-[140px] max-w-[180px] flex flex-col justify-between">
                        <div>
                          <div className="font-black text-xs text-gray-900 truncate" title={prodName}>{prodName}</div>
                          {item.customLabel && <div className="text-[8px] text-gray-400 uppercase tracking-widest mt-0.5 truncate">Base: {baseName}</div>}
                          
                          <div className="text-[9px] font-bold text-gray-500 mt-1.5 flex flex-wrap items-center gap-1 uppercase tracking-widest">
                             <span className="bg-white px-1.5 py-0.5 rounded border border-gray-200 text-amber-700 font-black shadow-sm">
                               {displayQty} {displayUnit}
                             </span>
                             {showSubtext && <span className="text-[8px]">(Total {item.qty}{baseUnitText})</span>}
                          </div>
                        </div>
                        <div className="mt-3 text-right">
                          <div className="font-black text-sm text-gray-900">₹{itemTotal.toLocaleString('en-IN')}</div>
                          <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">@ ₹{displayRate.toLocaleString('en-IN')}/{displayUnit}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            ))}
          </div>
        )}

        {/* TAB 3: PAYMENT RECORDS */}
        {activeTab === "payments" && (
          <div className="p-4 md:p-6 space-y-3 bg-gray-50/30">
            {supplier.payments.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                 <ArrowUpRight size={48} strokeWidth={1} className="mb-4 opacity-50"/>
                 <p className="font-bold">No payment records found.</p>
               </div>
            ) : (
              supplier.payments.map(payment => (
                <div key={payment.id} className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-emerald-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                      <ArrowUpRight size={18} />
                    </div>
                    <div>
                      <div className="font-black text-gray-900 text-sm">Payment Sent</div>
                      <div className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest">
                         {new Date(payment.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                  <div className="font-black text-xl text-emerald-600">₹{payment.amount.toLocaleString('en-IN')}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ─── DANGER ZONE: DELETE BILL MODAL ─── */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col border border-rose-100">
            
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-rose-100">
                <AlertOctagon size={32} />
              </div>
              <h3 className="font-black text-gray-900 text-xl mb-2">Delete Invoice?</h3>
              <p className="text-xs font-bold text-gray-500 leading-relaxed">
                Kya aap waqai is parchi ko delete karna chahte hain? Isme se aaya hua <span className="text-rose-600 font-black">Stock Godam se wapas nikal jayega</span> aur Khata theek ho jayega.
              </p>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button 
                onClick={() => setDeleteModal({ show: false, billId: null })}
                disabled={isDeleting}
                className="flex-1 py-3.5 font-black text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest text-xs disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteBill}
                disabled={isDeleting}
                className="flex-[1.5] py-3.5 font-black text-white bg-rose-600 rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-600/30 transition-all flex justify-center items-center gap-2 active:scale-95 disabled:opacity-70 uppercase tracking-widest text-xs"
              >
                {isDeleting ? "Deleting..." : <><Trash2 size={16} /> Yes, Delete</>}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}