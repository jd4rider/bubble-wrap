(function () {
  const config = window.BUBBLE_WRAP_CONFIG || {}

  document.querySelectorAll('[data-version]').forEach((element) => {
    element.textContent = config.version || '0.1.0'
  })

  // Decorative mini sheet. Popping it is the fastest way to explain the app.
  const sheet = document.getElementById('demo-sheet')
  if (sheet) {
    for (let index = 0; index < 12 * 4; index += 1) {
      const bubble = document.createElement('span')
      bubble.addEventListener('pointerdown', () => bubble.classList.add('popped'))
      bubble.addEventListener('pointerenter', (event) => {
        if (event.buttons > 0) bubble.classList.add('popped')
      })
      sheet.appendChild(bubble)
    }
  }

  const checkout = document.getElementById('checkout')
  if (checkout) {
    if (config.checkoutUrl) {
      checkout.href = config.checkoutUrl
      checkout.textContent = 'Remove ads — $1.99'
      checkout.removeAttribute('aria-disabled')
      checkout.target = '_blank'
      checkout.rel = 'noopener'
    } else {
      checkout.addEventListener('click', (event) => event.preventDefault())
    }
  }

  const adBody = document.getElementById('ad-body')
  if (!adBody) return

  if (!config.adsenseClient || !config.adsenseSlot) {
    // No approved ad network yet: hide the slot instead of shipping a fake box.
    const slot = document.getElementById('ad-slot')
    if (slot) slot.hidden = true
    return
  }

  const script = document.createElement('script')
  script.async = true
  script.crossOrigin = 'anonymous'
  script.src =
    'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' +
    encodeURIComponent(config.adsenseClient)
  document.head.appendChild(script)

  const unit = document.createElement('ins')
  unit.className = 'adsbygoogle'
  unit.style.display = 'block'
  unit.dataset.adClient = config.adsenseClient
  unit.dataset.adSlot = config.adsenseSlot
  unit.dataset.adFormat = 'auto'
  unit.dataset.fullWidthResponsive = 'true'
  adBody.appendChild(unit)

  ;(window.adsbygoogle = window.adsbygoogle || []).push({})
})()
