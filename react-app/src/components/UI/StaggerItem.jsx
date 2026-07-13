import { motion } from 'framer-motion';

const variants = {
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export default function StaggerItem({ children, className = '', style }) {
  return (
    <motion.div className={className} style={style} variants={variants}>
      {children}
    </motion.div>
  );
}
