"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie"; // Naya import (Token nikalne ke liye)
import { Truck, Search, Plus, Phone, MapPin, ChevronRight, X, Check, Factory, PackagePlus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: "", company: "", mobile: "", address: "" });

  const router = useRouter();

  const fetchSuppliers = async () => {
    try {
      const token = Cookies.get("auth_token"); // Token nikala
      const res = await axios.get("http://localhost:5000/api/suppliers", {
        headers: { Authorization: `Bearer ${token}` } // Envelop mein bheja
      });
      setSuppliers(res.data.data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    if (!newSupplier.name || !newSupplier.mobile) return alert("Naam aur Mobile zaroori hai!");

    setIsSubmitting(true);
    try {
      const token = Cookies.get("auth_token"); // Token nikala
      await axios.post("http://localhost:5000/api/suppliers", newSupplier, {
        headers: { Authorization: `Bearer ${token}` } // Envelop mein bheja
      });
      setIsModalOpen(false);
      setNewSupplier({ name: "", company: "", mobile: "", address: "" });
      await fetchSuppliers();
    } catch (error) {
      alert("Supplier add karne mein gadbad hui!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.company && s.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return <div className="h-full flex items-center justify-center font-bold text-gray-500 animate-pulse">Loading Suppliers...</div>;

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto h-full flex flex-col relative">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Suppliers & Brands</h1>
          <p className="text-gray-500 text-lg font-medium mt-1">Mahajan aur Companies ka hisaab-kitab.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="relative flex-1 md:w-72">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" placeholder="Search suppliers..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-purple-500 transition-all shadow-sm"
            />
          </div>
          {/* 👇 NAYA BUY STOCK BUTTON 👇 */}
            <button 
             onClick={() => router.push('/purchases/new')}
             className="bg-white border-2 border-purple-200 text-purple-700 hover:bg-purple-50 px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
             >
             <PackagePlus size={20} /> <span className="hidden sm:inline">Buy Stock</span>
            </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            <Plus size={20} /> <span className="hidden sm:inline">Add Supplier</span>
          </button>
        </div>
      </div>

      {/* SUPPLIER LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-gray-100">
             <Factory size={48} className="mx-auto text-gray-300 mb-4" />
             <h3 className="text-xl font-bold text-gray-800">No Suppliers Found</h3>
          </div>
        ) : (
          filtered.map((sup) => (
            <div key={sup.id}
            onClick={() => router.push('/suppliers/' + sup.id)}
            className="group bg-white border border-gray-200 hover:border-purple-300 rounded-3xl p-5 flex flex-col transition-all hover:shadow-md cursor-pointer relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Truck size={24} />
                  </div>
                  <div>
                    <div className="font-black text-xl text-gray-900">{sup.name}</div>
                    <div className="text-xs font-bold text-purple-600 uppercase tracking-widest mt-0.5">{sup.company || 'Independent'}</div>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
                  <ChevronRight size={20} />
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4 text-xs font-bold text-gray-500">
                <span className="flex items-center gap-1.5"><Phone size={14}/> {sup.mobile}</span>
                {sup.address && <span className="flex items-center gap-1.5"><MapPin size={14}/> {sup.address}</span>}
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center mt-auto">
                <div>
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Market Due (Payable)</div>
                  <div className={`text-xl font-black mt-0.5 ${sup.currentDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ₹{sup.currentDue.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── ADD MODAL ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-purple-50">
              <h3 className="font-black text-gray-900 text-lg flex items-center gap-2"><Factory className="text-purple-600" size={20} /> New Supplier</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-white p-2 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddSupplier} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Mahajan / Contact Person</label>
                <input type="text" required value={newSupplier.name} onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Company / Brand (Optional)</label>
                <input type="text" placeholder="e.g., IFFCO, Bayer" value={newSupplier.company} onChange={(e) => setNewSupplier({...newSupplier, company: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 focus:outline-none focus:border-purple-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Mobile Number</label>
                  <input type="text" required value={newSupplier.mobile} onChange={(e) => setNewSupplier({...newSupplier, mobile: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 focus:outline-none focus:border-purple-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Address / City</label>
                <input type="text" value={newSupplier.address} onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 focus:outline-none focus:border-purple-500" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-bold text-gray-600 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-4 font-bold text-white bg-purple-600 rounded-2xl hover:bg-purple-700 flex justify-center items-center gap-2 disabled:opacity-70">
                  {isSubmitting ? "Saving..." : <><Check size={20} /> Save</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}