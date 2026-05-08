CRITICAL UTF-8 RULES:

- NEVER rewrite Vietnamese text
- NEVER normalize Unicode
- NEVER change encoding
- Preserve all non-ASCII characters exactly
- Treat Vietnamese text as immutable
- Only edit ASCII code regions
- Output UTF-8 WITHOUT BOM
- If Vietnamese text appears corrupted, STOP and ask