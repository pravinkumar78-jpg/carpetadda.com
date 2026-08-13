import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { House } from "@phosphor-icons/react";
import api from "@/lib/api";

export function Login() {
  const { login } = useAuth(); const nav = useNavigate();
  const [f, setF] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await login(f.email, f.password); toast.success("Welcome back!"); nav("/dashboard"); }
    catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message ||
        (err.response?.status === 503 ? "Backend is not connected. Please configure BACKEND_URL." : "Login failed");
      toast.error(msg);
    }
    finally { setLoading(false); }
  };
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-12 section-blue">
      <div className="w-full max-w-md card-premium p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center"><House size={20} weight="fill" className="text-white" /></div>
          <span className="text-lg font-bold text-slate-900">CarpetAdda</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h1>
        <p className="text-sm text-slate-500 mb-6">Sign in to continue your property journey.</p>
        <form onSubmit={submit} className="space-y-4">
          <Input data-testid="login-email" required type="email" placeholder="Email" value={f.email} onChange={e => setF({...f, email: e.target.value})} className="rounded-lg border-slate-200" />
          <Input data-testid="login-password" required type="password" placeholder="Password" value={f.password} onChange={e => setF({...f, password: e.target.value})} className="rounded-lg border-slate-200" />
          <div className="text-right"><Link data-testid="login-forgot-password-link" to="/forgot-password" className="text-sm text-blue-600 font-medium">Forgot password?</Link></div>
          <button data-testid="login-submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20 disabled:opacity-60">{loading ? "Signing in…" : "Sign in"}</button>
        </form>
        <div className="text-sm text-center mt-6 text-slate-500">New here? <Link to="/register" className="text-blue-600 font-medium">Create account</Link></div>
        <div className="text-xs text-center mt-4 text-slate-400 bg-blue-50 border border-blue-100 rounded-lg py-2">Demo: admin@estatehub.in / Admin@123</div>
      </div>
    </div>
  );
}

export function Register() {
  const { register } = useAuth(); const nav = useNavigate();
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", role: "user" });
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await register(f); toast.success("Account created!"); nav("/dashboard"); }
    catch (err) { toast.error(err.response?.data?.detail || "Registration failed"); }
    finally { setLoading(false); }
  };
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-12 section-blue">
      <div className="w-full max-w-md card-premium p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center"><House size={20} weight="fill" className="text-white" /></div>
          <span className="text-lg font-bold text-slate-900">CarpetAdda</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Create your account</h1>
        <p className="text-sm text-slate-500 mb-6">Save favourites, get alerts, book visits.</p>
        <form onSubmit={submit} className="space-y-4">
          <Input data-testid="reg-name" required placeholder="Full name" value={f.name} onChange={e => setF({...f, name: e.target.value})} className="rounded-lg border-slate-200" />
          <Input data-testid="reg-email" required type="email" placeholder="Email" value={f.email} onChange={e => setF({...f, email: e.target.value})} className="rounded-lg border-slate-200" />
          <Input data-testid="reg-phone" placeholder="Phone (optional)" value={f.phone} onChange={e => setF({...f, phone: e.target.value})} className="rounded-lg border-slate-200" />
          <Input data-testid="reg-password" required type="password" placeholder="Password (min 6 chars)" minLength={6} value={f.password} onChange={e => setF({...f, password: e.target.value})} className="rounded-lg border-slate-200" />
          <button data-testid="reg-submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20 disabled:opacity-60">{loading ? "Creating…" : "Create account"}</button>
        </form>
        <div className="text-sm text-center mt-6 text-slate-500">Already have an account? <Link to="/login" className="text-blue-600 font-medium">Sign in</Link></div>
      </div>
    </div>
  );
}


export function ForgotPassword() {
  const [email,setEmail]=useState(""); const [loading,setLoading]=useState(false); const [sent,setSent]=useState(false);
  const submit=async(e)=>{e.preventDefault();setLoading(true);try{await api.post("/auth/forgot-password",{email});setSent(true);toast.success("If the email is registered, a reset link has been sent.");}catch(err){
    const msg = err.response?.data?.detail || err.response?.data?.message ||
      (err.response?.status === 503 ? "Backend is not connected. Please configure BACKEND_URL." : "Request failed");
    toast.error(msg);
  }finally{setLoading(false);}};
  return <div className="min-h-[70vh] flex items-center justify-center px-6 py-12 section-blue"><div className="w-full max-w-md card-premium p-8"><h1 className="text-3xl font-bold text-slate-900 mb-2">Forgot password?</h1><p className="text-sm text-slate-500 mb-6">Enter your registered email and we will send a secure reset link.</p>{sent?<div className="p-4 rounded-lg bg-emerald-50 text-emerald-800 text-sm">Check your email. The reset link expires in 30 minutes.</div>:<form onSubmit={submit} className="space-y-4"><Input required type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} /><button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold disabled:opacity-60">{loading?"Sending…":"Send reset link"}</button></form>}<div className="text-sm text-center mt-6"><Link to="/login" className="text-blue-600 font-medium">Back to sign in</Link></div></div></div>;
}

export function ResetPassword() {
  const token=new URLSearchParams(window.location.search).get("token")||""; const [pw,setPw]=useState(""); const [cpw,setCpw]=useState(""); const [done,setDone]=useState(false); const [loading,setLoading]=useState(false); const nav=useNavigate();
  const submit=async(e)=>{e.preventDefault();setLoading(true);try{await api.post("/auth/reset-password",{token,new_password:pw,confirm_password:cpw});setDone(true);toast.success("Password updated");setTimeout(()=>nav("/login"),1200);}catch(err){
    const msg = err.response?.data?.detail || err.response?.data?.message ||
      (err.response?.status === 503 ? "Backend is not connected. Please configure BACKEND_URL." : "Reset link is invalid or expired");
    toast.error(msg);
  }finally{setLoading(false);}};
  return <div className="min-h-[70vh] flex items-center justify-center px-6 py-12 section-blue"><div className="w-full max-w-md card-premium p-8"><h1 className="text-3xl font-bold text-slate-900 mb-2">Set new password</h1>{done?<div className="p-4 rounded-lg bg-emerald-50 text-emerald-800 text-sm">Password updated. Redirecting to login…</div>:<form onSubmit={submit} className="space-y-4"><Input required minLength={8} type="password" placeholder="New password" value={pw} onChange={e=>setPw(e.target.value)} /><Input required minLength={8} type="password" placeholder="Confirm new password" value={cpw} onChange={e=>setCpw(e.target.value)} /><button disabled={loading||!token} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold disabled:opacity-60">{loading?"Updating…":"Update password"}</button></form>}</div></div>;
}
