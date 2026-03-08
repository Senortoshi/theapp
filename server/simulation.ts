import type { Express } from "express";

type BroadcastFn = (type: string, data: unknown) => void;

let running = false;

export function startSimulation(broadcast: BroadcastFn): { message: string } {
  if (running) {
    return { message: "Simulation already running" };
  }

  running = true;

  broadcast("simulation_phase", {
    message: "Simulation started.",
  });

  return { message: "Simulation started" };
}

export function stopSimulation(): void {
  if (!running) {
    return;
  }

  running = false;
}

export function isSimulationRunning(): boolean {
  return running;
}

