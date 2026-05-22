document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector(".hamburger");
  const navLinks = document.querySelector(".nav-links");

  hamburger.addEventListener("click", (e) => {
    navLinks.classList.toggle("show");
  });

  document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("show");
    });
  });

  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.dot');
  let currentSlide = 0;
  let autoPlayInterval;
  const transitionTime = 5000;

  if (slides.length > 0) {
    function showSlide(index) {
        slides.forEach(slide => {
            slide.classList.remove('active');
        });
        dots.forEach(dot => {
            dot.classList.remove('active');
        });
        slides[index].classList.add('active');
        dots[index].classList.add('active');
        currentSlide = index;
        }

    function nextSlide() {
        let next = currentSlide + 1;
        if (next >= slides.length) next = 0;
        showSlide(next);
        }
      
    function startAutoPlay() {
        if (autoPlayInterval) clearInterval(autoPlayInterval);
        autoPlayInterval = setInterval(nextSlide, transitionTime);
      }
      
      
    function stopAutoPlay() {
        if (autoPlayInterval) {
          clearInterval(autoPlayInterval);
          autoPlayInterval = null;
        }
      }
      
      
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
          stopAutoPlay();
          showSlide(index);
          startAutoPlay();
        });
      });
      
    showSlide(0);
    startAutoPlay();
  }

  const designFileInput = document.getElementById('design-file');
  if (designFileInput) {
    designFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      const fileLabel = designFileInput.nextElementSibling;
      
      if (file) {
        const fileName = file.name;
        const fileSize = (file.size / 1024).toFixed(2); 
        
        const fileIcon = fileLabel.querySelector('.file-icon');
        const fileText = fileLabel.querySelector('span:last-child');
        
        fileIcon.textContent = '✓';
        fileText.textContent = `${fileName} (${fileSize} KB)`;
        
      } 
      else {
        const fileIcon = fileLabel.querySelector('.file-icon');
        const fileText = fileLabel.querySelector('span:last-child');
        
        fileIcon.textContent = '📁';
        fileText.textContent = 'Click to upload your design reference image';
        
      }
      
      calculatePrice();
    });
  }

  
  const form = document.querySelector('.form-wrapper');
  const priceAmountEls = document.querySelectorAll('.price-items .price-amount');
  const priceValueEl = document.querySelector('.price-value');

  const sizePrices = {
    small: 500,
    medium: 1000,
    large: 1500,
    xl: 1850
  };

  const fillingPrices = {
    vanilla: 80,
    chocolate: 90,
    raspberry: 70,
    caramel: 90,
    StrawberryCompote: 100,
    WhippedMascarpone: 120,
    ApricotGlaze: 80,
    'Sugar Pearls': 50
  };

  const toppingPrices = {
    sprinkles: 30,
    gold: 300,
    CornelliPiping: 120,
    CrystallizedFlowers: 250,
    berries: 120,
    macarons: 200
  };


  function getCheckedValues(selector) {
    return Array.from(document.querySelectorAll(selector + ':checked')).map(i => i.value);
  }

  function sumMapped(values, map) {
  return values.reduce((sum, v) => sum + (map[v] || 0), 0);
}

  function calculatePrice() {
    // base cake
    const sizeEl = document.getElementById('cake-size');
    const sizeVal = sizeEl ? sizeEl.value : '';
    const basePrice = sizePrices[sizeVal] || 0;

    // fillings
    const fillings = getCheckedValues('input[name="filling"]');
    const fillingsPrice = sumMapped(fillings, fillingPrices);

    // toppings
    const toppings = getCheckedValues('input[name="topping"]');
    const toppingsPrice = sumMapped(toppings, toppingPrices);

    // delivery
    const deliveryMethod = document.querySelector('input[name="delivery_method"]:checked');
    const deliveryPrice = (deliveryMethod && deliveryMethod.value === 'delivery') ? 100 : 0;

    // combine fillings and toppings
    const fillAndToppingTotal = fillingsPrice + toppingsPrice;

    const total = basePrice + fillAndToppingTotal + deliveryPrice ;

    if (priceAmountEls && priceAmountEls.length === 3) {
      priceAmountEls[0].textContent = '₹' + basePrice.toLocaleString('en-IN');
      priceAmountEls[1].textContent = '₹' + fillAndToppingTotal.toLocaleString('en-IN');
      priceAmountEls[2].textContent = '₹' + deliveryPrice.toLocaleString('en-IN');
}

    if (priceValueEl) {
      // animate number change
      priceValueEl.style.animation = 'none';
      priceValueEl.textContent = '₹' + total.toLocaleString('en-IN');
      requestAnimationFrame(() => {
        priceValueEl.style.animation = 'priceFlip 0.6s cubic-bezier(0.34,1.56,0.64,1) both';
      });
    }

    return total;
  }


  const inputsToWatch = [
    '#cake-size',
    'input[name="filling"]',
    'input[name="topping"]',
    'input[name="delivery_method"]'
  ];

  inputsToWatch.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      el.addEventListener('change', calculatePrice);
      el.addEventListener('input', calculatePrice);
    });
  });
  calculatePrice();

  const placeOrderSidebar = document.getElementById('placeOrderSidebar');
  if (placeOrderSidebar) {
  placeOrderSidebar.addEventListener('click', () => {
    const buildForm = document.getElementById('build-form');
    if (buildForm && !buildForm.checkValidity()) {
      buildForm.reportValidity();
      return;
    }
    const pts = readPoints();
    const buildLoyaltyChk = document.getElementById('applyLoyaltyBuild');
    const applyLoyalty = buildLoyaltyChk ? buildLoyaltyChk.checked : false;
    const total = calculatePrice();
    const loyaltyUsed = applyLoyalty ? Math.min(pts, Math.floor(total)) : 0;
    const finalTotal = total - loyaltyUsed;

    const size = (document.getElementById('cake-size') || {}).value || 'Not selected';
    const flavor = (document.querySelector('input[name="flavor"]:checked') || {}).value || 'Not selected';
    const frost = (document.querySelector('input[name="frosting"]:checked') || {}).value || 'Not selected';
    const fillings = getCheckedValues('input[name="filling"]');
    const toppings = getCheckedValues('input[name="topping"]');
    const topper = (document.getElementById('topper-text') || {}).value || '';

    let summary = `Order summary:\n\nSize: ${size}\nFlavor: ${flavor}\nFrosting: ${frost}\nFillings: ${fillings.join(', ') || 'None'}\nToppings: ${toppings.join(', ') || 'None'}\nTopper Text: ${topper || 'None'}\n\nTotal Price: ₹${finalTotal.toLocaleString('en-IN')}\n\nProceed to confirm your order?`;

    if (confirm(summary)) {
      
      if (loyaltyUsed > 0) redeemPoints(loyaltyUsed);
      const orderObj = {
        items: [{
          title: `Custom Cake (${size})`,
          img: '',
          qty: 1,
          price: finalTotal
        }],
        totals: {
          sub: total,
          shipping: 0,
          tax: 0,
          total: finalTotal,
          loyaltyPoints: loyaltyUsed
        },
        customer: {
          name: (document.getElementById('full-name') || {}).value || '',
          phone: (document.getElementById('phone') || {}).value || '',
          address: (document.getElementById('address') || {}).value || ''
        },
        paymentMethod: 'Pay at Store',
        status: 'Preparing'
      };

      saveOrder(orderObj);

      if (buildForm) buildForm.reset();
      const designFile = document.getElementById('design-file');
      if (designFile) {
        const fileLabel = designFile.nextElementSibling;
        const fileIcon = fileLabel.querySelector('.file-icon');
        const fileText = fileLabel.querySelector('span:last-child');
        fileIcon.textContent = '📁';
        fileText.textContent = 'Click to upload your design reference image';
      }
      calculatePrice();
      refreshBuildLoyalty();

      showToast('✅ Order placed! Redirecting...');
      setTimeout(() => { window.location.href = 'order.html'; }, 1500);
    }
  });
}
  

const buildPointsEl = document.getElementById('buildPoints');
const buildPreviewEl = document.getElementById('buildLoyaltyPreview');
const buildLoyaltyChk = document.getElementById('applyLoyaltyBuild');
const buildLoyaltyBtn = document.getElementById('applyLoyaltyBuildBtn');

function refreshBuildLoyalty() {
  const pts = readPoints();
  if (buildPointsEl) buildPointsEl.textContent = pts;
  if (!buildLoyaltyChk || !buildPreviewEl) return;
  const total = calculatePrice();
  const ptsUse = Math.min(pts, Math.floor(total));
  if (ptsUse <= 0) {
    buildPreviewEl.textContent = 'No points available';
    buildLoyaltyBtn && (buildLoyaltyBtn.disabled = true);
  } else {
    buildPreviewEl.textContent = buildLoyaltyChk.checked
      ? 'Applied: -₹' + ptsUse
      : 'You save: ₹' + ptsUse;
    buildLoyaltyBtn && (buildLoyaltyBtn.disabled = false);
  }
}

if (buildLoyaltyBtn) {
  buildLoyaltyBtn.addEventListener('click', () => {
    buildLoyaltyChk.checked = !buildLoyaltyChk.checked;
    buildLoyaltyBtn.textContent = buildLoyaltyChk.checked ? 'Remove points' : 'Apply points';
    refreshBuildLoyalty();
  });
}

refreshBuildLoyalty();


inputsToWatch.forEach(selector => {
  document.querySelectorAll(selector).forEach(el => {
    el.addEventListener('change', refreshBuildLoyalty);
  });
});

});
