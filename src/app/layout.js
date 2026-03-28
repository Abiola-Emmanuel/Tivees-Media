import { Manrope } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
})

export const metadata = {
  title: "TIVEES MEDIA",
  description: "TIVEES MEDIA is a media company that provides high-quality content and services to its clients. We specialize in creating engaging and innovative media solutions that help businesses and individuals connect with their audiences. Our team of experts is dedicated to delivering exceptional results and exceeding our clients' expectations.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={` ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
