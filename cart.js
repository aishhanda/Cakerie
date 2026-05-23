function readCart(){
  try { return JSON.parse(localStorage.getItem('cakerie_cart') || '[]'); }
  catch(e){ return []; }
}

function writeCart(c){
  localStorage.setItem('cakerie_cart', JSON.stringify(c));
}

function updateCartCount(){
  let count = readCart().reduce(function(s,i){ return s + (i.qty||0); }, 0);
  document.querySelector('.cart-count').textContent = count;
}

function showToast(msg){
  let t = document.querySelector('.cart-toast');
  if(!t){
    t = document.createElement('div');
    t.className = 'cart-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._hide);
  t._hide = setTimeout(function(){ t.classList.remove('show'); }, 1800);
}

function readOrders(){
  try { return JSON.parse(localStorage.getItem('cakerie_orders') || '[]'); }
  catch(e){ return []; }
}

function writeOrders(arr){
  localStorage.setItem('cakerie_orders', JSON.stringify(arr));
}

function saveOrder(order){
    let orders = readOrders();
    order.id = 'ORD' + Date.now();
    order.date = new Date().toISOString();
    orders.unshift(order);
    writeOrders(orders);
    const total = order.totals.total;
    const pts = Math.floor(total / 1000) * 10;
    if (pts > 0) addPoints(pts);
    return order.id;
}

function readPoints() {
  return Number(localStorage.getItem('cakerie_points')) || 0;
}

function writePoints(n){
  localStorage.setItem('cakerie_points', String(n||0));
  updateCoinUI();
}

function addPoints(n) {
  if (!n || n <= 0) return;
  const cur = readPoints();
  writePoints(cur + (+n));
  showToast('+' + n + ' points');
}

function redeemPoints(subtotal) {
  const cur = readPoints();
  const use = Math.min(cur, Math.floor(subtotal));
  writePoints(cur - use);
  return use;
}

function ensureCoinIcon() {
  updateCoinUI() 
  const tooltip = document.getElementById('coinTooltip');
  const points = document.querySelector('.nav-coin');
  points.addEventListener('mouseenter', function() { tooltip.style.display = 'block'; });
  points.addEventListener('mouseleave', function() { tooltip.style.display = 'none'; });
}

function updateCoinUI(){
  document.getElementById('coinBadge').textContent = readPoints();
}

document.addEventListener('DOMContentLoaded', updateCartCount);
document.addEventListener('DOMContentLoaded', ensureCoinIcon);

window.addEventListener('storage', function(e) {
  if (e.key === 'cakerie_cart') updateCartCount();
  if (e.key === 'cakerie_points') updateCoinUI();
});

document.addEventListener('DOMContentLoaded', function(){
  if(!document.getElementById('items')) return;
  let itemsEl = document.getElementById('items');
  let emptyEl = document.getElementById('empty');
  let subtotalEl = document.getElementById('subtotal');
  let shippingEl = document.getElementById('shipping');
  let totalEl = document.getElementById('total');
  let checkoutPanel = document.querySelector('.checkout-panel');
  let paymentSection = document.getElementById('paymentSection');
  let deliveryBlock = document.getElementById('deliveryBlock');
  let deliveryContactBlock = document.getElementById('deliveryContactBlock');
  let deliveryHint = document.getElementById('deliveryHint');
  let nameEl = document.getElementById('name');
  let phoneEl = document.getElementById('phone');
  let emailEl = document.getElementById('email');
  let addrEl = document.getElementById('addr');
  let heroEl = document.querySelector('.cart-hero');
  let cartWrap = document.querySelector('.cart-wrap');

  
  function format(v){ 
    return '₹' + v.toLocaleString('en-IN'); 
  }

  function calcTotals(cart, applyLoyalty = false){
    let sub = cart.reduce((s, it) => s + Number(it.price) * it.qty , 0);
    let deliveryOption = (document.querySelector('input[name="delivery_option"]:checked') || {}).value;
    let shipping = deliveryOption === 'home' ? 80 : 0;
    let loyaltyPoints = 0;
    if (applyLoyalty) {
      loyaltyPoints = Math.min(readPoints(), Math.floor(sub));
    }
    return {
      sub,
      shipping,
      total: sub - loyaltyPoints + shipping,
      loyaltyPoints
    };
  }

  function getDeliveryOption(){
    return (document.querySelector('input[name="delivery_option"]:checked') || {}).value || '';
  }

  function renderEmpty(){
    emptyEl.style.display = 'block';
    itemsEl.innerHTML = '';
    itemsEl.style.display = 'none';
    checkoutPanel.style.display = 'none';
    heroEl.style.display = 'none';
    cartWrap.style.display = 'block';   
  }

  function updateCartUI(){
    let cart = readCart();
    itemsEl.innerHTML = '';
    if(!cart.length){
      renderEmpty();
    } else {
      emptyEl.style.display = 'none';
      itemsEl.style.display = 'block';
      checkoutPanel.style.display = 'block';
      heroEl.style.display = 'block';
      cartWrap.style.display = 'block';
      if(deliveryHint){
        deliveryHint.textContent = getDeliveryOption() 
          ? 'Payment options are now available.' 
          : 'Select a delivery option to unlock payment.';
      }
      paymentSection.classList.toggle('hidden', !getDeliveryOption());
      deliveryContactBlock.classList.toggle('hidden', !getDeliveryOption());
      deliveryBlock.classList.toggle('hidden', getDeliveryOption() !== 'home');
    }

    cart.forEach(function(it, idx){
      let node = document.createElement('div');
      node.className = 'cart-item';

      let img = document.createElement('img');
      img.src = it.img || '';
      node.appendChild(img);

      let meta = document.createElement('div');
      meta.className = 'meta';

      let title = document.createElement('h3');
      title.textContent = it.title || 'Item';
      meta.appendChild(title);

      let qty = document.createElement('div');
      qty.className = 'meta-sub';
      qty.textContent = `Qty: ${it.qty || 1}`;
      meta.appendChild(qty);

      if (it.weight) {
        let weight = document.createElement('div');
        weight.className = 'meta-sub';
        weight.textContent = `Weight: ${parseFloat(it.weight).toFixed(1)} lb`;
        meta.appendChild(weight);
      }

      if (it.unitPrice) {
        let unit = document.createElement('div');
        unit.className = 'meta-sub';
        unit.textContent = `Unit: ${format(it.unitPrice)}/lb`;
        meta.appendChild(unit);
      }

      let price = document.createElement('div');
      price.className = 'price';
      price.textContent = format(it.price || 0);
      meta.appendChild(price);

      node.appendChild(meta);
      let controls = document.createElement('div');
      controls.className = 'controls';

      let qtyControls = document.createElement('div');
      qtyControls.className = 'qty-controls';

      let decBtn = document.createElement('button');
      decBtn.textContent = '-';
      decBtn.className = 'dec';
      qtyControls.appendChild(decBtn);

      let qtyDisplay = document.createElement('div');
      qtyDisplay.className = 'count';
      qtyDisplay.textContent = it.qty || 1;
      qtyControls.appendChild(qtyDisplay);

      let incBtn = document.createElement('button');
      incBtn.textContent = '+';
      incBtn.className = 'inc';
      qtyControls.appendChild(incBtn);

      let removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.className = 'remove-link';

      controls.appendChild(qtyControls);
      controls.appendChild(removeBtn);
      node.appendChild(controls);
      itemsEl.appendChild(node);

      decBtn.addEventListener('click', function() {
        it.qty = Math.max(1, it.qty - 1);
        qtyDisplay.textContent = it.qty;
        writeCart(cart);
        updateCartUI();
        dispatchEvent(new Event('cartchange'));
      });

      incBtn.addEventListener('click', function() {
        it.qty = it.qty + 1;
        qtyDisplay.textContent = it.qty;
        writeCart(cart);
        updateCartUI();
        dispatchEvent(new Event('cartchange'));
      });

      removeBtn.addEventListener('click', function() {
        cart.splice(idx, 1);
        writeCart(cart);
        updateCartUI();
        dispatchEvent(new Event('cartchange'));
      });
    });

    let applyLoyaltyChk = document.getElementById('applyLoyalty');
    let applyLoyalty = applyLoyaltyChk ? applyLoyaltyChk.checked : false;
    let t = calcTotals(cart, applyLoyalty);
    subtotalEl.textContent = format(t.sub);
    shippingEl.textContent = format(t.shipping);
    
    let existing = document.getElementById('loyaltyRow');
    if(t.loyaltyPoints > 0){ 
      if(!existing){
        existing = document.createElement('div');
        existing.className = 'row';
        existing.id = 'loyaltyRow';
        existing.innerHTML = '<div class="small-muted">Loyalty discount</div><div id="loyaltyAmount" class="promo-applied">-₹0</div>';
        let totalsWrap = document.querySelector('.totals');
        let totalRow = totalsWrap.querySelector('.total');
        totalsWrap.insertBefore(existing, totalRow);
      }
      document.getElementById('loyaltyAmount').textContent = '-₹' + t.loyaltyPoints;  
    } else {
      if(existing) existing.parentNode.removeChild(existing);
    }

    totalEl.textContent = format(t.total);
    updateCartCount();
  }

  
  function refreshLoyaltyUI(){
    let pts = readPoints();
    let balanceEl = document.getElementById('loyaltyBalance');
    let previewEl = document.getElementById('loyaltyPreview');
    let chk = document.getElementById('applyLoyalty');
    
    if(balanceEl) balanceEl.textContent = 'Points: ' + pts;
    
    if(chk && previewEl){
      let cart = readCart();
      let sub = cart.reduce((s, it) => s + (Number(it.price) || 0) * (it.qty || 1), 0);
      let ptsUse = Math.min(pts, Math.floor(Math.max(0, sub)));
      
      if(ptsUse <= 0){
        previewEl.textContent = 'No points available';
        chk.disabled = true;
      } else {
        previewEl.textContent = chk.checked ? 'Applied: -₹' + ptsUse : 'You save: ₹' + ptsUse;
        chk.disabled = false;
      }
    }
  }


let loyaltyBtn = document.getElementById('applyLoyaltyBtn');
let loyaltyChk = document.getElementById('applyLoyalty');

if(loyaltyBtn && loyaltyChk){
  loyaltyBtn.addEventListener('click', function(){
    loyaltyChk.checked = !loyaltyChk.checked;
    
    if(loyaltyChk.checked){
      loyaltyBtn.textContent = 'Remove points';
    } else {
      loyaltyBtn.textContent = 'Apply points';
    }
    
    updateCartUI();
    refreshLoyaltyUI();
  });
}

  
  document.getElementById('applyLoyalty')?.addEventListener('change', function(){
    updateCartUI();
    refreshLoyaltyUI();
  });

  
  document.getElementById('placeOrder').addEventListener('click', function(){
    let cart = readCart();
    let name = nameEl.value.trim();
    let phone = phoneEl.value.trim();
    let email = emailEl.value.trim();
    let deliveryOption = getDeliveryOption();
    let address = addrEl.value.trim();

    if(!deliveryOption){ alert('Please select home delivery or pickup'); return; }
    if(!name || !phone || !email){ alert('Please fill your name, phone and email');
       return; }
       //if not valid phone, alert and return
       if(!Number(phone) ){ alert('Please fill valid phone');
       return; }
       //if not valid mail, alert and return
        if(!email.includes('@') || !email.includes('.')){ alert('Please fill valid email');
        return; }
    if(deliveryOption === 'home' && !address){ alert('Please provide your full delivery address'); return; }

    let paymentMethod = (document.querySelector('input[name="pay"]:checked') || {}).value;
    if(!paymentMethod){ alert('Please select a payment method'); return; }

    let applyLoyaltyChk = document.getElementById('applyLoyalty');
    let applyLoyalty = applyLoyaltyChk ? applyLoyaltyChk.checked : false;
    let totals = calcTotals(cart, applyLoyalty);

    let backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    let modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = '<h4>Confirm Order</h4>' +
      '<div>Items: '+cart.length+'</div>' +
      '<div>Subtotal: '+format(totals.sub)+'</div>' +
      '<div>Discount: '+format(totals.loyaltyPoints)+'</div>' +
      '<div>Shipping: '+format(totals.shipping)+'</div>' +
      '<div class="row" style="margin-top:8px; font-weight:700">Total: '+format(totals.total)+'</div>' +
      '<div class="actions"><button id="confirmOrder" class="btn-place">Confirm</button><button id="cancelOrder" class="remove-link">Cancel</button></div>';
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    modal.querySelector('#cancelOrder').addEventListener('click', function(){
      document.body.removeChild(backdrop);
    });

    modal.querySelector('#confirmOrder').addEventListener('click', function(){
      const orderObj = {
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

      
      const usedPts = totals.loyaltyPoints || 0;
      if (usedPts) {
        redeemPoints(usedPts);
      }

      const orderId = saveOrder(orderObj);
      writeCart([]);
  
  
  showToast('✅ Order placed! ID: ' + orderId);
  
  
  document.body.removeChild(backdrop);
  

  updateCartUI();
  refreshLoyaltyUI();
  
  
  setTimeout(function() {
    window.location.href = 'order.html';
  }, 2000);
    });
  });


  document.querySelectorAll('input[name="delivery_option"]').forEach(function(input){
    input.addEventListener('change', updateCartUI);
  });

  document.getElementById('clearCart').addEventListener('click', function(){
    if(confirm('Clear cart?')){
      writeCart([]);
      updateCartUI();
    }
  });

  window.addEventListener('storage', function(e){
    if(e.key === 'cakerie_cart') updateCartUI();
  });

  updateCartUI();
  refreshLoyaltyUI();
});