import React from "react";
import { Settings, LogOut, User, Bell, Shield } from "lucide-react";

export const ProfilePage = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <div className="pt-28 md:pt-32 px-6 md:px-16 space-y-10 min-h-[70vh] pb-32">
      <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Profile & Settings</h2>
      
      <div className="space-y-6">
        <div className="bg-[#1f232b] p-6 rounded-2xl space-y-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-prime-blue" /> Account
          </h3>
          <p className="text-gray-400 text-sm">Manage your account details and preferences.</p>
          <button className="text-prime-blue font-bold text-sm hover:underline">Edit Profile</button>
        </div>

        <div className="bg-[#1f232b] p-6 rounded-2xl space-y-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-prime-blue" /> App Settings
          </h3>
          <div className="flex items-center justify-between text-gray-400 text-sm">
            <span>Notifications</span>
            <input type="checkbox" className="toggle" defaultChecked />
          </div>
          <div className="flex items-center justify-between text-gray-400 text-sm">
            <span>Dark Mode</span>
            <input type="checkbox" className="toggle" defaultChecked disabled />
          </div>
        </div>

        <div className="bg-[#1f232b] p-6 rounded-2xl space-y-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-prime-blue" /> Privacy & Security
          </h3>
          <button className="text-gray-400 text-sm hover:text-white">Change Password</button>
        </div>

        <button 
          onClick={onLogout}
          className="w-full bg-netflix-red text-white py-4 rounded-xl font-bold hover:bg-[#b20710] flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" /> Sign Out
        </button>
      </div>
    </div>
  );
};
