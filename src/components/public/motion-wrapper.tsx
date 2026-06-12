'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MotionWrapperProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
  duration?: number;
  className?: string;
}

export default function MotionWrapper({
  children,
  delay = 0,
  direction = 'fade',
  duration = 0.45,
  className = ''
}: MotionWrapperProps) {
  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? 15 : direction === 'down' ? -15 : 0,
      x: direction === 'left' ? 15 : direction === 'right' ? -15 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration,
        delay,
        ease: [0.21, 1.02, 0.43, 1.01] as [number, number, number, number], // Fluid premium feel
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}
