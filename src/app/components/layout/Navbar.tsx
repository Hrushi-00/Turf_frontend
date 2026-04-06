"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

      <nav className={`fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 lg:px-16 py-4 transition-all duration-500 ${scrollY > 20 ? "glass border-b border-white/20" : "bg-transparent"}`}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-black font-black text-lg">T</div>
          <span className="heading text-xl tracking-wider text-white">TURFBOOK</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm text-gray-300 hover:text-white transition-colors font-medium">Explore</Link>
          <Link href="/" className="text-sm text-gray-300 hover:text-white transition-colors font-medium">Sports</Link>
          <Link href="/" className="text-sm text-gray-300 hover:text-white transition-colors font-medium">Turfs</Link>
          <Link href="/" className="text-sm text-gray-300 hover:text-white transition-colors font-medium">Pricing</Link>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="hidden sm:block text-sm text-gray-300 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-all font-medium">
            Sign in
          </Link>
          <Link href="/dashboard" className="cta-primary text-sm font-black text-black px-6 py-2.5 rounded-lg">
            Book Now
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex flex-col gap-1.5 w-6 h-6"
          >
            <span className={`h-0.5 w-full bg-white transition-all ${mobileMenuOpen ? "rotate-45 translate-y-2.5" : ""}`}></span>
            <span className={`h-0.5 w-full bg-white transition-all ${mobileMenuOpen ? "opacity-0" : ""}`}></span>
            <span className={`h-0.5 w-full bg-white transition-all ${mobileMenuOpen ? "-rotate-45 -translate-y-2.5" : ""}`}></span>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-black border-b border-white/20 md:hidden">
            <div className="flex flex-col gap-4 px-6 py-6">
              <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">Explore</Link>
              <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">Sports</Link>
              <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">Turfs</Link>
              <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</Link>
              <hr className="border-gray-700" />
              <Link href="/auth/login" className="text-sm text-gray-400 hover:text-white transition-colors">Sign in</Link>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}