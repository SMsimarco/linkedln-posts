# Workflows de n8n

Estos JSON son exports sanitizados para inspección y reutilización. No contienen credenciales, IDs de instancia, el chat privado ni datos de ejecución. No están listos para importar y ejecutar sin configuración.

## Contenido

- `linkedin-editorial-v2.template.json`: flujo editorial de generación, validación y guardado en cola, con aviso a Telegram.
- `linkedin-aprobacion-telegram.template.json`: endpoint de aprobación y actualización del estado en la tabla editorial.

## Configuración requerida al importar

1. Importar cada plantilla en una instancia de prueba de n8n y revisar sus nodos antes de usarla.
2. Seleccionar las credenciales correspondientes en los nodos Anthropic y Telegram. Las referencias del export original se quitaron deliberadamente.
3. Elegir la tabla `LinkedIn_Editorial` en los nodos Data Table y comprobar que sus columnas coincidan con los mapeos del flujo.
4. Configurar el chat de revisión mediante `TELEGRAM_REVIEW_CHAT_ID` y el secreto de aprobación mediante `LINKEDIN_EDITORIAL_APPROVAL_TOKEN` en el entorno seguro de n8n; nunca guardar sus valores en este repositorio.
5. Reemplazar el host y la ruta de webhook de ejemplo del botón de aprobación con la URL real de la instancia. Verificar protección, respuesta HTTP y cambio de estado antes de enviar tarjetas reales.
6. Mantener desactivada la publicación automática. Los borradores requieren revisión humana; estas plantillas no publican en LinkedIn.

Los exports se prepararon sin ejecutar ni activar los workflows. Cualquier prueba de importación o ejecución debe hacerse por separado y con autorización explícita.
