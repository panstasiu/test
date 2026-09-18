(() => {
  const cfg=window.AURELIA_SUPABASE,message=document.querySelector("#accountMessage"),authCard=document.querySelector("#authCard"),profileCard=document.querySelector("#profileCard"),profileName=document.querySelector("#profileName"),profileEmail=document.querySelector("#profileEmail"),loginForm=document.querySelector("#loginForm"),registerForm=document.querySelector("#registerForm"),resetForm=document.querySelector("#resetForm"),accountTerms=document.querySelector("#accountTerms"),accountTermsCheckbox=document.querySelector("#accountTermsCheckbox");
  if(!cfg?.url||!cfg?.publishableKey||!window.supabase){if(message)setMessage("System kont jest chwilowo niedostępny. Spróbuj ponownie później.","error");return}

  const client=window.supabase.createClient(cfg.url,cfg.publishableKey),redirectUrl=window.location.origin+window.location.pathname;

  function setMessage(text,type=""){if(!message)return;message.textContent=text;message.className="account-message"+(type?" "+type:"")}
  function showTab(tab){document.querySelectorAll("[data-auth-tab]").forEach(btn=>btn.classList.toggle("active",btn.dataset.authTab===tab));loginForm?.classList.toggle("hidden",tab!=="login");registerForm?.classList.toggle("hidden",tab!=="register");resetForm?.classList.add("hidden");setMessage("")}
  function authError(error,context){
    console.error(error);
    if(context==="login"){
      if(error?.code==="invalid_credentials")return "Nieprawidłowy e-mail lub hasło.";
      if(error?.code==="email_not_confirmed")return "Najpierw potwierdź adres e-mail, korzystając z wiadomości od AURELIA.";
      if(error?.status===429)return "Za dużo prób logowania. Odczekaj chwilę i spróbuj ponownie.";
      return "Nie udało się zalogować. Spróbuj ponownie.";
    }
    if(context==="register"){
      if(error?.code==="weak_password")return "Hasło jest za słabe. Wybierz mocniejsze hasło zgodne z wymaganiami.";
      if(error?.code==="user_already_exists")return "Nie udało się utworzyć konta. Spróbuj zalogować się na ten adres lub użyj innego.";
      if(error?.status===429)return "Za dużo prób. Odczekaj chwilę i spróbuj ponownie.";
      return "Nie udało się utworzyć konta. Sprawdź dane i spróbuj ponownie.";
    }
    if(context==="reset")return "Nie udało się wysłać linku. Sprawdź adres e-mail i spróbuj ponownie.";
    return "Wystąpił nieoczekiwany problem. Spróbuj ponownie.";
  }

  document.querySelectorAll("[data-auth-tab]").forEach(btn=>btn.addEventListener("click",()=>showTab(btn.dataset.authTab)));
  document.querySelector("#showReset")?.addEventListener("click",()=>{loginForm?.classList.add("hidden");registerForm?.classList.add("hidden");resetForm?.classList.remove("hidden");document.querySelectorAll("[data-auth-tab]").forEach(btn=>btn.classList.remove("active"));setMessage("")});
  document.querySelector("#backToLogin")?.addEventListener("click",()=>showTab("login"));

  loginForm?.addEventListener("submit",async e=>{
    e.preventDefault();
    const data=new FormData(loginForm),email=String(data.get("email")||"").trim(),password=String(data.get("password")||"");
    if(!email)return setMessage("Wpisz adres e-mail.","error");
    if(password.length<6)return setMessage("Hasło musi mieć co najmniej 6 znaków.","error");
    setMessage("Logowanie…");
    const {error}=await client.auth.signInWithPassword({email,password});
    if(error)return setMessage(authError(error,"login"),"error");
    setMessage("Zalogowano pomyślnie.","success");await refreshUser();
  });

  registerForm?.addEventListener("submit",async e=>{
    e.preventDefault();
    const data=new FormData(registerForm),firstName=String(data.get("firstName")||"").trim(),lastName=String(data.get("lastName")||"").trim(),email=String(data.get("email")||"").trim(),password=String(data.get("password")||""),confirm=String(data.get("passwordConfirm")||"");
    if(!firstName||!lastName)return setMessage("Uzupełnij imię i nazwisko.","error");
    if(password.length<6)return setMessage("Hasło musi mieć co najmniej 6 znaków.","error");
    if(password!==confirm)return setMessage("Hasła nie są takie same. Sprawdź oba pola.","error");
    if(!accountTermsCheckbox?.checked){accountTerms?.classList.add("consent-invalid");setMessage("Zaakceptuj zasady korzystania z konta, aby kontynuować.","error");accountTermsCheckbox?.focus();return}
    accountTerms?.classList.remove("consent-invalid");
    setMessage("Tworzenie konta…");
    const {data:result,error}=await client.auth.signUp({email,password,options:{data:{first_name:firstName,last_name:lastName},emailRedirectTo:redirectUrl}});
    if(error)return setMessage(authError(error,"register"),"error");
    if(result.session){setMessage("Konto utworzone i zalogowano.","success");await refreshUser()}else setMessage("Konto utworzone. Sprawdź e-mail i potwierdź adres, aby się zalogować.","success");
    registerForm.reset();
  });

  accountTermsCheckbox?.addEventListener("change",()=>{if(accountTermsCheckbox.checked)accountTerms?.classList.remove("consent-invalid")});

  resetForm?.addEventListener("submit",async e=>{
    e.preventDefault();
    const email=String(new FormData(resetForm).get("email")||"").trim();
    if(!email)return setMessage("Wpisz adres e-mail.","error");
    setMessage("Wysyłanie linku…");
    const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:redirectUrl});
    if(error)return setMessage(authError(error,"reset"),"error");
    setMessage("Jeśli konto istnieje, na podany adres został wysłany link do zmiany hasła.","success");resetForm.reset();
  });

  document.querySelector("#logoutBtn")?.addEventListener("click",async()=>{await client.auth.signOut();await refreshUser();showTab("login");setMessage("Zostałeś wylogowany.","success")});

  async function refreshUser(){
    const {data}=await client.auth.getUser(),user=data?.user,loggedIn=!!user;
    authCard?.classList.toggle("hidden",loggedIn);profileCard?.classList.toggle("hidden",!loggedIn);
    if(loggedIn){const meta=user.user_metadata||{},name=[meta.first_name,meta.last_name].filter(Boolean).join(" ");profileName.textContent=name||"Twoje konto";profileEmail.textContent=user.email||""}
  }
  client.auth.onAuthStateChange(()=>{refreshUser()});refreshUser();
})();