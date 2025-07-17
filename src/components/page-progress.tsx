import { useScroll, useSpring, motion } from "framer-motion";

export const PageProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 50,
    damping: 30,
    restDelta: 0.1,
  });

  return (
    <>
      <motion.div
        className="fixed top-12 left-0 right-0 [transform-origin:0%] h-1 bg-sky-600"
        style={{ scaleX }}
      />
    </>
  );
};
