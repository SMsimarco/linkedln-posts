const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'validate_editorial_node.js'), 'utf8');
const runNode = new Function('$input', '$', source);

const brief = {
  lote_id: 'local-test-batch',
  fuentes: [
    { id: 'F1', tipo: 'declaracion_personal_confirmada', hecho: 'Construyo automatizaciones con n8n.', origen: 'Fixture de prueba' },
    { id: 'F2', tipo: 'declaracion_personal_confirmada', hecho: 'Opero workflows propios con Docker Compose.', origen: 'Fixture de prueba' },
  ],
};

function makePost(sourceId, fact, opinion) {
  const questions = Array.from({ length: 8 }, (_, index) =>
    `¿Qué comprobación ${index + 1} conviene hacer antes de cambiar un proceso automatizado?`,
  );
  const opinionId = `${sourceId}-O1`;
  return {
    tema: `Prueba ${sourceId}`,
    texto: [fact, opinion, ...questions].join('\n\n'),
    fuentes: [sourceId],
    afirmaciones: [
      { id: `${sourceId}-F1`, afirmacion: fact, tipo: 'hecho', fuente_ids: [sourceId], estado: 'respaldada', requiere_revision_humana: false },
      { id: opinionId, afirmacion: opinion, tipo: 'opinion', fuente_ids: [], estado: 'pendiente_revision_humana', requiere_revision_humana: true, motivo_revision: 'Confirmar que expresa la postura deseada.' },
    ],
    pendientes: [{ afirmacion_id: opinionId, motivo: 'Confirmar que expresa la postura deseada.' }],
    tipo_contenido: 'educativo',
    idea_visual: `Esquema conceptual de la prueba ${sourceId}, sin datos ni resultados reales.`,
  };
}

const posts = [
  makePost('F1', 'Construyo automatizaciones con n8n.', 'Mi hipótesis es que revisar el flujo antes de operarlo reduce sorpresas.'),
  makePost('F2', 'Opero workflows propios con Docker Compose.', 'Mi opinión es que documentar cambios ayuda a revisar el proceso.'),
];

function invoke(publicaciones = posts, history = []) {
  const response = { stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify({ publicaciones }) }] };
  const input = { all: () => [{ json: response }] };
  const helpers = (name) => {
    if (name === 'Brief editorial - editar fuentes') return { first: () => ({ json: brief }) };
    if (name === 'Leer historial editorial') return { all: () => history.map((json) => ({ json })) };
    throw new Error(`Unexpected n8n helper: ${name}`);
  };
  return runNode(input, helpers);
}

const result = invoke();
assert.equal(result.length, 2);
assert.deepEqual(result.map((item) => item.json.estado), ['PENDIENTE_REVISION', 'PENDIENTE_REVISION']);
assert.deepEqual(result.map((item) => item.json.pieza_id), ['local-test-batch-1', 'local-test-batch-2']);
assert.equal(JSON.parse(result[0].json.evidencia_json).schema_version, 2);
assert.equal(JSON.parse(result[0].json.evidencia_json).afirmaciones[1].tipo, 'opinion');

const unsupported = structuredClone(posts);
unsupported[0].texto = unsupported[0].texto.replace('Construyo automatizaciones con n8n.', 'Construyo agentes autónomos en producción.');
unsupported[0].afirmaciones[0].afirmacion = 'Construyo agentes autónomos en producción.';
assert.throws(() => invoke(unsupported), /no aparece literalmente en una fuente declarada/);

const unclassified = structuredClone(posts);
unclassified[0].texto += '\n\nEl workflow ya produce resultados confiables.';
assert.throws(() => invoke(unclassified), /Oración declarativa sin clasificación y trazabilidad/);

const missingReview = structuredClone(posts);
missingReview[0].pendientes = [];
assert.throws(() => invoke(missingReview), /requiere revisión pero no tiene pendiente asociado/);

const unsupportedExplanation = structuredClone(posts);
unsupportedExplanation[0].afirmaciones[1] = {
  ...unsupportedExplanation[0].afirmaciones[1],
  tipo: 'explicacion',
  fuente_ids: ['F1'],
  estado: 'pendiente_revision_humana',
  requiere_revision_humana: true,
};
unsupportedExplanation[0].pendientes[0].afirmacion_id = 'F1-O1';
assert.throws(() => invoke(unsupportedExplanation), /requiere URL HTTPS y extracto de una fuente primaria/);

assert.throws(
  () => runNode({ all: () => [{ json: { pieza_id: 'stored-row', estado: 'PENDIENTE_REVISION' } }] }, () => null),
  /evitar duplicados/,
);

const workflow = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'linkedin-editorial-v2.template.json'), 'utf8'));
const telegram = workflow.nodes.find((node) => node.name === 'Send a text message');
const expression = telegram.parameters.text.replace(/^=\{\{\s*/, '').replace(/\s*\}\}$/, '');
const renderCard = new Function('$json', `return ${expression};`);
const card = renderCard({
  pieza_id: 'local-test-batch-1',
  tema: 'Prueba de trazabilidad',
  texto: 'Construyo automatizaciones con n8n.',
  idea_visual: 'Diagrama de prueba sin datos reales.',
  evidencia_json: JSON.stringify({
    tipo: 'educativo',
    fuentes: [{ id: 'F1', tipo: 'declaracion_personal_confirmada', fecha_confirmacion: '2026-09-28' }],
    afirmaciones: [{ id: 'A1', afirmacion: 'Construyo automatizaciones con n8n.', tipo: 'hecho', fuente_ids: ['F1'] }],
    pendientes: [{ afirmacion_id: 'A2', motivo: 'Confirmar la postura.' }],
  }),
});
assert.match(card, /Hechos \/ explicaciones \/ opiniones/);
assert.match(card, /HECHO · F1/);
assert.match(card, /Pendientes humanos/);
assert.ok(card.length <= 3900);
assert.equal(telegram.parameters.additionalFields.appendAttribution, false);

console.log('OK: typed traceability, rejection guards, duplicate protection, and Telegram card expression/length/attribution.');
