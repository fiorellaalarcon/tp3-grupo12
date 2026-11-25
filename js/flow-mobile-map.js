(() => {
  const copyDataAttributes = (source, target) => {
    for (const attribute of source.attributes) {
      if (attribute.name.startsWith("data-")) target.setAttribute(attribute.name, attribute.value);
    }
  };

  const nodeText = (source) => [...source.querySelectorAll("text")]
    .map((text) => {
      const lines = [...text.querySelectorAll("tspan")].map((line) => line.textContent.trim());
      return (lines.length ? lines.filter((line) => !line.startsWith("Decisión del grupo:")).join(" ") : text.textContent.trim());
    })
    .filter(Boolean)
    .join(" · ");

  const addMobileLabel = (container, text, attributes = {}) => {
    const label = document.createElement("span");
    label.className = "branch-label flow-mobile-label";
    label.textContent = text;
    for (const [name, value] of Object.entries(attributes)) label.setAttribute(name, value);
    container.append(label);
  };

  const renderMap = (mapId, svgSelector, groups) => {
    const map = document.getElementById(mapId);
    const svg = document.querySelector(svgSelector);
    if (!map || !svg) return;
    const prefix = mapId.startsWith("r1") ? "r1" : "r2";
    const demo = map.closest(".flow-demo");
    const canvas = document.getElementById(`${prefix}-flow-canvas`);
    const diagramColumn = map.closest(".flow-diagram-column");
    if (demo && canvas && diagramColumn) {
      const controls = document.createElement("div");
      controls.className = "flow-view-controls";
      controls.setAttribute("role", "group");
      controls.setAttribute("aria-label", `Alternar vista del diagrama ${prefix.toUpperCase()}`);
      const fullButton = document.createElement("button");
      fullButton.className = "flow-view-toggle";
      fullButton.type = "button";
      fullButton.textContent = "Ver diagrama completo";
      fullButton.setAttribute("aria-controls", canvas.id);
      fullButton.setAttribute("aria-expanded", "false");
      const verticalButton = document.createElement("button");
      verticalButton.className = "flow-view-toggle";
      verticalButton.type = "button";
      verticalButton.textContent = "Volver al recorrido vertical";
      verticalButton.setAttribute("aria-controls", map.id);
      verticalButton.setAttribute("aria-expanded", "true");
      const setView = (showComplete, focusReturnControl) => {
        demo.classList.toggle("is-complete-view", showComplete);
        fullButton.setAttribute("aria-expanded", String(showComplete));
        verticalButton.setAttribute("aria-expanded", String(!showComplete));
        if (focusReturnControl) focusReturnControl.focus();
      };
      fullButton.addEventListener("click", () => setView(true, verticalButton));
      verticalButton.addEventListener("click", () => setView(false, fullButton));
      controls.append(fullButton, verticalButton);
      diagramColumn.insertBefore(controls, canvas);
    }

    for (const group of groups) {
      const section = document.createElement("section");
      section.className = "flow-mobile-branch";
      const heading = document.createElement("h5");
      heading.textContent = group.title;
      section.append(heading);

      group.items.forEach((item, index) => {
        if (item.edge) {
          const connector = document.createElement("div");
          connector.className = "flow-mobile-connector flow-edge";
          connector.setAttribute("data-flow-edge", item.edge);
          connector.setAttribute("aria-hidden", "true");
          connector.textContent = "↓";
          section.append(connector);
        }
        const source = svg.querySelector(`[data-flow-node="${item.node}"]`);
        if (!source) return;
        const card = document.createElement("div");
        card.className = "flow-mobile-node flow-node";
        copyDataAttributes(source, card);
        const sourceShape = source.querySelector(".flow-node-shape");
        if (sourceShape) {
          for (const className of sourceShape.classList) {
            if (className !== "flow-node-shape") card.classList.add(className);
          }
        }
        const text = document.createElement("span");
        text.className = "flow-mobile-node-text";
        text.textContent = nodeText(source);
        card.append(text);
        if (item.design) {
          const note = document.createElement("span");
          note.className = "flow-mobile-design-note";
          note.textContent = "Decisión del grupo: no está en la sentencia";
          card.append(note);
        }
        section.append(card);
        for (const label of item.labels ?? []) addMobileLabel(section, label.text, label.attributes);
      });
      map.append(section);
    }
  };

  renderMap("r1-mobile-map", ".r1-flow-svg", [
    { title: "Recorrido común", items: [{ node: "start" }, { node: "input", edge: "start-input" }, { node: "decision", edge: "input-decision", labels: [
      { text: "SÍ · indicó ambos datos", attributes: { "data-branch": "yes" } },
      { text: "NO · faltan datos", attributes: { "data-branch": "no" } }
    ] }] },
    { title: "SÍ · indicó ambos datos", items: [
      { node: "search", edge: "yes-search" },
      { node: "results-decision", edge: "search-decision", labels: [
        { text: "SÍ · hay profesionales", attributes: { "data-result": "yes" } },
        { text: "NO · sin resultados", attributes: { "data-result": "no" } }
      ] }
    ] },
    { title: "SÍ · resultados disponibles", items: [{ node: "show", edge: "results-yes-show" }, { node: "end-yes", edge: "show-end-yes" }] },
    { title: "NO · sin resultados", items: [
      { node: "human-review", edge: "results-no-review", design: true },
      { node: "inform-next", edge: "review-inform", design: true },
      { node: "end-human", edge: "inform-end-human" }
    ] },
    { title: "NO · faltan datos", items: [
      { node: "missing", edge: "no-missing", design: true },
      { node: "request", edge: "missing-request", design: true },
      { node: "wait", edge: "request-wait", design: true },
      { node: "end-no", edge: "wait-end-no" }
    ] }
  ]);

  renderMap("r2-mobile-map", ".r2-flow-svg", [
    { title: "Revisión inicial", items: [
      { node: "start" }, { node: "evaluation", edge: "start-evaluation" },
      { node: "data-quality", edge: "evaluation-data-quality", labels: [
        { text: "SÍ · datos dudosos", attributes: { "data-quality": "yes" } },
        { text: "NO · continuar", attributes: { "data-quality": "no" } }
      ] }
    ] },
    { title: "SÍ · dato desactualizado o dudoso", items: [
      { node: "data-update", edge: "quality-yes-update", design: true },
      { node: "human-review-r2", edge: "update-human", design: true },
      { node: "person-confirm", edge: "human-person", design: true },
      { node: "evaluation", edge: "person-recheck-evaluation" }
    ] },
    { title: "Evaluar las cuatro condiciones (todas deben ser Sí)", items: [
      { node: "service", edge: "data-quality-no-service", labels: [
        { text: "SÍ · pasa a la siguiente", attributes: { "data-condition": "service", "data-answer": "yes" } },
        { text: "NO · se registra y pasa a la siguiente", attributes: { "data-condition": "service", "data-answer": "no" } }
      ] },
      { node: "zone", edge: "service-merge-zone", labels: [
        { text: "SÍ · pasa a la siguiente", attributes: { "data-condition": "zone", "data-answer": "yes" } },
        { text: "NO · se registra y pasa a la siguiente", attributes: { "data-condition": "zone", "data-answer": "no" } }
      ] },
      { node: "availability", edge: "zone-merge-availability", labels: [
        { text: "SÍ · pasa a la siguiente", attributes: { "data-condition": "availability", "data-answer": "yes" } },
        { text: "NO · se registra y pasa a la siguiente", attributes: { "data-condition": "availability", "data-answer": "no" } }
      ] },
      { node: "verified", edge: "availability-merge-verification", labels: [
        { text: "SÍ · pasa a la siguiente", attributes: { "data-condition": "verified", "data-answer": "yes" } },
        { text: "NO · se registra y pasa a la siguiente", attributes: { "data-condition": "verified", "data-answer": "no" } }
      ] },
      { node: "conjunction", edge: "verification-merge-conjunction" }
    ] },
    { title: "Resultado: todas Sí", items: [
      { node: "outcome-yes", edge: "final-yes", labels: [{ text: "TODAS SÍ", attributes: { "data-result": "yes" } }] },
      { node: "end-yes", edge: "result-yes-end" }
    ] },
    { title: "Resultado: alguna condición No", items: [
      { node: "outcome-no", edge: "final-no", labels: [{ text: "ALGUNA NO", attributes: { "data-result": "no" } }] },
      { node: "end-no", edge: "result-no-end" }
    ] }
  ]);
})();
