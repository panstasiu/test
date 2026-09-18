const state={cart:JSON.parse(localStorage.getItem("aurelia-cart")||"[]"),favorites:JSON.parse(localStorage.getItem("aurelia-favorites")||"[]")};
const $=(s,p=document)=>p.querySelector(s); const $$=(s,p=document)=>[...p.querySelectorAll(s)];
const money=n=>new Intl.NumberFormat("pl-PL").format(n)+" zł";
const toast=m=>{const t=$("#toast");if(!t)return;t.textContent=m;t.classList.add("show");clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.classList.remove("show"),1800)};
const save=()=>{localStorage.setItem("aurelia-cart",JSON.stringify(state.cart));localStorage.setItem("aurelia-favorites",JSON.stringify(state.favorites));renderCart();updateCartCount()};
const updateCartCount=()=>{const c=$("#cartCount");if(c)c.textContent=state.cart.length};
function renderCart(){const items=$("#cartItems"),total=$("#cartTotal");if(!items)return;const sum=state.cart.reduce((a,p)=>a+p.price,0);if(total)total.textContent=money(sum);if(!state.cart.length){items.innerHTML='<p class="empty-cart">Twoja torba jest jeszcze pusta.</p>';return}
items.innerHTML=state.cart.map((p,i)=>'<div class="cart-row"><img class="cart-thumb" src="'+p.img+'" alt=""><div><h4>'+p.name+'</h4><p>'+money(p.price)+'</p></div><button class="remove-item" data-remove="'+i+'">×</button></div>').join("");
$$("[data-remove]",items).forEach(b=>b.onclick=()=>{state.cart.splice(+b.dataset.remove,1);save();toast("Usunięto produkt")})}
$$(".add-product").forEach(btn=>btn.onclick=()=>{const card=btn.closest(".product-card");if(!card)return;state.cart.push({name:card.dataset.name,price:+card.dataset.price,img:$("img",card)?.src||""});save();toast("Dodano do torby ✓");btn.textContent="Dodano ✓";setTimeout(()=>btn.textContent="Dodaj do torby",1000)});
renderCart();updateCartCount();

const drawer=$("#cartDrawer"),backdrop=$("#backdrop");
function openCart(){drawer?.classList.add("open");backdrop?.classList.add("open");document.body.classList.add("no-scroll")}
function closeCart(){drawer?.classList.remove("open");backdrop?.classList.remove("open");document.body.classList.remove("no-scroll")}
$$("[data-open-cart]").forEach(b=>b.onclick=openCart);$$("[data-close-cart]").forEach(b=>b.onclick=closeCart);backdrop?.addEventListener("click",closeCart);

const search=$("#searchOverlay"),input=$("#searchInput"),result=$("#searchResult");
function openSearch(){if(!search)return;search.classList.add("open");input?.focus();document.body.classList.add("no-scroll")}
function closeSearch(){search?.classList.remove("open");document.body.classList.remove("no-scroll")}
$$("[data-open-search]").forEach(b=>b.onclick=openSearch);$$("[data-close-search]").forEach(b=>b.onclick=closeSearch);
input?.addEventListener("input",()=>{const q=input.value.toLowerCase().trim();if(!result)return;if(!q){result.textContent="Wpisz nazwę produktu lub kategorię.";return}const matches=$$(".product-card").filter(c=>(c.dataset.name+" "+c.dataset.category).toLowerCase().includes(q));result.textContent=matches.length?"Znaleziono "+matches.length+" pasujący produkt.":"Nie znaleziono produktu — spróbuj innej frazy."});

const menu=$("#mobileMenu");$("[data-menu]")?.addEventListener("click",()=>menu?.classList.toggle("open"));$$(".mobile-menu a").forEach(a=>a.onclick=()=>menu?.classList.remove("open"));

$$(".heart").forEach(b=>{const card=b.closest(".product-card"),id=card?.dataset.id;if(id&&state.favorites.includes(id)){b.classList.add("active");b.textContent="♥"}b.onclick=()=>{if(!id)return;const i=state.favorites.indexOf(id);i>=0?state.favorites.splice(i,1):state.favorites.push(id);b.classList.toggle("active");b.textContent=b.classList.contains("active")?"♥":"♡";save();toast(b.classList.contains("active")?"Dodano do ulubionych":"Usunięto z ulubionych")}});

const filters=$("#filters"),filterToggle=$("[data-filter-toggle]");
filterToggle?.addEventListener("click",()=>filters?.classList.toggle("show"));
$$(".filter").forEach(b=>b.onclick=()=>{$$(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");const f=b.dataset.filter;$$(".product-card").forEach(c=>c.style.display=f==="all"||c.dataset.category===f?"":"none")});

if("IntersectionObserver"in window){const observer=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add("visible")}),{threshold:.08});$$(".reveal").forEach(e=>observer.observe(e))}
const viewer=$("#viewer"),model=$(".chair-3d");let dragging=false,lastX=0,rotation=-15;
if(viewer&&model){const move=x=>{if(!dragging)return;rotation+=(x-lastX)*.45;lastX=x;model.style.transform="translate(-50%,-45%) rotateY("+rotation+"deg)"};viewer.onpointerdown=e=>{dragging=true;lastX=e.clientX;viewer.setPointerCapture(e.pointerId)};viewer.onpointermove=e=>move(e.clientX);viewer.onpointerup=()=>dragging=false;viewer.onpointercancel=()=>dragging=false;viewer.addEventListener("wheel",e=>{rotation+=e.deltaY*.08;model.style.transform="translate(-50%,-45%) rotateY("+rotation+"deg)"})}

const newsletter=$("#newsletterForm");newsletter?.addEventListener("submit",e=>{e.preventDefault();e.target.innerHTML='<p class="newsletter-message">Gotowe — sprawdź swoją skrzynkę. ✦</p>';toast("Dziękujemy za zapis!")});
const contact=$("#contactForm");contact?.addEventListener("submit",e=>{e.preventDefault();const name=new FormData(contact).get("name");contact.innerHTML='<div class="form-success"><strong>Dziękujemy, '+name+'!</strong><p>Wiadomość została przygotowana. To wersja demonstracyjna strony.</p></div>';toast("Wiadomość wysłana ✓")});
$(".checkout")?.addEventListener("click",()=>toast(state.cart.length?"Demo sklepu — tutaj możemy podłączyć płatności.":"Najpierw dodaj coś do torby."));

document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeSearch();closeCart();menu?.classList.remove("open")}if(e.key==="/"&&document.activeElement?.tagName!=="INPUT"){e.preventDefault();openSearch()}});
const progress=document.createElement("div");progress.className="scroll-progress";document.body.appendChild(progress);window.addEventListener("scroll",()=>{const h=document.documentElement.scrollHeight-innerHeight;progress.style.width=(h>0?(scrollY/h)*100:0)+"%"},{passive:true});


/* AURELIA appearance switcher — isolated from the rest of the app */
(function(){
  function initAppearance(){
    const root=document.documentElement;
    const toggle=document.getElementById("appearanceToggle");
    const drawer=document.getElementById("appearanceDrawer");
    const close=document.getElementById("appearanceClose");
    const backdrop=document.getElementById("appearanceBackdrop");
    const options=[...document.querySelectorAll(".appearance-option")];
    if(!toggle||!drawer||!close||!backdrop)return;
    function apply(theme){
      theme=theme==="dark"?"dark":"light";
      root.dataset.theme=theme;
      localStorage.setItem("aurelia-theme",theme);
      options.forEach(o=>o.classList.toggle("active",o.dataset.appearance===theme));
    }
    function open(){drawer.classList.add("open");backdrop.classList.add("open");drawer.setAttribute("aria-hidden","false")}
    function shut(){drawer.classList.remove("open");backdrop.classList.remove("open");drawer.setAttribute("aria-hidden","true")}
    apply(localStorage.getItem("aurelia-theme")||"light");
    toggle.addEventListener("click",open);
    close.addEventListener("click",shut);
    backdrop.addEventListener("click",shut);
    options.forEach(o=>o.addEventListener("click",function(){apply(o.dataset.appearance);shut()}));
    document.addEventListener("keydown",e=>{if(e.key==="Escape")shut()});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initAppearance);else initAppearance();
})();
