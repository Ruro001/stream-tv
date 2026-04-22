import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile } from "../types";
import { Plus, X, Check } from "lucide-react";

interface ProfileSelectionProps {
  profiles: UserProfile[];
  onSelect: (profile: UserProfile) => void;
  onAddProfile: (name: string) => void;
}

export const ProfileSelection = ({ profiles, onSelect, onAddProfile }: ProfileSelectionProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const handleAdd = () => {
    if (newName.trim()) {
      onAddProfile(newName.trim());
      setNewName("");
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-dark-bg flex items-center justify-center p-6">
      <div className="max-w-4xl w-full text-center space-y-12">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white text-3xl md:text-5xl font-medium tracking-tight"
        >
          {isAdding ? "Add Profile" : "Who's watching?"}
        </motion.h1>

        <div className="flex flex-wrap justify-center gap-6 md:gap-10">
          {!isAdding ? (
            <>
              {profiles.map((profile, index) => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => onSelect(profile)}
                  className="group cursor-pointer space-y-4"
                >
                  <div className={`w-24 h-24 md:w-40 md:h-40 rounded-md ${profile.color} flex items-center justify-center overflow-hidden border-4 border-transparent group-hover:border-white transition-all duration-300 shadow-2xl`}>
                    <span className="text-white text-4xl md:text-7xl font-black opacity-40 group-hover:opacity-100 transition-opacity">
                      {profile.name[0]}
                    </span>
                  </div>
                  <p className="text-gray-400 group-hover:text-white text-sm md:text-xl font-medium transition-colors">
                    {profile.name}
                  </p>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: profiles.length * 0.1 }}
                onClick={() => setIsAdding(true)}
                className="group cursor-pointer space-y-4"
              >
                <div className="w-24 h-24 md:w-40 md:h-40 rounded-md bg-white/5 flex items-center justify-center border-4 border-transparent group-hover:bg-white/10 transition-all duration-300">
                  <Plus className="w-12 h-12 text-gray-500 group-hover:text-white" />
                </div>
                <p className="text-gray-500 group-hover:text-white text-sm md:text-xl font-medium transition-colors">
                  Add Profile
                </p>
              </motion.div>
            </>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md space-y-8"
            >
              <div className="flex flex-col items-center space-y-6">
                <div className="w-32 h-32 md:w-48 md:h-48 rounded-md bg-prime-blue flex items-center justify-center shadow-2xl">
                  <span className="text-white text-6xl md:text-8xl font-black opacity-40">
                    {newName[0] || "?"}
                  </span>
                </div>
                <input 
                  autoFocus
                  type="text"
                  placeholder="Enter name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  className="w-full bg-gray-800 border-none outline-none text-white text-xl md:text-2xl p-4 rounded-md text-center placeholder:text-gray-600"
                />
              </div>
              <div className="flex items-center justify-center gap-4">
                <button 
                  onClick={handleAdd}
                  disabled={!newName.trim()}
                  className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-md font-black hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  <Check className="w-5 h-5" /> Save
                </button>
                <button 
                  onClick={() => setIsAdding(false)}
                  className="flex items-center gap-2 bg-gray-800 text-white px-8 py-3 rounded-md font-black hover:bg-gray-700 transition-all"
                >
                  <X className="w-5 h-5" /> Cancel
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {!isAdding && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="px-8 py-2 border border-gray-500 text-gray-500 hover:text-white hover:border-white transition-all text-sm md:text-lg uppercase tracking-widest font-medium"
          >
            Manage Profiles
          </motion.button>
        )}
      </div>
    </div>
  );
};
