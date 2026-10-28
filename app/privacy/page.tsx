import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";
import { supportEmail } from "@/lib/env";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How LearnHub collects, uses and protects your personal data under the Nigeria Data Protection Act.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="21 October 2026"
      intro="This policy explains what personal data LearnHub collects, why we collect it, and the choices you have. It reflects the Nigeria Data Protection Act (NDPA) and good practice for our learners."
    >
      <h2>1. Data we collect</h2>
      <ul>
        <li><strong>Account data:</strong> your name, email address, password (stored securely by our auth provider) and role.</li>
        <li><strong>Learning data:</strong> enrolments, lesson progress, exam attempts, scores and issued certificates.</li>
        <li><strong>Payment data:</strong> amount, reference, status and provider response. We do not store your card details.</li>
        <li><strong>Content you submit:</strong> course reviews and support messages.</li>
        <li><strong>Technical data:</strong> basic device, browser and log information needed to secure and operate the site.</li>
      </ul>

      <h2>2. Why we use it</h2>
      <ul>
        <li>To create and secure your account, and to provide the courses you enrol in.</li>
        <li>To verify payments and unlock access.</li>
        <li>To track progress, score exams and issue verifiable certificates.</li>
        <li>To display reviews you choose to publish.</li>
        <li>To prevent fraud, abuse and unauthorized access.</li>
        <li>To answer support requests and meet legal obligations.</li>
      </ul>

      <h2>3. Legal bases</h2>
      <p>
        We process data to perform our contract with you (providing courses and certificates), to comply with law,
        for legitimate interests such as security and fraud prevention, and with your consent where required (for
        example, publishing a review).
      </p>

      <h2>4. Who we share it with</h2>
      <ul>
        <li><strong>Supabase</strong> — database and authentication provider.</li>
        <li><strong>Paystack</strong> — payment processing. Paystack handles card data under its own policies.</li>
        <li><strong>YouTube</strong> — lesson videos are embedded from YouTube&apos;s privacy-enhanced domain.</li>
        <li><strong>Hosting providers</strong> — to run and secure the platform.</li>
      </ul>
      <p>We do not sell your personal data.</p>

      <h2>5. Cookies</h2>
      <p>
        We use essential cookies to keep you signed in and to protect forms. We do not use advertising cookies. You
        can clear cookies in your browser, but you will be signed out.
      </p>

      <h2>6. Retention</h2>
      <p>
        Account and learning records are kept while your account is active. Payment and certificate records may be
        retained longer where needed for verification, accounting or legal reasons. Data you delete is removed from
        active systems, subject to backup and legal retention periods.
      </p>

      <h2>7. Your rights</h2>
      <ul>
        <li>Access a copy of your personal data.</li>
        <li>Correct inaccurate details.</li>
        <li>Request deletion of your account and associated data.</li>
        <li>Object to or restrict certain processing.</li>
        <li>Request data portability where applicable.</li>
        <li>Lodge a complaint with the Nigeria Data Protection Commission.</li>
      </ul>
      <p>
        You can update your name and password, or delete your account, from{" "}
        <Link href="/dashboard/settings">account settings</Link>. For other requests, contact us at{" "}
        <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
      </p>

      <h2>8. Children</h2>
      <p>
        The platform is intended for adults. Learners under 18 should use it with the consent and supervision of a
        parent or guardian.
      </p>

      <h2>9. Security</h2>
      <p>
        We use encrypted connections, access controls, row-level security and server-side verification for payments,
        exams and certificates. No system is perfectly secure, so please use a unique password and keep it private.
      </p>

      <h2>10. Changes</h2>
      <p>
        We may update this policy as our services change. The date at the top shows the latest revision.
      </p>
    </LegalPage>
  );
}
