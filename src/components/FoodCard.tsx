import React from 'react';
import { Plus, Check, Flame } from 'lucide-react';
import { MenuItem } from '../types';
import { useCart } from '../context/CartContext';

interface FoodCardProps {
  item: MenuItem;
}

export const FoodCard: React.FC<FoodCardProps> = ({ item }) => {
  const { addToCart, cart } = useCart();
  const existingCartItem = cart.find((ci) => ci.item.id === item.id);

  return (
    <div
      id={`food-card-${item.id}`}
      className="group bg-[#FFFDF8] rounded-xl border border-[#DDCFBA] hover:border-[#C9A45C] transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5 overflow-hidden flex flex-col justify-between"
    >
      <div>
        {/* Card Image Banner */}
        <div className="relative aspect-[16/10] overflow-hidden bg-[#281D16]/10">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

          {/* Badge */}
          {item.badge && (
            <span className="absolute top-3 left-3 bg-[#C9A45C] text-[#19130F] text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded shadow-md border border-[#E5CB91]/60">
              {item.badge}
            </span>
          )}

          {/* Category */}
          <span className="absolute bottom-2.5 left-3 text-[11px] font-medium tracking-wide uppercase text-[#F7F0E3]/90 bg-[#19130F]/75 px-2 py-0.5 rounded backdrop-blur-xs">
            {item.category}
          </span>

          {/* Calories if available */}
          {item.calories && (
            <div className="absolute bottom-2.5 right-3 flex items-center space-x-1 text-[11px] text-[#E5CB91] bg-[#19130F]/80 px-2 py-0.5 rounded backdrop-blur-xs">
              <Flame className="w-3 h-3 text-[#C9A45C]" />
              <span>{item.calories}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-royal text-lg sm:text-xl font-bold text-[#332920] group-hover:text-[#281D16] leading-tight">
              {item.name}
            </h3>
            <span className="text-base sm:text-lg font-bold text-[#C9A45C] whitespace-nowrap font-cinzel">
              ₹{item.price}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[#806F5D] line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>
      </div>

      {/* Action footer */}
      <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0">
        <button
          id={`add-to-cart-btn-${item.id}`}
          onClick={() => addToCart(item)}
          className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs tracking-wider uppercase transition-all duration-200 flex items-center justify-center space-x-2 border shadow-sm active:scale-[0.98] ${
            existingCartItem
              ? 'bg-[#536E56] hover:bg-[#435946] text-white border-[#536E56]'
              : 'bg-[#281D16] hover:bg-[#19130F] text-[#E5CB91] hover:text-white border-[#C9A45C]/40 hover:border-[#C9A45C]'
          }`}
        >
          {existingCartItem ? (
            <>
              <Check className="w-4 h-4" />
              <span>Added ({existingCartItem.quantity})</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 text-[#C9A45C]" />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
