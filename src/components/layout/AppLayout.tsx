import TopBar from "./TopBar";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import BottomNav from "./BottomNav";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <TopBar />
      <div className="flex">
        <div className="hidden md:block">
          <LeftSidebar />
        </div>
        <main className="flex-1 min-w-0 pb-16 md:pb-0">
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
