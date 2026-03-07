import { NavLink, useNavigate } from 'react-router-dom';
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
import { FiMenu, FiBell, FiLogOut, FiUser } from 'react-icons/fi';

export default function Navbar({ toggleSidebar }) {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-4 sm:px-6">
      <div className="flex items-center gap-4">
        {isAuthenticated && toggleSidebar && (
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hidden md:flex">
            <FiMenu className="h-5 w-5" />
          </Button>
        )}
        
        {/* Mobile Logo if needed, otherwise hidden on md */}
        <div className="flex md:hidden items-center gap-2">
           <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
            M
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            MediFlow
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground mr-1">
                  <FiBell className="h-5 w-5" />
                  <span className="absolute top-1.5 right-2 h-2 w-2 rounded-full bg-destructive"></span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72" align="end" forceMount>
                <DropdownMenuLabel className="font-normal text-sm border-b border-border pb-2 mb-1">
                  Notifications
                </DropdownMenuLabel>
                <div className="max-h-[300px] overflow-y-auto">
                  <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                    <span className="text-sm font-medium">New Lab Report Available</span>
                    <span className="text-xs text-muted-foreground">Patient David Wilson's results are ready.</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                    <span className="text-sm font-medium text-primary">Appointment Reminder</span>
                    <span className="text-xs text-muted-foreground">Meeting with Dr. Smith in 30 mins.</span>
                  </DropdownMenuItem>
                </div>
                <div className="p-2 pt-1 border-t border-border mt-1">
                  <Button variant="ghost" className="w-full text-xs text-primary justify-center h-8">
                    View All Notifications
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`} alt="@user" />
                    <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || 'Guest User'}</p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">
                      {user?.role || 'Role'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                   <NavLink to={`/${user?.role}/profile`} className="w-full flex items-center">
                     <FiUser className="mr-2 h-4 w-4" />
                     <span>Profile</span>
                   </NavLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={handleLogout}>
                  <FiLogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <NavLink to="/login">Sign In</NavLink>
            </Button>
            <Button asChild>
              <NavLink to="/register">Register</NavLink>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
