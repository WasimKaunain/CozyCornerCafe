import { useEffect, useState, useRef } from 'react';
import { Coffee, Menu as MenuIcon, X, Leaf, Flame, Wifi, User, Quote, Star,ArrowRight, Calendar, Tag, MapPin, Phone, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/Terms";
import QuickLinks from './pages/QuickLinks';
import SocialHub from './components/SocialHub';
import AdminPanel from "./pages/AdminPanel";

// Header Component
function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Menu', href: '#menu' },
    { name: 'Blog', href: '#blog' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-smooth-out ${
        isScrolled
          ? 'py-3'
          : 'py-5'
      }`}
    >
      <div className="container-custom">
        <div
          className={
            "flex items-center justify-between rounded-3xl border transition-all duration-500 " +
            (isScrolled
              ? "bg-white/85 backdrop-blur-xl shadow-lg border-black/5 px-4 md:px-6 py-3"
              : "bg-black/10 backdrop-blur-md border-white/10 px-4 md:px-6 py-4")
          }
        >
          {/* Logo */}
          <a href="#home" className="flex items-center gap-3 group">
            <img
              src="/cozy-corner-logo-transparent.svg"
              alt="Cozy Corner Cafe"
              className={
                "rounded-xl object-cover transition-transform duration-300 group-hover:scale-105 " +
                (isScrolled ? "w-11 h-11" : "w-12 h-12")
              }
            />
            <div className="leading-tight">
              <div
                className={
                  "font-display font-extrabold tracking-wide transition-colors duration-300 " +
                  (isScrolled ? "text-coffee-dark text-xl" : "text-white text-xl md:text-2xl")
                }
              >
                Cozy Corner Cafe
              </div>
              <div className={"text-xs md:text-sm " + (isScrolled ? "text-coffee-dark/60" : "text-white/70")}>
                Cozy Escape in Riyadh
              </div>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav
            className={
              "hidden md:flex items-center gap-2 rounded-full border px-2 py-2 transition-all duration-500 " +
              (isScrolled
                ? "bg-white/60 border-black/5"
                : "bg-white/10 border-white/15")
            }
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={
                  "relative rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 group " +
                  (isScrolled
                    ? "text-coffee-dark/80 hover:text-coffee-dark hover:bg-black/5"
                    : "text-white/85 hover:text-white hover:bg-white/10")
                }
              >
                {link.name}
                <span className="absolute -bottom-1 left-1/2 w-0 h-0.5 bg-coffee-gold transition-all duration-300 group-hover:w-8 -translate-x-1/2" />
              </a>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Button
              className={
                "font-semibold px-6 py-2 rounded-full transition-all duration-300 hover:-translate-y-0.5 " +
                (isScrolled
                  ? "bg-coffee-gold text-coffee-dark hover:shadow-gold"
                  : "bg-coffee-gold text-coffee-dark hover:shadow-gold-lg")
              }
            >
              Book a Table
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? (
              <X className={`w-6 h-6 ${isScrolled ? 'text-coffee-dark' : 'text-white'}`} />
            ) : (
              <MenuIcon className={`w-6 h-6 ${isScrolled ? 'text-coffee-dark' : 'text-white'}`} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-3 rounded-3xl border border-white/15 bg-white/90 backdrop-blur-xl shadow-lg py-4 px-4 animate-fade-in">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-coffee-dark font-semibold py-3 px-4 rounded-2xl hover:bg-coffee-cream transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <Button className="bg-coffee-gold text-coffee-dark font-semibold mt-2 rounded-2xl py-6">
                Book a Table
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

// Hero Section
function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section id="home" ref={heroRef} className="relative min-h-[92vh] sm:min-h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        {/* Mobile */}
        <img
          src="/hero-bg-mobile.png"
          alt="Coffee shop interior"
          className="w-full h-full object-cover scale-105 sm:hidden"
        />
        {/* Desktop */}
        <img
          src="/hero-bg.png"
          alt="Coffee shop interior"
          className="hidden sm:block w-full h-full object-cover scale-105"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b sm:bg-gradient-to-r from-coffee-dark/95 via-coffee-dark/65 to-transparent" />
      </div>

      {/* Steam Particles */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-20 bg-white/10 rounded-full animate-steam"
            style={{
              left: `${55 + i * 9}%`,
              bottom: "18%",
              animationDelay: `${i * 1.5}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-20 pt-24 sm:pt-28 px-4 sm:px-6 w-full">
        <div
          className={
            "group mx-auto ml-0 w-full max-w-[560px] rounded-[28px] sm:rounded-[34px] border border-white/15 bg-black/25 backdrop-blur-2xl shadow-[0_28px_90px_rgba(0,0,0,0.45)] p-6 sm:p-8 md:p-10 transition-all duration-700 hover:bg-white/5 hover:border-white/25 hover:backdrop-blur-sm active:bg-white/5 active:border-white/25 active:backdrop-blur-sm " +
            (isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")
          }
          style={{ transitionDelay: "600ms" }}
        >
          <p className="font-script text-coffee-gold text-2xl sm:text-3xl md:text-4xl mb-3 transition-colors duration-300 group-hover:text-coffee-dark group-active:text-coffee-dark">
            Cozy Corner Cafe
          </p>

          <blockquote className="font-display text-3xl sm:text-4xl lg:text-5xl text-white font-extrabold leading-tight transition-colors duration-300 group-hover:text-coffee-dark group-active:text-coffee-dark">
            “Sip slowly, breathe deeply —
            <span className="text-coffee-gold transition-colors duration-300 group-hover:text-coffee-dark group-active:text-coffee-dark"> your calm corner</span> is here.”
          </blockquote>

          <p className="mt-5 text-white/70 text-sm sm:text-base leading-relaxed transition-colors duration-300 group-hover:text-coffee-dark/80 group-active:text-coffee-dark/80">
            A quiet escape in Riyadh — espresso warmth, soft conversations, and time that feels unhurried.
          </p>

          <div className="mt-7 h-px bg-gradient-to-r from-transparent via-coffee-gold/60 to-transparent transition-opacity duration-300 group-hover:opacity-40 group-active:opacity-40" />
          <p className="mt-4 text-white/60 text-xs sm:text-sm transition-colors duration-300 group-hover:text-coffee-dark/70 group-active:text-coffee-dark/70">
            Crafted with passion • Served with perfection
          </p>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-10 right-10 z-20 hidden lg:block">
        <div className="animate-float">
          <Coffee className="w-16 h-16 text-coffee-gold/30" />
        </div>
      </div>
    </section>
  );
}

// About Section
function About() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const features = [
    { icon: Leaf, text: '100% Organic Beans' },
    { icon: Flame, text: 'Artisan Roasted' },
  ];

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative py-20 sm:py-24 md:py-32 bg-coffee-cream overflow-hidden"
    >
      {/* Grain Texture */}
      <div className="absolute inset-0 grain-texture pointer-events-none" />

      {/* Decorative Coffee Beans */}
      <div className="absolute top-20 right-6 sm:right-10 animate-float-slow opacity-20">
        <Coffee className="w-16 sm:w-20 h-16 sm:h-20 text-coffee-gold" />
      </div>
      <div className="absolute bottom-20 left-6 sm:left-10 animate-float opacity-20">
        <Coffee className="w-14 sm:w-16 h-14 sm:h-16 text-coffee-gold" />
      </div>

      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-20 items-center">
          {/* Image */}
          <div
            className={`relative transition-all duration-1200 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
            }`}
            style={{ transitionDelay: '200ms' }}
          >
            <div className="relative max-w-md mx-auto lg:mx-0">
              <img
                src="/about-image.jpg"
                alt="Person enjoying coffee"
                className="w-full rounded-3xl shadow-card-hover transform -rotate-2 hover:rotate-0 transition-transform duration-500"
              />
              {/* Floating Badge */}
              <div className="absolute -bottom-4 right-4 sm:-bottom-6 sm:-right-6 bg-coffee-gold text-coffee-dark p-5 sm:p-6 rounded-2xl shadow-gold animate-float">
                <p className="font-display text-3xl font-bold">10+</p>
                <p className="text-sm font-medium">Years of Excellence</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:pl-8">
            <p
              className={`font-script text-coffee-gold text-2xl mb-3 transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: '400ms' }}
            >
              About Us
            </p>

            <h2
              className={`font-display text-3xl md:text-4xl lg:text-5xl text-coffee-dark font-bold mb-6 transition-all duration-600 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: '500ms' }}
            >
              Crafting Moments, One Cup at a Time
            </h2>

            <p
              className={`text-coffee-dark/70 text-lg leading-relaxed mb-6 transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: '600ms' }}
            >
              For over a decade, we've been passionate about sourcing the finest beans and 
              perfecting the art of brewing. Our journey began with a simple belief: great 
              coffee creates great connections.
            </p>

            <p
              className={`text-coffee-dark/70 leading-relaxed mb-8 transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: '700ms' }}
            >
              Every cup we serve tells a story of dedication, from the farmers who carefully 
              cultivate our beans to our skilled baristas who bring out their full potential. 
              We invite you to be part of our coffee-loving community.
            </p>

            {/* Features */}
            <div className="flex flex-wrap gap-6 mb-8">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 transition-all duration-500 ${
                    isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                  }`}
                  style={{ transitionDelay: `${800 + i * 150}ms` }}
                >
                  <div className="w-12 h-12 bg-coffee-gold/20 rounded-full flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-coffee-gold" />
                  </div>
                  <span className="font-medium text-coffee-dark">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Button
              className={`bg-coffee-dark text-white font-semibold px-8 py-6 rounded-full hover:bg-coffee-gold hover:text-coffee-dark transition-all duration-300 ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
              }`}
              style={{ transitionDelay: '1100ms' }}
            >
              Our Story
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// Features Section
function Features() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: Coffee,
      title: 'Fresh Coffee Beans',
      description: 'Sourced directly from ethical farms and roasted weekly for maximum freshness and flavor.',
    },
    {
      icon: User,
      title: 'Best Baristas',
      description: 'Our skilled baristas are passionate about their craft, ensuring every cup is perfection.',
    },
    {
      icon: Wifi,
      title: 'Free WiFi & Comfortable Space',
      description: 'Work, relax, or connect in our thoughtfully designed space with high-speed internet.',
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative py-24 md:py-32 bg-white overflow-hidden"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(247,195,95,0.05)_0%,_transparent_70%)]" />

      <div className="container-custom relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p
            className={`font-script text-coffee-gold text-2xl mb-3 transition-all duration-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Why Choose Us
          </p>
          <h2
            className={`font-display text-3xl md:text-4xl lg:text-5xl text-coffee-dark font-bold transition-all duration-600 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '100ms' }}
          >
            The Cozy Corner Cafe Experience
          </h2>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 perspective-1000">
          {features.map((feature, i) => (
            <div
              key={i}
              className={`group relative transition-all duration-800 ${
                isVisible ? 'opacity-100 translate-y-0 rotate-x-0' : 'opacity-0 translate-y-24'
              }`}
              style={{ 
                transitionDelay: `${i * 150}ms`,
                transform: isVisible ? `translateY(${i === 1 ? '40px' : i === 2 ? '-20px' : '0'})` : undefined,
              }}
            >
              <div className="bg-white rounded-3xl p-8 md:p-10 shadow-card transition-all duration-500 group-hover:shadow-card-hover group-hover:-translate-y-2 preserve-3d">
                {/* Icon */}
                <div className="w-16 h-16 bg-coffee-gold/20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
                  <feature.icon className="w-8 h-8 text-coffee-gold" />
                </div>

                {/* Content */}
                <h3 className="font-display text-xl md:text-2xl text-coffee-dark font-bold mb-4">
                  {feature.title}
                </h3>
                <p className="text-coffee-dark/60 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Menu Section
function MenuSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // New: manual arrows (quick navigation)
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const menuItems = [
    { name: 'Classic Espresso', price: '$4.50', image: '/menu-1.png' },
    { name: 'Oreo Shake', price: '$5.50', image: '/menu-2.png' },
    { name: 'Club Sandwich', price: '$6.00', image: '/menu-3.png' },
    { name: 'Happy Heart', price: '$5.00', image: '/menu-4.png' },
    { name: 'Mocha Frappe', price: '$6.50', image: '/menu-5.png' },
  ];

  // Duplicate list for seamless looping.
  const loopItems = [...menuItems, ...menuItems, ...menuItems];

  // Continuous slow marquee
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const speedPxPerSecond = 28; // slow continuous speed

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;

      const trackWidth = trackRef.current?.scrollWidth ?? 0;

      setOffset((prev) => {
        if (!trackWidth) return prev;
        const next = prev + speedPxPerSecond * dt;
        const loopPoint = trackWidth / 3;
        return next >= loopPoint ? next - loopPoint : next;
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  function nudge(dir: 'left' | 'right') {
    // Nudge by one card width (responsive)
    const cardW = window.innerWidth < 768 ? 288 : 360;
    const delta = dir === 'left' ? -cardW : cardW;
    setOffset((prev) => {
      const trackWidth = trackRef.current?.scrollWidth ?? 0;
      if (!trackWidth) return prev;
      const loopPoint = trackWidth / 3;
      let next = prev + delta;
      next = ((next % loopPoint) + loopPoint) % loopPoint;
      return next;
    });
  }

  return (
    <section id="menu" ref={sectionRef} className="relative py-20 sm:py-24 md:py-32 overflow-hidden bg-brand-navy">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(195,160,89,0.22)_0%,transparent_55%)]" />
      <div className="absolute inset-0 grain-texture pointer-events-none opacity-10" />

      <div className="container-custom relative z-10">
        <div className="text-center mb-10 sm:mb-12">
          <p className="font-script text-brand-gold text-2xl mb-3">Menu Carousel</p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-white font-bold">Our Signature Menu</h2>
          <p className="mt-4 text-white/65 max-w-2xl mx-auto">
            Swipe on mobile or use arrows to jump quickly.
          </p>
        </div>

        <div className="relative">
          {/* Arrows */}
          <div className="absolute -top-2 right-0 flex gap-2 z-20">
            <button
              onClick={() => nudge('left')}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white/85 backdrop-blur-xl transition hover:bg-white/15"
              aria-label="Previous menu item"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => nudge('right')}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white/85 backdrop-blur-xl transition hover:bg-white/15"
              aria-label="Next menu item"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Edge fade */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-14 sm:w-24 bg-gradient-to-r from-brand-navy to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-14 sm:w-24 bg-gradient-to-l from-brand-navy to-transparent z-10" />

          <div
            ref={viewportRef}
            className="overflow-hidden rounded-[24px] sm:rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl"
          >
            <div
              ref={trackRef}
              className="flex py-7 sm:py-8"
              style={{
                transform: `translateX(${-offset}px)`,
                willChange: 'transform',
              }}
            >
              {loopItems.map((item, i) => (
                <div key={`${item.name}-${i}`} className="px-3 sm:px-4">
                  <div
                    className={`group relative w-[280px] sm:w-[320px] md:w-[360px] h-[400px] sm:h-[420px] rounded-3xl overflow-hidden border border-white/10 bg-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.35)] transition-all duration-700 ${
                      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
                    style={{ transitionDelay: `${(i % menuItems.length) * 80}ms` }}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 transition"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/20 to-transparent" />

                    <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-brand-navy/70 border border-white/10 px-3 py-1 text-xs text-white/85">
                      <span className="w-2 h-2 rounded-full bg-brand-gold" />
                      Signature
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="font-display text-2xl text-white font-bold mb-2">{item.name}</h3>
                      <div className="mt-4 h-px bg-gradient-to-r from-brand-gold/0 via-brand-gold/60 to-brand-gold/0" />
                      <p className="mt-4 text-white/60 text-sm">Smooth, balanced, and crafted to match the Cozy Corner vibe.</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Testimonials Section
function Testimonials() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const testimonials = [
    {
      quote: "The best coffee in the city. Period. The atmosphere is unmatched and the baristas truly care about their craft.",
      name: "Sarah Mitchell",
      role: "Coffee Enthusiast",
      avatar: "/avatar-1.jpg",
      rating: 5,
    },
    {
      quote: "My morning ritual isn't complete without a visit here. The vanilla latte is perfection in a cup.",
      name: "James Chen",
      role: "Regular Customer",
      avatar: "/avatar-2.jpg",
      rating: 5,
    },
    {
      quote: "A hidden gem with incredible attention to detail. From the beans to the ambiance, everything is thoughtfully curated.",
      name: "Emma Rodriguez",
      role: "Food Blogger",
      avatar: "/avatar-3.jpg",
      rating: 5,
    },
  ];

  const next = () => setActiveIndex((prev) => (prev + 1) % testimonials.length);
  const prev = () => setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  return (
    <section
      ref={sectionRef}
      className="relative py-24 md:py-32 bg-coffee-cream overflow-hidden"
    >
      {/* Decorative Quote */}
      <div className="absolute top-20 left-10 text-coffee-gold/10">
        <Quote className="w-40 h-40" />
      </div>

      <div className="container-custom relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p
            className={`font-script text-coffee-gold text-2xl mb-3 transition-all duration-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Testimonials
          </p>
          <h2
            className={`font-display text-3xl md:text-4xl lg:text-5xl text-coffee-dark font-bold transition-all duration-600 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '100ms' }}
          >
            What Our Guests Say
          </h2>
        </div>

        {/* Testimonial Slider */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Cards */}
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-smooth-out"
                style={{ transform: `translateX(-${activeIndex * 100}%)` }}
              >
                {testimonials.map((testimonial, i) => (
                  <div
                    key={i}
                    className="w-full flex-shrink-0 px-4"
                  >
                    <div className="bg-white rounded-3xl p-8 md:p-12 shadow-card">
                      {/* Quote Icon */}
                      <Quote className="w-12 h-12 text-coffee-gold/30 mb-6" />

                      {/* Rating */}
                      <div className="flex gap-1 mb-6">
                        {[...Array(testimonial.rating)].map((_, j) => (
                          <Star key={j} className="w-5 h-5 text-coffee-gold fill-coffee-gold" />
                        ))}
                      </div>

                      {/* Quote Text */}
                      <p className="font-display text-xl md:text-2xl text-coffee-dark leading-relaxed mb-8">
                        "{testimonial.quote}"
                      </p>

                      {/* Author */}
                      <div className="flex items-center gap-4">
                        <img
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-semibold text-coffee-dark">{testimonial.name}</p>
                          <p className="text-coffee-dark/60 text-sm">{testimonial.role}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={prev}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-card hover:shadow-card-hover hover:bg-coffee-gold hover:text-coffee-dark transition-all duration-300"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={next}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-card hover:shadow-card-hover hover:bg-coffee-gold hover:text-coffee-dark transition-all duration-300"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    i === activeIndex ? 'bg-coffee-gold w-8' : 'bg-coffee-dark/20'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Blog Section
function Blog() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const posts = [
    {
      title: 'The Art of Pour-Over Coffee',
      category: 'Tips & Guides',
      date: 'March 15, 2024',
      image: '/blog-1.jpg',
    },
    {
      title: 'Meet Our Bean Farmers',
      category: 'Behind the Scenes',
      date: 'March 10, 2024',
      image: '/blog-2.jpg',
    },
    {
      title: 'Spring Seasonal Blends',
      category: 'New Arrivals',
      date: 'March 5, 2024',
      image: '/blog-3.jpg',
    },
  ];

  return (
    <section id="blog" ref={sectionRef} className="relative py-20 sm:py-24 md:py-32 bg-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(135deg, transparent 48%, rgba(247,195,95,0.03) 50%, transparent 52%)',
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="container-custom relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <p
            className={`font-script text-coffee-gold text-2xl mb-3 transition-all duration-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            From Our Blog
          </p>
          <h2
            className={`font-display text-3xl md:text-4xl lg:text-5xl text-coffee-dark font-bold transition-all duration-600 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '100ms' }}
          >
            Coffee Stories & Brewing Tips
          </h2>
        </div>

        {/* Blog Grid */}
        <div className="grid gap-8 md:grid-cols-3">
          {posts.map((post, i) => (
            <article
              key={i}
              className={`group cursor-pointer transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
              }`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <div className="bg-white rounded-3xl overflow-hidden shadow-card transition-all duration-500 group-hover:shadow-card-hover group-hover:-translate-y-2">
                {/* Image */}
                <div className="h-52 sm:h-56 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Meta */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-coffee-dark/60">
                    <span className="flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {post.date}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-xl text-coffee-dark font-bold mb-4 group-hover:text-coffee-gold transition-colors">
                    {post.title}
                  </h3>

                  {/* Read More */}
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 text-coffee-gold font-semibold group/link"
                  >
                    Read More
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// Footer Section
function Footer() {
  const [email, setEmail] = useState('');

  const quickLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About Us', href: '#about' },
    { name: 'Our Menu', href: '#menu' },
    { name: 'Blog', href: '#blog' },
    { name: 'Contact', href: '#contact' },
  ];

  // Duplicate for seamless marquee
  const marqueeLinks = [...quickLinks, ...quickLinks, ...quickLinks];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thank you for subscribing!');
    setEmail('');
  };

  return (
    <footer id="contact" className="relative bg-brand-navy pt-24 pb-10 overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(195,160,89,0.22)_0%,transparent_55%),radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.08)_0%,transparent_55%)] pointer-events-none" />
      <div className="absolute inset-0 grain-texture opacity-10 pointer-events-none" />

      {/* Subtle steam */}
      <div className="absolute bottom-0 left-0 right-0 h-44 pointer-events-none overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute w-20 h-44 bg-white/5 rounded-full blur-xl animate-steam"
            style={{ left: `${15 + i * 35}%`, animationDelay: `${i * 2}s` }}
          />
        ))}
      </div>

      <div className="container-custom relative z-10">
        {/* Section heading */}
        <div className="text-center mb-12">
          <p className="font-script text-brand-gold text-2xl mb-2">Get in touch</p>
          <h3 className="font-display text-3xl md:text-4xl text-white font-bold">Visit Cozy Corner Cafe</h3>
          <p className="mt-3 text-white/65 max-w-2xl mx-auto">
            Find us easily, reach out anytime, or subscribe for seasonal blends and exclusive offers.
          </p>
        </div>

        {/* Glass grid */}
        <div className="grid lg:grid-cols-12 gap-6 mb-12">
          {/* Brand */}
          <div className="lg:col-span-4 rounded-[28px] border border-white/15 bg-white/10 backdrop-blur-2xl shadow-[0_28px_90px_rgba(0,0,0,0.35)] p-7">
            <a href="#home" className="flex items-center gap-3">
              <img
                src="/cozy-corner-logo-transparent.svg"
                alt="Cozy Corner Cafe"
                className="w-11 h-11 rounded-xl object-cover"
              />
              <div>
                <p className="font-display text-xl font-bold text-white">Cozy Corner Cafe</p>
                <p className="text-white/60 text-sm">Riyadh • Coffee & Calm</p>
              </div>
            </a>

            <p className="mt-5 text-white/65 leading-relaxed">
              Crafting moments, one cup at a time — premium beans, cozy pace, and a space designed for friends and focus.
            </p>

            <div className="mt-6 h-px bg-gradient-to-r from-brand-gold/0 via-brand-gold/60 to-brand-gold/0" />

            <div className="mt-6">
              <p className="text-white/60 text-sm">Quick Links page</p>

              <a
                href="/links"
                className="mt-3 group relative block w-full rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl px-5 py-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/15"
              >
                {/* 3D / glass highlights */}
                <span className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.20),inset_0_-18px_28px_rgba(0,0,0,0.22)]" />
                <span className="pointer-events-none absolute -top-10 -left-10 h-32 w-32 rounded-full bg-brand-gold/18 blur-2xl opacity-60 group-hover:opacity-90 transition-opacity" />

                <span className="relative flex items-center justify-between">
                  <span>
                    <span className="block text-white font-semibold">Grab Today’s Voucher</span>
                    <span className="mt-1 block text-xs text-white/60">
                      Claim your launch offer + promo code before it’s gone
                    </span>
                  </span>
                  <span className="relative inline-flex items-center rounded-2xl bg-brand-gold text-brand-navy font-extrabold px-4 py-2 shadow-[0_16px_44px_rgba(195,160,89,0.34)] ring-1 ring-brand-gold/60 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_22px_60px_rgba(195,160,89,0.48)]">
                    <span className="absolute -inset-0.5 rounded-2xl bg-brand-gold/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative">Open</span>
                  </span>
                </span>
              </a>
            </div>

            <div className="mt-6">
              <SocialHub />
            </div>
          </div>

          {/* Contact card */}
          <div className="lg:col-span-4 rounded-[28px] border border-brand-gold/25 bg-brand-gold/10 backdrop-blur-2xl shadow-[0_28px_90px_rgba(0,0,0,0.35)] p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-brand-gold font-semibold">Contact</p>
                <h4 className="mt-1 font-display text-2xl font-bold text-white">We’d love to see you</h4>
              </div>
              <span className="inline-flex items-center rounded-full bg-brand-navy/50 border border-white/10 px-3 py-1 text-xs text-white/80">
                Open soon
              </span>
            </div>

            <ul className="mt-6 space-y-4">
              <li className="flex items-start gap-3 text-white/70">
                <span className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-brand-gold" />
                </span>
                <span>
                  Askan Building No. 17, Prince Mansour Bin Abdulaziz Street, Al Olaya, Riyadh 12611
                </span>
              </li>

              <li className="flex items-center gap-3 text-white/70">
                <span className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-brand-gold" />
                </span>
                <a href="tel:+966583236711" className="hover:text-white transition">
                  (+966) 58 323-6711
                </a>
              </li>

              <li className="flex items-center gap-3 text-white/70">
                <span className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-brand-gold" />
                </span>
                <a href="mailto:cozycornersa.cafe@gmail.com" className="hover:text-white transition">
                  cozycornersa.cafe@gmail.com
                </a>
              </li>
            </ul>

            <div className="mt-6 h-px bg-gradient-to-r from-brand-gold/0 via-brand-gold/60 to-brand-gold/0" />

            <div className="mt-6 grid grid-cols-2 gap-3">
              <a
                href="https://wa.me/966583236711"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl bg-white/10 border border-white/10 px-4 py-3 text-white/80 hover:text-white hover:bg-white/15 transition"
              >
                WhatsApp
              </a>
              <a
                href="https://www.google.com/maps/place/Cozy+Corner+Cafe/@24.6763672,46.6996172,17z/data=!3m1!4b1!4m6!3m5!1s0x3e2f05140d4f4955:0xbf0491937c4649e7!8m2!3d24.6763672!4d46.6996172!16s%2Fg%2F11n48rn5vn?entry=ttu&g_ep=EgoyMDI2MDQwMS4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl bg-brand-gold text-brand-navy font-semibold px-4 py-3 hover:opacity-95 transition text-center"
              >
                Directions
              </a>
            </div>
          </div>

          {/* Newsletter + links */}
          <div className="lg:col-span-4 grid gap-6">
            <div className="rounded-[28px] border border-white/15 bg-white/10 backdrop-blur-2xl shadow-[0_28px_90px_rgba(0,0,0,0.35)] p-7">
              <p className="text-brand-gold font-semibold">Newsletter</p>
              <h4 className="mt-1 font-display text-2xl font-bold text-white">Stay Caffeinated</h4>
              <p className="mt-3 text-white/65">
                Subscribe for brewing tips, seasonal blends, and exclusive offers.
              </p>
              <form onSubmit={handleSubscribe} className="mt-5 space-y-3">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-brand-gold"
                  required
                />
                <Button type="submit" className="w-full bg-brand-gold text-brand-navy font-semibold hover:opacity-95">
                  Subscribe
                </Button>
              </form>
            </div>

            <div className="rounded-[28px] border border-white/15 bg-white/10 backdrop-blur-2xl shadow-[0_28px_90px_rgba(0,0,0,0.35)] p-7 overflow-hidden">
              <h4 className="font-display text-xl text-white font-bold">Quick Links</h4>
              <p className="mt-2 text-white/60 text-sm">Infinite navigation</p>

              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <div
                  className="flex gap-3 py-3 px-3"
                  style={{
                    animation: "marquee 18s linear infinite",
                  }}
                >
                  {marqueeLinks.map((link, idx) => (
                    <a
                      key={`${link.name}-${idx}`}
                      href={link.href}
                      className="whitespace-nowrap rounded-2xl bg-white/10 border border-white/10 px-4 py-2 text-sm text-white/75 hover:text-white hover:bg-white/15 transition"
                    >
                      {link.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="rounded-[22px] border border-white/10 bg-white/5 backdrop-blur-xl px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/50 text-sm">© 2026 Cozy Corner Cafe. All rights reserved.</p>
          <div className="flex gap-4 text-sm">
            <a href="/privacy-policy" className="text-white/60 hover:text-brand-gold transition-colors">Privacy Policy</a>
            <span className="text-white/20">•</span>
            <a href="/terms" className="text-white/60 hover:text-brand-gold transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Main App

function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Features />
        <MenuSection />
        <Testimonials />
        <Blog />
      </main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Backwards-compatible alias */}
        <Route path="/links" element={<QuickLinks />} />
        <Route path="/quick-links" element={<QuickLinks />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

