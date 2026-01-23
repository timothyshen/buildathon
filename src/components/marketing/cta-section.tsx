import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WaitlistForm } from "./waitlist-form";

export function CTASection() {
  return (
    <section id="waitlist" className="bg-muted/50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Join the Waitlist</CardTitle>
              <CardDescription>
                Be the first to know when SWA.XYZ launches. Early access for waitlist members.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WaitlistForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
