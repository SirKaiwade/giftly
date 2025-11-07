import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Gift, Sparkles, Heart, Zap, Users, Shield, Check, ChevronDown } from 'lucide-react';
import { EVENT_TYPES, THEMES } from '../types';

type LandingPageProps = {
  onGetStarted: () => void;
  onViewExample?: () => void;
};

const LandingPage = ({ onGetStarted, onViewExample }: LandingPageProps) => {
  const [selectedTheme, setSelectedTheme] = useState<typeof THEMES[0]['value']>('minimal');
  const [showScrollHint, setShowScrollHint] = useState(true);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const theme = THEMES.find(t => t.value === selectedTheme) || THEMES[0];
  const themeColors = theme.colors;

  // Hide scroll hint after user scrolls
  useEffect(() => {
    if (previewScrollRef.current) {
      const handleScroll = () => {
        if (previewScrollRef.current && previewScrollRef.current.scrollTop > 10) {
          setShowScrollHint(false);
        }
      };
      previewScrollRef.current.addEventListener('scroll', handleScroll);
      return () => {
        previewScrollRef.current?.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-neutral-200 sticky top-0 bg-white/80 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-neutral-700 rounded-lg blur-sm opacity-20"></div>
              <div className="relative bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-lg p-1.5">
                <Gift className="w-5 h-5 text-white" strokeWidth={2} fill="currentColor" />
              </div>
            </div>
            <span className="text-xl font-semibold tracking-tight text-neutral-900">Giftendo</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">How It Works</a>
            <a href="#occasions" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">Occasions</a>
          </div>
          <button
            onClick={onGetStarted}
            className="btn-primary text-sm flex items-center space-x-2"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pt-12 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <div>
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-neutral-100 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-neutral-600" strokeWidth={1.5} />
              <span className="text-sm text-neutral-600 font-medium">One Link. Every Occasion.</span>
          </div>
          
            <h1 className="text-display-1 md:text-[4.5rem] font-light tracking-tight text-neutral-900 mb-6 leading-tight text-balance">
            One registry for
            <br />
            <span className="font-normal">everything you need</span>
          </h1>
          
            <p className="text-body-lg md:text-heading-3 text-neutral-600 font-light mb-8 leading-relaxed">
            Cash funds, experiences, products, charity donations, or that dream item—all in one beautiful, shareable link.
          </p>

            <div className="flex flex-col sm:flex-row items-start gap-4 mb-10">
            <button
              onClick={onGetStarted}
              className="btn-primary w-full sm:w-auto px-10 py-4 text-base flex items-center justify-center space-x-2"
            >
              <span>Create Your Registry</span>
              <ArrowRight className="w-5 h-5" strokeWidth={1.5} />
            </button>
            <button
              onClick={onViewExample}
              className="btn-secondary w-full sm:w-auto px-10 py-4 text-base"
            >
              View Example
            </button>
          </div>

            {/* Key Benefits */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center space-x-3 text-sm text-neutral-700">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-green-600" strokeWidth={3} />
                </div>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-neutral-700">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-green-600" strokeWidth={3} />
                </div>
                <span>Setup in 2 minutes</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-neutral-700">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-green-600" strokeWidth={3} />
                </div>
                <span>Free forever plan</span>
              </div>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="relative max-w-lg mx-auto lg:mx-0">
            {/* Section Heading */}
            <div className="mb-4 text-center">
              <h3 className="text-sm font-semibold text-neutral-900 mb-1">Live Preview</h3>
              <p className="text-xs text-neutral-500">Guests see this • Scroll to explore</p>
            </div>

            <div 
              className="rounded-2xl shadow-2xl border-2 overflow-hidden max-h-[520px] transition-all duration-500 hover:shadow-3xl"
              style={{ 
                backgroundColor: themeColors.background,
                borderColor: themeColors.border 
              }}
            >
              {/* Preview Header with Branding */}
              <div 
                className="border-b px-5 py-4 transition-colors duration-500"
                style={{ 
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border 
                }}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                    style={{ backgroundColor: themeColors.accent }}
                  >
                    AM
                  </div>
                  <div className="flex-1">
                    <div 
                      className="font-semibold text-sm transition-colors duration-500"
                      style={{ color: themeColors.text }}
                    >
                      James & Maya's Wedding
                    </div>
                    <div 
                      className="text-xs transition-colors duration-500"
                      style={{ color: themeColors.textMuted }}
                    >
                      giftendo.com/adam-maya
                    </div>
                  </div>
                </div>
              </div>

              {/* Scroll Hint */}
              {showScrollHint && (
                <div className="absolute top-24 right-4 z-10 animate-pulse">
                  <div 
                    className="bg-white/95 backdrop-blur-sm rounded-full px-3 py-2 shadow-xl border border-neutral-200 flex items-center space-x-2 text-[10px] font-medium"
                    style={{ color: themeColors.text }}
                  >
                    <ChevronDown className="w-4 h-4 animate-bounce" />
                    <span>Scroll</span>
                  </div>
                </div>
              )}

              {/* Preview Content */}
              <div 
                ref={previewScrollRef}
                className="px-4 py-4 max-h-[420px] overflow-y-auto scrollbar-hide transition-colors duration-500 cursor-pointer"
                style={{ backgroundColor: themeColors.background }}
              >
                {/* Hero Cash Fund Item */}
                <section className="mb-5">
                  <div 
                    className="rounded-xl border-2 p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer group"
                    style={{ 
                      backgroundColor: themeColors.surface,
                      borderColor: themeColors.border 
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div 
                          className="text-xs font-semibold mb-1 transition-colors duration-500"
                          style={{ color: themeColors.text }}
                        >
                          Honeymoon Fund
                        </div>
                        <div className="flex items-baseline space-x-2 mb-2">
                          <span 
                            className="text-lg font-bold transition-colors duration-500"
                            style={{ color: themeColors.text }}
                          >
                            $3,240
                          </span>
                          <span 
                            className="text-xs transition-colors duration-500"
                            style={{ color: themeColors.textMuted }}
                          >
                            of $5,000
                          </span>
                        </div>
                        <div 
                          className="w-full h-2 rounded-full overflow-hidden mb-3"
                          style={{ backgroundColor: themeColors.borderLight }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: '64.8%',
                              backgroundColor: themeColors.accent,
                            }}
                          />
                        </div>
                      </div>
                      <button
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
                        style={{
                          backgroundColor: themeColors.accent,
                          color: themeColors.background,
                        }}
                      >
                        Contribute
                      </button>
                    </div>
                  </div>
                </section>

                {/* Section: Kitchen */}
                <section className="mb-5">
                  <div className="mb-3">
                    <h2 
                      className="text-[10px] tracking-widest uppercase mb-2 transition-colors duration-500 font-semibold"
                      style={{ color: themeColors.textMuted }}
                    >
                      KITCHEN
                    </h2>
                    <div 
                      className="h-px transition-colors duration-500"
                      style={{ backgroundColor: themeColors.border }}
                    ></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="group cursor-pointer">
                      <div 
                        className="aspect-square mb-2 overflow-hidden rounded-xl border bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                        style={{ 
                          borderColor: themeColors.border 
                        }}
                      >
                        <img
                          src="https://m.media-amazon.com/images/I/51HXid8ExKL._AC_SL1000_.jpg"
                          alt="KitchenAid"
                          className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <h3 
                        className="text-[11px] font-semibold mb-1 leading-tight line-clamp-1 transition-colors duration-500"
                        style={{ color: themeColors.text }}
                      >
                        Stand Mixer
                      </h3>
                      <div 
                        className="text-[10px] font-bold transition-colors duration-500"
                        style={{ color: themeColors.text }}
                      >
                        $350
                      </div>
                    </div>
                    <div className="group cursor-pointer">
                      <div 
                        className="aspect-square mb-2 overflow-hidden rounded-xl border bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                        style={{ 
                          borderColor: themeColors.border 
                        }}
                      >
                        <img
                          src="https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400"
                          alt="Cookware"
                          className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <h3 
                        className="text-[11px] font-semibold mb-1 leading-tight line-clamp-1 transition-colors duration-500"
                        style={{ color: themeColors.text }}
                      >
                        Cookware Set
                      </h3>
                      <div 
                        className="text-[10px] font-bold transition-colors duration-500"
                        style={{ color: themeColors.text }}
                      >
                        $280
                      </div>
                    </div>
                    <div className="group cursor-pointer">
                      <div 
                        className="aspect-square mb-2 overflow-hidden rounded-xl border bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                        style={{ 
                          borderColor: themeColors.border 
                        }}
                      >
                        <img
                          src="https://images.unsplash.com/photo-1517668808823-f8c76b0219e0?w=400"
                          alt="Coffee Maker"
                          className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <h3 
                        className="text-[11px] font-semibold mb-1 leading-tight line-clamp-1 transition-colors duration-500"
                        style={{ color: themeColors.text }}
                      >
                        Coffee Maker
                      </h3>
                      <div 
                        className="text-[10px] font-bold transition-colors duration-500"
                        style={{ color: themeColors.text }}
                      >
                        $120
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section: Bedroom */}
                <section className="mb-5">
                  <div className="mb-3">
                    <h2 
                      className="text-[10px] tracking-widest uppercase mb-2 transition-colors duration-500 font-semibold"
                      style={{ color: themeColors.textMuted }}
                    >
                      BEDROOM
                    </h2>
                    <div 
                      className="h-px transition-colors duration-500"
                      style={{ backgroundColor: themeColors.border }}
                    ></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="group cursor-pointer">
                      <div 
                        className="aspect-square mb-2 overflow-hidden rounded-xl border bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                        style={{ 
                          borderColor: themeColors.border 
                        }}
                      >
                        <img
                          src="https://images.unsplash.com/photo-1586105251261-72a756497a11?w=400"
                          alt="Bedding"
                          className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <h3 
                        className="text-[11px] font-semibold mb-1 leading-tight line-clamp-1 transition-colors duration-500"
                        style={{ color: themeColors.text }}
                      >
                        Bedding Set
                      </h3>
                      <div 
                        className="text-[10px] font-bold transition-colors duration-500"
                        style={{ color: themeColors.text }}
                      >
                        $180
                      </div>
                    </div>
                    <div className="group cursor-pointer">
                      <div 
                        className="aspect-square mb-2 overflow-hidden rounded-xl border bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                        style={{ 
                          borderColor: themeColors.border 
                        }}
                      >
                        <img
                          src="https://images.unsplash.com/photo-1586105449897-20b5efeb3233?w=400"
                          alt="Pillows"
                          className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <h3 
                        className="text-[11px] font-semibold mb-1 leading-tight line-clamp-1 transition-colors duration-500"
                        style={{ color: themeColors.text }}
                      >
                        Throw Pillows
                      </h3>
                      <div 
                        className="text-[10px] font-bold transition-colors duration-500"
                        style={{ color: themeColors.text }}
                      >
                        $65
                      </div>
                    </div>
                    <div className="group cursor-pointer">
                      <div 
                        className="aspect-square mb-2 overflow-hidden rounded-xl border bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                        style={{ 
                          borderColor: themeColors.border 
                        }}
                      >
                        <img
                          src="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400"
                          alt="Mattress"
                          className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <h3 
                        className="text-[11px] font-semibold mb-1 leading-tight line-clamp-1 transition-colors duration-500"
                        style={{ color: themeColors.text }}
                      >
                        Mattress Topper
                      </h3>
                      <div 
                        className="text-[10px] font-bold transition-colors duration-500"
                        style={{ color: themeColors.text }}
                      >
                        $140
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section: Living Room */}
                <section className="mb-5">
                  <div className="mb-3">
                    <h2 
                      className="text-[10px] tracking-widest uppercase mb-2 transition-colors duration-500 font-semibold"
                      style={{ color: themeColors.textMuted }}
                    >
                      LIVING ROOM
                    </h2>
                    <div 
                      className="h-px transition-colors duration-500"
                      style={{ backgroundColor: themeColors.border }}
                    ></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="group cursor-pointer">
                      <div 
                        className="aspect-square mb-2 overflow-hidden rounded-xl border bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                        style={{ 
                          borderColor: themeColors.border 
                        }}
                      >
                        <img
                          src="https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400"
                          alt="Chair"
                          className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <h3 
                        className="text-[11px] font-semibold mb-1 leading-tight line-clamp-1 transition-colors duration-500"
                        style={{ color: themeColors.text }}
                      >
                        Accent Chair
                      </h3>
                      <div 
                        className="text-[10px] font-bold transition-colors duration-500"
                        style={{ color: themeColors.text }}
                      >
                        $320
                      </div>
                    </div>
                    <div className="group cursor-pointer">
                      <div 
                        className="aspect-square mb-2 overflow-hidden rounded-xl border bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                        style={{ 
                          borderColor: themeColors.border 
                        }}
                      >
                        <img
                          src="https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400"
                          alt="Lamp"
                          className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <h3 
                        className="text-[11px] font-semibold mb-1 leading-tight line-clamp-1 transition-colors duration-500"
                        style={{ color: themeColors.text }}
                      >
                        Table Lamp
                      </h3>
                      <div 
                        className="text-[10px] font-bold transition-colors duration-500"
                        style={{ color: themeColors.text }}
                      >
                        $95
                      </div>
                    </div>
                    <div className="group cursor-pointer">
                      <div 
                        className="aspect-square mb-2 overflow-hidden rounded-xl border bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                        style={{ 
                          borderColor: themeColors.border 
                        }}
                      >
                        <img
                          src="https://images.unsplash.com/photo-1578301978018-3005759f48f7?w=400"
                          alt="Art"
                          className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <h3 
                        className="text-[11px] font-semibold mb-1 leading-tight line-clamp-1 transition-colors duration-500"
                        style={{ color: themeColors.text }}
                      >
                        Wall Art
                      </h3>
                      <div 
                        className="text-[10px] font-bold transition-colors duration-500"
                        style={{ color: themeColors.text }}
                      >
                        $75
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section: Travel & Experiences */}
                <section className="mb-5">
                  <div className="mb-3">
                    <h2 
                      className="text-[10px] tracking-widest uppercase mb-2 transition-colors duration-500 font-semibold"
                      style={{ color: themeColors.textMuted }}
                    >
                      TRAVEL & EXPERIENCES
                    </h2>
                    <div 
                      className="h-px transition-colors duration-500"
                      style={{ backgroundColor: themeColors.border }}
                    ></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="group cursor-pointer">
                      <div 
                        className="aspect-square mb-2 overflow-hidden rounded-xl border bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                        style={{ 
                          borderColor: themeColors.border 
                        }}
                      >
                        <img
                          src="https://tripleseat.com/wp-content/uploads/2021/05/How-to-Host-a-Cooking-Class-at-Your-Venue.jpg"
                          alt="Experience"
                          className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <h3 
                        className="text-[11px] font-semibold mb-1 leading-tight line-clamp-1 transition-colors duration-500"
                        style={{ color: themeColors.text }}
                      >
                        Cooking Class
                      </h3>
                      <div 
                        className="text-[10px] font-bold transition-colors duration-500"
                        style={{ color: themeColors.text }}
                      >
                        $150
                      </div>
                    </div>
                    <div className="group cursor-pointer">
                      <div 
                        className="aspect-square mb-2 overflow-hidden rounded-xl border bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                        style={{ 
                          borderColor: themeColors.border 
                        }}
                      >
                        <img
                          src="https://images.unsplash.com/photo-1544025162-d76694265947?w=400"
                          alt="Luggage"
                          className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <h3 
                        className="text-[11px] font-semibold mb-1 leading-tight line-clamp-1 transition-colors duration-500"
                        style={{ color: themeColors.text }}
                      >
                        Luggage Set
                      </h3>
                      <div 
                        className="text-[10px] font-bold transition-colors duration-500"
                        style={{ color: themeColors.text }}
                      >
                        $220
                      </div>
                    </div>
                    <div className="group cursor-pointer">
                      <div 
                        className="aspect-square mb-2 overflow-hidden rounded-xl border bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                        style={{ 
                          borderColor: themeColors.border 
                        }}
                      >
                        <img
                          src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400"
                          alt="Travel"
                          className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <h3 
                        className="text-[11px] font-semibold mb-1 leading-tight line-clamp-1 transition-colors duration-500"
                        style={{ color: themeColors.text }}
                      >
                        Travel Voucher
                      </h3>
                      <div 
                        className="text-[10px] font-bold transition-colors duration-500"
                        style={{ color: themeColors.text }}
                      >
                        $500
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section: Cash Funds (Last) */}
                <section className="mb-5">
                  <div className="mb-3">
                    <h2 
                      className="text-[10px] tracking-widest uppercase mb-2 transition-colors duration-500 font-semibold"
                      style={{ color: themeColors.textMuted }}
                    >
                      CASH FUNDS
                    </h2>
                    <div 
                      className="h-px transition-colors duration-500"
                      style={{ backgroundColor: themeColors.border }}
                    ></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="group cursor-pointer">
                      <div 
                        className="aspect-square mb-2 overflow-hidden rounded-xl border bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                        style={{ 
                          borderColor: themeColors.border 
                        }}
                      >
                        <img
                          src="https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=800"
                          alt="Honeymoon"
                          className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <h3 
                        className="text-[11px] font-semibold mb-1 leading-tight line-clamp-1 transition-colors duration-500"
                        style={{ color: themeColors.text }}
                      >
                        Honeymoon
                      </h3>
                      <div 
                        className="text-[10px] font-medium transition-colors duration-500"
                        style={{ color: themeColors.textLight }}
                      >
                        $3,240
                      </div>
                    </div>
                    <div className="group cursor-pointer">
                      <div 
                        className="aspect-square mb-2 overflow-hidden rounded-xl border bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                        style={{ 
                          borderColor: themeColors.border 
                        }}
                      >
                        <img
                          src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400"
                          alt="Home"
                          className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <h3 
                        className="text-[11px] font-semibold mb-1 leading-tight line-clamp-1 transition-colors duration-500"
                        style={{ color: themeColors.text }}
                      >
                        Down Payment
                      </h3>
                      <div 
                        className="text-[10px] font-medium transition-colors duration-500"
                        style={{ color: themeColors.textLight }}
                      >
                        $5,200
                      </div>
                    </div>
                    <div className="group cursor-pointer">
                      <div 
                        className="aspect-square mb-2 overflow-hidden rounded-xl border bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                        style={{ 
                          borderColor: themeColors.border 
                        }}
                      >
                        <img
                          src="https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400"
                          alt="TV"
                          className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <h3 
                        className="text-[11px] font-semibold mb-1 leading-tight line-clamp-1 transition-colors duration-500"
                        style={{ color: themeColors.text }}
                      >
                        TV Fund
                      </h3>
                      <div 
                        className="text-[10px] font-medium transition-colors duration-500"
                        style={{ color: themeColors.textLight }}
                      >
                        $1,800
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Preview Footer */}
              <div 
                className="px-5 py-4 border-t transition-colors duration-500"
                style={{ 
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border 
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div 
                      className="text-xs font-semibold transition-colors duration-500 mb-0.5"
                      style={{ color: themeColors.text }}
                    >
                      $8,450
                    </div>
                    <div 
                      className="text-[10px] transition-colors duration-500"
                      style={{ color: themeColors.textMuted }}
                    >
                      total contributions
                    </div>
                  </div>
                  <Heart 
                    className="w-5 h-5 transition-colors duration-500" 
                    style={{ color: themeColors.accent }}
                    fill="currentColor"
                  />
                </div>
                <div 
                  className="flex items-center justify-between text-[10px] font-medium transition-colors duration-500"
                  style={{ color: themeColors.textMuted }}
                >
                  <span>Customizable themes</span>
                  <span>•</span>
                  <span>Any occasion</span>
                </div>
              </div>
            </div>

            {/* Theme Selector - Moved Below */}
            <div className="mt-4">
              <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2 text-center">Try Themes</div>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {THEMES.map((t) => {
                  const isSelected = selectedTheme === t.value;
                  const tColors = t.colors;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setSelectedTheme(t.value)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-200 border-2 ${
                        isSelected
                          ? 'shadow-md scale-105'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                      style={{
                        backgroundColor: isSelected ? tColors.surface : 'white',
                        color: isSelected ? tColors.text : '#737373',
                        borderColor: isSelected ? tColors.accent : undefined,
                      }}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="bg-neutral-50 py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-display-3 md:text-display-2 font-light tracking-tight text-neutral-900 mb-6 text-balance">
              Why juggle multiple platforms?
            </h2>
            <p className="text-body-lg text-neutral-600 font-light leading-relaxed mb-12">
              Weddings use Zola. Birthdays use GoFundMe. Baby showers use Babylist. 
              Housewarming? Graduation? Travel? You're on your own.
            </p>
            <p className="text-heading-3 text-neutral-900 font-medium">
              Giftendo is the one registry that works for <em>any</em> occasion.
            </p>
          </div>
        </div>
      </section>

      {/* Flexibility Section */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-display-3 md:text-display-2 font-light tracking-tight text-neutral-900 mb-6 text-balance">
              Add anything. Really.
            </h2>
            <p className="text-body-lg text-neutral-600 font-light max-w-2xl mx-auto">
              Mix cash funds, physical products, experiences, charity donations, or custom items—all in one registry.
            </p>
          </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {/* Example: Cash Fund */}
              <div className="card-elevated p-6 hover-lift">
                <div className="aspect-[4/3] bg-neutral-100 mb-4 overflow-hidden rounded-xl">
                  <img
                    src="https://www.trinity.utoronto.ca/wp-content/uploads/2019/01/trinity-home-wide-01.jpg"
                    alt="College Fund"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-caption tracking-wide text-neutral-500 uppercase mb-2">💰 Cash Fund</div>
                <h3 className="text-heading-3 font-medium text-neutral-900 mb-1">College Fund</h3>
                <p className="text-body-sm text-neutral-600 mb-3">Save for education</p>
                <div className="flex items-baseline justify-between text-body-sm">
                  <span className="text-neutral-500">$2,850 raised</span>
                  <span className="text-neutral-400">of $10,000</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-200 mt-2 rounded-full overflow-hidden">
                  <div className="h-full bg-green-600 rounded-full transition-all duration-500" style={{ width: '28.5%' }} />
                </div>
              </div>

              {/* Example: Product */}
              <div className="card-elevated p-6 hover-lift">
                <div className="aspect-square bg-white mb-4 overflow-hidden rounded-xl flex items-center justify-center">
                  <img
                    src="https://m.media-amazon.com/images/I/51HXid8ExKL._AC_SL1000_.jpg"
                    alt="KitchenAid"
                    className="w-full h-full object-contain p-6"
                  />
                </div>
                <div className="text-caption tracking-wide text-neutral-500 uppercase mb-2">📦 Product</div>
                <h3 className="text-heading-3 font-medium text-neutral-900 mb-1">KitchenAid Mixer</h3>
                <p className="text-body-sm text-neutral-600 mb-3">From Amazon or any store</p>
                <div className="text-body font-semibold text-neutral-900">$350</div>
              </div>

              {/* Example: Charity */}
              <div className="card-elevated p-6 hover-lift">
                <div className="aspect-[4/3] bg-neutral-100 mb-4 overflow-hidden rounded-xl">
                  <img
                    src="https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=800"
                    alt="Charity"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-caption tracking-wide text-neutral-500 uppercase mb-2">❤️ Charity</div>
                <h3 className="text-heading-3 font-medium text-neutral-900 mb-1">Local Food Bank</h3>
                <p className="text-body-sm text-neutral-600 mb-3">Support our community</p>
                <div className="text-body font-semibold text-neutral-900">$32 raised</div>
              </div>

              {/* Example: Experience */}
              <div className="card-elevated p-6 hover-lift">
                <div className="aspect-[4/3] bg-neutral-100 mb-4 overflow-hidden rounded-xl">
                  <img
                    src="https://tripleseat.com/wp-content/uploads/2021/05/How-to-Host-a-Cooking-Class-at-Your-Venue.jpg"
                    alt="Experience"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-caption tracking-wide text-neutral-500 uppercase mb-2">🎭 Experience</div>
                <h3 className="text-heading-3 font-medium text-neutral-900 mb-1">Cooking Class</h3>
                <p className="text-body-sm text-neutral-600 mb-3">Private chef workshop</p>
                <div className="text-body font-semibold text-neutral-900">$150</div>
              </div>
            </div>

          <div className="text-center">
            <p className="text-base text-neutral-600 mb-2">
              Add funds (college, honeymoon), products (Amazon, KitchenAid, anything), charity donations, experiences, or custom items.
            </p>
            <p className="text-sm text-neutral-500 mb-6">
              Whether it's a $50 coffee maker or a $120,000 dream car, your friends can contribute any amount.
            </p>
            <button
              onClick={onGetStarted}
              className="btn-secondary px-10 py-4 text-base"
            >
              See How It Works
            </button>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="occasions" className="bg-neutral-50 py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-display-3 md:text-display-2 font-light tracking-tight text-neutral-900 mb-6 text-balance">
              Perfect for any occasion
            </h2>
            <p className="text-body-lg text-neutral-600 font-light max-w-2xl mx-auto">
              One platform, unlimited possibilities
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {EVENT_TYPES.map((event) => (
              <div
                key={event.value}
                className="card p-8 hover-lift"
              >
                <div className="text-4xl mb-4">{event.emoji}</div>
                <h3 className="text-xl font-light text-neutral-900 mb-2">{event.label}</h3>
                <p className="text-sm text-neutral-600">
                  {event.value === 'wedding' && 'Honeymoon funds, home essentials, experiences'}
                  {event.value === 'baby' && 'Nursery items, diapers, college savings'}
                  {event.value === 'birthday' && 'Experiences, gifts, charity donations'}
                  {event.value === 'housewarming' && 'Furniture, appliances, home improvements'}
                  {event.value === 'graduation' && 'Travel funds, professional gear, celebrations'}
                  {event.value === 'custom' && 'Anything you can imagine'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-display-3 md:text-display-2 font-light tracking-tight text-neutral-900 mb-6 text-balance">
              Everything you need
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-6 h-6 text-neutral-900" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Flexible Items</h3>
              <p className="text-sm text-neutral-600">
                Cash, products, experiences, charity, or custom items—mix and match however you want.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-neutral-900" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Beautiful Themes</h3>
              <p className="text-sm text-neutral-600">
                Choose from professional themes that match your event's style and personality.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-neutral-900" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Easy Sharing</h3>
              <p className="text-sm text-neutral-600">
                One link to share everywhere. QR codes for invitations. Social media ready.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-neutral-900" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Secure Payments</h3>
              <p className="text-sm text-neutral-600">
                Powered by Stripe. PCI compliant. Your guests' payment info is never stored.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-neutral-900" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Guest Messages</h3>
              <p className="text-sm text-neutral-600">
                Optional guestbook lets friends share well wishes and memories.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-neutral-900" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Set Up in Minutes</h3>
              <p className="text-sm text-neutral-600">
                Simple step-by-step wizard. No technical skills required. Publish instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="pricing" className="bg-neutral-900 text-white py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-display-3 md:text-display-2 font-light tracking-tight mb-6 text-balance">
            Ready to create your registry?
          </h2>
          <p className="text-body-lg text-neutral-300 font-light mb-12 max-w-2xl mx-auto">
            Join thousands creating beautiful, flexible registries for any occasion.
          </p>
          <button
            onClick={onGetStarted}
            className="btn-secondary px-12 py-5 text-base flex items-center justify-center space-x-2 mx-auto"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <p className="text-sm text-neutral-400 mt-6">
            No credit card required. Set up in minutes.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-neutral-500">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded p-1">
                <Gift className="w-3 h-3 text-white" strokeWidth={2} fill="currentColor" />
              </div>
              <span className="font-medium">Giftendo</span>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#" className="hover:text-neutral-900 transition-colors">Privacy</a>
              <a href="#" className="hover:text-neutral-900 transition-colors">Terms</a>
              <a href="#" className="hover:text-neutral-900 transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

