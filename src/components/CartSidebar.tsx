import React from "react";
import { ShoppingCart, ArrowRight, Trash2, Plus, Minus } from "lucide-react";
import { FoodItem } from "../types";

interface CartItem {
  item: FoodItem;
  quantity: number;
}

interface CartSidebarProps {
  cartItems: CartItem[];
  onIncrease: (itemId: string) => void;
  onDecrease: (itemId: string) => void;
  onClear: () => void;
  onCheckout: () => void;
  isSignedIn: boolean;
  onOpenAuth: () => void;
}

export default function CartSidebar({
  cartItems,
  onIncrease,
  onDecrease,
  onClear,
  onCheckout,
  isSignedIn,
  onOpenAuth,
}: CartSidebarProps) {
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.item.price * item.quantity,
    0
  );

  return (
    <div 
      className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-[32px] p-6 shadow-2xl sticky top-24 flex flex-col h-[calc(100vh-140px)]"
      id="cart-sidebar"
    >
      <div className="flex justify-between items-center pb-4 border-b border-emerald-50 mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <span className="font-sans font-bold text-gray-800 text-base">
            Your Order Basket
          </span>
        </div>
        {cartItems.length > 0 && (
          <button
            id="clear-cart-btn"
            onClick={onClear}
            className="text-[11px] font-sans font-semibold text-rose-500 hover:text-rose-700 flex items-center gap-1 hover:underline"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <div className="w-16 h-16 bg-[#e8f5e9] rounded-full flex items-center justify-center text-[#4caf50] mb-4 border border-dashed border-white">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <h4 className="font-sans font-bold text-gray-700 text-sm">
            Basket is Empty
          </h4>
          <p className="text-gray-400 text-xs mt-1 leading-relaxed max-w-[200px]">
            Explore our delicious menu card to add fresh and healthy dishes to your order!
          </p>
        </div>
      ) : (
        <>
          {/* List of Cart Items */}
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1" id="cart-items-list">
            {cartItems.map(({ item, quantity }) => (
              <div 
                key={item.id} 
                className="flex justify-between items-center gap-3 bg-emerald-50/30 p-3 rounded-xl border border-emerald-50/50 hover:bg-emerald-50/50 transition-colors"
                id={`cart-item-${item.id}`}
              >
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-gray-800 block truncate">
                    {item.name}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400 mt-0.5 block">
                    ${item.price.toFixed(2)} x {quantity}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2 shrink-0">
                  <div className="flex items-center space-x-1 bg-white border border-emerald-100 rounded-lg p-0.5">
                    <button
                      id={`cart-decrease-${item.id}`}
                      onClick={() => onDecrease(item.id)}
                      className="w-6 h-6 rounded-md hover:bg-emerald-50 flex items-center justify-center text-emerald-800 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono text-xs font-bold px-1 text-emerald-950">
                      {quantity}
                    </span>
                    <button
                      id={`cart-increase-${item.id}`}
                      onClick={() => onIncrease(item.id)}
                      className="w-6 h-6 rounded-md hover:bg-emerald-50 flex items-center justify-center text-emerald-800 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="font-mono text-xs font-bold text-emerald-900 w-14 text-right">
                    ${(item.price * quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Totals */}
          <div className="border-t border-emerald-100/50 pt-4 mt-4 space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal</span>
              <span className="font-mono text-gray-700 font-semibold">${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Eco Packaging</span>
              <span className="font-mono text-[#2e7d32] font-bold">Free</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-gray-800 pt-1.5 border-t border-dashed border-emerald-100">
              <span>Total</span>
              <span className="font-mono text-xl font-black text-[#2e7d32]">${totalPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Info Info Box */}
          <div className="bg-[#e8f5e9]/50 border border-[#4caf50]/20 rounded-2xl p-4 mt-4">
            <p className="text-[10px] uppercase tracking-wider text-[#2e7d32] font-bold mb-1">Payment Method</p>
            <p className="text-xs font-medium text-gray-600 mb-1">bKash: <span class="font-bold text-gray-800">01721938899</span></p>
            <p className="text-[10px] text-[#4caf50]">Reference will be generated after checkout.</p>
          </div>

          {/* Action Trigger */}
          <div className="mt-4">
            {isSignedIn ? (
              <button
                id="checkout-btn"
                onClick={onCheckout}
                className="w-full py-3 bg-[#2e7d32] hover:bg-[#235d25] text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-1.5 shadow-xl shadow-[#2e7d32]/30 active:scale-95 transition-all group"
              >
                <span>Checkout &amp; Order Now</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            ) : (
              <button
                id="cart-signin-btn"
                onClick={onOpenAuth}
                className="w-full py-3 bg-[#e8f5e9] text-[#2e7d32] hover:bg-[#c8e6c9] hover:text-[#1b5e20] font-bold text-xs rounded-xl flex items-center justify-center space-x-1 transition-all"
              >
                <span>Log in to Order</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
