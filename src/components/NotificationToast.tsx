import React from 'react';
import { Bell, X, ArrowRight } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

interface NotificationToastProps {
  onTrackOrder: (orderId: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ onTrackOrder }) => {
  const { recentNotification, dismissNotification } = useNotification();

  if (!recentNotification) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-[#19130F] text-[#F7F0E3] rounded-2xl p-4 border border-[#C9A45C] shadow-2xl animate-bounce-once">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-[#C9A45C]/20 border border-[#C9A45C]/40 rounded-xl text-[#C9A45C] mt-0.5">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-royal text-sm font-bold text-[#E5CB91] leading-tight">
              {recentNotification.title}
            </h4>
            <p className="text-xs text-[#F7F0E3]/80 mt-1 leading-normal">
              {recentNotification.body}
            </p>
            {recentNotification.tokenNumber && (
              <span className="inline-block mt-2 font-cinzel text-xs font-bold text-[#19130F] bg-[#C9A45C] px-2 py-0.5 rounded">
                Token: {recentNotification.tokenNumber}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={dismissNotification}
          className="text-[#806F5D] hover:text-white p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {recentNotification.orderId && (
        <div className="mt-3 pt-2.5 border-t border-[#C9A45C]/30 flex justify-end">
          <button
            onClick={() => {
              onTrackOrder(recentNotification.orderId);
              dismissNotification();
            }}
            className="text-xs font-bold uppercase tracking-wider text-[#E5CB91] hover:text-white flex items-center space-x-1"
          >
            <span>View Timeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
