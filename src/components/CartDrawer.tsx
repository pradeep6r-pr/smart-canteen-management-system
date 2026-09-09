import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Phone, User, Mail, Sparkles, CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { Order } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (order: Order) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onOrderCreated }) => {
  const { cart, removeFromCart, updateQuantity, clearCart, totalAmount, totalItems } = useCart();
  const { fcmToken, requestPermission, permissionStatus, fcmState, openModal } = useNotification();

  const [customerName, setCustomerName] = useState(() => {
    return localStorage.getItem('smart_canteen_customer_name') || '';
  });
  const [mobileNumber, setMobileNumber] = useState(() => {
    return localStorage.getItem('smart_canteen_customer_mobile') || '';
  });
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('smart_canteen_customer_email') || '';
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate 10-digit mobile
    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setError('Please provide a valid 10-digit mobile number (e.g. 9876543210).');
      return;
    }

    if (!customerName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (cart.length === 0) {
      setError('Your royal cart is empty.');
      return;
    }

    setIsSubmitting(true);

    // Ensure notification permission is requested if not granted yet
    let activeToken = fcmToken;
    if (permissionStatus !== 'granted') {
      try {
        const token = await requestPermission(cleanMobile);
        if (token) activeToken = token;
      } catch (e) {
        console.warn('FCM request during checkout skipped:', e);
      }
    }

    // Persist details in localStorage for repeat convenience
    localStorage.setItem('smart_canteen_customer_name', customerName.trim());
    localStorage.setItem('smart_canteen_customer_mobile', cleanMobile);
    if (email) localStorage.setItem('smart_canteen_customer_email', email.trim());

    try {
      const orderPayload = {
        customerName: customerName.trim(),
        mobileNumber: cleanMobile,
        email: email ? email.trim() : undefined,
        items: cart.map((ci) => ({
          id: ci.item.id,
          name: ci.item.name,
          category: ci.item.category,
          price: ci.item.price,
          quantity: ci.quantity,
          subtotal: ci.item.price * ci.quantity
        })),
        totalAmount,
        deviceToken: activeToken || undefined
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order.');
      }

      // Save customer order ID history in local storage
      try {
        const savedIds = JSON.parse(localStorage.getItem('smart_canteen_my_orders') || '[]');
        if (!savedIds.includes(data.order.orderId)) {
          savedIds.unshift(data.order.orderId);
          localStorage.setItem('smart_canteen_my_orders', JSON.stringify(savedIds));
        }
      } catch (storeErr) {
        console.warn('LocalStorage save warning:', storeErr);
      }

      clearCart();
      setIsSubmitting(false);
      onOrderCreated(data.order);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'Network error while placing order.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FFFDF8] border-l border-[#DDCFBA] shadow-2xl flex flex-col">
          
          {/* Drawer Header */}
          <div className="p-5 bg-[#19130F] text-[#F7F0E3] flex items-center justify-between border-b border-[#C9A45C]/30">
            <div className="flex items-center space-x-2.5">
              <span className="font-cinzel text-lg font-bold text-[#E5CB91]">Royal Cart</span>
              <span className="text-xs bg-[#C9A45C]/20 border border-[#C9A45C]/40 text-[#E5CB91] px-2 py-0.5 rounded-full font-bold">
                {totalItems} items
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-[#F7F0E3]/70 hover:text-white hover:bg-[#281D16]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {cart.length === 0 ? (
              <div className="py-16 text-center text-[#806F5D]">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F7F0E3] flex items-center justify-center border border-[#DDCFBA]">
                  <Sparkles className="w-8 h-8 text-[#C9A45C]" />
                </div>
                <h4 className="font-royal text-lg font-bold text-[#332920] mb-1">Your cart is empty</h4>
                <p className="text-xs max-w-xs mx-auto">
                  Select gourmet meals, artisanal snacks, or refreshing beverages from our royal menu.
                </p>
              </div>
            ) : (
              <>
                {/* Cart Items List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#806F5D]">
                    Selected Items ({totalItems})
                  </h4>
                  {cart.map((ci) => (
                    <div
                      key={ci.item.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-[#DDCFBA] bg-white shadow-xs"
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <h5 className="font-royal font-bold text-sm text-[#332920] truncate">
                          {ci.item.name}
                        </h5>
                        <p className="text-xs text-[#C9A45C] font-semibold">
                          ₹{ci.item.price} each
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2 bg-[#F7F0E3] border border-[#DDCFBA] rounded-md px-1.5 py-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(ci.item.id, ci.quantity - 1)}
                          className="text-[#806F5D] hover:text-[#332920] p-1"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-[#332920] w-4 text-center">
                          {ci.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(ci.item.id, ci.quantity + 1)}
                          className="text-[#806F5D] hover:text-[#332920] p-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Subtotal & Delete */}
                      <div className="text-right pl-3">
                        <span className="block font-cinzel font-bold text-sm text-[#332920]">
                          ₹{ci.item.price * ci.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(ci.item.id)}
                          className="text-red-500/70 hover:text-red-700 text-xs p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Customer Details Form */}
                <form id="checkout-form" onSubmit={handleCheckout} className="space-y-4 pt-2 border-t border-[#DDCFBA]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#806F5D]">
                    Customer Details (For Token & Pickup)
                  </h4>

                  <div>
                    <label className="block text-xs font-semibold text-[#332920] mb-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#C9A45C]" />
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full text-sm px-3 py-2 rounded-lg border border-[#DDCFBA] focus:outline-none focus:border-[#C9A45C] bg-white text-[#332920]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#332920] mb-1 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#C9A45C]" />
                      10-Digit Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-[#806F5D] font-bold">+91</span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="9876543210"
                        className="w-full text-sm pl-11 pr-3 py-2 rounded-lg border border-[#DDCFBA] focus:outline-none focus:border-[#C9A45C] bg-white text-[#332920]"
                      />
                    </div>
                    <p className="text-[11px] text-[#806F5D] mt-1">
                      Required for live order notifications & token pickup verification.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#332920] mb-1 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#806F5D]" />
                      Optional Email Receipt
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@university.edu"
                      className="w-full text-sm px-3 py-2 rounded-lg border border-[#DDCFBA] focus:outline-none focus:border-[#C9A45C] bg-white text-[#332920]"
                    />
                  </div>

                  {/* Push Notification Status Alert in Form */}
                  <div className="p-3 rounded-lg bg-[#F7F0E3] border border-[#DDCFBA] text-xs text-[#332920] flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5">
                      <ShieldCheck className={`w-4 h-4 shrink-0 mt-0.5 ${fcmState === 'enabled' ? 'text-[#536E56]' : 'text-[#C9A45C]'}`} />
                      <div>
                        <p className="font-semibold text-[#281D16]">Instant Mobile Push Alerts</p>
                        <p className="text-[#806F5D] text-[11px] mt-0.5">
                          {fcmState === 'enabled'
                            ? '✅ Device registered for live FCM background alerts.'
                            : '🔔 Instant notifications will ping you when your food is ready for pickup.'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={openModal}
                      className="text-[11px] font-bold text-[#C9A45C] hover:underline shrink-0"
                    >
                      {fcmState === 'enabled' ? 'Active' : 'Settings'}
                    </button>
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                      {error}
                    </div>
                  )}

                  {/* Summary */}
                  <div className="bg-[#19130F] text-[#F7F0E3] p-4 rounded-xl space-y-2 border border-[#C9A45C]/30 mt-4">
                    <div className="flex justify-between text-xs text-[#F7F0E3]/70">
                      <span>Subtotal ({totalItems} items)</span>
                      <span>₹{totalAmount}</span>
                    </div>
                    <div className="flex justify-between text-xs text-[#F7F0E3]/70">
                      <span>Canteen Tax & Packaging</span>
                      <span className="text-[#536E56] font-semibold">FREE (Royal Privilege)</span>
                    </div>
                    <div className="pt-2 border-t border-[#C9A45C]/30 flex justify-between items-center">
                      <span className="font-cinzel text-sm font-bold text-[#E5CB91]">Total Payable</span>
                      <span className="font-cinzel text-xl font-bold text-[#E5CB91]">₹{totalAmount}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || cart.length === 0}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#C9A45C] to-[#E5CB91] hover:from-[#b9944c] hover:to-[#d5bb81] text-[#19130F] font-bold text-sm tracking-wider uppercase transition-all duration-200 shadow-lg flex items-center justify-center space-x-2 active:scale-[0.99] disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Placing Royal Order...</span>
                    ) : (
                      <>
                        <span>Confirm & Place Order</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
