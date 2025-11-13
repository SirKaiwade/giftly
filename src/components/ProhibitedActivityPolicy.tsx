import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ProhibitedActivityPolicy = () => {
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
            Giftendo — Prohibited Activity Policy
          </h1>
          <p className="text-neutral-500 mb-8">Last updated: November 8, 2025</p>

          <div className="prose prose-neutral max-w-none">
            <section className="mb-8">
              <p className="text-neutral-700 leading-relaxed mb-6">
                Users may not use Giftendo for any of the following activities:
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">🚫 Illegal or Restricted Uses</h2>
              <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-4">
                <li>Fundraising for illegal activity, violence, harassment, hate groups, or extremist causes</li>
                <li>Transactions involving drugs, weapons, counterfeit goods, stolen items, or unlawful services</li>
                <li>Pornography, adult services, escorting, sexual content or solicitation</li>
                <li>Gambling, betting pools, raffles, lotteries, sweepstakes, or prize drawings</li>
                <li>Money laundering, tax evasion, or unlicensed financial activity</li>
                <li>Multi-level marketing, pyramid schemes, or investment solicitation</li>
                <li>Charity, nonprofit, medical, emergency, or crisis fundraisers (Giftendo is not a donation platform)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">🚫 Misuse of Contributions</h2>
              <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-4">
                <li>Collecting money for a purpose not represented in the Registry</li>
                <li>Using Giftendo to receive general personal payments (e.g., rent, invoices, freelance work, "send me money")</li>
                <li>Selling physical or digital goods through Giftendo as a storefront</li>
                <li>Attempting to bypass platform fees or payment processors</li>
                <li>Opening registries on behalf of another person without consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">🚫 Platform Abuse</h2>
              <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-4">
                <li>Attempting to reverse, exploit, scrape, overload, or interfere with Giftendo systems</li>
                <li>Creating fake, misleading, or fraudulent Registries</li>
                <li>Using stolen payment methods or encouraging chargebacks</li>
                <li>Harassing contributors or impersonating another person or entity</li>
              </ul>
            </section>

            <section className="mb-8">
              <div className="bg-neutral-50 border-l-4 border-neutral-900 p-4 rounded">
                <p className="text-neutral-900 font-medium mb-2">Consequences</p>
                <p className="text-neutral-700 leading-relaxed">
                  Violations may result in account suspension, loss of access to funds, cancelled contributions, or reporting to authorities when required by law.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <p className="text-neutral-700 leading-relaxed mb-4">
                This policy should be read in conjunction with our{' '}
                <Link to="/terms" className="text-neutral-900 underline hover:text-neutral-700">
                  Terms of Service
                </Link>.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProhibitedActivityPolicy;
