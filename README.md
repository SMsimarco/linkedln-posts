# LinkedIn Editorial — IA aplicada y automatización

Sistema editorial en construcción para convertir experiencia técnica verificable en borradores de LinkedIn sobre automatización con IA, agentes conversacionales e integraciones.

Cada borrador debe apoyarse en hechos verificables, indicar sus fuentes y pasar por revisión humana antes de publicarse.

![Ilustración conceptual: responder, consultar y actuar con distintos permisos](outputs/linkedin-agentes-permisos.png)

## Qué contiene este repositorio

- [Estrategia editorial, investigación y borradores](outputs/estrategia_linkedin_ia.md): hipótesis de contenido, formatos, controles de veracidad, métricas y propuesta de evolución.
- [Ilustración conceptual](outputs/linkedin-agentes-permisos.png): recurso visual para explicar que responder, consultar y actuar requieren permisos y controles distintos. No representa una arquitectura real de Antic ni de un cliente.
- [Workflow editorial de n8n](workflows/linkedin-editorial-v2.template.json): plantilla sanitizada para generar, validar y guardar borradores en cola.
- [Workflow de aprobación por Telegram](workflows/linkedin-aprobacion-telegram.template.json): plantilla sanitizada para gestionar la aprobación humana.

## Estado y límites

- Los textos son borradores y requieren revisión humana.
- No se habilita publicación automática en LinkedIn.
- No hay métricas formales de conversión que permitan atribuir resultados laborales al contenido.
- La estrategia documenta propuestas e hipótesis; no garantiza alcance, entrevistas ni ofertas.
- Los exports son plantillas de referencia, no están listos para ejecutarse tal cual: hay que volver a seleccionar credenciales y configurar la tabla, el chat y el webhook propios en n8n.
- Ambos exports están inactivos y no incluyen referencias a credenciales, IDs internos, datos de ejecución ni el chat privado. No se ejecutaron ni activaron al prepararlos.

## Principios de seguridad y trazabilidad

- No guardar API keys, tokens, contraseñas, cookies, archivos .env ni credenciales exportadas en Git.
- Mantener las fuentes junto a las afirmaciones que respaldan y marcar explícitamente lo que requiera confirmación humana.
- No presentar ejemplos hipotéticos como implementaciones reales ni atribuir métricas que no se hayan medido.
- Revisar los exports de n8n antes de versionarlos: pueden incluir datos de ejecución, IDs internos o configuración sensible aunque no incluyan una clave evidente.

## Uso

Este repositorio funciona como documentación y muestra de proceso editorial. Los borradores no deben copiarse/publicarse sin verificar primero sus hechos, vigencia, fuentes y contexto.

## Sobre mí

Simón Marconi — desarrollador full stack, interesado en IA aplicada, automatización, agentes conversacionales e integraciones.
