"use client";

import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const ICON_SIZE = 16;

  return (
    <Button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      variant="ghost"
      className="text-sm w-full justify-start p-0 h-auto"
    >
      {theme === "dark" ? (
        <div className="flex items-center">
          <Sun size={ICON_SIZE} className="size-4 mr-2" /> Light
        </div>
      ) : (
        <div className="flex items-center">
          <Moon size={ICON_SIZE} className="size-4 mr-2" /> Dark
        </div>
      )}
    </Button>
  );
};

export { ThemeSwitcher };
