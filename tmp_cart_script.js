
(function(){
  function readCart(){ try{ return JSON.parse(localStorage.getItem('cakerie_cart')||'[]') }catch(e){return[]} }
  function writeCart(c){ localStorage.setItem('cakerie_cart', JSON.stringify(c)); }
  function format(v){ return '₹' + v.toLocaleString(); }
  var paymentSection = document.getElementById('paymentSection');
  var deliveryBlock = document.getElementById('deliveryBlock');
  var deliveryHint = document.getElementById('deliveryHint');

  var itemsEl = document.getElementById('items');
  var emptyEl = document.getElementById('empty');
  var subtotalEl = document.getElementById('subtotal');
  var shippingEl = document.getElementById('shipping');
  var totalEl = document.getElementById('total');
  var cartCountEls = document.querySelectorAll('.cart-count');
  var checkoutPanel = document.querySelector('.checkout-panel');
  var deliverySection = document.querySelector('.delivery-method');
  var paymentSection = document.querySelector('.payment-section');
  var nameEl = document.getElementById('name');
  var phoneEl = document.getElementById('phone');
  var emailEl = document.getElementById('email');
  var addrEl = document.getElementById('addr');
  var View = document.getElementById('View');
  var heroEl = document.querySelector('.cart-hero');
  var cartWrap = document.querySelector('.cart-wrap');

  function parseCartItemPrice(price){
    if(typeof price === 'number' && !isNaN(price)) return price;
    if(typeof price === 'string'){
      return parseFloat(price.replace(/,/g,'').replace(/[^0-9.]/g, '')) || 0;
    }
    return 0;
  }

  function calcTotals(cart){
    var sub = cart.reduce(function(s,it){
      var itemPrice = parseCartItemPrice(it.price || 0);
      return s + itemPrice * (it.qty || 1);
    }, 0);
    var deliveryOption = (document.querySelector('input[name="delivery_option"]:checked') || {}).value;
    var shipping = deliveryOption === 'home' ? 80 : deliveryOption === 'pickup' ? 0 : 0;
    var discount = 0;
    // loyalty redemption rules (new):
    // Points Earned = floor(order ÷ 1000) * 10; 1 point = ₹1; instant redeem up to order value
    var loyaltyUsedPoints = 0;
    var loyaltyDiscount = 0;
    try{
      var apply = document.getElementById('applyLoyalty');
      if(apply && apply.checked){
        var availPts = (window.readPoints && window.readPoints()) || parseInt(localStorage.getItem('cakerie_points')||'0',10) || 0;
        var remaining = Math.max(0, sub - discount);
        var ptsToUse = Math.min(availPts, Math.floor(remaining));
        if(ptsToUse > 0){ loyaltyUsedPoints = ptsToUse; loyaltyDiscount = ptsToUse; }
      }
    }catch(e){}
    discount += loyaltyDiscount;
    var total = sub - discount + shipping;
    return { sub: sub, shipping: shipping, discount: discount, total: total, loyaltyPointsUsed: loyaltyUsedPoints, loyaltyDiscount: loyaltyDiscount };
  }

  function estimateDelivery(days){
    var d = new Date(); d.setDate(d.getDate() + days);
    return d.toLocaleDateString();
  }

  function renderEmpty(){
    emptyEl.style.display = 'block';
    itemsEl.innerHTML = '';
    itemsEl.style.display = 'none';
    if(checkoutPanel) checkoutPanel.style.display = 'none';
    if(heroEl) heroEl.style.display = 'none';
    if(cartWrap) cartWrap.style.display = 'none';
    if(View) View.style.display = 'block';
  }

  function updateCartUI(){
    var cart = readCart();
    itemsEl.innerHTML = '';
    if(!cart.length){ renderEmpty(); }
    else {
      emptyEl.style.display = 'none';
      itemsEl.style.display = 'block';
      if(checkoutPanel) checkoutPanel.style.display = 'block';
      if(heroEl) heroEl.style.display = 'block';
      if(cartWrap) cartWrap.style.display = 'block';
    if(deliveryHint){
      deliveryHint.textContent = getDeliveryOption() ? 'Payment options are now available.' : 'Select a delivery option to unlock payment.';
    }
    if(paymentSection){
      paymentSection.classList.toggle('hidden', !getDeliveryOption());
    }
    if(deliveryBlock){
      deliveryBlock.classList.toggle('hidden', getDeliveryOption() !== 'home');
    }
      if(View) View.style.display = 'none';
    }

    cart.forEach(function(it, idx){
      var node = document.createElement('div'); node.className = 'cart-item';
      node.innerHTML = '\n        <img src="'+(it.img||'')+'">\n        <div class="meta">\n          <h3>'+ (it.title||'Item') +'</h3>\n          <div class="meta-sub">Qty: '+(it.qty||1)+'</div>' + (it.weight ? '\n          <div class="meta-sub">Weight: '+(parseFloat(it.weight).toFixed(1))+' lb</div>' : '') + (it.unitPrice ? '\n          <div class="meta-sub">Unit: '+ format(it.unitPrice) +'/lb</div>' : '') + '\n          <div class="price">'+ format(it.price||0) +'</div>\n        </div>\n      ';
      var controls = document.createElement('div'); controls.className = 'controls';
      controls.innerHTML = '\n        <div class="qty-controls">\n          <button class="dec">-</button>\n          <div class="count">'+(it.qty||1)+'</div>\n          <button class="inc">+</button>\n        </div>\n        <button class="remove-link">Remove</button>\n      ';
      node.appendChild(controls);
      itemsEl.appendChild(node);

      controls.querySelector('.inc').addEventListener('click', function(){ it.qty = (it.qty||1) + 1; writeCart(cart); updateCartUI(); window.dispatchEvent(new Event('cartchange')); });
      controls.querySelector('.dec').addEventListener('click', function(){ it.qty = Math.max(1, (it.qty||1) - 1); writeCart(cart); updateCartUI(); window.dispatchEvent(new Event('cartchange')); });
      controls.querySelector('.remove-link').addEventListener('click', function(){ cart.splice(idx,1); writeCart(cart); updateCartUI(); window.dispatchEvent(new Event('cartchange')); });
    });

    var t = calcTotals(cart);
    subtotalEl.textContent = format(t.sub);
    shippingEl.textContent = format(t.shipping);

    // show loyalty discount row if applicable
    var existing = document.getElementById('loyaltyRow');
      if(t.loyaltyDiscount && t.loyaltyDiscount > 0){
      if(!existing){
        existing = document.createElement('div'); existing.className = 'row'; existing.id = 'loyaltyRow';
        existing.innerHTML = '<div class="small-muted">Loyalty discount</div><div id="loyaltyAmount" class="promo-applied">-₹0</div>';
        // insert before total row
        var totalsWrap = document.querySelector('.totals');
        var totalRow = totalsWrap.querySelector('.total');
        totalsWrap.insertBefore(existing, totalRow);
      }
      document.getElementById('loyaltyAmount').textContent = '-₹' + (+t.loyaltyDiscount).toFixed(2);
    } else {
      if(existing) existing.parentNode.removeChild(existing);
    }

    // final total
    totalEl.textContent = format(t.total);

    // update nav counts
    var count = cart.reduce(function(s,i){return s + (i.qty||0)},0);
    cartCountEls.forEach(function(el){ el.textContent = count; });

    // estimated delivery
    var ed = document.querySelector('.est-delivery');
    if(ed) ed.textContent = 'Estimated delivery: ' + (cart.length ? estimateDelivery(3) : '-');
  }

  // loyalty UI (points) injection
  (function addLoyaltyUI(){
    try{
      var parent = document.querySelector('.checkout-panel');
      var div = document.createElement('div'); div.style.marginTop = '12px';
      div.id = 'loyaltyBlock';
      // hidden checkbox remains for compatibility with calcTotals()
      div.innerHTML = '<div style="font-weight:600;margin-bottom:6px">Loyalty Points</div>' +
        '<div style="display:flex;gap:8px;align-items:center"><div id="loyaltyBalance" class="small-muted">Points: 0</div>' +
        '<input type="checkbox" id="applyLoyalty" style="display:none">' +
        '<button id="applyLoyaltyBtn" style="margin-left:auto;padding:8px 12px;border-radius:8px;border:none;background:linear-gradient(135deg,#ffd27a,#ffb86b);color:#111;font-weight:700;cursor:pointer">Apply points</button>' +
        '<div id="loyaltyPreview" style="margin-left:8px;color:#bfe6c8;font-size:13px;white-space:nowrap">You save: ₹0</div></div>';
      // insert before totals so totals render after loyalty UI
      parent.insertBefore(div, parent.querySelector('.totals'));

      // update balance and preview
      function refreshPoints(){ var pts = (window.readPoints && window.readPoints()) || parseInt(localStorage.getItem('cakerie_points')||'0',10) || 0; document.getElementById('loyaltyBalance').textContent = 'Points: ' + pts; refreshPreview(); }
      function refreshPreview(){ try{ var pts = (window.readPoints && window.readPoints()) || parseInt(localStorage.getItem('cakerie_points')||'0',10) || 0; var totals = calcTotals(readCart()); var sub = totals.sub || 0; var previewEl = document.getElementById('loyaltyPreview'); var chk = document.getElementById('applyLoyalty'); if(!previewEl) return; var ptsUse = Math.min(pts, Math.floor(Math.max(0, sub))); if(ptsUse <= 0){ previewEl.textContent = 'No points available'; document.getElementById('applyLoyaltyBtn').disabled = true; document.getElementById('applyLoyaltyBtn').style.opacity = '0.6'; } else { var discount = ptsUse; previewEl.textContent = 'You save: ₹' + discount; document.getElementById('applyLoyaltyBtn').disabled = false; document.getElementById('applyLoyaltyBtn').style.opacity = '1'; } if(chk && chk.checked){ var applied = Math.min(pts, Math.floor(Math.max(0, sub))); previewEl.textContent = 'Applied: -₹' + applied; document.getElementById('applyLoyaltyBtn').textContent = 'Remove points'; } else { document.getElementById('applyLoyaltyBtn').textContent = 'Apply points'; } }catch(e){} }
      refreshPoints();
      document.getElementById('applyLoyaltyBtn').addEventListener('click', function(){ var chk = document.getElementById('applyLoyalty'); chk.checked = !chk.checked; if(chk.checked) this.textContent = 'Remove points'; else this.textContent = 'Apply points'; window.dispatchEvent(new Event('cartchange')); updateCartUI(); refreshPreview(); });
      window.addEventListener('storage', function(e){ if(e.key === 'cakerie_points' || e.key === 'cakerie_cart') refreshPoints(); });
      // also refresh preview on cartchange so subtotal updates preview
      window.addEventListener('cartchange', refreshPreview);
    }catch(e){}
  })();

  // place order with confirmation modal
  document.getElementById('placeOrder').addEventListener('click', function(){
    var cart = readCart(); if(!cart.length){ alert('Cart is empty.'); return; }
    var name = nameEl.value.trim();
    var phone = phoneEl.value.trim();
    var email = emailEl.value.trim();
    var deliveryOption = (document.querySelector('input[name="delivery_option"]:checked') || {}).value;
    var address = addrEl.value.trim();
    if(!deliveryOption){ alert('Please select home delivery or pickup'); return; }
    if(!name || !phone || !email){ alert('Please fill your name, phone and email'); return; }
    if(deliveryOption === 'home' && !address){ alert('Please provide your full delivery address'); return; }

    var paymentMethod = (document.querySelector('input[name="pay"]:checked') || {}).value;
    if(!paymentMethod){ alert('Please select a payment method'); return; }
    var totals = calcTotals(cart);
    // show modal
    var backdrop = document.createElement('div'); backdrop.className = 'modal-backdrop';
    var modal = document.createElement('div'); modal.className = 'modal';
    modal.innerHTML = '<h4>Confirm Order</h4>' +
      '<div>Items: '+cart.length+'</div>' +
      '<div>Subtotal: '+format(totals.sub)+'</div>' +
      '<div>Discount: '+format(totals.discount)+'</div>' +
      '<div>Shipping: '+format(totals.shipping)+'</div>' +
      '<div class="row" style="margin-top:8px;font-weight:700">Total: '+format(totals.total)+'</div>' +
      '<div class="actions"><button id="confirmOrder" class="btn-place">Confirm</button><button id="cancelOrder" class="remove-link">Cancel</button></div>';
    backdrop.appendChild(modal); document.body.appendChild(backdrop);

    modal.querySelector('#cancelOrder').addEventListener('click', function(){ document.body.removeChild(backdrop); });
    modal.querySelector('#confirmOrder').addEventListener('click', function(){
      // build order object and save to localStorage orders
      var orderId;
      try{
        var paymentMethod = (document.querySelector('input[name="pay"]:checked') || {}).value || 'card';
        var orderObj = {
          items: cart,
          totals: totals,
          paymentMethod: paymentMethod,
          customer: {
            name: name,
            phone: phone,
            email: email,
            deliveryOption: deliveryOption,
            address: deliveryOption === 'home' ? address : ''
          },
          status: 'Preparing'
        };
        // if loyalty applied, redeem the used points now (redeemPoints expects points and subtotal)
        try{
          var ct = orderObj.totals || calcTotals(cart);
          var usedPts = ct.loyaltyPointsUsed || 0;
          if(usedPts && window.redeemPoints) window.redeemPoints(usedPts, ct.sub);
          if(usedPts) { orderObj.totals.loyalty_redeemed = usedPts; orderObj.totals.loyalty_discount = ct.loyaltyDiscount || 0; }
        }catch(e){}
        if(window.saveOrder) orderId = window.saveOrder(orderObj);
        else orderId = 'ORD' + Date.now();
      }catch(e){ orderId = 'ORD' + Date.now(); }

      writeCart([]); updateCartUI(); document.body.removeChild(backdrop);
      var msgEl = document.getElementById('orderMsg'); msgEl.style.display = 'block'; msgEl.textContent = 'Order placed — ' + orderId + '. Confirmation sent.';
      setTimeout(function(){ window.location.href = 'order.html'; }, 1400);
    });
  });

  var deliveryInputs = document.querySelectorAll('input[name="delivery_option"]');
  deliveryInputs.forEach(function(input){
    input.addEventListener('change', function(){ updateCartUI(); });
  });

  document.getElementById('clearCart').addEventListener('click', function(){ if(confirm('Clear cart?')){ writeCart([]); updateCartUI(); } });

  // respond to other tabs updating cart
  window.addEventListener('storage', function(e){ if(e.key === 'cakerie_cart'){ updateCartUI(); } });

  // initial render
  updateCartUI();
})();
