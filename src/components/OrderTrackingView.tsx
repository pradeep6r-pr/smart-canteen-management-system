import React, { useState, useEffect } from 'react';
import { Search, Clock, CheckCircle2, AlertTriangle, ChefHat, Sparkles, Bell, RefreshCw, Phone, Calendar, ArrowRight } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { useNotification } from '../context/NotificationContext';

interface OrderTrackingViewProps {
  initialOrderId?: string;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({ initialOrderId }) => {
  const [searchId, setSearchId] = useState(initialOrderId || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const { fcmToken, permissionStatus, fcmState, requestPermission, openModal, isLoading } = useNotification();

  const handleTrackingEnable = async () => {
    if (fcmState === 'enabled') {
      openModal();
    } else {
      const token = await requestPermission(order?.mobileNumber, order?.customerId);
      if (!token) {
        openModal();
      }
    }
  };

  const fetchOrder = async (orderIdToFetch: string, silent = false) => {
    if (!orderIdToFetch.trim()) return;
    if (!silent) setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderIdToFetch.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Order not found. Please verify your Order ID.');
      }
      setOrder(data.order);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err: any) {
      if (!silent) {
        setError(err?.message || 'Error tracking order.');
        setOrder(null);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderId) {
      setSearchId(initialOrderId);
      fetchOrder(initialOrderId);
    } else {
      // Look for latest order stored in local storage
      try {
        const saved = JSON.parse(localStorage.getItem('smart_canteen_my_orders') || '[]');
        if (saved.length > 0) {
          setSearchId(saved[0]);
          fetchOrder(saved[0]);
        }
      } catch (e) {}
    }
  }, [initialOrderId]);

  // Automatic live refresh polling every 4 seconds without requiring the customer to manually refresh
  useEffect(() => {
    if (!order?.orderId) return;
    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') return;

    const interval = setInterval(() => {
      fetchOrder(order.orderId, true);
    }, 4000);

    return () => clearInterval(interval);
  }, [order?.orderId, order?.status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(searchId);
  };

  // Timeline Step index mapping
  const timelineStages: { status: OrderStatus; stepNumber: number; title: string; desc: string }[] = [
    { status: 'PENDING', stepNumber: 1, title: 'Order Placed', desc: 'Received & queued in kitchen' },
    { status: 'PREPARING', stepNumber: 2, title: 'Preparing', desc: 'Crafted fresh with royal finesse' },
    { status: 'READY', stepNumber: 3, title: 'Ready for Pickup', desc: 'Collect at the royal counter' },
    { status: 'COMPLETED', stepNumber: 4, title: 'Completed', desc: 'Order fulfilled & enjoyed' }
  ];

  const getStageIndex = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'PREPARING':
        return 1;
      case 'READY':
        return 2;
      case 'COMPLETED':
        return 3;
      default:
        return -1;
    }
  };

  const currentStageIdx = order ? getStageIndex(order.status) : -1;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      
      {/* Title */}
      <div className="text-center mb-8">
        <span className="font-cinzel text-xs uppercase tracking-widest text-[#C9A45C] font-semibold">
          Live Order Status
        </span>
        <h1 className="font-royal text-3xl sm:text-4xl font-bold text-[#332920] mt-1 mb-2">
          Track Your Royal Feast
        </h1>
        <p className="text-sm text-[#806F5D] max-w-md mx-auto">
          Enter your Order ID to monitor kitchen preparation and collection updates in real-time.
        </p>
      </div>

      {/* Search Input Card */}
      <div className="bg-[#FFFDF8] border border-[#DDCFBA] rounded-2xl p-4 sm:p-6 shadow-md mb-8">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-[#806F5D]" />
            <input
              type="text"
              required
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter Order ID (e.g. ORD-123456-789)"
              className="w-full pl-11 pr-4 py-3 bg-[#F7F0E3]/60 border border-[#DDCFBA] focus:border-[#C9A45C] rounded-xl text-sm text-[#332920] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[#281D16] hover:bg-[#19130F] text-[#E5CB91] hover:text-white rounded-xl text-xs uppercase font-bold tracking-wider transition-all duration-200 border border-[#C9A45C]/40 shadow-sm flex items-center justify-center space-x-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin text-[#C9A45C]" /> : <Search className="w-4 h-4" />}
            <span>Track Order</span>
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Tracked Order Details */}
      {order && (
        <div className="space-y-6">
          
          {/* Main Order Status Header Card */}
          <div className="bg-[#19130F] text-[#F7F0E3] rounded-2xl p-6 sm:p-8 border border-[#C9A45C]/40 shadow-xl relative overflow-hidden">
            {/* Subtle background ornamentation */}
            <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-[#C9A45C]/5 pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#C9A45C]/20">
              <div>
                <div className="flex items-center space-x-2 text-xs text-[#E5CB91]">
                  <span className="font-semibold uppercase tracking-wider">Order Reference:</span>
                  <span className="font-mono bg-[#281D16] px-2 py-0.5 rounded border border-[#C9A45C]/30 text-white">
                    {order.orderId}
                  </span>
                </div>
                <div className="flex items-center space-x-3 mt-2">
                  <span className="font-cinzel text-xs text-[#F7F0E3]/70 uppercase tracking-widest">
                    Token Number
                  </span>
                  <span className="font-cinzel text-2xl sm:text-3xl font-extrabold text-[#C9A45C] bg-[#281D16] px-4 py-1 rounded-xl border border-[#C9A45C]/50 shadow-inner">
                    {order.tokenNumber}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex flex-col sm:items-end">
                <span className="text-xs text-[#F7F0E3]/60 mb-1">Current Kitchen Status</span>
                <span
                  className={`inline-flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border ${
                    order.status === 'READY'
                      ? 'bg-[#536E56] border-[#A8C7A9] text-white animate-pulse'
                      : order.status === 'PREPARING'
                      ? 'bg-[#C9A45C] border-[#E5CB91] text-[#19130F]'
                      : order.status === 'COMPLETED'
                      ? 'bg-neutral-800 border-neutral-600 text-neutral-300'
                      : order.status === 'CANCELLED'
                      ? 'bg-red-900/60 border-red-700 text-red-200'
                      : 'bg-[#281D16] border-[#C9A45C]/40 text-[#E5CB91]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current" />
                  <span>{order.status}</span>
                </span>
                {lastRefreshed && (
                  <span className="text-[10px] text-[#806F5D] mt-1.5 flex items-center gap-1">
                    <RefreshCw className="w-2.5 h-2.5" /> Auto-syncing: {lastRefreshed}
                  </span>
                )}
              </div>
            </div>

            {/* If Order is Cancelled */}
            {order.status === 'CANCELLED' ? (
              <div className="mt-6 p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-200 text-xs">
                <div className="flex items-center gap-2 font-bold text-sm mb-1 text-red-300">
                  <AlertTriangle className="w-4 h-4" /> Order Cancelled
                </div>
                <p>
                  This order was cancelled by the smart canteen counter. Please contact the front desk with your token{' '}
                  <strong>{order.tokenNumber}</strong> for assistance or refunds.
                </p>
              </div>
            ) : (
              /* Timeline Visualizer */
              <div className="mt-8 pt-2">
                <div className="relative">
                  {/* Progress Line */}
                  <div className="hidden sm:block absolute top-5 left-8 right-8 h-1 bg-[#281D16] z-0">
                    <div
                      className="h-full bg-gradient-to-r from-[#C9A45C] to-[#E5CB91] transition-all duration-700"
                      style={{
                        width: `${Math.min(100, Math.max(0, (currentStageIdx / (timelineStages.length - 1)) * 100))}%`
                      }}
                    />
                  </div>

                  {/* Steps */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 relative z-10">
                    {timelineStages.map((stage, idx) => {
                      const isCompleted = currentStageIdx > idx;
                      const isCurrent = currentStageIdx === idx;
                      const isUpcoming = currentStageIdx < idx;

                      return (
                        <div
                          key={stage.status}
                          className={`flex sm:flex-col items-center gap-3 sm:text-center transition-all ${
                            isUpcoming ? 'opacity-40' : 'opacity-100'
                          }`}
                        >
                          {/* Step Indicator Circle */}
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all duration-300 border-2 ${
                              isCompleted
                                ? 'bg-[#C9A45C] text-[#19130F] border-[#E5CB91] shadow-md'
                                : isCurrent
                                ? 'bg-[#281D16] text-[#E5CB91] border-[#C9A45C] ring-4 ring-[#C9A45C]/30 scale-110'
                                : 'bg-[#19130F] text-[#806F5D] border-[#281D16]'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : isCurrent ? (
                              <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A45C] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#E5CB91]"></span>
                              </span>
                            ) : (
                              stage.stepNumber
                            )}
                          </div>

                          {/* Stage details */}
                          <div className="sm:mt-2 text-left sm:text-center">
                            <h4
                              className={`text-xs uppercase font-bold tracking-wider ${
                                isCurrent ? 'text-[#E5CB91]' : isCompleted ? 'text-white' : 'text-[#806F5D]'
                              }`}
                            >
                              {stage.title}
                            </h4>
                            <p className="text-[11px] text-[#806F5D] hidden sm:block mt-0.5">
                              {stage.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Real FCM Alert Card for Customer */}
          <div
            className={`p-4 rounded-xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 border transition-all ${
              fcmState === 'enabled'
                ? 'bg-[#536E56]/10 border-[#536E56]/40'
                : 'bg-[#FFFDF8] border-[#C9A45C]'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`p-2 rounded-full ${
                  fcmState === 'enabled'
                    ? 'bg-[#536E56]/20 text-[#536E56]'
                    : 'bg-[#C9A45C]/20 text-[#C9A45C]'
                }`}
              >
                {fcmState === 'enabled' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#332920]">
                  {fcmState === 'enabled'
                    ? `Push Alerts Active for Token #${order.tokenNumber}`
                    : `Enable Push Notifications for Token #${order.tokenNumber}`}
                </h4>
                <p className="text-xs text-[#806F5D]">
                  {fcmState === 'enabled'
                    ? 'Device connected via Firebase Cloud Messaging. You will receive an instant push notification when this order updates.'
                    : 'Receive a real device alert as soon as your meal is ready, even if you close this tab.'}
                </p>
              </div>
            </div>
            <button
              id="order-tracking-enable-notifications-btn"
              onClick={handleTrackingEnable}
              disabled={isLoading}
              className={`px-4 py-2 font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm whitespace-nowrap transition-colors ${
                fcmState === 'enabled'
                  ? 'bg-[#536E56] hover:bg-[#435946] text-white'
                  : 'bg-[#C9A45C] hover:bg-[#b9944c] text-[#19130F]'
              }`}
            >
              {isLoading
                ? 'Connecting...'
                : fcmState === 'enabled'
                ? 'Notification Status'
                : 'Enable Notifications'}
            </button>
          </div>

          {/* Order Details & Summary Card */}
          <div className="bg-[#FFFDF8] border border-[#DDCFBA] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#DDCFBA] mb-4">
              <div>
                <h3 className="font-royal text-lg font-bold text-[#332920]">Order Information</h3>
                <p className="text-xs text-[#806F5D]">
                  Placed on {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#806F5D] block">Customer</span>
                <span className="text-xs font-bold text-[#332920]">{order.customerName} ({order.mobileNumber})</span>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#806F5D]">
                Items Ordered
              </h4>
              {order.items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm py-1 border-b border-[#F7F0E3]">
                  <div>
                    <span className="font-semibold text-[#332920]">{it.name}</span>
                    <span className="text-xs text-[#806F5D] ml-2">× {it.quantity}</span>
                  </div>
                  <span className="font-cinzel font-bold text-[#332920]">₹{it.subtotal}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="bg-[#F7F0E3] p-4 rounded-xl flex justify-between items-center border border-[#DDCFBA]">
              <div>
                <span className="text-xs font-semibold text-[#806F5D] uppercase tracking-wider block">
                  Total Bill
                </span>
                <span className="text-[11px] text-[#536E56] font-medium">Paid via Canteen Counter / UPI</span>
              </div>
              <span className="font-cinzel text-xl font-bold text-[#332920]">
                ₹{order.totalAmount}
              </span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
