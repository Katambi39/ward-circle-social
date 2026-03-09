import TopBar from "./TopBar";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import BottomNav from "./BottomNav";
import AiChatBox from "@/components/ai/AiChatBox";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <TopBar />
      <div className="flex flex-1 min-h-0">
        <div className="hidden md:block">
          <LeftSidebar />
        </div>
        <main className="flex-1 min-w-0 pb-16 md:pb-0 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
        <div className="hidden lg:block">
          <RightSidebar />
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
