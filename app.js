function readStorage(key){
  try{
    const value=JSON.parse(localStorage.getItem(key)||"[]");
    return Array.isArray(value)?value:[];
  }catch(e){
    localStorage.removeItem(key);
    return [];
  }
}
const state={cart:readStorage("aurelia-cart"),favorites:readStorage("aurelia-favorites")};
const $=(s,p=document)=>p.querySelector(s); const $$=(s,p=document)=>[...p.querySelectorAll(s)];
const money=n=>new Intl.NumberFormat("pl-PL").format(n)+" zł";
const toast=m=>{const t=$("#toast");if(!t)return;t.textContent=m;t.classList.add("show");clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.classList.remove("show"),1800)};
const updateCartCount=()=>{const c=$("#cartCount");if(c)c.textContent=state.cart.reduce((sum,p)=>sum+(Number(p.qty)||1),0)};
function renderCart(){const items=$("#cartItems"),total=$("#cartTotal");if(!items)return;const sum=state.cart.reduce((a,p)=>a+(Number(p.price)||0)*(Number(p.qty)||1),0);if(total)total.textContent=money(sum);if(!state.cart.length){items.innerHTML='<p class="empty-cart">Twoja torba jest jeszcze pusta.</p>';return}
items.innerHTML=state.cart.map((p,i)=>'<div class="cart-row"><img class="cart-thumb" src="'+(p.img||"")+'" alt=""><div><h4>'+p.name+'</h4><p>'+money(Number(p.price)||0)+' × '+(p.qty||1)+'</p><div class="cart-qty"><button type="button" data-qty="'+i+'" data-dir="-1">−</button><span>'+(p.qty||1)+'</span><button type="button" data-qty="'+i+'" data-dir="1">+</button></div></div><button type="button" class="remove-item" data-remove="'+i+'">×</button></div>').join("");
$("[data-remove]",items).forEach(b=>b.onclick=()=>{state.cart.splice(Number(b.dataset.remove),1);save();toast("Usunięto produkt")});$("[data-qty]",items).forEach(b=>b.onclick=()=>{const p=state.cart[Number(b.dataset.qty)];if(!p)return;p.qty=Math.max(1,(Number(p.qty)||1)+Number(b.dataset.dir));save()})}
const save=()=>{localStorage.setItem("aurelia-cart",JSON.stringify(state.cart));localStorage.setItem("aurelia-favorites",JSON.stringify(state.favorites));renderCart();updateCartCount()};
function addProduct(btn){const card=btn.closest(".product-card");if(!card)return;const id=card.dataset.id;if(!id)return;const existing=state.cart.find(p=>p.id===id);if(existing){existing.qty=(Number(existing.qty)||1)+1}else{state.cart.push({id:id,name:card.dataset.name||"Produkt",price:Number(card.dataset.price)||0,img:$("img",card)?.src||"",qty:1})}save();toast("Dodano do torby ✓");btn.textContent="Dodano ✓";clearTimeout(btn._cartTimer);btn._cartTimer=setTimeout(()=>btn.textContent="Dodaj do torby",1000)}
document.addEventListener("click",e=>{const btn=e.target.closest(".add-product");if(btn){e.preventDefault();addProduct(btn)}});
renderCart();updateCartCount();

const openCart=()=>window.AURELIA_CART?.open();
const closeCart=()=>window.AURELIA_CART?.close();

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
$(".checkout")?.addEventListener("click",()=>{if(state.cart.length)location.href="checkout.html";else toast("Najpierw dodaj coś do torby.")});

document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeSearch();closeCart();menu?.classList.remove("open")}if(e.key==="/"&&document.activeElement?.tagName!=="INPUT"){e.preventDefault();openSearch()}});
const progress=document.createElement("div");progress.className="scroll-progress";document.body.appendChild(progress);window.addEventListener("scroll",()=>{const h=document.documentElement.scrollHeight-innerHeight;progress.style.width=(h>0?(scrollY/h)*100:0)+"%"},{passive:true});
