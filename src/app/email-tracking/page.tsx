import EmailTracking from "@/components/EmailTracking";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Email Tracking · RIG OS Agency",
  description: "Outbound email telemetry: sent, delivered, opened, clicked, replied. Live Resend data.",
};

export default function EmailTrackingRoute() {
  return (
    <div className="pb-6">
      <EmailTracking />
    </div>
  );
}
