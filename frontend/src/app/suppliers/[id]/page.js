"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { 
  ArrowLeft, Factory, Phone, MapPin, Wallet, 
  ReceiptText, ArrowUpRight, Check, ShoppingCart, 
  FileText, ArrowDownLeft, Package
} from "lucide-react";

export default function SupplierPassbook() {
  const { id } = useParams();
  const router = useRouter();

  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ledger"); 

  const [payAmount, setPayAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchSupplierDetails = async () => {
    try {
      const token = Cookies.get("auth_token"); // <-- Chaabi nikali
      const res = await axios.get(`http://localhost:5000/api/suppliers/${id}`, {
        headers: { Authorization: `Bearer ${token}` } // <-- Envelop bheja
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
      const token = Cookies.get("auth_token"); // <-- Chaabi nikali
      await axios.post(`http://localhost:5000/api/suppliers/${id}/pay`, 
        { amount: Number(payAmount) },
        { headers: { Authorization: `Bearer ${token}` } } // <-- Envelop bheja
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

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        <p className="text-gray-400 font-bold tracking-widest text-sm uppercase">Loading Ledger...</p>
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
      description: 'Purchase Invoice Generated',
      credit: p.totalAmount,
      debit: 0
    });
    if (p.paidAmount > 0) {
      ledgerItems.push({
        id: `pur_pay_${p.id}`,
        date: new Date(p.createdAt),
        type: 'ADVANCE',
        description: 'Initial Payment at Purchase',
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
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in duration-300">
      
      {/* ─── HEADER ─── */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.push('/suppliers')} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-gray-900 leading-tight">{supplier.name}</h1>
          <div className="flex items-center gap-4 text-sm font-bold text-gray-500 mt-1.5">
            {supplier.company && (
              <span className="flex items-center gap-1.5 text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-md">
                <Factory size={14}/> {supplier.company}
              </span>
            )}
            <span className="flex items-center gap-1.5"><Phone size={14}/> {supplier.mobile}</span>
            {supplier.address && <span className="flex items-center gap-1.5"><MapPin size={14}/> {supplier.address}</span>}
          </div>
        </div>
      </div>

      {/* ─── FINANCIAL METRICS ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden group">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">Net Payable (Due)</div>
          <div className={`text-4xl font-black relative z-10 ${currentDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            ₹{currentDue.toLocaleString('en-IN')}
          </div>
          <Wallet size={100} className={`absolute -bottom-6 -right-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 ${currentDue > 0 ? 'text-rose-900' : 'text-emerald-900'}`} />
        </div>
        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col justify-center">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Purchases (Cr)</div>
          <div className="text-2xl font-black text-gray-800">₹{totalBilled.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col justify-center">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Paid (Dr)</div>
          <div className="text-2xl font-black text-gray-800">₹{totalPaid.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* ─── RECORD PAYMENT ACTION ─── */}
      {currentDue > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-3xl p-6 mb-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-purple-900 flex items-center gap-2 text-lg">
              <ArrowUpRight size={20} className="text-purple-600"/> Record Payment
            </h4>
            <p className="text-sm text-purple-700/80 font-medium mt-1">Log a payment settlement for this supplier.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-56">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₹</span>
              <input 
                type="number" placeholder="Enter amount..."
                value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-3.5 bg-white border border-purple-200 rounded-2xl font-black text-gray-900 text-lg outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all shadow-sm"
              />
            </div>
            <button 
              onClick={handlePayment} disabled={isProcessing}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-md shadow-purple-600/20 transition-all active:scale-95 flex justify-center items-center gap-2 whitespace-nowrap disabled:opacity-70"
            >
              {isProcessing ? "Processing..." : "Settle Amount"}
            </button>
          </div>
        </div>
      )}

      {/* ─── TABS NAVIGATION ─── */}
      <div className="flex space-x-2 border-b border-gray-200 mb-6 overflow-x-auto pb-1">
        <button onClick={() => setActiveTab("ledger")} className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === "ledger" ? "border-purple-600 text-purple-700" : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"}`}>
          <FileText size={18} /> Statement (Ledger)
        </button>
        <button onClick={() => setActiveTab("purchases")} className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === "purchases" ? "border-purple-600 text-purple-700" : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"}`}>
          <ShoppingCart size={18} /> Purchase Invoices
        </button>
        <button onClick={() => setActiveTab("payments")} className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === "payments" ? "border-purple-600 text-purple-700" : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"}`}>
          <ArrowUpRight size={18} /> Payment Records
        </button>
      </div>

      {/* ─── TAB CONTENT ─── */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* TAB 1: STATEMENT (LEDGER) */}
        {activeTab === "ledger" && (
          <div className="overflow-x-auto">
            {ledgerWithBalance.length === 0 ? (
              <p className="text-gray-400 font-medium text-center py-16">No financial records found.</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Date & Details</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest text-right">Debit (Paid)</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest text-right">Credit (Billed)</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ledgerWithBalance.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.type === 'PURCHASE' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {item.type === 'PURCHASE' ? <ArrowDownLeft size={18}/> : <ArrowUpRight size={18}/>}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-sm">{item.description}</div>
                            <div className="text-xs font-bold text-gray-400 mt-0.5">
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
                        <div className="font-black text-gray-900">₹{Math.abs(item.balance).toLocaleString()}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">
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

        {/* TAB 2: PURCHASE INVOICES (WITH ITEMS LIST) */}
        {activeTab === "purchases" && (
          <div className="p-6 space-y-4">
            {supplier.purchases.length === 0 && <p className="text-gray-400 font-medium text-center py-10">No purchase invoices recorded.</p>}
            {supplier.purchases.map((bill) => (
              <div key={bill.id} className="bg-gray-50 p-5 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all flex flex-col">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white border border-gray-200 text-gray-500 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                      <ReceiptText size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 mb-1">Invoice #{bill.id.slice(-6).toUpperCase()}</div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                         {new Date(bill.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric'})}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-xl text-gray-900">₹{bill.totalAmount.toLocaleString()}</div>
                    <div className="text-xs font-bold text-gray-500 mt-1">Paid at source: <span className="text-emerald-600">₹{bill.paidAmount.toLocaleString()}</span></div>
                  </div>
                </div>

                {/* YEH NAYA SECTION HAI: ITEMS BOUGHT IN THIS BILL */}
                <div className="mt-5 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-50 pb-2 flex items-center gap-1.5">
                    <Package size={12} /> Items Purchased
                  </div>
                  <div className="space-y-2">
                    {bill.items && bill.items.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-sm font-medium text-gray-700">
                        <div className="flex items-center gap-2">
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-bold">{item.qty}x</span>
                          <span>{item.product ? item.product.name : 'Unknown Product'}</span>
                        </div>
                        <span className="font-bold text-gray-900">₹{(item.qty * item.buyPrice).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* TAB 3: PAYMENT RECORDS */}
        {activeTab === "payments" && (
          <div className="p-6 space-y-3">
            {supplier.payments.length === 0 ? (
               <p className="text-gray-400 font-medium text-center py-10">No payment records found.</p>
            ) : (
              supplier.payments.map(payment => (
                <div key={payment.id} className="flex justify-between items-center bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                      <ArrowUpRight size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">Payment Settled</div>
                      <div className="text-xs font-bold text-gray-500 mt-0.5">
                         {new Date(payment.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric'})}
                      </div>
                    </div>
                  </div>
                  <div className="font-black text-2xl text-emerald-600">- ₹{payment.amount.toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}