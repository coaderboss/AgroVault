"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { 
  Search, Plus, Package, ArrowLeft, ArrowRight, 
  MoreVertical, X, Check, Box, Layers, Tag, AlertTriangle, CheckCircle2, Trash2, ChevronDown
} from "lucide-react";

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false); // Naya state: Load More button ke liye
  
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
  
  const [viewingProduct, setViewingProduct] = useState(null); 
  const [isDeleting, setIsDeleting] = useState(false);

  const [localAlert, setLocalAlert] = useState({ show: false, type: "", message: "" });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [bulkCalc, setBulkCalc] = useState({ active: false, outerCount: "", innerCount: "" });

  const showLocalAlert = (type, message) => {
    setLocalAlert({ show: true, type, message });
    setTimeout(() => setLocalAlert({ show: false, type: "", message: "" }), 4000);
  };

  const triggerDelete = (id) => {
    setDeleteConfirm({ show: true, id });
    setActiveDropdown(null);
  };

  const confirmDeleteProduct = async () => {
    if (!deleteConfirm.id) return;
    setIsDeleting(true);
    try {
      const token = Cookies.get("auth_token");
      await axios.delete(`https://agrovault.onrender.com/api/products/${deleteConfirm.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Delete hone par shuru se load karo
      setProducts([]); 
      setCurrentPage(1);
      fetchInventory(1, false); 
      showLocalAlert("success", "Item inventory se hamesha ke liye delete ho gaya!");
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Item delete karne mein error aaya!";
      showLocalAlert("error", errorMsg);
    } finally {
      setIsDeleting(false);
      setDeleteConfirm({ show: false, id: null });
    }
  };

  // ─── BULK PACKET ENGINE ───
  useEffect(() => {
    if (bulkCalc.active && bulkCalc.outerCount && bulkCalc.innerCount) {
        const totalPacks = Number(bulkCalc.outerCount) * Number(bulkCalc.innerCount);
        if (isModalOpen) setNewProduct(prev => ({...prev, packStock: totalPacks.toString()}));
        if (editModalOpen) setEditingProduct(prev => ({...prev, packStock: totalPacks.toString()}));
    }
  }, [bulkCalc.outerCount, bulkCalc.innerCount, bulkCalc.active, isModalOpen, editModalOpen]);

  // ─── INITIAL LOAD ───
  useEffect(() => {
    fetchInventory(1, false);
  }, []);

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

  // ─── UPDATED FETCH INVENTORY (Load More Logic) ───
  const fetchInventory = async (page, isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const token = Cookies.get("auth_token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      // Yahan api/products wale endpoint par call jayegi
      const res = await axios.get(`https://agrovault.onrender.com/api/products?page=${page}&limit=${limit}`, config);
      
      if (isLoadMore) {
        // Agar load more kiya hai, toh purane data mein naya data jod do
        setProducts(prev => [...prev, ...res.data.data]);
      } else {
        // Agar pehli baar load ho raha hai, toh seedha data daal do
        setProducts(res.data.data);
      }

      setTotalPages(res.data.pagination.totalPages);
      setTotalItems(res.data.pagination.totalItems);
      setCurrentPage(page);
    } catch (error) {
      console.error("Fetch error", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Naya function Load More button ke liye
  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      fetchInventory(currentPage + 1, true);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.sellPrice || !newProduct.stockQty) return showLocalAlert("error", "Important fields missing!");

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
      setIsModalOpen(false); setNewProduct(baseProductState); 
      setProducts([]); // List khali karo
      fetchInventory(1, false); // Naya item aane par shuru se load karo
      showLocalAlert("success", "Item successfully added to inventory!");
    } catch (error) {
      showLocalAlert("error", "Error adding item!");
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
      setEditModalOpen(false); setEditingProduct(null); 
      // Update hone par shuru se data magwao taaki galti na ho
      setProducts([]);
      fetchInventory(1, false); 
      showLocalAlert("success", "Inventory item updated successfully!");
    } catch (error) {
      showLocalAlert("error", "Error updating item!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="animate-in fade-in duration-500 pb-24 lg:pb-6 relative max-w-7xl mx-auto px-0 sm:px-4 md:px-6"> 
      {/* px-0 on mobile taaki edge-to-edge list bane */}
      
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
      
      {/* ─── HEADER COMMAND CENTER (COMPACT EDGE-TO-EDGE) ─── */}
      <div className="bg-white p-3 md:p-5 shadow-sm border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 sticky top-0 z-20">
        <div>
          <h1 className="text-lg md:text-2xl font-black text-gray-900 flex items-center gap-1.5">
            <Layers className="text-indigo-600" size={22}/> My Godown
          </h1>
          {/* Subtitle hidden on phone to save space */}
          <p className="hidden md:block text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">Manage your warehouse stock and pricing</p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" placeholder="Search items..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="shrink-0 flex justify-center items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-black shadow-md shadow-indigo-600/20 active:scale-95 transition-all">
            <Plus size={18} /> <span className="hidden sm:inline">Add Item</span><span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* ─── INVENTORY LIST (Edge-to-Edge Design) ─── */}
      <div className="bg-white sm:rounded-[2rem] border-x-0 sm:border border-gray-100 shadow-none sm:shadow-sm overflow-hidden flex flex-col mb-6">
        {loading && products.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Box size={48} className="mb-4 opacity-50" strokeWidth={1.5} />
            <p className="font-black text-lg text-gray-600">Godown Empty</p>
          </div>
        ) : (
          <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="w-full text-left min-w-[800px] md:min-w-full">
              <thead className="bg-white border-b border-gray-200 sticky top-0 z-10 hidden sm:table-header-group">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Product Details</th>
                  <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center whitespace-nowrap">Current Stock</th>
                  <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right whitespace-nowrap">Pricing</th>
                  <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/50">
                {filteredProducts.map((product) => {
                  const totalBags = product.isPackaged ? Math.floor(product.stockQty / product.qtyPerPackage) : 0;
                  const isLowStock = product.stockQty < 20;

                  return (
                    <tr key={product.id} className="bg-white even:bg-indigo-50/40 hover:bg-indigo-50 transition-colors group cursor-pointer" onClick={(e) => {
                      if (!e.target.closest('.action-btn')) {
                        setViewingProduct(product);
                      }
                    }}>
                      
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white shadow-sm border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                            <Package size={20} strokeWidth={2.5}/>
                          </div>
                          <div>
                            <div className="font-black text-sm sm:text-base text-gray-900 leading-tight">{product.name}</div>
                            <div className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">{product.brand || 'No Brand'} • {product.category}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
                        {product.isPackaged ? (
                           <div className="flex flex-col items-center justify-center gap-1.5">
                             <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black shadow-sm ${isLowStock ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-white text-indigo-700 border border-indigo-200'}`}>
                               {totalBags} {product.packageUnit}s
                             </span>
                             <span className="text-[10px] font-black text-gray-500">
                               Total: {product.stockQty} {product.unit}
                             </span>
                           </div>
                        ) : (
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-black shadow-sm ${isLowStock ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-white text-emerald-700 border border-emerald-200'}`}>
                            {product.stockQty} {product.unit} LEFT
                          </span>
                        )}
                      </td>

                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                        {product.isPackaged ? (
                          <>
                           <div className="font-black text-base text-gray-900">₹{product.sellPrice * product.qtyPerPackage} <span className="text-[10px] text-gray-400 font-bold uppercase">/1 {product.packageUnit}</span></div>
                           <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Base: ₹{product.sellPrice}/{product.unit}</div>
                          </>
                        ) : (
                          <>
                           <div className="font-black text-base text-gray-900">₹{product.sellPrice} <span className="text-xs text-gray-400 font-bold">/{product.unit}</span></div>
                           <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Buy: ₹{product.buyPrice}</div>
                          </>
                        )}
                      </td>

                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center relative action-btn">
                        <button 
                          onClick={() => setActiveDropdown(activeDropdown === product.id ? null : product.id)}
                          className="text-gray-400 hover:text-indigo-600 transition-colors p-2 rounded-xl hover:bg-white inline-flex items-center justify-center shadow-sm border border-transparent hover:border-gray-200"
                        >
                          <MoreVertical size={20} />
                        </button>
                        
                        {activeDropdown === product.id && (
                          <div className="absolute right-6 sm:right-16 top-10 w-32 bg-white rounded-xl shadow-xl z-50 overflow-hidden border border-gray-200 py-1">
                            <button 
                              onClick={() => {
                                let initialCompany = "";
                                let initialBrand = product.brand || "";
                                if (initialBrand.includes(" | ")) {
                                  const parts = initialBrand.split(" | ");
                                  initialCompany = parts[0];
                                  initialBrand = parts[1];
                                }
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
                              className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                              Edit Item
                            </button>
                            
                            <button 
                              disabled={isDeleting}
                              onClick={() => triggerDelete(product.id)}
                              className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2 border-t border-gray-100"
                            >
                              <Trash2 size={14} /> Delete Item
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

        {/* ─── LOAD MORE BUTTON ─── */}
        {!loading && products.length > 0 && currentPage < totalPages && !searchQuery && (
           <div className="p-4 flex justify-center bg-white sm:bg-transparent">
             <button 
               onClick={handleLoadMore} 
               disabled={loadingMore}
               className="w-full sm:w-auto px-6 py-3 bg-white border border-gray-200 text-gray-700 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-gray-50 shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95"
             >
               {loadingMore ? (
                 <><div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div> Loading...</>
               ) : (
                 <><ChevronDown size={16} /> Load More Items</>
               )}
             </button>
           </div>
        )}

        {/* ─── END OF LIST MESSAGE ─── */}
        {!loading && products.length > 0 && currentPage >= totalPages && !searchQuery && (
            <div className="p-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white sm:bg-transparent">
               • You have reached the end of your Godown •
            </div>
        )}

      </div>

      {/* ─── ADD/EDIT PRODUCT MODAL COMPONENT (Baki code same rahega) ─── */}
      {(isModalOpen || editModalOpen) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-gray-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-indigo-50 shrink-0">
              <h3 className="font-black text-gray-900 text-lg flex items-center gap-2 uppercase tracking-widest">
                <Package size={20} className="text-indigo-600" /> 
                {isModalOpen ? 'New Godown Item' : 'Update Stock Details'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); setEditModalOpen(false); setEditingProduct(null); setBulkCalc({active: false, outerCount: "", innerCount: ""}); }} className="text-gray-500 hover:bg-white p-2 rounded-full transition-colors shadow-sm">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={isModalOpen ? handleAddProduct : handleUpdateProduct} className="p-5 md:p-6 overflow-y-auto flex-1">
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
                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="grid grid-cols-3 gap-3 mb-3">
                              <div><label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Pack Type</label><select value={state.packageUnit} onChange={(e) => setState({...state, packageUnit: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg font-bold text-sm outline-none focus:border-indigo-500"><option value="Bag">Bora (Bag)</option><option value="Box">Peti (Box)</option><option value="Packet">Packet (Pkt)</option></select></div>
                              <div><label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 text-center">Inside Wt.</label><input type="number" required value={state.qtyPerPackage} onChange={(e) => setState({...state, qtyPerPackage: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg font-black text-sm text-center outline-none focus:border-indigo-500" placeholder="e.g. 50" /></div>
                              <div><label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Inside Unit</label><select value={state.baseUnit} onChange={(e) => setState({...state, baseUnit: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg font-bold text-sm outline-none focus:border-indigo-500"><option value="KG">KG</option><option value="Ltr">Litre</option></select></div>
                            </div>

                            {/* ─── BULK PACKET CALCULATOR (Bori ke andar packet) ─── */}
                            {state.packageUnit === "Packet" && (
                              <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm animate-in fade-in zoom-in-95">
                                <label className="flex items-center gap-2 text-[10px] font-black text-indigo-700 uppercase cursor-pointer mb-2">
                                  <input type="checkbox" checked={bulkCalc.active} onChange={(e) => setBulkCalc({...bulkCalc, active: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"/>
                                  Packets Bori / Box ke andar hain? (Auto-Calculate)
                                </label>
                                {bulkCalc.active && (
                                  <div className="grid grid-cols-2 gap-3 mt-2 border-t border-gray-100 pt-3">
                                    <div><label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Total Bori / Box</label><input type="number" value={bulkCalc.outerCount} onChange={e => setBulkCalc({...bulkCalc, outerCount: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500" placeholder="e.g. 10"/></div>
                                    <div><label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Packets in 1 Bori</label><input type="number" value={bulkCalc.innerCount} onChange={e => setBulkCalc({...bulkCalc, innerCount: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500" placeholder="e.g. 20"/></div>
                                  </div>
                                )}
                              </div>
                            )}
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
            
            <div className="p-5 border-t border-gray-100 bg-white shrink-0 flex gap-3">
              <button type="button" onClick={() => { setIsModalOpen(false); setEditModalOpen(false); setEditingProduct(null); setBulkCalc({active: false, outerCount: "", innerCount: ""}); }} className="w-1/3 py-4 font-black text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest text-xs">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} onClick={isModalOpen ? handleAddProduct : handleUpdateProduct} className="w-2/3 py-4 font-black text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all flex justify-center items-center gap-2 active:scale-95 disabled:opacity-70 uppercase tracking-widest text-xs">
                {isSubmitting ? "Saving..." : <><Check size={18} /> Confirm</>}
              </button>
            </div>

          </div>
        </div>
      )}
       
       {/* ─── PRODUCT DETAILS (X-RAY) MODAL (Baki code same rahega) ─── */}
      {viewingProduct && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setViewingProduct(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            
            <div className="bg-indigo-600 p-6 flex flex-col items-center justify-center relative">
              <button onClick={() => setViewingProduct(null)} className="absolute top-4 right-4 text-white/70 hover:text-white bg-indigo-700/50 hover:bg-indigo-700 p-2 rounded-full transition-colors">
                <X size={18} />
              </button>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-3 backdrop-blur-md border border-white/30">
                <Package size={28} />
              </div>
              <h3 className="font-black text-white text-xl text-center leading-tight mb-1">{viewingProduct.name}</h3>
              <p className="text-indigo-200 font-bold text-[10px] uppercase tracking-widest">{viewingProduct.brand || 'No Brand'} • {viewingProduct.category}</p>
            </div>

            <div className="p-5 bg-gray-50">
              <div className="space-y-2.5">
                {viewingProduct.isPackaged ? (
                  <>
                    <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm">
                      <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Available Stock</span>
                      <span className="font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg text-sm border border-indigo-100">
                        {Math.floor(viewingProduct.stockQty / viewingProduct.qtyPerPackage)} {viewingProduct.packageUnit}s
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-white p-3 rounded-2xl border border-gray-200 text-center shadow-sm">
                        <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Inside Wt.</span>
                        <span className="font-black text-gray-800 text-sm">{viewingProduct.qtyPerPackage} {viewingProduct.unit}</span>
                      </div>
                      <div className="bg-white p-3 rounded-2xl border border-gray-200 text-center shadow-sm">
                        <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Wt.</span>
                        <span className="font-black text-gray-800 text-sm">{viewingProduct.stockQty} {viewingProduct.unit}</span>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1 flex items-center gap-2"><Tag size={12}/> Complete Pricing</h4>
                      
                      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="flex justify-between p-3 border-b border-gray-100">
                          <span className="text-xs font-bold text-gray-500">1 {viewingProduct.packageUnit} Buy Rate</span>
                          <span className="font-black text-gray-900">₹{viewingProduct.buyPrice * viewingProduct.qtyPerPackage}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-emerald-50 border-b border-emerald-100">
                          <span className="text-xs font-black text-emerald-800">1 {viewingProduct.packageUnit} Sell Rate</span>
                          <span className="font-black text-emerald-700 text-base">₹{viewingProduct.sellPrice * viewingProduct.qtyPerPackage}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-50">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Base Rate (Per {viewingProduct.unit})</span>
                          <span className="font-black text-gray-600">Buy: ₹{viewingProduct.buyPrice} | Sell: ₹{viewingProduct.sellPrice}</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm">
                      <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Current Stock</span>
                      <span className="font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg text-sm border border-emerald-100">
                        {viewingProduct.stockQty} {viewingProduct.unit}
                      </span>
                    </div>

                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1 flex items-center gap-2"><Tag size={12}/> Pricing Per {viewingProduct.unit}</h4>
                      
                      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="flex justify-between p-3 border-b border-gray-100">
                          <span className="text-xs font-bold text-gray-500">Buy Price</span>
                          <span className="font-black text-gray-900">₹{viewingProduct.buyPrice}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-emerald-50">
                          <span className="text-xs font-black text-emerald-800">Sell Price</span>
                          <span className="font-black text-emerald-700 text-base">₹{viewingProduct.sellPrice}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─── DANGER: DELETE CONFIRMATION MODAL (Baki code same rahega) ─── */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 p-6 text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-rose-100">
              <Trash2 size={32} className="text-rose-600" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Delete Item?</h3>
            <p className="text-xs font-bold text-gray-500 mb-6 px-4">Yeh item hamesha ke liye inventory se saaf ho jayega aur bacha hua stock gayab ho jayega. Kya aap sure hain?</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirm({ show: false, id: null })} disabled={isDeleting}
                className="flex-1 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-black text-gray-600 hover:bg-gray-100 transition-colors uppercase tracking-widest"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteProduct} disabled={isDeleting}
                className="flex-1 py-3.5 bg-rose-600 rounded-xl text-xs font-black text-white hover:bg-rose-700 shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 uppercase tracking-widest active:scale-95"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}