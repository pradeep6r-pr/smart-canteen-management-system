import React, { useState } from 'react';
import { Sparkles, Utensils, ArrowRight, ShieldCheck, Clock, Award, Bell } from 'lucide-react';
import { FoodCategory, MenuItem } from '../types';
import { FoodCard } from './FoodCard';
import { useNotification } from '../context/NotificationContext';

interface HomeViewProps {
  menuItems: MenuItem[];
  onNavigateToMenu: () => void;
  onNavigateToTrack: () => void;
  onSelectCategory: (cat: FoodCategory) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  menuItems,
  onNavigateToMenu,
  onNavigateToTrack,
  onSelectCategory
}) => {
  const { permissionStatus, fcmState, requestPermission, openModal, isLoading } = useNotification();
  const featuredMeals = menuItems.filter((i) => i.badge).slice(0, 4);

  const handleEnableClick = async () => {
    if (fcmState === 'enabled') {
      openModal();
    } else {
      const token = await requestPermission();
      if (!token) {
        openModal();
      }
    }
  };

  return (
    <div>
      {/* Royal Hero Section */}
      <section className="relative bg-[#19130F] text-[#F7F0E3] pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-[#C9A45C]/30 shadow-2xl">
        {/* Subtle decorative gold circle lines */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full border border-[#C9A45C]/10 pointer-events-none" />
        <div className="absolute -bottom-48 -right-48 w-[32rem] h-[32rem] rounded-full border border-[#C9A45C]/15 pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          
          {/* Royal Insignia / Eyebrow */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#281D16] border border-[#C9A45C]/40 text-[#E5CB91] text-xs font-semibold uppercase tracking-widest mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#C9A45C]" />
            <span>Smart Canteen • Imperial Dining Experience</span>
          </div>

          <h1 className="font-royal text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-[1.15]">
            Artisanal Meals, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E5CB91] via-[#C9A45C] to-[#E5CB91]">
              Zero Waiting Time
            </span>
          </h1>

          <p className="mt-5 text-sm sm:text-base text-[#F7F0E3]/75 max-w-2xl mx-auto font-normal leading-relaxed">
            Order exquisite campus lunches, artisanal snacks, and fresh coolers from your smartphone. 
            Receive live FCM mobile notifications the moment your meal is ready for collection.
          </p>

          {/* Call to Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="hero-explore-menu-btn"
              onClick={onNavigateToMenu}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#C9A45C] to-[#E5CB91] hover:from-[#b9944c] hover:to-[#d5bb81] text-[#19130F] font-bold text-xs uppercase tracking-widest transition-all duration-200 shadow-xl flex items-center justify-center space-x-2 active:scale-95"
            >
              <span>Explore Royal Menu</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="hero-track-order-btn"
              onClick={onNavigateToTrack}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#281D16] hover:bg-[#332920] text-[#E5CB91] hover:text-white border border-[#C9A45C]/40 rounded-xl text-xs uppercase font-bold tracking-widest transition-all duration-200 shadow-md flex items-center justify-center space-x-2 active:scale-95"
            >
              <Clock className="w-4 h-4 text-[#C9A45C]" />
              <span>Track Active Token</span>
            </button>
          </div>

          {/* FCM Push Notification Opt-in / Status Prompt Banner */}
          <div className="mt-10 max-w-xl mx-auto bg-[#281D16]/90 border border-[#C9A45C]/50 rounded-xl p-3.5 flex items-center justify-between text-left text-xs gap-3 shadow-md">
            <div className="flex items-center space-x-2.5">
              <div className={`p-1.5 rounded-lg ${fcmState === 'enabled' ? 'bg-emerald-950 text-emerald-400' : 'bg-[#19130F] text-[#C9A45C]'}`}>
                <Bell className="w-4 h-4 shrink-0" />
              </div>
              <span className="text-[#F7F0E3]/85 text-[11px] sm:text-xs">
                {fcmState === 'enabled'
                  ? 'Device push notifications active: You will receive real-time alerts when meals are ready.'
                  : fcmState === 'denied'
                  ? 'Notifications blocked by browser. Click to see instructions to unblock.'
                  : fcmState === 'config_missing'
                  ? 'FCM setup required: Click to view Web Push certificate setup guide.'
                  : 'Enable device push alerts to get notified when your order is cooked.'}
              </span>
            </div>
            <button
              id="home-enable-notifications-btn"
              onClick={handleEnableClick}
              disabled={isLoading}
              className={`px-3.5 py-1.5 font-bold text-[11px] uppercase tracking-wider rounded-lg shrink-0 transition-colors ${
                fcmState === 'enabled'
                  ? 'bg-emerald-800 hover:bg-emerald-700 text-white'
                  : 'bg-[#C9A45C] hover:bg-[#b9944c] text-[#19130F]'
              }`}
            >
              {isLoading
                ? 'Connecting...'
                : fcmState === 'enabled'
                ? 'Manage Alerts'
                : 'Enable Notifications'}
            </button>
          </div>

          {/* Value Highlights */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-[#C9A45C]/20 text-left">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-[#281D16] border border-[#C9A45C]/30 text-[#C9A45C]">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-royal text-sm font-bold text-[#E5CB91]">Prepared Fresh</h4>
                <p className="text-xs text-[#806F5D] mt-0.5">Authentic culinary standards with hygiene certification.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-[#281D16] border border-[#C9A45C]/30 text-[#C9A45C]">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-royal text-sm font-bold text-[#E5CB91]">Real FCM Push Notifications</h4>
                <p className="text-xs text-[#806F5D] mt-0.5">Direct device notifications when order status changes to Ready.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-[#281D16] border border-[#C9A45C]/30 text-[#C9A45C]">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-royal text-sm font-bold text-[#E5CB91]">Token Fulfillment</h4>
                <p className="text-xs text-[#806F5D] mt-0.5">Unique tokens eliminate queuing and counter overcrowding.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Categories Showcase */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <span className="font-cinzel text-xs uppercase tracking-widest text-[#C9A45C] font-semibold">
            Signature Selections
          </span>
          <h2 className="font-royal text-2xl sm:text-3xl font-bold text-[#332920] mt-1">
            Food Categories
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {(['Meals', 'Fast Food', 'Snacks', 'Beverages'] as FoodCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                onSelectCategory(cat);
                onNavigateToMenu();
              }}
              className="group bg-[#FFFDF8] border border-[#DDCFBA] hover:border-[#C9A45C] rounded-2xl p-5 text-center shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#F7F0E3] flex items-center justify-center group-hover:bg-[#281D16] transition-colors border border-[#DDCFBA]">
                <Utensils className="w-6 h-6 text-[#C9A45C] group-hover:text-[#E5CB91] transition-colors" />
              </div>
              <h3 className="font-royal font-bold text-base text-[#332920] group-hover:text-[#281D16]">
                {cat}
              </h3>
              <p className="text-[11px] text-[#806F5D] mt-1 group-hover:text-[#332920]">
                Explore dishes →
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Chef's Curated Specials */}
      <section className="py-8 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
          <div>
            <span className="font-cinzel text-xs uppercase tracking-widest text-[#C9A45C] font-semibold">
              Handcrafted Selections
            </span>
            <h2 className="font-royal text-2xl sm:text-3xl font-bold text-[#332920] mt-1">
              Popular & Chef Specials
            </h2>
          </div>
          <button
            onClick={onNavigateToMenu}
            className="mt-3 sm:mt-0 text-xs font-bold uppercase tracking-wider text-[#C9A45C] hover:text-[#806F5D] flex items-center space-x-1"
          >
            <span>View Complete Menu</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredMeals.map((item) => (
            <FoodCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
};
