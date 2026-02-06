import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  Timer,
  BarChart3,
  Cloud,
  Shield,
  ArrowRight,
  Clock,
  Target,
  TrendingUp,
} from "lucide-react";
import dashboardPreview from "@/assets/dashboard-preview.png";

const features = [
  {
    icon: Timer,
    title: "Live Earnings Timer",
    description:
      "Watch your earnings grow in real-time as you work. Start, pause, and track every session effortlessly.",
  },
  {
    icon: BarChart3,
    title: "Visual Analytics",
    description:
      "Beautiful charts and breakdowns of your daily, weekly, and monthly earnings at a glance.",
  },
  {
    icon: Target,
    title: "Goal Tracking",
    description:
      "Set daily or session-based earning goals and see your progress with a satisfying progress bar.",
  },
  {
    icon: Cloud,
    title: "Cloud Sync",
    description:
      "Your data is securely synced across all your devices. Log in anywhere and pick up where you left off.",
  },
  {
    icon: Clock,
    title: "Session Logs",
    description:
      "Keep a detailed history of every work session—duration, earnings, notes, and more.",
  },
  {
    icon: Shield,
    title: "Private & Secure",
    description:
      "Your financial data is encrypted and only accessible to you. No third-party tracking.",
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container max-w-6xl mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary text-primary-foreground">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">EarnWise</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Log in</Link>
            </Button>
            <Button asChild>
              <Link to="/auth?tab=signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
            <TrendingUp className="w-4 h-4" />
            Track every dollar you earn
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Know exactly what your
            <span className="block earnings-number text-5xl sm:text-6xl md:text-7xl">
              time is worth
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            EarnWise is the real-time earnings tracker for freelancers, gig
            workers, and anyone who values their time. Start the timer, see
            your money grow, and hit your goals—every single day.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Button size="lg" className="text-base px-8 h-12 gap-2" asChild>
              <Link to="/auth?tab=signup">
                Start Tracking Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 h-12"
              asChild
            >
              <Link to="/auth">I already have an account</Link>
            </Button>
          </div>

          {/* Dashboard Preview */}
          <div className="pt-8 max-w-5xl mx-auto">
            <div className="rounded-xl overflow-hidden shadow-2xl border border-border/50 ring-1 ring-border/20">
              <img
                src={dashboardPreview}
                alt="EarnWise dashboard showing timer, earnings, and goal tracking"
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-14 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Everything you need to track earnings
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Simple, powerful, and built for people who work on their own
              terms.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="glass-card rounded-xl p-6 space-y-3 card-hover"
              >
                <div className="inline-flex p-2.5 rounded-lg bg-primary/10 text-primary">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="container max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Ready to see what your time is really worth?
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Join thousands of freelancers and gig workers who use EarnWise to
            stay motivated and hit their income goals.
          </p>
          <Button size="lg" className="text-base px-10 h-12 gap-2" asChild>
            <Link to="/auth?tab=signup">
              Create Your Free Account
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            <span>EarnWise</span>
          </div>
          <p>&copy; {new Date().getFullYear()} EarnWise. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
