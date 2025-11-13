import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsOfService = () => {
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
            Giftendo — Terms of Service
          </h1>
          <p className="text-neutral-500 mb-8">Last updated: November 8, 2025</p>

          <div className="prose prose-neutral max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">1. Overview</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Giftendo ("Giftendo", "we", "us", "our") provides an online platform that allows users to create personal gift registries ("Registries") and receive monetary contributions ("Contributions") from invited participants ("Contributors").
              </p>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Funds collected on Giftendo are not transferred as unrestricted cash by default. Registry owners ("Recipients") may redeem their balance through approved redemption methods, including but not limited to gift cards, retailer credits, or other fulfillment options offered within the platform.
              </p>
              <p className="text-neutral-700 leading-relaxed mb-4">
                By creating an account, contributing to a registry, or otherwise using Giftendo, you agree to these Terms, our Privacy Policy, and our{' '}
                <Link to="/prohibited-activity" className="text-neutral-900 underline hover:text-neutral-700">
                  Prohibited Activity Policy
                </Link>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">2. Eligibility</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                You must be at least 18 years old to create a Registry or redeem funds. Contributors may be younger if permitted by applicable law.
              </p>
              <p className="text-neutral-700 leading-relaxed mb-4">
                We may require identity verification only when legally necessary (e.g., for cash-out requests or high-risk activity).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">3. How Contributions Work</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Contributions are processed by third-party payment providers (e.g., Stripe, PayPal). Giftendo does not store payment card numbers.
              </p>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Giftendo is not a money transfer service. Contributions are held as a platform balance and may be redeemed only through the redemption methods currently supported.
              </p>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Contributions are not tax-deductible donations, and Giftendo does not support fundraising for charitable, medical, emergency, or cause-based campaigns.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">4. Fees</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Giftendo may charge a platform fee, processing fee, or redemption fee. Any applicable fees will be disclosed before transaction completion.
              </p>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Contributors agree to pay the total amount shown at checkout.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">5. Redemption of Funds</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Funds collected in a Registry may be redeemed only through Giftendo's available options, such as digital gift cards, retailer credit, or approved product fulfillment.
              </p>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Cash withdrawal (if offered) may require identity verification and may be subject to additional fees or limits.
              </p>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Giftendo does not guarantee the availability of every retailer or redemption method at all times.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">6. User Responsibilities</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Users agree not to use the platform for any illegal, abusive, fraudulent, or prohibited purpose.
              </p>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Registry owners are responsible for reviewing Contributions and initiating redemptions.
              </p>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Contributors understand that their Contribution is not a purchase of goods from Giftendo, but a transfer of value to the Registry owner.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">7. Refunds & Chargebacks</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                All Contributions are final unless otherwise required by law or directly approved by Giftendo.
              </p>
              <p className="text-neutral-700 leading-relaxed mb-4">
                If a Contributor disputes a charge, the platform may suspend the associated Registry until the issue is resolved.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">8. Account Suspension & Removal</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Giftendo reserves the right to suspend or delete Registries that violate the Terms,{' '}
                <Link to="/prohibited-activity" className="text-neutral-900 underline hover:text-neutral-700">
                  Prohibited Activity Policy
                </Link>, or applicable laws.
              </p>
              <p className="text-neutral-700 leading-relaxed mb-4">
                We may also freeze balances or block redemption if required for fraud, regulatory, or security reasons.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">9. No Warranty / Limitation of Liability</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Giftendo provides the service "as-is" without warranty.
              </p>
              <p className="text-neutral-700 leading-relaxed mb-4">
                We are not responsible for delays, failed payments, lost items, third-party shipping errors, or gift card provider outages.
              </p>
              <p className="text-neutral-700 leading-relaxed mb-4">
                In no event shall Giftendo be liable for indirect, incidental, or consequential damages.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">10. Changes to Terms</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                We may update these Terms at any time. Continued use of the platform constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">11. Contact</h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Users may contact us at: <a href="mailto:support@giftendo.com" className="text-neutral-900 underline hover:text-neutral-700">support@giftendo.com</a>
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;
