"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie"; // Token nikalne ke liye
import { 
  ArrowLeft, Search, PackagePlus, Truck, Wallet, 
  Trash2, CheckCircle, Plus, X, Package, Tag
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

  // ─── NEW PRODUCT MODAL STATES ───
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "", brand: "", category: "Fertilizer", buyPrice: "", sellPrice: "", unit: "KG"
  });

  // ─── INITIAL DATA FETCH ───
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = Cookies.get("auth_token"); // Bouncer ke liye chaabi
        const config = { headers: { Authorization: `Bearer ${token}` } }; // Envelop tayar kiya

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

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // ─── CART LOGIC ───
  const addToCart = (product) => {
    const exists = cart.find(item => item.productId === product.id);
    if (exists) {
      setCart(cart.map(item => 
        item.productId === product.id ? { ...item, qty: item.qty + 1 } : item
      ));
    } else {
      setCart([{ 
        productId: product.id, 
        name: product.name, 
        unit: product.unit,
        qty: 1, 
        buyPrice: product.buyPrice || 0 
      }, ...cart]); 
    }
  };

  const updateCartItem = (productId, field, value) => {
    setCart(cart.map(item => 
      item.productId === productId ? { ...item, [field]: Number(value) } : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const totalAmount = cart.reduce((acc, item) => acc + (item.qty * item.buyPrice), 0);
  const currentDue = totalAmount - Number(paidAmount || 0);

  // ─── CREATE NEW PRODUCT ON THE FLY ───
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.sellPrice) return alert("Product Name and Selling Price are mandatory.");
    
    setIsAddingProduct(true);
    try {
      const token = Cookies.get("auth_token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const payload = { 
        ...newProduct, 
        buyPrice: Number(newProduct.buyPrice) || 0,
        sellPrice: Number(newProduct.sellPrice),
        stockQty: 0 
      };
      
      const res = await axios.post("https://agrovault.onrender.com/api/products", payload, config);
      const createdProd = res.data.data;

      setProducts([createdProd, ...products]);
      addToCart(createdProd);

      setShowAddProductModal(false);
      setNewProduct({ name: "", brand: "", category: "Fertilizer", buyPrice: "", sellPrice: "", unit: "KG" });

    } catch (error) {
      console.error(error);
      alert("Failed to create new product.");
    } finally {
      setIsAddingProduct(false);
    }
  };

  // ─── SUBMIT FINAL PURCHASE ───
  const handleSubmit = async () => {
    if (!selectedSupplier) return alert("Please select a Supplier first.");
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
          buyPrice: item.buyPrice
        }))
      };

      await axios.post("https://agrovault.onrender.com/api/purchases", payload, config);
      
      router.push(`/suppliers/${selectedSupplier}`);
      
    } catch (error) {
      alert("Failed to record purchase.");
      console.error(error);
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center font-bold text-gray-500 animate-pulse">Loading Workspace...</div>;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6 animate-in fade-in duration-300 relative">
      
      {/* ─── LEFT PANEL: PRODUCT CATALOG ─── */}
      <div className="flex-1 bg-white border border-gray-200 rounded-3xl shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors shadow-sm">
                <ArrowLeft size={18} />
              </button>
              <h2 className="text-xl font-black text-gray-900">Inventory Catalog</h2>
            </div>
            
            <button 
              onClick={() => setShowAddProductModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <Plus size={16} /> <span className="hidden sm:inline">Add New Product</span>
            </button>
          </div>
          
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" placeholder="Search existing products to restock..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <div 
                key={product.id} 
                onClick={() => addToCart(product)}
                className="bg-white border border-gray-100 hover:border-purple-300 p-4 rounded-2xl cursor-pointer hover:shadow-md transition-all group flex flex-col h-full relative overflow-hidden"
              >
                <div className="flex-1">
                  <div className="font-bold text-gray-900 text-sm leading-tight mb-1">{product.name}</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                    <Tag size={10}/> {product.brand || 'Generic'}
                  </div>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <div className="text-[10px] text-gray-500 font-bold mb-0.5 uppercase tracking-wider">Current Stock</div>
                    <div className={`text-xs font-black px-2 py-0.5 rounded-md inline-block ${product.stockQty > 10 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {product.stockQty} {product.unit}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 group-hover:bg-purple-100 group-hover:text-purple-600 flex items-center justify-center transition-colors">
                    <Plus size={16} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL: PURCHASE CART & SUPPLIER ─── */}
      <div className="w-full md:w-[450px] bg-white border border-gray-200 rounded-3xl shadow-sm flex flex-col overflow-hidden">
        
        <div className="p-5 border-b border-gray-100 bg-purple-50/30">
          <label className="flex items-center gap-2 text-xs font-black text-purple-700 uppercase tracking-widest mb-2">
            <Truck size={16} /> 1. Select Supplier
          </label>
          <select 
            value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl font-bold text-gray-900 focus:outline-none focus:border-purple-500 shadow-sm appearance-none cursor-pointer"
          >
            <option value="">-- Choose Mahajan / Supplier --</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} {s.company ? `(${s.company})` : ''}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-3 bg-gray-50/50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
              <PackagePlus size={48} className="text-gray-300 mb-4" />
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Cart is empty</p>
              <p className="text-xs text-gray-400 mt-2 font-medium max-w-[200px]">Click on existing products from the left or add a new one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item, idx) => (
                <div key={idx} className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm relative group">
                  <div className="font-bold text-gray-900 text-sm pr-8 mb-4">{item.name}</div>
                  <button 
                    onClick={() => removeFromCart(item.productId)}
                    className="absolute top-3 right-3 text-gray-300 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Qty ({item.unit})</label>
                      <input 
                        type="number" min="1" value={item.qty} 
                        onChange={(e) => updateCartItem(item.productId, 'qty', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-black text-gray-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1.5">Buying Price (₹)</label>
                      <input 
                        type="number" min="0" value={item.buyPrice} 
                        onChange={(e) => updateCartItem(item.productId, 'buyPrice', e.target.value)}
                        className="w-full px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg text-sm font-black text-purple-700 focus:outline-none focus:border-purple-500 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 bg-white p-5">
          <div className="flex justify-between items-center mb-5">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Invoice Amount</span>
            <span className="text-3xl font-black text-gray-900">₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 mb-5">
            <label className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
              <Wallet size={14} /> 2. Paid at Source (Cash/Bank)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">₹</span>
              <input 
                type="number" placeholder="Enter paid amount..." 
                value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl font-black text-gray-900 text-lg outline-none focus:border-purple-500 transition-all shadow-sm"
              />
            </div>
            {currentDue > 0 && (
              <div className="text-xs font-bold text-rose-500 mt-2.5 flex items-center justify-between">
                <span>Remaining Balance Due:</span>
                <span className="text-sm font-black">₹{currentDue.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>

          <button 
            onClick={handleSubmit} disabled={isSubmitting || cart.length === 0}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-purple-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <><CheckCircle size={20} /> 3. Confirm Purchase</>
            )}
          </button>
        </div>

      </div>

      {/* ─── MODAL: ADD NEW PRODUCT ─── */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50">
              <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                <Package className="text-indigo-600" size={20} /> Register New Product
              </h3>
              <button onClick={() => setShowAddProductModal(false)} className="text-gray-400 hover:bg-white hover:shadow-sm p-2 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Product Name *</label>
                  <input 
                    type="text" placeholder="e.g., Super DAP 50kg" required
                    value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Brand / Company</label>
                  <input 
                    type="text" placeholder="e.g., IFFCO" 
                    value={newProduct.brand} onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Category</label>
                  <select 
                    value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="Fertilizer">Fertilizer (Khaad)</option>
                    <option value="Pesticide">Pesticide (Dawai)</option>
                    <option value="Seed">Seeds (Beej)</option>
                    <option value="Tool">Hardware & Tools</option>
                    <option value="Other">Other Category</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Expected Buying Price (₹)</label>
                  <input 
                    type="number" placeholder="0" 
                    value={newProduct.buyPrice} onChange={(e) => setNewProduct({...newProduct, buyPrice: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-black text-gray-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 px-1">Customer Selling Price (₹) *</label>
                  <input 
                    type="number" placeholder="0" required
                    value={newProduct.sellPrice} onChange={(e) => setNewProduct({...newProduct, sellPrice: e.target.value})}
                    className="w-full px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl font-black text-indigo-700 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Measurement Unit</label>
                  <select 
                    value={newProduct.unit} onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="KG">Kilo (KG)</option>
                    <option value="Gram">Gram (g)</option>
                    <option value="Ltr">Litre (L)</option>
                    <option value="ml">Millilitre (ml)</option>
                    <option value="Pcs">Piece (Pcs)</option>
                    <option value="Bag">Bora / Bag</option>
                    <option value="Box">Peti / Box</option>
                    <option value="Quintal">Quintal</option>
                    <option value="Ton">Ton</option>
                  </select>
                </div>

              </div>

              <div className="pt-3 flex gap-3">
                <button 
                  type="button" onClick={() => setShowAddProductModal(false)}
                  className="flex-1 py-4 font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" disabled={isAddingProduct}
                  className="flex-[2] py-4 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 flex justify-center items-center gap-2 disabled:opacity-70"
                >
                  {isAddingProduct ? "Saving..." : <><CheckCircle size={20} /> Create & Add to Cart</>}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}