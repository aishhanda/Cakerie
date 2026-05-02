(function(){
  function readCart(){ try{ return JSON.parse(localStorage.getItem('cakerie_cart')||'[]') }catch(e){return[]} }
  function writeCart(c){ localStorage.setItem('cakerie_cart', JSON.stringify(c)); }
  function updateCartCount(){
    var count = readCart().reduce(function(s,i){ return s + (i.qty||0); }, 0);
    document.querySelectorAll('.cart-count').forEach(function(el){ el.textContent = count; });
  }
  function showToast(msg){
    var t = document.querySelector('.cart-toast');
    if(!t){ t = document.createElement('div'); t.className = 'cart-toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._hide);
    t._hide = setTimeout(function(){ t.classList.remove('show'); }, 1800);
  }

  // expose helpers globally for other scripts to call if needed
  window.readCart = readCart;
  window.writeCart = writeCart;
  window.updateCartCount = updateCartCount;
  window.showCartToast = showToast;

  // Orders API (saved in localStorage under 'cakerie_orders')
  function readOrders(){ try{ return JSON.parse(localStorage.getItem('cakerie_orders')||'[]') }catch(e){ return [] } }
  function writeOrders(arr){ localStorage.setItem('cakerie_orders', JSON.stringify(arr)); }
  function saveOrder(order){
    var orders = readOrders();
    if(!order.id) order.id = 'ORD' + Date.now();
    if(!order.date) order.date = new Date().toISOString();
    orders.unshift(order);
    writeOrders(orders);
      // award loyalty points: 10 points for every full ₹1000
    try{
        var total = (order.totals && (order.totals.total || order.totals.sub)) || 0;
        // Earn 10 points for every full ₹1000
        var pts = Math.floor((total||0) / 1000) * 10;
      if(pts > 0) addPoints(pts);
    }catch(e){}
    return order.id;
  }
  window.readOrders = readOrders;
  window.saveOrder = saveOrder;

  // Loyalty points system (stored in 'cakerie_points')
  function readPoints(){ try{ return parseInt(localStorage.getItem('cakerie_points')||'0',10) || 0 }catch(e){ return 0 } }
  function writePoints(n){ localStorage.setItem('cakerie_points', String(n||0)); updateCoinUI(); }
  function addPoints(n){ if(!n || n<=0) return; var cur = readPoints(); writePoints(cur + parseInt(n,10)); showToast('+'+n+' points'); }
  // redeemPoints(requestedPoints, subtotal) -> returns points actually used
  // New rules: 1 point = ₹1; allow instant discount up to subtotal (no min, no special cap)
  function redeemPoints(requestedPoints, subtotal){ var cur = readPoints(); var req = Math.max(0, parseInt(requestedPoints||0,10)); if(!req) return 0; var avail = Math.min(cur, req); // cannot redeem more than available
    var maxUse = Math.floor(parseFloat(subtotal||0) || 0); // cannot redeem more than subtotal
    var use = Math.min(avail, maxUse);
    if(use <= 0) return 0;
    writePoints(cur - use);
    return use; }
  function getRedeemValue(){ return readPoints(); /* 1 point = ₹1 */ }

  // Nav coin icon + tooltip UI
  function ensureCoinIcon(){
    if(typeof document === 'undefined') return;
    var style = document.getElementById('cakerie-coin-style');
    if(!style){
      style = document.createElement('style'); style.id = 'cakerie-coin-style';
      style.innerHTML = '\n.nav-coin{position:relative;display:inline-flex;align-items:center;gap:8px}\n.nav-coin .coin-badge{background:linear-gradient(135deg,#ffd27a,#ffb86b);color:#111;padding:2px 6px;border-radius:999px;font-weight:700;font-size:12px;margin-left:4px}\n.coin-tooltip{position:absolute;right:0;top:40px;min-width:220px;background:rgba(15,15,15,0.98);border:1px solid rgba(255,255,255,0.04);padding:12px;border-radius:8px;color:#ddd;box-shadow:0 8px 30px rgba(0,0,0,0.5);display:none;z-index:3000}\n.coin-icon{animation:coinShine 2.5s infinite linear}\n@keyframes coinShine{0%{filter:drop-shadow(0 0 0 rgba(255,200,100,0.0))}50%{filter:drop-shadow(0 0 10px rgba(255,200,100,0.6))}100%{filter:drop-shadow(0 0 0 rgba(255,200,100,0.0))}}\n';
      document.head.appendChild(style);
    }

    var settings = document.querySelector('.nav-icon[title="Settings"]');
    if(!settings) return;
    // replace content
    settings.classList.add('nav-coin');
    settings.setAttribute('title','Loyalty Points');

    var tooltip = settings.querySelector('#coinTooltip');
    settings.addEventListener('mouseenter', function(){ if(tooltip) tooltip.style.display = 'block'; });
    settings.addEventListener('mouseleave', function(){ if(tooltip) tooltip.style.display = 'none'; });
    
    settings.innerHTML = '\n      <svg class="coin-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg">\n        <circle cx="12" cy="12" r="8" fill="url(#g)" stroke="none"></circle>\n        <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#ffd27a"/><stop offset="1" stop-color="#ffb86b"/></linearGradient></defs>\n        <text x="12" y="15" text-anchor="middle" font-size="10" font-family="sans-serif" fill="#111" font-weight="700">¢</text>\n      </svg>\n      <span class="coin-badge" id="coinBadge">'+ readPoints() +'</span>\n      <div class="coin-tooltip" id="coinTooltip">Earn: 10 points per ₹1000. 1 point = ₹1. Redeem instantly at checkout.</div>\n    ';
    var tooltip = settings.querySelector('#coinTooltip');
    settings.addEventListener('mouseenter', function(){ if(tooltip) tooltip.style.display = 'block'; });
    settings.addEventListener('mouseleave', function(){ if(tooltip) tooltip.style.display = 'none'; });
    
  }

  function updateCoinUI(){ var badge = document.getElementById('coinBadge'); if(badge) badge.textContent = readPoints(); }

  window.readPoints = readPoints;
  window.addPoints = addPoints;
  window.redeemPoints = redeemPoints;
  window.getRedeemValue = getRedeemValue;


  document.addEventListener('DOMContentLoaded', function(){ updateCartCount(); });
  // sync counts when localStorage changes in other tabs
  window.addEventListener('storage', function(e){
    if(e.key === 'cakerie_cart') updateCartCount();
    if(e.key === 'cakerie_points') { try{ updateCoinUI(); }catch(e){} }
  });
  // ensure coin icon on load
  try{ if(typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', ensureCoinIcon); }catch(e){}
})();
