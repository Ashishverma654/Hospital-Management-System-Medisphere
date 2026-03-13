import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { FiMenu, FiBell, FiLogOut, FiUser, FiSettings } from 'react-icons/fi';
import logoImg from '../../assets/logo.png';
import { notificationsApi } from '../../services/apiServices.js';

export default function Navbar({ toggleSidebar }) {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = () => {
    localStorage.removeItem('mediflow_auth');
    dispatch(logout());
    navigate('/login');
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const loadNotifications = async () => {
      try {
        const isPatient = user?.role === 'patient';
        const data = isPatient
          ? await notificationsApi.getMy()
          : await notificationsApi.getMyEmployee();
        setNotifications(Array.isArray(data) ? data.slice(0, 5) : []);
        const count = isPatient
          ? await notificationsApi.getUnreadCount()
          : await notificationsApi.getEmployeeUnreadCount();
        setUnreadCount(count?.unreadCount || 0);
      } catch {
        setNotifications([]);
        setUnreadCount(0);
      }
    };
    loadNotifications();
  }, [isAuthenticated, user?.role]);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-4 sm:px-6">
      <div className="flex items-center gap-4">
        {isAuthenticated && toggleSidebar && (
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hidden md:flex">
            <FiMenu className="h-5 w-5" />
          </Button>
        )}
        
        <NavLink to="/" className="flex items-center gap-2">
           <img src={logoImg} alt="logo" className="h-8 w-auto md:h-10" />
           <span className="font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
             MediFlow
           </span>
        </NavLink>
      </div>

      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger className="relative flex items-center justify-center p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-accent-foreground mr-1 outline-none">
                  <FiBell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-2 h-2 w-2 rounded-full bg-destructive"></span>
                  )}
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72" align="end">
                <div className="px-2 py-1.5 text-sm font-semibold border-b border-border pb-2 mb-1">
                  Notifications
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.map((notification) => (
                    <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                      <span className="text-sm font-medium">{notification.title}</span>
                      <span className="text-xs text-muted-foreground">{notification.message}</span>
                    </DropdownMenuItem>
                  ))}
                  {notifications.length === 0 && (
                    <DropdownMenuItem className="text-xs text-muted-foreground">
                      No notifications yet.
                    </DropdownMenuItem>
                  )}
                </div>
                <div className="p-2 pt-1 border-t border-border mt-1">
                  <Button variant="ghost" className="w-full text-xs text-primary justify-center h-8" asChild>
                    <NavLink to={user?.role === 'patient' ? '/patient/notifications' : '/employee/notifications'}>
                      View All Notifications
                    </NavLink>
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="relative h-9 w-9 rounded-full outline-none ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:opacity-80 cursor-pointer">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarImage src={user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`} alt="@user" className="object-cover" />
                    <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="px-2 py-1.5">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || 'Guest User'}</p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">
                      {user?.role || 'Role'}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer p-0">
                   <NavLink to={`/${user?.role}/profile`} className="w-full flex items-center px-2 py-1.5 outline-none">
                     <FiUser className="mr-2 h-4 w-4" />
                     <span>Profile</span>
                   </NavLink>
                </DropdownMenuItem>
                {user?.role !== 'patient' && (
                  <DropdownMenuItem className="cursor-pointer p-0">
                    <NavLink to="/forgot-password" className="w-full flex items-center px-2 py-1.5 outline-none text-amber-600">
                      <FiSettings className="mr-2 h-4 w-4" />
                      <span>Reset Password</span>
                    </NavLink>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={handleLogout}>
                  <FiLogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <nav className="hidden md:flex items-center gap-8 font-medium text-gray-600 text-[15px]">
              <NavLink to="/" className={({isActive}) => isActive ? "text-gray-900 border-b-2 border-[#ee4c35] pb-4 -mb-[19px] font-semibold" : "hover:text-[#ee4c35] transition-colors"}>Home</NavLink>
              <NavLink to="/patient/appointments" className={({isActive}) => isActive ? "text-gray-900 border-b-2 border-[#ee4c35] pb-4 -mb-[19px] font-semibold" : "hover:text-[#ee4c35] transition-colors"}>Appointments</NavLink>
              <NavLink to="/patient/lab-reports" className={({isActive}) => isActive ? "text-gray-900 border-b-2 border-[#ee4c35] pb-4 -mb-[19px] font-semibold" : "hover:text-[#ee4c35] transition-colors"}>Records</NavLink>
              <NavLink to="/login" className={({isActive}) => isActive ? "text-gray-900 border-b-2 border-[#ee4c35] pb-4 -mb-[19px] font-semibold" : "hover:text-[#ee4c35] transition-colors"}>Login</NavLink>
            </nav>
            <div className="flex md:hidden items-center gap-4">
              <NavLink to="/login" className="text-[#ee4c35] font-medium">Login</NavLink>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
