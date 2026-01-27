# 🎮 Checklist: Añadir Sprite Animado a PreloadScene Existente

## Requisitos

- Proyecto Phaser 3 con PreloadScene ya existente
- Sprite animado con frames horizontales (WebP recomendado, <100KB)

---

## ✅ Checklist

### 1. Preparar el Sprite

- [ ] Crear/obtener sprite con frames horizontales
- [ ] Calcular `frameWidth = ancho_total / num_frames`
  - Ejemplo: 4338px / 18 frames = **241px**
- [ ] Subir a hosting (remix.gg, etc.)
- [ ] Copiar la URL

### 2. Modificar PreloadScene.ts

#### 2.1 Añadir propiedades a la clase

```typescript
private assetsLoaded: boolean = false;
private animationComplete: boolean = false;
private bootSprite!: Phaser.GameObjects.Sprite;
```

#### 2.2 En `preload()` - SOLO cargar el sprite

```typescript
preload(): void {
  // SOLO el sprite aquí (es pequeño, carga rápido)
  this.load.spritesheet(
    "bootSprite",
    "https://remix.gg/blob/13e738d9-e135-454e-9d2a-e456476a0c5e/sprite-start-oVCq0bchsVLwbLqAPbLgVOrQqxcVh5.webp?Cbzd",
    { frameWidth: 241, frameHeight: 345 } // Ajustar según tu sprite
  );
}
```

#### 2.3 En `create()` - Mostrar animación y cargar resto

```typescript
create(): void {
  // Crear animación
  this.anims.create({
    key: "boot",
    frames: this.anims.generateFrameNumbers("bootSprite", {
      start: 0,
      end: 17, // num_frames - 1
    }),
    frameRate: 12,
    repeat: 0, // Una sola vez, se queda en último frame
  });

  // Mostrar sprite centrado
  const { width, height } = this.scale;
  this.bootSprite = this.add.sprite(width / 2, height / 2, "bootSprite");
  const scale = Math.min(width / 300, height / 400, 1.5);
  this.bootSprite.setScale(scale);
  this.bootSprite.play("boot");

  // Cuando termine la animación
  this.bootSprite.on("animationcomplete", () => {
    this.animationComplete = true;
    this.checkTransition();
  });

  // Cargar el resto de assets
  this.loadRemainingAssets();
}
```

#### 2.4 Mover carga de assets a `loadRemainingAssets()`

```typescript
private loadRemainingAssets(): void {
  // Mover aquí todo lo que estaba en preload()
  this.load.audio("beep", "URL");
  this.load.audio("music1", "URL");
  this.load.image("background", "URL");
  // ... etc

  this.load.on("complete", () => {
    this.assetsLoaded = true;
    this.checkTransition();
  });

  this.load.start();
}
```

#### 2.5 Añadir método de transición

```typescript
private checkTransition(): void {
  // Solo transiciona cuando animación Y assets están listos
  if (this.animationComplete && this.assetsLoaded) {
    this.scene.start("StartScene");
  }
}
```

---

## 📋 Resumen de Cambios

| Antes                  | Después                       |
| ---------------------- | ----------------------------- |
| `preload()` carga TODO | `preload()` solo carga sprite |
| Sin animación          | Sprite animado mientras carga |
| Transición inmediata   | Espera animación + assets     |

---

## 🎵 Bonus: Carga Lazy de Música (en escena de juego)

```typescript
// En tu GameScene/HelixScene
private loadExtraMusic(): void {
  this.load.audio("music2", "URL");
  this.load.audio("music3", "URL");
  this.load.on("complete", () => { this.extraMusicLoaded = true; });
  this.load.start();
}
```

Llamar en `create()` de la escena de juego.

---

## 📐 Referencia: Cálculo de Frames

```
frameWidth = ancho_imagen / num_frames
frameHeight = alto_imagen
end = num_frames - 1
```
