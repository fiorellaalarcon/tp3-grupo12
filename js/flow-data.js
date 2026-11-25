window.tp3Flows = {
  r1: {
    commonSteps: [
      {
        key: "start",
        node: "start",
        title: "Inicio",
        explanation: "El futuro agente de NEXO recibe una solicitud de servicio del cliente."
      },
      {
        key: "input",
        node: "input",
        edge: "start-input",
        title: "Ingreso de los datos",
        explanation: "El agente identifica los dos datos necesarios para R1: tipo de servicio solicitado y ubicación del cliente."
      },
      {
        key: "decision",
        node: "decision",
        edge: "input-decision",
        title: "Decisión: ¿indicó ambos datos?",
        explanation: "El futuro agente verifica si la solicitud incluye el tipo de servicio y la ubicación antes de buscar. Elegí Sí o No para recorrer cada caso."
      }
    ],
    branches: {
      yes: {
        label: "Sí",
        nodes: ["search", "results-decision"],
        edges: ["yes-search", "search-decision"],
        steps: [
          {
            key: "search",
            node: "search",
            edge: "yes-search",
            title: "Buscar por servicio y zona",
            explanation: "Con ambos datos presentes, el futuro agente de NEXO busca profesionales que cubran esa necesidad y zona, tal como establece la sentencia."
          },
          {
            key: "results-decision",
            node: "results-decision",
            edge: "search-decision",
            title: "Decisión: ¿hay profesionales que cubran el servicio y la zona?",
            explanation: "El futuro agente revisa el resultado de la búsqueda y verifica si hay profesionales que cubran ambos criterios. Elegí Sí o No para recorrer cada caso."
          }
        ]
      },
      no: {
        label: "No",
        nodes: ["missing", "request", "wait", "end-no"],
        edges: ["no-missing", "missing-request", "request-wait", "wait-end-no"],
        steps: [
          {
            key: "missing",
            node: "missing",
            edge: "no-missing",
            title: "Identificar los datos faltantes",
            explanation: "El agente identifica si falta el tipo de servicio, la ubicación o ambos datos. Este tratamiento de entradas incompletas es una decisión de diseño."
          },
          {
            key: "request",
            node: "request",
            edge: "missing-request",
            title: "Solicitar la información faltante",
            explanation: "El agente solicita al cliente completar solo los datos que faltan. Esta acción es una decisión de diseño; no está especificada en la sentencia original."
          },
          {
            key: "wait",
            node: "wait",
            edge: "request-wait",
            title: "Esperar la respuesta",
            explanation: "El agente espera la respuesta del cliente. Cuando se complete la información, puede continuar con ambos datos."
          },
          {
            key: "end-no",
            node: "end-no",
            edge: "wait-end-no",
            title: "Fin provisional: en espera",
            explanation: "La rama termina provisionalmente mientras el agente espera la respuesta. La búsqueda de R1 no se realiza hasta contar con tipo de servicio y ubicación."
          }
        ]
      }
    },
    resultBranches: {
      yes: {
        label: "Sí, hay profesionales",
        nodes: ["show", "end-yes"],
        edges: ["results-yes-show", "show-end-yes"],
        steps: [
          {
            key: "show",
            node: "show",
            edge: "results-yes-show",
            title: "Mostrar los resultados",
            explanation: "El futuro agente presenta al cliente los profesionales encontrados que cubren el servicio y la zona."
          },
          {
            key: "end-yes",
            node: "end-yes",
            edge: "show-end-yes",
            title: "Fin: resultados presentados",
            explanation: "Termina la rama afirmativa: el agente encontró profesionales que cubren servicio y zona y los presentó al cliente."
          }
        ]
      },
      no: {
        label: "No hay resultados",
        nodes: ["human-review", "inform-next", "end-human"],
        edges: ["results-no-review", "review-inform", "inform-end-human"],
        steps: [
          {
            key: "human-review",
            node: "human-review",
            edge: "results-no-review",
            title: "Derivar a revisión humana",
            explanation: "Como decisión de diseño del grupo, el futuro agente deriva el caso a una persona porque la búsqueda no encontró profesionales para ese servicio y zona. Esta acción no está en la sentencia."
          },
          {
            key: "inform-next",
            node: "inform-next",
            edge: "review-inform",
            title: "Informar al cliente el siguiente paso",
            explanation: "La persona revisa el caso y define qué siguiente paso corresponde informar al cliente. Es una decisión de diseño del grupo que no está en la sentencia."
          },
          {
            key: "end-human",
            node: "end-human",
            edge: "inform-end-human",
            title: "Fin: revisión humana",
            explanation: "El recorrido termina después de derivar el caso y comunicar al cliente el siguiente paso definido en la revisión humana."
          }
        ]
      }
    }
  },
  r2: {
    conditionOrder: ["service", "zone", "availability", "verified"],
    conditionLabels: {
      service: "coincidencia con el servicio",
      zone: "coincidencia con la zona",
      availability: "disponibilidad",
      verified: "verificación"
    },
    conditionNodes: {
      service: "service",
      zone: "zone",
      availability: "availability",
      verified: "verified"
    },
    conditionEdges: {
      service: { yes: "service-yes", no: "service-no" },
      zone: { yes: "zone-yes", no: "zone-no" },
      availability: { yes: "availability-yes", no: "availability-no" },
      verified: { yes: "verification-yes", no: "verification-no" }
    },
    mergeEdges: {
      zone: "service-merge-zone",
      availability: "zone-merge-availability",
      verified: "availability-merge-verification",
      conjunction: "verification-merge-conjunction"
    },
    resultEdges: {
      yes: ["final-yes", "result-yes-end"],
      no: ["final-no", "result-no-end"]
    },
    resultNodes: {
      yes: ["outcome-yes", "end-yes"],
      no: ["outcome-no", "end-no"]
    },
    steps: [
      {
        key: "start",
        node: "start",
        title: "Inicio",
        explanation: "El futuro agente de NEXO recibe los datos del profesional y la solicitud de servicio del cliente."
      },
      {
        key: "evaluation",
        node: "evaluation",
        edge: "start-evaluation",
        title: "Evaluación del profesional",
        explanation: "El agente consulta servicio, cobertura, disponibilidad y verificación del profesional antes de continuar con la evaluación."
      },
      {
        key: "data-quality",
        node: "data-quality",
        edge: "evaluation-data-quality",
        title: "Decisión: ¿hay datos desactualizados o dudosos?",
        explanation: "Antes de evaluar las cuatro condiciones, el agente revisa si los datos consultados están desactualizados o son dudosos. Esta verificación previa es una decisión del grupo que no está en la sentencia. Respondé Sí o No."
      },
      {
        key: "data-update",
        node: "data-update",
        edge: "quality-yes-update",
        title: "Solicitar actualización del dato",
        explanation: "Como decisión del grupo que no está en la sentencia, el agente solicita actualizar el dato desactualizado o dudoso."
      },
      {
        key: "human-review",
        node: "human-review-r2",
        edge: "update-human",
        title: "Derivar a revisión humana",
        explanation: "Como decisión del grupo que no está en la sentencia, el agente deriva los datos a una persona para su revisión."
      },
      {
        key: "person-confirm",
        node: "person-confirm",
        edge: "human-person",
        title: "Una persona confirma o corrige",
        explanation: "Una persona confirma o corrige la información. Este paso de intervención humana es una decisión del grupo que no está en la sentencia."
      },
      {
        key: "recheck",
        node: "evaluation",
        edge: "person-recheck-evaluation",
        title: "Volver a evaluar al profesional",
        explanation: "Después de la confirmación o corrección humana, el agente vuelve a evaluar al profesional con los datos actualizados."
      },
      {
        key: "service",
        node: "service",
        edge: "data-quality-no-service",
        condition: "service",
        title: "Coincidencia con el servicio",
        explanation: "El agente compara el servicio solicitado por el cliente con el que ofrece el profesional. Respondé Sí o No según la coincidencia."
      },
      {
        key: "zone",
        node: "zone",
        edge: "service-merge-zone",
        condition: "zone",
        title: "Coincidencia con la zona",
        explanation: "El agente compara la zona del cliente con la cobertura del profesional. Respondé Sí o No según la coincidencia."
      },
      {
        key: "availability",
        node: "availability",
        edge: "zone-merge-availability",
        condition: "availability",
        title: "Disponibilidad",
        explanation: "El agente consulta conceptualmente si el profesional tiene disponibilidad para atender. Respondé Sí o No."
      },
      {
        key: "verified",
        node: "verified",
        edge: "availability-merge-verification",
        condition: "verified",
        title: "Verificación",
        explanation: "El agente comprueba conceptualmente si el profesional está verificado. Respondé Sí o No."
      },
      {
        key: "conjunction",
        node: "conjunction",
        edge: "verification-merge-conjunction",
        title: "Evaluación de la conjunción",
        explanation: "El agente evalúa servicio ∧ zona ∧ disponibilidad ∧ verificación. Las cuatro condiciones deben ser verdaderas."
      },
      {
        key: "outcome",
        node: null,
        title: null,
        explanation: null
      },
      {
        key: "end",
        node: null,
        title: null,
        explanation: null
      }
    ]
  }
};
