"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie"; 
import { Lock, Phone, ArrowRight, User, Store, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";

export default function Login() {
  const router = useRouter();
  
  // Modes: true = Login, false = Sign Up
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Premium Alert State
  const [alertInfo, setAlertInfo] = useState({ show: false, type: "", message: "" });

  const [formData, setFormData] = useState({
    phone: "",
    password: "",
    name: "",
    shopName: "",
    shopType: "Fertilizer & Pesticide"
  });

  const showPremiumAlert = (type, message) => {
    setAlertInfo({ show: true, type, message });
    setTimeout(() => setAlertInfo({ show: false, type: "", message: "" }), 4000); // 4 sec baad auto-hide
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlertInfo({ show: false, type: "", message: "" });

    try {
      if (isLoginMode) {
        // ─── LOGIN LOGIC ───
        const res = await axios.post("https://agrovault.onrender.com/api/login", {
          phone: formData.phone,
          password: formData.password
        });

        if (res.data.success) {
          showPremiumAlert("success", "Welcome Back! Login successful.");
          // Security token cookies mein save kiya (Gatekeeper ke liye)
          Cookies.set("auth_token", res.data.token, { expires: 7 }); 
          // User ki details 'Namaste' dikhane ke liye LocalStorage mein save ki
          localStorage.setItem("user_info", JSON.stringify(res.data.user));
          
          setTimeout(() => {
            window.location.href = "/"; // Refresh karke dashboard par bhejo
          }, 1000);
        }

      } else {
        // ─── SIGN UP LOGIC ───
        if (formData.phone.length < 10) {
          setLoading(false);
          return showPremiumAlert("error", "Phone number must be at least 10 digits.");
        }

        const res = await axios.post("https://agrovault.onrender.com/api/register", formData);
        
        if (res.data.success) {
          showPremiumAlert("success", "Account created successfully! Please login.");
          setTimeout(() => {
            setIsLoginMode(true); // Switch back to login mode
            setLoading(false);
          }, 1500);
        }
      }
    } catch (error) {
      // Backend se aane wale errors ko properly dikhana
      const errorMsg = error.response?.data?.message || "Kuch gadbad hui hai. Kripya check karein.";
      showPremiumAlert("error", errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gray-50">
      
      {/* ─── PREMIUM BACKGROUND BLOBS ─── */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-emerald-200/40 blur-[120px]"></div>
        <div className="absolute top-[60%] -left-[10%] w-[40vw] h-[40vw] rounded-full bg-blue-200/40 blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        
        {/* ─── PREMIUM ALERT BANNER ─── */}
        <div className={`transition-all duration-500 ease-in-out transform absolute -top-20 left-0 w-full ${alertInfo.show ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0 pointer-events-none"}`}>
          {alertInfo.type === "error" ? (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl shadow-lg flex items-start gap-3">
              <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-sm font-black text-rose-900">Authentication Failed</h4>
                <p className="text-xs font-bold text-rose-700 mt-0.5">{alertInfo.message}</p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl shadow-lg flex items-start gap-3">
              <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-sm font-black text-emerald-900">Success</h4>
                <p className="text-xs font-bold text-emerald-700 mt-0.5">{alertInfo.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* ─── MAIN CARD ─── */}
        <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white">
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-900 text-white mb-5 shadow-lg">
              <ShieldCheck size={32} strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
              {isLoginMode ? "AgroVault" : "Create Account"}
            </h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              {isLoginMode ? "Secure Business Gateway" : "Register your business"}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            
            {/* ─── SIGN UP ONLY FIELDS ─── */}
            {!isLoginMode && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" name="name" required={!isLoginMode} placeholder="Your Full Name" value={formData.name} onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-bold focus:outline-none focus:border-gray-900 transition-all text-sm"
                    />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <Store size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" name="shopName" required={!isLoginMode} placeholder="Shop / Business Name" value={formData.shopName} onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-bold focus:outline-none focus:border-gray-900 transition-all text-sm"
                    />
                  </div>
                </div>
                <div>
                  <select name="shopType" value={formData.shopType} onChange={handleChange}
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-bold focus:outline-none focus:border-gray-900 transition-all text-sm appearance-none cursor-pointer"
                  >
                    <option value="Fertilizer & Pesticide">Fertilizer & Pesticide</option>
                    <option value="Seeds & Grains">Seeds & Grains</option>
                    <option value="Hardware & Tools">Hardware & Tools</option>
                    <option value="General General">General Store</option>
                  </select>
                </div>
              </div>
            )}

            {/* ─── COMMON FIELDS (PHONE & PASSWORD) ─── */}
            <div>
              <div className="relative">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" name="phone" required placeholder="Mobile Number" maxLength={10} value={formData.phone} onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-bold focus:outline-none focus:border-gray-900 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" name="password" required placeholder="Security Password" value={formData.password} onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-bold focus:outline-none focus:border-gray-900 transition-all text-sm"
                />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-gray-900 hover:bg-black text-white font-bold text-sm p-4 rounded-2xl shadow-xl shadow-gray-900/20 flex justify-center items-center gap-2 transition-all active:scale-95 disabled:opacity-70 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>{isLoginMode ? "Secure Login" : "Create Account"} <ArrowRight size={18} /></>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-xs text-gray-500 font-medium">
              {isLoginMode ? "Don't have an account?" : "Already have a business account?"}
              <button 
                type="button" 
                onClick={() => {
                  setIsLoginMode(!isLoginMode);
                  setAlertInfo({ show: false, type: "", message: "" });
                  setFormData({ ...formData, password: "" }); // Password reset on flip
                }} 
                className="ml-1.5 font-black text-gray-900 hover:underline focus:outline-none"
              >
                {isLoginMode ? "Register here" : "Login now"}
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}