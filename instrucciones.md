## Worktrees manualmente

1. Crear directorio `.worktrees/`
2. Ejecutar:
```
git worktree add .worktrees/<nombre-del-worktree>
```

## Ahora necesitamos 3 features:

- implementemos un **triple shot**: Por 5 segundos, el personaje dispara 3 veces en línea recta.
- implementemos un **sistema de skins**: Poder cambiar la apariencia de la nave.
- implementemos un **escudo**: Un escudo que protege a la nave de los proyectiles enemigos.

## creacion de los tres worktrees
- **triple shot**: 
  git worktree add .worktrees/tripleshot
- **sistema de skins**: 
  git worktree add .worktrees/skins  
- **escudo**: 
  git worktree add .worktrees/shield  

# Listar worktrees
 git worktree list

## remocion de los tres worktrees

- **triple shot**: 
  git worktree remove .worktrees/tripleshot
- **sistema de skins**: 
  git worktree remove .worktrees/skins  
- **escudo**: 
  git worktree remove .worktrees/shield  

# creacion de comandos personalizados de opencode
- https://opencode.ai/docs/commands/