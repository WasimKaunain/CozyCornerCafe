import { useEffect, useState, useRef } from 'react';
import { Coffee, Menu as MenuIcon, X, Leaf, Flame, Wifi, User, Quote, Star,ArrowRight,Calendar,Tag,MapPin,Phone,Mail,Facebook,Instagram,Twitter,ChevronLeft,ChevronRight} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
          ? 'bg-white/90 backdrop-blur-xl shadow-lg py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a 
            href="#home" 
            className="flex items-center gap-3 group"
          >
            <img 
              src="/logo.jpg" 
              alt="Cozy Corner Cafe" 
              className="w-10 h-10 rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <span className={`font-display text-xl font-bold transition-colors duration-300 ${isScrolled ? 'text-coffee-dark' : 'text-white'}`}>
              Cozy Corner Cafe
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`relative font-medium text-sm transition-colors duration-300 group ${
                  isScrolled ? 'text-coffee-dark hover:text-coffee-gold' : 'text-white/90 hover:text-coffee-gold'
                }`}
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-coffee-gold transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Button
              className="bg-coffee-gold text-coffee-dark font-semibold px-6 py-2 rounded-full hover:shadow-gold transition-all duration-300 hover:-translate-y-0.5"
            >
              Book a Table
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className={`w-6 h-6 ${isScrolled ? 'text-coffee-dark' : 'text-white'}`} />
            ) : (
              <MenuIcon className={`w-6 h-6 ${isScrolled ? 'text-coffee-dark' : 'text-white'}`} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl shadow-lg py-6 px-4 animate-fade-in">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-coffee-dark font-medium py-2 px-4 rounded-lg hover:bg-coffee-cream transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <Button className="bg-coffee-gold text-coffee-dark font-semibold mt-4">
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
    <section
      id="home"
      ref={heroRef}
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/hero-bg.jpg"
          alt="Coffee shop interior"
          className="w-full h-full object-cover scale-105"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-coffee-dark/90 via-coffee-dark/60 to-transparent" />
      </div>

      {/* Steam Particles */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-20 bg-white/10 rounded-full animate-steam"
            style={{
              left: `${60 + i * 8}%`,
              bottom: '20%',
              animationDelay: `${i * 1.5}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="container-custom relative z-20 pt-24">
        <div className="max-w-2xl">
          {/* Subtitle */}
          <p
            className={`font-script text-coffee-gold text-2xl md:text-3xl mb-4 transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '600ms' }}
          >
            Welcome to Cozy Corner Cafe
          </p>

          {/* Title */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-white font-bold leading-tight mb-6">
            {['Experience', 'the Art', 'of Coffee'].map((word, i) => (
              <span
                key={i}
                className={`inline-block mr-4 transition-all duration-700 ${
                  isVisible ? 'opacity-100 translate-y-0 rotate-x-0' : 'opacity-0 translate-y-12'
                }`}
                style={{ 
                  transitionDelay: `${800 + i * 100}ms`,
                  transform: isVisible ? 'rotateX(0)' : 'rotateX(-90deg)',
                }}
              >
                {word}
              </span>
            ))}
          </h1>

          {/* Description */}
          <p
            className={`text-white/80 text-lg md:text-xl leading-relaxed mb-8 max-w-lg transition-all duration-800 ${
              isVisible ? 'opacity-100 blur-0 translate-y-0' : 'opacity-0 blur-sm translate-y-8'
            }`}
            style={{ transitionDelay: '1300ms' }}
          >
            Where every cup is crafted with passion and every visit feels like coming home. 
            Discover the perfect blend of flavor and warmth.
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-wrap gap-4 transition-all duration-600 ${
              isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
            }`}
            style={{ transitionDelay: '1500ms' }}
          >
            <Button
              size="lg"
              className="bg-coffee-gold text-coffee-dark font-semibold px-8 py-6 rounded-full hover:shadow-gold-lg transition-all duration-300 hover:-translate-y-1 text-base"
            >
              Explore Our Menu
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white/30 text-white font-semibold px-8 py-6 rounded-full hover:bg-white/10 transition-all duration-300 text-base"
            >
              Our Story
            </Button>
          </div>
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
      className="relative py-24 md:py-32 bg-coffee-cream overflow-hidden"
    >
      {/* Grain Texture */}
      <div className="absolute inset-0 grain-texture pointer-events-none" />

      {/* Decorative Coffee Beans */}
      <div className="absolute top-20 right-10 animate-float-slow opacity-20">
        <Coffee className="w-20 h-20 text-coffee-gold" />
      </div>
      <div className="absolute bottom-20 left-10 animate-float opacity-20">
        <Coffee className="w-16 h-16 text-coffee-gold" />
      </div>

      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image */}
          <div
            className={`relative transition-all duration-1200 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
            }`}
            style={{ transitionDelay: '200ms' }}
          >
            <div className="relative">
              <img
                src="/about-image.jpg"
                alt="Person enjoying coffee"
                className="w-full max-w-md mx-auto lg:mx-0 rounded-3xl shadow-card-hover transform -rotate-2 hover:rotate-0 transition-transform duration-500"
              />
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -right-6 bg-coffee-gold text-coffee-dark p-6 rounded-2xl shadow-gold animate-float">
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
  const scrollRef = useRef<HTMLDivElement>(null);

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
    { name: 'Classic Espresso', price: '$4.50', image: '/menu-1.jpg' },
    { name: 'Vanilla Latte', price: '$5.50', image: '/menu-2.jpg' },
    { name: 'Caramel Macchiato', price: '$6.00', image: '/menu-3.jpg' },
    { name: 'Cold Brew', price: '$5.00', image: '/menu-4.jpg' },
    { name: 'Mocha Frappe', price: '$6.50', image: '/menu-5.jpg' },
  ];

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section
      id="menu"
      ref={sectionRef}
      className="relative py-24 md:py-32 bg-coffee-dark overflow-hidden"
    >
      {/* Warm Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-coffee-gold/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container-custom relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p
            className={`font-script text-coffee-gold text-2xl mb-3 transition-all duration-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Crafted with Passion
          </p>
          <h2
            className={`font-display text-3xl md:text-4xl lg:text-5xl text-white font-bold transition-all duration-600 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '100ms' }}
          >
            Our Signature Menu
          </h2>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-end gap-4 mb-8">
          <button
            onClick={() => scroll('left')}
            className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-coffee-gold hover:text-coffee-dark transition-all duration-300"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-coffee-gold hover:text-coffee-dark transition-all duration-300"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Menu Cards */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {menuItems.map((item, i) => (
            <div
              key={i}
              className={`flex-shrink-0 w-[300px] md:w-[350px] snap-center transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-48'
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="group relative h-[450px] rounded-3xl overflow-hidden cursor-pointer">
                {/* Image */}
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-coffee-dark via-coffee-dark/40 to-transparent" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="font-display text-2xl text-white font-bold mb-2">
                    {item.name}
                  </h3>
                  <p className="text-coffee-gold text-xl font-semibold">
                    {item.price}
                  </p>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-coffee-gold/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>
          ))}
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
    <section
      id="blog"
      ref={sectionRef}
      className="relative py-24 md:py-32 bg-white overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(135deg, transparent 48%, rgba(247,195,95,0.03) 50%, transparent 52%)',
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="container-custom relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
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
        <div className="grid md:grid-cols-3 gap-8">
          {posts.map((post, i) => (
            <article
              key={i}
              className={`group cursor-pointer transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
              }`}
              style={{ 
                transitionDelay: `${i * 150}ms`,
                transform: isVisible ? `translateY(${i === 1 ? '30px' : '0'})` : undefined,
              }}
            >
              <div className="bg-white rounded-3xl overflow-hidden shadow-card transition-all duration-500 group-hover:shadow-card-hover group-hover:-translate-y-2">
                {/* Image */}
                <div className="h-56 overflow-hidden">
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

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thank you for subscribing!');
    setEmail('');
  };

  return (
    <footer id="contact" className="relative bg-coffee-dark pt-24 pb-8 overflow-hidden">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-coffee-gold/5 to-transparent pointer-events-none" />

      {/* Steam Effect */}
      <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute w-20 h-40 bg-white/5 rounded-full blur-xl animate-steam"
            style={{
              left: `${20 + i * 30}%`,
              animationDelay: `${i * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="container-custom relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <a href="#home" className="flex items-center gap-3 mb-6">
              <img 
                src="/logo.jpg" 
                alt="Cozy Corner Cafe" 
                className="w-10 h-10 rounded-lg object-cover"
              />
              <span className="font-display text-xl font-bold text-white">
                Cozy Corner Cafe
              </span>
            </a>
            <p className="text-white/60 leading-relaxed mb-6">
              Crafting moments, one cup at a time. Experience the art of coffee in a warm, 
              inviting atmosphere.
            </p>
            {/* Social Links */}
            <div className="flex gap-4">
              {[Facebook, Instagram, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-coffee-gold hover:text-coffee-dark transition-all duration-300 group"
                >
                  <Icon className="w-5 h-5 text-white group-hover:text-coffee-dark" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg text-white font-bold mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-white/60 hover:text-coffee-gold transition-colors duration-300"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-display text-lg text-white font-bold mb-6">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-white/60">
                <MapPin className="w-5 h-5 text-coffee-gold flex-shrink-0 mt-0.5" />
                <span>123 Coffee Street, Brew City, BC 12345</span>
              </li>
              <li className="flex items-center gap-3 text-white/60">
                <Phone className="w-5 h-5 text-coffee-gold flex-shrink-0" />
                <span>(555) 123-4567</span>
              </li>
              <li className="flex items-center gap-3 text-white/60">
                <Mail className="w-5 h-5 text-coffee-gold flex-shrink-0" />
                <span>hello@coffeehouse.com</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-display text-lg text-white font-bold mb-6">Stay Caffeinated</h4>
            <p className="text-white/60 mb-4">
              Subscribe for brewing tips, seasonal blends, and exclusive offers.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-3">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-coffee-gold"
                required
              />
              <Button
                type="submit"
                className="w-full bg-coffee-gold text-coffee-dark font-semibold hover:shadow-gold transition-all duration-300"
              >
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/40 text-sm">
              © 2024 Cozy Corner Cafe. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-white/40 hover:text-coffee-gold transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-white/40 hover:text-coffee-gold transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Main App
function App() {
  return (
    <div className="min-h-screen bg-white">
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
    </div>
  );
}

export default App;
