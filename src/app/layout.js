import { Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
});

export const metadata = {
  title: "ENI'S EMPIRE | Ready-to-Wear & Bespoke Luxury",
  description: 'Curated Ready-to-Wear and Made-to-Order fashion house in Nigeria.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jakarta.variable}`}>
      <body className="bg-[#FAF8F5] text-[#121212] font-sans antialiased selection:bg-[#C5A059] selection:text-white">
        {children}
      </body>
    </html>
  );
}
