import { motion } from 'framer-motion';

const variants = {
  hidden: (dir) => ({
    opacity: 0,
    y: dir === 'down' ? -40 : 40,
    x: dir === 'left' ? 40 : dir === 'right' ? -40 : 0,
    scale: dir === 'scale' ? 0.95 : 1,
  }),
  visible: { opacity: 1, y: 0, x: 0, scale: 1 },
};

export default function RevealWrapper({
  children,
  className = '',
  style,
  direction = 'up',
  delay = 0,
  duration = 0.7,
}) {
  return (
    <motion.div
      className={className}
      style={style}
      custom={direction}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={variants}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
