(function () {
  "use strict";

  function startAppearance() {
    const root = document.documentElement;
    const toggle = document.getElementById("appearanceToggle");
    const drawer = document.getElementById("appearanceDrawer");
    const close = document.getElementById("appearanceClose");
    const backdrop = document.getElementById("appearanceBackdrop");
    const options = document.querySelectorAll(".appearance-option");

    if (!toggle || !drawer || !close || !backdrop) {
      console.error("AURELIA appearance: brak elementów przełącznika.");
      return;
    }

    let saved = "light";
    try {
      saved = localStorage.getItem("aurelia-theme") || "light";
    } catch (e) {}

    function apply(theme) {
      const value = theme === "dark" ? "dark" : "light";
      root.setAttribute("data-theme", value);
      try {
        localStorage.setItem("aurelia-theme", value);
      } catch (e) {}
      options.forEach(function (option) {
        option.classList.toggle("active", option.getAttribute("data-appearance") === value);
      });
    }

    function openDrawer() {
      drawer.classList.add("open");
      backdrop.classList.add("open");
      drawer.setAttribute("aria-hidden", "false");
      toggle.setAttribute("aria-expanded", "true");
    }

    function closeDrawer() {
      drawer.classList.remove("open");
      backdrop.classList.remove("open");
      drawer.setAttribute("aria-hidden", "true");
      toggle.setAttribute("aria-expanded", "false");
    }

    apply(saved);

    toggle.addEventListener("click", openDrawer);
    close.addEventListener("click", closeDrawer);
    backdrop.addEventListener("click", closeDrawer);

    options.forEach(function (option) {
      option.addEventListener("click", function () {
        apply(option.getAttribute("data-appearance"));
        closeDrawer();
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeDrawer();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startAppearance);
  } else {
    startAppearance();
  }
})();