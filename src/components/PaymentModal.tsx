import React, { useState, useEffect } from "react";
import { Copy, Check, CheckCircle2, AlertCircle, ShoppingBag, Landmark, ArrowLeft } from "lucide-react";
import { FoodItem, OrderItem } from "../types";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";

interface PaymentModalProps {
  cartItems: { item: FoodItem; quantity: number }[];
  userEmail: string;
  userId: string;
  onClose: () => void;
  onOrderSaved: () => void;
}

export default function PaymentModal({
  cartItems,
  userEmail,
  userId,
  onClose,
  onOrderSaved,
}: PaymentModalProps) {
  const [referenceNumber] = useState(() => 
    Math.floor(1000 + Math.random() * 9000).toString()
  );
  
  const [copiedBkash, setCopiedBkash] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<any | null>(null);
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState(false);

  const bkashNumber = "01721938899";
  const totalPrice = cartItems.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);

  const handleCopyBkash = () => {
    navigator.clipboard.writeText(bkashNumber);
    setCopiedBkash(true);
    setTimeout(() => setCopiedBkash(false), 2000);
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText(referenceNumber);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleConfirmOrder = async () => {
    if (!address.trim()) {
      setAddressError(true);
      setError("Delivery address is required to place your order.");
      return;
    }
    setAddressError(false);
    setLoading(true);
    setError(null);

    // Prepare order item documents
    const items: OrderItem[] = cartItems.map(({ item, quantity }) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: quantity,
    }));

    const path = "orders";
    try {
      // Save order to Firestore with status 'pending'
      const orderData = {
        userId,
        userEmail,
        items,
        totalPrice,
        referenceNumber,
        paymentStatus: "pending" as const,
        address: address.trim(),
        createdAt: serverTimestamp(), // Rules strictly enforce request.time
      };

      const docRef = await addDoc(collection(db, path), orderData);
      
      // Store receipt info to display to user
      setReceipt({
        id: docRef.id,
        ...orderData,
        createdAt: new Date(), // Local approximation for immediate display
      });

      // Clear the user's local basket in parent state
      onOrderSaved();
    } catch (err: any) {
      console.error("Order submission failed:", err);
      try {
        handleFirestoreError(err, OperationType.CREATE, path);
      } catch (mappedError: any) {
        setError(mappedError.message || "An unexpected database authorization error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1b5e20]/10 backdrop-blur-md flex items-center justify-center p-4" id="payment-modal-overlay">
      <div className="bg-white/75 backdrop-blur-xl w-full max-w-2xl rounded-[32px] border border-white/60 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#2e7d32] text-white flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-2">
            <Landmark className="w-5 h-5" />
            <h3 className="font-sans font-bold text-lg">bKash Reference Payment</h3>
          </div>
          {!receipt && (
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white font-sans text-sm font-semibold flex items-center gap-1 bg-white/10 px-3 py-1 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
        </div>

        {/* Scrollable Container */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-rose-800 text-xs leading-relaxed">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 text-rose-500 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">Database Error Code: 403 (Permission Denied)</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {!receipt ? (
            <div className="space-y-6" id="payment-form-step">
              
              {/* Payment Instructions Alert */}
              <div className="bg-[#e8f5e9]/60 backdrop-blur-xs border border-emerald-100/40 rounded-2xl p-4 flex gap-3 text-[#2e7d32] text-xs leading-relaxed">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5 animate-ping"></div>
                <div>
                  <span className="font-bold block mb-1">Instruction:</span>
                  <p>
                    Please send the payment of <strong className="font-mono text-emerald-800 text-sm font-black">${totalPrice.toFixed(2)}</strong> via bKash. Be sure to input the <strong className="font-mono bg-amber-100 px-1 rounded text-amber-950 font-black">Reference Number ({referenceNumber})</strong> so our administrators can verify your payment and process your dishes.
                  </p>
                </div>
              </div>

              {/* Grid: Details & Payment credentials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Left side: Merchant Info */}
                <div className="bg-white/40 backdrop-blur-xs border border-white/30 p-5 rounded-2xl space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 border-b border-emerald-50 pb-2">
                    bKash Transfer Credentials
                  </h4>
                  
                  {/* bKash Number copy field */}
                  <div>
                    <span className="block text-[10px] font-semibold text-gray-500 mb-1">
                      BKASH NUMBER (SEND MONEY / CASH IN)
                    </span>
                    <div className="flex items-center justify-between bg-white p-3 border border-emerald-100 rounded-lg">
                      <code className="font-mono text-emerald-900 font-bold">{bkashNumber}</code>
                      <button
                        onClick={handleCopyBkash}
                        className="text-emerald-600 hover:text-emerald-800 p-1 rounded-md hover:bg-emerald-50 transition-colors"
                        title="Copy number"
                      >
                        {copiedBkash ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Reference code copy field */}
                  <div>
                    <span className="block text-[10px] font-semibold text-gray-500 mb-1">
                      4-DIGIT REFERENCE NUMBER (CRITICAL)
                    </span>
                    <div className="flex items-center justify-between bg-white p-3 border border-amber-100 rounded-lg">
                      <code className="font-mono text-amber-800 font-black text-lg">{referenceNumber}</code>
                      <button
                        onClick={handleCopyRef}
                        className="text-amber-600 hover:text-amber-800 p-1 rounded-md hover:bg-amber-50 transition-colors"
                        title="Copy reference"
                      >
                        {copiedRef ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right side: Items Overview */}
                <div className="bg-white/35 backdrop-blur-xs p-5 rounded-2xl border border-white/20 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 border-b border-gray-200 pb-2 mb-3">
                      Order Summary
                    </h4>
                    <div className="space-y-2.5 max-h-[150px] overflow-y-auto pr-1">
                      {cartItems.map(({ item, quantity }) => (
                        <div key={item.id} className="flex justify-between items-center text-xs">
                          <span className="text-gray-700 truncate max-w-[150px]">{item.name}</span>
                          <span className="text-gray-400 font-mono">x{quantity}</span>
                          <span className="font-mono font-medium text-gray-800">${(item.price * quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-3 mt-4 flex justify-between items-end">
                    <span className="text-xs font-bold text-gray-500">Payable Amount</span>
                    <span className="font-mono font-black text-emerald-800 text-lg">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>

              </div>

              {/* Delivery Address Field */}
              <div className="bg-white/50 backdrop-blur-xs border border-emerald-100 p-5 rounded-2xl space-y-2 text-left">
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Delivery Address <span className="text-red-500">*</span>
                </label>
                <p className="text-[10px] text-gray-500">Please provide your precise physical address so our couriers can find you.</p>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (e.target.value.trim()) setAddressError(false);
                  }}
                  placeholder="e.g. House 14, Road 5, Sector 3, Uttara, Dhaka, Bangladesh"
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 text-xs transition-all ${
                    addressError 
                      ? "border-red-400 focus:ring-red-500/20" 
                      : "border-emerald-100 focus:border-emerald-500 focus:ring-emerald-500/20"
                  }`}
                />
              </div>

              {/* Confirmation Action */}
              <div className="pt-4 border-t border-emerald-50 text-center">
                <p className="text-[10px] text-gray-400 mb-3">
                  Clicking confirmation submits your order status as <strong>"pending"</strong> to our database. Our admin panel allows instant status auditing.
                </p>
                <button
                  id="confirm-payment-btn"
                  onClick={handleConfirmOrder}
                  disabled={loading}
                  className="w-full md:w-auto md:px-12 py-3 bg-[#2e7d32] hover:bg-[#1b5e20] text-white font-bold text-sm rounded-xl tracking-wide transition-all shadow-lg shadow-[#2e7d32]/20 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2 justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Recording Transaction...</span>
                    </div>
                  ) : (
                    "I Have Transferred Payment via bKash"
                  )}
                </button>
              </div>

            </div>
          ) : (
            // Receipt step (Success view)
            <div className="text-center py-8 space-y-6" id="receipt-step">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              
              <div>
                <h4 className="text-xl font-bold text-emerald-950 tracking-tight">Order Placed Successfully!</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto leading-relaxed">
                  Thank you for dining with Savory Green. Your transaction has been recorded. Please wait while an administrator approves your payment status.
                </p>
              </div>

              {/* High-fidelity receipt details */}
              <div className="bg-white/40 backdrop-blur-xs max-w-md mx-auto border border-white/30 p-5 rounded-2xl text-left font-sans space-y-3 font-medium">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-emerald-50">
                  <span className="font-semibold text-gray-500">Transaction/Order ID</span>
                  <code className="font-mono text-emerald-950 font-bold truncate max-w-[150px]">{receipt.id}</code>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-emerald-50">
                  <span className="font-semibold text-gray-500">Reference Code</span>
                  <span className="font-mono text-amber-800 font-bold text-sm">{receipt.referenceNumber}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-emerald-50">
                  <span className="font-semibold text-gray-500">User Account</span>
                  <span className="text-gray-700 font-mono text-[11px] truncate max-w-[200px]">{receipt.userEmail}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-emerald-50">
                  <span className="font-semibold text-gray-500">Payment Status</span>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-sans font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {receipt.paymentStatus}
                  </span>
                </div>

                <div className="flex flex-col text-xs pb-2 border-b border-emerald-50">
                  <span className="font-semibold text-gray-500 mb-1">Delivery Address</span>
                  <span className="text-gray-800 bg-gray-50 p-2.5 rounded-lg leading-relaxed text-[11px]">{receipt.address}</span>
                </div>
                
                {/* List item details in receipt */}
                <div className="pt-1.5 space-y-1.5">
                  <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Dishes Details</span>
                  {receipt.items.map((item: OrderItem) => (
                    <div key={item.id} className="flex justify-between text-xs font-medium text-gray-700">
                      <span>{item.name} <code className="text-gray-400 font-mono text-[10px]">x{item.quantity}</code></span>
                      <span className="font-mono text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-end border-t border-dashed border-emerald-100 pt-3 text-sm font-bold text-gray-800 mt-2">
                  <span>Total Transferred</span>
                  <span className="font-mono text-emerald-800 text-base font-black">${receipt.totalPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Action */}
              <div className="pt-4">
                <button
                  id="receipt-close-btn"
                  onClick={onClose}
                  className="px-8 py-2.5 bg-[#2e7d32] hover:bg-[#1b5e20] text-white font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5 mx-auto shadow-md"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Go to My Orders</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
