import React from 'react';
import { UtensilsCrossed, Bell, ShoppingBag, Search, Clock, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';

interface NavbarProps {
  currentTab: 'home' | 'menu' | 'track' | 'history' | 'admin';
  onSelectTab: (tab: 'home' | 'menu' | 'track' | 'history' | 'admin') => void;
  onOpenCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, onOpenCart }) => {
  const { totalItems } = useCart();
  const {
    fcmToken,
    permissionStatus,
    fcmState,
    requestPermission,
    isLoading,
    openModal
  } = useNotification();

  const handleNotificationClick = async () => {
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
    <header className="sticky top-0 z-40 bg-[#19130F] border-b border-[#C9A45C]/30 text-[#F7F0E3] shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand / Logo */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => onSelectTab('home')}
            id="brand-logo-btn"
          >
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#C9A45C] to-[#806F5D] p-[2px] flex items-center justify-center shadow-md">
              <div className="w-full h-full rounded-full bg-[#281D16] flex items-center justify-center text-[#E5CB91] group-hover:text-white transition-colors">
                <UtensilsCrossed className="w-5 h-5 text-[#C9A45C]" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-cinzel text-lg sm:text-xl font-bold tracking-wider text-[#E5CB91]">
                  SMART CANTEEN
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest bg-[#C9A45C]/20 border border-[#C9A45C]/40 text-[#E5CB91] rounded">
                  Royal Dining
                </span>
              </div>
              <p className="text-[11px] text-[#806F5D] tracking-wider uppercase font-medium">
                Fresh • Fast • Aristocratic
              </p>
            </div>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {[
              { id: 'home', label: 'Home' },
              { id: 'menu', label: 'Menu' },
              { id: 'track', label: 'Track Order' },
              { id: 'history', label: 'Order History' },
              { id: 'admin', label: 'Admin Portal' }
            ].map((tab) => {
              const active = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-link-${tab.id}`}
                  onClick={() => onSelectTab(tab.id as any)}
                  className={`px-4 py-2 text-xs uppercase font-semibold tracking-wider transition-all duration-200 rounded-md relative ${
                    active
                      ? 'text-[#E5CB91] bg-[#281D16] border border-[#C9A45C]/40 shadow-sm'
                      : 'text-[#F7F0E3]/70 hover:text-[#E5CB91] hover:bg-[#281D16]/50'
                  }`}
                >
                  {tab.label}
                  {active && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[#C9A45C] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Actions: Notification status & Cart */}
          <div className="flex items-center space-x-3">
            
            {/* Notification Permission Indicator Button */}
            <button
              id="enable-notifications-btn"
              data-testid="enable-notifications-btn"
              onClick={handleNotificationClick}
              disabled={isLoading}
              title={
                fcmState === 'enabled'
                  ? 'FCM Push notifications active. Click to view status or test.'
                  : fcmState === 'denied'
                  ? 'Notification permission is blocked. Click to see instructions.'
                  : fcmState === 'unsupported'
                  ? 'Notifications not supported in iframe/browser. Click for options.'
                  : fcmState === 'config_missing'
                  ? 'Firebase Web Push configuration required. Click for guide.'
                  : 'Click to enable real push notifications on this device'
              }
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                isLoading
                  ? 'bg-[#281D16] border-[#C9A45C]/30 text-[#A69784]'
                  : fcmState === 'enabled'
                  ? 'bg-[#536E56]/20 border-[#536E56] text-[#A8C7A9] hover:bg-[#536E56]/30'
                  : fcmState === 'denied'
                  ? 'bg-red-950/40 border-red-700/60 text-red-300 hover:bg-red-900/40'
                  : fcmState === 'unsupported'
                  ? 'bg-amber-950/40 border-amber-700/60 text-amber-300 hover:bg-amber-900/40'
                  : fcmState === 'config_missing'
                  ? 'bg-yellow-950/40 border-yellow-700/60 text-yellow-300 hover:bg-yellow-900/40'
                  : 'bg-[#C9A45C]/15 border-[#C9A45C]/60 text-[#E5CB91] hover:bg-[#C9A45C]/25 shadow-sm'
              }`}
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-[#C9A45C] border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Connecting...</span>
                </>
              ) : fcmState === 'enabled' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Alerts Active</span>
                </>
              ) : fcmState === 'denied' ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  <span className="hidden sm:inline">Alerts Blocked</span>
                </>
              ) : fcmState === 'unsupported' ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Push Unsupported</span>
                </>
              ) : fcmState === 'config_missing' ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="hidden sm:inline">Setup Required</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5 text-[#C9A45C]" />
                  <span className="hidden sm:inline">Enable Notifications</span>
                </>
              )}
            </button>

            {/* Cart Button */}
            <button
              id="cart-drawer-trigger"
              onClick={onOpenCart}
              className="relative flex items-center justify-center p-2.5 rounded-full bg-[#281D16] border border-[#C9A45C]/40 hover:border-[#C9A45C] text-[#E5CB91] hover:text-white transition-all shadow-md active:scale-95"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#C9A45C] text-[#19130F] font-bold text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-md border-2 border-[#19130F]">
                  {totalItems}
                </span>
              )}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-[#281D16] bg-[#19130F]/95 py-2 px-2 overflow-x-auto text-xs">
        {[
          { id: 'home', label: 'Home' },
          { id: 'menu', label: 'Menu' },
          { id: 'track', label: 'Track' },
          { id: 'history', label: 'History' },
          { id: 'admin', label: 'Admin' }
        ].map((tab) => {
          const active = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id as any)}
              className={`px-3 py-1.5 whitespace-nowrap rounded-md font-medium tracking-wider uppercase transition-colors ${
                active ? 'text-[#E5CB91] bg-[#281D16] font-bold' : 'text-[#F7F0E3]/60'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
