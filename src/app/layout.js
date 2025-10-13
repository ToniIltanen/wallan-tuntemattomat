import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { GoogleAnalytics } from '@next/third-parties/google'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Wallan Tuntemattomat",
  description: "Wallan Tuntemattomat on vuonna 2012 alkunsa saanut satakuntalainen iskelmä ja bilemusaa soittava kahden miehen orkesteri",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fi">
      <meta property="og:title" content="Wallan Tuntemattomat" />
      <meta property="og:image" content="https://www.wallantuntemattomat.fi/logo.jpg" />
      <meta property="og:description" content="Wallan Tuntemattomat on vuonna 2012 alkunsa saanut satakuntalainen iskelmä ja bilemusaa soittava kahden miehen orkesteri" />
      <body>
        <AppRouterCacheProvider>
        {children}
        <GoogleAnalytics gaId="G-V2K3L50G8N" />
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
