import { Home, BarChart3, Calendar, Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TabView = "home" | "insights" | "planning" | "menu";

interface TabNavigationProps {
  activeTab: TabView;
  onTabChange: (tab: TabView) => void;
  onAddClick: () => void;
}

export default function TabNavigation({ activeTab, onTabChange, onAddClick }: TabNavigationProps) {
  const handleTabClick = (tab: TabView) => {
    onTabChange(tab);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 pb-safe z-40">
      <div className="flex justify-around items-center h-16">
        <button
          onClick={() => handleTabClick("home")}
          className={cn(
            "flex flex-col items-center gap-1 w-16",
            activeTab === "home" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"
          )}
        >
          <Home size={24} strokeWidth={activeTab === "home" ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Home</span>
        </button>

        <button
          onClick={() => handleTabClick("insights")}
          className={cn(
            "flex flex-col items-center gap-1 w-16",
            activeTab === "insights" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"
          )}
        >
          <BarChart3 size={24} strokeWidth={activeTab === "insights" ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Insights</span>
        </button>

        {/* Floating Add Button */}
        <div className="relative -top-6">
          <Button
            onClick={onAddClick}
            className="h-14 w-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center"
          >
            <Plus size={28} />
          </Button>
        </div>

        <button
          onClick={() => handleTabClick("planning")}
          className={cn(
            "flex flex-col items-center gap-1 w-16",
            activeTab === "planning" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"
          )}
        >
          <Calendar size={24} strokeWidth={activeTab === "planning" ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Plan</span>
        </button>

        <button
          onClick={() => handleTabClick("menu")}
          className={cn(
            "flex flex-col items-center gap-1 w-16",
            activeTab === "menu" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"
          )}
        >
          <Menu size={24} strokeWidth={activeTab === "menu" ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </div>
    </div>
  );
}
