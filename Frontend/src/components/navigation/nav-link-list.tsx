import { NavLink } from "react-router-dom";
import { useMemo } from "react";

import { Badge } from "@/components/ui";
import { cn } from "@/lib";
import type { NavigationItem } from "@/constants";

export const NavLinkList = ({
  items,
  compact = false
}: {
  items: NavigationItem[];
  compact?: boolean;
}) => {
  const groups = useMemo(() => {
    const nextGroups: Array<{ label?: string; items: NavigationItem[] }> = [];

    items.forEach((item) => {
      const currentGroup = nextGroups[nextGroups.length - 1];

      if (!currentGroup || currentGroup.label !== item.section) {
        nextGroups.push({
          label: item.section,
          items: [item]
        });
        return;
      }

      currentGroup.items.push(item);
    });

    return nextGroups;
  }, [items]);

  return (
    <nav className="space-y-5">
      {groups.map((group) => (
        <div key={group.label || group.items[0]?.to} className="space-y-2">
          {group.label ? (
            <p className="px-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              {group.label}
            </p>
          ) : null}
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/app" || item.to === "/admin"}
              className={({ isActive }) =>
                cn(
                  "group flex items-start gap-3 rounded-xl px-4 py-3 transition-all duration-200",
                  isActive
                    ? "bg-surface-elevated text-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-surface-soft hover:text-foreground"
                )
              }
            >
              {({ isActive }) => {
                const Icon = item.icon;

                return (
                  <>
                    <div
                      className={cn(
                        "mt-0.5 rounded-lg p-2 transition-colors",
                        isActive
                          ? "bg-primary-soft text-primary"
                          : "bg-surface-soft text-muted-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.label}</span>
                        {isActive ? <Badge tone="accent">Current</Badge> : null}
                      </div>
                      {!compact ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                  </>
                );
              }}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
};
