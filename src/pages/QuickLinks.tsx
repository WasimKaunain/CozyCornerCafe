import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function QuickLinks() {
  const links = [
    { name: "📍 Visit Us", url: "https://www.google.com/maps/place/Cozy+Corner+Cafe/@24.6763672,46.6996172,17z/data=!3m1!4b1!4m6!3m5!1s0x3e2f05140d4f4955:0xbf0491937c4649e7!8m2!3d24.6763672!4d46.6996172!16s%2Fg%2F11n48rn5vn?entry=ttu&g_ep=EgoyMDI2MDQwMS4wIKXMDSoASAFQAw%3D%3D" },
    { name: "📸 Instagram", url: "https://www.instagram.com/cozycornersa.cafe/?hl=en" },
    { name: "💬 WhatsApp", url: "https://wa.me/966583236711" },
    { name: "🌐 Website", url: "https://cozy-corner-cafe-wasimkaunains-projects.vercel.app/" },
    { name: "👍 Facebook", url: "https://www.facebook.com/profile.php?id=61574238234936" },
  ];

  const targetDate = new Date("May 01, 2026 00:00:00").getTime();
  const [timeLeft, setTimeLeft] = useState(targetDate - new Date().getTime());
  const [isLive, setIsLive] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = targetDate - new Date().getTime();

      if (diff <= 0) {
        setIsLive(true);
        setTimeLeft(0);

        confetti({
          particleCount: 200,
          spread: 120,
          origin: { y: 0.6 },
        });

        clearInterval(timer);
      } else {
        setTimeLeft(diff);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const days = Math.max(Math.floor(timeLeft / (1000 * 60 * 60 * 24)), 0);
  const hours = Math.max(Math.floor((timeLeft / (1000 * 60 * 60)) % 24), 0);
  const minutes = Math.max(Math.floor((timeLeft / (1000 * 60)) % 60), 0);
  const seconds = Math.max(Math.floor((timeLeft / 1000) % 60), 0);


  return (
    <>
<AnimatePresence>
  {showBanner && (
    <motion.div
      initial={{ y: "-100%", scale: 0.96 }}
      animate={{ y: 0, scale: 1 }}
      exit={{ y: "-100%" }}
      transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1] }}
      className="fixed top-0 left-0 w-full z-[9999] flex justify-center backdrop-blur-sm"
    >
      <div className="relative w-[92%] md:w-[600px] h-[60vh] mt-4 
        bg-gradient-to-b from-[#3b2a1f] via-[#24180f] to-[#120c07] 
        text-white rounded-b-[45px] shadow-2xl 
        border border-coffee-gold/30 overflow-hidden flex flex-col">

        {/* 🎭 Curtain folds */}
        <div className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                to right,
                rgba(255,255,255,0.08) 0px,
                rgba(255,255,255,0.08) 2px,
                transparent 2px,
                transparent 20px
              )
            `
          }}
        />

        {/* Top glow */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => setShowBanner(false)}
          className="absolute top-4 right-4 text-white/70 hover:text-white z-10"
        >
          <X size={22} />
        </button>

        {/* Content */}
        <div className="flex flex-col justify-between h-full px-6 py-8 text-center">

          {/* 🔝 HEADER */}
          <div className="space-y-4">

            <h2 
              className="text-3xl md:text-4xl font-bold text-coffee-gold"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              ✨ Grand Opening ✨
            </h2>

            {/* ✨ Premium Quote */}
            <p 
              className="text-base md:text-lg text-white/80 leading-relaxed italic"
              style={{ fontFamily: "'Great Vibes', cursive" }}>
              “Where every cup tells a story, and every visit feels like home.”
            </p>

          </div>

          {/* 🔥 DATE SECTION */}
          <div className="space-y-4">

            <div className="text-5xl md:text-6xl text-coffee-gold animate-pulse tracking-widest drop-shadow-[0_0_15px_rgba(255,215,0,0.6)]" style={{ fontFamily: "'Cinzel', serif" }}>
              1<sup className="text-3xl ml-1">ST</sup> MAY
            </div>

            <div className="text-xl tracking-[0.3em] text-white/70">
              2026
            </div>

            <p className="text-white/60 text-sm italic">
              Mark your calendar & join the celebration
            </p>

          </div>

          {/* 🎁 BIG OFFER CARD */}
          <div className="flex-1 flex flex-col justify-end mt-4">

            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 
              border border-white/20 shadow-inner space-y-4">

              <h3 className="text-xl font-bold text-coffee-gold">
                🎉 Mega Opening Offer
              </h3>

              <div className="space-y-2 text-lg font-semibold">
                <p>☕ 50% OFF on all drinks</p>
                <p>🥐 30% OFF on all snacks</p>
              </div>

              {/* Icons */}
              <div className="flex justify-center gap-6 text-3xl pt-2">
                ☕ 🍹 🥐 🍰
              </div>

            </div>

          </div>

        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>

    <div className={`${showBanner ? "mt-40 md:mt-48" : ""}`}>
      <div className="relative min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#f5e6d3] via-[#e8d3b9] to-[#d6bfa7] overflow-hidden">
    
        {/* 🌟 Background Glow */}
        <div className="absolute w-[500px] h-[500px] bg-coffee-gold/20 blur-3xl rounded-full top-[-120px] left-[-120px]" />
        <div className="absolute w-[400px] h-[400px] bg-coffee-dark/10 blur-3xl rounded-full bottom-[-120px] right-[-120px]" />
    
        {/* 🔥 Premium Card */}
        <div className="relative w-full max-w-md rounded-3xl 
          bg-white/40 backdrop-blur-2xl 
          border border-white/50 
          shadow-[0_25px_80px_rgba(0,0,0,0.2)] 
          px-6 py-10 text-center overflow-hidden">
          
          {/* Inner highlight */}
          <div className="absolute inset-0 rounded-3xl border border-white/20 pointer-events-none" />
    
          {/* 🎉 OFFER */}
          <div className="mb-6 px-5 py-3 rounded-full bg-coffee-dark text-white font-semibold shadow-md animate-pulse text-sm">
            🎉 50% OFF on Drinks & 20% OFF on Snacks
          </div>
    
          {/* Logo */}
          <img src="/cozy-corner-logo-transparent.svg" className="w-20 mb-3 mx-auto drop-shadow-md" />
    
          {/* Title */}
          <h1 className="text-2xl font-bold text-coffee-dark">
            Cozy Corner Cafe
          </h1>
    
          {/* Tagline */}
          <p className="text-sm text-coffee-dark/70 mb-5 italic">
            Your cozy escape in Riyadh ☕
          </p>
    
          {/* ⏳ COUNTDOWN / LIVE */}
          {!isLive ? (
            <div className="mb-8 flex justify-center gap-3">
              {[ 
                { label: "D", value: days },
                { label: "H", value: hours },
                { label: "M", value: minutes },
                { label: "S", value: seconds },
              ].map((item, i) => (
                <div key={i} className="bg-white px-3 py-2 rounded-lg shadow text-center">
                  <p className={`text-lg font-bold ${
                    item.label === "S" ? "animate-pulse" : ""
                  }`}>
                    {String(item.value).padStart(2, "0")}
                  </p>
                  <p className="text-[10px] text-gray-500">{item.label}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mb-8 px-6 py-3 rounded-full bg-green-600 text-white font-bold text-lg shadow-lg animate-bounce">
              🔴 We Are Now Open!
            </div>
          )}
  
          {/* 🔥 BUTTONS (UPDATED CONTRAST) */}
          <div className="space-y-4">
            {links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-4 rounded-full 
                bg-white text-coffee-dark 
                font-semibold shadow-md
                transition-all duration-300 
                hover:scale-105 hover:bg-coffee-dark hover:text-white 
                hover:shadow-xl"
              >
                {link.name}
              </a>
            ))}
          </div>
          
          {/* Footer */}
          <p className="text-xs text-coffee-dark/50 mt-8">
            © Cozy Corner Cafe
          </p>
        </div>
      </div>
    </div>
    </>
  );
}