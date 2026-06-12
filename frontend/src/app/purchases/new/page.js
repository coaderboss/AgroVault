"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { 
  ArrowLeft, Search, PackagePlus, Truck, Wallet, 
  Trash2, CheckCircle, Plus, X, Package, Tag, ShoppingCart, ChevronRight
} from "lucide-react";

export default function NewPurchase() {
  const router = useRouter();
  
  // ─── DATA STATES ───
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ─── CART & FORM STATES ───
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [paidAmount, setPaidAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── MOBILE CART UI STATE ───
  const [isCartOpen, setIsCartOpen] = useState(false);

  // ─── NEW PRODUCT MODAL STATES (Updated with Company & Custom Category) ───
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const baseProductState = {
    name: "", company: "", brand: "", category: "Fertilizer", customCategory: "",
    measureType: "loose", baseUnit: "KG", packageUnit: "Bag", 
    qtyPerPackage: "", packBuyPrice: "", packSellPrice: "", packStock: "", 
    buyPrice: "", sellPrice: "", stockQty: 0
  };
  const [newProduct, setNewProduct] = useState(baseProductState);
  

  // Auto Calculate Logic for Packaged
  useEffect(() => {
    if (newProduct.measureType === "packaged" && newProduct.qtyPerPackage > 0) {
      setNewProduct(prev => ({
        ...prev,
        buyPrice: prev.packBuyPrice ? (Number(prev.packBuyPrice) / Number(prev.qtyPerPackage)).toFixed(2) : "",
        sellPrice: prev.packSellPrice ? (Number(prev.packSellPrice) / Number(prev.qtyPerPackage)).toFixed(2) : ""
      }));
    }
  }, [newProduct.packBuyPrice, newProduct.packSellPrice, newProduct.qtyPerPackage, newProduct.measureType]);

  // ─── INITIAL DATA FETCH ───
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = Cookies.get("auth_token"); 
        const config = { headers: { Authorization: `Bearer ${token}` } }; 

        const [supRes, prodRes] = await Promise.all([
          axios.get("https://agrovault.onrender.com/api/suppliers", config),
          axios.get("https://agrovault.onrender.com/api/products", config) 
        ]);
        setSuppliers(supRes.data.data);
        setProducts(prodRes.data.data);
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ─── 1. PAGE LOAD HOTE HI PURANA DATA WAPAS LAANA ───
  useEffect(() => {
    const savedCart = localStorage.getItem("buy_cart");
    const savedSupplier = localStorage.getItem("buy_supplier");
    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedSupplier) setSelectedSupplier(savedSupplier);
  }, []);

  // ─── 2. KUCH BHI CHANGE HO TOH SAVE KARNA ───
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem("buy_cart", JSON.stringify(cart));
    } else {
      localStorage.removeItem("buy_cart"); // Agar cart khali ho jaye toh storage bhi saaf
    }
  }, [cart]);

  useEffect(() => {
    if (selectedSupplier) localStorage.setItem("buy_supplier", selectedSupplier);
  }, [selectedSupplier]);
  
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
  );

 // ─── SMART UNIT ADDER STATES ───
  const [activeItem, setActiveItem] = useState(null);
  const [draftConfig, setDraftConfig] = useState({ qty: 1, unit: "KG", customMultiplier: 50, customLabel: "", price: 0 });

  // ─── NAYA: BULK PACKET ENGINE STATE & LOGIC ───
  const [bulkCalc, setBulkCalc] = useState({ active: false, outerCount: "", innerCount: "" });

  useEffect(() => {
    if (bulkCalc.active && bulkCalc.outerCount && bulkCalc.innerCount) {
        const totalPacks = Number(bulkCalc.outerCount) * Number(bulkCalc.innerCount);
        // 👈 BUG FIX: Jaise hi box tick hoga, Unit apne aap "Packet" ho jayega!
        setDraftConfig(prev => ({ ...prev, qty: totalPacks, unit: "Packet" })); 
    }
  }, [bulkCalc.outerCount, bulkCalc.innerCount, bulkCalc.active]);

  // ─── SMART CART LOGIC (With Bori/Bag/Packet Support) ───
  const getMultiplier = (unit, customMult) => {
    if (unit === "Gram" || unit === "ml") return 0.001;
    if (unit === "Quintal") return 100;
    if (unit === "Ton") return 1000;
    if (unit === "Custom_Bag") return Number(customMult) || 1;
    if (unit === "Dozen") return 12;
    // 👈 BUG FIX: System ko pata chal gaya ki 1 packet mein kitne KG hain!
    if (unit === "Packet") return Number(activeItem?.qtyPerPackage) || 1; 
    return 1; 
  };

 const openSmartAdder = (product) => {
    setActiveItem(product);
    setBulkCalc({ active: false, outerCount: "", innerCount: "" }); // 👈 NAYA: Reset Calculator
    setDraftConfig({ 
      qty: 1, 
      unit: product.unit || "KG", 
      customMultiplier: 50, 
      customLabel: "", 
      price: product.buyPrice || 0 
    });
  };

  const confirmAddToCart = () => {
    const multiplier = getMultiplier(draftConfig.unit, draftConfig.customMultiplier);
    const baseQty = Number(draftConfig.qty) * multiplier;
    const displayUnit = draftConfig.unit === "Custom_Bag" ? "Bag" : draftConfig.unit;

    setCart(prev => [...prev, {
      ...activeItem,
      productId: activeItem.id, 
      cartId: Math.random().toString(36).substr(2, 9), 
      enteredQty: Number(draftConfig.qty),
      enteredUnit: displayUnit,
      enteredPrice: Number(draftConfig.price), // 👈 NEW: Jo rate user ne type kiya (e.g. ₹120)
      qty: baseQty, // Total KGs (e.g. 960)
      buyPrice: Number(draftConfig.price) / multiplier, // 👈 NEW: Backend ke liye per KG rate (120/40 = ₹3)
      customLabel: draftConfig.customLabel || activeItem.name
    }]);

    setActiveItem(null);
  };

  const removeFromCart = (cartId) => setCart(cart.filter(item => item.cartId !== cartId));
  const totalAmount = cart.reduce((acc, item) => acc + (item.enteredQty * item.enteredPrice), 0); // 👈 Sahi Math
  const currentDue = totalAmount - Number(paidAmount || 0);

  // ─── CREATE NEW PRODUCT ON THE FLY ───
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.sellPrice) return alert("Product Name & Selling Price mandatory.");
    
    setIsAddingProduct(true);
    try {
      const token = Cookies.get("auth_token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const finalCategory = newProduct.category === "Other" ? (newProduct.customCategory || "Other") : newProduct.category;
      const finalBrand = newProduct.company ? `${newProduct.company} | ${newProduct.brand}` : newProduct.brand;

      const payload = {
        name: newProduct.name, brand: finalBrand, category: finalCategory,
        unit: newProduct.baseUnit, isPackaged: newProduct.measureType === "packaged",
        packageUnit: newProduct.measureType === "packaged" ? newProduct.packageUnit : null,
        qtyPerPackage: newProduct.measureType === "packaged" ? Number(newProduct.qtyPerPackage) : null,
        buyPrice: Number(newProduct.buyPrice) || 0, sellPrice: Number(newProduct.sellPrice),
        stockQty: 0
      };
      
      const res = await axios.post("https://agrovault.onrender.com/api/products", payload, config);
      const createdProd = res.data.data;

      setProducts([createdProd, ...products]);
      openSmartAdder(createdProd); // Seedha popup khulega

      setShowAddProductModal(false);
      setNewProduct(baseProductState);
    } catch (error) {
      alert("Failed to create new product.");
    } finally {
      setIsAddingProduct(false);
    }
  };

  // ─── SUBMIT FINAL PURCHASE ───
  const handleSubmit = async () => {
    if (!selectedSupplier) return alert("Select a Mahajan/Supplier first.");
    if (cart.length === 0) return alert("Purchase cart is empty.");
    if (Number(paidAmount) > totalAmount) return alert("Paid amount cannot exceed total bill.");

    setIsSubmitting(true);
    try {
      const token = Cookies.get("auth_token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const payload = {
        supplierId: selectedSupplier,
        paidAmount: Number(paidAmount) || 0,
        items: cart.map(item => ({
          productId: item.productId, 
          qty: item.qty, 
          buyPrice: item.buyPrice,
          enteredQty: item.enteredQty,         //  Bori ki ginti bhej rahe hain
          enteredUnit: item.enteredUnit,       //  Bori/Bag likha bhej rahe hain
          enteredPrice: item.enteredPrice || item.buyPrice, // Bori ka rate bhej rahe hain
          customLabel: item.customLabel        // Custom type kiya hua naam
        }))
      };

      await axios.post("https://agrovault.onrender.com/api/purchases", payload, config);
      
      // ─── BILL KATNE KE BAAD KACHRA SAAF KARNA ───
      setCart([]);
      setPaidAmount("");
      setSelectedSupplier("");
      localStorage.removeItem("buy_cart");
      localStorage.removeItem("buy_supplier");
      
      router.push(`/suppliers/${selectedSupplier}`);
    } catch (error) {
      alert("Failed to record purchase.");
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex h-[70vh] items-center justify-center">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500 pb-6 lg:pb-6 relative h-[calc(100vh-80px)]">
      
      {/* ─── LEFT PANEL: PRODUCT CATALOG (Black & Gold Theme) ─── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* COMPACT RESPONSIVE SEARCH HEADER (Dark Theme) */}
        <div className="bg-[#0f0f0f] p-3 lg:p-5 rounded-2xl lg:rounded-[2rem] border border-[#222] shadow-xl mb-4 shrink-0 flex items-center justify-between gap-3 relative overflow-hidden">
          {/* Desktop Title (Mobile par hide ho jayega) */}
          <div className="hidden lg:block">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <PackagePlus className="text-amber-500" /> Restock
            </h1>
          </div>
          
          {/* Search Input & Add Button */}
          <div className="flex w-full lg:w-96 items-center gap-2">
             <div className="bg-amber-500/10 text-amber-500 p-2.5 rounded-xl shrink-0 border border-amber-500/20">
              <Search size={20} strokeWidth={2.5} />
            </div>
            <input 
              type="text" placeholder="Search inventory..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm md:text-base font-bold text-white outline-none placeholder-gray-600"
            />
            <button 
              onClick={() => setShowAddProductModal(true)}
              className="bg-amber-500 text-gray-900 p-2.5 rounded-xl transition-all active:scale-95 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            >
              <Plus size={20} className="font-black"/>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 pb-20 lg:pb-0 scroll-smooth [&::-webkit-scrollbar]:hidden">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
            {filteredProducts.map(product => (
              <div 
                key={product.id} 
                onClick={() => openSmartAdder(product)}
                className="bg-white border border-gray-100 hover:border-amber-300 p-4 lg:p-5 rounded-[1.5rem] cursor-pointer hover:shadow-lg transition-all active:scale-95 flex flex-col h-full group relative"
              >
                <div className="flex-1">
                  <div className="font-black text-gray-900 leading-tight text-sm lg:text-base line-clamp-2">{product.name}</div>
                  <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest flex items-center gap-1">
                    <Tag size={10}/> {product.brand || 'No Brand'}
                  </div>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Stock</div>
                    <div className="text-xs font-black text-gray-800 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                      {product.stockQty} {product.unit}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 group-hover:bg-amber-100 group-hover:text-amber-600 flex items-center justify-center transition-colors">
                    <Plus size={16} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL: PURCHASE CART (Desktop) / BOTTOM SHEET (Mobile) ─── */}
      <div className={`fixed inset-x-0 bottom-0 z-[200] lg:z-auto lg:relative lg:w-[450px] bg-white border border-gray-200 rounded-t-[2rem] lg:rounded-[2rem] shadow-[0_-20px_40px_rgba(0,0,0,0.15)] lg:shadow-sm flex flex-col transition-transform duration-500 ease-in-out h-[92vh] lg:h-full shrink-0 ${isCartOpen ? 'translate-y-0' : 'translate-y-[120%] lg:translate-y-0'}`}>
        
        {/* Mobile Close Handle */}
        <div className="w-full flex justify-center pt-4 pb-2 lg:hidden cursor-pointer" onClick={() => setIsCartOpen(false)}>
          <div className="w-16 h-1.5 bg-gray-200 rounded-full"></div>
        </div>

        <div className="p-5 lg:p-6 border-b border-gray-100 flex items-center justify-between bg-white rounded-t-[2rem] shrink-0">
          <div className="flex items-center gap-3 font-black text-gray-900 text-xl">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><ShoppingCart size={20} /></div>
            Purchase List
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 text-gray-600 text-[10px] font-black px-3 py-1.5 rounded-lg tracking-widest uppercase">
              {cart.length} Items
            </div>
            <button onClick={() => setIsCartOpen(false)} className="lg:hidden p-2 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-full transition-colors"><X size={18}/></button>
          </div>
        </div>

        <div className="px-5 lg:px-6 pt-5 shrink-0">
          <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Truck size={14}/> 1. Select Supplier</label>
          <select 
            value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-amber-500 transition-colors shadow-inner"
          >
            <option value="">-- Choose Mahajan --</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} {s.company ? `(${s.company})` : ''}</option>)}
          </select>
        </div>

        {/* Cart Items Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 lg:p-6 space-y-4 bg-white [&::-webkit-scrollbar]:hidden">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300">
              <PackagePlus size={56} className="mb-4 opacity-50" strokeWidth={1} />
              <p className="font-bold text-sm">Purchase cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.cartId} className="bg-white border border-gray-100 p-4 lg:p-5 rounded-2xl shadow-sm relative hover:border-amber-200 transition-colors group">
                <div className="font-black text-gray-900 text-base pr-8 leading-tight">{item.customLabel}</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Base: {item.name}</div>
                
                <button 
                  onClick={() => removeFromCart(item.cartId)}
                  className="absolute top-4 right-4 text-gray-300 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
                
                <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-50">
                  <div className="bg-gray-50 px-3 py-1.5 rounded-lg text-sm font-black text-gray-600 border border-gray-100">
                    {item.enteredQty} {item.enteredUnit} <span className="text-gray-400 mx-1">x</span> ₹{item.enteredPrice}
                  </div>
                  <div className="font-black text-amber-600 text-xl">₹{(item.enteredQty * item.enteredPrice).toLocaleString('en-IN')}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-5 lg:p-6 bg-white border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] shrink-0 rounded-t-3xl">
          <div className="flex justify-between items-center mb-4 text-gray-500 font-bold text-sm">
            <span>Total Purchase Amount</span>
            <span className="font-black text-gray-900 text-lg">₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>
          
          <div className="flex items-center justify-between mb-4 bg-gray-50 p-2 rounded-xl border border-gray-100 focus-within:border-amber-400 transition-colors">
            <span className="text-gray-400 font-black text-[10px] uppercase tracking-widest pl-2 flex items-center gap-1.5"><Wallet size={12}/> Paid (₹)</span>
            <input 
              type="number" placeholder="0.00" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)}
              className="w-32 text-right p-2 bg-transparent font-black text-gray-900 text-xl outline-none"
            />
          </div>

          <div className="flex justify-between items-center mb-6">
            <span className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Balance Pending</span>
            <span className={`font-black text-xl ${currentDue > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
              ₹{currentDue > 0 ? currentDue.toLocaleString('en-IN') : 0}
            </span>
          </div>

          <button onClick={handleSubmit} disabled={isSubmitting || cart.length === 0} className="w-full bg-[#0f0f0f] hover:bg-black text-amber-500 font-black py-4 rounded-xl flex justify-center items-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-70 text-sm tracking-widest uppercase">
            {isSubmitting ? "Processing..." : <><CheckCircle size={18} /> Confirm Stock</>}
          </button>
        </div>
      </div>

      {/* ─── MOBILE SMART CART (Tokri Logic - Dark Theme) ─── */}
      {!isCartOpen && (
        <div className="lg:hidden fixed bottom-6 z-40 animate-in slide-in-from-bottom-10 transition-all duration-300 pointer-events-none w-full">
          
          {/* CONDITION 1: KHALI CART (Sirf Gol Tokri) */}
          {cart.length === 0 ? (
            <div className="absolute right-4 bottom-0 pointer-events-auto">
              <button 
                onClick={() => setIsCartOpen(true)}
                className="bg-[#0f0f0f] border border-[#333] text-amber-500 p-4 rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.6)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
              >
                <ShoppingCart size={24} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            
          /* CONDITION 2: BHARA HUA CART (Zomato Style Bar) */
            <div className="px-4 pointer-events-auto">
              <button 
                onClick={() => setIsCartOpen(true)}
                className="w-full bg-[#0f0f0f] border border-amber-500/30 text-amber-500 p-3.5 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.8)] flex items-center justify-between font-black active:scale-95 transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/20"><ShoppingCart size={20} /></div>
                  <div className="text-left leading-tight">
                    <div className="text-sm text-white">{cart.length} Items</div>
                    <div className="text-[10px] text-amber-500/80 uppercase tracking-widest mt-0.5">₹{totalAmount.toLocaleString('en-IN')} Total</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs tracking-widest uppercase text-gray-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">View <ChevronRight size={16}/></div>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL: ADD NEW PRODUCT (Updated with Company & Custom Category) ─── */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-4 bg-gray-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-[#0f0f0f] shrink-0">
              <h3 className="font-black text-white text-lg flex items-center gap-2 tracking-widest uppercase">
                <Package size={20} className="text-amber-500" /> Fast Registration
              </h3>
              <button onClick={() => setShowAddProductModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-5 md:p-6 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Product Name *</label>
                  <input type="text" required placeholder="e.g. Super DAP 50kg" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-amber-500 transition-colors" />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Company Name <span className="text-gray-400 normal-case">(Optional)</span></label>
                  <input type="text" placeholder="e.g. IFFCO, Bayer..." value={newProduct.company} onChange={(e) => setNewProduct({...newProduct, company: e.target.value})} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-amber-500 transition-colors" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Brand / Variety</label>
                  <input type="text" placeholder="e.g. Ujjawal, Hybrid..." value={newProduct.brand} onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-amber-500 transition-colors" />
                </div>

                <div className={`md:col-span-2 grid grid-cols-1 ${newProduct.category === "Other" ? "md:grid-cols-2" : "md:grid-cols-1"} gap-4 transition-all duration-300`}>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Category</label>
                    <select value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value, customCategory: ""})} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-amber-500 transition-colors">
                      <option value="Fertilizer">Fertilizer (Khaad)</option>
                      <option value="Pesticide">Pesticide (Dawai)</option>
                      <option value="Seed">Seeds (Beej)</option>
                      <option value="Tool">Tools (Ozaar)</option>
                      <option value="Other">Other (Custom Entry)</option>
                    </select>
                  </div>
                  {newProduct.category === "Other" && (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                      <label className="block text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Type Custom Category *</label>
                      <input type="text" required placeholder="e.g. Animal Feed..." value={newProduct.customCategory} onChange={(e) => setNewProduct({...newProduct, customCategory: e.target.value})} className="w-full px-4 py-3.5 bg-amber-50 border border-amber-200 rounded-xl font-black text-amber-900 outline-none focus:ring-2 focus:ring-amber-500/20 transition-colors" />
                    </div>
                  )}
                </div>
              </div>

              {/* Smart Measurement Module */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-2">
                <label className="block text-[10px] font-black text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2"><Tag size={14}/> Stock & Pricing Setup</label>
                
                <div className="flex gap-3 mb-6 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                  <label className={`flex-1 text-center py-2.5 rounded-lg cursor-pointer transition-all ${newProduct.measureType === "loose" ? "bg-[#0f0f0f] text-amber-500 font-black shadow-md" : "text-gray-500 font-bold hover:text-gray-900"}`}>
                    <input type="radio" className="hidden" checked={newProduct.measureType === "loose"} onChange={() => setNewProduct({...newProduct, measureType: "loose"})} /> Khulla (Loose)
                  </label>
                  <label className={`flex-1 text-center py-2.5 rounded-lg cursor-pointer transition-all ${newProduct.measureType === "packaged" ? "bg-[#0f0f0f] text-amber-500 font-black shadow-md" : "text-gray-500 font-bold hover:text-gray-900"}`}>
                    <input type="radio" className="hidden" checked={newProduct.measureType === "packaged"} onChange={() => setNewProduct({...newProduct, measureType: "packaged"})} /> Packaged (Bori/Bag)
                  </label>
                </div>

                {newProduct.measureType === "loose" && (
                  <div className="grid grid-cols-3 gap-3 animate-in fade-in duration-300">
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Unit</label>
                      <select value={newProduct.baseUnit} onChange={(e) => setNewProduct({...newProduct, baseUnit: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none"><option value="KG">KG</option><option value="Ltr">Litre</option><option value="Pcs">Piece</option></select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Buy/Unit</label>
                      <input type="number" placeholder="0" value={newProduct.buyPrice} onChange={(e) => setNewProduct({...newProduct, buyPrice: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Sell/Unit *</label>
                      <input type="number" placeholder="0" required value={newProduct.sellPrice} onChange={(e) => setNewProduct({...newProduct, sellPrice: e.target.value})} className="w-full p-3 bg-amber-50 border border-amber-200 rounded-xl font-black text-amber-800 outline-none focus:ring-2 focus:ring-amber-500/20" />
                    </div>
                  </div>
                )}

                {newProduct.measureType === "packaged" && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <div className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div><label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Pack Type</label><select value={newProduct.packageUnit} onChange={(e) => setNewProduct({...newProduct, packageUnit: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg font-bold text-sm outline-none focus:border-amber-500"><option value="Bag">Bora (Bag)</option><option value="Box">Peti (Box)</option><option value="Packet">Packet (Pkt)</option></select></div>                      <div><label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 text-center">Inside Wt.</label><input type="number" required value={newProduct.qtyPerPackage} onChange={(e) => setNewProduct({...newProduct, qtyPerPackage: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg font-black text-sm text-center outline-none" placeholder="e.g. 50" /></div>
                      <div><label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Inside Unit</label><select value={newProduct.baseUnit} onChange={(e) => setNewProduct({...newProduct, baseUnit: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg font-bold text-sm outline-none"><option value="KG">KG</option><option value="Ltr">Litre</option></select></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-xl border border-gray-200 relative overflow-hidden">
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">1 {newProduct.packageUnit} Buy Price</label>
                        <input type="number" placeholder="₹ Rate" value={newProduct.packBuyPrice} onChange={(e) => setNewProduct({...newProduct, packBuyPrice: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg font-black text-gray-900 mb-3 outline-none" />
                        <div className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100 flex justify-between"><span>BASE =</span><span>₹{newProduct.buyPrice || 0} /{newProduct.baseUnit}</span></div>
                      </div>
                      <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 relative overflow-hidden">
                        <label className="block text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2">1 {newProduct.packageUnit} Sell Price *</label>
                        <input type="number" placeholder="₹ Rate" required value={newProduct.packSellPrice} onChange={(e) => setNewProduct({...newProduct, packSellPrice: e.target.value})} className="w-full p-3 bg-white border border-amber-300 rounded-lg font-black text-amber-900 mb-3 outline-none focus:ring-2 focus:ring-amber-500/20" />
                        <div className="text-[10px] font-black text-amber-700 bg-white px-2 py-1.5 rounded-lg border border-amber-100 shadow-sm flex justify-between"><span>BASE =</span><span>₹{newProduct.sellPrice || 0} /{newProduct.baseUnit}</span></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>

            <div className="p-5 border-t border-gray-100 bg-white shrink-0 flex gap-3">
              <button type="button" onClick={() => setShowAddProductModal(false)} className="flex-1 py-4 font-black text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest text-xs">Cancel</button>
              <button type="submit" onClick={handleCreateProduct} disabled={isAddingProduct} className="flex-[2] py-4 font-black text-amber-500 bg-[#0f0f0f] rounded-xl hover:bg-black shadow-xl shadow-black/20 transition-all flex justify-center items-center gap-2 active:scale-95 disabled:opacity-70 uppercase tracking-widest text-xs">
                {isAddingProduct ? "Saving..." : <><CheckCircle size={18} /> Register & Add to Cart</>}
              </button>
            </div>

          </div>
        </div>
      )}
{/* ─── THE SMART UNIT ADDER MODAL (PURCHASE SPECIFIC - DARK GOLD) ─── */}
      {activeItem && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-[#0f0f0f]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1a1a1a] w-full max-w-sm rounded-[2rem] shadow-[0_0_50px_rgba(245,158,11,0.15)] border border-[#333] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            <div className="p-5 border-b border-[#333] flex justify-between items-start bg-[#0f0f0f] shrink-0">
              <div>
                <h3 className="font-black text-white text-xl leading-tight pr-4">{activeItem?.name}</h3>
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1.5">Adding to Inventory</p>
              </div>
              <button onClick={() => setActiveItem(null)} className="p-2 bg-[#222] rounded-full border border-[#333] text-gray-400 hover:text-white shadow-sm shrink-0"><X size={18}/></button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden">
              {/* Dual Input: Qty & Unit */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">How much quantity purchased?</label>
                <div className="flex gap-2">
                  <input 
                    type="number" min="0" step="any"
                    value={draftConfig.qty} onChange={(e) => setDraftConfig({...draftConfig, qty: e.target.value})}
                    className="w-1/2 p-3.5 bg-[#0f0f0f] border border-[#333] rounded-xl font-black text-white text-center outline-none focus:border-amber-500 transition-colors"
                  />
                  <select 
                    value={draftConfig.unit} onChange={(e) => setDraftConfig({...draftConfig, unit: e.target.value})}
                    className="w-1/2 p-3.5 bg-[#0f0f0f] border border-[#333] rounded-xl font-bold text-sm text-gray-300 outline-none focus:border-amber-500 transition-colors"
                  >
                    {/* 👈 BUG FIX: Har jagah Packet ka option add kar diya! */}
                    {["KG", "Gram"].includes(activeItem?.unit) && (
                      <><option value="KG">Kilo (KG)</option><option value="Gram">Gram (g)</option><option value="Custom_Bag">Bag / Bori</option><option value="Quintal">Quintal</option><option value="Ton">Ton</option><option value="Packet">Packet (Pkt)</option></>
                    )}
                    {["Litre", "ML", "ml"].includes(activeItem?.unit) && (
                      <><option value="Litre">Litre (L)</option><option value="ml">ML</option><option value="Packet">Packet (Pkt)</option></>
                    )}
                    {!["KG", "Gram", "Litre", "ML", "ml"].includes(activeItem?.unit) && (
                      <><option value={activeItem?.unit}>{activeItem?.unit}</option><option value="Dozen">Dozen</option><option value="Box">Box</option><option value="Packet">Packet (Pkt)</option></>
                    )}
                  </select>
                </div>
                
                {/* DYNAMIC BAG WEIGHT INPUT */}
                {draftConfig.unit === "Custom_Bag" && (
                  <div className="mt-3 flex items-center justify-between bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 animate-in fade-in zoom-in-95">
                    <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest">1 Bag Weight =</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" value={draftConfig.customMultiplier} 
                        onChange={(e) => setDraftConfig({...draftConfig, customMultiplier: e.target.value})} 
                        className="w-16 p-1.5 rounded-lg text-sm font-black text-center text-white bg-[#0f0f0f] border border-amber-500/30 outline-none focus:border-amber-500" 
                      />
                      <span className="text-[10px] font-black text-amber-500 uppercase">{activeItem?.unit}</span>
                    </div>
                  </div>
                )}

                {/* ─── DYNAMIC BULK PACKET CALCULATOR (Crash-Proof) ─── */}
                {(draftConfig.unit === "Packet" || activeItem?.unit === "Packet" || activeItem?.packageUnit === "Packet") && (
                  <div className="mt-3 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 animate-in fade-in zoom-in-95">
                    <label className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase cursor-pointer mb-2">
                      <input type="checkbox" checked={bulkCalc.active} onChange={(e) => setBulkCalc({...bulkCalc, active: e.target.checked})} className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4 accent-amber-500 bg-[#0f0f0f] border-amber-500/30"/>
                      Packets Bori / Box ke andar hain? (Auto-Calculate)
                    </label>
                    {bulkCalc.active && (
                      <div className="grid grid-cols-2 gap-3 mt-2 border-t border-amber-500/20 pt-3">
                        <div><label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Total Bori / Box</label><input type="number" value={bulkCalc.outerCount} onChange={e => setBulkCalc({...bulkCalc, outerCount: e.target.value})} className="w-full p-2 bg-[#0f0f0f] border border-[#333] rounded-lg text-sm text-white outline-none focus:border-amber-500" placeholder="e.g. 10"/></div>
                        <div><label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Packets in 1 Bori</label><input type="number" value={bulkCalc.innerCount} onChange={e => setBulkCalc({...bulkCalc, innerCount: e.target.value})} className="w-full p-2 bg-[#0f0f0f] border border-[#333] rounded-lg text-sm text-white outline-none focus:border-amber-500" placeholder="e.g. 20"/></div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Dynamic Price Override (BUY RATE) */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block flex items-center gap-1"><Tag size={12}/> Buy Rate Per Unit (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-black">₹</span>
                  <input 
                    type="number" 
                    value={draftConfig.price} onChange={(e) => setDraftConfig({...draftConfig, price: e.target.value})}
                    className="w-full pl-9 pr-4 py-3.5 bg-[#0f0f0f] border border-[#333] rounded-xl font-black text-white outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              {/* Receipt Label / Memo Note */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Stock Note / Parchi Label</label>
                <input 
                  type="text" placeholder="e.g., 20 Bori IFFCO 45kg"
                  value={draftConfig.customLabel} onChange={(e) => setDraftConfig({...draftConfig, customLabel: e.target.value})}
                  className="w-full p-3.5 bg-[#0f0f0f] border border-[#333] rounded-xl font-bold text-sm text-white outline-none focus:border-amber-500 transition-colors placeholder-gray-600"
                />
                <p className="text-[9px] font-bold text-gray-500 mt-2 leading-relaxed">Leave empty to use original name. <span className="text-amber-500 font-black">{(Number(draftConfig.qty) * getMultiplier(draftConfig.unit, draftConfig.customMultiplier)) || 0} {activeItem?.unit}</span> will be added to your inventory.</p>
              </div>
            </div>

            <div className="p-5 border-t border-[#333] bg-[#0f0f0f] shrink-0">
              <button onClick={confirmAddToCart} className="w-full bg-amber-500 hover:bg-amber-400 text-gray-900 font-black py-4 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.2)] active:scale-95 transition-all text-lg">
                Add Stock - ₹{(draftConfig.qty * draftConfig.price).toLocaleString('en-IN')}
              </button>
            </div>
          </div>
        </div>
      )}
       
       
    </div>
  );
}