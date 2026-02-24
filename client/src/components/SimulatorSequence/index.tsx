import React, { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wall, type WallEntry } from "./Wall";
import { AgentLog } from "./AgentLog";
import {
  PHASE_END,
  FIRST_CONTRIBUTION_TEXT,
  CONTRIBUTION_2,
  CONTRIBUTION_3,
  CONTRIBUTION_4,
  CONTRIBUTION_6,
  REVENUE_SATS,
} from "./constants";

const BG = "#030712";
const GREEN = "#00ff88";
const GOLD = "#f59e0b";

type Phase =
  | "0_void"
  | "1_first"
  | "2_builder"
  | "3_more"
  | "4_external"
  | "5_revenue"
  | "6_replication"
  | "7_end";

function getPhase(elapsed: number): Phase {
  if (elapsed < PHASE_END.PHASE_0_VOID) return "0_void";
  if (elapsed < PHASE_END.PHASE_1_FIRST) return "1_first";
  if (elapsed < PHASE_END.PHASE_2_BUILDER) return "2_builder";
  if (elapsed < PHASE_END.PHASE_3_MORE) return "3_more";
  if (elapsed < PHASE_END.PHASE_4_EXTERNAL) return "4_external";
  if (elapsed < PHASE_END.PHASE_5_REVENUE) return "5_revenue";
  if (elapsed < PHASE_END.PHASE_6_REPLICATION) return "6_replication";
  return "7_end";
}

/** Typing length from phase start (seconds) and char interval in ms. */
function typingLength(elapsedInPhaseSec: number, charMs: number): number {
  const ms = elapsedInPhaseSec * 1000;
  return Math.floor(ms / charMs);
}

const TYPING_CHAR_MS = 80;

const AGENT_LINES_1 = [
  "Processing first contribution...",
  "Type: identity / naming",
  "Base score: 15 points",
  "Total pool: 15 points",
  "Share: 15 ÷ 15 = 100.0000%",
  "Revenue to distribute: 0 satoshis",
  "(no revenue yet — the site just started)",
  "Share assigned. Permanent.",
];

const AGENT_LINES_2 = [
  "Processing second contribution...",
  "Type: design",
  "Base score: 20 points",
  "Pool was: 15 points",
  "Pool now: 35 points",
  "New share: 20 ÷ 35 = 57.1429%",
  "First contributor's share recalculates: 15 ÷ 35 = 42.8571%",
  "All shares updated. Both permanent.",
];

const AGENT_LINES_3 = [
  "Processing third contribution...",
  "Type: critique",
  "Base score: 18 points",
  "Pool was: 35 points",
  "Pool now: 53 points",
  "New share: 18 ÷ 53 = 33.3333%",
  "All shares recalculated.",
  "All shares updated. Permanent.",
];

const AGENT_LINES_EXTERNAL = [
  "Agent scanning external sources...",
  "Reading mentions on X...",
  "847 posts analyzed",
  "Filtering for signal...",
  "Candidate identified: @someone_on_x",
  "Activity: shared a link that drove 307 sign-ups",
  "They never visited this site",
  "They don't know this system exists",
  "Measuring downstream impact...",
  "307 attributed conversions confirmed",
  "Running attribution calculation...",
  "Contribution type: external advocacy",
  "Base score: 15 points",
  "Pool was: 53 points",
  "Pool now: 68 points",
  "Share: 15 ÷ 68 = 22.0588%",
  "Notification queued.",
  "Their share is permanent.",
  "They don't have to do anything to keep it.",
];

const AGENT_LINES_6 = [
  "Processing contribution (governance / replication)...",
  "Type: governance / replication",
  "Score: 18 points",
  "...",
  "Note: this contribution, if implemented in the real system,",
  "will create the network.",
  "Its author earns a genesis share in every project it spawns.",
  "That is the real value here.",
];

// Share math: after #3 implemented: 15, 20, 18 → 15/53, 20/53, 18/53
// After #5 (external): pool 68. #1=15 #2=20 #3=18 #5=15 → 15/68, 20/68, 18/68, 15/68
// After #6: pool 86. #1=15 #2=20 #3=18 #5=15 #6=18
const SHARES_AFTER_3 = [15 / 53, 20 / 53, 18 / 53]; // #1, #2, #3
const SHARES_AFTER_5 = [15 / 68, 20 / 68, 18 / 68, 15 / 68]; // #1 #2 #3 #5
const SHARES_AFTER_6 = [15 / 86, 20 / 86, 18 / 86, 15 / 86, 18 / 86]; // #1 #2 #3 #5 #6

function satsForShare(share: number): number {
  return Math.floor(REVENUE_SATS * share);
}

const END_CARD_LINES = [
  "This simulation ran on fake data.",
  "",
  "The real site starts the same way.",
  "",
  "Blank.",
  "One input.",
  "Zero contributions.",
  "",
  "Everything you just saw — the Wall, the shares,",
  "the agent, the replication — is real.",
  "",
  "It starts when the first person contributes.",
  "",
  "Your share is permanent whether or not you return.",
  "",
];

export const SimulatorSequence: React.FC<{
  onWatchAgain: () => void;
  onContribute: () => void;
}> = ({ onWatchAgain, onContribute }) => {
  const startRef = useRef<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((Date.now() - startRef.current) / 1000);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const phase = getPhase(elapsed);

  // Phase 0: void
  const phase0Elapsed = elapsed;
  const showVoidText1 = phase0Elapsed >= 2 && phase0Elapsed < 3;
  const showVoidText2 = phase0Elapsed >= 3 && phase0Elapsed < 4;
  const showInputFromVoid = phase0Elapsed >= 4;

  // Phase 1: first contribution
  const phase1Elapsed = elapsed - PHASE_END.PHASE_0_VOID;
  const typingLen1 = Math.min(FIRST_CONTRIBUTION_TEXT.length, typingLength(phase1Elapsed, TYPING_CHAR_MS));
  const submitted1 = phase1Elapsed >= 2 + 2 + (FIRST_CONTRIBUTION_TEXT.length * TYPING_CHAR_MS) / 1000;
  const firstContributionSubmittedAt = PHASE_END.PHASE_0_VOID + (FIRST_CONTRIBUTION_TEXT.length * TYPING_CHAR_MS) / 1000 + 2; // typing + 2s pause, then submit
  const showWall1 = elapsed >= firstContributionSubmittedAt;

  // Phase 2: builder
  const phase2Start = PHASE_END.PHASE_1_FIRST;
  const phase2Elapsed = elapsed - phase2Start;
  const showBuilderReviewing = phase === "2_builder" && phase2Elapsed < 2;
  const showAgentLog1 = phase === "2_builder" && phase2Elapsed >= 2 && phase2Elapsed < 2 + (AGENT_LINES_1.length * 0.8);
  const oneImplemented = phase === "2_builder" && phase2Elapsed >= 2;

  // Phase 3: more contributions — we need to add #2, #3, #4 one by one with typing
  const phase3Start = PHASE_END.PHASE_2_BUILDER;
  const phase3Elapsed = elapsed - phase3Start;
  // At 0s phase3: show input typing #2. Typing takes CONTRIBUTION_2.length * 0.08s. Then 2s pause, submit. Repeat for #3, #4.
  const c2Len = CONTRIBUTION_2.length;
  const c3Len = CONTRIBUTION_3.length;
  const c4Len = CONTRIBUTION_4.length;
  const typingSpeedSec = TYPING_CHAR_MS / 1000;
  const pauseBetween = 2;
  const submitAt = (len: number) => len * typingSpeedSec + pauseBetween;
  const t2Submit = submitAt(c2Len);
  const t3Submit = t2Submit + 2 + submitAt(c3Len);
  const t4Submit = t3Submit + 2 + submitAt(c4Len);
  const wall2Visible = phase3Elapsed >= t2Submit;
  const wall3Visible = phase3Elapsed >= t3Submit;
  const wall4Visible = phase3Elapsed >= t4Submit;
  const builderMarks2And3At = t4Submit + 2;
  const showBuilderPhase3 = phase3Elapsed >= t4Submit && phase3Elapsed < t4Submit + 2;
  const agentLog2Start = t4Submit + 2;
  const agentLog2End = agentLog2Start + AGENT_LINES_2.length * 0.8;
  const agentLog3Start = agentLog2End + 2;
  const agentLog3End = agentLog3Start + AGENT_LINES_3.length * 0.8;
  const showAgentLog2 = phase === "3_more" && phase3Elapsed >= agentLog2Start && phase3Elapsed < agentLog2End;
  const showAgentLog3 = phase === "3_more" && phase3Elapsed >= agentLog3Start && phase3Elapsed < agentLog3End;
  const twoAndThreeImplemented = phase === "3_more" && phase3Elapsed >= agentLog2Start;

  // Phase 4: external
  const phase4Start = PHASE_END.PHASE_3_MORE;
  const phase4Elapsed = elapsed - phase4Start;
  const externalLogStart = 0;
  const externalLogDuration = AGENT_LINES_EXTERNAL.length * 0.8;
  const showExternalLog = phase === "4_external" && phase4Elapsed >= externalLogStart && phase4Elapsed < externalLogStart + externalLogDuration;
  const goldCardVisible = phase === "4_external" && phase4Elapsed >= externalLogDuration;

  // Phase 5: revenue
  const phase5Start = PHASE_END.PHASE_4_EXTERNAL;
  const phase5Elapsed = elapsed - phase5Start;
  const showRevenueText = phase === "5_revenue" && phase5Elapsed < 5;
  const showSatoshiDistribution = phase === "5_revenue" && phase5Elapsed >= 5;

  // Phase 6: replication
  const phase6Start = PHASE_END.PHASE_5_REVENUE;
  const phase6Elapsed = elapsed - phase6Start;
  const c6Len = CONTRIBUTION_6.length;
  const t6Submit = 2 + c6Len * typingSpeedSec + pauseBetween;
  const wall6Visible = phase === "6_replication" && phase6Elapsed >= t6Submit;
  const showAgentLog6 = phase === "6_replication" && phase6Elapsed >= t6Submit + 2 && phase6Elapsed < t6Submit + 2 + AGENT_LINES_6.length * 0.8;
  const sixImplemented = phase === "6_replication" && phase6Elapsed >= t6Submit + 2;

  // Wall entries for display
  const wallEntries = useMemo((): WallEntry[] => {
    const entries: WallEntry[] = [];
    if (showWall1) {
      entries.push({
        id: 1,
        content: FIRST_CONTRIBUTION_TEXT,
        author: "Anonymous",
        status: oneImplemented ? "IMPLEMENTED" : "PENDING",
        timestampLabel: "just now",
        ...(oneImplemented && {
          points: 15,
          sharePct: phase === "2_builder" ? 100 : phase === "3_more" ? (15 / 53) * 100 : phase === "4_external" ? (15 / 68) * 100 : (15 / 86) * 100,
          satoshis: phase === "5_revenue" || phase === "6_replication" || phase === "7_end" ? satsForShare(SHARES_AFTER_6[0]) : undefined,
        }),
      });
    }
    if (wall2Visible) {
      entries.push({
        id: 2,
        content: CONTRIBUTION_2,
        author: "Anonymous",
        status: twoAndThreeImplemented ? "IMPLEMENTED" : "PENDING",
        timestampLabel: "just now",
        ...(twoAndThreeImplemented && {
        points: 20,
        sharePct: phase === "3_more" ? (20 / 53) * 100 : phase === "4_external" ? (20 / 68) * 100 : (20 / 86) * 100,
        satoshis: phase === "5_revenue" || phase === "6_replication" || phase === "7_end" ? satsForShare(SHARES_AFTER_6[1]) : undefined,
      }),
      });
    }
    if (wall3Visible) {
      entries.push({
        id: 3,
        content: CONTRIBUTION_3,
        author: "Anonymous",
        status: twoAndThreeImplemented ? "IMPLEMENTED" : "PENDING",
        timestampLabel: "just now",
        ...(twoAndThreeImplemented && {
        points: 18,
        sharePct: phase === "3_more" ? (18 / 53) * 100 : phase === "4_external" ? (18 / 68) * 100 : (18 / 86) * 100,
        satoshis: phase === "5_revenue" || phase === "6_replication" || phase === "7_end" ? satsForShare(SHARES_AFTER_6[2]) : undefined,
      }),
      });
    }
    if (wall4Visible) {
      entries.push({
        id: 4,
        content: CONTRIBUTION_4,
        author: "Anonymous",
        status: "PENDING",
        timestampLabel: "just now",
      });
    }
    if (goldCardVisible || phase === "5_revenue" || phase === "6_replication" || phase === "7_end") {
      entries.push({
        id: 5,
        content: "Shared a link that drove 307 sign-ups.",
        author: "@someone_on_x",
        status: "IMPLEMENTED",
        timestampLabel: "just now",
        isExternal: true,
        points: 15,
        sharePct: 22.0588,
        satoshis: phase === "5_revenue" || phase === "6_replication" || phase === "7_end" ? satsForShare(SHARES_AFTER_6[3]) : undefined,
      });
    }
    if (wall6Visible) {
      entries.push({
        id: 6,
        content: CONTRIBUTION_6,
        author: "Anonymous",
        status: sixImplemented ? "IMPLEMENTED" : "PENDING",
        timestampLabel: "just now",
        ...(sixImplemented && {
        points: 18,
        sharePct: (18 / 86) * 100,
        satoshis: phase === "6_replication" || phase === "7_end" ? satsForShare(SHARES_AFTER_6[4]) : undefined,
      }),
      });
    }
    const showTrace = phase === "5_revenue" || phase === "6_replication" || phase === "7_end";
    return entries.map((e) => (showTrace && e.satoshis != null ? { ...e, traceLabel: `traceable to contribution #${e.id}` } : e));
  }, [
    showWall1,
    wall2Visible,
    wall3Visible,
    wall4Visible,
    goldCardVisible,
    wall6Visible,
    oneImplemented,
    twoAndThreeImplemented,
    sixImplemented,
    phase,
  ]);

  // Typing text for phase 3 (which contribution is being typed)
  const phase3Typing = useMemo(() => {
    if (phase !== "3_more") return null;
    if (phase3Elapsed < 2) return null;
    let t = phase3Elapsed - 2;
    if (t < submitAt(c2Len)) {
      const len = Math.min(c2Len, typingLength(t, TYPING_CHAR_MS));
      return { text: CONTRIBUTION_2, len };
    }
    t -= submitAt(c2Len) + 2;
    if (t < submitAt(c3Len)) {
      const len = Math.min(c3Len, typingLength(t, TYPING_CHAR_MS));
      return { text: CONTRIBUTION_3, len };
    }
    t -= submitAt(c3Len) + 2;
    if (t < submitAt(c4Len)) {
      const len = Math.min(c4Len, typingLength(t, TYPING_CHAR_MS));
      return { text: CONTRIBUTION_4, len };
    }
    return null;
  }, [phase, phase3Elapsed]);

  const phase6Typing = phase === "6_replication" && phase6Elapsed >= 2 && phase6Elapsed < 2 + c6Len * typingSpeedSec;

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col overflow-hidden"
      style={{
        background: BG,
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Phase 0: Void */}
      {phase === "0_void" && (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          {phase0Elapsed >= 2 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center text-sm md:text-base"
              style={{ color: "var(--text-3)", fontFamily: "var(--font-ui)" }}
            >
              {showVoidText1 && !showVoidText2 && "A site with nothing."}
              {showVoidText2 && "One input field."}
            </motion.p>
          )}
        </div>
      )}

      {/* Input at bottom — visible from end of phase 0 through phase 6 (except when end card is up) */}
      {showInputFromVoid && phase !== "7_end" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex-shrink-0 w-full max-w-xl mx-auto px-4 pb-4 flex gap-2"
        >
          <input
            type="text"
            readOnly
            className="flex-1 min-h-[44px] px-3 py-2 rounded-md border bg-[var(--surface-0)] text-[var(--text-1)]"
            style={{ borderColor: "var(--border)", fontFamily: "var(--font-ui)", fontSize: 16 }}
            placeholder="Contribute something."
            value={
              phase === "1_first"
                ? FIRST_CONTRIBUTION_TEXT.slice(0, typingLen1)
                : phase3Typing
                  ? phase3Typing.text.slice(0, phase3Typing.len)
                  : phase6Typing
                    ? CONTRIBUTION_6.slice(0, Math.min(CONTRIBUTION_6.length, typingLength(phase6Elapsed - 2, TYPING_CHAR_MS)))
                    : ""
            }
            aria-label="Contribution input"
          />
          <button
            type="button"
            className="px-4 py-2 min-h-[44px] rounded-md font-medium"
            style={{ background: GREEN, color: "#000", fontFamily: "var(--font-data)" }}
            aria-label="Submit"
          >
            Submit
          </button>
        </motion.div>
      )}

      {/* Phase 1 & 2 & 3: Wall + optional builder / agent log */}
      {(phase === "1_first" && showWall1) || phase === "2_builder" || phase === "3_more" || phase === "4_external" || phase === "5_revenue" || phase === "6_replication" ? (
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center py-4 px-4 gap-4">
          {showBuilderReviewing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-4 right-4 text-xs"
              style={{ color: "var(--text-3)", fontFamily: "var(--font-ui)" }}
            >
              Builder reviewing...
            </motion.div>
          )}
          {showBuilderPhase3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-4 right-4 text-xs"
              style={{ color: "var(--text-3)", fontFamily: "var(--font-ui)" }}
            >
              Builder reviewing...
            </motion.div>
          )}

          {showAgentLog1 && <AgentLog lines={AGENT_LINES_1} />}
          {showAgentLog2 && <AgentLog lines={AGENT_LINES_2} />}
          {showAgentLog3 && <AgentLog lines={AGENT_LINES_3} />}
          {showExternalLog && <AgentLog lines={AGENT_LINES_EXTERNAL} />}
          {showAgentLog6 && <AgentLog lines={AGENT_LINES_6} />}

          {wallEntries.length > 0 && <Wall entries={wallEntries} />}

          {oneImplemented && phase === "2_builder" && phase2Elapsed >= 2 + AGENT_LINES_1.length * 0.8 && phase2Elapsed < 2 + AGENT_LINES_1.length * 0.8 + 4 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center max-w-md text-sm mt-2"
              style={{ color: "var(--text-3)", fontFamily: "var(--font-ui)", lineHeight: 1.6 }}
            >
              <p>The person who wrote this owns 100% of whatever this becomes.</p>
              <p className="mt-1">That will change as more people contribute.</p>
              <p>Their share will never disappear.</p>
            </motion.div>
          )}

          {twoAndThreeImplemented && phase === "3_more" && phase3Elapsed >= agentLog2End && phase3Elapsed < agentLog2End + 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center max-w-md text-sm mt-2"
              style={{ color: "var(--text-3)", fontFamily: "var(--font-ui)", lineHeight: 1.6 }}
            >
              <p>The first contributor&apos;s share adjusted.</p>
              <p>Because the pool grew.</p>
              <p>Their work is still worth exactly 15 points.</p>
              <p>There are just more points now.</p>
            </motion.div>
          )}

          {goldCardVisible && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-md text-sm mt-2"
              style={{ color: "var(--text-3)", fontFamily: "var(--font-ui)", lineHeight: 1.6 }}
            >
              <p>This person was already contributing.</p>
              <p>The ledger found them because their work was real.</p>
            </motion.div>
          )}

          {phase === "1_first" && showWall1 && !oneImplemented && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm"
              style={{ color: "var(--text-3)", fontFamily: "var(--font-ui)" }}
            >
              Waiting to be built.
            </motion.p>
          )}
        </div>
      ) : null}

      {/* Phase 5: Revenue text + distribution */}
      {phase === "5_revenue" && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
          {showRevenueText && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center max-w-md"
              style={{ fontFamily: "var(--font-ui)", color: "var(--text-2)", lineHeight: 1.6 }}
            >
              <p>First revenue event.</p>
              <p>0.001 BSV received.</p>
              <p>Distributing now.</p>
            </motion.div>
          )}
          {showSatoshiDistribution && wallEntries.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full max-w-xl"
            >
              <Wall entries={wallEntries} />
            </motion.div>
          )}
        </div>
      )}

      {/* Phase 7: End card */}
      <AnimatePresence>
        {phase === "7_end" && (
          <motion.div
            key="end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 flex flex-col items-center justify-center px-4 bg-[#030712]"
          >
            <div className="max-w-md text-center space-y-4" style={{ fontFamily: "var(--font-ui)", color: "var(--text-2)", lineHeight: 1.7, fontSize: 15 }}>
              {END_CARD_LINES.map((line, i) => (
                <p key={i}>{line === "" ? "\u00A0" : line}</p>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <button
                type="button"
                onClick={onWatchAgain}
                className="px-5 py-2.5 rounded-md border text-sm"
                style={{ borderColor: "var(--border)", color: "var(--text-2)", fontFamily: "var(--font-ui)" }}
              >
                Watch Again
              </button>
              <button
                type="button"
                onClick={onContribute}
                className="px-5 py-2.5 rounded-md font-medium text-sm"
                style={{ background: GREEN, color: "#000", fontFamily: "var(--font-data)" }}
              >
                Contribute to the Real Build
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
