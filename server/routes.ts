import type { Express } from "express";
import { type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { store } from "./storage";
import { fairnessEngine } from "./fairness-engine";
import { startSimulation, stopSimulation, isSimulationRunning } from "./simulation";
import { contributeSchema, revenueSchema } from "@shared/schema";
import type { ContributionType } from "@shared/schema";
import { registerRealAppRoutes } from "./real-app-routes";

const clients = new Set<WebSocket>();

function broadcast(type: string, data: any) {
  const message = JSON.stringify({ type, data, timestamp: Date.now() });
  Array.from(clients).forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch {}
    }
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (_req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    if (request.url === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log(`[WebSocket] Client connected (${clients.size} total)`);

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`[WebSocket] Client disconnected (${clients.size} total)`);
    });

    ws.on('error', () => {
      clients.delete(ws);
    });
  });

  const passiveInterval = setInterval(() => {
    if (store.contributors.size > 0) {
      fairnessEngine.calculateShares(store.contributors, store.contributions);
      broadcast('shares_updated', { contributors: store.getAllContributorsSorted(), timestamp: Date.now() });
    }
  }, 10000);

  registerRealAppRoutes(app, broadcast);

  app.post('/api/contribute', (req, res) => {
    try {
      const parsed = contributeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const { username, content, type } = parsed.data;
      const contributionType: ContributionType = type || 'idea';

      const contributor = store.getOrCreateContributor(username);
      const score = fairnessEngine.scoreContribution(content, contributionType, store.contributions);

      const decayChanges = fairnessEngine.decayScores(store.contributions);
      for (const change of decayChanges) {
        broadcast('score_decayed', change);
      }

      const contribution = store.addContribution(contributor.id, content, contributionType, score);

      const referenced = fairnessEngine.detectReferences(content, store.contributions.filter(c => c.id !== contribution.id));
      if (referenced) {
        const boostAmount = fairnessEngine.boostReferenced(referenced, contribution.id);
        if (boostAmount > 0) {
          const targetContributor = store.getContributorById(referenced.contributor_id);
          broadcast('boost_applied', {
            from_id: contribution.id,
            to_id: referenced.id,
            boost_amount: boostAmount,
            from_username: contributor.username,
            to_username: targetContributor?.username || 'unknown',
          });
        }
      }

      const oldStatuses = new Map<string, string>();
      store.contributors.forEach((c, id) => oldStatuses.set(id, c.status));

      fairnessEngine.calculateShares(store.contributors, store.contributions);

      store.contributors.forEach((c, id) => {
        const old = oldStatuses.get(id);
        if (old && old !== c.status) {
          broadcast('status_changed', { contributor_id: id, username: c.username, old_status: old, new_status: c.status });
        }
      });

      broadcast('contribution_added', { contribution, contributor: store.getContributorById(contributor.id) });
      broadcast('shares_updated', { contributors: store.getAllContributorsSorted(), timestamp: Date.now(), new_contributions_count: 1 });

      const updated = store.getContributorById(contributor.id);
      const total_pool_score = store.contributions.reduce((s, c) => s + c.current_score, 0);
      res.json({ contribution, contributor: updated, total_pool_score });
    } catch (err: any) {
      console.error('[API] Error in POST /contribute:', err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  app.get('/api/shares', (_req, res) => {
    try {
      const contributors = store.getAllContributorsSorted().map(c => ({
        ...c,
        share_history: c.share_history.slice(-20),
      }));
      const globalStats = {
        total_contributors: store.contributors.size,
        total_revenue: store.revenueEvents.reduce((s, e) => s + e.amount_satoshis, 0),
        total_contributions: store.contributions.length,
      };
      res.json({ contributors, globalStats });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/revenue', (req, res) => {
    try {
      const parsed = revenueSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      if (store.contributors.size === 0) {
        return res.status(400).json({ error: 'No contributors to distribute to' });
      }

      const event = fairnessEngine.distributeRevenue(parsed.data.amount_satoshis, store.contributors);
      store.addRevenueEvent(event);

      const runningTotals: Record<string, number> = {};
      store.contributors.forEach(c => { runningTotals[c.username] = c.total_satoshis_earned; });

      broadcast('revenue_distributed', {
        amount: parsed.data.amount_satoshis,
        distribution: event.distribution,
        running_totals: runningTotals,
      });

      res.json(event);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/payouts', (_req, res) => {
    try {
      const payouts = store.revenueEvents.map(e => ({
        ...e,
      }));

      const perContributor: Record<string, { username: string; total: number; events: number }> = {};
      for (const event of store.revenueEvents) {
        for (const d of event.distribution) {
          if (!perContributor[d.contributor_id]) {
            perContributor[d.contributor_id] = { username: d.username, total: 0, events: 0 };
          }
          perContributor[d.contributor_id].total += d.amount;
          perContributor[d.contributor_id].events++;
        }
      }

      res.json({ payouts, per_contributor: perContributor });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/leaderboard', (_req, res) => {
    try {
      const contributors = store.getAllContributorsSorted();

      const byShare = contributors.slice(0, 10).map(c => ({
        username: c.username,
        share_pct: c.current_share_pct,
        status: c.status,
      }));

      const byEarnings = [...contributors]
        .sort((a, b) => b.total_satoshis_earned - a.total_satoshis_earned)
        .slice(0, 10)
        .map(c => ({ username: c.username, satoshis_earned: c.total_satoshis_earned }));

      const byContributions = [...contributors]
        .sort((a, b) => b.contributions.length - a.contributions.length)
        .slice(0, 10)
        .map(c => ({ username: c.username, count: c.contributions.length }));

      const byAvgScore = [...contributors]
        .map(c => {
          const contribs = store.contributions.filter(co => co.contributor_id === c.id);
          const avg = contribs.length > 0 ? contribs.reduce((s, co) => s + co.current_score, 0) / contribs.length : 0;
          return { username: c.username, avg_score: Math.round(avg * 100) / 100 };
        })
        .sort((a, b) => b.avg_score - a.avg_score)
        .slice(0, 10);

      const withMomentum = contributors.map(c => {
        const history = c.share_history;
        let momentum = 0;
        if (history.length >= 2) {
          const recent = history.filter(h => h[0] > Date.now() - 60000);
          if (recent.length >= 2) {
            momentum = recent[recent.length - 1][1] - recent[0][1];
          }
        }
        return { username: c.username, momentum: Math.round(momentum * 100) / 100, share_pct: c.current_share_pct };
      }).sort((a, b) => b.momentum - a.momentum).slice(0, 10);

      res.json({ byShare, byEarnings, byContributions, byAvgScore, withMomentum });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/simulate/run', (_req, res) => {
    try {
      const result = startSimulation(broadcast);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/simulate/stop', (_req, res) => {
    try {
      stopSimulation();
      res.json({ message: 'Simulation stopped' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/simulate/status', (_req, res) => {
    res.json({ running: isSimulationRunning() });
  });

  app.get('/api/state', (_req, res) => {
    try {
      const state = store.getState();
      res.json({ ...state, simulation_running: isSimulationRunning() });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/audit/:contribution_id', (req, res) => {
    try {
      const contribution = store.getContributionById(req.params.contribution_id);
      if (!contribution) {
        return res.status(404).json({ error: 'Contribution not found' });
      }

      const contributor = store.getContributorById(contribution.contributor_id);

      res.json({
        contribution,
        contributor: contributor ? {
          username: contributor.username,
          current_share_pct: contributor.current_share_pct,
          status: contributor.status,
        } : null,
        score_history: contribution.score_history,
        factors: {
          type: contribution.type,
          base_score: contribution.base_score,
          current_score: contribution.current_score,
          decay_applied: contribution.base_score - contribution.current_score > 0.01,
          times_referenced: contribution.referenced_by.length,
          decay_rate_current: contribution.referenced_by.length > 0 ? 0.0075 : 0.015,
          is_synthesis: contribution.type === 'synthesis',
          min_score_floor: contribution.base_score * 0.15,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  console.log(`
╔══════════════════════════════════════════════════════╗
║       BSV FAIRNESS ENGINE — SIMULATION SERVER        ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  API ENDPOINTS:                                      ║
║  ├─ POST /api/contribute    Submit a contribution    ║
║  ├─ GET  /api/shares        Current share breakdown  ║
║  ├─ POST /api/revenue       Inject revenue (sats)    ║
║  ├─ GET  /api/payouts       Full payout history      ║
║  ├─ GET  /api/leaderboard   Top contributors         ║
║  ├─ GET  /api/simulate/run  Start simulation         ║
║  ├─ GET  /api/simulate/stop Stop simulation          ║
║  ├─ GET  /api/state         Full state snapshot      ║
║  └─ GET  /api/audit/:id     Contribution audit       ║
║                                                      ║
║  WEBSOCKET: /ws                                      ║
║  Events: contribution_added, shares_updated,         ║
║          revenue_distributed, score_decayed,         ║
║          boost_applied, status_changed,              ║
║          simulation_phase                            ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
`);

  return httpServer;
}
