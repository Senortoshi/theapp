import React, { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { setGuideComplete } from "@/store/useSimStore";

const BG = "#030712";
const GREEN = "#00ff88";
const PURPLE = "#7c3aed";
const GOLD = "#f59e0b";

const panelVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.2,
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
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

function PanelContent({
  children,
  stagger = 0,
}: {
  children: React.ReactNode;
  stagger?: number;
}) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center text-center max-w-xl mx-auto gap-4 w-full px-2"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: stagger,
            delayChildren: 0.1,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function GuideScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

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
  }, []);

  const handleStart = () => {
    setGuideComplete(true);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[90] overflow-y-auto overflow-x-hidden overscroll-none w-full"
      style={{ backgroundColor: BG, paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Progress indicator — right edge, grows top to bottom */}
      <div
        className="fixed right-0 top-0 w-0.5 h-full z-10 pointer-events-none"
        style={{ background: "rgba(0,0,0,0.2)" }}
      >
        <motion.div
          className="w-full h-full bg-[#00ff88] origin-top"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: progress }}
          transition={{ type: "spring", stiffness: 300, damping: 40 }}
        />
      </div>

      <Panel>
        <PanelContent stagger={0.5}>
          <motion.h1
            variants={itemVariants}
            className="font-semibold text-white tracking-tight text-[clamp(1.25rem,5vw,2.5rem)] sm:text-4xl md:text-5xl"
            style={{ fontFamily: "var(--font-sans)", lineHeight: 1.4 }}
          >
            THE INTERNET HAS A BUG.
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-white/80 max-w-md leading-relaxed text-base sm:text-lg md:text-xl"
          >
            Every minute you spend online creates value.
            <br />
            None of it comes back to you.
          </motion.p>
        </PanelContent>
      </Panel>

      <Panel>
        <PanelContent stagger={0.15}>
          <motion.h1
            variants={itemVariants}
            className="font-semibold tracking-tight text-[clamp(1.25rem,5vw,2.5rem)] sm:text-4xl md:text-5xl"
            style={{ color: GREEN, fontFamily: "var(--font-sans)", lineHeight: 1.4 }}
          >
            WHAT IF IT DID?
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-white/90 max-w-lg leading-relaxed text-base sm:text-lg md:text-xl"
          >
            Not through tokens you can dump.
            <br />
            Not through equity you&apos;ll never see.
            <br />
            Through pure contribution.
            <br />
            Measured honestly. Paid instantly.
          </motion.p>
        </PanelContent>
      </Panel>

      <Panel>
        <PanelContent stagger={0.3}>
          <motion.h1
            variants={itemVariants}
            className="font-semibold text-white tracking-tight text-[clamp(1.25rem,5vw,2.5rem)] sm:text-4xl md:text-5xl"
            style={{ fontFamily: "var(--font-sans)", lineHeight: 1.4 }}
          >
            YOUR SHARE IS ALIVE.
          </motion.h1>
          <motion.p variants={itemVariants} className="text-white/90 text-base sm:text-lg md:text-xl" style={{ lineHeight: 1.5 }}>
            Post an idea. → Your share appears.
          </motion.p>
          <motion.p variants={itemVariants} className="text-white/90 text-base sm:text-lg md:text-xl" style={{ lineHeight: 1.5 }}>
            Someone builds on it. → Your share grows.
          </motion.p>
          <motion.p variants={itemVariants} className="text-white/90 text-base sm:text-lg md:text-xl" style={{ lineHeight: 1.5 }}>
            Better ideas come. → Your share adjusts.
          </motion.p>
          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg md:text-xl font-medium mt-2"
            style={{ color: PURPLE, lineHeight: 1.5 }}
          >
            That&apos;s not punishment. That&apos;s honesty.
          </motion.p>
        </PanelContent>
      </Panel>

      <Panel className="relative">
        {/* Very faint gold glow behind text — reduced on small screens for performance */}
        <div
          className="absolute inset-0 pointer-events-none hidden sm:block"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(245,158,11,0.06) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none sm:hidden"
          style={{
            background: "radial-gradient(ellipse 70% 40% at 50% 50%, rgba(245,158,11,0.04) 0%, transparent 65%)",
          }}
        />
        <PanelContent stagger={0.15}>
          <motion.h1
            variants={itemVariants}
            className="font-semibold tracking-tight relative z-10 text-[clamp(1.25rem,5vw,2.5rem)] sm:text-4xl md:text-5xl"
            style={{ color: GOLD, fontFamily: "var(--font-sans)", lineHeight: 1.4 }}
          >
            THE AGENT FINDS YOU.
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-white/90 max-w-lg leading-relaxed relative z-10 text-base sm:text-lg md:text-xl"
            style={{ lineHeight: 1.5 }}
          >
            You don&apos;t have to be here to contribute.
            <br />
            Say something true about this project anywhere.
            <br />
            If it drives real value — the agent finds you.
            <br />
            You get attributed. You get paid.
            <br />
            You didn&apos;t even know this system existed.
          </motion.p>
        </PanelContent>
      </Panel>

      <Panel>
        <PanelContent stagger={0.12}>
          <motion.h1
            variants={itemVariants}
            className="font-semibold text-white tracking-tight text-[clamp(1.25rem,5vw,2.5rem)] sm:text-4xl md:text-5xl"
            style={{ fontFamily: "var(--font-sans)", lineHeight: 1.4 }}
          >
            NOTHING TO SELL.
            <br />
            EVERYTHING TO BUILD.
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-white/90 max-w-lg leading-relaxed text-base sm:text-lg md:text-xl"
            style={{ lineHeight: 1.5 }}
          >
            No token to dump.
            <br />
            No equity to fight over.
            <br />
            No gatekeeping.
            <br />
            <br />
            Just honest work meeting honest reward.
            <br />
            On the only chain that can make it real.
          </motion.p>
          <motion.p
            variants={itemVariants}
            className="text-base text-gray-500 mt-4"
            style={{ lineHeight: 1.5 }}
          >
            Built on Bitcoin SV.
          </motion.p>
        </PanelContent>
      </Panel>

      <Panel>
        <PanelContent>
          <motion.h1
            variants={itemVariants}
            className="font-semibold text-white tracking-tight text-[clamp(1.25rem,5vw,2.5rem)] sm:text-4xl md:text-5xl"
            style={{ fontFamily: "var(--font-sans)", lineHeight: 1.4 }}
          >
            NOW WATCH IT HAPPEN.
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-white/60 text-sm mt-2"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            Your share is permanent whether or not you return.
          </motion.p>
          <motion.div
            variants={itemVariants}
            transition={{ delay: 1 }}
            className="mt-6 sm:mt-8 w-full max-w-[min(100%,320px)] sm:max-w-none mx-auto"
          >
            <StartButton onClick={handleStart} />
          </motion.div>
        </PanelContent>
      </Panel>
    </div>
  );
}

function StartButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="w-full min-h-[48px] sm:min-h-[44px] sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-md font-medium text-base sm:text-lg border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff88] focus-visible:ring-offset-2 focus-visible:ring-offset-[#030712] touch-manipulation"
      style={{
        background: "transparent",
        borderWidth: 1,
        borderColor: GREEN,
        color: GREEN,
      }}
      whileHover={{
        backgroundColor: GREEN,
        color: "#000",
      }}
      whileTap={{ scale: 0.98 }}
      aria-label="Start simulation"
    >
      START SIMULATION
    </motion.button>
  );
}
