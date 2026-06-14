import { Button, buttonVariants } from "@frontend/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@frontend/ui/components/ui/dropdown-menu";

import { useAuth } from "@frontend/auth/context/AuthContext";
import { useTheme } from "@frontend/auth/context/ThemeContext";
import { cn } from "@frontend/ui/lib/utils";
import { Moon, Sun, User } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  const { dark, setDark } = useTheme();
  const { isLoggedIn, login, logout } = useAuth();

  return (
    <header className="w-full max-w-5xl mx-auto flex items-center gap-1 px-4 py-3">
      <Button asChild variant="ghost">
        <a href="/gallery">Gallery</a>
      </Button>
      <Button asChild variant="ghost">
        <a href="/gallery/upload">Upload</a>
      </Button>
      <Button
        className="ml-auto"
        variant="ghost"
        size="icon"
        onClick={() => {
          setDark(!dark);
        }}
      >
        {dark ? <Sun /> : <Moon />}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
        >
          <User />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isLoggedIn ? (
            <>
              <DropdownMenuItem asChild>
                <Link to="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem onClick={login}>Login</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

export default Header;
