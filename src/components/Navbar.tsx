import React from "react";
import { Leaf, LogOut, User, ShieldCheck, ShoppingCart, MessageSquare, MapPin, PhoneCall } from "lucide-react";
import { User as FirebaseUser } from "firebase/auth";

interface NavbarProps {
  user: FirebaseUser | null;
  isAdmin: boolean;
  activeTab: "menu" | "reviews" | "orders" | "admin";
  setActiveTab: (tab: "menu" | "reviews" | "orders" | "admin") => void;
  cartCount: number;
  onLogout: () => void;
  onOpenAuth: () => void;
}

export default function Navbar({
  user,
  isAdmin,
  activeTab,
  setActiveTab,
  cartCount,
  onLogout,
  onOpenAuth,
}: NavbarProps) {
  return (
    <div className="sticky top-0 z-40 w-full" id="navbar-root-wrapper">
      
      {/* Random Restaurant Location & Hotline Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white py-2 px-4 text-center text-[10px] sm:text-xs font-mono tracking-wider uppercase flex flex-wrap justify-center items-center gap-x-4 gap-y-1 shrink-0 shadow-inner">
        <span className="flex items-center gap-1 font-semibold text-emerald-200">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          Kitchen: 742 Gardenia Avenue, Green Zone, Dhaka, BD
        </span>
        <span className="opacity-40 hidden sm:inline">•</span>
        <span className="flex items-center gap-1 font-semibold text-emerald-200">
          <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
          Hotline: +880 1721-938899
        </span>
      </div>

      {/* Main Navigation bar */}
      <nav className="bg-white/70 backdrop-blur-xl border-b border-white/60 shadow-md" id="savory-green-navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            
            {/* Logo and Brand */}
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setActiveTab("menu")}>
              <div className="p-2.5 bg-emerald-500/10 backdrop-blur-xs border border-emerald-100 rounded-xl text-emerald-600 transition-all hover:scale-105 shadow-sm">
                <Leaf className="h-5.5 w-5.5 text-[#2e7d32]" />
              </div>
              <div>
                <span className="font-sans text-xl font-extrabold tracking-tight text-[#2e7d32]">
                  Savory<span className="text-emerald-500">Green</span>
                </span>
                <p className="text-[9px] font-mono tracking-widest uppercase text-emerald-600 -mt-1 font-bold">
                  Fresh &amp; Wholesome
                </p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-1.5">
              <button
                id="nav-menu-btn"
                onClick={() => setActiveTab("menu")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "menu"
                    ? "bg-[#2e7d32] text-white shadow-lg shadow-[#2e7d32]/20 scale-105"
                    : "text-gray-700 hover:text-[#4caf50] hover:bg-emerald-50/50"
                }`}
              >
                Menu
              </button>
              
              <button
                id="nav-reviews-btn"
                onClick={() => setActiveTab("reviews")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "reviews"
                    ? "bg-[#2e7d32] text-white shadow-lg shadow-[#2e7d32]/20 scale-105"
                    : "text-gray-700 hover:text-[#4caf50] hover:bg-emerald-50/50"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Reviews Portal
              </button>

              {user && (
                <button
                  id="nav-orders-btn"
                  onClick={() => setActiveTab("orders")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === "orders"
                      ? "bg-[#2e7d32] text-white shadow-lg shadow-[#2e7d32]/20 scale-105"
                      : "text-gray-700 hover:text-[#4caf50] hover:bg-emerald-50/50"
                  }`}
                >
                  My Orders
                </button>
              )}
              
              {user && isAdmin && (
                <button
                  id="nav-admin-btn"
                  onClick={() => setActiveTab("admin")}
                  className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                    activeTab === "admin"
                      ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20 scale-105"
                      : "text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/50"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin Panel
                </button>
              )}
            </div>

            {/* User Controls */}
            <div className="flex items-center space-x-3">
              {/* Quick mobile Cart button indicator */}
              {activeTab === "menu" && (
                <div className="relative p-2 text-emerald-700 hover:bg-emerald-50 rounded-lg md:hidden">
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-white font-sans font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                      {cartCount}
                    </span>
                  )}
                </div>
              )}

              {user ? (
                <div className="flex items-center space-x-3 border-l border-emerald-100 pl-3">
                  <div className="hidden sm:flex flex-col items-end">
                    <div className="flex items-center space-x-1.5">
                      {isAdmin && (
                        <span className="bg-amber-100 text-amber-800 text-[9px] font-sans font-black px-1.5 py-0.2 rounded-full border border-amber-200 tracking-wider">
                          Admin
                        </span>
                      )}
                      <span className="text-xs font-bold text-emerald-950 max-w-[120px] truncate">
                        {user.email?.split("@")[0]}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono max-w-[150px] truncate">
                      {user.email}
                    </span>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-full text-emerald-700 sm:block hidden border border-emerald-100/50 shadow-inner">
                    <User className="w-4 h-4" />
                  </div>
                  <button
                    id="nav-logout-btn"
                    onClick={onLogout}
                    className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 rounded-xl transition-all hover:scale-105 shadow-sm"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  id="nav-login-btn"
                  onClick={onOpenAuth}
                  className="bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-800 transition-all flex items-center space-x-1.5 shadow-md shadow-emerald-700/10 hover:scale-[1.02]"
                >
                  <User className="w-4 h-4" />
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Sub-Navigation for tabs */}
          <div className="flex md:hidden border-t border-emerald-100 py-2 justify-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab("menu")}
              className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all ${
                activeTab === "menu" ? "bg-emerald-700 text-white shadow-sm" : "text-gray-600 hover:bg-emerald-50"
              }`}
            >
              Menu
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all ${
                activeTab === "reviews" ? "bg-emerald-700 text-white shadow-sm" : "text-gray-600 hover:bg-emerald-50"
              }`}
            >
              Reviews
            </button>
            {user && (
              <button
                onClick={() => setActiveTab("orders")}
                className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all ${
                  activeTab === "orders" ? "bg-emerald-700 text-white shadow-sm" : "text-gray-600 hover:bg-emerald-50"
                }`}
              >
                My Orders
              </button>
            )}
            {user && isAdmin && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all ${
                  activeTab === "admin" ? "bg-amber-600 text-white shadow-sm" : "text-amber-800 bg-amber-50"
                }`}
              >
                Admin Panel
              </button>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}
