import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";
import { supportEmail } from "@/lib/env";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "When and how LearnHub issues refunds for course purchases.",
};

export default function RefundsPage() {
  return (
    <LegalPage
      title="Refund Policy"
      updated="21 October 2026"
      intro="Course purchases are digital products that unlock immediately after payment. Because access is instant, refunds are limited to the situations below."
    >
      <h2>1. When we refund</h2>
      <ul>
        <li><strong>Duplicate charge:</strong> you were charged more than once for the same course.</li>
        <li><strong>Unauthorized transaction:</strong> a payment was made without your permission and you report it promptly.</li>
        <li><strong>Payment error:</strong> you were charged but access was not granted, and we cannot resolve it.</li>
        <li><strong>Course unavailable:</strong> we withdraw a course before you complete it and cannot offer a suitable replacement.</li>
      </ul>

      <h2>2. When we do not refund</h2>
      <ul>
        <li>You changed your mind after accessing the lessons.</li>
        <li>You completed the course, passed the exam, or received a certificate.</li>
        <li>You lost access because you breached our <Link href="/terms">Terms of Service</Link>.</li>
        <li>You cannot use the course because of your own device, data or internet limitations.</li>
      </ul>

      <h2>3. How to request a refund</h2>
      <p>
        Email <a href={`mailto:${supportEmail}`}>{supportEmail}</a> within 7 days of the charge. Include your account
        email and the Paystack reference shown under <Link href="/dashboard/payments">your payments</Link>. We may ask for
        additional information to verify the transaction.
      </p>

      <h2>4. Processing</h2>
      <p>
        Approved refunds are returned through Paystack to the original payment method. Processing times depend on your
        bank or card issuer, typically 5–10 business days after approval. Bank charges or currency differences may be
        deducted by the payment provider.
      </p>

      <h2>5. Your statutory rights</h2>
      <p>
        This policy does not limit any rights you have under Nigerian consumer protection law or the rules of your
        card issuer or bank. If a charge looks fraudulent, contact your bank as well as our support team.
      </p>

      <h2>6. Questions</h2>
      <p>
        Not sure whether your situation qualifies? Ask us at{" "}
        <a href={`mailto:${supportEmail}`}>{supportEmail}</a> and we will review it fairly.
      </p>
    </LegalPage>
  );
}
