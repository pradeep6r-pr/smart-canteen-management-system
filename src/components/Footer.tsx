import React from 'react';
import { UtensilsCrossed, Shield, Phone, MapPin, Clock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#19130F] text-[#F7F0E3] border-t border-[#C9A45C]/30 pt-12 pb-8 px-4 sm:px-6 lg:px-8 mt-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-[#281D16]">
        
        {/* Brand */}
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#281D16] border border-[#C9A45C]/40 flex items-center justify-center text-[#E5CB91]">
              <UtensilsCrossed className="w-4 h-4 text-[#C9A45C]" />
            </div>
            <span className="font-cinzel text-lg font-bold text-[#E5CB91] tracking-wider">
              SMART CANTEEN
            </span>
          </div>
          <p className="text-xs text-[#806F5D] max-w-sm leading-relaxed">
            The aristocratic smart dining platform engineered for universities, academic institutions, and modern campuses. Powered by Firebase Cloud Messaging & live digital queue tokens.
          </p>
        </div>

        {/* Operating Hours */}
        <div className="space-y-2">
          <h4 className="font-royal font-bold text-sm text-[#E5CB91] uppercase tracking-wider">
            Canteen Hours
          </h4>
          <ul className="text-xs text-[#806F5D] space-y-1">
            <li>Breakfast: 07:30 AM – 10:30 AM</li>
            <li>Royal Lunch: 12:00 PM – 03:30 PM</li>
            <li>Evening Snacks: 04:30 PM – 07:00 PM</li>
            <li>Dinner: 07:30 PM – 10:00 PM</li>
          </ul>
        </div>

        {/* Support & Counter */}
        <div className="space-y-2">
          <h4 className="font-royal font-bold text-sm text-[#E5CB91] uppercase tracking-wider">
            Counter Assistance
          </h4>
          <div className="text-xs text-[#806F5D] space-y-1">
            <p className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#C9A45C]" />
              Central Campus Food Court, Floor 1
            </p>
            <p className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#C9A45C]" />
              +91 (0) 800-ROYAL-MEAL
            </p>
            <p className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#C9A45C]" />
              Token window 1 to 4 active
            </p>
          </div>
        </div>

      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#806F5D] gap-2">
        <p>© {new Date().getFullYear()} Smart Canteen Management System. All rights reserved.</p>
        <p className="text-[#806F5D]">
          Built with React • Node.js • Cloud Firestore • Firebase Cloud Messaging
        </p>
      </div>
    </footer>
  );
};
