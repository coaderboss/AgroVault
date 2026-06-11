"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { 
  Search, Plus, Package, ArrowLeft, ArrowRight, 
  MoreVertical, X, Check, Box, Layers, Tag
} from "lucide-react";

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10; 

  // Modals & Forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Base State Template
  const baseProductState = {
    name: "", company: "", brand: "", category: "Fertilizer", customCategory: "",
    measureType: "loose", baseUnit: "KG", packageUnit: "Bag", 
    qtyPerPackage: "", packBuyPrice: "", packSellPrice: "", packStock: "", 
    buyPrice: "", sellPrice: "", stockQty: ""
  };

  const [newProduct, setNewProduct] = useState(baseProductState);
  const [editingProduct, setEditingProduct] = useState(null);

  // ─── BUG FIX: INITIAL FETCH HOOK ───
  useEffect(() => {
    fetchInventory(currentPage);
  }, [currentPage]); // Ab page load hote hi aur page change hone par data fetch hoga

  // ─── THE MATH ENGINE ───
  const calculatePackagedMath = (stateObj, setStateFunc) => {
    if (stateObj.measureType === "packaged" && stateObj.qtyPerPackage > 0) {
      setStateFunc(prev => ({
        ...prev,
        buyPrice: prev.packBuyPrice ? (Number(prev.packBuyPrice) / Number(prev.qtyPerPackage)).toFixed(2) : "",
        sellPrice: prev.packSellPrice ? (Number(prev.packSellPrice) / Number(prev.qtyPerPackage)).toFixed(2) : "",
        stockQty: prev.packStock ? (Number(prev.packStock) * Number(prev.qtyPerPackage)).toString() : ""
      }));
    }
  };

  useEffect(() => calculatePackagedMath(newProduct, setNewProduct), 
    [newProduct.packBuyPrice, newProduct.packSellPrice, newProduct.packStock, newProduct.qtyPerPackage, newProduct.measureType]);

  useEffect(() => {
    if (editingProduct) calculatePackagedMath(editingProduct, setEditingProduct);
  }, [editingProduct?.packBuyPrice, editingProduct?.packSellPrice, editingProduct?.packStock, editingProduct?.qtyPerPackage, editingProduct?.measureType]);

  const fetchInventory = async (page) => {
    setLoading(true);
    try {
      const token = Cookies.get("auth_token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`https://agrovault.onrender.com/api/products?page=${page}&limit=${limit}`, config);
      setProducts(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotalItems(res.data.pagination.totalItems);
    } catch (error) {
      console.error("Fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  // 👇 YEH 2 FUNCTIONS MISSING THE 👇
  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };
  // 👆 ============================== 👆

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.sellPrice || !newProduct.stockQty) return alert("Important fields missing!");

    setIsSubmitting(true);
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
        stockQty: Number(newProduct.stockQty) || 0
      };

      await axios.post("https://agrovault.onrender.com/api/products", payload, config);
      setIsModalOpen(false); setNewProduct(baseProductState); fetchInventory(1); setCurrentPage(1);
    } catch (error) {
      alert("Error adding item!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = Cookies.get("auth_token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const finalCategory = editingProduct.category === "Other" ? (editingProduct.customCategory || "Other") : editingProduct.category;
      const finalBrand = editingProduct.company ? `${editingProduct.company} | ${editingProduct.brand}` : editingProduct.brand;

      const payload = {
        name: editingProduct.name, brand: finalBrand, category: finalCategory,
        unit: editingProduct.baseUnit, isPackaged: editingProduct.measureType === "packaged",
        packageUnit: editingProduct.measureType === "packaged" ? editingProduct.packageUnit : null,
        qtyPerPackage: editingProduct.measureType === "packaged" ? Number(editingProduct.qtyPerPackage) : null,
        buyPrice: Number(editingProduct.buyPrice) || 0, sellPrice: Number(editingProduct.sellPrice),
        stockQty: Number(editingProduct.stockQty) || 0
      };

      await axios.put(`https://agrovault.onrender.com/api/products/${editingProduct.id}`, payload, config);
      setEditModalOpen(false); setEditingProduct(null); fetchInventory(currentPage); 
    } catch (error) {
      alert("Error updating item!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="animate-in fade-in duration-500 pb-24 lg:pb-6 relative max-w-7xl mx-auto px-2 sm:px-4 md:px-6">
      
      {/* ─── HEADER COMMAND CENTER ─── */}
      <div className="bg-white rounded-[2rem] p-5 md:p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Layers className="text-indigo-600" size={28}/> Master Inventory
          </h1>
          <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">Manage your warehouse stock and pricing</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" placeholder="Search by name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-indigo-500 transition-all shadow-inner"
            />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-black shadow-lg shadow-indigo-600/20 transition-all active:scale-95">
            <Plus size={18} /> Add Item
          </button>
        </div>
      </div>

      {/* ─── INVENTORY LIST (Scrollable Table for Both Mobile & Desktop) ─── */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col mb-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Box size={48} className="mb-4 opacity-50" strokeWidth={1.5} />
            <p className="font-black text-lg text-gray-600">Inventory Empty</p>
          </div>
        ) : (
          /* Yahan horizontal scrollbar hide kiya hai aur swipe smooth kiya hai */
          <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* min-w-[800px] force karta hai mobile par horizontal scroll ko */}
            <table className="w-full text-left min-w-[800px] md:min-w-full">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Product Details</th>
                  <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center whitespace-nowrap">Current Stock</th>
                  <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right whitespace-nowrap">Pricing</th>
                  <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProducts.map((product) => {
                  const totalBags = product.isPackaged ? Math.floor(product.stockQty / product.qtyPerPackage) : 0;
                  const isLowStock = product.stockQty < 20;

                  return (
                    <tr key={product.id} className="hover:bg-indigo-50/30 transition-colors group">
                      
                      {/* Column 1: Product Name & Details */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                            <Package size={20} strokeWidth={2.5}/>
                          </div>
                          <div>
                            <div className="font-black text-sm text-gray-900 leading-tight">{product.name}</div>
                            <div className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">{product.brand || 'No Brand'} • {product.category}</div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Smart Stock Display */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {product.isPackaged ? (
                           <div className="flex flex-col items-center justify-center gap-1.5">
                             <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black shadow-sm ${isLowStock ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
                               {totalBags} {product.packageUnit}s
                             </span>
                             <span className="text-[10px] font-black text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                               Total: {product.stockQty} {product.unit}
                             </span>
                           </div>
                        ) : (
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-black border ${isLowStock ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                            {product.stockQty} {product.unit} LEFT
                          </span>
                        )}
                      </td>

                      {/* Column 3: Pricing Data */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="font-black text-base text-gray-900">₹{product.sellPrice} <span className="text-xs text-gray-400 font-bold">/{product.unit}</span></div>
                        <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Buy: ₹{product.buyPrice}</div>
                      </td>

                      {/* Column 4: Edit Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-center relative">
                        <button 
                          onClick={() => setActiveDropdown(activeDropdown === product.id ? null : product.id)}
                          className="text-gray-400 hover:text-indigo-600 transition-colors p-2 rounded-xl hover:bg-indigo-50 inline-flex items-center justify-center"
                        >
                          <MoreVertical size={20} />
                        </button>
                        
                        {activeDropdown === product.id && (
                          <div className="absolute right-16 top-10 w-32 bg-gray-900 rounded-xl shadow-xl z-50 overflow-hidden border border-gray-800">
                            <button 
                              onClick={() => {
                              // Split Company and Brand if merged
                              let initialCompany = "";
                              let initialBrand = product.brand || "";
                              if (initialBrand.includes(" | ")) {
                                const parts = initialBrand.split(" | ");
                                initialCompany = parts[0];
                                initialBrand = parts[1];
                              }
                              // Handle Custom Category
                              const standardCategories = ["Fertilizer", "Pesticide", "Seed", "Tool"];
                              const isStandard = standardCategories.includes(product.category);

                              setEditingProduct({
                                ...product, 
                                company: initialCompany,
                                brand: initialBrand,
                                category: isStandard ? product.category : "Other",
                                customCategory: isStandard ? "" : product.category,
                                measureType: product.isPackaged ? "packaged" : "loose", baseUnit: product.unit,
                                packStock: product.isPackaged ? (product.stockQty / product.qtyPerPackage).toString() : "",
                                packBuyPrice: product.isPackaged ? (product.buyPrice * product.qtyPerPackage).toString() : "",
                                packSellPrice: product.isPackaged ? (product.sellPrice * product.qtyPerPackage).toString() : ""
                              }); 
                              setEditModalOpen(true); 
                              setActiveDropdown(null);
                            }}
                              className="w-full text-center px-4 py-3 text-xs font-black text-white hover:bg-gray-800 transition-colors uppercase tracking-widest"
                            >
                              Edit Item
                            </button>
                          </div>
                        )}
                      </td>
                      
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── PAGINATION CONTROLS ─── */}
        {!loading && products.length > 0 && (
          <div className="border-t border-gray-100 p-4 flex items-center justify-between bg-gray-50/50">
            <div className="text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest">
              Viewing <span className="text-indigo-600">{(currentPage - 1) * limit + 1}</span> to <span className="text-indigo-600">{Math.min(currentPage * limit, totalItems)}</span> of {totalItems}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handlePrevPage} disabled={currentPage === 1} className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-all shadow-sm active:scale-95"><ArrowLeft size={16} /></button>
              <div className="hidden md:block text-xs font-black text-gray-800 px-3 py-2 bg-white border border-gray-200 rounded-xl shadow-sm">Page {currentPage} of {totalPages}</div>
              <button onClick={handleNextPage} disabled={currentPage === totalPages || totalPages === 0} className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-all shadow-sm active:scale-95"><ArrowRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* ─── ADD/EDIT PRODUCT MODAL COMPONENT (Reused logic for both) ─── */}
      {/* Code size aur speed optimize karne ke liye Add aur Edit dono modals ko is block mein handle kar lenge, sirf condition badlegi */}
      {(isModalOpen || editModalOpen) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-gray-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-indigo-50 shrink-0">
              <h3 className="font-black text-gray-900 text-lg flex items-center gap-2 uppercase tracking-widest">
                <Package size={20} className="text-indigo-600" /> 
                {isModalOpen ? 'New Inventory Item' : 'Update Stock Details'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); setEditModalOpen(false); setEditingProduct(null); }} className="text-gray-500 hover:bg-white p-2 rounded-full transition-colors shadow-sm">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={isModalOpen ? handleAddProduct : handleUpdateProduct} className="p-5 md:p-6 overflow-y-auto flex-1">
              {/* Form State Binding (Uses newProduct if Add, editingProduct if Edit) */}
              {(() => {
                const state = isModalOpen ? newProduct : editingProduct;
                const setState = isModalOpen ? setNewProduct : setEditingProduct;

                return (
                  <>
                    {/* ─── BASIC DETAILS ─── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Product Name *</label>
                        <input type="text" required value={state.name} onChange={(e) => setState({...state, name: e.target.value})} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-indigo-500 transition-colors" />
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Company Name <span className="text-gray-400 normal-case">(Optional)</span></label>
                        <input type="text" placeholder="e.g. IFFCO, Bayer..." value={state.company || ""} onChange={(e) => setState({...state, company: e.target.value})} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-indigo-500 transition-colors" />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Brand / Variety</label>
                        <input type="text" placeholder="e.g. Ujjawal, Hybrid..." value={state.brand || ""} onChange={(e) => setState({...state, brand: e.target.value})} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-indigo-500 transition-colors" />
                      </div>

                      {/* Smart Category Grid: Desktop par single row lega jab tak 'Other' select na ho */}
                      <div className={`md:col-span-2 grid grid-cols-1 ${state.category === "Other" ? "md:grid-cols-2" : "md:grid-cols-1"} gap-4 transition-all duration-300`}>
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Category</label>
                          <select value={state.category} onChange={(e) => setState({...state, category: e.target.value, customCategory: ""})} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-indigo-500 transition-colors">
                            <option value="Fertilizer">Fertilizer (Khaad)</option>
                            <option value="Pesticide">Pesticide (Dawai)</option>
                            <option value="Seed">Seeds (Beej)</option>
                            <option value="Tool">Tools (Ozaar)</option>
                            <option value="Other">Other (Custom Entry)</option>
                          </select>
                        </div>
                        
                        {state.category === "Other" && (
                          <div className="animate-in fade-in zoom-in-95 duration-200">
                            <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Type Custom Category *</label>
                            <input type="text" required placeholder="e.g. Animal Feed, Machinery..." value={state.customCategory || ""} onChange={(e) => setState({...state, customCategory: e.target.value})} className="w-full px-4 py-3.5 bg-indigo-50 border border-indigo-200 rounded-xl font-black text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Smart Measurement Module */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-6">
                      <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2"><Tag size={14}/> Stock & Pricing Engine</label>
                      
                      <div className="flex gap-3 mb-6 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                        <label className={`flex-1 text-center py-2.5 rounded-lg cursor-pointer transition-all ${state.measureType === "loose" ? "bg-white text-indigo-600 font-black shadow-sm border border-gray-200" : "text-gray-500 font-bold hover:text-gray-900"}`}>
                          <input type="radio" className="hidden" checked={state.measureType === "loose"} onChange={() => setState({...state, measureType: "loose"})} /> Khulla (Loose)
                        </label>
                        <label className={`flex-1 text-center py-2.5 rounded-lg cursor-pointer transition-all ${state.measureType === "packaged" ? "bg-indigo-600 text-white font-black shadow-md" : "text-gray-500 font-bold hover:text-gray-900"}`}>
                          <input type="radio" className="hidden" checked={state.measureType === "packaged"} onChange={() => setState({...state, measureType: "packaged"})} /> Packaged (Bori/Bag)
                        </label>
                      </div>

                      {state.measureType === "loose" && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div><label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Unit</label><select value={state.baseUnit} onChange={(e) => setState({...state, baseUnit: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none"><option value="KG">KG</option><option value="Ltr">Litre</option><option value="Pcs">Piece</option></select></div>
                          <div><label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Stock</label><input type="number" required value={state.stockQty} onChange={(e) => setState({...state, stockQty: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none" /></div>
                          <div><label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Buy/Unit</label><input type="number" value={state.buyPrice} onChange={(e) => setState({...state, buyPrice: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none" /></div>
                          <div><label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Sell/Unit *</label><input type="number" required value={state.sellPrice} onChange={(e) => setState({...state, sellPrice: e.target.value})} className="w-full p-3 bg-indigo-50 border border-indigo-200 rounded-xl font-black text-indigo-800 outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                        </div>
                      )}

                      {state.measureType === "packaged" && (
                        <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                          <div className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div><label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Pack Type</label><select value={state.packageUnit} onChange={(e) => setState({...state, packageUnit: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg font-bold text-sm outline-none"><option value="Bag">Bora</option><option value="Box">Peti</option></select></div>
                            <div><label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 text-center">Inside Wt.</label><input type="number" required value={state.qtyPerPackage} onChange={(e) => setState({...state, qtyPerPackage: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg font-black text-sm text-center outline-none" placeholder="e.g. 50" /></div>
                            <div><label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Inside Unit</label><select value={state.baseUnit} onChange={(e) => setState({...state, baseUnit: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg font-bold text-sm outline-none"><option value="KG">KG</option><option value="Ltr">Litre</option></select></div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-xl border border-gray-200 relative overflow-hidden">
                              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Count ({state.packageUnit}s)</label>
                              <input type="number" required value={state.packStock} onChange={(e) => setState({...state, packStock: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg font-black text-lg text-gray-900 mb-3 outline-none" placeholder="0" />
                              <div className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-100 flex justify-between"><span>TOTAL =</span><span>{state.stockQty || 0} {state.baseUnit}</span></div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-200 relative overflow-hidden">
                              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Buy (1 {state.packageUnit})</label>
                              <input type="number" value={state.packBuyPrice} onChange={(e) => setState({...state, packBuyPrice: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg font-black text-lg text-gray-900 mb-3 outline-none" placeholder="₹0" />
                              <div className="text-[10px] font-black text-gray-500 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100 flex justify-between"><span>BASE =</span><span>₹{state.buyPrice || 0} /{state.baseUnit}</span></div>
                            </div>
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 relative overflow-hidden">
                              <label className="block text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-2">Sell (1 {state.packageUnit}) *</label>
                              <input type="number" required value={state.packSellPrice} onChange={(e) => setState({...state, packSellPrice: e.target.value})} className="w-full p-3 bg-white border border-indigo-300 rounded-lg font-black text-lg text-indigo-900 mb-3 outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="₹0" />
                              <div className="text-[10px] font-black text-indigo-700 bg-white px-2 py-1.5 rounded-lg border border-indigo-100 shadow-sm flex justify-between"><span>BASE =</span><span>₹{state.sellPrice || 0} /{state.baseUnit}</span></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </form>
            
            {/* Modal Footer */}
            <div className="p-5 border-t border-gray-100 bg-white shrink-0 flex gap-3">
              <button type="button" onClick={() => { setIsModalOpen(false); setEditModalOpen(false); setEditingProduct(null); }} className="w-1/3 py-4 font-black text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest text-xs">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} onClick={isModalOpen ? handleAddProduct : handleUpdateProduct} className="w-2/3 py-4 font-black text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all flex justify-center items-center gap-2 active:scale-95 disabled:opacity-70 uppercase tracking-widest text-xs">
                {isSubmitting ? "Saving..." : <><Check size={18} /> Confirm</>}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}