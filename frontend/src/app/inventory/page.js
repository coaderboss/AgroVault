"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie"; // 👈 Naya import (Token nikalne ke liye)
import { Search, Plus, Package, ArrowLeft, ArrowRight, MoreVertical, X, Check } from "lucide-react";

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 8; // Ek page par 8 items dikhayenge

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ─── SMART INVENTORY STATE ───
  const [newProduct, setNewProduct] = useState({
    name: "", brand: "", category: "Fertilizer", 
    measureType: "loose", // 'loose' (Khulla) ya 'packaged' (Bag/Box)
    baseUnit: "KG",       // KG, Ltr, Pcs
    packageUnit: "Bag",   // Bag, Box
    qtyPerPackage: "",    // e.g., 50 (1 bag mein kitna KG)
    packBuyPrice: "",     // Poore Bag ka Buy Rate
    packSellPrice: "",    // Poore Bag ka Sell Rate
    packStock: "",        // Kitne Bag/Box aaye hain
    buyPrice: "",         // Per KG Buy Rate
    sellPrice: "",        // Per KG Sell Rate
    stockQty: ""          // Per KG Total Stock
  });

  // ─── THE MATH ENGINE (Auto Calculate Prices & Stock) ───
  useEffect(() => {
    if (newProduct.measureType === "packaged" && newProduct.qtyPerPackage > 0) {
      setNewProduct(prev => ({
        ...prev,
        buyPrice: prev.packBuyPrice ? (Number(prev.packBuyPrice) / Number(prev.qtyPerPackage)).toFixed(2) : "",
        sellPrice: prev.packSellPrice ? (Number(prev.packSellPrice) / Number(prev.qtyPerPackage)).toFixed(2) : "",
        stockQty: prev.packStock ? (Number(prev.packStock) * Number(prev.qtyPerPackage)).toString() : ""
      }));
    }
  }, [newProduct.packBuyPrice, newProduct.packSellPrice, newProduct.packStock, newProduct.qtyPerPackage, newProduct.measureType]);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    if (editingProduct && editingProduct.measureType === "packaged" && editingProduct.qtyPerPackage > 0) {
      setEditingProduct(prev => ({
        ...prev,
        buyPrice: prev.packBuyPrice ? (Number(prev.packBuyPrice) / Number(prev.qtyPerPackage)).toFixed(2) : "",
        sellPrice: prev.packSellPrice ? (Number(prev.packSellPrice) / Number(prev.qtyPerPackage)).toFixed(2) : "",
        stockQty: prev.packStock ? (Number(prev.packStock) * Number(prev.qtyPerPackage)).toString() : ""
      }));
    }
  }, [editingProduct?.packBuyPrice, editingProduct?.packSellPrice, editingProduct?.packStock, editingProduct?.qtyPerPackage, editingProduct?.measureType]);

  const fetchInventory = async (page) => {
    setLoading(true);
    try {
      const token = Cookies.get("auth_token"); // 👈 Chaabi nikali
      const config = { headers: { Authorization: `Bearer ${token}` } }; // 👈 Envelop tayar kiya

      const res = await axios.get(`https://agrovault.onrender.com/api/products?page=${page}&limit=${limit}`, config); // 👈 Config bheja
      setProducts(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotalItems(res.data.pagination.totalItems);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch inventory", error);
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.sellPrice || !newProduct.stockQty) {
      return alert("Kripya Samaan ka Naam, Sale Price aur Stock bharein!");
    }

    setIsSubmitting(true);
    try {
      const token = Cookies.get("auth_token"); // 👈 Chaabi nikali
      const config = { headers: { Authorization: `Bearer ${token}` } }; // 👈 Envelop tayar kiya

      const payload = {
        name: newProduct.name,
        brand: newProduct.brand,
        category: newProduct.category,
        unit: newProduct.baseUnit,
        isPackaged: newProduct.measureType === "packaged",
        packageUnit: newProduct.measureType === "packaged" ? newProduct.packageUnit : null,
        qtyPerPackage: newProduct.measureType === "packaged" ? Number(newProduct.qtyPerPackage) : null,
        buyPrice: Number(newProduct.buyPrice) || 0,
        sellPrice: Number(newProduct.sellPrice),
        stockQty: Number(newProduct.stockQty) || 0
      };

      await axios.post("https://agrovault.onrender.com/api/products", payload, config); // 👈 Config bheja
      
      setIsModalOpen(false); 
      setNewProduct({ name: "", category: "Fertilizer", buyPrice: "", sellPrice: "", stockQty: "", unit: "KG", brand: "" }); 
      fetchInventory(1); 
      setCurrentPage(1);

    } catch (error) {
      alert("Item add karne mein gadbad hui!");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── UPDATE PRODUCT IN BACKEND ───
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = Cookies.get("auth_token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const payload = {
        name: editingProduct.name,
        brand: editingProduct.brand,
        category: editingProduct.category,
        unit: editingProduct.baseUnit,
        isPackaged: editingProduct.measureType === "packaged",
        packageUnit: editingProduct.measureType === "packaged" ? editingProduct.packageUnit : null,
        qtyPerPackage: editingProduct.measureType === "packaged" ? Number(editingProduct.qtyPerPackage) : null,
        buyPrice: Number(editingProduct.buyPrice) || 0,
        sellPrice: Number(editingProduct.sellPrice),
        stockQty: Number(editingProduct.stockQty) || 0
      };

      await axios.put(`https://agrovault.onrender.com/api/products/${editingProduct.id}`, payload, config);
      
      setEditModalOpen(false);
      setEditingProduct(null);
      fetchInventory(currentPage); 
    } catch (error) {
      alert("Item update karne mein gadbad hui!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 flex flex-col px-2 sm:px-4 md:px-0 pb-28 md:pb-10">
      
      {/* ─── PAGE HEADER ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 gap-3 md:gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Inventory</h1>
          <p className="text-xs md:text-sm text-gray-500 font-medium mt-0.5 md:mt-1">Manage your warehouse stock and pricing.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 md:w-[18px] md:h-[18px]" />
            <input 
              type="text" 
              placeholder="Search inventory..." 
              className="w-full pl-9 md:pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 md:px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap active:scale-95"
          >
            <Plus size={16} className="md:w-[18px] md:h-[18px]" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* ─── DATA TABLE ─── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
        {/* Yahan horizontal scrollbar hide kiya hai aur swipe smooth kiya hai */}
          <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {/* min-w-[200px] lagane se naam pichkega nahi */}
                  <th className="px-4 md:px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest min-w-[200px]">Product Details</th>
                  <th className="px-4 md:px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center min-w-[100px]">In Stock</th>
                  <th className="px-4 md:px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right min-w-[120px]">Price</th>
                  <th className="px-4 md:px-6 py-4 min-w-[60px]"></th>
                </tr>
              </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-20">
                    <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-20 text-gray-500 font-medium">No products found in inventory.</td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <Package size={18} />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-gray-900 whitespace-nowrap">{product.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5 whitespace-nowrap">{product.brand || 'No Brand'} • {product.category}</div>
                        </div>
                      </div>
                    </td>
                    {/* ─── SMART STOCK DISPLAY ─── */}
                    <td className="px-4 md:px-6 py-4 text-center">
                      {product.isPackaged && product.qtyPerPackage ? (
                         <div className="flex flex-col items-center gap-1">
                           <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-black border shadow-sm whitespace-nowrap ${
                             (product.stockQty / product.qtyPerPackage) > 5 ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-red-50 text-red-700 border-red-200'
                           }`}>
                             {(product.stockQty / product.qtyPerPackage).toFixed(1)} {product.packageUnit}s
                           </span>
                           <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-1.5 rounded-sm border border-gray-100">
                             Total: {product.stockQty} {product.unit}
                           </span>
                         </div>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${
                          product.stockQty > 10 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {product.stockQty} {product.unit}
                        </span>
                      )}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-right">
                      <div className="font-black text-sm md:text-base text-gray-900">₹{product.sellPrice.toLocaleString()}</div>
                      <div className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Buy: ₹{product.buyPrice}</div>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-right relative">
                      <button 
                        onClick={() => setActiveDropdown(activeDropdown === product.id ? null : product.id)}
                        className="text-gray-400 hover:text-indigo-600 transition-colors p-2 rounded-lg hover:bg-indigo-50 focus:outline-none"
                      >
                        <MoreVertical size={18} />
                      </button>
                      
                      {activeDropdown === product.id && (
                        <div className="absolute right-10 top-8 w-36 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden py-1">
                          <button 
                            onClick={() => {
                              // Data ko smart format mein set karna
                              setEditingProduct({
                                ...product,
                                measureType: product.isPackaged ? "packaged" : "loose",
                                baseUnit: product.unit,
                                packStock: product.isPackaged ? (product.stockQty / product.qtyPerPackage).toString() : "",
                                packBuyPrice: product.isPackaged ? (product.buyPrice * product.qtyPerPackage).toString() : "",
                                packSellPrice: product.isPackaged ? (product.sellPrice * product.qtyPerPackage).toString() : ""
                              });
                              setEditModalOpen(true);
                              setActiveDropdown(null);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                          >
                            Edit / Update
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ─── PAGINATION CONTROLS ─── */}
        <div className="border-t border-gray-100 p-3 md:p-4 flex items-center justify-between bg-gray-50/50">
          <div className="text-[9px] md:text-xs font-bold text-gray-500">
            Showing <span className="text-gray-900">{(currentPage - 1) * limit + 1}</span> to <span className="text-gray-900">{Math.min(currentPage * limit, totalItems)}</span> of <span className="text-gray-900">{totalItems}</span> items
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <button 
              onClick={handlePrevPage}
              disabled={currentPage === 1 || loading}
              className="p-2 border border-gray-200 rounded-lg text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="text-xs font-bold text-gray-700 px-2">
              Page {currentPage} of {totalPages || 1}
            </div>
            <button 
              onClick={handleNextPage}
              disabled={currentPage === totalPages || loading || totalPages === 0}
              className="p-2 border border-gray-200 rounded-lg text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── ADD PRODUCT MODAL ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-4 md:p-5 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50">
              <h3 className="font-black text-gray-900 text-base md:text-lg flex items-center gap-2">
                <Package size={18} className="text-indigo-600 md:w-5 md:h-5" /> Add Inventory Item
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-white hover:shadow-sm p-1.5 md:p-2 rounded-full transition-all">
                <X size={18} className="md:w-5 md:h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="p-4 md:p-6 max-h-[75dvh] overflow-y-auto pb-24 md:pb-6">
              
              {/* ─── BASIC DETAILS ─── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Product Name *</label>
                  <input type="text" placeholder="e.g., IFFCO Urea 45kg" required value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:outline-none focus:border-indigo-500 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Brand / Company</label>
                  <input type="text" placeholder="e.g., IFFCO" value={newProduct.brand} onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:outline-none focus:border-indigo-500 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Category</label>
                  <select value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:outline-none focus:border-indigo-500 transition-all">
                    <option value="Fertilizer">Fertilizer (Khaad)</option>
                    <option value="Pesticide">Pesticide (Dawai)</option>
                    <option value="Seed">Seeds (Beej)</option>
                    <option value="Tool">Tools (Ozaar)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* ─── SMART MEASUREMENT MODULE ─── */}
              <div className="bg-indigo-50/40 p-4 md:p-5 rounded-2xl border border-indigo-100/50 mb-6">
                <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3">Measurement & Pricing Style</label>
                
                <div className="flex flex-wrap gap-4 mb-5">
                  <label className={`flex flex-1 items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${newProduct.measureType === "loose" ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
                    <input type="radio" name="measureType" value="loose" className="hidden" checked={newProduct.measureType === "loose"} onChange={() => setNewProduct({...newProduct, measureType: "loose"})} /> 
                    <span className="font-bold text-sm">Khulla Samaan (Loose)</span>
                  </label>
                  <label className={`flex flex-1 items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${newProduct.measureType === "packaged" ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
                    <input type="radio" name="measureType" value="packaged" className="hidden" checked={newProduct.measureType === "packaged"} onChange={() => setNewProduct({...newProduct, measureType: "packaged"})} /> 
                    <span className="font-bold text-sm">Packaged (Bag / Box)</span>
                  </label>
                </div>

                {/* ─── LOOSE SAMAAN UI ─── */}
                {newProduct.measureType === "loose" && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-in fade-in duration-300">
                    <div>
                      <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">Unit</label>
                      <select value={newProduct.baseUnit} onChange={(e) => setNewProduct({...newProduct, baseUnit: e.target.value})} className="w-full p-2.5 bg-white border border-gray-200 rounded-lg font-bold text-sm outline-none">
                        <option value="KG">KG</option><option value="Ltr">Litre</option><option value="Pcs">Piece</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">Stock Qty</label>
                      <input type="number" placeholder="0" required value={newProduct.stockQty} onChange={(e) => setNewProduct({...newProduct, stockQty: e.target.value})} className="w-full p-2.5 bg-white border border-gray-200 rounded-lg font-bold text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">Buy Price/Unit</label>
                      <input type="number" placeholder="₹" value={newProduct.buyPrice} onChange={(e) => setNewProduct({...newProduct, buyPrice: e.target.value})} className="w-full p-2.5 bg-white border border-gray-200 rounded-lg font-bold text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-indigo-600 uppercase mb-1">Sell Price/Unit *</label>
                      <input type="number" placeholder="₹" required value={newProduct.sellPrice} onChange={(e) => setNewProduct({...newProduct, sellPrice: e.target.value})} className="w-full p-2.5 bg-white border border-indigo-200 rounded-lg font-bold text-indigo-700 text-sm outline-none ring-1 ring-indigo-100" />
                    </div>
                  </div>
                )}

                {/* ─── PACKAGED SAMAAN UI (The Magic Module) ─── */}
                {newProduct.measureType === "packaged" && (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                    {/* Packaging Info */}
                    <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                      <div>
                        <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Package Type</label>
                        <select value={newProduct.packageUnit} onChange={(e) => setNewProduct({...newProduct, packageUnit: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg font-bold text-sm outline-none focus:border-indigo-500">
                          <option value="Bag">Bora (Bag)</option><option value="Box">Peti (Box)</option><option value="Pkt">Packet</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-gray-400 uppercase mb-1 text-center">Weight Inside</label>
                        <input type="number" placeholder="e.g. 50" required value={newProduct.qtyPerPackage} onChange={(e) => setNewProduct({...newProduct, qtyPerPackage: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg font-bold text-sm text-center outline-none focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Unit Inside</label>
                        <select value={newProduct.baseUnit} onChange={(e) => setNewProduct({...newProduct, baseUnit: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg font-bold text-sm outline-none focus:border-indigo-500">
                          <option value="KG">KG</option><option value="Ltr">Litre</option>
                        </select>
                      </div>
                    </div>

                    {/* Auto Calculating Stock & Price */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Stock Block */}
                      <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wide mb-2">Total {newProduct.packageUnit}s Brought</label>
                        <input type="number" placeholder={`How many ${newProduct.packageUnit}s?`} required value={newProduct.packStock} onChange={(e) => setNewProduct({...newProduct, packStock: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg font-black text-gray-800 text-sm mb-2 outline-none focus:border-indigo-500" />
                        <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 p-1.5 rounded flex items-center justify-between">
                          <span>Total Stock =</span>
                          <span>{newProduct.stockQty || 0} {newProduct.baseUnit}</span>
                        </div>
                      </div>
                      
                      {/* Buy Price Block */}
                      <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wide mb-2">Buy Rate (1 {newProduct.packageUnit})</label>
                        <input type="number" placeholder={`₹ Rate per ${newProduct.packageUnit}`} value={newProduct.packBuyPrice} onChange={(e) => setNewProduct({...newProduct, packBuyPrice: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg font-black text-gray-800 text-sm mb-2 outline-none focus:border-indigo-500" />
                        <div className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-100 p-1.5 rounded flex items-center justify-between">
                          <span>Base Buy =</span>
                          <span>₹{newProduct.buyPrice || 0} / {newProduct.baseUnit}</span>
                        </div>
                      </div>

                      {/* Sell Price Block */}
                      <div className="bg-indigo-50 p-3.5 rounded-xl border border-indigo-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-10 h-10 bg-indigo-500/10 rounded-bl-full"></div>
                        <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-wide mb-2">Sell Rate (1 {newProduct.packageUnit}) *</label>
                        <input type="number" placeholder={`₹ Rate per ${newProduct.packageUnit}`} required value={newProduct.packSellPrice} onChange={(e) => setNewProduct({...newProduct, packSellPrice: e.target.value})} className="w-full p-2.5 border border-indigo-200 rounded-lg font-black text-indigo-800 text-sm mb-2 outline-none focus:ring-1 focus:ring-indigo-500" />
                        <div className="text-[10px] font-bold text-indigo-700 bg-white border border-indigo-100 p-1.5 rounded flex items-center justify-between shadow-sm">
                          <span>Base Sell =</span>
                          <span>₹{newProduct.sellPrice || 0} / {newProduct.baseUnit}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ─── BUTTONS ─── */}
              <div className="pt-2 flex gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] py-3.5 font-black text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all flex justify-center items-center gap-2 active:scale-95 disabled:opacity-70">
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <><Check size={20} /> Add to Inventory</>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ─── EDIT PRODUCT MODAL ─── */}
      {editModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50">
              <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                <Package className="text-indigo-600" size={20} /> Update Inventory Stock
              </h3>
              <button onClick={() => {setEditModalOpen(false); setEditingProduct(null);}} className="text-gray-400 hover:bg-white hover:shadow-sm p-2 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="p-4 md:p-6 max-h-[75dvh] overflow-y-auto pb-24 md:pb-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Product Name *</label>
                  <input type="text" required value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Brand / Company</label>
                  <input type="text" value={editingProduct.brand} onChange={(e) => setEditingProduct({...editingProduct, brand: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Category</label>
                  <select value={editingProduct.category} onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:outline-none focus:border-indigo-500">
                    <option value="Fertilizer">Fertilizer (Khaad)</option><option value="Pesticide">Pesticide (Dawai)</option><option value="Seed">Seeds (Beej)</option><option value="Tool">Tools (Ozaar)</option><option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* ─── SMART MEASUREMENT MODULE (EDIT) ─── */}
              <div className="bg-indigo-50/40 p-4 md:p-5 rounded-2xl border border-indigo-100/50 mb-6">
                <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3">Measurement & Pricing Style</label>
                
                <div className="flex flex-wrap gap-4 mb-5">
                  <label className={`flex flex-1 items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${editingProduct.measureType === "loose" ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-white text-gray-600 border-gray-200"}`}>
                    <input type="radio" name="measureType" value="loose" className="hidden" checked={editingProduct.measureType === "loose"} onChange={() => setEditingProduct({...editingProduct, measureType: "loose"})} /> 
                    <span className="font-bold text-sm">Khulla (Loose)</span>
                  </label>
                  <label className={`flex flex-1 items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${editingProduct.measureType === "packaged" ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-white text-gray-600 border-gray-200"}`}>
                    <input type="radio" name="measureType" value="packaged" className="hidden" checked={editingProduct.measureType === "packaged"} onChange={() => setEditingProduct({...editingProduct, measureType: "packaged"})} /> 
                    <span className="font-bold text-sm">Packaged (Bag/Box)</span>
                  </label>
                </div>

                {editingProduct.measureType === "loose" && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">Unit</label>
                      <select value={editingProduct.baseUnit} onChange={(e) => setEditingProduct({...editingProduct, baseUnit: e.target.value})} className="w-full p-2.5 bg-white border rounded-lg font-bold text-sm outline-none"><option value="KG">KG</option><option value="Ltr">Litre</option><option value="Pcs">Piece</option></select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">Stock Qty</label>
                      <input type="number" required value={editingProduct.stockQty} onChange={(e) => setEditingProduct({...editingProduct, stockQty: e.target.value})} className="w-full p-2.5 bg-white border rounded-lg font-bold text-sm" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">Buy Price/Unit</label>
                      <input type="number" value={editingProduct.buyPrice} onChange={(e) => setEditingProduct({...editingProduct, buyPrice: e.target.value})} className="w-full p-2.5 bg-white border rounded-lg font-bold text-sm" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-indigo-600 uppercase mb-1">Sell Price/Unit *</label>
                      <input type="number" required value={editingProduct.sellPrice} onChange={(e) => setEditingProduct({...editingProduct, sellPrice: e.target.value})} className="w-full p-2.5 bg-white border-indigo-200 rounded-lg font-bold text-indigo-700 text-sm" />
                    </div>
                  </div>
                )}

                {editingProduct.measureType === "packaged" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                      <div>
                        <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Package Type</label>
                        <select value={editingProduct.packageUnit} onChange={(e) => setEditingProduct({...editingProduct, packageUnit: e.target.value})} className="w-full p-2 border rounded-lg font-bold text-sm outline-none"><option value="Bag">Bora</option><option value="Box">Peti</option><option value="Pkt">Packet</option></select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-gray-400 uppercase mb-1 text-center">Weight Inside</label>
                        <input type="number" required value={editingProduct.qtyPerPackage} onChange={(e) => setEditingProduct({...editingProduct, qtyPerPackage: e.target.value})} className="w-full p-2 border rounded-lg font-bold text-sm text-center" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Unit Inside</label>
                        <select value={editingProduct.baseUnit} onChange={(e) => setEditingProduct({...editingProduct, baseUnit: e.target.value})} className="w-full p-2 border rounded-lg font-bold text-sm outline-none"><option value="KG">KG</option><option value="Ltr">Litre</option></select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-3.5 rounded-xl border border-gray-200">
                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Total {editingProduct.packageUnit}s Stock</label>
                        <input type="number" required value={editingProduct.packStock} onChange={(e) => setEditingProduct({...editingProduct, packStock: e.target.value})} className="w-full p-2.5 border rounded-lg font-black text-sm mb-2" />
                        <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 p-1.5 rounded flex justify-between"><span>Total =</span><span>{editingProduct.stockQty || 0} {editingProduct.baseUnit}</span></div>
                      </div>
                      <div className="bg-white p-3.5 rounded-xl border border-gray-200">
                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Buy Rate (1 {editingProduct.packageUnit})</label>
                        <input type="number" value={editingProduct.packBuyPrice} onChange={(e) => setEditingProduct({...editingProduct, packBuyPrice: e.target.value})} className="w-full p-2.5 border rounded-lg font-black text-sm mb-2" />
                        <div className="text-[10px] font-bold text-gray-500 bg-gray-50 p-1.5 rounded flex justify-between"><span>Base Buy =</span><span>₹{editingProduct.buyPrice || 0}</span></div>
                      </div>
                      <div className="bg-indigo-50 p-3.5 rounded-xl border border-indigo-200">
                        <label className="block text-[10px] font-black text-indigo-600 uppercase mb-2">Sell Rate (1 {editingProduct.packageUnit}) *</label>
                        <input type="number" required value={editingProduct.packSellPrice} onChange={(e) => setEditingProduct({...editingProduct, packSellPrice: e.target.value})} className="w-full p-2.5 border border-indigo-200 rounded-lg font-black text-indigo-800 text-sm mb-2" />
                        <div className="text-[10px] font-bold text-indigo-700 bg-white p-1.5 rounded border border-indigo-100 flex justify-between"><span>Base Sell =</span><span>₹{editingProduct.sellPrice || 0}</span></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-3 border-t border-gray-100">
                <button type="button" onClick={() => {setEditModalOpen(false); setEditingProduct(null);}} className="flex-1 py-3.5 font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] py-3.5 font-black text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 flex justify-center items-center gap-2 active:scale-95 disabled:opacity-70">
                  {isSubmitting ? "Updating..." : <><Check size={20} /> Update Inventory</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}