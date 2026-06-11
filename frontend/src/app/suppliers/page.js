"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
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
      const token = Cookies.get("auth_token");
      const res = await axios.get("https://agrovault.onrender.com/api/suppliers", {
        headers: { Authorization: `Bearer ${token}` }
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
      const token = Cookies.get("auth_token");
      await axios.post("https://agrovault.onrender.com/api/suppliers", {
        ...newSupplier,
        openingBalance: Number(newSupplier.openingBalance) || 0 // 👈 Naya Data
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsModalOpen(false);
      setNewSupplier({ name: "", company: "", mobile: "", address: "", openingBalance: "" });
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
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto flex flex-col relative px-2 sm:px-4 md:px-0 pb-28 md:pb-10">
      
      {/* ─── HEADER SECTION ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight">Suppliers & Brands</h1>
          <p className="text-gray-500 text-xs md:text-lg font-medium mt-1">Mahajan aur Companies ka hisaab-kitab.</p>
        </div>
        
        {/* ACTION BUTTONS & SEARCH */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-auto md:w-72">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 md:w-5 md:h-5" />
            <input 
              type="text" placeholder="Search suppliers..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-white border border-gray-200 rounded-xl md:rounded-2xl text-sm font-medium focus:outline-none focus:border-purple-500 transition-all shadow-sm"
            />
          </div>
          <div className="flex gap-2 sm:gap-4">
            <button 
              onClick={() => router.push('/purchases/new')}
              className="flex-1 sm:flex-none justify-center bg-white border-2 border-purple-200 text-purple-700 hover:bg-purple-50 px-3 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold flex items-center gap-1.5 md:gap-2 shadow-sm transition-all active:scale-95"
            >
              <PackagePlus size={18} className="md:w-5 md:h-5" /> <span>Buy Stock</span>
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-none justify-center bg-purple-600 hover:bg-purple-700 text-white px-3 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold flex items-center gap-1.5 md:gap-2 shadow-md transition-all active:scale-95"
            >
              <Plus size={18} className="md:w-5 md:h-5" /> <span>Add New</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── SUPPLIER LIST ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 pb-10">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 md:py-20 bg-white rounded-2xl md:rounded-3xl border border-gray-100">
             <Factory size={40} className="mx-auto text-gray-300 mb-3 md:mb-4 md:w-12 md:h-12" />
             <h3 className="text-lg md:text-xl font-bold text-gray-800">No Suppliers Found</h3>
          </div>
        ) : (
          filtered.map((sup) => (
            <div key={sup.id}
            onClick={() => router.push('/suppliers/' + sup.id)}
            className="group bg-white border border-gray-200 hover:border-purple-300 rounded-2xl md:rounded-3xl p-4 md:p-5 flex flex-col transition-all hover:shadow-md cursor-pointer relative overflow-hidden">
              
              <div className="flex justify-between items-start mb-3 md:mb-4">
                <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Truck size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-black text-lg md:text-xl text-gray-900 truncate leading-tight">{sup.name}</div>
                    <div className="text-[10px] md:text-xs font-bold text-purple-600 uppercase tracking-widest mt-0.5 truncate">{sup.company || 'Independent'}</div>
                  </div>
                </div>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors shrink-0">
                  <ChevronRight size={18} className="md:w-5 md:h-5" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 mb-3 md:mb-4 text-[11px] md:text-xs font-bold text-gray-500">
                <span className="flex items-center gap-1.5"><Phone size={14}/> {sup.mobile}</span>
                {sup.address && <span className="flex items-center gap-1.5 truncate"><MapPin size={14} className="shrink-0"/> <span className="truncate">{sup.address}</span></span>}
              </div>

              <div className="bg-gray-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-gray-100 flex justify-between items-center mt-auto">
                <div>
                  <div className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Market Due</div>
                  <div className={`text-lg md:text-xl font-black mt-0.5 ${sup.currentDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-4 md:p-5 border-b border-gray-100 flex justify-between items-center bg-purple-50">
              <h3 className="font-black text-gray-900 text-base md:text-lg flex items-center gap-2"><Factory className="text-purple-600" size={18} /> New Supplier</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-white p-1.5 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddSupplier} className="p-5 md:p-6 space-y-4">
              <div>
                <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 px-1">Mahajan / Contact Person</label>
                <input type="text" required value={newSupplier.name} onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})} className="w-full px-4 py-2.5 md:py-3 bg-gray-50 border border-gray-200 rounded-xl md:rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 px-1">Company / Brand (Optional)</label>
                <input type="text" placeholder="e.g., IFFCO, Bayer" value={newSupplier.company} onChange={(e) => setNewSupplier({...newSupplier, company: e.target.value})} className="w-full px-4 py-2.5 md:py-3 bg-gray-50 border border-gray-200 rounded-xl md:rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 px-1">Mobile Number</label>
                <input type="text" required value={newSupplier.mobile} onChange={(e) => setNewSupplier({...newSupplier, mobile: e.target.value})} className="w-full px-4 py-2.5 md:py-3 bg-gray-50 border border-gray-200 rounded-xl md:rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 px-1">Address / City</label>
                <input type="text" value={newSupplier.address} onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})} className="w-full px-4 py-2.5 md:py-3 bg-gray-50 border border-gray-200 rounded-xl md:rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:border-purple-500" />
              </div>
              
              {/* ─── NEW: OPENING BALANCE INPUT ─── */}
              <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                <label className="text-[10px] md:text-xs font-black text-purple-700 uppercase tracking-widest mb-1.5 px-1 flex items-center gap-1.5">
                  Purana Baaki <span className="text-gray-400 normal-case font-bold text-[10px]">(Optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-black">₹</span>
                  <input 
                    type="number" placeholder="0.00" min="0" step="any"
                    value={newSupplier.openingBalance} onChange={(e) => setNewSupplier({...newSupplier, openingBalance: e.target.value})}
                    className="w-full pl-9 pr-4 py-2.5 md:py-3 bg-white border border-purple-200 rounded-xl font-black text-sm md:text-base text-gray-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 md:py-4 text-sm md:text-base font-bold text-gray-600 bg-white border border-gray-200 rounded-xl md:rounded-2xl hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 md:py-4 text-sm md:text-base font-bold text-white bg-purple-600 rounded-xl md:rounded-2xl hover:bg-purple-700 flex justify-center items-center gap-2 disabled:opacity-70">
                  {isSubmitting ? "Saving..." : <><Check size={18} /> Save</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}