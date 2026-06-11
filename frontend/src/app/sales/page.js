"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Search, ShoppingCart, User, Trash2, ReceiptText, 
  X, Plus, Minus, Tag, PackageOpen, ChevronRight, Calculator
} from "lucide-react";
import Cookies from "js-cookie";

export default function PointOfSale() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cart & Checkout States
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedSlip, setGeneratedSlip] = useState(null);

  // Mobile Cart UI State
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Smart Add Modal State
  const [activeItem, setActiveItem] = useState(null);
  const [draftConfig, setDraftConfig] = useState({ qty: 1, unit: "KG", customMultiplier: 50, customLabel: "", price: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = Cookies.get("auth_token"); 
        const config = { headers: { Authorization: `Bearer ${token}` } }; 
        
        const prodRes = await axios.get("https://agrovault.onrender.com/api/products", config); 
        const custRes = await axios.get("https://agrovault.onrender.com/api/customers", config); 
        
        setProducts(prodRes.data.data);
        setCustomers(custRes.data.data);
      } catch (error) {
        console.error("Data fetch error", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ─── SMART UNIT ENGINE (UNRESTRICTED) ───
  const getMultiplier = (unit, customMult) => {
    if (unit === "Gram" || unit === "ML") return 0.001;
    if (unit === "Quintal") return 100;
    if (unit === "Ton") return 1000;
    if (unit === "Custom_Bag") return Number(customMult) || 1;
    if (unit === "Dozen") return 12;
    return 1; // Default for KG, Litre, Pcs, etc.
  };

  const openSmartAdder = (product) => {
    if (product.stockQty <= 0) return alert("Stock empty hai!");
    setActiveItem(product);
    setDraftConfig({ 
      qty: 1, 
      unit: product.unit || "Pcs", 
      customMultiplier: 50, // Default bori weight
      customLabel: "", 
      price: product.sellPrice 
    });
  };

  const confirmAddToCart = () => {
    const baseQty = Number(draftConfig.qty) * getMultiplier(draftConfig.unit, draftConfig.customMultiplier);
    const displayUnit = draftConfig.unit === "Custom_Bag" ? "Bag" : draftConfig.unit;   
    if (baseQty > activeItem.stockQty) {
      alert(`Dukaan mein sirf ${activeItem.stockQty} ${activeItem.unit} bacha hai!`);
      return;
    }

    setCart(prev => [...prev, {
      ...activeItem,
      cartId: Math.random().toString(36).substr(2, 9), // Unique ID per cart item
      enteredQty: Number(draftConfig.qty),
      enteredUnit: draftConfig.unit,
      qty: baseQty, // Real backend quantity
      priceAtSale: Number(draftConfig.price),
      customLabel: draftConfig.customLabel || activeItem.name
    }]);

    setActiveItem(null); // Close modal
  };

  const removeFromCart = (cartId) => setCart(prev => prev.filter(i => i.cartId !== cartId));

  const subtotal = cart.reduce((total, item) => total + (item.priceAtSale * item.enteredQty), 0);
  const balanceDue = subtotal - (Number(paidAmount) || 0);

  const handleCheckout = async () => {
    if (!selectedCustomer) return alert("Bhaiya, kisaan select karein!");
    if (cart.length === 0) return alert("Parchi khali hai!");
    
    setIsSubmitting(true);
    try {
      const token = Cookies.get("auth_token");
      const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");

      const orderPayload = {
        customerId: selectedCustomer,
        paidAmount: Number(paidAmount) || 0,
        items: cart.map(item => ({
          productId: item.id,
          qty: item.qty, // Base DB Qty
          priceAtSale: item.priceAtSale, 
          enteredQty: item.enteredQty,   
          enteredUnit: item.enteredUnit,
          // Custom Label API me bhej sakte hain agar backend update ho, 
          // filhal frontend parchi ke liye use kar rahe hain
        }))
      };

      const res = await axios.post("https://agrovault.onrender.com/api/orders", orderPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const customerInfo = customers.find(c => c.id === selectedCustomer);
      
      setGeneratedSlip({
        shopName: userInfo.shopName || "AgroVault Workspace",
        customerName: customerInfo?.name || "Walk-in Customer",
        customerMobile: customerInfo?.mobile || "",
        items: cart,
        total: subtotal, 
        paid: Number(paidAmount) || 0,
        due: balanceDue, 
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        billId: res.data.data.id.slice(-6).toUpperCase(),
        billedBy: userInfo.name || "Owner"
      });

      setCart([]); setPaidAmount(""); setSelectedCustomer(""); setIsCartOpen(false);

      // Refresh Stock silently
      axios.get("https://agrovault.onrender.com/api/products", { headers: { Authorization: `Bearer ${token}` }})
           .then(res => setProducts(res.data.data));

    } catch (error) {
      alert("Error generating bill!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return (
    <div className="flex h-[70vh] items-center justify-center">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500 pb-28 lg:pb-6 relative h-[calc(100vh-80px)]">
      
      {/* ─── LEFT: PRODUCT CATALOG (The Feed) ─── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="bg-white/80 backdrop-blur-md p-4 lg:p-6 rounded-[2rem] border border-gray-100 shadow-sm mb-4 shrink-0 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Point of Sale</h1>
            <p className="text-xs font-bold text-gray-400 mt-1">Tap products to configure and add.</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" placeholder="Search inventory..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-800 outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 pb-20 lg:pb-0 scroll-smooth">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
            {filteredProducts.map((p) => (
              <div 
                key={p.id} onClick={() => openSmartAdder(p)}
                className={`bg-white border rounded-[1.5rem] p-4 lg:p-5 cursor-pointer transition-all hover:shadow-lg active:scale-95 flex flex-col justify-between h-32 lg:h-40 group relative overflow-hidden ${p.stockQty > 0 ? 'border-gray-100 hover:border-emerald-300' : 'border-rose-100 bg-rose-50/30 opacity-75'}`}
              >
                {/* Visual Flair */}
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-gray-50 rounded-full group-hover:bg-emerald-50 transition-colors duration-500"></div>
                
                <div className="relative z-10">
                  <div className="font-black text-gray-900 leading-tight text-sm lg:text-base line-clamp-2">{p.name}</div>
                  <div className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-widest">{p.category}</div>
                </div>
                <div className="flex justify-between items-end relative z-10">
                  <div className={`text-[10px] font-black px-2 py-1 rounded-md tracking-wider ${p.stockQty > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {p.stockQty > 0 ? `${p.stockQty} ${p.unit} LEFT` : 'OUT OF STOCK'}
                  </div>
                  <div className="font-black text-gray-900 text-lg">₹{p.sellPrice}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── RIGHT: PERSISTENT CART (Desktop) / BOTTOM SHEET (Mobile) ─── */}
      <div className={`fixed inset-x-0 bottom-0 z-[200] lg:z-auto lg:relative lg:w-[420px] bg-white border border-gray-200 rounded-t-[2rem] lg:rounded-[2rem] shadow-[0_-20px_40px_rgba(0,0,0,0.15)] lg:shadow-sm flex flex-col transition-transform duration-500 ease-in-out h-[92vh] lg:h-full shrink-0 ${isCartOpen ? 'translate-y-0' : 'translate-y-[120%] lg:translate-y-0'}`}>        
        {/* Mobile Close Handle */}
        <div className="w-full flex justify-center pt-4 pb-2 lg:hidden cursor-pointer" onClick={() => setIsCartOpen(false)}>
          <div className="w-16 h-1.5 bg-gray-200 rounded-full"></div>
        </div>

        <div className="p-5 lg:p-6 border-b border-gray-100 flex items-center justify-between bg-white rounded-t-[2rem] shrink-0">
          <div className="flex items-center gap-3 font-black text-gray-900 text-xl">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><ShoppingCart size={20} /></div>
            Checkout
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 text-gray-600 text-xs font-black px-3 py-1.5 rounded-lg tracking-widest uppercase">
              {cart.length} Items
            </div>
            {/* Mobile Close Button */}
            <button onClick={() => setIsCartOpen(false)} className="lg:hidden p-2 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-full transition-colors"><X size={18}/></button>
          </div>
        </div>

        {/* Customer Select */}
        <div className="px-5 lg:px-6 pt-5 shrink-0">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><User size={14}/> Attach Customer</label>
          <select 
            value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-emerald-500 transition-colors shadow-inner"
          >
            <option value="">-- Choose Account --</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.village})</option>)}
          </select>
        </div>

        {/* Cart Items Scroll Area (Zyada space aur bade items) */}
        <div className="flex-1 overflow-y-auto p-5 lg:p-6 space-y-4 bg-white">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300">
              <PackageOpen size={56} className="mb-4 opacity-50" strokeWidth={1} />
              <p className="font-bold text-sm">No items in cart</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.cartId} className="flex flex-col bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative group hover:border-emerald-200 transition-colors">
                <button onClick={() => removeFromCart(item.cartId)} className="absolute top-4 right-4 text-gray-300 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                
                <div className="font-black text-gray-900 text-lg pr-6 leading-tight">{item.customLabel}</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Base: {item.name}</div>
                
                <div className="flex justify-between items-end mt-5 pt-4 border-t border-gray-50">
                  <div className="bg-gray-50 px-3 py-1.5 rounded-lg text-sm font-black text-gray-600 border border-gray-100">
                    {item.enteredQty} {item.enteredUnit} <span className="text-gray-400 mx-1">x</span> ₹{item.priceAtSale}
                  </div>
                  <div className="font-black text-emerald-600 text-xl">₹{(item.enteredQty * item.priceAtSale).toLocaleString('en-IN')}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payment Footer (Ab ekdum bottom par fix rahega) */}
        <div className="p-5 lg:p-6 bg-white border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] shrink-0 rounded-t-3xl relative z-10">
          <div className="flex justify-between items-center mb-4 text-gray-500 font-bold text-sm">
            <span>Bill Subtotal</span>
            <span className="font-black text-gray-900 text-lg">₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
          
          <div className="flex items-center justify-between mb-4 bg-gray-50 p-2 rounded-xl border border-gray-100 focus-within:border-emerald-400 transition-colors">
            <span className="text-gray-400 font-black text-xs uppercase tracking-widest pl-2">Received (₹)</span>
            <input 
              type="number" placeholder="0.00" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)}
              className="w-32 text-right p-2 bg-transparent font-black text-gray-900 text-xl outline-none"
            />
          </div>

          <div className="flex justify-between items-center mb-6">
            <span className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Balance Due</span>
            <span className={`font-black text-2xl ${balanceDue > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
              ₹{balanceDue > 0 ? balanceDue.toLocaleString('en-IN') : 0}
            </span>
          </div>

          <button onClick={handleCheckout} disabled={isSubmitting} className="w-full bg-gray-900 hover:bg-black text-white font-black py-4 rounded-xl flex justify-center items-center gap-2 shadow-[0_8px_30px_rgba(0,0,0,0.12)] active:scale-95 transition-all disabled:opacity-70 text-lg">
            {isSubmitting ? "Processing..." : <><ReceiptText size={20} /> GENERATE BILL</>}
          </button>
        </div>
      </div>

      {/* ─── MOBILE ZOMATO-STYLE FLOATING CART BAR ─── */}
      {!isCartOpen && (
        <div className="lg:hidden fixed bottom-16 inset-x-4 z-40 animate-in slide-in-from-bottom-10">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-emerald-600 text-white p-4 rounded-2xl shadow-[0_10px_25px_rgba(16,185,129,0.4)] flex items-center justify-between font-black active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl"><ShoppingCart size={20} /></div>
              <div className="text-left leading-tight">
                <div className="text-sm">{cart.length} Items</div>
                <div className="text-[10px] text-emerald-200 uppercase tracking-widest mt-0.5">₹{subtotal} Total</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm">View Cart <ChevronRight size={18}/></div>
          </button>
        </div>
      )}

      {/* ─── THE SMART UNIT ADDER MODAL ─── */}
      {activeItem && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/80 shrink-0">
              <div>
                <h3 className="font-black text-gray-900 text-xl leading-tight pr-4">{activeItem.name}</h3>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1.5">Available: {activeItem.stockQty} {activeItem.unit}</p>
              </div>
              <button onClick={() => setActiveItem(null)} className="p-2 bg-white rounded-full border border-gray-200 text-gray-400 hover:text-gray-900 shadow-sm shrink-0"><X size={18}/></button>
            </div>

            {/* Modal Body (Scrollable inputs) */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Dual Input: Qty & Unit */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">How much to sell?</label>
                <div className="flex gap-2">
                  <input 
                    type="number" min="0" step="any"
                    value={draftConfig.qty} onChange={(e) => setDraftConfig({...draftConfig, qty: e.target.value})}
                    className="w-1/2 p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-black text-gray-900 text-center outline-none focus:border-emerald-500 transition-colors"
                  />
                  <select 
                    value={draftConfig.unit} onChange={(e) => setDraftConfig({...draftConfig, unit: e.target.value})}
                    className="w-1/2 p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm text-gray-700 outline-none focus:border-emerald-500 transition-colors"
                  >
                    {["KG", "Gram"].includes(activeItem.unit) && (
                      <><option value="KG">Kilo (KG)</option><option value="Gram">Gram (g)</option><option value="Custom_Bag">Bag / Bori</option><option value="Quintal">Quintal</option></>
                    )}
                    {["Litre", "ML"].includes(activeItem.unit) && (
                      <><option value="Litre">Litre (L)</option><option value="ML">ML</option></>
                    )}
                    {!["KG", "Gram", "Litre", "ML"].includes(activeItem.unit) && (
                      <><option value={activeItem.unit}>{activeItem.unit}</option><option value="Dozen">Dozen</option><option value="Box">Box</option></>
                    )}
                  </select>
                </div>
                
                {/* DYNAMIC BAG WEIGHT INPUT */}
                {draftConfig.unit === "Custom_Bag" && (
                  <div className="mt-3 flex items-center justify-between bg-emerald-50 p-3 rounded-xl border border-emerald-200 animate-in fade-in zoom-in-95">
                    <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">1 Bag Weight =</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" value={draftConfig.customMultiplier} 
                        onChange={(e) => setDraftConfig({...draftConfig, customMultiplier: e.target.value})} 
                        className="w-16 p-1.5 rounded-lg text-sm font-black text-center border border-emerald-300 outline-none focus:ring-2 focus:ring-emerald-400" 
                      />
                      <span className="text-[10px] font-black text-emerald-700 uppercase">{activeItem.unit}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Price Override */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block flex items-center gap-1"><Tag size={12}/> Price Per Unit (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">₹</span>
                  <input 
                    type="number" 
                    value={draftConfig.price} onChange={(e) => setDraftConfig({...draftConfig, price: e.target.value})}
                    className="w-full pl-9 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-black text-gray-900 outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Receipt Label (Optional) */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Parchi Label (Optional)</label>
                <input 
                  type="text" placeholder="e.g., 10 Kट्टे Laal Wale"
                  value={draftConfig.customLabel} onChange={(e) => setDraftConfig({...draftConfig, customLabel: e.target.value})}
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm text-gray-900 outline-none focus:border-emerald-500 transition-colors placeholder-gray-300"
                />
                <p className="text-[9px] font-bold text-gray-400 mt-2 leading-relaxed">Leave empty to print original name. Backend will automatically deduct <span className="text-emerald-600 font-black">{(Number(draftConfig.qty) * getMultiplier(draftConfig.unit, draftConfig.customMultiplier)) || 0} {activeItem.unit}</span> from inventory.</p>
              </div>
            </div>

            {/* Modal Footer (Button inside strictly) */}
            <div className="p-5 border-t border-gray-100 bg-white shrink-0">
              <button onClick={confirmAddToCart} className="w-full bg-gray-900 hover:bg-black text-white font-black py-4 rounded-xl shadow-lg active:scale-95 transition-all text-lg">
                Add to Cart - ₹{(draftConfig.qty * draftConfig.price).toLocaleString('en-IN')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── GENERATED SLIP MODAL (Retained & Optimized) ─── */}
      {generatedSlip && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-200 print:bg-transparent print:p-0">
          {/* Slip UI remains structurally similar but styled sharper */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 relative print:shadow-none print:border-none print:w-full print:max-w-full">
            <div className="text-center border-b border-gray-200 pb-4 mb-4">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{generatedSlip.shopName}</h2>
              <p className="text-[10px] font-black text-gray-400 tracking-[0.2em] mt-1">CASH / CREDIT MEMO</p>
              <div className="text-xs font-bold text-gray-500 mt-2 bg-gray-50 py-1 rounded-md border border-gray-100">Bill No: #{generatedSlip.billId}</div>
            </div>
            <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100 print:bg-white print:border-gray-300">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Detail</div>
              <div className="font-black text-gray-800 text-sm mt-1">{generatedSlip.customerName}</div>
              {generatedSlip.customerMobile && <div className="text-xs font-bold text-gray-500 mt-0.5">+91 {generatedSlip.customerMobile}</div>}
            </div>
            <div className="space-y-3 mb-6 min-h-[100px]">
              <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5 gap-2">
                <span className="flex-1">Item Detail</span>
                <span className="w-20 text-center">Qty/Rate</span>
                <span className="w-20 text-right">Amount</span>
              </div>
              {generatedSlip.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-sm font-bold text-gray-800 border-b border-gray-50 pb-2 gap-2">
                  <div className="flex-1 min-w-0 pr-1 leading-tight">
                    <div className="break-words leading-snug">{item.customLabel}</div>
                    {item.customLabel !== item.name && <div className="text-[9px] text-gray-400 mt-0.5 truncate">{item.name}</div>}
                  </div>
                  <div className="w-20 text-center text-[10px] text-gray-500 shrink-0">
                    {item.enteredQty} <span className="uppercase text-[9px]">{item.enteredUnit}</span><br/>× ₹{item.priceAtSale}
                  </div>
                  <div className="w-20 text-right font-black text-gray-900 shrink-0">₹{(item.enteredQty * item.priceAtSale).toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-gray-300 pt-4 space-y-2 text-sm bg-gray-50 -mx-6 px-6 pb-6 -mb-6 print:bg-transparent print:mx-0 print:px-0">
              <div className="flex justify-between text-gray-600 font-bold">
                <span>Grand Total</span>
                <span className="text-gray-900 text-xl font-black">₹{generatedSlip.total.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Amount Paid</span>
                <span>₹{generatedSlip.paid.toLocaleString('en-IN')}</span>
              </div>
              {generatedSlip.due > 0 && (
                <div className="flex justify-between text-rose-600 font-black pt-3 mt-1 border-t border-gray-200">
                  <span>Balance Due</span>
                  <span>₹{generatedSlip.due.toLocaleString('en-IN')}</span>
                </div>
              )}
               <div className="mt-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest pt-4 border-t border-gray-200">
                Billed By: <span className="text-gray-600">{generatedSlip.billedBy}</span>
              </div>
            </div>
            <div className="mt-6 flex gap-3 print:hidden absolute bottom-6 inset-x-6">
              <button onClick={() => window.print()} className="flex-1 py-3.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-black text-sm uppercase tracking-widest rounded-xl transition-colors shadow-sm">Print</button>
              <button onClick={() => setGeneratedSlip(null)} className="flex-1 py-3.5 bg-gray-900 hover:bg-black text-white font-black text-sm uppercase tracking-widest rounded-xl transition-colors shadow-lg shadow-gray-900/20">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}