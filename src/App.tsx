import React, { useState, useEffect } from "react";
import { 
  Leaf, 
  ShoppingCart, 
  ChevronRight, 
  Sparkles, 
  HelpCircle,
  FileText,
  ShieldCheck,
  PlusCircle,
  Clock,
  Heart,
  Activity
} from "lucide-react";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  query 
} from "firebase/firestore";

import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { FoodItem, UserProfile } from "./types";
import { DEFAULT_FOOD_ITEMS } from "./defaultItems";

// Component imports
import Navbar from "./components/Navbar";
import AuthScreen from "./components/AuthScreen";
import MenuCard from "./components/MenuCard";
import CartSidebar from "./components/CartSidebar";
import PaymentModal from "./components/PaymentModal";
import ReceiptsList from "./components/ReceiptsList";
import AdminDashboard from "./components/AdminDashboard";

export default function App() {
  // Authentication & Profile States
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // App Layout States
  const [activeTab, setActiveTab] = useState<"menu" | "orders" | "admin">("menu");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Menu & Cart States
  const [menuItems, setMenuItems] = useState<FoodItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [cart, setCart] = useState<{ [itemId: string]: { item: FoodItem; quantity: number } }>({});

  // Real-time Database connection test
  useEffect(() => {
    async function testConnection() {
      const path = 'test/connection';
      try {
        const testRef = doc(db, 'test', 'connection');
        await getDoc(testRef);
        console.log("Firebase Connection Verified Successfully.");
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Monitor Authentication and Sync Roles
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          // Admin check conditions:
          // 1. Matches junaeid2.0shohan@gmail.com (explicit request)
          // 2. Matches admin@savorygreen.com
          // 3. Email string includes the word "admin"
          // 4. Firestore profile has isAdmin: true
          const shouldBeAdmin = 
            firebaseUser.email === "junaeid2.0shohan@gmail.com" || 
            firebaseUser.email === "admin@savorygreen.com" || 
            firebaseUser.email?.toLowerCase().includes("admin") ||
            (userDocSnap.exists() && userDocSnap.data().isAdmin === true);

          if (!userDocSnap.exists()) {
            // First time registration inside "users" collection
            await setDoc(userDocRef, {
              email: firebaseUser.email,
              isAdmin: shouldBeAdmin,
              createdAt: new Date(),
            });
            setIsAdmin(shouldBeAdmin);
          } else {
            // If admin status needs sync or update
            const currentData = userDocSnap.data();
            if (currentData.isAdmin !== shouldBeAdmin) {
              await setDoc(userDocRef, { ...currentData, isAdmin: shouldBeAdmin }, { merge: true });
            }
            setIsAdmin(shouldBeAdmin);
          }
        } catch (err) {
          console.error("Error setting up/syncing user profile in Firestore:", err);
        }
      } else {
        setIsAdmin(false);
        if (activeTab === "admin" || activeTab === "orders") {
          setActiveTab("menu");
        }
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [activeTab]);

  // Sync Menu Items & Handle Automatic Seeding
  useEffect(() => {
    setLoadingMenu(true);
    const path = "food_items";
    try {
      const q = query(collection(db, path));
      const unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          if (snapshot.empty) {
            // Seeding empty database with Default wholesome items
            console.log("No menu items found. Seeding default Savory Green items...");
            try {
              for (const dish of DEFAULT_FOOD_ITEMS) {
                await addDoc(collection(db, "food_items"), dish);
              }
            } catch (seedErr) {
              console.warn("Database seeding deferred (permissions lock or unauthenticated). Wait for admin.", seedErr);
            }
            setLoadingMenu(false);
          } else {
            const fetchedItems = snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            })) as FoodItem[];
            setMenuItems(fetchedItems);
            setLoadingMenu(false);
          }
        },
        (err) => {
          console.error("Menu items fetch failed:", err);
          setLoadingMenu(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      console.error("Menu fetch exception:", err);
      setLoadingMenu(false);
    }
  }, []);

  // Cart operations
  const handleIncreaseCart = (itemId: string) => {
    setCart((prevCart) => {
      const existing = prevCart[itemId];
      if (existing) {
        return {
          ...prevCart,
          [itemId]: { ...existing, quantity: existing.quantity + 1 },
        };
      } else {
        const menuItem = menuItems.find((m) => m.id === itemId);
        if (menuItem) {
          return {
            ...prevCart,
            [itemId]: { item: menuItem, quantity: 1 },
          };
        }
      }
      return prevCart;
    });
  };

  const handleDecreaseCart = (itemId: string) => {
    setCart((prevCart) => {
      const existing = prevCart[itemId];
      if (!existing) return prevCart;
      
      if (existing.quantity <= 1) {
        const nextCart = { ...prevCart };
        delete nextCart[itemId];
        return nextCart;
      } else {
        return {
          ...prevCart,
          [itemId]: { ...existing, quantity: existing.quantity - 1 },
        };
      }
    });
  };

  const handleClearCart = () => {
    setCart({});
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCart({});
      setActiveTab("menu");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleOpenAuth = () => {
    setIsAuthOpen(true);
  };

  const handleAuthSuccess = () => {
    setIsAuthOpen(false);
  };

  // List of categories derived dynamically
  const categories = ["All", "Mains", "Salads", "Desserts", "Drinks"];

  // Filter food items matching active category
  const filteredItems = menuItems.filter((item) => {
    if (activeCategory === "All") return true;
    return item.category.toLowerCase() === activeCategory.toLowerCase();
  });

  const cartItemsArray = Object.keys(cart).map((id) => cart[id]);
  const cartTotalCount = cartItemsArray.reduce((acc, c) => acc + c.quantity, 0);

  return (
    <div className="min-h-screen relative flex flex-col font-sans text-gray-800" id="savory-green-root">
      {/* Background Decorative Blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#f4f7f4]">
        <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#c8e6c9] rounded-full blur-[100px] opacity-40"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#81c784] rounded-full blur-[120px] opacity-20"></div>
      </div>

      {/* Content wrapper with z-10 */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Dynamic Header / Navbar */}
      <Navbar
        user={user}
        isAdmin={isAdmin}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartTotalCount}
        onLogout={handleLogout}
        onOpenAuth={handleOpenAuth}
      />

      {/* Main Content Area */}
      <main className="flex-grow">
        {activeTab === "menu" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="menu-view-layout">
            
            {/* Immersive Brand Banner */}
            <div className="bg-emerald-950/80 backdrop-blur-xl text-white rounded-3xl p-8 sm:p-12 mb-10 relative overflow-hidden border border-white/20 shadow-xl">
              <div className="absolute right-0 top-0 bottom-0 opacity-15 pointer-events-none hidden lg:block w-1/2">
                <img 
                  src="https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&q=80&w=600" 
                  alt="Background decoration" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="max-w-2xl relative z-10 space-y-4">
                <div className="inline-flex items-center space-x-1.5 bg-emerald-700/50 px-3 py-1 rounded-full text-[10px] font-sans font-bold tracking-widest uppercase border border-emerald-600/30">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span>Wholesome Organic Dining</span>
                </div>
                <h2 className="text-3xl sm:text-5xl font-sans font-black tracking-tight leading-none text-emerald-50">
                  Savor the Goodness <br />
                  <span className="text-emerald-400">Of Pure Nature</span>
                </h2>
                <p className="text-sm text-emerald-200 leading-relaxed font-light">
                  Premium ingredients curated by master culinary artists. Fresh, vibrant salads, plant-based powerhouses, delicious matcha-themed treats, and raw cold-pressed juices. Complete your payment via secure <strong>bKash reference numbers</strong> for prioritized kitchen prep!
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <button 
                    onClick={() => {
                      const el = document.getElementById("menu-grid-section");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                  >
                    <span>Explore Menu Card</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="flex items-center space-x-2 text-xs text-emerald-300/90 font-mono bg-emerald-900/40 px-3.5 py-2 rounded-xl border border-emerald-800">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>bKash Hotline: 01721938899</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Filter and Dishes Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8" id="menu-grid-section">
              
              {/* Left Side: Category filter and grid of food */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* Category filters */}
                <div className="flex items-center space-x-2.5 overflow-x-auto pb-2 scrollbar-none">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 uppercase tracking-wider ${
                        activeCategory === category
                          ? "bg-white/80 backdrop-blur-md border border-white/50 shadow-sm text-[#2e7d32]"
                          : "bg-white/30 hover:bg-white/60 backdrop-blur-xs transition-all border border-white/20 text-gray-600"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {/* Grid of Menu Cards */}
                {loadingMenu ? (
                  <div className="text-center py-20">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs text-gray-400 mt-4 font-medium">Preparing our fresh organic cookbook...</p>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="bg-white border border-emerald-100 rounded-2xl p-16 text-center shadow-xs">
                    <p className="text-gray-400 text-sm">No items found matching the selected category.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredItems.map((item) => (
                      <MenuCard
                        key={item.id}
                        item={item}
                        quantity={cart[item.id]?.quantity || 0}
                        onIncrease={() => handleIncreaseCart(item.id)}
                        onDecrease={() => handleDecreaseCart(item.id)}
                        onAddToCart={() => handleIncreaseCart(item.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Right Side: Sticky Shopping Cart drawer */}
              <div className="lg:col-span-1">
                <CartSidebar
                  cartItems={cartItemsArray}
                  onIncrease={handleIncreaseCart}
                  onDecrease={handleDecreaseCart}
                  onClear={handleClearCart}
                  onCheckout={() => setIsCheckoutOpen(true)}
                  isSignedIn={!!user}
                  onOpenAuth={handleOpenAuth}
                />
              </div>

            </div>

          </div>
        )}

        {activeTab === "orders" && user && (
          <ReceiptsList userId={user.uid} />
        )}

        {activeTab === "admin" && user && isAdmin && (
          <AdminDashboard adminEmail={user.email || ""} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white/40 backdrop-blur-md border-t border-white/20 py-8 text-center mt-12 relative z-10" id="savory-green-footer">
        <div className="max-w-7xl mx-auto px-4 text-gray-500 text-xs font-sans space-y-3">
          <div className="flex items-center justify-center space-x-1.5 text-emerald-800 font-bold">
            <Leaf className="w-4 h-4 text-emerald-500" />
            <span className="font-sans tracking-tight">Savory Green Culinary Co.</span>
          </div>
          <p className="max-w-md mx-auto text-gray-400 text-[11px] leading-relaxed">
            Freshly prepared plant-based dishes, organic salads, gluten-free power bowls, and cold-pressed juices. We use a manual bKash reference verification ledger.
          </p>
          <div className="flex justify-center space-x-4 text-[10px] font-mono text-gray-400">
            <span>bKash Merchant: 01721938899</span>
            <span>&bull;</span>
            <span>Support: support@savorygreen.com</span>
          </div>
          <p className="text-[10px] text-gray-300 font-mono mt-4">
            &copy; 2026 Savory Green. Fully managed with Cloud Firestore Security.
          </p>
        </div>
      </footer>

      {/* AUTHENTICATION OVERLAY MODAL */}
      {isAuthOpen && (
        <AuthScreen
          onSuccess={handleAuthSuccess}
          onClose={() => setIsAuthOpen(false)}
        />
      )}

      {/* BKASH REFERENCE PAYMENT OVERLAY MODAL */}
      {isCheckoutOpen && user && cartItemsArray.length > 0 && (
        <PaymentModal
          cartItems={cartItemsArray}
          userEmail={user.email || ""}
          userId={user.uid}
          onClose={() => {
            setIsCheckoutOpen(false);
            setActiveTab("orders"); // Auto-navigate to orders list so they can see the pending log
          }}
          onOrderSaved={() => {
            handleClearCart();
          }}
        />
      )}

      </div>
    </div>
  );
}
