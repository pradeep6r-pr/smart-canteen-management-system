import React, { useState } from 'react';
import { Search, SlidersHorizontal, Utensils } from 'lucide-react';
import { FoodCategory, MenuItem } from '../types';
import { FoodCard } from './FoodCard';

interface MenuViewProps {
  menuItems: MenuItem[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

export const MenuView: React.FC<MenuViewProps> = ({
  menuItems,
  selectedCategory,
  onSelectCategory
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const categories: ('ALL' | FoodCategory)[] = ['ALL', 'Meals', 'Fast Food', 'Snacks', 'Beverages'];

  const filteredItems = menuItems.filter((item) => {
    const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Header */}
      <div className="text-center mb-8">
        <span className="font-cinzel text-xs uppercase tracking-widest text-[#C9A45C] font-semibold">
          Gastronomic Offerings
        </span>
        <h1 className="font-royal text-3xl sm:text-4xl font-bold text-[#332920] mt-1 mb-2">
          The Royal Canteen Menu
        </h1>
        <p className="text-sm text-[#806F5D] max-w-md mx-auto">
          Freshly cooked delicacies prepared on-demand with premium ingredients and rapid kitchen dispatch.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#FFFDF8] border border-[#DDCFBA] rounded-2xl p-4 sm:p-5 shadow-sm mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          
          {/* Search Input */}
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#806F5D]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search royal dishes, thalis, burgers, shakes..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#F7F0E3]/60 border border-[#DDCFBA] focus:border-[#C9A45C] rounded-xl text-xs text-[#332920] focus:outline-none"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => onSelectCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold tracking-wider uppercase whitespace-nowrap transition-all duration-200 border ${
                    active
                      ? 'bg-[#281D16] text-[#E5CB91] border-[#C9A45C] shadow-xs'
                      : 'bg-[#F7F0E3] text-[#806F5D] hover:text-[#332920] border-[#DDCFBA]'
                  }`}
                >
                  {cat === 'ALL' ? 'All Dishes' : cat}
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-[#FFFDF8] border border-[#DDCFBA] rounded-2xl p-16 text-center text-[#806F5D]">
          <Utensils className="w-10 h-10 mx-auto text-[#DDCFBA] mb-2" />
          <h4 className="font-royal text-lg font-bold text-[#332920]">No Delicacies Found</h4>
          <p className="text-xs max-w-xs mx-auto mt-1">
            Try adjusting your search terms or selecting a different culinary category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <FoodCard key={item.id} item={item} />
          ))}
        </div>
      )}

    </div>
  );
};
