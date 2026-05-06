const frontierFilterButtons = document.querySelectorAll("[data-frontier-filter]");
const frontierItems = document.querySelectorAll("[data-frontier-category]");

frontierFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.frontierFilter || "all";
    frontierFilterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    frontierItems.forEach((item) => {
      const shouldShow = filter === "all" || item.dataset.frontierCategory === filter;
      item.classList.toggle("is-hidden", !shouldShow);
    });
  });
});
