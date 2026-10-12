import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'MasterMind — Connected teams. Clear answers.',description:'A cross-team knowledge and communication workspace. Fictional hackathon demonstration.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
