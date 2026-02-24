import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useWebSocket, type WSEvent } from "@/hooks/use-websocket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import {
  Zap, Users, Coins, FileText, Play, Square, TrendingUp, TrendingDown, Minus,
  Send, Activity, ArrowUpRight, ArrowDownRight, Sparkles, Gift, AlertTriangle,
  Radio, Clock, Award, BarChart3, Hash, Target
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import type { Contributor, Contribution, AppState } from "@shared/schema";

const TYPE_COLORS: Record<string, string> = {
  idea: 'bg-amber-500/20 text-amber-400',
  code: 'bg-blue-500/20 text-blue-400',
  design: 'bg-purple-500/20 text-purple-400',
  critique: 'bg-rose-500/20 text-rose-400',
  synthesis: 'bg-emerald-500/20 text-emerald-400',
};

const TYPE_BORDER_COLORS: Record<string, string> = {
  idea: 'border-l-amber-500',
  code: 'border-l-blue-500',
  design: 'border-l-purple-500',
  critique: 'border-l-rose-500',
  synthesis: 'border-l-emerald-500',
};

const STATUS_CONFIG: Record<string, { icon: typeof TrendingUp; color: string; label: string }> = {
  rising: { icon: TrendingUp, color: 'text-emerald-400', label: 'Rising' },
  stable: { icon: Minus, color: 'text-blue-400', label: 'Stable' },
  decaying: { icon: TrendingDown, color: 'text-rose-400', label: 'Decaying' },
};

function getAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

function formatSats(sats: number): string {
  if (sats >= 1000000) return `${(sats / 1000000).toFixed(2)}M`;
  if (sats >= 1000) return `${(sats / 1000).toFixed(1)}k`;
  return sats.toLocaleString();
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return 'now';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

function MiniSparkline({ data }: { data: [number, number][] }) {
  if (data.length < 2) return null;
  const chartData = data.map(([t, v]) => ({ t, v }));
  const trend = chartData[chartData.length - 1].v - chartData[0].v;
  const color = trend > 0 ? '#34d399' : trend < 0 ? '#f87171' : '#60a5fa';

  return (
    <div className="w-14 h-5 flex-shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ContributorRow({ contributor, rank }: { contributor: Contributor; rank: number }) {
  const statusConfig = STATUS_CONFIG[contributor.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-md hover-elevate" data-testid={`contributor-row-${contributor.username}`}>
      <span className="text-xs font-mono text-muted-foreground w-5 text-right flex-shrink-0">
        {rank}
      </span>
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{ backgroundColor: getAvatarColor(contributor.avatar_seed), color: '#fff' }}
      >
        {contributor.username.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium truncate">{contributor.username}</span>
          <StatusIcon className={`w-3 h-3 flex-shrink-0 ${statusConfig.color}`} />
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-[80px]">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min(100, contributor.current_share_pct)}%` }}
            />
          </div>
          <span className="text-xs font-mono text-primary font-semibold flex-shrink-0">
            {contributor.current_share_pct.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        <span className="text-xs font-mono text-muted-foreground">{formatSats(contributor.total_satoshis_earned)} sats</span>
        <MiniSparkline data={contributor.share_history} />
      </div>
    </div>
  );
}

function FeedItem({ event }: { event: WSEvent }) {
  const config = useMemo(() => {
    switch (event.type) {
      case 'contribution_added':
        return {
          icon: <FileText className="w-3.5 h-3.5 text-amber-400" />,
          border: TYPE_BORDER_COLORS[event.data?.contribution?.type] || 'border-l-muted',
          message: `${event.data?.contributor?.username || 'unknown'} submitted a ${event.data?.contribution?.type || 'contribution'}`,
          detail: event.data?.contribution?.content?.slice(0, 80) + (event.data?.contribution?.content?.length > 80 ? '...' : ''),
          score: event.data?.contribution?.current_score?.toFixed(1),
        };
      case 'revenue_distributed':
        return {
          icon: <Coins className="w-3.5 h-3.5 text-primary" />,
          border: 'border-l-primary',
          message: `${formatSats(event.data?.amount || 0)} sats distributed`,
          detail: event.data?.distribution?.slice(0, 3).map((d: any) => `${d.username}: ${d.amount}`).join(', '),
        };
      case 'boost_applied':
        return {
          icon: <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />,
          border: 'border-l-emerald-500',
          message: `${event.data?.to_username}'s contribution boosted +8%`,
          detail: `Referenced by ${event.data?.from_username}`,
        };
      case 'score_decayed':
        return {
          icon: <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />,
          border: 'border-l-rose-500',
          message: `Score decayed`,
          detail: `${event.data?.old_score?.toFixed(1)} → ${event.data?.new_score?.toFixed(1)}`,
        };
      case 'status_changed':
        return {
          icon: <Activity className="w-3.5 h-3.5 text-blue-400" />,
          border: 'border-l-blue-500',
          message: `${event.data?.username} is now ${event.data?.new_status}`,
          detail: `Was ${event.data?.old_status}`,
        };
      case 'simulation_phase':
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-primary" />,
          border: 'border-l-primary',
          message: `Phase ${event.data?.phase}`,
          detail: event.data?.message,
          highlight: true,
        };
      default:
        return null;
    }
  }, [event.type, event.data]);

  if (!config) return null;

  return (
    <div className={`border-l-2 ${config.border} pl-3 py-2 ${config.highlight ? 'bg-primary/5 rounded-r-md' : ''}`} data-testid={`feed-item-${event.type}`}>
      <div className="flex items-center gap-2">
        {config.icon}
        <span className="text-sm font-medium flex-1">{config.message}</span>
        {config.score && (
          <span className="text-xs font-mono text-primary">+{config.score}</span>
        )}
        <span className="text-xs text-muted-foreground flex-shrink-0">{timeAgo(event.timestamp)}</span>
      </div>
      {config.detail && (
        <p className="text-xs text-muted-foreground mt-1 ml-5 truncate">{config.detail}</p>
      )}
    </div>
  );
}

function LeaderboardTab({ data, valueKey, label, format }: {
  data: any[];
  valueKey: string;
  label: string;
  format?: (v: any) => string;
}) {
  return (
    <div className="space-y-1">
      {data.map((item: any, i: number) => (
        <div key={item.username} className="flex items-center gap-2 py-1.5 px-2 rounded-md text-sm">
          <span className="text-xs font-mono text-muted-foreground w-4 text-right">{i + 1}</span>
          <span className="flex-1 truncate">{item.username}</span>
          <span className="text-xs font-mono text-primary font-semibold">
            {format ? format(item[valueKey]) : item[valueKey]}
          </span>
        </div>
      ))}
      {data.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { toast } = useToast();
  const { isConnected, events } = useWebSocket();
  const feedRef = useRef<HTMLDivElement>(null);

  const [username, setUsername] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('idea');

  const { data: appState, refetch: refetchState } = useQuery<AppState & { simulation_running: boolean }>({
    queryKey: ['/api/state'],
    refetchInterval: 3000,
  });

  const { data: leaderboard } = useQuery<any>({
    queryKey: ['/api/leaderboard'],
    refetchInterval: 5000,
  });

  const displayContributors = useMemo(() => {
    const latestSharesEvent = [...events].reverse().find(e => e.type === 'shares_updated');
    if (latestSharesEvent?.data?.contributors) {
      return latestSharesEvent.data.contributors as Contributor[];
    }
    return appState?.contributors || [];
  }, [events, appState?.contributors]);

  const feedEvents = useMemo(() => {
    return events
      .filter(e => ['contribution_added', 'revenue_distributed', 'boost_applied', 'status_changed', 'simulation_phase'].includes(e.type))
      .slice(-50)
      .reverse();
  }, [events]);

  const globalStats = useMemo(() => {
    return appState?.globalStats || { total_contributors: 0, total_revenue: 0, total_contributions: 0 };
  }, [appState?.globalStats]);

  const startSimMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/simulate/run');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Simulation started', description: 'The fairness engine is running.' });
      queryClient.invalidateQueries({ queryKey: ['/api/state'] });
    },
  });

  const stopSimMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/simulate/stop');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Simulation stopped' });
      queryClient.invalidateQueries({ queryKey: ['/api/state'] });
    },
  });

  const contributeMutation = useMutation({
    mutationFn: async (data: { username: string; content: string; type: string }) => {
      const res = await apiRequest('POST', '/api/contribute', data);
      return res.json();
    },
    onSuccess: (data) => {
      setContent('');
      toast({
        title: 'Contribution submitted',
        description: `Score: ${data.contribution?.current_score?.toFixed(1)} | Share: ${data.contributor?.current_share_pct?.toFixed(2)}%`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/state'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leaderboard'] });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const handleContribute = () => {
    if (!username.trim() || !content.trim()) {
      toast({ title: 'Missing fields', description: 'Username and content are required', variant: 'destructive' });
      return;
    }
    contributeMutation.mutate({ username: username.trim(), content: content.trim(), type });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b px-4 lg:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight" data-testid="text-app-title">BSV Fairness Engine</h1>
            <p className="text-xs text-muted-foreground">Contribution Attribution Economy</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                <span className="text-xs text-muted-foreground">{isConnected ? 'Live' : 'Offline'}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>WebSocket {isConnected ? 'connected' : 'disconnected'}</TooltipContent>
          </Tooltip>

          {appState?.simulation_running ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => stopSimMutation.mutate()}
              disabled={stopSimMutation.isPending}
              data-testid="button-stop-simulation"
            >
              <Square className="w-3.5 h-3.5 mr-1.5" />
              Stop
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => startSimMutation.mutate()}
              disabled={startSimMutation.isPending}
              data-testid="button-start-simulation"
            >
              <Play className="w-3.5 h-3.5 mr-1.5" />
              Start Simulation
            </Button>
          )}
        </div>
      </header>

      <div className="border-b px-4 lg:px-6 py-2.5 flex items-center gap-4 lg:gap-8 flex-wrap">
        <div className="flex items-center gap-2" data-testid="stat-contributors">
          <Users className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-muted-foreground">Contributors</span>
          <span className="text-sm font-bold font-mono">{globalStats.total_contributors}</span>
        </div>
        <div className="flex items-center gap-2" data-testid="stat-revenue">
          <Coins className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground">Revenue</span>
          <span className="text-sm font-bold font-mono">{formatSats(globalStats.total_revenue)} sats</span>
        </div>
        <div className="flex items-center gap-2" data-testid="stat-contributions">
          <FileText className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-muted-foreground">Contributions</span>
          <span className="text-sm font-bold font-mono">{globalStats.total_contributions}</span>
        </div>
        <div className="flex items-center gap-2" data-testid="stat-websocket">
          <Radio className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Events</span>
          <span className="text-sm font-bold font-mono">{events.length}</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 lg:p-4 min-h-0 overflow-auto">
        <div className="lg:col-span-4 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="pb-2 flex-shrink-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Share Rankings
                <Badge variant="secondary" className="ml-auto text-xs">{displayContributors.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-0">
              <ScrollArea className="h-full max-h-[calc(100vh-280px)]">
                <div className="px-4 pb-4 space-y-0.5">
                  {displayContributors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Users className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">No contributors yet</p>
                      <p className="text-xs mt-1">Start the simulation or submit a contribution</p>
                    </div>
                  ) : (
                    displayContributors.map((c, i) => (
                      <ContributorRow key={c.id} contributor={c} rank={i + 1} />
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="pb-2 flex-shrink-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Live Activity
                {feedEvents.length > 0 && (
                  <Badge variant="secondary" className="ml-auto text-xs">{feedEvents.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-0">
              <ScrollArea className="h-full max-h-[calc(100vh-280px)]" ref={feedRef}>
                <div className="px-4 pb-4 space-y-1">
                  {feedEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Activity className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">No activity yet</p>
                      <p className="text-xs mt-1">Events will appear here in real-time</p>
                    </div>
                  ) : (
                    feedEvents.map((event, i) => (
                      <FeedItem key={`${event.type}-${event.timestamp}-${i}`} event={event} />
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Send className="w-4 h-4 text-primary" />
                Contribute
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="text-sm"
                data-testid="input-username"
              />
              <Textarea
                placeholder="Your contribution..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="text-sm resize-none min-h-[60px]"
                data-testid="input-content"
              />
              <div className="flex items-center gap-2">
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="flex-1 text-sm" data-testid="select-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="idea">Idea</SelectItem>
                    <SelectItem value="code">Code</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="critique">Critique</SelectItem>
                    <SelectItem value="synthesis">Synthesis</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={handleContribute}
                  disabled={contributeMutation.isPending}
                  data-testid="button-submit-contribution"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="pb-2 flex-shrink-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-0">
              <Tabs defaultValue="share" className="flex flex-col h-full">
                <TabsList className="mx-4 mb-2 grid grid-cols-4">
                  <TabsTrigger value="share" className="text-xs">Share</TabsTrigger>
                  <TabsTrigger value="earned" className="text-xs">Earned</TabsTrigger>
                  <TabsTrigger value="count" className="text-xs">Count</TabsTrigger>
                  <TabsTrigger value="momentum" className="text-xs">Speed</TabsTrigger>
                </TabsList>
                <ScrollArea className="flex-1 max-h-[calc(100vh-520px)]">
                  <div className="px-4 pb-4">
                    <TabsContent value="share" className="mt-0">
                      <LeaderboardTab
                        data={leaderboard?.byShare || []}
                        valueKey="share_pct"
                        label="Share"
                        format={(v) => `${v.toFixed(1)}%`}
                      />
                    </TabsContent>
                    <TabsContent value="earned" className="mt-0">
                      <LeaderboardTab
                        data={leaderboard?.byEarnings || []}
                        valueKey="satoshis_earned"
                        label="Earned"
                        format={(v) => `${formatSats(v)}`}
                      />
                    </TabsContent>
                    <TabsContent value="count" className="mt-0">
                      <LeaderboardTab
                        data={leaderboard?.byContributions || []}
                        valueKey="count"
                        label="Count"
                      />
                    </TabsContent>
                    <TabsContent value="momentum" className="mt-0">
                      <LeaderboardTab
                        data={leaderboard?.withMomentum || []}
                        valueKey="momentum"
                        label="Momentum"
                        format={(v) => `${v > 0 ? '+' : ''}${v.toFixed(2)}`}
                      />
                    </TabsContent>
                  </div>
                </ScrollArea>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
