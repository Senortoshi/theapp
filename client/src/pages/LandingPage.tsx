import React, { useRef, useEffect, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

const BG = "#030712";
const GREEN = "#00ff88";
const PURPLE = "#7c3aed";
const GOLD = "#f59e0b";

const panelVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { delayChildren: 0.2, staggerChildren: 0.15 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { amount: 0.3, once: false });
  return (
    <motion.section
      ref={ref}
      className={`min-h-screen w-full flex flex-col items-center justify-center px-4 sm:px-6 md:px-10 max-w-[100vw] ${className}`}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={panelVariants}
    >
      {children}
    </motion.section>
  );
}

function PanelContent({ children, stagger = 0 }: { children: React.ReactNode; stagger?: number }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center text-center max-w-xl mx-auto gap-4 w-full px-2"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: stagger, delayChildren: 0.1 } } }}
    >
      {children}
    </motion.div>
  );
}

function VoidOpening({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const t = setTimeout(onComplete, 2200);
    return () => clearTimeout(t);
  }, [onComplete]);
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ backgroundColor: "#000000" }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, delay: 1.6 }}
    >
      <motion.p
        style={{ fontFamily: "monospace", fontSize: "11px", letterSpacing: "0.22em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.0, delay: 0.3 }}
      >
        therealbitcoin.fun
      </motion.p>
    </motion.div>
  );
}

function EnterButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="w-full min-h-[48px] sm:min-h-[44px] sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-md font-medium text-base sm:text-lg border transition-colors duration-200 focus:outline-none touch-manipulation"
      style={{ background: "transparent", borderWidth: 1, borderColor: GREEN, color: GREEN }}
      whileHover={{ backgroundColor: GREEN, color: "#000" }}
      whileTap={{ scale: 0.98 }}
    >
      ENTER THE CHAIN
    </motion.button>
  );
}

export default function LandingPage() {
  const [, navigate] = useLocation();
  const [voidDone, setVoidDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const total = scrollHeight - clientHeight;
      setProgress(total > 0 ? scrollTop / total : 0);
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [voidDone]);

  return (
    <>
      <AnimatePresence>
        {!voidDone && <VoidOpening onComplete={() => setVoidDone(true)} />}
      </AnimatePresence>
      <div
        ref={containerRef}
        className="fixed inset-0 z-[90] overflow-y-auto overflow-x-hidden overscroll-none w-full"
        style={{ backgroundColor: BG, paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)", visibility: voidDone ? "visible" : "hidden" }}
      >
        <div className="fixed right-0 top-0 w-0.5 h-full z-10 pointer-events-none" style={{ background: "rgba(0,0,0,0.2)" }}>
          <motion.div className="w-full h-full bg-[#00ff88] origin-top" initial={{ scaleY: 0 }} animate={{ scaleY: progress }} transition={{ type: "spring", stiffness: 300, damping: 40 }} />
        </div>

        <Panel>
          <PanelContent stagger={0.5}>
            <motion.h1 variants={itemVariants} className="font-semibold text-white tracking-tight text-[clamp(1.25rem,5vw,2.5rem)] sm:text-4xl md:text-5xl" style={{ fontFamily: "var(--font-sans)", lineHeight: 1.4 }}>
              THE INTERNET HAS A BUG.
            </motion.h1>
            <motion.p variants={itemVariants} className="text-white/80 max-w-md leading-relaxed text-base sm:text-lg md:text-xl">
              Every minute you spend online creates value.<br />None of it comes back to you.
            </motion.p>
            <motion.div variants={itemVariants} className="mt-10 flex flex-col items-center gap-1">
              <div className="w-[26px] h-[42px] rounded-full border-2 border-white/40 flex items-start justify-center p-1.5">
                <motion.div className="w-[4px] h-[8px] rounded-full bg-white/80" animate={{ y: [0, 14, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />
              </div>
              <motion.span className="text-white/30 text-xs tracking-widest uppercase mt-1" animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>scroll</motion.span>
            </motion.div>
          </PanelContent>
        </Panel>

        <Panel>
          <PanelContent stagger={0.15}>
            <motion.h1 variants={itemVariants} className="font-semibold tracking-tight text-[clamp(1.25rem,5vw,2.5rem)] sm:text-4xl md:text-5xl" style={{ color: GREEN, fontFamily: "var(--font-sans)", lineHeight: 1.4 }}>WHAT IF IT DID?</motion.h1>
            <motion.p variants={itemVariants} className="text-white/90 max-w-lg leading-relaxed text-base sm:text-lg md:text-xl">
              Not through tokens you can dump.<br />Not through equity you&apos;ll never see.<br />Through pure contribution.<br />Measured honestly. Paid instantly.
            </motion.p>
          </PanelContent>
        </Panel>

        <Panel>
          <PanelContent stagger={0.3}>
            <motion.h1 variants={itemVariants} className="font-semibold text-white tracking-tight text-[clamp(1.25rem,5vw,2.5rem)] sm:text-4xl md:text-5xl" style={{ fontFamily: "var(--font-sans)", lineHeight: 1.4 }}>YOUR SHARE IS ALIVE.</motion.h1>
            <motion.p variants={itemVariants} className="text-white/90 text-base sm:text-lg md:text-xl" style={{ lineHeight: 1.5 }}>Post an idea. → Your share appears.</motion.p>
            <motion.p variants={itemVariants} className="text-white/90 text-base sm:text-lg md:text-xl" style={{ lineHeight: 1.5 }}>Someone builds on it. → Your share grows.</motion.p>
            <motion.p variants={itemVariants} className="text-white/90 text-base sm:text-lg md:text-xl" style={{ lineHeight: 1.5 }}>Better ideas come. → Your share adjusts.</motion.p>
            <motion.p variants={itemVariants} className="text-base sm:text-lg md:text-xl font-medium mt-2" style={{ color: PURPLE, lineHeight: 1.5 }}>That&apos;s not punishment. That&apos;s honesty.</motion.p>
          </PanelContent>
        </Panel>

        <Panel className="relative">
          <div className="absolute inset-0 pointer-events-none hidden sm:block" style={{ background: "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(245,158,11,0.06) 0%, transparent 70%)" }} />
          <PanelContent stagger={0.15}>
            <motion.h1 variants={itemVariants} className="font-semibold tracking-tight relative z-10 text-[clamp(1.25rem,5vw,2.5rem)] sm:text-4xl md:text-5xl" style={{ color: GOLD, fontFamily: "var(--font-sans)", lineHeight: 1.4 }}>THE CHAIN FINDS YOU.</motion.h1>
            <motion.p variants={itemVariants} className="text-white/90 max-w-lg leading-relaxed relative z-10 text-base sm:text-lg md:text-xl" style={{ lineHeight: 1.5 }}>
              You don&apos;t have to be here to contribute.<br />Say something true about this project anywhere.<br />Inscribe it to BSV mainnet.<br />Your share is permanent whether or not you return.
            </motion.p>
          </PanelContent>
        </Panel>

        <Panel>
          <PanelContent stagger={0.12}>
            <motion.h1 variants={itemVariants} className="font-semibold text-white tracking-tight text-[clamp(1.25rem,5vw,2.5rem)] sm:text-4xl md:text-5xl" style={{ fontFamily: "var(--font-sans)", lineHeight: 1.4 }}>NOTHING TO SELL.<br />EVERYTHING TO BUILD.</motion.h1>
            <motion.p variants={itemVariants} className="text-white/90 max-w-lg leading-relaxed text-base sm:text-lg md:text-xl" style={{ lineHeight: 1.5 }}>
              No token to dump.<br />No equity to fight over.<br />No gatekeeping.<br /><br />Just honest work meeting honest reward.<br />On the only chain that can make it real.
            </motion.p>
            <motion.p variants={itemVariants} className="text-base text-gray-500 mt-4">Built on Bitcoin SV.</motion.p>
          </PanelContent>
        </Panel>

        <Panel>
          <PanelContent>
            <motion.h1 variants={itemVariants} className="font-semibold text-white tracking-tight text-[clamp(1.25rem,5vw,2.5rem)] sm:text-4xl md:text-5xl" style={{ fontFamily: "var(--font-sans)", lineHeight: 1.4 }}>NOW BE PART OF IT.</motion.h1>
            <motion.p variants={itemVariants} className="text-white/60 text-sm mt-2">Your inscription goes on-chain permanently.<br />No one can delete it. No one can change it.</motion.p>
            <motion.div variants={itemVariants} transition={{ delay: 1 }} className="mt-6 sm:mt-8 w-full max-w-[min(100%,320px)] sm:max-w-none mx-auto">
              <EnterButton onClick={() => navigate("/dashboard")} />
            </motion.div>
            <motion.p variants={itemVariants} className="text-white/20 text-xs mt-3" style={{ fontFamily: "monospace" }}>Yours Wallet required — install free at yours.org</motion.p>
          </PanelContent>
        </Panel>
      </div>
    </>
  );
}
