import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  ShoppingBag, 
  PlusCircle, 
  Trash2, 
  Edit, 
  CheckCircle, 
  Clock, 
  Mail, 
  Send, 
  X, 
  Search, 
  ListOrdered, 
  UtensilsCrossed, 
  AlertCircle 
} from "lucide-react";
import { FoodItem, Order } from "../types";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";

interface AdminDashboardProps {
  adminEmail: string;
}

export default function AdminDashboard({ adminEmail }: AdminDashboardProps) {
  // Navigation tabs
  const [subTab, setSubTab] = useState<"orders" | "menu">("orders");

  // Orders and Menu States
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<FoodItem[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Search/Filters
  const [orderFilter, setOrderFilter] = useState<"all" | "pending" | "paid">("all");
  const [orderSearch, setOrderSearch] = useState("");

  // Email simulation modal state
  const [emailModal, setEmailModal] = useState<{
    show: boolean;
    to: string;
    refNum: string;
    amount: number;
    subject: string;
    body: string;
  } | null>(null);

  // Form State for Adding/Editing Menu Items
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("Mains");
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [submittingForm, setSubmittingForm] = useState(false);

  // Load Real-time Orders
  useEffect(() => {
    setLoadingOrders(true);
    setDbError(null);
    const path = "orders";
    try {
      const q = query(collection(db, path), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetchedOrders = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Order[];
          setOrders(fetchedOrders);
          setLoadingOrders(false);
        },
        (err) => {
          console.error("Orders listening failed:", err);
          try {
            handleFirestoreError(err, OperationType.LIST, path);
          } catch (mappedError: any) {
            setDbError(mappedError.message || "Could not sync orders registry.");
          }
          setLoadingOrders(false);
        }
      );
      return () => unsubscribe();
    } catch (err: any) {
      console.error("Orders sub err:", err);
      setLoadingOrders(false);
    }
  }, []);

  // Load Real-time Menu Items
  useEffect(() => {
    setLoadingMenu(true);
    const path = "food_items";
    try {
      const q = query(collection(db, path));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetchedMenu = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as FoodItem[];
          setMenuItems(fetchedMenu);
          setLoadingMenu(false);
        },
        (err) => {
          console.error("Menu items listening failed:", err);
          try {
            handleFirestoreError(err, OperationType.LIST, path);
          } catch (mappedError: any) {
            setDbError(mappedError.message || "Could not sync food catalog.");
          }
          setLoadingMenu(false);
        }
      );
      return () => unsubscribe();
    } catch (err: any) {
      console.error("Menu fetch error:", err);
      setLoadingMenu(false);
    }
  }, []);

  // Action: Mark order as Paid and trigger simulated confirmation email
  const handleMarkAsPaid = async (order: Order) => {
    const path = `orders/${order.id}`;
    try {
      const orderRef = doc(db, "orders", order.id);
      
      // Enforce rules constraints: only updating paymentStatus field
      await updateDoc(orderRef, {
        paymentStatus: "paid",
      });

      // Simulate sending a "Payment received" email
      const emailSubject = `[Savory Green] Payment Verified - Order Ref: ${order.referenceNumber}`;
      const emailBody = `Hi ${order.userEmail.split("@")[0]},\n\nWe are delighted to inform you that your bKash payment of $${order.totalPrice.toFixed(2)} with Reference Code "${order.referenceNumber}" has been verified successfully!\n\nOur kitchen staff is already preparing your fresh organic dishes. You can track your order status live on your Savory Green dashboard.\n\nThank you for choosing Savory Green!\n\nWarm regards,\nSavory Green Culinary Team\nHotline: 01721938899`;

      setEmailModal({
        show: true,
        to: order.userEmail,
        refNum: order.referenceNumber,
        amount: order.totalPrice,
        subject: emailSubject,
        body: emailBody,
      });

    } catch (err: any) {
      console.error("Update status failed:", err);
      try {
        handleFirestoreError(err, OperationType.UPDATE, path);
      } catch (mappedError: any) {
        alert(`Update Failed: ${mappedError.message}`);
      }
    }
  };

  // Action: Add / Edit Food Item Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDbError(null);

    if (!formName || !formPrice) {
      alert("Name and Price are required.");
      return;
    }

    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      alert("Please provide a valid non-negative price.");
      return;
    }

    setSubmittingForm(true);

    const foodPayload = {
      name: formName,
      price: priceNum,
      imageUrl: formImageUrl || "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=600",
      description: formDescription,
      category: formCategory,
      isAvailable: formIsAvailable,
    };

    try {
      if (editingItem) {
        // Edit mode
        const path = `food_items/${editingItem.id}`;
        await updateDoc(doc(db, "food_items", editingItem.id), foodPayload);
      } else {
        // Add mode
        const path = "food_items";
        await addDoc(collection(db, "food_items"), foodPayload);
      }
      
      // Close modal & reset
      handleCloseForm();
    } catch (err: any) {
      console.error("Menu submission error:", err);
      const path = editingItem ? `food_items/${editingItem.id}` : "food_items";
      try {
        handleFirestoreError(err, editingItem ? OperationType.UPDATE : OperationType.CREATE, path);
      } catch (mappedError: any) {
        setDbError(mappedError.message);
      }
    } finally {
      setSubmittingForm(false);
    }
  };

  // Action: Delete Food Item
  const handleDeleteFood = async (itemId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this menu item?")) {
      return;
    }
    const path = `food_items/${itemId}`;
    try {
      await deleteDoc(doc(db, "food_items", itemId));
    } catch (err: any) {
      console.error("Delete menu item failed:", err);
      try {
        handleFirestoreError(err, OperationType.DELETE, path);
      } catch (mappedError: any) {
        alert(`Deletion Failed: ${mappedError.message}`);
      }
    }
  };

  const handleOpenEdit = (item: FoodItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormPrice(item.price.toString());
    setFormImageUrl(item.imageUrl);
    setFormDescription(item.description);
    setFormCategory(item.category);
    setFormIsAvailable(item.isAvailable);
    setIsFormOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName("");
    setFormPrice("");
    setFormImageUrl("");
    setFormDescription("");
    setFormCategory("Mains");
    setFormIsAvailable(true);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  // Filter orders based on state
  const filteredOrders = orders.filter((o) => {
    const matchesFilter = orderFilter === "all" || o.paymentStatus === orderFilter;
    const matchesSearch = 
      o.userEmail.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.referenceNumber.includes(orderSearch);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="admin-panel-container">
      
      {/* Title block */}
      <div className="mb-8 p-6 bg-emerald-950/80 backdrop-blur-xl text-white rounded-[24px] flex flex-wrap justify-between items-center gap-4 border border-white/20 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-500/20 backdrop-blur-xs border border-white/20 rounded-xl text-emerald-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Savory Green - Executive Control Board</h1>
            <p className="text-xs text-emerald-300 mt-1">
              Logged in as Administrator: <span className="font-mono bg-emerald-900/50 border border-white/15 px-1.5 py-0.5 rounded text-white">{adminEmail}</span>
            </p>
          </div>
        </div>
        <div className="flex space-x-2 bg-emerald-900/40 p-1.5 rounded-xl border border-white/10">
          <button
            id="admin-tab-orders"
            onClick={() => setSubTab("orders")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === "orders" ? "bg-white/80 backdrop-blur-sm border border-white/50 text-[#2e7d32] shadow-sm" : "text-emerald-300 hover:text-white"
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            Live Orders ({orders.length})
          </button>
          <button
            id="admin-tab-menu"
            onClick={() => setSubTab("menu")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === "menu" ? "bg-white/80 backdrop-blur-sm border border-white/50 text-[#2e7d32] shadow-sm" : "text-emerald-300 hover:text-white"
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            Manage Menu ({menuItems.length})
          </button>
        </div>
      </div>

      {dbError && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-1">Administrative Database Warning</span>
            <p>{dbError}</p>
          </div>
        </div>
      )}

      {/* VIEW PANEL 1: LIVE ORDERS */}
      {subTab === "orders" && (
        <div className="space-y-6" id="admin-orders-tab">
          
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white/50 backdrop-blur-md border border-white/40 p-4 rounded-2xl shadow-sm">
            {/* Search */}
            <div className="relative w-full sm:max-w-xs">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search email or reference..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
              {(["all", "pending", "paid"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setOrderFilter(filter)}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-sans font-bold uppercase tracking-wider transition-all ${
                    orderFilter === filter
                      ? "bg-white text-emerald-800 shadow-xs"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table/List */}
          {loadingOrders ? (
            <div className="text-center py-16">
              <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-gray-400 mt-3 font-medium">Re-syncing with Cloud Firestore registry...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white border border-emerald-100 rounded-xl p-12 text-center shadow-xs">
              <p className="text-gray-400 text-xs">No orders match your current filters or query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredOrders.map((order) => {
                const isPaid = order.paymentStatus === "paid";
                return (
                  <div 
                    key={order.id} 
                    className={`bg-white/60 backdrop-blur-lg border rounded-2xl p-6 transition-all shadow-md ${
                      isPaid ? "border-white/60 hover:bg-white/75" : "border-white/50 hover:bg-white/70"
                    }`}
                    id={`admin-order-${order.id}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                            ID: {order.id.slice(0, 8)}...
                          </span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isPaid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {order.paymentStatus}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-800 mt-1.5">
                          Customer: <span className="font-mono font-medium text-emerald-950">{order.userEmail}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold">BKASH REF CODE</span>
                        <code className="font-mono text-base font-black text-amber-800">{order.referenceNumber}</code>
                      </div>
                    </div>

                    {/* Ordered dishes list */}
                    <div className="space-y-2.5 mb-4 bg-gray-50/60 p-4 rounded-lg border border-gray-100/50">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Items requested</span>
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-xs text-gray-700">
                          <span>
                            {item.name} <code className="text-gray-400 font-mono text-[10px]">x{item.quantity}</code>
                          </span>
                          <span className="font-mono text-gray-500">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="border-t border-dashed border-gray-200 pt-2 mt-2 flex justify-between font-bold text-gray-800 text-xs">
                        <span>Grand Total Collected</span>
                        <span className="font-mono text-emerald-800 text-sm">${order.totalPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <span className="text-[10px] text-gray-400 font-mono">
                        Order timestamp: {formatDate(order.createdAt)}
                      </span>

                      {!isPaid ? (
                        <button
                          id={`btn-mark-paid-${order.id}`}
                          onClick={() => handleMarkAsPaid(order)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center space-x-1.5 shadow-xs transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Mark as Paid &amp; Send Email</span>
                        </button>
                      ) : (
                        <div className="flex items-center space-x-1.5 text-emerald-600 font-sans font-bold text-xs bg-emerald-50 px-3.5 py-1.5 rounded-lg border border-emerald-100">
                          <CheckCircle className="w-4 h-4" />
                          <span>Paid &amp; Confirmation Notified</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW PANEL 2: MENU CRUD MANAGEMENT */}
      {subTab === "menu" && (
        <div className="space-y-6" id="admin-menu-tab">
          
          {/* Menu Action bar */}
          <div className="flex justify-between items-center bg-white/50 border border-white/40 p-4 rounded-xl backdrop-blur-md shadow-sm">
            <span className="text-xs text-gray-500 font-medium">
              A total of <strong className="text-emerald-700">{menuItems.length}</strong> delicacies listed in catalogue.
            </span>
            <button
              id="admin-add-item-btn"
              onClick={handleOpenAdd}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add New Dish</span>
            </button>
          </div>

          {/* Grid list of dishes */}
          {loadingMenu ? (
            <div className="text-center py-16">
              <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : menuItems.length === 0 ? (
            <div className="bg-white border border-emerald-100 rounded-xl p-12 text-center">
              <p className="text-gray-400 text-xs">No food items added yet. Click 'Add New Dish' to begin cataloguing.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white/60 backdrop-blur-lg border border-white/40 rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-lg hover:bg-white/80 transition-all"
                  id={`admin-item-card-${item.id}`}
                >
                  <div className="relative aspect-video w-full bg-gray-50">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold text-emerald-800">
                      {item.category}
                    </div>
                    <div className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold ${
                      item.isAvailable ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                    }`}>
                      {item.isAvailable ? "In Stock" : "Sold Out"}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <h4 className="font-bold text-sm text-gray-800 line-clamp-1">{item.name}</h4>
                        <span className="font-mono text-emerald-700 font-bold text-sm">${item.price.toFixed(2)}</span>
                      </div>
                      <p className="text-gray-400 text-[11px] leading-relaxed line-clamp-2">{item.description}</p>
                    </div>

                    <div className="flex items-center space-x-2 border-t border-emerald-50 mt-4 pt-3">
                      <button
                        id={`btn-edit-item-${item.id}`}
                        onClick={() => handleOpenEdit(item)}
                        className="flex-1 py-1.5 border border-emerald-100 bg-emerald-50/20 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors flex items-center justify-center space-x-1"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        id={`btn-delete-item-${item.id}`}
                        onClick={() => handleDeleteFood(item.id)}
                        className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors border border-rose-100"
                        title="Delete Dish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FORM MODAL: ADD / EDIT MENU ITEM */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4" id="item-form-modal">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-emerald-100 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-emerald-950 text-white flex justify-between items-center">
              <h3 className="font-sans font-bold text-sm">
                {editingItem ? `Modify Dish: ${editingItem.name}` : "Catalog New Food Delicacy"}
              </h3>
              <button onClick={handleCloseForm} className="text-emerald-300 hover:text-white p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Dish Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Creamy Pistachio Bowl"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="12.50"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Mains">Mains</option>
                    <option value="Salads">Salads</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Drinks">Drinks</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  placeholder="What makes this organic green bowl unique..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-600"
                ></textarea>
              </div>

              <div className="flex items-center space-x-2 bg-emerald-50/40 p-3 rounded-lg border border-emerald-50">
                <input
                  type="checkbox"
                  id="formIsAvailable"
                  checked={formIsAvailable}
                  onChange={(e) => setFormIsAvailable(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="formIsAvailable" className="text-xs font-bold text-emerald-950 cursor-pointer">
                  Available in stock for ordering
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-emerald-50">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingForm}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {submittingForm ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SIMULATED CONFIRMATION EMAIL POPUP MODAL */}
      {emailModal && emailModal.show && (
        <div className="fixed inset-0 z-50 bg-gray-900/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in" id="email-simulation-modal">
          <div className="bg-white w-full max-w-2xl rounded-2xl border-2 border-emerald-400 shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="px-5 py-3 bg-emerald-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-2">
                <Mail className="w-4.5 h-4.5 text-emerald-400 animate-bounce" />
                <span className="text-xs font-bold tracking-wider uppercase">Email System Transmission Logs</span>
              </div>
              <button 
                onClick={() => setEmailModal(null)} 
                className="text-emerald-300 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Email Shell */}
            <div className="p-6 bg-slate-50 space-y-4 font-mono text-xs">
              
              <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs space-y-3">
                <div className="border-b border-slate-100 pb-2.5 space-y-1.5">
                  <div className="flex text-slate-500">
                    <span className="w-16 font-bold">FROM:</span>
                    <span className="text-slate-800 font-semibold">Savory Green Automated Ledger &lt;notifications@savorygreen.com&gt;</span>
                  </div>
                  <div className="flex text-slate-500">
                    <span className="w-16 font-bold">TO:</span>
                    <span className="text-emerald-800 font-bold">{emailModal.to}</span>
                  </div>
                  <div className="flex text-slate-500">
                    <span className="w-16 font-bold">SUBJECT:</span>
                    <span className="text-slate-800 font-black">{emailModal.subject}</span>
                  </div>
                </div>

                <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-100 font-sans text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {emailModal.body}
                </div>
              </div>

              <div className="flex items-center justify-between bg-emerald-50 p-3.5 rounded-xl border border-emerald-100 text-emerald-900">
                <div className="flex items-center space-x-2">
                  <Send className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span className="font-sans text-xs font-bold">SMTP STATUS: TRANSMITTED SUCCESSFULLY</span>
                </div>
                <button
                  onClick={() => setEmailModal(null)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-bold px-4 py-1.5 rounded-lg transition-colors"
                >
                  Close Receipt Log
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
