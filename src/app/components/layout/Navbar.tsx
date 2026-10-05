"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState, useEffect } from "react";
import { getCurrentUser, isUserLoggedIn, logout } from "@/src/services/authService";
import { platformApi } from "@/src/services/platformService";

export default function Navbar() {
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setUser(isUserLoggedIn() ? getCurrentUser() : null);
    if (pathname === "/dashboard/booking/turfs") {
      setSearchValue(new URLSearchParams(window.location.search).get("q") || "");
    }
  }, [pathname]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchValue.trim();
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    const suffix = search.toString();
    router.push(`/dashboard/booking/turfs${suffix ? `?${suffix}` : ""}`);
    window.dispatchEvent(new CustomEvent("catalog-search", { detail: { q: query } }));
    setMobileMenuOpen(false);
  };

  const openNearbySearch = () => {
    router.push("/dashboard/booking/turfs?nearby=1");
    window.dispatchEvent(new Event("catalog-nearby"));
    setMobileMenuOpen(false);
  };

  async function handleLogout() {
    try {
      await platformApi.logout();
    } catch {
      // Clear the local session even if the API is unreachable.
    } finally {
      logout();
      setUser(null);
      setProfileMenuOpen(false);
      setMobileMenuOpen(false);
      router.replace("/");
      router.refresh();
    }
  }

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Bebas+Neue&display=swap');
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:8px}
        ::-webkit-scrollbar-track{background:#0B0B0B}
        ::-webkit-scrollbar-thumb{background:#ffffff;border-radius:99px}

        body { font-family: 'Poppins', sans-serif; background: #0B0B0B; }
        h1, h2, h3, .heading { font-family: 'Bebas Neue', sans-serif; letter-spacing: 1px; font-weight: 700; }

        @property --angle{syntax:'<angle>';initial-value:0deg;inherits:false}
        @keyframes spin{to{--angle:360deg}}
        .neon-border{
          background:conic-gradient(from var(--angle),#ffffff44,#ffffff,#ffffff,#ffffff44 50%);
          animation:spin 4s linear infinite;padding:2px;border-radius:12px;
        }

        .neon-glow{
          box-shadow: 0 0 20px rgba(255,255,255,.4), 0 0 40px rgba(255,255,255,.2);
        }

        .cta-primary{
          background: #ffffff;
          color: #0B0B0B;
          position:relative;overflow:hidden;transition:all .3s;
          box-shadow: 0 4px 12px rgba(255,255,255,.15);
        }
        .cta-primary:hover{
          background: #f0f0f0;
          box-shadow: 0 8px 20px rgba(255,255,255,.2);
          transform: translateY(-2px);
        }

        .cta-secondary{
          border: 2px solid #ffffff;
          color: #ffffff;
          transition: all .3s;
          position: relative;
        }
        .cta-secondary:hover{
          background: rgba(255,255,255,.08);
          box-shadow: 0 4px 12px rgba(255,255,255,.1);
        }

        .glass{
          background: rgba(255,255,255,.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,.1);
        }
      `}</style>

      <nav className={`fixed top-0 inset-x-0 z-50 flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-10 2xl:px-16 py-3 sm:py-4 transition-all duration-500 ${scrollY > 20 ? "glass border-b border-white/20" : "bg-transparent"}`}>
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-lg font-black text-black sm:h-10 sm:w-10">T</div>
          <span className="heading text-lg tracking-wider text-white sm:text-xl">TURFBOOK</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden xl:flex items-center gap-8">
          <Link href="/" className="text-sm text-gray-300 hover:text-white transition-colors font-medium">Explore</Link>
          <Link href="/" className="text-sm text-gray-300 hover:text-white transition-colors font-medium">Sports</Link>
          <Link href="/dashboard/booking/turfs" className="text-sm text-gray-300 hover:text-white transition-colors font-medium">Turfs</Link>
          <Link href="/" className="text-sm text-gray-300 hover:text-white transition-colors font-medium">Pricing</Link>
        </div>

        {/* CTA Buttons */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <form onSubmit={submitSearch} role="search" className="hidden 2xl:flex items-center rounded-full border border-white/15 bg-white/[.06] px-3 py-2 focus-within:border-lime-300/70">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="mr-2 h-4 w-4 text-gray-400" stroke="currentColor" strokeWidth="2"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" strokeLinecap="round" /></svg>
            <input aria-label="Search turfs" value={searchValue} onChange={(event) => setSearchValue(event.target.value)} placeholder="Search turfs" className="w-28 bg-transparent text-sm text-white outline-none placeholder:text-gray-500 xl:w-36" />
            <button aria-label="Submit search" className="text-xs font-semibold text-lime-300">Search</button>
          </form>
          <button type="button" onClick={openNearbySearch} className="hidden 2xl:inline-flex items-center gap-2 rounded-full border border-lime-300/40 px-3 py-2 text-sm font-semibold text-lime-200 transition hover:bg-lime-300/10">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>
            Nearby
          </button>
          {user ? (
            <div className="relative">
              <button
                type="button"
                aria-label="Open profile menu"
                aria-expanded={profileMenuOpen}
                title={user.name || "My profile"}
                onClick={() => setProfileMenuOpen((open) => !open)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition hover:border-lime-300 hover:bg-white/20"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M5 20c.6-3.2 3.2-5 7-5s6.4 1.8 7 5" strokeLinecap="round" />
                </svg>
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 top-12 z-50 min-w-48 rounded-xl border border-white/15 bg-[#111] p-2 shadow-2xl">
                  <p className="truncate px-3 py-2 text-xs text-gray-400">{user.name || user.email}</p>
                  <Link onClick={() => setProfileMenuOpen(false)} href="/dashboard" className="block rounded-lg px-3 py-2 text-sm text-white hover:bg-white/10">My profile</Link>
                  <Link onClick={() => setProfileMenuOpen(false)} href="/dashboard#profile-edit" className="block rounded-lg px-3 py-2 text-sm text-white hover:bg-white/10">Edit profile</Link>
                  <button type="button" onClick={handleLogout} className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/10">Log out</button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-1 sm:flex">
              <Link href="/auth/login" className="text-sm text-gray-300 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-all font-medium">
                Sign in
              </Link>
              <Link href="/auth/register" className="text-sm text-gray-300 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-all font-medium">
                Sign up
              </Link>
            </div>
          )}
          {!pathname.startsWith("/dashboard") && (
            <Link href="/dashboard/booking/turfs" className="cta-primary hidden px-5 py-2.5 text-sm font-black text-black sm:inline-flex rounded-lg">
              Book Now
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-1.5 rounded-lg border border-white/15 xl:hidden"
          >
            <span className={`h-0.5 w-full bg-white transition-all ${mobileMenuOpen ? "rotate-45 translate-y-2.5" : ""}`}></span>
            <span className={`h-0.5 w-full bg-white transition-all ${mobileMenuOpen ? "opacity-0" : ""}`}></span>
            <span className={`h-0.5 w-full bg-white transition-all ${mobileMenuOpen ? "-rotate-45 -translate-y-2.5" : ""}`}></span>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-black border-b border-white/20 xl:hidden">
            <div className="flex flex-col gap-4 px-6 py-6">
              <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">Explore</Link>
              <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">Sports</Link>
              <Link href="/dashboard/booking/turfs" className="text-sm text-gray-400 hover:text-white transition-colors">Turfs / Search</Link>
              <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</Link>
              {!pathname.startsWith("/dashboard") && (
                <Link href="/dashboard/booking/turfs" onClick={() => setMobileMenuOpen(false)} className="cta-primary inline-flex w-full justify-center rounded-lg px-5 py-3 text-sm font-black text-black sm:hidden">
                  Book Now
                </Link>
              )}
              <form onSubmit={submitSearch} role="search" className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/[.06] px-3 py-2 focus-within:border-lime-300/70">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-gray-400" stroke="currentColor" strokeWidth="2"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" strokeLinecap="round" /></svg>
                <input aria-label="Search turfs" value={searchValue} onChange={(event) => setSearchValue(event.target.value)} placeholder="Search turfs" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-500" />
                <button className="text-sm font-bold text-lime-300">Search</button>
              </form>
              <button type="button" onClick={openNearbySearch} className="flex items-center gap-2 text-left text-sm font-semibold text-lime-200">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>
                Find turfs near me
              </button>
              <hr className="border-gray-700" />
              {user ? (
                <>
                  <Link href="/dashboard" className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white">
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.6-3.2 3.2-5 7-5s6.4 1.8 7 5" strokeLinecap="round" /></svg>
                    </span>
                    My profile {user.name ? `· ${user.name}` : ""}
                  </Link>
                  <Link href="/dashboard#profile-edit" className="pl-12 text-sm text-gray-400 hover:text-white transition-colors">Edit profile</Link>
                  <button type="button" onClick={handleLogout} className="pl-12 text-left text-sm text-red-300 hover:text-red-200 transition-colors">Log out</button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="text-sm text-gray-400 hover:text-white transition-colors">Sign in</Link>
                  <Link href="/auth/register" className="text-sm text-gray-400 hover:text-white transition-colors">Sign up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
