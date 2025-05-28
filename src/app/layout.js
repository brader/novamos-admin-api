import { Roboto } from 'next/font/google'
import "./globals.css";

const roboto = Roboto({
  weight: '400',
  subsets: ['latin'],
})

export const metadata = {
  title: "Novamos Admin Panel",
  description: "Admin Panel for Novamos E-commerce",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={roboto.className}>
      <body>{children}</body>
    </html>
  );
}
