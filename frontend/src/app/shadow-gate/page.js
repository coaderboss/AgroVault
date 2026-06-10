"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Terminal, Lock } from "lucide-react";

export default function ShadowGate() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post("https://agrovault.onrender.com/api/admin/login", { password });
      if (res.data.success) {
        Cookies.set("admin_token", res.data.token, { expires: 1 }); // 1 Day expiry
        router.push("/admin"); // Login hote hi overseer par phek dega
      }
    } catch (err) {
      setError("Intruder Alert! Access Denied.");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#050505] flex items-center justify-center font-mono selection:bg-emerald-500/30">
      <div className="w-full max-w-sm p-8 border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] pointer-events-none"></div>
        
        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="p-3 bg-black border border-white/10 rounded-xl mb-4 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Terminal size={28} className="text-emerald-500" />
          </div>
          <h1 className="text-white font-black tracking-[0.3em] uppercase text-sm">System Override</h1>
          <p className="text-gray-600 text-[10px] mt-1 tracking-widest">Awaiting authentication...</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 relative z-10">
          <div>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
              <input 
                type="password" 
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter God Mode Key" 
                className="w-full bg-black border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-emerald-400 tracking-[0.2em] outline-none focus:border-emerald-500 transition-colors placeholder-gray-800"
              />
            </div>
            {error && <p className="text-rose-500 text-[10px] font-bold tracking-widest uppercase mt-2 text-center animate-pulse">{error}</p>}
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-white/5 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 font-black tracking-widest uppercase text-xs py-3.5 rounded-xl transition-all"
          >
            {loading ? "Verifying..." : "Initialize"}
          </button>
        </form>
      </div>
    </div>
  );
}