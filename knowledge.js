const knowledgeFilterButtons = document.querySelectorAll("[data-knowledge-filter]");
const knowledgeBlocks = document.querySelectorAll(".knowledge-block");
const stageButtons = document.querySelectorAll(".knowledge-stage-bar button");

knowledgeFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.knowledgeFilter || "all";
    knowledgeFilterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    knowledgeBlocks.forEach((block) => {
      const ageGroups = (block.dataset.age || "").split(" ");
      const shouldShow =
        filter === "all" ||
        ageGroups.includes(filter) ||
        block.dataset.grade === filter ||
        block.dataset.subject === filter;
      block.classList.toggle("is-hidden", !shouldShow);
    });
  });
});

stageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    stageButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
  });
});
