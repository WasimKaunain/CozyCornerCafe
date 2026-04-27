import {
  FaWhatsapp,
  FaInstagram,
  FaFacebook,
  FaMapMarkerAlt,
  FaEnvelope,
} from "react-icons/fa";

export default function SocialHub() {
  const icons = [
    {
      Icon: FaWhatsapp,
      href: "https://wa.me/966583236711",
      label: "WhatsApp",
      className: "text-[#25D366]",
    },
    {
      Icon: FaInstagram,
      href: "https://www.instagram.com/cozycornersa.cafe/?hl=en",
      label: "Instagram",
      className: "text-[#E1306C]",
    },
    {
      Icon: FaFacebook,
      href: "https://www.facebook.com/profile.php?id=61574238234936",
      label: "Facebook",
      className: "text-[#1877F2]",
    },
    {
      Icon: FaMapMarkerAlt,
      href: "https://www.google.com/maps/place/Cozy+Corner+Cafe/@24.6768574,46.6971651,17z/data=!3m1!4b1!4m6!3m5!1s0x3e2f05140d4f4955:0xbf0491937c4649e7!8m2!3d24.6768525!4d46.69974!16s%2Fg%2F11n48rn5vn?entry=ttu&g_ep=EgoyMDI2MDQyMi4wIKXMDSoASAFQAw%3D%3D",
      label: "Location",
      className: "text-[#EA4335]",
    },
    {
      Icon: FaEnvelope,
      href: "mailto:cozycornersa.cafe@gmail.com",
      label: "Email",
      className: "text-white/85",
    },
  ];

  return (
    <div className="mt-1">
      <p className="text-white/60 text-sm mb-3">Follow & reach us</p>

      <div className="flex flex-wrap gap-3">
        {icons.map(({ Icon, href, label, className }) => (
          <a
            key={label}
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
            aria-label={label}
            title={label}
            className="group relative inline-flex items-center justify-center w-12 h-12 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/15"
          >
            <span className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-16px_24px_rgba(0,0,0,0.24)]" />
            <span className="pointer-events-none absolute -top-6 -left-6 h-20 w-20 rounded-full bg-brand-gold/15 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <Icon className={`relative ${className}`} size={20} />
          </a>
        ))}
      </div>
    </div>
  );
}