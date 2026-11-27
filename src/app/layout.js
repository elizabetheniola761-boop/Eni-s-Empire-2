import './globals.css';

export const metadata = {
  title: "ENI'S EMPIRE | Luxury Ready-to-Wear & Bespoke",
  description: 'All you need to do is pick a style and we will make it happen.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
