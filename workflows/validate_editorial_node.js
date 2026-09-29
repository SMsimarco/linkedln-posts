// Source of truth for the n8n Code node "Validar y entregar para revision".
// Keep this file synchronized with the jsCode embedded in the JSON template.
const rows = $input.all().map((item) => item.json);

// Never let a stored row be sent through the auto-mapped insert node again.
if (rows.some((row) => typeof row.pieza_id === 'string')) {
  throw new Error('Se recibieron filas ya guardadas; se detiene para evitar duplicados. La evaluación de borradores existentes es solo offline.');
}

const response = rows[0];
if (!response || response.stop_reason !== 'end_turn') {
  throw new Error('Respuesta incompleta de Anthropic');
}

const raw = (response.content || [])
  .filter((block) => block.type === 'text')
  .map((block) => block.text)
  .join('\n')
  .trim();
if (!raw || raw.startsWith('```') || raw.endsWith('```')) {
  throw new Error('La respuesta debe ser JSON puro, sin Markdown ni texto adicional');
}

const parsed = JSON.parse(raw);
const brief = $('Brief editorial - editar fuentes').first().json;
const sourceById = new Map((brief.fuentes || []).map((source) => [source.id, source]));
if (!Array.isArray(parsed.publicaciones) || parsed.publicaciones.length !== 2) {
  throw new Error('Deben existir exactamente dos borradores');
}

const history = $('Leer historial editorial').all().map((item) => item.json);
const normalize = (value) => String(value || '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[*_`>#]/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();
const seenText = new Set(history.filter((item) => item.texto).map((item) => normalize(item.texto)));
const seenIds = new Set(history.filter((item) => item.pieza_id).map((item) => String(item.pieza_id)));
const allowedTypes = new Set(['caso', 'educativo']);
const claimTypes = new Set(['hecho', 'explicacion', 'opinion']);

function textSentences(text) {
  return text
    .replace(/\r\n?/g, '\n')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((part) => part.replace(/^[\s>*•-]+/, '').replace(/[*_`]/g, '').trim())
    .filter((part) => part && !/^#[\p{L}\p{N}_]+(?:\s+#[\p{L}\p{N}_]+)*$/u.test(part));
}

function validatePost(post, index) {
  if (!post || typeof post !== 'object') throw new Error(`Borrador ${index + 1} inválido`);
  const texto = typeof post.texto === 'string' ? post.texto.trim() : '';
  const tema = typeof post.tema === 'string' ? post.tema.trim() : '';
  const ideaVisual = typeof post.idea_visual === 'string' ? post.idea_visual.trim() : '';
  if (texto.length < 600 || texto.length > 2500 || !tema || !ideaVisual) {
    throw new Error(`Borrador ${index + 1}: texto debe tener 600–2500 caracteres y tema/idea visual no pueden estar vacíos`);
  }
  if (!allowedTypes.has(post.tipo_contenido)) throw new Error(`Borrador ${index + 1}: tipo_contenido inválido`);

  if (!Array.isArray(post.fuentes) || !post.fuentes.length || new Set(post.fuentes).size !== post.fuentes.length) {
    throw new Error(`Borrador ${index + 1}: fuentes debe contener IDs únicos`);
  }
  if (post.fuentes.some((sourceId) => !sourceById.has(sourceId))) {
    throw new Error(`Borrador ${index + 1}: referencia una fuente inexistente`);
  }
  if (!Array.isArray(post.afirmaciones) || !post.afirmaciones.length) {
    throw new Error(`Borrador ${index + 1}: falta el registro tipado de afirmaciones`);
  }
  if (!Array.isArray(post.pendientes)) throw new Error(`Borrador ${index + 1}: pendientes debe ser un arreglo`);

  const claimsByText = new Map();
  const claimIds = new Set();
  const usedSources = new Set();
  const needsHumanReview = new Set();
  for (const claim of post.afirmaciones) {
    const claimId = typeof claim?.id === 'string' ? claim.id.trim() : '';
    const claimText = typeof claim?.afirmacion === 'string' ? claim.afirmacion.trim() : '';
    if (!claimId || claimIds.has(claimId) || !claimText || !claimTypes.has(claim.tipo)) {
      throw new Error(`Borrador ${index + 1}: afirmación sin ID, texto o tipo válido`);
    }
    claimIds.add(claimId);
    const normalizedClaim = normalize(claimText);
    if (claimsByText.has(normalizedClaim)) throw new Error(`Borrador ${index + 1}: afirmación repetida`);
    claimsByText.set(normalizedClaim, claim);

    if (!Array.isArray(claim.fuente_ids)) throw new Error(`Afirmación ${claimId}: fuente_ids debe ser un arreglo`);
    if (claim.fuente_ids.some((sourceId) => !sourceById.has(sourceId) || !post.fuentes.includes(sourceId))) {
      throw new Error(`Afirmación ${claimId}: contiene una fuente inexistente o no declarada`);
    }
    for (const sourceId of claim.fuente_ids) usedSources.add(sourceId);

    if (claim.tipo === 'hecho') {
      if (!claim.fuente_ids.length) throw new Error(`Hecho ${claimId} sin fuente`);
      const exactSupport = claim.fuente_ids.some((sourceId) => {
        const sourceText = normalize(sourceById.get(sourceId).hecho || sourceById.get(sourceId).extracto);
        return sourceText.includes(normalizedClaim);
      });
      if (!exactSupport) throw new Error(`Hecho ${claimId} no aparece literalmente en una fuente declarada`);
      if (claim.estado !== 'respaldada') throw new Error(`Hecho ${claimId} debe marcarse como respaldado`);
    }

    if (claim.tipo === 'explicacion') {
      const supportedByPrimarySource = claim.fuente_ids.some((sourceId) => {
        const source = sourceById.get(sourceId);
        const excerpt = normalize(source.extracto || '');
        return /^https:\/\//i.test(source.url || '') && excerpt.includes(normalizedClaim);
      });
      if (!claim.fuente_ids.length || !supportedByPrimarySource) {
        throw new Error(`Explicación ${claimId} requiere URL HTTPS y extracto de una fuente primaria que la respalde`);
      }
      if (claim.requiere_revision_humana !== true || claim.estado !== 'pendiente_revision_humana') {
        throw new Error(`Explicación ${claimId} debe quedar marcada para revisión humana`);
      }
    }

    if (claim.tipo === 'opinion') {
      if (claim.requiere_revision_humana !== true || claim.estado !== 'pendiente_revision_humana') {
        throw new Error(`Opinión ${claimId} debe quedar marcada para revisión humana`);
      }
      if (typeof claim.motivo_revision !== 'string' || !claim.motivo_revision.trim()) {
        throw new Error(`Opinión ${claimId} requiere un motivo de revisión`);
      }
    }
    if (claim.requiere_revision_humana === true) needsHumanReview.add(claimId);
  }

  for (const sentence of textSentences(texto)) {
    if (sentence.endsWith('?')) continue;
    if (!claimsByText.has(normalize(sentence))) {
      throw new Error(`Oración declarativa sin clasificación y trazabilidad: ${sentence.slice(0, 120)}`);
    }
  }
  if ([...usedSources].some((sourceId) => !post.fuentes.includes(sourceId))) {
    throw new Error(`Borrador ${index + 1}: fuentes no declaradas`);
  }
  if (post.fuentes.some((sourceId) => !usedSources.has(sourceId))) {
    throw new Error(`Borrador ${index + 1}: hay fuentes sin afirmación asociada`);
  }

  const pendingIds = new Set();
  for (const pending of post.pendientes) {
    if (!pending || typeof pending.afirmacion_id !== 'string' || typeof pending.motivo !== 'string' || !pending.motivo.trim()) {
      throw new Error(`Borrador ${index + 1}: cada pendiente debe tener afirmacion_id y motivo`);
    }
    if (!needsHumanReview.has(pending.afirmacion_id)) {
      throw new Error(`Pendiente ${pending.afirmacion_id} no corresponde a una afirmación marcada para revisión`);
    }
    pendingIds.add(pending.afirmacion_id);
  }
  for (const claimId of needsHumanReview) {
    if (!pendingIds.has(claimId)) throw new Error(`Afirmación ${claimId} requiere revisión pero no tiene pendiente asociado`);
  }

  const normalizedText = normalize(texto);
  if (seenText.has(normalizedText)) throw new Error(`Borrador ${index + 1} duplicado; actualizar la propuesta editorial`);
  seenText.add(normalizedText);
  const pieceId = `${brief.lote_id}-${index + 1}`;
  if (seenIds.has(pieceId)) throw new Error(`pieza_id duplicado: ${pieceId}`);
  seenIds.add(pieceId);

  const evidence = {
    schema_version: 2,
    fuentes: post.fuentes.map((sourceId) => sourceById.get(sourceId)),
    afirmaciones: post.afirmaciones,
    pendientes: post.pendientes,
    tipo: post.tipo_contenido,
    revision: {
      estado: 'PENDIENTE_REVISION',
      revision_humana_obligatoria: true,
      alcance: 'Se validaron estructura, clasificación, referencias, respaldo textual, pendientes y duplicados; no se certificó la verdad semántica ni se autorizó publicación.',
    },
  };
  return {
    pieza_id: pieceId,
    estado: 'PENDIENTE_REVISION',
    tema,
    texto,
    evidencia_json: JSON.stringify(evidence),
    idea_visual: ideaVisual,
    url_publicada: '',
  };
}

return parsed.publicaciones.map((post, index) => ({ json: validatePost(post, index) }));
