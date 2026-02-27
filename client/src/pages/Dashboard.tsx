import { useState } from "react";
import { useBsvWallet } from "@/hooks/useBsvWallet";
import { useChainFeed } from "@/hooks/useChainFeed";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import ContributorCard from "@/components/ContributorPanel/ContributorCard";
import GeometricAvatar from "@/components/ContributorPanel/GeometricAvatar";
import FeedList from "@/components/RightPanel/FeedList";
import TorusCarousel from "@/components/CenterStage/TorusCarousel";

const PROJECT_ID = import.meta.env.VITE_PROJECT_ID ?? "";

interface ContributionResult {
  id: string;
  txid: string;
  projectId: string;
  contributorAddress: string;
  text: string;
  timestamp: number | string;
  blockHeight?: number | null;
  sharePercent?: number | null;
}

interface ShareResult {
  address: string;
  sharePercent: number;
  contributionCount: number;
}

export default function Dashboard() {
  const { toast } = useToast();
  const { contributions, shares, isLoading } = useChainFeed(PROJECT_ID);
  const { connected, ordAddress, connect, inscribeContribution } = useBsvWallet();
  const [newlyInscribedTxid, setNewlyInscribedTxid] = useState<string | null>(null);

  const contributionList = (contributions ?? []) as ContributionResult[];
  const shareList = (shares ?? []) as ShareResult[];

  const uniqueAddresses = Array.from(
    new Set(contributionList.map((c) => c.contributorAddress))
  );

  const handleInscribe = async (text: string) => {
    try {
      const { txid } = await inscribeContribution(PROJECT_ID, text);

      toast({
        title: "Submitted to BSV mainnet.",
        description: "Waiting for chain confirmation.",
      });

      setNewlyInscribedTxid(txid);

      setTimeout(() => {
        toast({
          title: "Your contribution is permanent.",
          description:
            "No one can delete it. No one can change it. This is yours.",
          duration: 6000,
        });
      }, 8000);

      setTimeout(() => setNewlyInscribedTxid(null), 15000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";

      if (message.toLowerCase().includes("yours") || message.toLowerCase().includes("wallet")) {
        toast({
          title: "Yours Wallet not found.",
          description: "Install it at yours.org to contribute onchain.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Inscription failed.",
        description: message,
        variant: "destructive",
      });
    }
  };

  if (!PROJECT_ID) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2 text-muted-foreground">
          <p className="font-medium">Genesis inscription pending.</p>
          <p className="text-sm">
            The chain starts when the first contribution lands.
          </p>
        </div>
      </div>
    );
  }

  if (!isLoading && contributionList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <div className="max-w-md text-center space-y-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            therealbitcoin.fun
          </h1>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>This is where the build happens.</p>
            <p>
              Every contribution gets written permanently
              to BSV mainnet. The chain is the record.
            </p>
            <p>
              Contribute from anywhere.
              Your inscription appears here when it lands.
            </p>
          </div>
          <Button onClick={connect} size="lg" className="w-full max-w-xs">
            Connect Yours Wallet
          </Button>
        </div>
      </div>
    );
  }

  if (contributionList.length > 0 && !connected) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="flex items-center justify-between px-6 py-4 border-b">
          <span className="font-semibold tracking-tight">therealbitcoin.fun</span>
          <Button variant="outline" size="sm" onClick={connect}>
            Connect Wallet
          </Button>
        </header>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] overflow-hidden">
          <div className="hidden lg:flex flex-col border-r p-6 space-y-4 overflow-y-auto">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Contributors
            </h2>
            {uniqueAddresses.map((address) => (
              <div key={address} className="flex items-center gap-3">
                <GeometricAvatar address={address} size={32} />
                <span className="text-sm font-mono text-muted-foreground truncate">
                  {truncateAddress(address)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col overflow-hidden">
            <div className="lg:hidden flex gap-2 p-4 border-b">
              {uniqueAddresses.slice(0, 5).map((addr) => (
                <GeometricAvatar key={addr} address={addr} size={28} />
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <FeedList
                contributions={contributionList}
                highlightAddress={null}
                newlyInscribedTxid={newlyInscribedTxid}
              />
            </div>
          </div>

          <div className="hidden lg:flex flex-col items-center justify-center border-l p-12 space-y-6">
            <div className="text-center space-y-6">
              <p className="text-lg font-medium leading-snug text-foreground">
                The chain doesn&apos;t know
                <br />
                you exist yet.
              </p>
              <div className="space-y-3">
                <Button onClick={connect} variant="ghost" className="text-base">
                  Connect Yours Wallet →
                </Button>
                <p className="text-xs text-muted-foreground">
                  Yours Wallet is a BSV browser extension.
                  <br />
                  Install at yours.org — takes 2 minutes.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:hidden border-t p-6 space-y-4 text-center">
            <p className="font-medium">
              The chain doesn&apos;t know you exist yet.
            </p>
            <Button onClick={connect} variant="ghost">
              Connect Yours Wallet →
            </Button>
            <p className="text-xs text-muted-foreground">
              Yours Wallet is a BSV browser extension.
              Install at yours.org — takes 2 minutes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (contributionList.length > 0 && connected) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="flex items-center justify-between px-6 py-4 border-b">
          <span className="font-semibold tracking-tight">therealbitcoin.fun</span>
          <div className="flex items-center gap-2">
            <GeometricAvatar address={ordAddress} size={24} />
            <span className="text-sm font-mono text-muted-foreground">
              {truncateAddress(ordAddress)} ✓
            </span>
          </div>
        </header>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] overflow-hidden">
          <div className="hidden lg:flex flex-col border-r p-6 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Contributors
              </h2>
              <ShareTooltip />
            </div>
            {shareList
              .slice()
              .sort((a, b) => b.sharePercent - a.sharePercent)
              .map((share) => (
                <ContributorCard
                  key={share.address}
                  address={share.address}
                  sharePercent={share.sharePercent}
                  isCurrentUser={share.address === ordAddress}
                  contributionCount={share.contributionCount}
                />
              ))}
            {!shareList.find((s) => s.address === ordAddress) && (
              <ContributorCard
                address={ordAddress}
                sharePercent={0}
                isCurrentUser
                contributionCount={0}
              />
            )}
          </div>

          <div className="flex flex-col overflow-hidden">
            <div className="p-6 border-b space-y-4">
              <TorusCarousel
                shares={shareList}
                currentUserAddress={ordAddress}
                highlightNewTxid={newlyInscribedTxid}
              />
              <div className="text-center space-y-1">
                <h1 className="text-base font-semibold">therealbitcoin.fun</h1>
                <p className="text-sm text-muted-foreground">
                  Built onchain. One contribution at a time.
                </p>
                <p className="text-xs text-muted-foreground">
                  {contributionList.length} contribution
                  {contributionList.length !== 1 ? "s" : ""} ·{" "}
                  {shareList.length} contributor
                  {shareList.length !== 1 ? "s" : ""}
                </p>
                {PROJECT_ID && (
                  <a
                    href={`https://whatsonchain.com/tx/${PROJECT_ID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View genesis on WhatsOnChain ↗
                  </a>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <FeedList
                contributions={contributionList}
                highlightAddress={ordAddress}
                newlyInscribedTxid={newlyInscribedTxid}
              />
            </div>
          </div>

          <div className="hidden lg:flex flex-col border-l overflow-y-auto">
            <ContributeSection ordAddress={ordAddress} onInscribe={handleInscribe} />
          </div>

          <div className="lg:hidden border-t">
            <details className="border-b">
              <summary className="px-6 py-3 text-sm font-medium cursor-pointer">
                Contributors [{shareList.length}] ▼
              </summary>
              <div className="px-6 pb-4 space-y-3">
                {shareList
                  .slice()
                  .sort((a, b) => b.sharePercent - a.sharePercent)
                  .map((share) => (
                    <ContributorCard
                      key={share.address}
                      address={share.address}
                      sharePercent={share.sharePercent}
                      isCurrentUser={share.address === ordAddress}
                      contributionCount={share.contributionCount}
                    />
                  ))}
                {!shareList.find((s) => s.address === ordAddress) && (
                  <ContributorCard
                    address={ordAddress}
                    sharePercent={0}
                    isCurrentUser
                    contributionCount={0}
                  />
                )}
              </div>
            </details>
            <ContributeSection ordAddress={ordAddress} onInscribe={handleInscribe} />
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function ContributeSection({
  ordAddress,
  onInscribe,
}: {
  ordAddress: string;
  onInscribe: (text: string) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [inscribing, setInscribing] = useState(false);

  const charCount = text.length;
  const hasRecencyBonus = charCount >= 100;

  const handleClick = async () => {
    if (!text.trim() || inscribing) {
      return;
    }
    setInscribing(true);
    await onInscribe(text);
    setText("");
    setInscribing(false);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">What did you build today?</p>
        <p className="text-sm text-muted-foreground">
          What do you know that no one else does?
        </p>
        <p className="text-xs text-muted-foreground">
          Write it. It goes on chain permanently.
        </p>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder=""
        rows={5}
        className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />

      <div className="flex items-center justify-between">
        <span
          className={`text-xs ${
            hasRecencyBonus ? "text-green-600" : "text-muted-foreground"
          }`}
        >
          {charCount} chars
          {!hasRecencyBonus && charCount > 0 && (
            <span className="ml-1 opacity-60">
              / 100+ unlocks recency bonus
            </span>
          )}
          {hasRecencyBonus && (
            <span className="ml-1">✓ recency bonus unlocked</span>
          )}
        </span>
      </div>

      <Button
        onClick={handleClick}
        disabled={!text.trim() || inscribing}
        className="w-full"
      >
        {inscribing ? "Inscribing..." : "Inscribe to BSV Mainnet"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Already contributing on X or Telegram?
        Your inscriptions appear here automatically
        once they hit chain. No extra step needed.
      </p>
    </div>
  );
}

function ShareTooltip() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        [?] What is a share?
      </button>
      {open && (
        <div className="absolute right-0 top-6 z-50 w-72 rounded-lg border bg-background p-4 shadow-lg space-y-3 text-xs text-muted-foreground leading-relaxed">
          <p>A share is your stake in this project.</p>
          <p>
            The fairness engine reads what&apos;s on chain — your
            contributions, when they landed, how much they moved things
            forward.
          </p>
          <p>
            Your share updates automatically as the project grows. Early
            contributions carry more weight. Better contributions that come
            later shift the balance. That&apos;s the mechanism. The chain keeps
            the record.
          </p>
          <p>
            When this project generates revenue, shares determine how it&apos;s
            distributed — automatically, onchain, no middleman.
          </p>
          <p className="font-medium text-foreground">
            Right now: your share is your permanent proof that you were here
            and you built this.
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs opacity-50 hover:opacity-100"
          >
            close
          </button>
        </div>
      )}
    </div>
  );
}

function truncateAddress(address: string): string {
  if (!address || address.length < 12) {
    return address;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

