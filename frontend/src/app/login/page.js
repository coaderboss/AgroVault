"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie"; 
import { Lock, Phone, ArrowRight, User, Store, ShieldCheck, AlertCircle, CheckCircle2, X } from "lucide-react";

export default function Login() {
  const router = useRouter();
  
  // Modes: true = Login, false = Sign Up
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Premium Alert State
  const [alertInfo, setAlertInfo] = useState({ show: false, type: "", message: "" });

  // ─── ACCOUNT RECOVERY STATES ───
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryData, setRecoveryData] = useState({ phone: "", securityAnswer: "", newPassword: "" });
  const [isResetting, setIsResetting] = useState(false);

  const [formData, setFormData] = useState({
    phone: "",
    password: "",
    name: "",
    shopName: "",
    shopType: "Fertilizer & Pesticide",
    role: "OWNER", // Default dukaandaar
    shopKey: ""
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
          const msg = res.data.shopKey ? `Success! Your Staff Key is: ${res.data.shopKey}` : "Account created successfully! Please login.";
          showPremiumAlert("success", msg);
          setTimeout(() => {
            setIsLoginMode(true); // Wapas login par bhej diya
            setLoading(false);
          }, 4000); // Key padhne ke liye thoda extra time diya
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
        <div className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white max-h-[90dvh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          
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
              <div className="space-y-3 md:space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                
                {/* ─── ROLE SELECTOR ─── */}
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button 
                    type="button" onClick={() => setFormData({...formData, role: "OWNER"})}
                    className={`flex-1 py-2 md:py-2.5 text-xs font-bold rounded-lg transition-all ${formData.role === "OWNER" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Dukaandaar (Owner)
                  </button>
                  <button 
                    type="button" onClick={() => setFormData({...formData, role: "EMPLOYEE"})}
                    className={`flex-1 py-2 md:py-2.5 text-xs font-bold rounded-lg transition-all ${formData.role === "EMPLOYEE" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Staff (Employee)
                  </button>
                </div>

                <div>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" name="name" required={!isLoginMode} placeholder="Your Full Name" value={formData.name} onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 md:py-3.5 bg-gray-50 border border-gray-200 rounded-xl md:rounded-2xl text-gray-900 font-bold focus:outline-none focus:border-gray-900 transition-all text-sm"
                    />
                  </div>
                </div>

                {formData.role === "OWNER" ? (
                  <>
                    <div>
                      <div className="relative">
                        <Store size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" name="shopName" required={formData.role === "OWNER"} placeholder="Shop / Business Name" value={formData.shopName} onChange={handleChange}
                          className="w-full pl-12 pr-4 py-3 md:py-3.5 bg-gray-50 border border-gray-200 rounded-xl md:rounded-2xl text-gray-900 font-bold focus:outline-none focus:border-gray-900 transition-all text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <select name="shopType" value={formData.shopType} onChange={handleChange}
                        className="w-full px-4 py-3 md:py-3.5 bg-gray-50 border border-gray-200 rounded-xl md:rounded-2xl text-gray-900 font-bold focus:outline-none focus:border-gray-900 transition-all text-sm appearance-none cursor-pointer"
                      >
                        <option value="Fertilizer & Pesticide">Fertilizer & Pesticide</option>
                        <option value="Seeds & Grains">Seeds & Grains</option>
                        <option value="Hardware & Tools">Hardware & Tools</option>
                        <option value="General Store">General Store</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="relative">
                      <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" />
                      <input type="text" name="shopKey" required={formData.role === "EMPLOYEE"} placeholder="Enter Shop Key (e.g., AGRO-XXX)" value={formData.shopKey} onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3 md:py-3.5 bg-blue-50 border border-blue-200 rounded-xl md:rounded-2xl text-blue-900 font-black focus:outline-none focus:border-blue-500 transition-all text-sm uppercase placeholder-blue-300"
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1.5 ml-1 font-medium">Malik se unki <strong className="text-gray-700">Shop Key</strong> maang kar yahan dalein.</p>
                  </div>
                )}
              </div>
            )}

            {/* ─── COMMON FIELDS (PHONE & PASSWORD) ─── */}
            <div>
              <div className="relative">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  name="phone" 
                  required 
                  placeholder="10-Digit Mobile Number" 
                  maxLength={10} 
                  pattern="\d{10}" // Sirf 10 digits allow karega
                  title="Please enter exactly 10 digits"
                  value={formData.phone} 
                  onChange={(e) => {
                    // Sirf numbers (0-9) allow karne ka logic
                    const value = e.target.value.replace(/\D/g, "");
                    setFormData({ ...formData, phone: value });
                  }}
                  className="w-full pl-12 pr-4 py-3 md:py-3.5 bg-gray-50 border border-gray-200 rounded-xl md:rounded-2xl text-gray-900 font-bold focus:outline-none focus:border-gray-900 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <div>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" name="password" required placeholder="Security Password" value={formData.password} onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 md:py-3.5 bg-gray-50 border border-gray-200 rounded-xl md:rounded-2xl text-gray-900 font-bold focus:outline-none focus:border-gray-900 transition-all text-sm"
                />
              </div>
              {/* ─── FORGOT PASSWORD LINK ─── */}
              {isLoginMode && (
                <div className="text-right mt-1.5 px-1">
                  <button 
                    type="button" 
                    onClick={() => setShowRecoveryModal(true)}
                    className="text-xs font-bold text-gray-500 hover:text-gray-900 transition-all"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
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

      {/* ─── PREMIUM PASSWORD RECOVERY MODAL ─── */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                <Lock size={20} className="text-gray-900" /> Reset Password
              </h3>
              <button onClick={() => setShowRecoveryModal(false)} className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsResetting(true);
              try {
                const res = await axios.post("https://agrovault.onrender.com/api/forgot-password", recoveryData);
                if (res.data.success) {
                  setShowRecoveryModal(false);
                  setRecoveryData({ phone: "", newPassword: "" });
                  showPremiumAlert("success", "Password successfully reset! You can login now.");
                }
              } catch (error) {
                const msg = error.response?.data?.message || "Reset failed. Please try again.";
                setShowRecoveryModal(false); // Modal band karke alert dikhayenge
                showPremiumAlert("error", msg);
              } finally {
                setIsResetting(false);
              }
            }} className="p-6 space-y-5">
              
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Registered Mobile Number</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" required maxLength={10} pattern="\d{10}" placeholder="Enter 10 digit number"
                    value={recoveryData.phone} onChange={(e) => setRecoveryData({...recoveryData, phone: e.target.value.replace(/\D/g, "")})}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm text-gray-900 focus:outline-none focus:border-gray-900 transition-all"
                  />
                </div>
              </div>

              {/* ─── NAYA: SECURITY ANSWER FIELD ─── */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Security Answer (From Settings)</label>
                <div className="relative">
                  <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" required placeholder="Aapka secret jawab..."
                    value={recoveryData.securityAnswer} onChange={(e) => setRecoveryData({...recoveryData, securityAnswer: e.target.value})}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm text-gray-900 focus:outline-none focus:border-gray-900 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">New Security Password</label>               <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="password" required placeholder="Minimum 6 characters"
                    value={recoveryData.newPassword} onChange={(e) => setRecoveryData({...recoveryData, newPassword: e.target.value})}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm text-gray-900 focus:outline-none focus:border-gray-900 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={isResetting} className="w-full py-4 text-sm font-bold text-white bg-gray-900 rounded-2xl hover:bg-black shadow-lg shadow-gray-900/20 flex justify-center items-center gap-2 transition-all active:scale-95 disabled:opacity-70">
                  {isResetting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    "Update Password"
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