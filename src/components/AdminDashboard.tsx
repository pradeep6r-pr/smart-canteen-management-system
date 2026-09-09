import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Send,
  Bell,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Order, OrderStatus, NotificationLog } from '../types';
import { useNotification } from '../context/NotificationContext';

export const AdminDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'logs'>('orders');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Test Notification state
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const { fcmToken, requestPermission, permissionStatus, fcmState, openModal } = useNotification();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (e) {
      console.warn('Failed to fetch admin orders', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/notification-logs');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (e) {
      console.warn('Failed to fetch notification logs', e);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchLogs();

    // Periodic refresh
    const interval = setInterval(() => {
      fetchOrders();
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update order status');
      }

      // Update in local state
      setOrders((prev) =>
        prev.map((ord) => (ord.orderId === orderId ? data.order : ord))
      );

      setStatusMessage({
        text: `Status updated to ${newStatus}. ${
          data.notification?.sentCount
            ? `Push notification sent to ${data.notification.sentCount} customer device(s).`
            : 'Order status updated successfully.'
        }`
      });

      fetchLogs();
    } catch (err: any) {
      setStatusMessage({
        text: err?.message || 'Error updating order status',
        isError: true
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleSendAdminTestNotification = async () => {
    setTestSending(true);
    setTestResult(null);

    let targetToken = fcmToken;
    if (!targetToken && permissionStatus !== 'granted') {
      try {
        targetToken = await requestPermission('Admin-Test-Device');
      } catch (e) {
        console.warn('Permission error:', e);
      }
    }

    if (!targetToken) {
      setTestResult('No FCM registration token found. Opening notification setup...');
      openModal();
      setTestSending(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/send-test-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: targetToken,
          title: '👑 Royal Smart Canteen: Test Push Alert',
          body: 'This confirms your FCM Push Notification pipeline is operational!'
        })
      });

      const data = await res.json();
      if (data.success) {
        setTestResult('✅ Push Notification dispatched successfully to this test browser!');
      } else {
        setTestResult(`❌ Push delivery feedback: ${data.errors?.join(', ') || 'Failed to send'}`);
      }
      fetchLogs();
    } catch (err: any) {
      setTestResult(`Error: ${err?.message}`);
    } finally {
      setTestSending(false);
    }
  };

  const filteredOrders = orders.filter((ord) => {
    const matchesSearch =
      ord.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.mobileNumber.includes(searchQuery) ||
      ord.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || ord.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header Banner */}
      <div className="bg-[#19130F] text-[#F7F0E3] rounded-2xl p-6 sm:p-8 border border-[#C9A45C]/40 shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-cinzel text-xs text-[#E5CB91] tracking-widest uppercase font-semibold">
              Kitchen & Management Console
            </span>
            <span className="px-2 py-0.5 rounded bg-[#536E56]/40 text-[#A8C7A9] border border-[#536E56] text-[10px] font-bold uppercase">
              Admin Access
            </span>
          </div>
          <h1 className="font-royal text-2xl sm:text-3xl font-bold text-white mt-1">
            Smart Canteen Command Center
          </h1>
          <p className="text-xs sm:text-sm text-[#F7F0E3]/70 mt-1 max-w-xl">
            Live order queue management, token fulfillment, and automated Firebase Cloud Messaging dispatch.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={openModal}
            className="px-4 py-2.5 bg-[#281D16] hover:bg-[#332920] text-[#E5CB91] border border-[#C9A45C]/30 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 transition-all shadow-sm"
            title="Inspect FCM tokens, Web Push configuration, and status"
          >
            <Bell className="w-3.5 h-3.5 text-[#C9A45C]" />
            <span>FCM Device Status</span>
          </button>

          <button
            onClick={fetchOrders}
            className="px-4 py-2.5 bg-[#281D16] hover:bg-[#332920] text-[#E5CB91] border border-[#C9A45C]/30 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>

          {/* Admin Test Notification Button */}
          <button
            id="admin-test-notification-btn"
            onClick={handleSendAdminTestNotification}
            disabled={testSending}
            className="px-4 py-2.5 bg-gradient-to-r from-[#C9A45C] to-[#E5CB91] hover:from-[#b9944c] hover:to-[#d5bb81] text-[#19130F] font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center space-x-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{testSending ? 'Sending Push...' : 'Send Test Notification'}</span>
          </button>
        </div>
      </div>

      {/* Test feedback banner */}
      {testResult && (
        <div className="mb-6 p-4 rounded-xl bg-[#FFFDF8] border border-[#C9A45C] text-xs text-[#332920] shadow-sm flex items-center justify-between">
          <span>{testResult}</span>
          <button
            onClick={() => setTestResult(null)}
            className="text-[#806F5D] hover:text-[#332920] font-bold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Status Feedback Message */}
      {statusMessage && (
        <div
          className={`mb-6 p-4 rounded-xl text-xs flex items-center justify-between shadow-sm border ${
            statusMessage.isError
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-[#536E56]/15 border-[#536E56]/40 text-[#281D16]'
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#536E56] shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="font-bold hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation tabs between Orders and FCM logs */}
      <div className="flex border-b border-[#DDCFBA] mb-6">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-6 text-xs uppercase font-bold tracking-wider relative transition-colors ${
            activeTab === 'orders' ? 'text-[#332920] border-b-2 border-[#C9A45C]' : 'text-[#806F5D] hover:text-[#332920]'
          }`}
        >
          Live Orders Queue ({filteredOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 px-6 text-xs uppercase font-bold tracking-wider relative transition-colors ${
            activeTab === 'logs' ? 'text-[#332920] border-b-2 border-[#C9A45C]' : 'text-[#806F5D] hover:text-[#332920]'
          }`}
        >
          FCM Notification Logs ({logs.length})
        </button>
      </div>

      {activeTab === 'orders' ? (
        <>
          {/* Controls: Search & Status Filters */}
          <div className="bg-[#FFFDF8] border border-[#DDCFBA] rounded-2xl p-4 sm:p-5 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#806F5D]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Order ID, Token #, Customer Name, Mobile..."
                className="w-full pl-10 pr-4 py-2 bg-[#F7F0E3]/60 border border-[#DDCFBA] focus:border-[#C9A45C] rounded-xl text-xs text-[#332920] focus:outline-none"
              />
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
              <span className="text-[#806F5D] font-semibold text-xs mr-1 hidden sm:inline">Status:</span>
              {['ALL', 'PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-bold tracking-wider uppercase whitespace-nowrap transition-all text-[11px] ${
                    statusFilter === st
                      ? 'bg-[#281D16] text-[#E5CB91] border border-[#C9A45C]/40 shadow-xs'
                      : 'bg-[#F7F0E3] text-[#806F5D] hover:text-[#332920] border border-[#DDCFBA]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

          </div>

          {/* Orders Table / Cards */}
          {filteredOrders.length === 0 ? (
            <div className="bg-[#FFFDF8] border border-[#DDCFBA] rounded-2xl p-16 text-center text-[#806F5D]">
              <AlertTriangle className="w-10 h-10 mx-auto text-[#DDCFBA] mb-2" />
              <h4 className="font-royal text-lg font-bold text-[#332920]">No Orders In This View</h4>
              <p className="text-xs">Adjust search query or filter selection to view orders.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((ord) => (
                <div
                  key={ord.orderId}
                  className="bg-[#FFFDF8] border border-[#DDCFBA] hover:border-[#C9A45C] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  {/* Left Info */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-cinzel text-lg font-bold text-[#332920]">
                        {ord.orderId}
                      </span>
                      <span className="bg-[#19130F] text-[#E5CB91] font-cinzel text-sm font-bold px-3 py-0.5 rounded-lg border border-[#C9A45C]/50 shadow-xs">
                        Token: {ord.tokenNumber}
                      </span>
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          ord.status === 'READY'
                            ? 'bg-[#536E56]/20 border-[#536E56] text-[#536E56]'
                            : ord.status === 'PREPARING'
                            ? 'bg-[#C9A45C]/20 border-[#C9A45C] text-[#806F5D]'
                            : ord.status === 'COMPLETED'
                            ? 'bg-neutral-100 border-neutral-300 text-neutral-600'
                            : ord.status === 'CANCELLED'
                            ? 'bg-red-100 border-red-300 text-red-700'
                            : 'bg-amber-100 border-amber-300 text-amber-800'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#806F5D]">
                      <span className="font-semibold text-[#332920]">
                        👤 {ord.customerName}
                      </span>
                      <span>📞 +91 {ord.mobileNumber}</span>
                      <span>🕒 {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {ord.deviceTokens && ord.deviceTokens.length > 0 && (
                        <span className="text-[#536E56] font-medium flex items-center gap-1">
                          <Bell className="w-3 h-3" /> FCM Device Linked
                        </span>
                      )}
                    </div>

                    {/* Items */}
                    <div className="text-xs text-[#332920]/80 bg-[#F7F0E3]/60 p-2.5 rounded-lg border border-[#DDCFBA]/60">
                      <span className="font-bold text-[#332920] mr-1">Items:</span>
                      {ord.items.map((i) => `${i.name} (×${i.quantity})`).join(' • ')}
                    </div>
                  </div>

                  {/* Total & Status Controls */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#F7F0E3]">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-[#806F5D] uppercase tracking-wider block">Total Amount</span>
                      <span className="font-cinzel text-xl font-bold text-[#C9A45C]">
                        ₹{ord.totalAmount}
                      </span>
                    </div>

                    {/* Change Status Action Dropdown/Buttons */}
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      {(['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'] as OrderStatus[]).map(
                        (st) => {
                          const isCurrent = ord.status === st;
                          return (
                            <button
                              key={st}
                              disabled={updatingOrderId === ord.orderId || isCurrent}
                              onClick={() => handleUpdateStatus(ord.orderId, st)}
                              title={`Set status to ${st} & send push notification`}
                              className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md tracking-wider transition-all border ${
                                isCurrent
                                  ? 'bg-[#19130F] text-[#E5CB91] border-[#C9A45C] cursor-default'
                                  : 'bg-white hover:bg-[#F7F0E3] text-[#332920] border-[#DDCFBA] active:scale-95'
                              }`}
                            >
                              {st}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* FCM Notification Logs Table */
        <div className="bg-[#FFFDF8] border border-[#DDCFBA] rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-[#F7F0E3] border-b border-[#DDCFBA] flex justify-between items-center">
            <div>
              <h3 className="font-royal font-bold text-sm text-[#332920]">
                Push Notification Dispatch History
              </h3>
              <p className="text-[11px] text-[#806F5D]">
                Records of real FCM notifications dispatched upon status changes and orders.
              </p>
            </div>
            <button
              onClick={fetchLogs}
              className="p-1.5 text-xs text-[#332920] hover:text-[#C9A45C]"
              title="Refresh logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#806F5D]">
              No push notifications logged yet. Trigger an order or status update to observe logs.
            </div>
          ) : (
            <div className="divide-y divide-[#F7F0E3] max-h-[500px] overflow-y-auto text-xs">
              {logs.map((log, idx) => (
                <div key={idx} className="p-4 hover:bg-[#F7F0E3]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-[#332920]">
                        {log.orderId || 'System Alert'}
                      </span>
                      {log.tokenNumber && (
                        <span className="bg-[#281D16] text-[#E5CB91] px-1.5 py-0.5 rounded text-[10px] font-bold">
                          Token {log.tokenNumber}
                        </span>
                      )}
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        {log.status}
                      </span>
                    </div>
                    <p className="text-[#332920] font-medium">{log.message}</p>
                    {log.errors && log.errors.length > 0 && (
                      <p className="text-red-600 text-[11px]">{log.errors.join('; ')}</p>
                    )}
                  </div>

                  <div className="sm:text-right shrink-0">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      log.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {log.success ? 'Delivered / Queued' : 'Failed'}
                    </span>
                    <span className="block text-[11px] text-[#806F5D] mt-1">
                      {new Date(log.sentAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
