import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createCheckout, startProTrial } from "@/lib/actions/billing/subscriptions";

export default function PricingPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:py-14">
      <div className="mx-auto max-w-2xl text-center space-y-3">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Pricing</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Start free, then upgrade when you need unlimited AI usage and team features.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-primary/25 bg-primary/5 px-4 py-4 text-center md:mt-10">
        <p className="text-sm font-semibold text-foreground">Invite a friend — earn about one month free</p>
        <p className="mt-1 text-xs text-muted-foreground md:text-sm">
          When someone you refer subscribes to Pro, we add billing credit to your account (and you unlock the Networker achievement on your first successful referral).
        </p>
        <a
          href="/settings"
          className="mt-3 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Get your invite link in Settings
        </a>
      </div>

      <div className="mt-8 grid gap-4 md:mt-10 md:grid-cols-3">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Free</CardTitle>
            <CardDescription>Great to get started</CardDescription>
            <p className="text-3xl font-bold">$0<span className="text-base font-normal text-muted-foreground">/mo</span></p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Daily-limited AI usage</p>
            <p>Marketplace browsing</p>
            <p>Core community features</p>
          </CardContent>
          <div className="p-4 pt-0">
            <a href="/signup" className="w-full">
              <Button className="w-full" variant="outline">Get Started</Button>
            </a>
          </div>
        </Card>

        <Card className="border-primary/40 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Pro</CardTitle>
              <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                7 days free trial
              </span>
            </div>
            <CardDescription>For individual power users</CardDescription>
            <p className="text-3xl font-bold">$12<span className="text-base font-normal text-muted-foreground">/mo</span></p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Unlimited AI tools</p>
            <p>Priority models</p>
            <p>Premium templates</p>
          </CardContent>
          <div className="p-4 pt-0">
            <form
              className="mb-2 w-full"
              action={async () => {
                "use server";
                const result = await startProTrial();
                if (result && "url" in result && result.url) {
                  const { redirect } = await import("next/navigation");
                  redirect(result.url);
                }
              }}
            >
              <Button className="w-full" variant="secondary">Start 7-Day Free Trial</Button>
            </form>
            <form
              className="w-full"
              action={async () => {
                "use server";
                const result = await createCheckout("pro");
                if (result?.url) {
                  const { redirect } = await import("next/navigation");
                  redirect(result.url);
                }
              }}
            >
              <Button className="w-full">Upgrade to Pro</Button>
            </form>
          </div>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Team</CardTitle>
            <CardDescription>For small teams</CardDescription>
            <p className="text-3xl font-bold">$29<span className="text-base font-normal text-muted-foreground">/mo</span></p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Up to 5 seats</p>
            <p>Shared templates</p>
            <p>Team-level management</p>
          </CardContent>
          <div className="p-4 pt-0">
            <form
              className="w-full"
              action={async () => {
                "use server";
                const result = await createCheckout("team");
                if (result?.url) {
                  const { redirect } = await import("next/navigation");
                  redirect(result.url);
                }
              }}
            >
              <Button className="w-full" variant="secondary">Start Team</Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
