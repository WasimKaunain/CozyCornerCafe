import { motion } from "framer-motion";
import { FaWhatsapp, FaInstagram, FaFacebook, FaMapMarkerAlt, FaEnvelope } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function SocialHub() {
  const icons = [
    FaWhatsapp,
    FaInstagram,
    FaFacebook,
    FaMapMarkerAlt,
    FaEnvelope,
  ];

  return (
    <div className="relative">
      
      {/* Animated Icons */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        {icons.map((Icon, i) => {
          const angle = (i / icons.length) * 2 * Math.PI;
          const radius = 50;

          return (
            <motion.div
              key={i}
              animate={{
                x: [0, Math.cos(angle) * radius, 0],
                y: [0, Math.sin(angle) * radius, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="absolute"
            >
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow">
                <Icon className="text-coffee-dark" />
              </div>
            </motion.div>
          );
        })}

        {/* Main Button */}
        <Link to="/links">
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="w-14 h-14 bg-coffee-gold rounded-full shadow-lg flex items-center justify-center text-white text-lg font-bold cursor-pointer"
          >
            ☕
          </motion.div>
        </Link>
      </div>
    </div>
  );
}