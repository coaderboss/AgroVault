"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie"; // Naya import (Token nikalne ke liye)
import { Users, Search, UserPlus, Phone, MapPin, ChevronRight, X, Check, ReceiptText, Wallet, History } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();

  // ─── ADD CUSTOMER MODAL STATE ───
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", mobile: "", village: "" });

  const [profileModal, setProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [bulkPayAmount, setBulkPayAmount] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const fetchCustomers = async () => {
    try {
      const token = Cookies.get("auth_token"); // Token nikala
      const res = await axios.get("https://agrovault.onrender.com/api/customers", {
        headers: { Authorization: `Bearer ${token}` } // API ko token bheja
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

  // ─── SAVE NEW CUSTOMER ───
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.mobile || !newCustomer.village) {
      return alert("Kripya saari details bharein!");
    }

    setIsSubmitting(true);
    try {
      const token = Cookies.get("auth_token");
      await axios.post("https://agrovault.onrender.com/api/customers", newCustomer, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsModalOpen(false); 
      setNewCustomer({ name: "", mobile: "", village: "" }); 
      await fetchCustomers(); 
    } catch (error) {
      alert("Kisaan add karne mein gadbad hui!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── FETCH CUSTOMER PROFILE (SLIPS & DUE) ───
  const handleViewProfile = async (id) => {
    setIsLoadingProfile(true);
    setProfileModal(true); 
    try {
      const token = Cookies.get("auth_token");
      const res = await axios.get(`https://agrovault.onrender.com/api/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedProfile(res.data.data);
    } catch (error) {
      alert("Profile laane mein gadbad hui!");
      setProfileModal(false);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // ─── BULK PAYMENT (EK SAATH MULTIPLE UDHAAR CLEAR KARNA) ───
  const handleBulkPayment = async () => {
    if (!bulkPayAmount || Number(bulkPayAmount) <= 0) return alert("Sahi amount daalein!");
    if (Number(bulkPayAmount) > selectedProfile.totalDue) return alert("Bhaiya, udhaar se zyada paisa jama kar rahe ho!");

    setIsProcessingPayment(true);
    try {
      const token = Cookies.get("auth_token");
      await axios.post(`https://agrovault.onrender.com/api/customers/${selectedProfile.id}/bulk-pay`, {
        amount: Number(bulkPayAmount)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert(`₹${bulkPayAmount} successfully jama ho gaye!`);
      setBulkPayAmount(""); 
      await handleViewProfile(selectedProfile.id); 
      fetchCustomers(); 
      
    } catch (error) {
      alert("Payment fail ho gayi!");
    } finally {
      setIsProcessingPayment(false);
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
            <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
            <p className="text-gray-400 font-bold tracking-widest text-sm uppercase">Loading Records...</p>
         </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto h-full flex flex-col relative">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Kisaan Directory</h1>
          <p className="text-gray-500 text-lg font-medium mt-1">Manage your customer relationships and contact details.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="relative flex-1 md:w-72">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" placeholder="Search by name, village or mobile..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 whitespace-nowrap active:scale-95"
          >
            <UserPlus size={20} />
            <span className="hidden sm:inline">Add Customer</span>
          </button>
        </div>
      </div>

      {/* CUSTOMER LIST */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex-1 flex flex-col overflow-hidden pb-10">
        {filteredCustomers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Users size={32} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">No Customers Found</h3>
            <p className="text-gray-500 mt-2">Start building your network by adding your first customer.</p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 p-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3">
              {filteredCustomers.map((customer) => (
                 <div 
                  key={customer.id} 
                  onClick={() => router.push('/customers/' + customer.id)}
                  className="group bg-white border border-gray-100 hover:border-amber-200 rounded-2xl p-5 flex items-center justify-between transition-all hover:shadow-md cursor-pointer"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-xl shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-black text-lg text-gray-900 group-hover:text-amber-700 transition-colors">
                        {customer.name}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                          <MapPin size={14} className="text-gray-400" /> {customer.village}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                          <Phone size={14} className="text-gray-400" /> {customer.mobile}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                    <ChevronRight size={20} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── ADD CUSTOMER MODAL ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                <UserPlus className="text-amber-500" size={20} /> Register New Customer
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-200 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Full Name</label>
                <input 
                  type="text" placeholder="e.g., Ramesh Yadav" required
                  value={newCustomer.name} onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Mobile Number</label>
                <input 
                  type="text" placeholder="e.g., 9876543210" required maxLength={10}
                  value={newCustomer.mobile} onChange={(e) => setNewCustomer({...newCustomer, mobile: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Village / City</label>
                <input 
                  type="text" placeholder="e.g., Mainpuri" required
                  value={newCustomer.village} onChange={(e) => setNewCustomer({...newCustomer, village: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 font-bold text-gray-600 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" disabled={isSubmitting}
                  className="flex-1 py-4 font-bold text-white bg-amber-500 rounded-2xl hover:bg-amber-600 shadow-lg shadow-amber-500/30 transition-all flex justify-center items-center gap-2 active:scale-95 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <><Check size={20} /> Save Kisaan</>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
     
    </div>
  );
}