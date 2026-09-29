# LinkedIn Editorial — IA aplicada y automatización

Sistema editorial en construcción para convertir experiencia técnica verificable en borradores de LinkedIn sobre automatización con IA, agentes conversacionales e integraciones.

Cada borrador debe apoyarse en hechos verificables, indicar sus fuentes y pasar por revisión humana antes de publicarse.

![Ilustración conceptual: responder, consultar y actuar con distintos permisos](outputs/linkedin-agentes-permisos.png)

## Qué contiene este repositorio

- [Estrategia editorial, investigación y borradores](outputs/estrategia_linkedin_ia.md): hipótesis de contenido, formatos, controles de veracidad, métricas y propuesta de evolución.
- [Ilustración conceptual](outputs/linkedin-agentes-permisos.png): explica que responder, consultar y actuar requieren permisos y controles distintos. Es una pieza conceptual, no una arquitectura real.

## Estado y límites

- Los textos son borradores y requieren revisión humana.
- No se habilita publicación automática en LinkedIn.
- No hay métricas formales de conversión que permitan atribuir resultados laborales al contenido.
- La estrategia documenta propuestas e hipótesis; no garantiza alcance, entrevistas ni ofertas.
- Los workflows de n8n todavía no están incluidos: falta exportarlos y revisarlos para retirar credenciales, datos personales e información de ejecución.

## Seguridad y trazabilidad

- No guardar API keys, tokens, contraseñas, cookies, archivos .env ni credenciales exportadas en Git.
- Mantener las fuentes junto a las afirmaciones que respaldan y marcar lo que requiera confirmación humana.
- No presentar ejemplos hipotéticos como implementaciones reales ni atribuir métricas que no se hayan medido.
- Revisar los exports de n8n antes de versionarlos: pueden contener IDs internos o configuración sensible aunque no incluyan una clave evidente.

## Uso

Este repositorio documenta un proceso editorial. Antes de reutilizar un borrador, verificá sus hechos, fuentes, vigencia y contexto.

## Sobre mí

Simón Marconi — desarrollador full stack, interesado en IA aplicada, automatización, agentes conversacionales e integraciones.
