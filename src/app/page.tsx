"use client";
import { useState, useEffect } from "react";
import { getApprovedTurfs } from "@/src/services/turfService";

export default function Home() {
  const [allTurfs, setAllTurfs] = useState<any[]>([]);
  const [filter, setFilter] = useState("All");
  const [booked, setBooked] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const sports = ["All", "Football", "Cricket", "Badminton", "Tennis", "Basketball"];

  useEffect(() => {
    fetchTurfs();
  }, []);

  const fetchTurfs = async () => {
    setLoading(true);
    const result = await getApprovedTurfs();
    if (result.success) {
      setAllTurfs(result.data);
    }
    setLoading(false);
  };

  const filtered = filter === "All"
    ? allTurfs
    : allTurfs.filter(t => t.sportsAvailable && t.sportsAvailable.includes(filter));

  const stats = [
    { num: "200+", label: "Turfs", sub: "across the city" },
    { num: "50K+", label: "Players", sub: "trust us daily" },
    { num: "15+", label: "Sports", sub: "categories" },
    { num: "4.9", label: "Rating", sub: "avg. user score" },
  ];

  const features = [
    { icon: "⚡", title: "Instant Booking", desc: "Confirm your slot in under 30 seconds. Lightning-fast booking" },
    { icon: "📍", title: "Nearby Locations", desc: "Find premium turfs near you with real-time availability" },
    { icon: "🔒", title: "Secure Payments", desc: "100% encrypted transactions. Pay online or at venue." },
    { icon: "📅", title: "Easy Scheduling", desc: "Flexible scheduling with instant confirmation and reminders" },
  ];

  return (
    <div className="bg-black text-white min-h-screen overflow-x-hidden" style={{ fontFamily:"'Poppins','Bebas Neue',sans-serif", backgroundColor:"#0B0B0B" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Bebas+Neue&display=swap');
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:8px}
        ::-webkit-scrollbar-track{background:#0B0B0B}
        ::-webkit-scrollbar-thumb{background:#ffffff;border-radius:99px}

        body { font-family: 'Poppins', sans-serif; }
        h1, h2, h3, .heading { font-family: 'Bebas Neue', sans-serif; letter-spacing: 1px; font-weight: 700; }

        .stat-num{
          color: #ffffff;
          font-weight: 900;
        }

        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        .au{animation:fadeUp .6s ease both}
        .d1{animation-delay:.1s}.d2{animation-delay:.25s}.d3{animation-delay:.4s}.d4{animation-delay:.55s}

        .turf-card{transition:all .3s ease}
        .turf-card:hover{transform:translateY(-8px)}
        .turf-card:hover .card-image{transform:scale(1.08)}

        .card-image{transition:transform .3s ease;overflow:hidden;border-radius:12px}

        .live-dot{animation:livepulse 2s ease-in-out infinite}
        @keyframes livepulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(1.2)}}

        .cta-primary{
          background: #ffffff;
          color: #0B0B0B;
          position:relative;overflow:hidden;transition:all .3s;
          box-shadow: 0 4px 12px rgba(255,255,255,.2);
        }
        .cta-primary:hover{
          background: #f0f0f0;
          box-shadow: 0 8px 20px rgba(255,255,255,.3);
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
          box-shadow: 0 4px 12px rgba(255,255,255,.15);
        }

        .glass{
          background: rgba(255,255,255,.04);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,.08);
        }

        .energy-pulse{animation:energypulse 2s ease-in-out infinite}
        @keyframes energypulse{0%,100%{opacity:.8}50%{opacity:1}}
      `}</style>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center px-6 lg:px-16 pt-24 pb-20 overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-900"/>
          <img
            src="https://images.unsplash.com/photo-1552993881-338f5c15a658?w=1600&h=900&fit=crop"
            alt="Sports turf background"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"/>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 blur-3xl pointer-events-none"/>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/3 blur-3xl pointer-events-none"/>
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="au d1 inline-flex items-center gap-2.5 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8">
            <span className="live-dot w-2.5 h-2.5 rounded-full bg-white inline-block"/>
            <span className="text-white text-xs font-bold tracking-wide">LIVE BOOKINGS AVAILABLE</span>
          </div>

          <h1 className="au d2 heading text-6xl md:text-7xl xl:text-8xl leading-[0.95] tracking-tight mb-6 max-w-4xl">
            Book Your Game.<br/>
            <span className="stat-num">Play Like a Pro.</span>
          </h1>

          <p className="au d3 text-gray-300 text-lg md:text-xl leading-relaxed max-w-2xl mb-10">
            Find and book premium sports turfs near you instantly. Real-time availability, instant confirmation, and zero hassle.
          </p>

          <div className="au d4 flex flex-col sm:flex-row items-start gap-4 mb-12">
            <a href="/dashboard" className="cta-primary text-base font-black text-black px-8 py-4 rounded-lg hover:shadow-2xl transition-all flex items-center gap-2">
              <span>BOOK NOW</span>
              <span className="text-xl">→</span>
            </a>
            <a href="/dashboard/booking/turfs" className="cta-secondary text-base font-bold px-8 py-4 rounded-lg">
              EXPLORE TURFS
            </a>
          </div>

          <div className="au d4 flex flex-wrap gap-3">
            {["Football", "Cricket", "Badminton", "Tennis", "Basketball"].map(s => (
              <button
                key={s}
                className="px-5 py-2.5 rounded-full border-2 border-gray-700 text-white font-bold text-sm transition-all hover:border-white hover:bg-white/10 cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* BROWSE BY SPORT SECTION */}
      <section className="px-6 lg:px-16 py-24 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 text-xs text-white font-black tracking-widest uppercase mb-6 heading justify-center">
              <span className="w-6 h-px bg-white inline-block"/> Browse Sports
            </span>
            <h2 className="heading text-5xl md:text-6xl tracking-tight mb-4">Choose Your Sport</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Find and book turfs for your favorite sport</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {[
              { name: "Football", count: "45 turfs" },
              { name: "Cricket", count: "38 turfs" },
              { name: "Badminton", count: "32 turfs" },
              { name: "Tennis", count: "28 turfs" },
              { name: "Basketball", count: "35 turfs" },
              { name: "Volleyball", count: "22 turfs" },
              { name: "Hockey", count: "18 turfs" },
              { name: "Boxing", count: "24 turfs" },
            ].map((sport, i) => (
              <a
                key={sport.name}
                href="/dashboard/booking/turfs"
                className="au group glass p-8 rounded-xl border border-gray-700 hover:border-white/30 transition-all duration-300 cursor-pointer text-center"
                style={{ animationDelay: `${0.1 + i * 0.08}s` }}
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-2xl font-black text-white">{sport.name.charAt(0)}</span>
                </div>
                <h3 className="heading font-black text-lg mb-2">{sport.name}</h3>
                <p className="text-gray-400 text-sm">{sport.count}</p>
                <div className="mt-4 pt-4 border-t border-gray-700 opacity-0 group-hover:opacity-100 transition-all">
                  <span className="text-white text-xs font-bold">Browse Now</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="px-6 lg:px-16 py-24 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-5">
          {stats.map((s,i)=>(
            <div key={s.label} className="au group relative glass rounded-xl p-8 text-center overflow-hidden hover:border-white/30 transition-all duration-300" style={{ animationDelay: `${0.1 + i * 0.15}s` }}>
              <p className="stat-num text-5xl font-black mb-3">{s.num}</p>
              <p className="font-black text-sm text-white mb-1 heading">{s.label}</p>
              <p className="text-gray-500 text-xs">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mx-6 lg:mx-16"/>

      {/* FEATURED TURFS SECTION */}
      <section className="px-6 lg:px-16 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <span className="inline-flex items-center gap-2 text-xs text-white font-black tracking-widest uppercase mb-4 heading">
                <span className="w-6 h-px bg-white inline-block"/> Hot Picks
              </span>
              <h2 className="heading text-5xl md:text-6xl tracking-tight">Premium Turfs</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {sports.map(s=>(
                <button key={s} onClick={()=>setFilter(s)}
                  className={`text-xs px-5 py-2.5 rounded-lg border font-black transition-all ${filter===s?"bg-white border-white text-black":"bg-transparent border-gray-600 text-gray-400 hover:border-white/60 hover:text-white"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-center py-20">
                <p className="text-gray-400 text-lg">Loading premium turfs...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <p className="text-gray-400 text-lg">No turfs available for this sport</p>
              </div>
            ) : (
              filtered.map((t, i) => (
                <div key={t.id} className={`au turf-card group bg-black/40 border border-gray-700 rounded-2xl overflow-hidden cursor-pointer transition-all hover:border-white/40`} style={{ animationDelay: `${0.1 + i * 0.12}s` }}>
                  <div className="card-image relative h-48 overflow-hidden bg-gradient-to-br from-white/10 to-white/5">
                    <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40" />
                    {t.metaInfo?.isFeatured && (
                      <span className="absolute top-4 left-4 text-xs font-black px-4 py-1.5 rounded-full bg-white text-black">
                        Featured
                      </span>
                    )}
                    {t.metaInfo?.isTrending && (
                      <span className="absolute top-4 left-4 text-xs font-black px-4 py-1.5 rounded-full bg-white text-black">
                        Trending
                      </span>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="heading text-lg font-black mb-1">{t.name}</h3>
                        <p className="text-gray-500 text-sm">{t.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-white">₹{t.price}</p>
                        <p className="text-gray-500 text-xs">per hour</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-6 pb-6 border-b border-gray-700">
                      <span>Rating: <span className="text-white font-bold">{t.rating || "N/A"}</span></span>
                      <span>·</span>
                      <span className="text-white font-bold">{t.sportsAvailable?.[0] || t.sport}</span>
                      <span>·</span>
                      <span>{t.slots}</span>
                    </div>
                    <a
                      href={`/dashboard/booking/turfs?turf=${t.id}`}
                      className="w-full py-3 rounded-lg text-sm font-black transition-all duration-300 block text-center cta-primary text-black hover:shadow-xl"
                    >
                      BOOK NOW
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="text-center mt-16">
            <a href="/dashboard/booking/turfs" className="inline-flex items-center gap-2 text-sm font-black text-white border-2 border-white px-8 py-4 rounded-lg hover:bg-white/10 transition-all duration-200">
              LOAD MORE TURFS
            </a>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mx-6 lg:mx-16"/>

      {/* FEATURES SECTION */}
      <section className="px-6 lg:px-16 py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/3 blur-3xl pointer-events-none"/>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/2 blur-3xl pointer-events-none"/>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <span className="inline-flex items-center gap-2 text-xs text-white font-black tracking-widest uppercase mb-6 heading justify-center">
              <span className="w-6 h-px bg-white inline-block"/> Why Choose Us
            </span>
            <h2 className="heading text-5xl md:text-6xl tracking-tight mb-6">Built for Players</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">Lightning-fast booking, premium turfs, and zero compromise on quality.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f,i)=>(
              <div key={f.title} className={`au group glass rounded-xl p-8 hover:border-white/30 transition-all duration-300`} style={{ animationDelay: `${0.1 + i * 0.12}s` }}>
                <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-3xl mb-6 group-hover:bg-white/15 transition-all">{f.icon}</div>
                <h3 className="heading font-black text-lg mb-3">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 lg:px-16 py-24 border-y border-white/20 bg-black/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="inline-flex items-center gap-2 text-xs text-white font-black tracking-widest uppercase mb-6 heading justify-center">
              <span className="w-6 h-px bg-white inline-block"/> The Process
            </span>
            <h2 className="heading text-5xl md:text-6xl tracking-tight mb-6">Play in 3 Steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="absolute hidden md:block top-16 left-[calc(16.66%+40px)] right-[calc(16.66%+40px)] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"/>
            {[
              {icon:"01",t:"Search",        d:"Enter your city and preferred sport to discover available premium turfs."},
              {icon:"02",t:"Pick a Slot",   d:"Browse real-time availability and choose the perfect date and time."},
              {icon:"03",t:"Confirm & Play",d:"Secure payment and instant confirmation. Ready to dominate the game!"},
            ].map((s,i)=>(
              <div key={s.t} className="au relative text-center group" style={{ animationDelay: `${0.1 + i * 0.15}s` }}>
                <div className="relative w-28 h-28 mx-auto mb-8 bg-white/10 border-2 border-white/30 group-hover:border-white/60 rounded-xl flex items-center justify-center text-5xl transition-all duration-300 group-hover:shadow-2xl">
                  {s.icon}
                  <span className="absolute -top-4 -right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center text-black text-xs font-black">{i+1}</span>
                </div>
                <h3 className="heading font-black text-2xl mb-4">{s.t}</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="px-6 lg:px-16 py-32 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[700px] h-[400px] bg-white/5 rounded-full blur-3xl"/>
          <div className="absolute w-[600px] h-[500px] bg-white/3 rounded-full blur-3xl"/>
        </div>

        <div className="relative max-w-4xl mx-auto text-center z-10">
          <div className="inline-block mb-10 bg-white/10 border border-white/20 rounded-xl px-6 py-3">
            <span className="text-white text-sm font-black tracking-widest">50,000+ GAMES BOOKED THIS MONTH</span>
          </div>

          <h2 className="heading text-6xl md:text-7xl tracking-tight leading-[1.1] mb-8">
            Ready to <span className="stat-num">Dominate the Game?</span>
          </h2>

          <p className="text-gray-400 text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
            Join thousands of passionate players booking their perfect turf every single day. Fast, secure, and always available.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/dashboard/booking/turfs" className="cta-primary font-black text-black px-10 py-4 rounded-lg text-lg hover:shadow-2xl transition-all flex items-center gap-2">
              <span>EXPLORE TURFS</span>
              <span>→</span>
            </a>
            <a href="/" className="cta-secondary font-black px-10 py-4 rounded-lg text-lg">
              LIST YOUR TURF
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 lg:px-16 py-16 border-t border-white/20 bg-black/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-black font-black">T</div>
                <span className="heading text-xl">TURFBOOK</span>
              </div>
              <p className="text-gray-500 text-sm">India's #1 sports turf booking platform.</p>
            </div>
            <div>
              <h4 className="heading text-sm font-black mb-4 text-white">PRODUCT</h4>
              <div className="space-y-2">
                {["Explore Turfs","How it Works","Pricing"].map(l=>(
                  <a key={l} href="#" className="text-gray-500 text-sm hover:text-white transition-colors block">{l}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="heading text-sm font-black mb-4 text-white">COMPANY</h4>
              <div className="space-y-2">
                {["About","Blog","Careers"].map(l=>(
                  <a key={l} href="#" className="text-gray-500 text-sm hover:text-white transition-colors block">{l}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="heading text-sm font-black mb-4 text-white">LEGAL</h4>
              <div className="space-y-2">
                {["Privacy","Terms","Support"].map(l=>(
                  <a key={l} href="#" className="text-gray-500 text-sm hover:text-white transition-colors block">{l}</a>
                ))}
              </div>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-8"/>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-xs">© 2025 TURFBOOK. All rights reserved. | Crafted for champions.</p>
            <div className="flex gap-4">
              {["Twitter","Instagram","Facebook"].map(l=>(
                <a key={l} href="#" className="text-white hover:text-gray-400 transition-colors text-xs font-bold">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
