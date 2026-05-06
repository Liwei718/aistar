const scientistFilterButtons = document.querySelectorAll("[data-scientist-filter]");
const scientistCards = document.querySelectorAll("[data-scientist-category]");

scientistFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.scientistFilter || "all";
    scientistFilterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    scientistCards.forEach((card) => {
      const shouldShow = filter === "all" || card.dataset.scientistCategory === filter;
      card.classList.toggle("is-hidden", !shouldShow);
    });
  });
});
