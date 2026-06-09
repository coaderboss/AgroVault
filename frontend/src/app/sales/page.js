"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { Search, ShoppingCart, User, Plus, Minus, Trash2, ReceiptText, Edit3, Printer, X } from "lucide-react";
import Cookies from "js-cookie";

export default function PointOfSale() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [cart, setCart] = useState([]);
  const [paidAmount, setPaidAmount] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [generatedSlip, setGeneratedSlip] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = Cookies.get("auth_token"); // <-- Chaabi nikali
        const config = { headers: { Authorization: `Bearer ${token}` } }; // <-- Envelop banaya
        
        const prodRes = await axios.get("https://agrovault.onrender.com/api/products", config); // <-- Envelop bheja
        const custRes = await axios.get("https://agrovault.onrender.com/api/customers", config); // <-- Envelop bheja
        setProducts(prodRes.data.data);
        setCustomers(custRes.data.data);
        setLoading(false);
      } catch (error) {
        console.error("Data fetch error", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

 // ─── SMART CART LOGIC (Unit Conversion & Auto Math) ───
  const getMultiplier = (unit) => {
    if (unit === "Gram" || unit === "ML") return 0.001;
    if (unit === "Quintal") return 100;
    if (unit === "Ton") return 1000;
    return 1; // Default for KG, Litre, Pcs, Bori etc.
  };

  const addToCart = (product) => {
    if (product.stockQty <= 0) return alert("Bhaiya, yeh samaan stock mein nahi hai!");
    
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        // Agar pehle se hai, toh quantity 1 se badha do
        const newEnteredQty = Number(existing.enteredQty) + 1;
        const newBaseQty = newEnteredQty * getMultiplier(existing.enteredUnit);
        if (newBaseQty > product.stockQty) return prev;
        return prev.map((item) => item.id === product.id ? { ...item, enteredQty: newEnteredQty, qty: newBaseQty } : item);
      }
      // Naya item aate hi uska default unit aur 1 qty set hoga
      const defaultUnit = product.unit || "Pcs";
      return [...prev, { 
        ...product, 
        enteredQty: 1, 
        enteredUnit: defaultUnit, 
        qty: 1 * getMultiplier(defaultUnit), // Base quantity for backend
        priceAtSale: product.sellPrice 
      }];
    });
  };

  const handleMeasurementChange = (id, value, type) => {
    setCart((prev) => prev.map((item) => {
      if (item.id === id) {
        let newEnteredQty = type === "qty" ? (value === "" ? "" : Number(value)) : item.enteredQty;
        let newEnteredUnit = type === "unit" ? value : item.enteredUnit;
        
        // Auto-calculate base quantity for stock & price
        const newBaseQty = Number(newEnteredQty) * getMultiplier(newEnteredUnit);
        
        return { ...item, enteredQty: newEnteredQty, enteredUnit: newEnteredUnit, qty: newBaseQty };
      }
      return item;
    }));
  };

  // ─── NAYA: RATE CHANGE KARNE KA LOGIC ───
  const updatePrice = (id, newPrice) => {
    setCart((prev) => prev.map((item) => 
      item.id === id ? { ...item, priceAtSale: Number(newPrice) } : item
    ));
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((item) => item.id !== id));

  // ─── CALCULATIONS ───
  const subtotal = cart.reduce((total, item) => total + (item.priceAtSale * item.qty), 0);
  const balanceDue = subtotal - (Number(paidAmount) || 0);

  const handleCheckout = async () => {
    if (!selectedCustomer) return alert("Kripya pehle Kisaan select karein!");
    if (cart.length === 0) return alert("Bill mein koi samaan nahi hai!");
    
    setIsSubmitting(true);
    try {
      const token = Cookies.get("auth_token");
      
      // Dukaan ka naam localStorage se nikalna (Slip ke liye)
      const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
      const shopName = userInfo.shopName || "AgroVault Store";

      const orderPayload = {
        customerId: selectedCustomer,
        paidAmount: Number(paidAmount) || 0,
        items: cart.map(item => ({
          productId: item.id,
          qty: Number(item.qty),                 // Backend calculations ke liye (e.g., 0.5)
          priceAtSale: Number(item.priceAtSale), 
          enteredQty: Number(item.enteredQty),   // Parchi par dikhane ke liye (e.g., 500)
          enteredUnit: item.enteredUnit          // Parchi par dikhane ke liye (e.g., Gram)
        }))
      };

      const res = await axios.post("https://agrovault.onrender.com/api/orders", orderPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const customerInfo = customers.find(c => c.id === selectedCustomer);
      
      // Slip Generate karna (Sab details ke sath)
      setGeneratedSlip({
        shopName: shopName,
        customerName: customerInfo ? customerInfo.name : "Walk-in Customer",
        customerMobile: customerInfo ? customerInfo.mobile : "",
        items: cart,
        total: subtotal, 
        paid: Number(paidAmount) || 0,
        due: subtotal - (Number(paidAmount) || 0), 
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        billId: res.data.data.id.slice(-6).toUpperCase(),
        billedBy: userInfo.name || "Owner" // <-- NAYA: Parchi kisne kaati uska naam
      });

      // Cart saaf karna
      setCart([]);
      setPaidAmount("");
      setSelectedCustomer("");

      // Stock update karne ke liye wapas fetch karna
      const prodRes = await axios.get("https://agrovault.onrender.com/api/products", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(prodRes.data.data);

    } catch (error) {
      // Bekar error ki jagah Backend ka asli error dikhayega
      const errMsg = error.response?.data?.message || "Bill generate karne mein error aaya!";
      alert(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return <div className="p-10 text-center font-bold text-gray-500 animate-pulse">Loading POS Terminal...</div>;

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4 md:gap-6 animate-in fade-in duration-500 md:h-[calc(100vh-80px)] pb-24 md:pb-0 px-2 sm:px-4 md:px-0">
      
      {/* ─── LEFT: PRODUCT CATALOG ─── */}
      <div className="flex-1 flex flex-col h-full print:hidden">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Terminal</h1>
          <div className="relative w-72">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" placeholder="Search inventory..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 pb-24 md:pb-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            {filteredProducts.map((p) => (
              <div 
                key={p.id} 
                onClick={() => addToCart(p)}
                className={`className="bg-white border-2 rounded-xl md:rounded-3xl p-3 md:p-5 cursor-pointer transition-all hover:shadow-md active:scale-95 flex flex-col justify-between h-28 md:h-36 ${p.stockQty > 0 ? 'border-transparent hover:border-emerald-400' : 'border-red-100 opacity-60'}`}
              >
                <div>
                  <div className="font-bold text-gray-900 leading-tight text-lg">{p.name}</div>
                  <div className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">{p.category}</div>
                </div>
                <div className="flex justify-between items-end">
                  <div className={`text-xs font-bold px-3 py-1.5 rounded-lg ${p.stockQty > 0 ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-600'}`}>
                    Stock: {p.stockQty}
                  </div>
                  <div className="font-black text-emerald-600 text-xl">₹{p.sellPrice}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── RIGHT: CART & CHECKOUT ─── */}
      <div className="w-full md:w-[400px] bg-white border border-gray-200 rounded-2xl md:rounded-3xl shadow-sm flex flex-col h-full overflow-hidden shrink-0 mt-4 md:mt-0 print:hidden">
        
        {/* Cart Header */}
        <div className="bg-gray-50 p-3 md:p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-gray-900 text-lg">
            <ShoppingCart size={20} className="text-emerald-600" /> Current Bill
          </div>
          <div className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
            {cart.length} Items
          </div>
        </div>

        {/* Customer Selection */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-2 text-sm font-bold text-gray-500 uppercase tracking-widest">
            <User size={16} /> Select Customer
          </div>
          <select 
            value={selectedCustomer} 
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="w-full bg-white border border-gray-200 p-3.5 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors shadow-sm"
          >
            <option value="">-- Choose Customer --</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.village})</option>)}
          </select>
        </div>

        {/* Cart Items (With Flexible Price Input) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingCart size={48} className="mb-4 opacity-20" />
              <p className="font-medium text-sm">Cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex flex-col bg-white p-4 rounded-2xl border border-gray-100 shadow-sm gap-3 group">
                <div className="flex justify-between items-start">
                  <div className="font-bold text-xs md:text-sm text-gray-900 line-clamp-2">{item.name}</div>
                  <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-rose-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  {/* Flexible Price Input */}
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
                    <span className="text-gray-500 font-bold text-xs">₹</span>
                    <input 
                      type="number" 
                      value={item.priceAtSale}
                      onChange={(e) => updatePrice(item.id, e.target.value)}
                      className="w-16 bg-transparent text-gray-900 font-black text-sm outline-none"
                    />
                    <Edit3 size={12} className="text-gray-400" />
                  </div>
                  
                  {/* ─── SMART MEASUREMENT INPUT (Qty + Unit Dropdown) ─── */}
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all shadow-inner">
                    <input 
                      type="number" 
                      min="0"
                      step="any"
                      value={item.enteredQty}
                      onChange={(e) => handleMeasurementChange(item.id, e.target.value, "qty")}
                      className="w-16 p-2 bg-transparent text-sm font-black text-gray-900 text-center outline-none"
                      placeholder="0"
                    />
                    <div className="w-px h-6 bg-gray-200"></div>
                    <select
                      value={item.enteredUnit}
                      onChange={(e) => handleMeasurementChange(item.id, e.target.value, "unit")}
                      className="bg-transparent text-xs font-bold text-gray-600 p-2 pr-6 outline-none cursor-pointer appearance-none relative"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em' }}
                    >
                      {/* Agar Base Unit KG hai, toh yeh options dikhenge */}
                      {(item.unit === "KG" || item.unit === "Gram") && (
                        <>
                          <option value="Gram">Gram (g)</option>
                          <option value="KG">Kilo (KG)</option>
                          <option value="Quintal">Quintal</option>
                          <option value="Ton">Ton</option>
                        </>
                      )}
                      {/* Agar Base Unit Litre hai */}
                      {(item.unit === "Litre" || item.unit === "ML") && (
                        <>
                          <option value="ML">ML</option>
                          <option value="Litre">Litre (L)</option>
                        </>
                      )}
                      {/* Any other standard unit (Pcs, Bori, Packet) */}
                      {(!["KG", "Gram", "Litre", "ML"].includes(item.unit)) && (
                        <option value={item.unit}>{item.unit}</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payment & Checkout */}
        <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] z-10">
          <div className="flex justify-between items-center mb-3 text-gray-500 font-bold text-sm">
            <span>Subtotal</span>
            <span className="font-black text-gray-900">₹{subtotal.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center justify-between mb-5">
            <span className="text-gray-500 font-bold text-sm uppercase tracking-widest">Received (₹)</span>
            <input 
              type="number" 
              placeholder="0"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              className="w-32 text-right p-3 bg-gray-50 rounded-xl border border-gray-200 font-black text-gray-900 text-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div className="flex justify-between items-center mb-5 p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <span className="text-gray-500 font-bold text-xs uppercase tracking-widest">Balance Due</span>
            <span className={`font-black text-2xl ${balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              ₹{balanceDue > 0 ? balanceDue.toLocaleString() : 0}
            </span>
          </div>

          <button 
            onClick={handleCheckout}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base md:text-lg p-3 md:p-4 rounded-xl md:rounded-2xl shadow-md md:shadow-lg shadow-emerald-600/30 flex justify-center items-center gap-2 active:scale-95 transition-all"
          >
            <ReceiptText size={20} />
            Generate Parchi
          </button>
        </div>

      </div>
      {/* ─── PREMIUM BILL SLIP MODAL ─── */}
      {generatedSlip && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200 print:bg-transparent print:backdrop-blur-none print:p-0 print:items-start">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 relative print:shadow-none print:border-none print:w-full print:max-w-full print:p-2">
            
            {/* Header / Shop Name */}
            <div className="text-center border-b border-gray-200 pb-4 mb-4">
              <h2 className="text-2xl font-black text-gray-900">{generatedSlip.shopName}</h2>
              <p className="text-xs font-bold text-gray-500 tracking-widest mt-1">CASH / CREDIT MEMO</p>
              <div className="text-xs text-gray-400 mt-2">Bill No: #{generatedSlip.billId} • {generatedSlip.date}</div>
            </div>

            {/* Customer Info */}
            <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100 print:bg-white print:border-gray-300">
              <div className="text-xs font-bold text-gray-500 uppercase">Customer</div>
              <div className="font-black text-gray-800 text-sm">{generatedSlip.customerName}</div>
              {generatedSlip.customerMobile && <div className="text-xs text-gray-500">Ph: {generatedSlip.customerMobile}</div>}
            </div>

            {/* Items List */}
            <div className="space-y-3 mb-6 min-h-[100px]">
              <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1">
                <span className="w-1/2">Item Detail</span>
                <span className="w-1/4 text-right">Qty x Rate</span>
                <span className="w-1/4 text-right">Total</span>
              </div>
              {generatedSlip.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-sm font-medium text-gray-800">
                  <div className="w-1/2 pr-2 leading-tight">{item.name}</div>
                  <div className="w-1/4 text-right text-xs text-gray-500">
                    {item.qty} <span className="text-[10px] uppercase">{item.unit || 'Pcs'}</span><br/>× ₹{item.priceAtSale}
                  </div>
                  <div className="w-1/4 text-right font-bold text-gray-900">₹{(item.qty * item.priceAtSale).toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-dashed border-gray-300 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600 font-bold">
                <span>Grand Total</span>
                <span className="text-gray-900 text-lg font-black">₹{generatedSlip.total.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Amount Paid</span>
                <span>₹{generatedSlip.paid.toLocaleString('en-IN')}</span>
              </div>
              {generatedSlip.due > 0 && (
                <div className="flex justify-between text-rose-600 font-black pt-2 border-t border-gray-100">
                  <span>Balance Due</span>
                  <span>₹{generatedSlip.due.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            {/* ─── NAYA: BILLED BY (Employee Name) ─── */}
            <div className="mt-6 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest border-t border-gray-100 pt-4">
              Billed By: <span className="text-gray-700">{generatedSlip.billedBy}</span>
            </div>

            {/* Actions - print:hidden lagane se yeh paper par nahi aayenge */}
            <div className="mt-6 flex gap-3 print:hidden">
              <button onClick={() => window.print()} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors">🖨️ Print</button>
              <button onClick={() => setGeneratedSlip(null)} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors">Done</button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}