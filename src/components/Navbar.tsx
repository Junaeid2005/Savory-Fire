import React from "react";
import { Leaf, LogOut, User, ShieldCheck, ShoppingCart } from "lucide-react";
import { User as FirebaseUser } from "firebase/auth";

interface NavbarProps {
  user: FirebaseUser | null;
  isAdmin: boolean;
  activeTab: "menu" | "orders" | "admin";
  setActiveTab: (tab: "menu" | "orders" | "admin") => void;
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
    <nav className="sticky top-0 z-40 bg-white/60 backdrop-blur-md border-b border-white/40 shadow-sm" id="savory-green-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setActiveTab("menu")}>
            <div className="p-2 bg-emerald-500/20 backdrop-blur-xs border border-white/40 rounded-lg text-emerald-600 transition-all hover:scale-105">
              <Leaf className="h-6 w-6 text-[#2e7d32]" />
            </div>
            <div>
              <span className="font-sans text-xl font-bold tracking-tight text-[#2e7d32]">
                Savory<span className="text-[#4caf50]">Green</span>
              </span>
              <p className="text-[9px] font-mono tracking-wider uppercase text-[#4caf50] -mt-1 font-medium">
                Fresh &amp; Wholesome
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-2">
            <button
              id="nav-menu-btn"
              onClick={() => setActiveTab("menu")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "menu"
                  ? "bg-white/80 backdrop-blur-sm border border-white/50 text-[#2e7d32] shadow-sm"
                  : "text-gray-700 hover:text-[#4caf50] hover:bg-white/40 border border-transparent"
              }`}
            >
              Menu
            </button>
            {user && (
              <button
                id="nav-orders-btn"
                onClick={() => setActiveTab("orders")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === "orders"
                    ? "bg-white/80 backdrop-blur-sm border border-white/50 text-[#2e7d32] shadow-sm"
                    : "text-gray-700 hover:text-[#4caf50] hover:bg-white/40 border border-transparent"
                }`}
              >
                My Orders
              </button>
            )}
            {user && isAdmin && (
              <button
                id="nav-admin-btn"
                onClick={() => setActiveTab("admin")}
                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === "admin"
                    ? "bg-[#2e7d32] text-white shadow-md shadow-[#2e7d32]/20 border border-emerald-700"
                    : "text-red-600 bg-white/40 hover:bg-white/60 border border-white/20"
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
              <div className="flex items-center space-x-3 border-l border-emerald-50 pl-3">
                <div className="hidden sm:flex flex-col items-end">
                  <div className="flex items-center space-x-1.5">
                    {isAdmin && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                        Admin
                      </span>
                    )}
                    <span className="text-xs font-semibold text-gray-800 max-w-[120px] truncate">
                      {user.email?.split("@")[0]}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono max-w-[150px] truncate">
                    {user.email}
                  </span>
                </div>
                <div className="p-2 bg-emerald-50 rounded-full text-emerald-700 sm:block hidden">
                  <User className="w-4 h-4" />
                </div>
                <button
                  id="nav-logout-btn"
                  onClick={onLogout}
                  className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="nav-login-btn"
                onClick={onOpenAuth}
                className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-all flex items-center space-x-1.5 shadow-xs"
              >
                <User className="w-4 h-4" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Sub-Navigation for signed-in users */}
        {user && (
          <div className="flex md:hidden border-t border-emerald-50 py-2 justify-center space-x-4">
            <button
              onClick={() => setActiveTab("menu")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md ${
                activeTab === "menu" ? "bg-emerald-500 text-white" : "text-gray-600"
              }`}
            >
              Menu
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md ${
                activeTab === "orders" ? "bg-emerald-500 text-white" : "text-gray-600"
              }`}
            >
              My Orders
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1 ${
                  activeTab === "admin" ? "bg-emerald-600 text-white" : "text-emerald-700 bg-emerald-50"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Panel
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
