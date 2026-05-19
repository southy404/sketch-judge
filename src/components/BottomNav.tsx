import { Clock, Home, Trophy, UserRound } from "lucide-react";
import type { ComponentType } from "react";
import type { AppTab } from "../types";

type Item = {
  tab: AppTab;
  label: string;
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>;
};

const ITEMS: Item[] = [
  { tab: "home", label: "home", Icon: Home },
  { tab: "history", label: "history", Icon: Clock },
  { tab: "rank", label: "rank", Icon: Trophy },
  { tab: "profile", label: "profile", Icon: UserRound },
];

type Props = {
  active: AppTab;
  onChange: (tab: AppTab) => void;
};

export function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="bottom-nav" aria-label="primary">
      {ITEMS.map(({ tab, label, Icon }) => (
        <button
          key={tab}
          type="button"
          className={active === tab ? "nav-item active" : "nav-item"}
          onClick={() => onChange(tab)}
          aria-current={active === tab ? "page" : undefined}
        >
          <Icon size={22} strokeWidth={1.8} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
