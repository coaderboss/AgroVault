"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Users, Search, UserPlus, Phone, MapPin, ChevronRight, X, Check, Wallet, Table, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();

  // ─── SINGLE ADD MODAL STATE ───
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", mobile: "", village: "", openingBalance: "" });

  // ─── EXCEL-STYLE BULK ADD MODAL STATE ───
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const defaultBulkRows = Array(10).fill({ name: "", mobile: "", village: "", openingBalance: "" });
  const [bulkCustomers, setBulkCustomers] = useState(defaultBulkRows);

  const fetchCustomers = async () => {
    try {
      const token = Cookies.get("auth_token");
      const res = await axios.get("https://agrovault.onrender.com/api/customers", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(res.data.data);
      setLoading(false);
    } catch (error) {
      console.error("Data fetch error", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // ─── SAVE SINGLE CUSTOMER ───
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.mobile || !newCustomer.village) {
      return alert("Kripya saari details bharein!");
    }
    
    // 🚨 10-Digit Mobile Check
    if (!/^\d{10}$/.test(newCustomer.mobile)) {
      return alert("Mobile number exactly 10 digits ka hona chahiye!");
    }

    setIsSubmitting(true);
    try {
      const token = Cookies.get("auth_token");
      await axios.post("https://agrovault.onrender.com/api/customers", {
        ...newCustomer,
        openingBalance: Number(newCustomer.openingBalance) || 0
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsModalOpen(false); 
      setNewCustomer({ name: "", mobile: "", village: "", openingBalance: "" }); 
      await fetchCustomers(); 
    } catch (error) {
      alert("Kisaan add karne mein gadbad hui!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── SAVE BULK CUSTOMERS ───
  const handleBulkChange = (index, field, value) => {
    const updatedBulk = [...bulkCustomers];
    updatedBulk[index] = { ...updatedBulk[index], [field]: value };
    setBulkCustomers(updatedBulk);
  };

  const handleBulkSubmit = async () => {
    const validCustomers = bulkCustomers.filter(c => c.name.trim() !== "" && c.mobile.trim() !== "" && c.village.trim() !== "");

    if (validCustomers.length === 0) {
      return alert("Kam se kam ek valid kisaan ki details poori bharein!");
    }

    // 🚨 10-Digit Mobile Check for Bulk
    const hasInvalidMobile = validCustomers.some(c => !/^\d{10}$/.test(c.mobile));
    if (hasInvalidMobile) {
      return alert("Sabhi kisaano ka mobile number exactly 10 digits ka hona chahiye!");
    }

    setIsSubmitting(true);
    try {
      const token = Cookies.get("auth_token");
      await axios.post("https://agrovault.onrender.com/api/customers/bulk", { customers: validCustomers }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setIsBulkModalOpen(false);
      setBulkCustomers(defaultBulkRows); 
      await fetchCustomers();
      alert(`Success: ${validCustomers.length} kisaan ek sath add ho gaye!`);
    } catch (error) {
      alert("Bulk upload failed!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.mobile.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
         <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
            <p className="text-gray-400 font-bold tracking-widest text-xs md:text-sm uppercase">Loading Records...</p>
         </div>
      </div>
    );
  }

 return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto flex flex-col relative px-2 sm:px-4 md:px-0 pb-28 md:pb-10">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight">Kisaan Directory</h1>
          <p className="text-gray-500 text-xs md:text-lg font-medium mt-1">Manage your customer relationships and details.</p>
        </div>
        
        {/* ACTION BUTTONS & SEARCH */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-auto md:w-64">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 md:w-5 md:h-5" />
            <input 
              type="text" placeholder="Search by name, village..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-white border border-gray-200 rounded-xl md:rounded-2xl text-xs md:text-sm font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-sm"
            />
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-none justify-center bg-white hover:bg-gray-50 border border-amber-200 text-amber-600 px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 whitespace-nowrap"
            >
              <UserPlus size={16} />
              <span>Add 1</span>
            </button>
            <button 
              onClick={() => setIsBulkModalOpen(true)}
              className="flex-[2] sm:flex-none justify-center bg-gray-900 hover:bg-black text-white px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-xs md:text-sm font-black flex items-center gap-1.5 shadow-lg shadow-gray-900/20 transition-all active:scale-95 whitespace-nowrap"
            >
              <Zap size={16} className="text-amber-400 fill-amber-400" />
              <span>Quick Bulk</span>
            </button>
          </div>
        </div>
      </div>

      {/* CUSTOMER LIST */}
      <div className="flex flex-col">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12 md:py-20 bg-white rounded-2xl md:rounded-3xl border border-gray-100 mt-2">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
              <Users size={28} className="text-gray-300 md:w-8 md:h-8" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-800">No Customers Found</h3>
            <p className="text-xs md:text-sm text-gray-500 mt-1 md:mt-2">Start building your network by adding your first customer.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-2">
            {filteredCustomers.map((customer) => (
                 <div 
                  key={customer.id} 
                  onClick={() => router.push('/customers/' + customer.id)}
                  className="group bg-white border border-gray-200 hover:border-amber-300 rounded-2xl md:rounded-3xl p-4 md:p-5 flex items-center justify-between transition-all hover:shadow-sm cursor-pointer"
                >
                  <div className="flex items-center gap-3 md:gap-5 overflow-hidden pr-2">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-lg md:text-xl shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-black text-lg md:text-xl text-gray-900 group-hover:text-amber-700 transition-colors truncate">
                        {customer.name}
                      </div>
                      <div className="flex items-center gap-2 md:gap-4 mt-1 text-[11px] md:text-xs font-bold text-gray-500">
                        <div className="flex items-center gap-1 shrink-0 truncate">
                          <MapPin size={14} className="text-gray-400 md:w-[14px] md:h-[14px]" /> <span className="truncate">{customer.village}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Phone size={14} className="text-gray-400 md:w-[14px] md:h-[14px]" /> {customer.mobile}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-10 h-10 shrink-0 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                    <ChevronRight size={18} className="md:w-5 md:h-5" />
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* ─── EXCEL-STYLE BULK ADD MODAL ─── */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-gray-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            <div className="p-4 md:p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <div>
                <h3 className="font-black text-gray-900 text-lg md:text-xl flex items-center gap-2">
                  <Table className="text-amber-500" size={20} /> Excel-Style Bulk Add
                </h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Press TAB to move quickly</p>
              </div>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-gray-400 hover:text-gray-900 hover:bg-gray-200 p-2 rounded-full transition-colors bg-white shadow-sm border border-gray-200">
                <X size={18} />
              </button>
            </div>

            <div className="p-2 md:p-6 flex-1 bg-white overflow-hidden flex flex-col min-h-0">
              <div className="border border-gray-200 rounded-xl overflow-auto flex-1 shadow-inner">
                <table className="w-full text-left min-w-[700px]">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">#</th>
                      <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Customer Name *</th>
                      <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Mobile No. *</th>
                      <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Village/City *</th>
                      <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Purana Udhaar (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bulkCustomers.map((cust, index) => (
                      <tr key={index} className="hover:bg-amber-50/40 transition-colors focus-within:bg-amber-50 group">
                        <td className="p-3 text-xs font-bold text-gray-400 text-center w-10 border-r border-gray-50">{index + 1}</td>
                        <td className="p-0 border-r border-gray-50">
                          <input type="text" placeholder="Name..." value={cust.name} onChange={(e) => handleBulkChange(index, 'name', e.target.value)} className="w-full px-4 py-3.5 bg-transparent border-none outline-none font-bold text-sm text-gray-900 placeholder-gray-300 focus:ring-0" />
                        </td>
                        <td className="p-0 border-r border-gray-50">
                          <input type="text" maxLength={10} placeholder="Mobile..." value={cust.mobile} onChange={(e) => handleBulkChange(index, 'mobile', e.target.value.replace(/\D/g, ''))} className="w-full px-4 py-3.5 bg-transparent border-none outline-none font-bold text-sm text-gray-900 placeholder-gray-300 focus:ring-0" />
                        </td>
                        <td className="p-0 border-r border-gray-50">
                          <input type="text" placeholder="Village..." value={cust.village} onChange={(e) => handleBulkChange(index, 'village', e.target.value)} className="w-full px-4 py-3.5 bg-transparent border-none outline-none font-bold text-sm text-gray-900 placeholder-gray-300 focus:ring-0" />
                        </td>
                        <td className="p-0 bg-rose-50/10 focus-within:bg-rose-50/30 transition-colors">
                          <input type="number" min="0" placeholder="₹0" value={cust.openingBalance} onChange={(e) => handleBulkChange(index, 'openingBalance', e.target.value)} className="w-full px-4 py-3.5 bg-transparent border-none outline-none font-black text-sm text-rose-600 placeholder-rose-200 focus:ring-0" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="p-4 md:p-5 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-end gap-3">
              <button onClick={() => setIsBulkModalOpen(false)} className="px-6 py-3 font-bold text-sm text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">
                Cancel
              </button>
              <button 
                onClick={handleBulkSubmit} disabled={isSubmitting}
                className="bg-gray-900 hover:bg-black text-white font-black px-8 py-3 rounded-xl flex justify-center items-center gap-2 active:scale-95 disabled:opacity-70 transition-all shadow-lg"
              >
                {isSubmitting ? "Saving..." : <><Check size={18} /> Save All Entries</>}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── SINGLE ADD CUSTOMER MODAL (ORIGINAL) ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            
            <div className="p-4 md:p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-black text-gray-900 text-base md:text-lg flex items-center gap-2">
                <UserPlus className="text-amber-500" size={18} /> Register New Customer
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-200 p-1.5 md:p-2 rounded-full transition-colors">
                <X size={18} className="md:w-5 md:h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="p-5 md:p-6 space-y-4 md:space-y-5">
              <div>
                <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 md:mb-2 px-1">Full Name</label>
                <input 
                  type="text" placeholder="e.g., Ramesh Yadav" required
                  value={newCustomer.name} onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  className="w-full px-4 py-2.5 md:py-3 bg-gray-50 border border-gray-200 rounded-xl md:rounded-2xl font-bold text-sm md:text-base text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 md:mb-2 px-1">Mobile Number</label>
                <input 
                  type="text" placeholder="e.g., 9876543210" required maxLength={10}
                  value={newCustomer.mobile} onChange={(e) => setNewCustomer({...newCustomer, mobile: e.target.value.replace(/\D/g, '')})}
                  className="w-full px-4 py-2.5 md:py-3 bg-gray-50 border border-gray-200 rounded-xl md:rounded-2xl font-bold text-sm md:text-base text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 md:mb-2 px-1">Village / City</label>
                <input 
                  type="text" placeholder="e.g., Mainpuri" required
                  value={newCustomer.village} onChange={(e) => setNewCustomer({...newCustomer, village: e.target.value})}
                  className="w-full px-4 py-2.5 md:py-3 bg-gray-50 border border-gray-200 rounded-xl md:rounded-2xl font-bold text-sm md:text-base text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>

              <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                <label className="text-[10px] md:text-xs font-black text-amber-700 uppercase tracking-widest mb-1.5 md:mb-2 px-1 flex items-center gap-1.5">
                  <Wallet size={12}/> Purana Udhaar <span className="text-gray-400 normal-case font-bold text-[10px]">(Optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-black">₹</span>
                  <input 
                    type="number" placeholder="0.00" min="0" step="any"
                    value={newCustomer.openingBalance} onChange={(e) => setNewCustomer({...newCustomer, openingBalance: e.target.value})}
                    className="w-full pl-9 pr-4 py-2.5 md:py-3 bg-white border border-amber-200 rounded-xl font-black text-sm md:text-base text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 md:pt-4 flex gap-3">
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 md:py-4 font-bold text-sm md:text-base text-gray-600 bg-white border border-gray-200 rounded-xl md:rounded-2xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" disabled={isSubmitting}
                  className="flex-1 py-3 md:py-4 font-bold text-sm md:text-base text-white bg-amber-500 rounded-xl md:rounded-2xl hover:bg-amber-600 shadow-md md:shadow-lg shadow-amber-500/30 transition-all flex justify-center items-center gap-2 active:scale-95 disabled:opacity-70"
                >
                  {isSubmitting ? "Wait..." : <><Check size={18} className="md:w-5 md:h-5" /> Save</>}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
     
    </div>
  );
}