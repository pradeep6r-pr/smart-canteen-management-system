import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { MenuView } from './components/MenuView';
import { OrderTrackingView } from './components/OrderTrackingView';
import { OrderHistoryView } from './components/OrderHistoryView';
import { AdminDashboard } from './components/AdminDashboard';
import { CartDrawer } from './components/CartDrawer';
import { NotificationToast } from './components/NotificationToast';
import { NotificationModal } from './components/NotificationModal';
import { Footer } from './components/Footer';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import { INITIAL_MENU_ITEMS } from './data/menu';
import { Order, FoodCategory } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'menu' | 'track' | 'history' | 'admin'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [trackedOrderId, setTrackedOrderId] = useState<string>('');

  // Check URL parameters on mount (e.g. if opened via notification click /?track=ORD-xxx)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const trackParam = urlParams.get('track');
      if (trackParam) {
        setTrackedOrderId(trackParam);
        setCurrentTab('track');
      }

      // Listen to postMessage from service worker notification click
      const handleWorkerMessage = (event: MessageEvent) => {
        if (event.data?.type === 'NAVIGATE_ORDER' && event.data?.orderId) {
          setTrackedOrderId(event.data.orderId);
          setCurrentTab('track');
        }
      };

      if (navigator.serviceWorker) {
        navigator.serviceWorker.addEventListener('message', handleWorkerMessage);
      }

      return () => {
        if (navigator.serviceWorker) {
          navigator.serviceWorker.removeEventListener('message', handleWorkerMessage);
        }
      };
    }
  }, []);

  const handleOrderCreated = (order: Order) => {
    setTrackedOrderId(order.orderId);
    setCurrentTab('track');
  };

  const handleTrackFromHistory = (orderId: string) => {
    setTrackedOrderId(orderId);
    setCurrentTab('track');
  };

  return (
    <NotificationProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col bg-[#F7F0E3] text-[#332920] selection:bg-[#C9A45C] selection:text-[#19130F]">
          
          {/* Main Top Navigation */}
          <Navbar
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            onOpenCart={() => setIsCartOpen(true)}
          />

          {/* Body Content depending on currentTab */}
          <main className="flex-1">
            {currentTab === 'home' && (
              <HomeView
                menuItems={INITIAL_MENU_ITEMS}
                onNavigateToMenu={() => setCurrentTab('menu')}
                onNavigateToTrack={() => setCurrentTab('track')}
                onSelectCategory={(cat: FoodCategory) => {
                  setSelectedCategory(cat);
                  setCurrentTab('menu');
                }}
              />
            )}

            {currentTab === 'menu' && (
              <MenuView
                menuItems={INITIAL_MENU_ITEMS}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            )}

            {currentTab === 'track' && (
              <OrderTrackingView initialOrderId={trackedOrderId} />
            )}

            {currentTab === 'history' && (
              <OrderHistoryView onTrackOrder={handleTrackFromHistory} />
            )}

            {currentTab === 'admin' && (
              <AdminDashboard />
            )}
          </main>

          {/* Slide-over Cart Drawer */}
          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            onOrderCreated={handleOrderCreated}
          />

          {/* FCM Push Notification Configuration & Status Modal */}
          <NotificationModal />

          {/* Floating Foreground Push Notification Banner */}
          <NotificationToast
            onTrackOrder={(orderId) => {
              setTrackedOrderId(orderId);
              setCurrentTab('track');
            }}
          />

          {/* Footer */}
          <Footer />

        </div>
      </CartProvider>
    </NotificationProvider>
  );
}
