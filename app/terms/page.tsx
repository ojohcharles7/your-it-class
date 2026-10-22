import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";
import { supportEmail } from "@/lib/env";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply when you use Your IT Class to learn, enrol and earn certificates.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="21 October 2026"
      intro="These terms govern your use of Your IT Class, an online learning platform operated by Charitech Concepts & Services. By creating an account or enrolling in a course, you agree to these terms."
    >
      <h2>1. Your account</h2>
      <ul>
        <li>You must provide accurate details and keep your login credentials secure.</li>
        <li>You are responsible for activity carried out under your account.</li>
        <li>One account is for one person. Do not share access or resell course materials.</li>
        <li>You must be at least 18 years old, or have permission from a parent or guardian.</li>
      </ul>

      <h2>2. Courses and access</h2>
      <ul>
        <li>Enrolment grants you a personal, non-transferable licence to access the course you paid for.</li>
        <li>Access is generally lifetime for the purchased course, but courses may be updated, retired or replaced.</li>
        <li>Lesson content, exams and certificates are provided for learning and assessment purposes only.</li>
      </ul>

      <h2>3. Payments</h2>
      <ul>
        <li>Prices are listed in Nigerian Naira (NGN) and processed by Paystack.</li>
        <li>Access is unlocked only after payment is verified. Failed or reversed payments do not grant access.</li>
        <li>Refunds are handled under our <Link href="/refunds">Refund Policy</Link>.</li>
      </ul>

      <h2>4. Exams and certificates</h2>
      <ul>
        <li>Certificates are issued when you complete every lesson and pass the final exam.</li>
        <li>Each certificate has a unique serial number that can be checked on our <Link href="/verify">verification page</Link>.</li>
        <li>Certificates confirm completion of our course, not accreditation by a government body unless stated.</li>
        <li>We may revoke a certificate obtained through cheating, fraud or technical manipulation.</li>
      </ul>

      <h2>5. Acceptable use</h2>
      <ul>
        <li>Do not copy, record, redistribute or resell course videos or materials.</li>
        <li>Do not attempt to bypass payments, exam timers, access controls or security measures.</li>
        <li>Do not upload malicious code, abuse the platform, or harass other learners.</li>
        <li>We may suspend or terminate accounts that break these rules.</li>
      </ul>

      <h2>6. Intellectual property</h2>
      <p>
        Course content, branding and platform code belong to Charitech Concepts & Services or its licensors. Videos
        hosted on YouTube remain subject to YouTube&apos;s terms. You may not reproduce our content without written
        permission.
      </p>

      <h2>7. Availability and liability</h2>
      <p>
        We work to keep the platform available, but we do not guarantee uninterrupted service. To the extent
        permitted by Nigerian law, we are not liable for indirect losses, lost opportunities or outcomes such as
        employment or income. Nothing in these terms limits rights you have under applicable consumer law.
      </p>

      <h2>8. Changes</h2>
      <p>
        We may update these terms as the platform evolves. Material changes will be announced on the site. Continuing
        to use the platform after a change means you accept the updated terms.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions about these terms? Email <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
      </p>
    </LegalPage>
  );
}
