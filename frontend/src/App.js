import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import "@/App.css";
import "@/index.css";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { WhatsappLogo } from "@phosphor-icons/react";
import SeoManager from "@/components/SeoManager";
import { AuthProvider } from "@/lib/auth";

import Home from "@/pages/Home";
import Properties from "@/pages/Properties";
import PropertyDetail from "@/pages/PropertyDetail";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import LocationDetail from "@/pages/LocationDetail";
import Developers from "@/pages/Developers";
import DeveloperDetail from "@/pages/DeveloperDetail";
import { Agents, AgentDetail } from "@/pages/AgentPages";
import { Blog, BlogPost } from "@/pages/BlogPages";
import { Login, Register, ForgotPassword, ResetPassword } from "@/pages/AuthPages";
import { UserDashboard } from "@/pages/DashboardPages";
import AdminPanel from "@/pages/admin/AdminPanel";
import PropertyForm from "@/pages/admin/PropertyForm";
import ProjectForm from "@/pages/admin/ProjectForm";
import AdminUnits from "@/pages/admin/AdminUnits";
import { AgentDashboard, DeveloperDashboard, ClientDashboard } from "@/pages/RoleDashboards";
import AISearch from "@/pages/AISearch";
import EMICalculator from "@/pages/EMICalculator";
import Compare from "@/pages/Compare";
import PostProperty from "@/pages/PostProperty";
import HomeLoan from "@/pages/HomeLoan";
import CmsPage from "@/pages/CmsPage";
import { NotFound, About, Contact, FAQs, VerifyEmail } from "@/pages/StaticPages";
import Testimonials from "@/pages/Testimonials";
import Rtmi from "@/pages/Rtmi";

export default function App() {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <SeoManager />
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/properties" element={<Properties />} />
              <Route path="/property/:slug" element={<PropertyDetail />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/new-launch" element={<Projects fixedStatus="new_launch" />} />
              <Route path="/project/:slug" element={<ProjectDetail />} />
              <Route path="/location/:slug" element={<LocationDetail />} />
              <Route path="/developers" element={<Developers />} />
              <Route path="/developer/:slug" element={<DeveloperDetail />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/agent/:slug" element={<AgentDetail />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/favorites" element={<UserDashboard />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/admin/properties/new" element={<PropertyForm />} />
              <Route path="/admin/properties/:id/edit" element={<PropertyForm />} />
              <Route path="/admin/projects/new" element={<ProjectForm />} />
              <Route path="/admin/projects/:id/edit" element={<ProjectForm />} />
              <Route path="/admin/projects/:id/units" element={<AdminUnits />} />
              <Route path="/agent" element={<AgentDashboard />} />
              <Route path="/developer" element={<DeveloperDashboard />} />
              <Route path="/client" element={<ClientDashboard />} />
              <Route path="/ai-search" element={<AISearch />} />
              <Route path="/emi-calculator" element={<EMICalculator />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/post-property" element={<PostProperty />} />
              <Route path="/dashboard/list-property" element={<PropertyForm />} />
              <Route path="/dashboard/list-property/:id/edit" element={<PropertyForm />} />
              <Route path="/agent/list-property" element={<PropertyForm />} />
              <Route path="/agent/list-property/:id/edit" element={<PropertyForm />} />
              <Route path="/developer/projects/new" element={<ProjectForm />} />
              <Route path="/developer/projects/:id/edit" element={<ProjectForm />} />
              <Route path="/developer/projects/:id/units" element={<AdminUnits />} />
              <Route path="/page/:slug" element={<CmsPage />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faqs" element={<FAQs />} />
              <Route path="/testimonials" element={<Testimonials />} />
              <Route path="/rtmi" element={<Rtmi />} />
              <Route path="/home-loan" element={<HomeLoan />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
          <a
            href="https://wa.me/918828830707"
            target="_blank"
            rel="noopener"
            data-testid="floating-whatsapp"
            aria-label="Chat with CarpetAdda on WhatsApp"
            className="fixed bottom-5 right-5 z-[60] w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:bg-[#1eb85a] hover:scale-105 transition-all"
          >
            <WhatsappLogo size={28} weight="fill" />
          </a>
          <Toaster position="top-center" richColors />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
