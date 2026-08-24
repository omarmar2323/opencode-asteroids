---
description: Crear worktree con nombre automático
---

Ejecuta los siguientes pasos en orden:

1. Verifica si existe el directorio `.worktrees/`. Si no existe, créalo con `mkdir -p .worktrees`

2. Toma el primer argumento: `$1` (nombre del worktree)

3. Si el nombre tiene más de 20 caracteres, resúmelo tomando la primera letra de cada palabra separada por guiones. Ejemplo: `feature-login-auth` → `f-l-a`

4. Si el segundo argumento `$2` es `y` o `Y`:
   - Toma el nombre resumido (o original si es <=20 chars)
   - Trunca a máximo 10 caracteres para usar como nombre de branch
   - Ejecuta: `git worktree add -b <branch-10chars> .worktrees/<nombre-resumido>`

5. Si no se proporciona segundo argumento o es diferente a `y`/`Y`:
   - Ejecuta: `git worktree add .worktrees/<nombre-resumido>`

6. Muestra el resultado del comando ejecutado.
