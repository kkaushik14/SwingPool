import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import type { NavigationItem } from "@/constants";
import { Button, Drawer } from "@/components/ui";

import { NavLinkList } from "./nav-link-list";

export const MobileNavDrawer = ({ items, title }: { items: NavigationItem[]; title: string }) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <>
      <Button variant="secondary" size="icon" onClick={() => setOpen(true)} className="md:hidden">
        <span className="sr-only">Open {title}</span>
        <Menu className="h-4 w-4" />
      </Button>
      <Drawer open={open} onClose={() => setOpen(false)} title={title}>
        <NavLinkList items={items} />
      </Drawer>
    </>
  );
};
