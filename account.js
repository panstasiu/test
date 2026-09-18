(() => {
  const cfg = window.AURELIA_SUPABASE;
  const message = document.querySelector("#accountMessage");
  const authCard = document.querySelector("#authCard");
  const profileCard = document.querySelector("#profileCard");
  const profileName = document.querySelector("#profileName");
  const profileEmail = document.querySelector("#profileEmail");
  const loginForm = document.querySelector("#loginForm");
  const registerForm = document.querySelector("#registerForm");
  const resetForm = document.querySelector("#resetForm");
  if (!cfg || !window.supabase) {
    if (message) message.textContent = "Nie udało się uruchomić systemu kont.";
    return;
  }

  const client = window.supabase.createClient(cfg.url, cfg.publishableKey);
  const redirectUrl = window.location.origin + window.location.pathname;

  function setMessage(text, type="") {
    if (!message) return;
    message.textContent = text;
    message.className = "account-message" + (type ? " " + type : "");
  }

  function showTab(tab) {
    document.querySelectorAll("[data-auth-tab]").forEach(btn => btn.classList.toggle("active", btn.dataset.authTab === tab));
    loginForm?.classList.toggle("hidden", tab !== "login");
    registerForm?.classList.toggle("hidden", tab !== "register");
    resetForm?.classList.add("hidden");
    setMessage("");
  }

  document.querySelectorAll("[data-auth-tab]").forEach(btn => btn.addEventListener("click", () => showTab(btn.dataset.authTab)));
  document.querySelector("#showReset")?.addEventListener("click", () => {
    loginForm?.classList.add("hidden");
    registerForm?.classList.add("hidden");
    resetForm?.classList.remove("hidden");
    document.querySelectorAll("[data-auth-tab]").forEach(btn => btn.classList.remove("active"));
    setMessage("");
  });
  document.querySelector("#backToLogin")?.addEventListener("click", () => showTab("login"));

  loginForm?.addEventListener("submit", async e => {
    e.preventDefault();
    const data = new FormData(loginForm);
    setMessage("Logowanie…");
    const { error } = await client.auth.signInWithPassword({
      email: data.get("email").trim(),
      password: data.get("password")
    });
    if (error) return setMessage("Nie udało się zalogować. Sprawdź e-mail i hasło.", "error");
    setMessage("Zalogowano.", "success");
    await refreshUser();
  });

  registerForm?.addEventListener("submit", async e => {
    e.preventDefault();
    const data = new FormData(registerForm);
    const password = data.get("password");
    if (password !== data.get("passwordConfirm")) return setMessage("Hasła nie są takie same.", "error");
    setMessage("Tworzenie konta…");
    const { data: result, error } = await client.auth.signUp({
      email: data.get("email").trim(),
      password,
      options: {
        data: {
          first_name: data.get("firstName").trim(),
          last_name: data.get("lastName").trim()
        },
        emailRedirectTo: redirectUrl
      }
    });
    if (error) return setMessage(error.message || "Nie udało się utworzyć konta.", "error");
    if (result.session) {
      setMessage("Konto utworzone i zalogowano.", "success");
      await refreshUser();
    } else {
      setMessage("Konto utworzone. Sprawdź e-mail i potwierdź adres, aby się zalogować.", "success");
    }
    registerForm.reset();
  });

  resetForm?.addEventListener("submit", async e => {
    e.preventDefault();
    const email = new FormData(resetForm).get("email").trim();
    setMessage("Wysyłanie linku…");
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl });
    if (error) return setMessage("Nie udało się wysłać linku resetującego.", "error");
    setMessage("Jeśli konto istnieje, na podany adres został wysłany link do zmiany hasła.", "success");
    resetForm.reset();
  });

  document.querySelector("#logoutBtn")?.addEventListener("click", async () => {
    await client.auth.signOut();
    await refreshUser();
    showTab("login");
  });

  async function refreshUser() {
    const { data } = await client.auth.getUser();
    const user = data?.user;
    const loggedIn = !!user;
    authCard?.classList.toggle("hidden", loggedIn);
    profileCard?.classList.toggle("hidden", !loggedIn);
    if (loggedIn) {
      const meta = user.user_metadata || {};
      const name = [meta.first_name, meta.last_name].filter(Boolean).join(" ");
      profileName.textContent = name || "Twoje konto";
      profileEmail.textContent = user.email || "";
    }
  }

  client.auth.onAuthStateChange(() => { refreshUser(); });
  refreshUser();
})();