(() => {
  const definition = window.tp3Flows?.r1;
  const svg = document.querySelector(".r1-flow-svg");
  if (!definition || !svg) return;

  const elements = {
    count: document.querySelector("#r1-step-count"),
    title: document.querySelector("#r1-step-title"),
    explanation: document.querySelector("#r1-step-explanation"),
    decisionControls: document.querySelector("#r1-decision-controls"),
    decisionPrompt: document.querySelector("#r1-decision-prompt"),
    yes: document.querySelector("#r1-choice-yes"),
    no: document.querySelector("#r1-choice-no"),
    previous: document.querySelector("#r1-previous"),
    start: document.querySelector("#r1-start"),
    next: document.querySelector("#r1-next"),
    reset: document.querySelector("#r1-reset")
  };

  if (Object.values(elements).some((element) => !element)) return;

  const nodes = [...svg.querySelectorAll("[data-flow-node]")];
  const edges = [...svg.querySelectorAll("[data-flow-edge]")];
  const branchLabels = [...svg.querySelectorAll(".branch-label[data-branch], .branch-label[data-result]")];
  const state = { started: false, index: 0, branch: null, resultBranch: null };

  const getSteps = () => {
    if (!state.branch) return definition.commonSteps;

    const primary = definition.branches[state.branch];
    if (state.branch !== "yes" || !state.resultBranch) {
      return [...definition.commonSteps, ...primary.steps];
    }

    return [
      ...definition.commonSteps,
      ...primary.steps,
      ...definition.resultBranches[state.resultBranch].steps
    ];
  };

  const setUnavailable = (button, unavailable) => {
    button.setAttribute("aria-disabled", String(unavailable));
    button.classList.toggle("is-unavailable", unavailable);
  };

  const renderDiagram = (steps) => {
    const visualStates = ["is-path", "is-visited", "is-current", "is-muted", "is-traversed"];
    for (const node of nodes) node.classList.remove(...visualStates);
    for (const edge of edges) edge.classList.remove(...visualStates);
    for (const label of branchLabels) label.classList.remove("is-muted", "is-path");

    if (!state.started) return;

    const sharedNodes = definition.commonSteps.map((step) => step.node);
    const sharedEdges = definition.commonSteps.map((step) => step.edge).filter(Boolean);
    const primary = state.branch ? definition.branches[state.branch] : null;
    const selectedResult = state.branch === "yes" && state.resultBranch
      ? definition.resultBranches[state.resultBranch]
      : null;
    const inactivePrimary = state.branch
      ? definition.branches[state.branch === "yes" ? "no" : "yes"]
      : null;
    const inactiveResults = state.branch === "yes" && state.resultBranch
      ? definition.resultBranches[state.resultBranch === "yes" ? "no" : "yes"]
      : null;
    const inactiveResultTrees = state.branch === "no"
      ? Object.values(definition.resultBranches)
      : [];
    const selectedNodes = [
      ...sharedNodes,
      ...(primary?.nodes ?? []),
      ...(selectedResult?.nodes ?? [])
    ];
    const selectedEdges = [
      ...sharedEdges,
      ...(primary?.edges ?? []),
      ...(selectedResult?.edges ?? [])
    ];
    const inactiveNodes = [
      ...(inactivePrimary?.nodes ?? []),
      ...(inactiveResults?.nodes ?? []),
      ...inactiveResultTrees.flatMap((branch) => branch.nodes)
    ];
    const inactiveEdges = [
      ...(inactivePrimary?.edges ?? []),
      ...(inactiveResults?.edges ?? []),
      ...inactiveResultTrees.flatMap((branch) => branch.edges)
    ];

    for (const node of nodes) {
      const key = node.getAttribute("data-flow-node");
      if (selectedNodes.includes(key)) node.classList.add("is-path");
      if (inactiveNodes.includes(key)) node.classList.add("is-muted");
    }

    for (const edge of edges) {
      const key = edge.getAttribute("data-flow-edge");
      if (selectedEdges.includes(key)) edge.classList.add("is-path");
      if (inactiveEdges.includes(key)) edge.classList.add("is-muted");
    }

    for (const label of branchLabels) {
      const primaryLabel = label.getAttribute("data-branch");
      const resultLabel = label.getAttribute("data-result");
      if (state.branch && primaryLabel && primaryLabel !== state.branch) label.classList.add("is-muted");
      if (state.resultBranch && resultLabel) {
        if (resultLabel === state.resultBranch) label.classList.add("is-path");
        else label.classList.add("is-muted");
      } else if (state.branch === "no" && resultLabel) {
        label.classList.add("is-muted");
      }
    }

    const activeStep = steps[state.index];
    const activeNode = nodes.find((node) => node.getAttribute("data-flow-node") === activeStep.node);
    activeNode?.classList.add("is-current");

    for (let index = 0; index < state.index; index += 1) {
      const visitedNode = nodes.find((node) => node.getAttribute("data-flow-node") === steps[index].node);
      visitedNode?.classList.add("is-visited");
      if (steps[index + 1]?.edge) {
        const traversedEdge = edges.find((edge) => edge.getAttribute("data-flow-edge") === steps[index + 1].edge);
        traversedEdge?.classList.add("is-traversed");
      }
    }
  };

  const render = () => {
    const steps = getSteps();
    const activeStep = state.started ? steps[state.index] : null;
    const atPrimaryDecision = state.started && activeStep?.key === "decision";
    const atResultsDecision = state.started && activeStep?.key === "results-decision";
    const atDecision = atPrimaryDecision || atResultsDecision;
    const decisionAnswered = atPrimaryDecision
      ? state.branch !== null
      : atResultsDecision && state.resultBranch !== null;
    const atEnd = state.started && state.index === steps.length - 1;

    elements.start.hidden = state.started;
    elements.next.hidden = !state.started;
    elements.decisionControls.hidden = !atDecision;
    elements.decisionPrompt.textContent = atResultsDecision
      ? "Elegí si hay profesionales que cubran el servicio y la zona:"
      : "Elegí si el cliente indicó ambos datos:";
    elements.yes.textContent = atResultsDecision ? "Sí, hay profesionales" : "Sí, indicó ambos datos";
    elements.no.textContent = atResultsDecision ? "No, sin resultados" : "No, falta información";
    elements.yes.setAttribute("aria-pressed", String(atPrimaryDecision && state.branch === "yes"
      || atResultsDecision && state.resultBranch === "yes"));
    elements.no.setAttribute("aria-pressed", String(atPrimaryDecision && state.branch === "no"
      || atResultsDecision && state.resultBranch === "no"));
    setUnavailable(elements.previous, !state.started || state.index === 0);
    setUnavailable(elements.next, !state.started || (atDecision && !decisionAnswered) || atEnd);

    if (!state.started) {
      elements.count.textContent = "Recorrido sin iniciar";
      elements.title.textContent = "Preparado para comenzar";
      elements.explanation.textContent = "Iniciá el recorrido para ver cada paso. En las decisiones podrás seleccionar Sí o No.";
    } else {
      const countText = atDecision && !decisionAnswered
        ? `Paso ${state.index + 1} · decisión`
        : `Paso ${state.index + 1} de ${steps.length}`;
      elements.count.textContent = countText;
      elements.title.textContent = activeStep.title;
      elements.explanation.textContent = activeStep.explanation;
    }

    renderDiagram(steps);
  };

  elements.start.addEventListener("click", () => {
    state.started = true;
    state.index = 0;
    state.branch = null;
    state.resultBranch = null;
    render();
    elements.next.focus();
  });

  const selectAnswer = (answer) => {
    const activeStep = getSteps()[state.index];
    if (activeStep?.key === "decision") {
      state.branch = answer;
      state.resultBranch = null;
      state.index = definition.commonSteps.length;
    } else if (activeStep?.key === "results-decision") {
      state.resultBranch = answer;
      state.index = definition.commonSteps.length
        + definition.branches.yes.steps.length;
    } else {
      return;
    }

    render();
    elements.next.focus();
  };

  elements.yes.addEventListener("click", () => selectAnswer("yes"));
  elements.no.addEventListener("click", () => selectAnswer("no"));

  elements.previous.addEventListener("click", () => {
    if (elements.previous.getAttribute("aria-disabled") === "true") return;
    state.index -= 1;
    render();
  });

  elements.next.addEventListener("click", () => {
    if (elements.next.getAttribute("aria-disabled") === "true") return;
    state.index += 1;
    render();
  });

  elements.reset.addEventListener("click", () => {
    state.started = false;
    state.index = 0;
    state.branch = null;
    state.resultBranch = null;
    render();
  });

  render();
})();
