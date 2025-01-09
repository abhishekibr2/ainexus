import { toast } from "@/hooks/use-toast";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const commingSoon = () => {
  toast({ title: "Comming Soon", description: "This feature will be available soon. Stay tuned!" })
}
