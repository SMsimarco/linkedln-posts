# Contrato de trazabilidad editorial

La plantilla guarda la trazabilidad en la columna existente `evidencia_json`; no requiere agregar columnas a `LinkedIn_Editorial`.

## Estructura v2

Cada borrador guarda:

- `schema_version: 2`.
- `fuentes`: objetos completos del brief, conservando ID, tipo, origen, fecha y evidencia disponible.
- `afirmaciones`: una entrada por oración declarativa, con `id`, `afirmacion`, `tipo`, `fuente_ids`, `estado`, `requiere_revision_humana` y, cuando corresponda, `motivo_revision`.
- `pendientes`: objetos `{ afirmacion_id, motivo }` para cada afirmación que requiere confirmación humana.
- `tipo` y `revision`: estado `PENDIENTE_REVISION` y alcance explícito de las comprobaciones mecánicas.

## Reglas de validación

- `hecho`: exige fuente declarada cuyo texto contenga literalmente la afirmación; se marca `respaldada`.
- `explicacion`: exige URL HTTPS y extracto de una fuente primaria que contenga literalmente la afirmación; queda pendiente de revisión humana.
- `opinion`: debe presentarse como opinión/hipótesis explícita, tener motivo y pendiente humano; no se presenta como hecho.
- Toda oración declarativa debe estar clasificada. Las preguntas no se tratan como afirmaciones, aunque no pueden usarse para insinuar datos no documentados.
- Se validan IDs y fuentes existentes, declaraciones de fuente no usadas, JSON, extensión, tipos, duplicados exactos y estado de cola.
- El validador no puede certificar verdad semántica, intención personal ni vigencia de fuentes. La revisión humana sigue siendo obligatoria; nunca publica.

Las fuentes actuales F1/F2 son declaraciones personales confirmadas. No respaldan por sí solas explicaciones generales sobre RLS, Caddy, Twilio, n8n u otros componentes; para eso hay que añadir documentación oficial/primaria al brief.

## Revisión de las dos piezas existentes

Se leyeron seis filas en el historial de n8n; las dos más recientes siguen en `PENDIENTE_REVISION`. Sus hechos centrales coinciden literalmente con F1/F2. Sin embargo, `evidencia_json` aún usa el formato anterior: no versiona el esquema, no asigna tipo por afirmación y no vincula todas las frases de opinión con un pendiente. Por eso no se reescribieron ni reenviaron: quedan como borradores legacy para revisión humana y no cumplen todavía el contrato v2.

La ruta de validación de generación rechaza filas ya guardadas para evitar que terminen otra vez en el nodo de inserción. La evaluación de registros existentes se realiza offline, sin Anthropic, sin insertar/actualizar filas y sin enviar Telegram.

## Pruebas locales

Desde la raíz del repositorio:

```sh
node --check workflows/validate_editorial_node.js
node --check workflows/tests/validate_editorial_node.test.cjs
node workflows/tests/validate_editorial_node.test.cjs
```

Las pruebas cubren un caso válido con hecho y opinión marcada, una afirmación factual sin respaldo, una oración declarativa no clasificada, una opinión sin pendiente, una explicación sin fuente primaria, la protección contra reenviar filas existentes y la expresión de Telegram (sintaxis, trazabilidad visible, límite de longitud y atribución desactivada).
