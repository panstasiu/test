(function(){
"use strict";
const money=n=>new Intl.NumberFormat("pl-PL").format(n)+" zł";
const read=()=>{try{const v=JSON.parse(localStorage.getItem("aurelia-cart")||"[]");return Array.isArray(v)?v:[]}catch(e){return[]}};
const cart=read(), items=document.getElementById("checkoutItems"), subtotalEl=document.getElementById("checkoutSubtotal"), shippingEl=document.getElementById("checkoutShipping"), totalEl=document.getElementById("checkoutTotal"), form=document.getElementById("checkoutForm"), toast=document.getElementById("toast");
const notify=m=>{if(!toast)return;toast.textContent=m;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),2200)};
function render(){const subtotal=cart.reduce((s,p)=>s+p.price*(p.qty||1),0), shipping=subtotal===0?0:(subtotal>=2500?0:49), total=subtotal+shipping;items.innerHTML=cart.length?cart.map(p=>'<div class="checkout-item"><img src="'+p.img+'" alt=""><div><strong>'+p.name+'</strong><span>'+(p.qty||1)+' × '+money(p.price)+'</span></div><b>'+money(p.price*(p.qty||1))+'</b></div>').join(""):'<p class="checkout-empty">Twoja torba jest pusta.</p>';subtotalEl.textContent=money(subtotal);shippingEl.textContent=shipping?money(shipping):"Gratis";totalEl.textContent=money(total);}
render();
form?.addEventListener("submit",e=>{e.preventDefault();if(!cart.length){notify("Dodaj produkt do torby.");return}const data=Object.fromEntries(new FormData(form));
const subtotal=cart.reduce((s,p)=>s+p.price*(p.qty||1),0);
const shipping=subtotal>=2500?0:49;
const payload={
  email:data.email,
  subtotal,
  shipping_cost:shipping,
  shipping_address:{
    first_name:data.firstName||"",
    last_name:data.lastName||"",
    phone:data.phone||"",
    street:data.street||"",
    postal_code:data.postalCode||"",
    city:data.city||"",
    country:data.country||"Polska"
  },
  items:cart.map(p=>({
    id:p.id,
    name:p.name,
    quantity:p.qty||1,
    unit_price:p.price,
    image:p.img||""
  }))
};
let order=null;
if(window.AURELIA_SUPABASE?.url && window.AURELIA_SUPABASE?.publishableKey && window.supabase){
  const client=window.supabase.createClient(window.AURELIA_SUPABASE.url,window.AURELIA_SUPABASE.publishableKey);
  const {data:created,error}=await client.rpc("create_storefront_order",{payload});
  if(error){notify("Nie udało się zapisać zamówienia. Sprawdź konfigurację Supabase.");console.error(error);return;}
  order=created;
}else{
  notify("Brak konfiguracji bazy Supabase.");
  return;
}
localStorage.setItem("aurelia-last-order",JSON.stringify({orderId:"AUR-"+order.order_number,customer:data,items:cart,createdAt:order.created_at}));
localStorage.removeItem("aurelia-cart");
form.innerHTML='<div class="checkout-success"><p class="eyebrow">ZAMÓWIENIE PRZYGOTOWANE</p><h2>Dziękujemy, '+data.firstName+'.</h2><p>Numer zamówienia: <strong>'+AUR-order.order_number+'</strong></p><p>Zamówienie zostało zapisane w bazie AURELIA. Płatność online zostanie podłączona w kolejnym etapie.</p><a class="btn btn-dark" href="index.html">Wróć do AURELII →</a></div>';items.innerHTML="";});
})();