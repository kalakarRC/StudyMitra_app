// src/components/NavigationDock.tsx
import {
  BookOpen,
  House,
  MessagesSquare,
  ShoppingBag,
  UsersRound,
  Video,
  type LucideIcon,
} from "lucide-react";
import { NavLink } from "react-router-dom";

type DockItem = {
  label: string;
  to:
    | "/home"
    | "/learn"
    | "/viva"
    | "/hub"
    | "/friends"
    | "/bazaar"
    | "/profile";
  Icon: LucideIcon;
};

const ITEMS: DockItem[] = [
  { label: "Home", to: "/home", Icon: House },
  { label: "Learn", to: "/learn", Icon: BookOpen },
  { label: "Viva", to: "/viva", Icon: Video },
  { label: "Hub", to: "/hub", Icon: MessagesSquare },
  { label: "Friends", to: "/friends", Icon: UsersRound },
  { label: "Bazaar", to: "/bazaar", Icon: ShoppingBag },
  { label: "Profile", to: "/profile", Icon: UsersRound },
];

export function NavigationDock() {
  return (
    <nav className="navigation-dock" aria-label="Main navigation">
      {ITEMS.map(({ label, to, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            `navigation-dock__link${isActive ? " is-active" : ""}`
          }
          aria-label={label}
        >
          <Icon
            className="navigation-dock__icon"
            aria-hidden="true"
            focusable="false"
          />
          <span className="navigation-dock__label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

