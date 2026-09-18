(function(){
  "use strict";
  function drawer(){return document.getElementById("cartDrawer")}
  function backdrop(){return document.getElementById("backdrop")}
  function openCart(e){
    e?.preventDefault();
    const d=drawer(),b=backdrop();
    if(!d){console.error("AURELIA cart: #cartDrawer nie istnieje.");return false}
    d.classList.add("open");
    d.setAttribute("aria-hidden","false");
    b?.classList.add("open");
    document.body.classList.add("no-scroll");
    return false;
  }
  function closeCart(e){
    e?.preventDefault();
    const d=drawer(),b=backdrop();
    d?.classList.remove("open");
    d?.setAttribute("aria-hidden","true");
    b?.classList.remove("open");
    document.body.classList.remove("no-scroll");
    if(location.hash==="#cartDrawer") history.replaceState(null,"",location.pathname+location.search);
    return false;
  }
  window.AURELIA_CART={open:openCart,close:closeCart};
  document.addEventListener("click",function(e){
    if(e.target.closest("[data-open-cart]")){openCart(e);return}
    if(e.target.closest("[data-close-cart]")){closeCart(e);return}
    if(e.target===backdrop()) closeCart(e);
  },true);
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeCart()});
})();