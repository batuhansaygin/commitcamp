import { LandingNavbar } from "@/components/landing/landing-navbar";

interface LandingLayoutProps {
  children: React.ReactNode;
}

export default function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingNavbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
