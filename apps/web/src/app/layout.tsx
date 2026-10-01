import type { Metadata } from 'next';
import '../styles/globals.css';
export const metadata:Metadata={title:'Motion OS — Your next story',description:'Your product. Your prompt. A new way to create video.'};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return (
    <html lang="en">
      {/* Extensions inject body attributes before hydration; descendants retain normal checks. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
