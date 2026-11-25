(() => {
  const definition = window.tp3Flows?.r2;
  const svg = document.querySelector(".r2-flow-svg");
  if (!definition || !svg) return;

  const elements = {
    count: document.querySelector("#r2-step-count"),
    title: document.querySelector("#r2-step-title"),
    explanation: document.querySelector("#r2-step-explanation"),
    decisionControls: document.querySelector("#r2-decision-controls"),
    decisionPrompt: document.querySelector("#r2-decision-prompt"),
    yes: document.querySelector("#r2-choice-yes"),
    no: document.querySelector("#r2-choice-no"),
    previous: document.querySelector("#r2-previous"),
    start: document.querySelector("#r2-start"),
    next: document.querySelector("#r2-next"),
    reset: document.querySelector("#r2-reset"),
    summary: [...document.querySelectorAll("[data-r2-answer]")]
  };

  if (Object.values(elements).some((element) => element == null)) return;

  const mobileMap = document.querySelector("#r2-mobile-map");
  const nodes = [...svg.querySelectorAll("[data-flow-node]"), ...(mobileMap?.querySelectorAll("[data-flow-node]") ?? [])];
  const edges = [...svg.querySelectorAll("[data-flow-edge]"), ...(mobileMap?.querySelectorAll("[data-flow-edge]") ?? [])];
  const conditionLabels = [...svg.querySelectorAll(".branch-label[data-condition]"), ...(mobileMap?.querySelectorAll(".branch-label[data-condition]") ?? [])];
  const resultLabels = [...svg.querySelectorAll(".branch-label[data-result]"), ...(mobileMap?.querySelectorAll(".branch-label[data-result]") ?? [])];
  const qualityLabels = [...svg.querySelectorAll(".branch-label[data-quality]"), ...(mobileMap?.querySelectorAll(".branch-label[data-quality]") ?? [])];
  const reviewRouteLabels = [...svg.querySelectorAll(".branch-label[data-review-route]"), ...(mobileMap?.querySelectorAll(".branch-label[data-review-route]") ?? [])];
  const reviewNodeKeys = ["data-update", "human-review-r2", "person-confirm"];
  const reviewEdgeKeys = ["quality-yes-update", "update-human", "human-person", "person-recheck-evaluation"];
  const state = {
    started: false,
    index: 0,
    dataQuality: null,
    reviewResolved: false,
    answers: Object.fromEntries(definition.conditionOrder.map((key) => [key, null]))
  };

  const getSteps = () => definition.steps.filter((step) => (
    state.dataQuality === true
    || !["data-update", "human-review", "person-confirm", "recheck"].includes(step.key)
  )).map((step) => (
    state.dataQuality === true && step.key === "service"
      ? { ...step, edge: "reviewed-data-service" }
      : step
  ));

  const getResult = () => {
    const answers = definition.conditionOrder.map((key) => state.answers[key]);
    if (answers.some((answer) => answer === null)) return null;
    return answers.every((answer) => answer === true);
  };

  const setUnavailable = (button, unavailable) => {
    button.setAttribute("aria-disabled", String(unavailable));
    button.disabled = unavailable;
    button.classList.toggle("is-unavailable", unavailable);
  };

  const focusStepControl = () => {
    const step = state.started ? getSteps()[state.index] : null;
    const decisionPending = step && (step.key === "data-quality" || Boolean(step.condition))
      && (step.key === "data-quality" ? state.dataQuality === null : state.answers[step.condition] === null);
    if (!state.started) elements.start.focus();
    else if (decisionPending) elements.yes.focus();
    else if (!elements.next.disabled) elements.next.focus();
    else if (!elements.previous.disabled) elements.previous.focus();
    else elements.start.focus();
  };

  const clearDiagram = () => {
    const states = ["is-path", "is-current", "is-visited", "is-muted", "is-traversed"];
    for (const element of [...nodes, ...edges, ...conditionLabels, ...resultLabels, ...qualityLabels, ...reviewRouteLabels]) {
      element.classList.remove(...states);
    }
  };

  const markEdge = (key, stateName = "is-path") => {
    edges.filter((item) => item.getAttribute("data-flow-edge") === key).forEach((item) => item.classList.add(stateName));
  };

  const markNode = (key, stateName = "is-path") => {
    nodes.filter((item) => item.getAttribute("data-flow-node") === key).forEach((item) => item.classList.add(stateName));
  };

  const markEdges = (key, stateName) => {
    edges.filter((item) => item.getAttribute("data-flow-edge") === key).forEach((item) => item.classList.add(stateName));
  };

  const renderDiagram = (steps) => {
    clearDiagram();
    if (!state.started) return;

    const currentStep = steps[state.index];
    for (let index = 0; index <= state.index; index += 1) {
      const step = steps[index];
      if (step.node) markNode(step.node, index === state.index ? "is-current" : "is-visited");
      if (index > 0 && step.edge) markEdge(step.edge, "is-traversed");
    }

    if (state.dataQuality === true) {
      for (const key of reviewNodeKeys) markNode(key);
      for (const key of reviewEdgeKeys) markEdge(key);
      markEdges("data-quality-no-service", "is-muted");
      if (state.reviewResolved) {
        markEdge("reviewed-data-service");
        reviewRouteLabels.forEach((label) => label.classList.add("is-path"));
      } else {
        markEdges("reviewed-data-service", "is-muted");
        reviewRouteLabels.forEach((label) => label.classList.add("is-muted"));
      }
      for (const label of qualityLabels) {
        const answer = label.getAttribute("data-quality");
        if (answer === "yes") label.classList.add("is-path");
        else label.classList.add("is-muted");
      }
    } else if (state.dataQuality === false) {
      markEdge("data-quality-no-service");
      markEdges("reviewed-data-service", "is-muted");
      for (const key of reviewNodeKeys) markNode(key, "is-muted");
      for (const key of reviewEdgeKeys) markEdge(key, "is-muted");
      reviewRouteLabels.forEach((label) => label.classList.add("is-muted"));
      for (const label of qualityLabels) {
        label.classList.toggle("is-path", label.getAttribute("data-quality") === "no");
        label.classList.toggle("is-muted", label.getAttribute("data-quality") !== "no");
      }
    }

    const conditionStepIndexes = Object.fromEntries(definition.conditionOrder.map((key) => [
      key,
      steps.findIndex((step) => step.condition === key)
    ]));

    for (const condition of definition.conditionOrder) {
      const answer = state.answers[condition];
      if (answer === null) continue;
      const chosen = answer ? "yes" : "no";
      const alternative = answer ? "no" : "yes";
      const edgeKeys = definition.conditionEdges[condition];
      markEdge(edgeKeys[chosen]);
      markEdges(edgeKeys[alternative], "is-muted");

      for (const label of conditionLabels) {
        if (label.getAttribute("data-condition") !== condition) continue;
        label.classList.toggle("is-path", label.getAttribute("data-answer") === chosen);
        label.classList.toggle("is-muted", label.getAttribute("data-answer") !== chosen);
      }

      if (state.index > conditionStepIndexes[condition]) markEdge(edgeKeys[chosen], "is-traversed");
    }

    const mergeTargets = { zone: "zone", availability: "availability", verified: "verified", conjunction: "conjunction" };
    for (const [target, stepKey] of Object.entries(mergeTargets)) {
      const stepIndex = steps.findIndex((step) => step.key === stepKey);
      if (stepIndex >= 0 && state.index >= stepIndex) markEdge(definition.mergeEdges[target], "is-traversed");
    }

    const result = getResult();
    const conjunctionIndex = steps.findIndex((step) => step.key === "conjunction");
    const outcomeIndex = steps.findIndex((step) => step.key === "outcome");
    const endIndex = steps.findIndex((step) => step.key === "end");
    if (result !== null && state.index >= conjunctionIndex) {
      const selected = result ? "yes" : "no";
      const alternative = result ? "no" : "yes";
      for (const key of definition.resultEdges[selected]) markEdge(key);
      for (const key of definition.resultEdges[alternative]) markEdge(key, "is-muted");
      for (const key of definition.resultNodes[selected]) markNode(key);
      for (const key of definition.resultNodes[alternative]) markNode(key, "is-muted");
      for (const label of resultLabels) {
        label.classList.toggle("is-path", label.getAttribute("data-result") === selected);
        label.classList.toggle("is-muted", label.getAttribute("data-result") !== selected);
      }

      if (state.index >= outcomeIndex) {
        markNode(`outcome-${selected}`, state.index === outcomeIndex ? "is-current" : "is-visited");
        markEdge(result ? "final-yes" : "final-no", "is-traversed");
      }
      if (state.index >= endIndex) {
        markNode(`end-${selected}`, "is-current");
        markEdge(result ? "result-yes-end" : "result-no-end", "is-traversed");
      }
    }

    if (currentStep.condition) markNode(currentStep.node, "is-current");
  };

  const getPresentation = (step) => {
    const result = getResult();

    if (step.key === "conjunction") {
      const failed = definition.conditionOrder.filter((key) => state.answers[key] === false);
      if (failed.length === 0) {
        return {
          title: "Conjunción verdadera",
          explanation: "Servicio ∧ zona ∧ disponibilidad ∧ verificación: las cuatro respuestas son Sí. El futuro agente puede mostrar al profesional como opción."
        };
      }
      const labels = failed.map((key) => definition.conditionLabels[key]).join(", ");
      return {
        title: "Conjunción falsa",
        explanation: `Respondieron No: ${labels}. Basta con una condición falsa para que el agente no presente al profesional como opción elegible.`
      };
    }

    if (step.key === "outcome") {
      return result
        ? {
            title: "Mostrar como opción elegible",
            explanation: "Las cuatro condiciones se cumplieron. El futuro agente muestra al profesional como opción para el cliente."
          }
        : {
            title: "No mostrar como opción elegible",
            explanation: "Una o más condiciones no se cumplieron. El futuro agente informa conceptualmente que el profesional no reúne todos los requisitos."
          };
    }

    if (step.key === "end") {
      return result
        ? {
            title: "Fin · profesional elegible",
            explanation: "Recorrido positivo: el agente confirmó servicio, zona, disponibilidad y verificación."
          }
        : {
            title: "Fin · no elegible",
            explanation: "Recorrido negativo: al menos una condición fue No, por lo que el agente no presenta al profesional como opción elegible."
          };
    }

    if (step.condition && state.answers[step.condition] !== null) {
      const answer = state.answers[step.condition] ? "Sí" : "No";
      const continuation = state.answers[step.condition]
        ? "La evaluación continúa con la condición siguiente."
        : "La evaluación continúa para revisar las demás condiciones y calcular la conjunción completa.";
      return { title: step.title, explanation: `Respuesta seleccionada: ${answer}. ${continuation}` };
    }

    return { title: step.title, explanation: step.explanation };
  };

  const render = () => {
    const steps = getSteps();
    const step = steps[state.index];
    const isCondition = Boolean(step.condition);
    const isQualityDecision = step.key === "data-quality";
    const isDecision = isCondition || isQualityDecision;
    const answered = isQualityDecision
      ? state.dataQuality !== null
      : isCondition && state.answers[step.condition] !== null;
    const result = getResult();
    const isAtEnd = state.index === steps.length - 1;
    const isUnavailable = !state.started
      || (isDecision && !answered)
      || (step.key === "conjunction" && result === null)
      || isAtEnd;

    elements.start.hidden = state.started;
    elements.next.hidden = !state.started;
    elements.decisionControls.hidden = !isDecision;
    elements.decisionPrompt.textContent = isQualityDecision
      ? "¿Hay datos desactualizados o dudosos?"
      : isCondition
        ? `¿Se cumple la condición de ${definition.conditionLabels[step.condition]}?`
        : "Elegí Sí o No para la condición activa.";
    elements.yes.setAttribute("aria-pressed", String(isQualityDecision
      ? state.dataQuality === true
      : isCondition && state.answers[step.condition] === true));
    elements.no.setAttribute("aria-pressed", String(isQualityDecision
      ? state.dataQuality === false
      : isCondition && state.answers[step.condition] === false));
    setUnavailable(elements.previous, !state.started || state.index === 0);
    setUnavailable(elements.next, isUnavailable);

    for (const item of elements.summary) {
      const condition = item.getAttribute("data-r2-answer");
      const answer = state.answers[condition];
      item.textContent = answer === null ? "Sin responder" : answer ? "Sí" : "No";
      item.classList.toggle("answer-yes", answer === true);
      item.classList.toggle("answer-no", answer === false);
      item.classList.toggle("answer-pending", answer === null);
    }

    if (!state.started) {
      elements.count.textContent = "Recorrido sin iniciar";
      elements.title.textContent = "Preparado para evaluar";
      elements.explanation.textContent = "Iniciá, revisá los datos y respondé las cuatro condiciones. Solo cuatro respuestas Sí producen el resultado elegible.";
    } else {
      const presentation = getPresentation(step);
      elements.count.textContent = isDecision && !answered
        ? `Paso ${state.index + 1} · decisión`
        : `Paso ${state.index + 1} de ${steps.length}`;
      elements.title.textContent = presentation.title;
      elements.explanation.textContent = presentation.explanation;
    }

    renderDiagram(steps);
  };

  elements.start.addEventListener("click", () => {
    state.started = true;
    state.index = 0;
    state.dataQuality = null;
    state.reviewResolved = false;
    render();
    focusStepControl();
  });

  const selectAnswer = (answer) => {
    const step = getSteps()[state.index];
    if (step.key === "data-quality") {
      state.dataQuality = answer === "yes";
      state.reviewResolved = false;
      const targetKey = state.dataQuality ? "data-update" : "service";
      state.index = getSteps().findIndex((item) => item.key === targetKey);
      render();
      focusStepControl();
      return;
    }

    const condition = step.condition;
    if (!condition) return;
    state.answers[condition] = answer === "yes";
    render();
    focusStepControl();
  };

  elements.yes.addEventListener("click", () => selectAnswer("yes"));
  elements.no.addEventListener("click", () => selectAnswer("no"));

  elements.previous.addEventListener("click", () => {
    if (elements.previous.getAttribute("aria-disabled") === "true") return;
    state.index -= 1;
    render();
    focusStepControl();
  });

  elements.next.addEventListener("click", () => {
    if (elements.next.getAttribute("aria-disabled") === "true") return;
    if (getSteps()[state.index]?.key === "person-confirm") state.reviewResolved = true;
    state.index += 1;
    render();
    focusStepControl();
  });

  elements.reset.addEventListener("click", () => {
    state.started = false;
    state.index = 0;
    state.dataQuality = null;
    state.reviewResolved = false;
    for (const condition of definition.conditionOrder) state.answers[condition] = null;
    render();
    focusStepControl();
  });

  render();
})();
