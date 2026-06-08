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
  const [newProduct, setNewProduct] = useState({
    name: "", category: "Fertilizer", buyPrice: "", sellPrice: "", stockQty: "", unit: "KG", brand: ""
  });

  // ─── EDIT PRODUCT STATES ───
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    fetchInventory(currentPage);
  }, [currentPage]);

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
        ...newProduct,
        buyPrice: Number(newProduct.buyPrice) || 0,
        sellPrice: Number(newProduct.sellPrice),
        stockQty: Number(newProduct.stockQty)
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
      const token = Cookies.get("auth_token"); // 👈 Chaabi nikali
      const config = { headers: { Authorization: `Bearer ${token}` } }; // 👈 Envelop tayar kiya

      const payload = {
        ...editingProduct,
        buyPrice: Number(editingProduct.buyPrice) || 0,
        sellPrice: Number(editingProduct.sellPrice),
        stockQty: Number(editingProduct.stockQty)
      };

      await axios.put(`https://agrovault.onrender.com/api/products/${editingProduct.id}`, payload, config); // 👈 Config bheja
      
      setEditModalOpen(false);
      setEditingProduct(null);
      fetchInventory(currentPage); 
    } catch (error) {
      alert("Item update karne mein gadbad hui!");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 flex flex-col h-full">
      
      {/* ─── PAGE HEADER ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Inventory</h1>
          <p className="text-gray-500 font-medium mt-1">Manage your warehouse stock and pricing.</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative flex-1 md:w-64">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search inventory..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap active:scale-95"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add Product</span>
          </button>
        </div>
      </div>

      {/* ─── DATA TABLE ─── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest w-1/2">Product Details</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center">In Stock</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Price</th>
                <th className="px-6 py-4"></th>
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <Package size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{product.brand || 'No Brand'} • {product.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                        product.stockQty > 10 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {product.stockQty} {product.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-black text-gray-900">₹{product.sellPrice.toLocaleString()}</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Buy: ₹{product.buyPrice}</div>
                    </td>
                    <td className="px-6 py-4 text-right relative">
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
                              setEditingProduct(product);
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
        <div className="border-t border-gray-100 p-4 flex items-center justify-between bg-gray-50/50">
          <div className="text-xs font-bold text-gray-500">
            Showing <span className="text-gray-900">{(currentPage - 1) * limit + 1}</span> to <span className="text-gray-900">{Math.min(currentPage * limit, totalItems)}</span> of <span className="text-gray-900">{totalItems}</span> items
          </div>
          <div className="flex items-center gap-2">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50">
              <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                <Package className="text-indigo-600" size={20} /> Add New Inventory Item
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-white hover:shadow-sm p-2 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Product Name</label>
                  <input 
                    type="text" placeholder="e.g., Urea Fertilizer 45kg" required
                    value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Brand / Company</label>
                  <input 
                    type="text" placeholder="e.g., IFFCO" 
                    value={newProduct.brand} onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Category</label>
                  <select 
                    value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  >
                    <option value="Fertilizer">Khaad (Fertilizer)</option>
                    <option value="Pesticide">Dawai (Pesticide)</option>
                    <option value="Seed">Beej (Seeds)</option>
                    <option value="Tool">Ozaar (Tools)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Kharid Rate (Buy Price) ₹</label>
                  <input 
                    type="number" placeholder="0" 
                    value={newProduct.buyPrice} onChange={(e) => setNewProduct({...newProduct, buyPrice: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-black text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Bikri Rate (Sell Price) ₹</label>
                  <input 
                    type="number" placeholder="0" required
                    value={newProduct.sellPrice} onChange={(e) => setNewProduct({...newProduct, sellPrice: e.target.value})}
                    className="w-full px-4 py-3 bg-indigo-50/50 border border-indigo-200 rounded-2xl font-black text-indigo-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Stock</label>
                    <input 
                      type="number" placeholder="0" required
                      value={newProduct.stockQty} onChange={(e) => setNewProduct({...newProduct, stockQty: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-black text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Unit</label>
                    <select 
                      value={newProduct.unit} onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
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

              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 font-bold text-gray-600 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" disabled={isSubmitting}
                  className="flex-1 py-4 font-bold text-white bg-indigo-600 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all flex justify-center items-center gap-2 active:scale-95 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <><Check size={20} /> Save Product</>
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

            <form onSubmit={handleUpdateProduct} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Product Name</label>
                  <input 
                    type="text" required
                    value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Brand / Company</label>
                  <input 
                    type="text"
                    value={editingProduct.brand} onChange={(e) => setEditingProduct({...editingProduct, brand: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Category</label>
                  <select 
                    value={editingProduct.category} onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Fertilizer">Khaad (Fertilizer)</option>
                    <option value="Pesticide">Dawai (Pesticide)</option>
                    <option value="Seed">Beej (Seeds)</option>
                    <option value="Tool">Ozaar (Tools)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Kharid Rate ₹</label>
                  <input 
                    type="number" 
                    value={editingProduct.buyPrice} onChange={(e) => setEditingProduct({...editingProduct, buyPrice: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-black text-gray-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Bikri Rate ₹</label>
                  <input 
                    type="number" required
                    value={editingProduct.sellPrice} onChange={(e) => setEditingProduct({...editingProduct, sellPrice: e.target.value})}
                    className="w-full px-4 py-3 bg-indigo-50/50 border border-indigo-200 rounded-2xl font-black text-indigo-700 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Stock</label>
                    <input 
                      type="number" required
                      value={editingProduct.stockQty} onChange={(e) => setEditingProduct({...editingProduct, stockQty: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-black text-gray-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Unit</label>
                    <select 
                      value={editingProduct.unit} onChange={(e) => setEditingProduct({...editingProduct, unit: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="KG">Kilo (KG)</option>
                      <option value="Ltr">Litre (L)</option>
                      <option value="Pcs">Piece (Pcs)</option>
                      <option value="Bag">Bora (Bag)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="pt-2 flex gap-3">
                <button 
                  type="button" onClick={() => {setEditModalOpen(false); setEditingProduct(null);}}
                  className="flex-1 py-4 font-bold text-gray-600 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" disabled={isSubmitting}
                  className="flex-1 py-4 font-bold text-white bg-indigo-600 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 flex justify-center items-center gap-2 active:scale-95 disabled:opacity-70"
                >
                  {isSubmitting ? "Updating..." : <><Check size={20} /> Update Stock</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}