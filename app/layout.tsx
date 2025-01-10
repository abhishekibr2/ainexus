import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import SidebarComponent from "@/components/sidebar/SidebarComponent";
import { Toaster } from "@/components/ui/toaster";
import TopLoader from "@/utils/TopLoader";
import HolyLoader from "holy-loader";


const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <HolyLoader />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarComponent >
            {children}
            <Toaster />
          </SidebarComponent>
        </ThemeProvider>
      </body>
    </html>
  );
}
