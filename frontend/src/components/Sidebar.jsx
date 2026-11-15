import { NavLink } from "react-router-dom";
import { SidebarOpen, SidebarClose, X } from "lucide-react";
import { UserButton } from "@clerk/clerk-react";
import rocket from "../assets/rocket.png";

const Sidebar = ({ collapsed, setCollapsed, links, mobileOpen, setMobileOpen }) => {
  const closeMobile = () => {
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen bg-black border-r border-gray-800 p-4 z-50 transition-all duration-300 ease-in-out ${
          // Mobile: full drawer width 64, slide in/out
          mobileOpen ? "translate-x-0 w-64 shadow-2xl" : "-translate-x-full md:translate-x-0"
        } ${
          // Desktop: collapsible width
          collapsed ? "md:w-20" : "md:w-64"
        }`}
      >
        <div className="flex flex-col h-full text-white">
          {/* Header and toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className={`flex items-center gap-3 ${collapsed ? "md:hidden" : ""}`}>
              <img src={rocket} alt="JobSpace" className="w-9 h-9" />
              <h2 className="text-2xl font-bold text-white leading-none">
                JobSpace
              </h2>
            </div>

            {/* Mobile close button */}
            <button
              onClick={closeMobile}
              className="text-gray-400 hover:text-white md:hidden p-1 rounded-lg hover:bg-gray-800"
              aria-label="Close sidebar"
            >
              <X size={22} />
            </button>

            {/* Desktop collapse toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-gray-400 hover:text-white hidden md:block"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <SidebarOpen size={20} /> : <SidebarClose size={20} />}
            </button>
          </div>

          {/* Navigation links */}
          <nav className="space-y-1 flex-1 overflow-y-auto">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={closeMobile}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 rounded-lg transition font-medium ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`
                }
              >
                <span className="shrink-0 mr-3">{link.icon}</span>
                <span className={`${collapsed ? "md:hidden" : ""} truncate`}>
                  {link.label}
                </span>
              </NavLink>
            ))}
          </nav>

          {/* User profile button */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-800/80">
            <UserButton afterSignOutUrl="/" />
            <div className={`text-xs text-gray-400 ${collapsed ? "md:hidden" : ""}`}>
              <span>Manage Account</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
