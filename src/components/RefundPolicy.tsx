import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-4">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-neutral-900 mb-4">
            Giftendo — Refund & Chargeback Policy
          </h1>
          <p className="text-neutral-500 mb-8">Last updated: November 8, 2025</p>

          <div className="prose prose-neutral max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">1. General Policy</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                All Contributions made through Giftendo are final unless otherwise required by law or directly approved by Giftendo support.
              </p>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Contributors should only contribute to Registries they trust and for purposes they support. Once a Contribution is processed, it cannot be cancelled or refunded except in the circumstances outlined below.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">2. When Refunds May Be Issued</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Giftendo may issue refunds in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-4">
                <li><strong>Duplicate Payment:</strong> If a Contributor accidentally makes the same payment twice, we will refund the duplicate.</li>
                <li><strong>Processing Error:</strong> If a technical error results in an incorrect charge, we will correct it.</li>
                <li><strong>Registry Violation:</strong> If a Registry is found to violate our Terms of Service or Prohibited Activity Policy, Contributions may be refunded at our discretion.</li>
                <li><strong>Legal Requirement:</strong> When required by applicable law or court order.</li>
                <li><strong>Fraudulent Activity:</strong> If a Contribution is determined to be fraudulent, we may refund it to protect the Contributor.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">3. Refund Process</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                To request a refund, Contributors must contact Giftendo support at{' '}
                <a href="mailto:support@giftendo.com" className="text-neutral-900 underline hover:text-neutral-700">support@giftendo.com</a> with:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-4">
                <li>The Registry URL or registry ID</li>
                <li>The Contribution amount and date</li>
                <li>The reason for the refund request</li>
                <li>Any supporting documentation</li>
              </ul>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Refund requests are reviewed on a case-by-case basis. Processing time may take 5-10 business days after approval.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">4. Chargebacks</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                If a Contributor disputes a charge with their bank or credit card company (a "chargeback"), Giftendo will:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-4">
                <li>Investigate the chargeback and provide evidence to the payment processor</li>
                <li>Temporarily suspend the associated Registry until the dispute is resolved</li>
                <li>Deduct the disputed amount (plus any fees) from the Registry balance</li>
                <li>If the chargeback is successful, the Contribution will be reversed</li>
              </ul>
              <p className="text-neutral-700 leading-relaxed mb-4">
                <strong>Important:</strong> Chargebacks are costly and can result in additional fees. We encourage Contributors to contact us directly before initiating a chargeback, as we may be able to resolve the issue more quickly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">5. Registry Owner Responsibilities</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Registry owners should:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-4">
                <li>Use Contributions only for the stated purpose of the Registry</li>
                <li>Respond promptly to Contributor inquiries</li>
                <li>Notify Contributors if there are any changes to how funds will be used</li>
                <li>Maintain accurate Registry information</li>
              </ul>
              <p className="text-neutral-700 leading-relaxed mb-4">
                If a Registry owner misuses Contributions or violates our policies, we may freeze the Registry balance, require refunds, or take other appropriate action.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">6. Redemption Refunds</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Once a Registry owner redeems their balance (e.g., via gift card or shipping token), the redemption is final and cannot be reversed.
              </p>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Gift cards and other redemption products are subject to the terms and conditions of the issuing provider (e.g., Amazon, Visa). Giftendo is not responsible for issues with redeemed gift cards or products.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">7. Fees</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Processing fees charged by payment processors (e.g., Stripe) are non-refundable, even if a Contribution is refunded.
              </p>
              <p className="text-neutral-700 leading-relaxed mb-4">
                If a chargeback occurs, the Registry owner may be responsible for chargeback fees in addition to the disputed amount.
              </p>
            </section>

            <section className="mb-8">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <p className="text-yellow-900 font-medium mb-2">Important Notice</p>
                <p className="text-yellow-800 leading-relaxed">
                  Giftendo is not a money transmitter. Contributions are held as platform balances and can only be redeemed through approved methods (gift cards, shipping tokens, etc.). Cash withdrawals are not available in the current version of the platform.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <p className="text-neutral-700 leading-relaxed mb-4">
                This policy should be read in conjunction with our{' '}
                <Link to="/terms" className="text-neutral-900 underline hover:text-neutral-700">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/prohibited-activity" className="text-neutral-900 underline hover:text-neutral-700">
                  Prohibited Activity Policy
                </Link>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">8. Contact</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                For refund requests or questions about this policy, contact us at:{' '}
                <a href="mailto:support@giftendo.com" className="text-neutral-900 underline hover:text-neutral-700">support@giftendo.com</a>
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RefundPolicy;

