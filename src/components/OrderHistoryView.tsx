import React, { useState, useEffect } from 'react';
import { History, Search, ArrowRight, Clock, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { Order } from '../types';

interface OrderHistoryViewProps {
  onTrackOrder: (orderId: string) => void;
}

export const OrderHistoryView: React.FC<OrderHistoryViewProps> = ({ onTrackOrder }) => {
  const [mobileSearch, setMobileSearch] = useState(() => {
    return localStorage.getItem('smart_canteen_customer_mobile') || '';
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async (mobile: string) => {
    const cleanMobile = mobile.replace(/\D/g, '');
    if (!cleanMobile) {
      // Try local storage IDs
      const savedIds = JSON.parse(localStorage.getItem('smart_canteen_my_orders') || '[]');
      if (savedIds.length > 0) {
        setLoading(true);
        try {
          const fetchedOrders: Order[] = [];
          for (const id of savedIds.slice(0, 10)) {
            const res = await fetch(`/api/orders/${id}`);
            if (res.ok) {
              const d = await res.json();
              if (d.order) fetchedOrders.push(d.order);
            }
          }
          setOrders(fetchedOrders);
        } catch (e) {
          console.warn('Failed to fetch local ids', e);
        } finally {
          setLoading(false);
        }
      }
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/customer/${cleanMobile}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to retrieve history');
      }
      setOrders(data.orders || []);
    } catch (err: any) {
      setError(err?.message || 'Error fetching order history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mobileSearch) {
      fetchHistory(mobileSearch);
    } else {
      fetchHistory('');
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory(mobileSearch);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      
      {/* Header */}
      <div className="text-center mb-8">
        <span className="font-cinzel text-xs uppercase tracking-widest text-[#C9A45C] font-semibold">
          Customer Portal
        </span>
        <h1 className="font-royal text-3xl sm:text-4xl font-bold text-[#332920] mt-1 mb-2">
          Your Order History
        </h1>
        <p className="text-sm text-[#806F5D] max-w-md mx-auto">
          View all your previous culinary orders, verify token numbers, and track status.
        </p>
      </div>

      {/* Search by Mobile Form */}
      <div className="bg-[#FFFDF8] border border-[#DDCFBA] rounded-2xl p-4 sm:p-6 shadow-sm mb-8">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-3.5 text-xs font-bold text-[#806F5D]">+91</span>
            <input
              type="tel"
              maxLength={10}
              value={mobileSearch}
              onChange={(e) => setMobileSearch(e.target.value.replace(/\D/g, ''))}
              placeholder="Search by 10-digit mobile number"
              className="w-full pl-12 pr-4 py-3 bg-[#F7F0E3]/60 border border-[#DDCFBA] focus:border-[#C9A45C] rounded-xl text-sm text-[#332920] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[#281D16] hover:bg-[#19130F] text-[#E5CB91] hover:text-white rounded-xl text-xs uppercase font-bold tracking-wider transition-all duration-200 border border-[#C9A45C]/40 shadow-sm flex items-center justify-center space-x-2"
          >
            <Search className="w-4 h-4 text-[#C9A45C]" />
            <span>Search Orders</span>
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-16 text-center text-[#806F5D]">
          <div className="w-8 h-8 mx-auto mb-3 border-2 border-[#C9A45C] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-wider">Retrieving order records...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-[#FFFDF8] border border-[#DDCFBA] rounded-2xl p-12 text-center text-[#806F5D]">
          <History className="w-12 h-12 mx-auto text-[#DDCFBA] mb-3" />
          <h4 className="font-royal text-lg font-bold text-[#332920] mb-1">No Orders Found</h4>
          <p className="text-xs max-w-sm mx-auto">
            Place an order from the royal menu or enter the registered 10-digit mobile number used during checkout.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.orderId}
              className="bg-[#FFFDF8] border border-[#DDCFBA] hover:border-[#C9A45C] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center space-x-3">
                  <span className="font-cinzel text-base font-bold text-[#332920]">
                    {ord.orderId}
                  </span>
                  <span className="bg-[#281D16] text-[#E5CB91] font-cinzel text-xs font-bold px-2.5 py-0.5 rounded border border-[#C9A45C]/30">
                    Token: {ord.tokenNumber}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      ord.status === 'READY'
                        ? 'bg-[#536E56]/20 border-[#536E56] text-[#536E56]'
                        : ord.status === 'PREPARING'
                        ? 'bg-[#C9A45C]/20 border-[#C9A45C] text-[#806F5D]'
                        : ord.status === 'COMPLETED'
                        ? 'bg-neutral-100 border-neutral-300 text-neutral-600'
                        : ord.status === 'CANCELLED'
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    {ord.status}
                  </span>
                </div>

                <div className="flex items-center space-x-4 text-xs text-[#806F5D]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(ord.createdAt).toLocaleDateString()} at {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>•</span>
                  <span>{ord.items.length} {ord.items.length === 1 ? 'item' : 'items'}</span>
                </div>

                <div className="text-xs text-[#332920]/80">
                  {ord.items.map((i) => `${i.name} (×${i.quantity})`).join(', ')}
                </div>
              </div>

              <div className="flex items-center justify-between md:flex-col md:items-end gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-[#F7F0E3]">
                <div className="text-right">
                  <span className="text-[10px] text-[#806F5D] uppercase tracking-wider block">Total</span>
                  <span className="font-cinzel text-lg font-bold text-[#C9A45C]">
                    ₹{ord.totalAmount}
                  </span>
                </div>

                <button
                  onClick={() => onTrackOrder(ord.orderId)}
                  className="px-4 py-2 bg-[#F7F0E3] hover:bg-[#281D16] text-[#332920] hover:text-[#E5CB91] border border-[#DDCFBA] hover:border-[#C9A45C] rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center space-x-1.5"
                >
                  <span>Track Status</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
