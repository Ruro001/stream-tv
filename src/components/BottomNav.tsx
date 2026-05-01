import React from "react";
import { hapticsService } from "../services/hapticsService";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const tabs = [
    {
      id: "home",
      label: "Home",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
      ),
    },
    {
      id: "for-you",
      label: "For You",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
          <path d="M12 2L2 7l10 5 10-5-10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      ),
    },
    {
      id: "favorites",
      label: "Favorites",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ),
    },
    {
      id: "downloads",
      label: "Downloads",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z" />
        </svg>
      ),
    },
    {
      id: "profile",
      label: "Profile",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="fixed bottom-0 w-full bg-[#2b313d] h-[72px] flex items-center justify-between z-50 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.3)] px-2">
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => {
              hapticsService.selectionClick();
              onTabChange(tab.id);
            }}
            className={`flex items-center justify-center transition-all duration-300 h-12 relative ${
              isActive
                ? `bg-[#E53935] text-white ${
                    index === 0
                      ? "rounded-r-full rounded-l-none pl-6 pr-6 -ml-2"
                      : index === tabs.length - 1
                      ? "rounded-l-full rounded-r-none pr-6 pl-6 -mr-2"
                      : "rounded-full px-6"
                  }`
                : `text-[#8E98A8] hover:text-white px-4`
            }`}
          >
            {isActive ? (
              <span className="font-medium text-[15px]">{tab.label}</span>
            ) : (
              tab.icon
            )}
          </button>
        );
      })}
    </div>
  );
};
