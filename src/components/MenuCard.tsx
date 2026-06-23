import React from "react";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { FoodItem } from "../types";

interface MenuCardProps {
  key?: string;
  item: FoodItem;
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  onAddToCart: () => void;
}

export default function MenuCard({
  item,
  quantity,
  onIncrease,
  onDecrease,
  onAddToCart,
}: MenuCardProps) {
  const { name, price, imageUrl, description, category, isAvailable } = item;

  return (
    <div 
      className={`bg-white/60 backdrop-blur-lg border transition-all duration-300 flex flex-col h-full overflow-hidden hover:bg-white/85 hover:scale-[1.01] ${
        isAvailable 
          ? "border-white/60 shadow-md hover:shadow-xl" 
          : "border-gray-100 opacity-70"
      }`}
      id={`menu-card-${item.id}`}
    >
      {/* Image and Category badge */}
      <div className="relative aspect-video w-full overflow-hidden bg-gray-50">
        <img
          src={imageUrl || "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=600"}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=600";
          }}
        />
        {/* Category tag */}
        <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/40">
          <span className="text-[10px] font-sans font-bold text-[#2e7d32] tracking-wider uppercase">
            {category}
          </span>
        </div>

        {/* Availability status */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-rose-600 text-white font-sans font-bold text-xs px-3 py-1.5 rounded-full uppercase tracking-widest shadow-md">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Food Details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start gap-2 mb-1.5">
            <h3 className="font-sans font-bold text-gray-800 text-base tracking-tight line-clamp-1">
              {name}
            </h3>
            <span className="font-mono text-emerald-700 font-bold text-lg shrink-0">
              ${price.toFixed(2)}
            </span>
          </div>
          <p className="text-gray-500 text-xs leading-relaxed line-clamp-3 mb-4">
            {description}
          </p>
        </div>

        {/* Cart controls or Disabled button */}
        <div className="mt-auto border-t border-emerald-50/50 pt-4" id={`cart-controls-${item.id}`}>
          {isAvailable ? (
            quantity > 0 ? (
              <div className="flex items-center justify-between bg-emerald-500/10 backdrop-blur-xs rounded-xl p-1 border border-white/40">
                <button
                  id={`btn-decrease-${item.id}`}
                  onClick={onDecrease}
                  className="w-8 h-8 rounded-lg bg-white/80 backdrop-blur-xs flex items-center justify-center text-[#2e7d32] hover:bg-white transition-colors shadow-xs"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono font-bold text-sm text-[#2e7d32]">
                  {quantity}
                </span>
                <button
                  id={`btn-increase-${item.id}`}
                  onClick={onIncrease}
                  className="w-8 h-8 rounded-lg bg-white/80 backdrop-blur-xs flex items-center justify-center text-[#2e7d32] hover:bg-white transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id={`btn-add-${item.id}`}
                onClick={onAddToCart}
                className="w-full py-2.5 bg-[#4caf50] hover:bg-[#43a047] text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-md shadow-[#4caf50]/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Add to Cart</span>
              </button>
            )
          ) : (
            <button
              disabled
              className="w-full py-2.5 bg-gray-100 text-gray-400 font-bold text-xs rounded-xl cursor-not-allowed"
            >
              Unavailable
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
