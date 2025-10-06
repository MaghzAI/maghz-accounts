import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart3, Shield, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6 mb-16">
          <h1 className="text-5xl font-bold tracking-tight">
            MaghzAccounts
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Smart, powerful, and easy-to-use accounting system for modern businesses
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-16">
          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Simple & Fast</CardTitle>
              <CardDescription>
                No accounting complexity. Just simple, intuitive workflows.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Secure & Reliable</CardTitle>
              <CardDescription>
                Double-entry bookkeeping with audit trails and data protection.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Smart Insights</CardTitle>
              <CardDescription>
                Real-time reports and financial analytics at your fingertips.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-2xl">Module 1: Infrastructure Complete ✅</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Next.js 15, TailwindCSS v4, Drizzle ORM, Zustand, and all core dependencies are ready.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              The foundation is set. Ready to build Module 2: Authentication & Security.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
