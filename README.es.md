# Docash

[English](README.md) · **Español**

App de gastos personales para Android. Todo vive en el teléfono: no hay cuenta, ni login, ni servidor. La abres, anotas y cierras.

## Qué hace

- Anotar gastos e ingresos con teclado numérico propio, categoría, nota y fecha.
- Balance total, ingresos y gastos del mes en la pantalla principal.
- Lista de movimientos con filtros por día, semana, mes, año o todo, y buscador.
- Categorías con icono; puedes crear las que te falten.
- Presupuestos por categoría (diario, semanal o mensual) con barra de avance y aviso cuando te pasas.
- Metas de ahorro con progreso. La fecha límite es opcional; si no pones, es indefinida.
- Movimientos recurrentes: diario, semanal, mensual o cada N días/semanas/meses. Se aplican solos al abrir la app.
- Dólares o euros. Solo cambia el símbolo, no convierte los montos ya guardados (a propósito).
- Tema claro, oscuro o el del sistema, y todo en español e inglés.
- Bloqueo con PIN y huella.
- Recordatorios de presupuesto, metas e inactividad, con interruptores para apagarlos.
- Exportar e importar los datos como texto, para respaldar o moverlos a otro teléfono.
- Widget de inicio con el balance.

## Con qué está hecho

React Native 0.76 con la nueva arquitectura, WatermelonDB (SQLite en el dispositivo, vía JSI), Skia para las gráficas, Reanimated + Gesture Handler para las transiciones, Gluestack para los componentes y Zustand para el estado. Nada sale del teléfono.

## Levantarlo

Hace falta Node, JDK 17 y el SDK de Android con las variables `ANDROID_HOME` y `JAVA_HOME`.

```bash
npm install
npm start          # arranca Metro
npm run android    # compila e instala en el emulador o dispositivo
```

Para un APK de release (por defecto solo arm64-v8a):

```bash
cd android
./gradlew assembleRelease
```

El APK queda en `android/app/build/outputs/apk/release/`.

## Tests

La lógica va con Jest:

```bash
npm test
```

Y los flujos de UI con [Maestro](https://maestro.mobile.dev/), en la carpeta `maestro/`:

```bash
maestro test maestro
```
