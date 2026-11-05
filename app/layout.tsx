import type { Metadata } from 'next';
export const metadata: Metadata={title:'Heartfold Ink',description:'Personal stories and letters, written by people for people.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><head><link rel="stylesheet" href="/style.css" /></head><body>{children}</body></html>}
