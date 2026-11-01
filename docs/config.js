// Public site configuration. No secrets belong in this file.
//
// The AdSense publisher ID below matches the verification script in
// docs/index.html. Ads stay hidden until you also add an approved ad unit's
// slot ID (adsenseSlot).
//
// To sell the ad-free upgrade: paste a hosted checkout/payment link (Stripe
// Payment Link, Lemon Squeezy, Paddle, etc.) into checkoutUrl. Until then the
// button stays disabled and no payment is attempted.
window.BUBBLE_WRAP_CONFIG = {
  version: '0.2.0',
  siteUrl: 'https://bubblewrapgame.online/',
  repoUrl: 'https://github.com/jd4rider/bubble-wrap',
  adsenseClient: 'ca-pub-8675744307100993',
  adsenseSlot: '',
  checkoutUrl: '',
}
