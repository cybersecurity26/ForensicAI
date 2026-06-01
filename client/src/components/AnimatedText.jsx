import React from "react";
import { motion } from "framer-motion";

export const AnimatedText = React.forwardRef(
  (
    {
      text,
      textClassName = "",
      underlineClassName = "",
      underlinePath = "M 0,10 Q 75,0 150,10 Q 225,20 300,10",
      underlineHoverPath = "M 0,10 Q 75,20 150,10 Q 225,0 300,10",
      underlineDuration = 1.5,
      className = "",
      ...props
    },
    ref
  ) => {
    const pathVariants = {
      hidden: {
        pathLength: 0,
        opacity: 0,
      },
      visible: {
        pathLength: 1,
        opacity: 1,
        transition: {
          duration: underlineDuration,
          ease: "easeInOut",
        },
      },
    };

    return (
      <div
        ref={ref}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        className={className}
        {...props}
      >
        <div style={{ position: 'relative' }}>
          <motion.h1
            style={{ fontSize: '2.5rem', fontWeight: 800, textAlign: 'center', margin: 0, fontFamily: 'var(--font-display)' }}
            className={textClassName}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.02 }}
          >
            {text}
          </motion.h1>

          <motion.svg
            width="100%"
            height="20"
            viewBox="0 0 300 20"
            style={{ position: 'absolute', bottom: -16, left: 0 }}
            className={underlineClassName}
          >
            <motion.path
              d={underlinePath}
              stroke="var(--accent-primary)"
              strokeWidth="3"
              fill="none"
              variants={pathVariants}
              initial="hidden"
              animate="visible"
              whileHover={{
                d: underlineHoverPath,
                transition: { duration: 0.8 },
              }}
            />
          </motion.svg>
        </div>
      </div>
    );
  }
);

AnimatedText.displayName = "AnimatedText";
