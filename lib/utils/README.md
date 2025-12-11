# Sistema de Loading Global

El sistema utiliza un popup flotante con circular progress bar para mostrar estados de carga.

## Uso

### En componentes de React

```typescript
import { useLoading } from '@/contexts/LoadingContext';

function MiComponente() {
  const { showLoading, hideLoading } = useLoading();

  const handleAction = async () => {
    showLoading('Procesando...');
    try {
      // Tu código aquí
      await algunaOperacion();
    } finally {
      hideLoading();
    }
  };
}
```

### Métodos disponibles

- `showLoading(message?: string)`: Muestra el popup de loading con un mensaje opcional
- `hideLoading()`: Oculta el popup de loading

### Características

- Popup flotante con backdrop blur
- Circular progress bar animado
- Mensaje personalizable
- Animaciones suaves de entrada/salida
- Soporte para dark mode

