(function(){
"use strict";
const money=n=>new Intl.NumberFormat("pl-PL").format(n)+" zł";
const read=()=>{try{const v=JSON.parse(localStorage.getItem("aurelia-cart")||"[]");return Array.isArray(v)?v:[]}catch(e){return[]}};
const cart=read(),items=document.getElementById("checkoutItems"),subtotalEl=document.getElementById("checkoutSubtotal"),shippingEl=document.getElementById("checkoutShipping"),totalEl=document.getElementById("checkoutTotal"),form=document.getElementById("checkoutForm"),toast=document.getElementById("toast"),feedback=document.getElementById("checkoutFeedback"),terms=document.getElementById("termsCheckbox"),termsWrap=document.getElementById("termsConsent"),termsFeedback=document.getElementById("termsFeedback");

const notify=m=>{if(!toast)return;toast.textContent=m;toast.classList.add("show");clearTimeout(window.checkoutToastTimer);window.checkoutToastTimer=setTimeout(()=>toast.classList.remove("show"),2400)};
const showFeedback=(el,text,type="error")=>{if(!el)return;el.textContent=text;el.className="form-feedback show "+type};
const clearFeedback=el=>{if(!el)return;el.textContent="";el.className="form-feedback"};
const clearFieldErrors=()=>form?.querySelectorAll(".field-invalid").forEach(x=>x.classList.remove("field-invalid"));

function render(){
  const subtotal=cart.reduce((s,p)=>s+p.price*(p.qty||1),0),shipping=subtotal===0?0:(subtotal>=2500?0:49),total=subtotal+shipping;
  items.innerHTML=cart.length?cart.map(p=>'<div class="checkout-item"><img src="'+p.img+'" alt=""><div><strong>'+p.name+'</strong><span>'+(p.qty||1)+' × '+money(p.price)+'</span></div><b>'+money(p.price*(p.qty||1))+'</b></div>').join(""):'<p class="checkout-empty">Twoja torba jest pusta.</p>';
  subtotalEl.textContent=money(subtotal);shippingEl.textContent=shipping?money(shipping):"Gratis";totalEl.textContent=money(total);
}
render();

terms?.addEventListener("change",()=>{
  if(terms.checked){
    termsWrap?.classList.remove("consent-invalid");
    clearFeedback(termsFeedback);
  }
});

form?.addEventListener("submit",async e=>{
  e.preventDefault();
  clearFeedback(feedback);clearFeedback(termsFeedback);clearFieldErrors();termsWrap?.classList.remove("consent-invalid");

  if(!cart.length){showFeedback(feedback,"Twoja torba jest pusta. Dodaj przynajmniej jeden produkt przed złożeniem zamówienia.");return}

  if(!terms?.checked){
    termsWrap?.classList.add("consent-invalid");
    showFeedback(termsFeedback,"Aby złożyć zamówienie, zaakceptuj warunki zamówienia i politykę prywatności.");
    terms?.focus();
    return;
  }

  const data=Object.fromEntries(new FormData(form));
  const requiredFields=[["firstName","Podaj imię."],["lastName","Podaj nazwisko."],["email","Podaj poprawny adres e-mail."],["phone","Podaj numer telefonu."],["street","Podaj ulicę i numer."],["postalCode","Podaj kod pocztowy."],["city","Podaj miasto."]];
  for(const [name,msg] of requiredFields){
    const field=form.elements[name];
    if(!field?.value.trim() || (name==="email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim()))){
      field?.classList.add("field-invalid");
      showFeedback(feedback,msg);
      field?.focus();
      return;
    }
  }

  const subtotal=cart.reduce((s,p)=>s+p.price*(p.qty||1),0),shipping=subtotal>=2500?0:49;
  const payload={
    email:data.email.trim(),subtotal,shipping_cost:shipping,
    shipping_address:{
      first_name:data.firstName.trim(),last_name:data.lastName.trim(),phone:data.phone.trim(),
      street:data.street.trim(),postal_code:data.postalCode.trim(),city:data.city.trim(),country:data.country||"Polska"
    },
    items:cart.map(p=>({id:p.id,name:p.name,quantity:p.qty||1,unit_price:p.price,image:p.img||""}))
  };

  const submit=form.querySelector(".checkout-submit");
  if(submit){submit.disabled=true;submit.dataset.originalText=submit.innerHTML;submit.innerHTML="Zapisywanie zamówienia…";}
  let order=null;

  try{
    if(window.AURELIA_SUPABASE?.url&&window.AURELIA_SUPABASE?.publishableKey&&window.supabase){
      const client=window.supabase.createClient(window.AURELIA_SUPABASE.url,window.AURELIA_SUPABASE.publishableKey);
      const {data:created,error}=await client.rpc("create_storefront_order",{payload});
      if(error){
        console.error(error);
        showFeedback(feedback,"Nie udało się zapisać zamówienia. Spróbuj ponownie za chwilę.");
        notify("Nie udało się zapisać zamówienia.");
        return;
      }
      order=created;
    }else{
      showFeedback(feedback,"Baza zamówień nie jest jeszcze skonfigurowana. Skontaktuj się z obsługą.");
      notify("Brak połączenia z bazą.");
      return;
    }
  }catch(error){
    console.error(error);
    showFeedback(feedback,"Wystąpił problem z połączeniem. Sprawdź internet i spróbuj ponownie.");
    notify("Problem z połączeniem.");
    return;
  }finally{
    if(submit){submit.disabled=false;submit.innerHTML=submit.dataset.originalText||"Złóż zamówienie →";}
  }

  localStorage.setItem("aurelia-last-order",JSON.stringify({orderId:"AUR-"+order.order_number,customer:data,items:cart,createdAt:order.created_at}));
  localStorage.removeItem("aurelia-cart");
  form.innerHTML='<div class="checkout-success"><p class="eyebrow">ZAMÓWIENIE PRZYGOTOWANE</p><h2>Dziękujemy, '+data.firstName+'.</h2><p>Numer zamówienia: <strong>AUR-'+order.order_number+'</strong></p><p>Zamówienie zostało zapisane w bazie AURELIA. Płatność online zostanie podłączona w kolejnym etapie.</p><a class="btn btn-dark" href="index.html">Wróć do AURELII →</a></div>';
  items.innerHTML="";
});
})();