import type { Metadata } from "next";
import "./globals.css";
import AuthBar from "./login/AuthBar";
import NavLinks from "./login/NavLinks";

export const metadata: Metadata = {
  title: "E-commerce Performance Challenge",
  description: "Minimal application for performance performance challenge (users, products, orders)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
  <html lang="en">
      <body>
        <header className="site-header">
          <div className="site-header-inner" style={{padding:'0.5rem 1.25rem'}}>
            <div className="header-flex-wrap">
              <div style={{display:'flex', alignItems:'center', gap:'0.85rem', minWidth:0}}>
                <a className="brand" href="/">Perf Challenge</a>
                <div className="header-nav-block">
                  <NavLinks />
                </div>
              </div>
              <div className="header-auth-block">
                <AuthBar />
              </div>
            </div>
          </div>
        </header>
        <div className="container">
          {children}
        </div>
      </body>
    </html>
  );
}
