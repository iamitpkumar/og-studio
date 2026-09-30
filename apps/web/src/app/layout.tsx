import type { Metadata } from 'next';
import '../styles/globals.css';
export const metadata:Metadata={title:'Motion OS — Your next story',description:'Your product. Your prompt. A new way to create video.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
