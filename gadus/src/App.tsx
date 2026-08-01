import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import Home from "@/pages/Home";
import SharedConversation from "@/pages/SharedConversation";
import NotFound from "@/pages/not-found";
import { FloatingWidget } from "@/components/FloatingWidget";
import { SplashScreen } from "@/components/SplashScreen";

const queryClient = new QueryClient();

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  baseTheme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#10b981",
    colorForeground: "#f4f4f5",
    colorMutedForeground: "#a1a1aa",
    colorDanger: "#ef4444",
    colorBackground: "#18181b",
    colorInput: "#27272a",
    colorInputForeground: "#f4f4f5",
    colorNeutral: "#3f3f46",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-zinc-900 rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl border border-zinc-800",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-zinc-100",
    headerSubtitle: "text-zinc-400",
    socialButtonsBlockButtonText: "text-zinc-200",
    formFieldLabel: "text-zinc-300",
    footerActionLink: "text-emerald-400 hover:text-emerald-300",
    footerActionText: "text-zinc-400",
    dividerText: "text-zinc-500",
    identityPreviewEditButton: "text-emerald-400",
    formFieldSuccessText: "text-emerald-400",
    alertText: "text-zinc-200",
    logoBox: "mb-2",
    logoImage: "w-10 h-10",
    socialButtonsBlockButton: "border-zinc-700 bg-zinc-800 hover:bg-zinc-700",
    formButtonPrimary: "bg-emerald-500 hover:bg-emerald-400 text-white",
    formFieldInput: "bg-zinc-800 border-zinc-700 text-zinc-100",
    footerAction: "bg-zinc-900",
    dividerLine: "bg-zinc-700",
    alert: "bg-zinc-800 border-zinc-700",
    otpCodeFieldInput: "bg-zinc-800 border-zinc-600 text-zinc-100",
    formFieldRow: "gap-2",
    main: "gap-4",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Home />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function LandingPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-6">
        <span className="text-primary text-3xl font-bold">G</span>
      </div>
      <h1 className="text-5xl font-bold mb-3 bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent">Gadus</h1>
      <p className="text-muted-foreground text-lg mb-10 max-w-md">Your AI. Amplified. — 12 specialized AI modes powered by state-of-the-art models.</p>
      <div className="flex gap-3">
        <a
          href={`${basePath}/sign-up`}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          Get Started Free
        </a>
        <a
          href={`${basePath}/sign-in`}
          className="px-6 py-3 border border-border rounded-xl font-medium hover:bg-muted/50 transition-colors"
        >
          Sign In
        </a>
      </div>
      <p className="mt-16 text-xs text-muted-foreground/50">Powered by Gadus</p>
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function AppRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Welcome back to Gadus", subtitle: "Sign in to access your AI workspace" } },
        signUp: { start: { title: "Create your Gadus account", subtitle: "Your AI. Amplified." } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/shared/:token" component={SharedConversation} />
            <Route component={NotFound} />
          </Switch>
          <FloatingWidget />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <WouterRouter base={basePath}>
      <AppRoutes />
    </WouterRouter>
  );
}

export default App;
