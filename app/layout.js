import './globals.css';

export const metadata = {
  title: 'عطارة سدرة بدمنهور',
  description: 'عطارة سدرة بدمنهور',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body>{children}</body>
    </html>
  );
}
