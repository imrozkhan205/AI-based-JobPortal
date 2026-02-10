import { NavLink } from "react-router-dom";
import { SidebarOpen, SidebarClose } from "lucide-react";
import { useUser, UserButton } from "@clerk/clerk-react";
import rocket from "../assets/rocket.png";

const Sidebar = ({ collapsed, setCollapsed, links }) => {
  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-black border-r border-gray-800 p-4 z-40 transition-all duration-300 ease-in-out ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="flex flex-col h-full text-white">
        {/* Header and toggle */}
        <div className={`flex items-center mb-6 ${collapsed ? "justify-end" : "justify-between"}`}>
          {!collapsed && (
            <div className="flex items-center gap-3">
              <img src={rocket} alt="JobSpace" className="w-10 h-10" />
              <h2 className="text-2xl font-bold text-white leading-none">
                JobSpace
              </h2>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-400 hover:text-white ml-3"
          >
            {collapsed ? <SidebarOpen size={20} /> : <SidebarClose size={20} />}
          </button>
        </div>

        {/* Navigation links */}
        <nav className="space-y-1 flex-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-lg transition ${
                  isActive
                    ? "bg-gray-800 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              <span className="mr-3">{link.icon}</span>
              {!collapsed && <span>{link.label}</span>}
            </NavLink>
            
          ))}
        </nav>
         <div className="flex justify-start mb-6">
        {/* You can set `afterSignOutUrl` to the page you want to redirect to */}
        <UserButton afterSignOutUrl="/" />
      </div>
      </div>
    </aside>
  );
};

export default Sidebar;
