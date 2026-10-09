# Uso tradicional del computador de vuelo E6B

Guía de referencia para el E6B Trainer de Qub-its. Describe cómo se usa el E6B mecánico "de toda la vida" (la
"rueda de cálculo") y cómo se corresponde cada procedimiento con los niveles y herramientas del simulador. Todos los
números de los ejemplos están calculados con las fórmulas del modelo del simulador (`lib/scales.js`, `lib/wind.js`)
y redondeados como se leerían en el instrumento (aprox. 1 %).

> El simulador es una herramienta de aprendizaje, no de instrucción de vuelo real. Verifica siempre con tu instructor
> y con los datos oficiales de tu avión.

## 1. Qué es el E6B

El E6B es un **computador de vuelo mecánico de dos caras**:

- Una cara es una **regla de cálculo circular** (dos escalas logarítmicas, una fija y otra giratoria) con índices,
  flechas de conversión y ventanas para la TAS y la altitud de densidad.
- La otra cara es un **computador de viento**: un marco con un disco giratorio transparente y una tarjeta
  deslizante que resuelve el triángulo del viento.

### Breve historia

- Se desarrolló a **finales de los años 30** a partir de diseños anteriores, por el teniente de la Marina de
  EE. UU. **Philip Dalton**, que adaptó una regla circular y un computador de viento para la navegación aérea.
- La designación **E-6B** es la que le dio la **Fuerza Aérea del Ejército de EE. UU. (USAAF)** durante la Segunda
  Guerra Mundial, cuando se fabricó por cientos de miles para tripulaciones de bombarderos y cazas.
- Sigue siendo un clásico de la formación: la FAA **permite su uso en los exámenes teóricos** (junto con los
  computadores electrónicos) y muchas escuelas aún lo enseñan, porque obliga a entender los conceptos
  (orden de magnitud, proporciones, triángulo del viento) en lugar de teclear números.
- Existen variantes como el **CRP-5** (muy usado en Europa, con la escala del viento y las ventanas de TAS
  organizadas de otra forma) y el **CR-3**. El principio es el mismo; cambian las posiciones exactas y las
  conversiones disponibles.

## 2. Anatomía de las dos caras

### 2.1 Cara de cálculo

| Parte | Qué es | Para qué sirve |
|---|---|---|
| Escala exterior | Escala logarítmica fija de 10 a 100 | Distancia, combustible, TAS, resultado de multiplicar |
| Escala interior | La misma escala en el disco giratorio, leída como **minutos** | Tiempo, y el segundo factor de una proporción |
| Anillo de horas | Escala pequeña con h:mm (60 = 1:00, 90 = 1:30…) | Pasar minutos a horas sin dividir |
| Índice 10 | La marca de 10 en ambas escalas | Multiplicar y dividir |
| Índice de velocidad (60) | Triángulo grande sobre el 60 interior | Problemas de tiempo, velocidad y distancia |
| Índice de segundos (36) | Marca sobre el 36 interior (3 600 s = 1 h) | Tiempos cortos |
| Flechas de conversión | NAUT, STAT, KM · U.S. GAL, LITERS, FUEL LBS · METERS, FEET | Cambio de unidades |
| Ventana de TAS | Altitud de presión (disco) frente a temperatura (base) | De CAS a TAS |
| Ventana de DA | Escala de altitud de densidad frente a un índice fijo | Altitud de densidad |
| Tira de temperatura | °C / °F lineal | Conversión de temperatura |

### 2.2 Cara del viento

| Parte | Qué es |
|---|---|
| TRUE INDEX | Índice (triángulo) en lo alto del marco: lo que está bajo él es "arriba" |
| Escala de deriva | Escala L/R junto al índice, hasta 45° |
| Disco azimutal | Disco transparente con la rosa 0–359°, gira sobre el ojal |
| Ojal (grommet) | Círculo central: el avión sobre el terreno |
| Tarjeta deslizante | Rejilla con arcos de velocidad (30–270 kt) y líneas de deriva, que sube y baja |
| Arcos de velocidad | Circunferencias concéntricas en torno al origen de la tarjeta |
| Líneas de deriva | Rectas que parten del origen, una por grado |
| Punto de viento | Marca de lápiz sobre el disco: el viento dibujado |

## 3. Cómo se lee una escala logarítmica

1. **Cifras primero.** La escala va de 10 a 100. Entre 10 y 20 cada raya vale 0,1; entre 20 y 50, 0,5; entre
   50 y 100, 1.
2. **La coma la pones tú.** Una vuelta es una década: la marca 5 0 es 5, 50 o 500.
3. **Estima antes de mover.** 120 kt = 2 NM por minuto; en 25 min son unas 50 NM, no 5 ni 500.
4. **Comprueba al final.** Si el resultado del instrumento y tu estimación coinciden en cifras y en orden de
   magnitud, está bien.

Regla de oro: *el E6B da las cifras; tu cabeza da el orden de magnitud.*

## 4. Procedimientos paso a paso

### 4.1 Tiempo, velocidad y distancia (índice 60)

Poner el **60 interior bajo la velocidad** (escala exterior). A partir de ahí, cada minuto interior tiene su
distancia justo encima.

**Distancia.** 120 kt durante 25 min:

1. 60 interior bajo 120 (exterior).
2. Busca 25 min en la escala interior.
3. Sobre él lees **50 NM**.

**Tiempo.** 75 NM a 150 kt:

1. 60 bajo 150.
2. Busca 75 en la escala exterior.
3. Bajo él lees **30 min** (0:30).

**Velocidad.** 42 NM en 18 min:

1. Pon 18 (interior) bajo 42 (exterior).
2. Lee la exterior sobre el índice 60: **140 kt**.

**Más de una hora.** 80 kt durante 1:30: 60 bajo 80, busca 90 min (1:30 en el anillo de horas) y lee **120 NM**.

### 4.2 El índice de segundos (36)

El 36 equivale a 3 600 s. Funciona igual que el 60, pero lees **segundos**.

**Ejemplo.** 2,5 NM a 90 kt: pon el 36 bajo 90; busca 25 en la escala exterior; bajo él lees "1 0" = **100 s**
(1:40). Estimación: 90 kt son 1,5 NM por minuto, 2,5 NM tardan 1,67 min = 100 s.

Uso típico: cronometrar el tramo FAF – MAP de una aproximación de no precisión.

### 4.3 Multiplicar y dividir (índice 10)

**Multiplicar A × B:** 10 interior bajo A (exterior); la respuesta está en la exterior sobre B (interior).

**Ejemplo.** 12 × 15: 10 interior bajo 12; sobre el 15 interior lees "1 8" = **180**.

**Dividir A / B:** pon B (interior) bajo A (exterior) y lee la respuesta sobre el 10 interior (o bajo el 10
exterior, según la década). Con el índice 60 ya estás dividiendo: distancia / tiempo = velocidad.

### 4.4 Combustible: consumo, autonomía y caudal

Es el mismo planteamiento con galones en lugar de millas. Pon el **60 bajo el caudal**.

- **Consumo.** 9,5 GPH durante 2:30: 60 bajo 95; sobre 150 min lees "2 3 7" = **23,7 gal** (exacto 23,75).
- **Autonomía.** 38 gal a 8 GPH: 60 bajo 80; bajo 38 (exterior) lees "2 8 5" = **285 min = 4:45**.
- **Caudal.** 13 gal en 1:20: pon 80 min (interior) bajo 13 (exterior); sobre el 60 lees "9 7 5" = **9,75 GPH**.

Recuerda que la autonomía es hasta el depósito **vacío**: resta siempre la reserva legal (p. ej. 30 o 45 min).

### 4.5 Conversiones con las flechas

El valor se pone en la escala **interior bajo la flecha de su unidad** y el resultado se lee en la interior bajo
la flecha de la unidad de destino.

| Ejemplo | Ajuste | Lectura |
|---|---|---|
| 85 NM → SM | 85 bajo NAUT | bajo STAT: **97,9 SM** |
| 120 NM → km | 120 bajo NAUT | bajo KM: **221,8 km** |
| 40 gal → lb | 40 bajo U.S. GAL | bajo FUEL LBS: **240 lb** (6 lb/gal) |
| 1 500 m → ft | 150 bajo METERS | bajo FEET: **4 921 ft** |
| 15 °C → °F | tira de temperatura | **59 °F** |

Pon siempre la coma con una estimación mental (1 NM ≈ 1,15 SM ≈ 1,85 km; 1 m ≈ 3,3 ft).

### 4.6 De CAS a TAS (ventana de TAS)

La TAS es mayor que la CAS cuando el aire es menos denso (más alto o más caliente).

1. Gira el disco hasta que la **altitud de presión (PA)** quede frente a la **temperatura exterior (OAT, °C)**
   en la ventana.
2. Busca la CAS en la escala interior y lee la **TAS** en la exterior, sobre ella.

**Ejemplos.**

- PA 6 000 ft, OAT −5 °C, CAS 120 kt: **TAS ≈ 129 kt**.
- PA 8 000 ft, OAT +10 °C, CAS 110 kt: **TAS ≈ 127 kt**.
- PA 10 000 ft, OAT 0 °C, CAS 100 kt: **TAS ≈ 117 kt**.

Regla de bolsillo: la TAS sube un 2 % por cada 1 000 ft (más con calor), una comprobación útil.

La altitud de presión es la altitud con 1013 hPa (29,92 inHg) calado, o la elevación corregida por la diferencia
con el QNH (aprox. 30 ft por hPa).

### 4.7 Altitud de densidad (ventana de DA)

Con PA y temperatura ya puestas para la TAS, la altitud de densidad se lee **frente al índice fijo** de la ventana
de DA, sin mover nada más.

**Ejemplo.** PA 5 000 ft, OAT +25 °C: **DA ≈ 7 260 ft**. La temperatura ISA a 5 000 ft es unos 5 °C; hay 20 °C
de exceso, y la regla de 120 ft por grado de desviación da +2 400 ft, un orden de magnitud coherente
(la regla es aproximada).

Por qué importa: con DA alta el aire es menos denso, hay menos sustentación, tracción y potencia: despegue más
largo, ascenso más lento, aproximaciones más rápidas sobre el suelo. Un día caluroso en un aeródromo alto es el caso
clásico.

### 4.8 El triángulo del viento: método del punto ("wind up")

**Datos:** derrota verdadera (TC), TAS, dirección y velocidad del viento (de dónde viene).
**Resultado:** rumbo verdadero (TH), ángulo de corrección (WCA) y velocidad respecto al suelo (GS).

1. Pon la **dirección del viento** bajo el TRUE INDEX.
2. Lleva el **ojal** a un arco cómodo (p. ej. 100 kt) con la tarjeta.
3. Marca el **punto de viento** encima del ojal, a tantos nudos como la velocidad del viento.
4. Gira el disco hasta que la **TC** quede bajo el TRUE INDEX. El punto gira con él.
5. Desliza la tarjeta hasta que el punto caiga sobre el **arco de la TAS**.
6. Lee la **GS** bajo el ojal.
7. Lee la **deriva** con las líneas de deriva (o la escala del marco). Si el punto queda a la **derecha** de la línea
   central, corrige a la derecha: **TH = TC + WCA**. A la izquierda, resta.

**Ejemplo 1.** TC 000, TAS 120, viento 270/20: GS ≈ **118 kt**, WCA ≈ −9,6° (izquierda), TH ≈ **350°**.

**Ejemplo 2.** TC 090, TAS 120, viento 180/25: WCA ≈ +12° (derecha), TH ≈ **102°**, GS ≈ 117 kt.

**Ejemplo 3.** TC 135, TAS 110, viento 210/25: WCA ≈ +12,7° (derecha), TH ≈ **148°**, GS ≈ **101 kt**.

Fórmulas de comprobación (θ = Wdir − TC): `WCA = asin(w · sin θ / TAS)`, `GS = TAS · cos(WCA) − w · cos θ`.

### 4.9 Calcular un viento desconocido

Conoces TC, TH (rumbo que volaste), TAS y la GS medida.

1. Pon la **TC** bajo el TRUE INDEX y el ojal sobre la **GS**.
2. Calcula la deriva: **WCA = TH − TC**.
3. Marca un punto donde la **línea de deriva** (WCA) corta el **arco de la TAS**.
4. Gira el disco hasta que el punto quede en la línea central, **encima del ojal**.
5. La **dirección del viento** está bajo el TRUE INDEX; la **velocidad** es la distancia del punto al ojal.

**Ejemplo.** TC 090, TH 097, TAS 120, GS 108: WCA = +7°. Resultado: viento de **143°** a **18 kt**.

### 4.10 Un tramo completo del cuaderno de navegación

Cadena de rumbos: **TC → TH → MH → CH**.

| Paso | Operación |
|---|---|
| TC → TH | Corrección del viento: TH = TC + WCA |
| TH → MH | **Variación**: MH = TH + W (oeste) o − E (este). "West is best (add), east is least (subtract)" |
| MH → CH | **Desvío** de la brújula (tarjeta junto a ella): CH = MH + desvío W o − desvío E |

**Ejemplo.** Tramo de 85 NM, TC 135, TAS 110, viento 210/25, variación 6° W, desvío 2° E, consumo 9 GPH.

1. Rueda del viento: WCA +12,7°, **TH 148°**, **GS 101 kt**.
2. Variación 6° W: **MH = 148 + 6 = 154°**.
3. Desvío 2° E: **CH = 154 − 2 = 152°** (lo que lees en la brújula).
4. Cara de cálculo: 60 bajo 101 kt; 85 NM → **ETE ≈ 50,6 min** (0:51).
5. Combustible: 60 bajo 9 GPH; sobre 51 min lees **≈ 7,6 gal**.

## 5. Consejos de lectura

- Estima siempre antes de mover nada, y compara al final.
- Mira cuánto vale cada raya en la zona de la escala donde estás.
- Alinea con calma: un grado de giro del disco es un 0,6 % del valor. Un desalineado de 1° sobre 100 kt son 0,6 kt.
- Revisa que el número exterior y el interior que alineas son los que quieres (50 y 5 son la misma marca).
- En el lado del viento, comprueba que el punto cae justo sobre el arco de la TAS antes de leer.
- Anota cada resultado en el navlog, con sus unidades.

## 6. Errores frecuentes

1. Colocar mal la coma decimal.
2. Leer minutos como decimales de hora (1,5 h = 1:30, no 1:50).
3. Usar CAS o IAS en lugar de TAS en el lado del viento.
4. Poner la dirección **hacia donde va** el viento en lugar de **de donde viene**.
5. Corregir la deriva al lado equivocado.
6. Olvidar la reserva en problemas de combustible.
7. Mezclar unidades: NM con SM, litros con galones, kt con km/h.
8. Dar por buena la lectura sin estimación mental.
9. Confundir rumbos: aplicar la variación con el signo cambiado (West is best).

## 7. Cómo lo trabaja el simulador

| Nivel del simulador | Procedimientos |
|---|---|
| 1 · Conocer | Caras y partes, lectura de escalas, coma decimal, anillo de horas, ojal |
| 2 · Tiempo, velocidad, distancia | §4.1, §4.2, §4.3 |
| 3 · Combustible y conversiones | §4.4, §4.5 |
| 4 · Altitud y velocidad | §4.6, §4.7 |
| 5 · Viento | §4.8, §4.9 (y §4.10 en Práctica, tipo "navlog") |

Herramientas del simulador:

- **Modo explicar.** Activa "? Modo explicar" y toca cualquier parte (escala, índice, flecha, ojal…) para ver qué
  es, cómo se lee y por qué importa.
- **Muéstrame (Show me).** Anima los discos paso a paso hasta la solución, con una leyenda por paso, como las manos
  de un instructor sobre el E6B.
- **Práctica.** Problemas aleatorios y ilimitados (TSD, combustible, conversiones, TAS, DA, viento, tramo de
  navegación) con respuesta numérica y tolerancia de lectura (aprox. 2 %, ±2° en rumbos, ±3 kt en GS), rachas y
  "Muéstrame".
- **Cursor y lupa.** Ayudas de aprendizaje: el E6B de aluminio real no tiene cursor. Úsalos al principio para
  ver bien las rayas y luego intenta leer sin ellos.
- **Lápiz y borrar** (lado del viento): toca el disco para marcar un punto (máximo 3), con el botón de borrar para
  empezar de nuevo.

Las tolerancias aceptan una buena lectura del instrumento, no una estimación: son los márgenes con los que el E6B
real da respuestas aceptables en un examen.

## 8. Notas sobre el modelo de este simulador

- **TAS sin compresibilidad.** TAS = CAS / √σ, con σ la relación de densidad de la atmósfera ISA y la
  temperatura exterior. El E6B de esta cara no corrige la compresibilidad; a velocidades de aviación general
  la diferencia es despreciable.
- **Altitud de densidad** calculada con la atmósfera ISA (modelo de 6,8756·10⁻⁶ por pie), a partir de la PA y
  la OAT. Las reglas empíricas de bolsillo (120 ft por °C) dan valores algo distintos; ambos son válidos como
  estimación.
- **Flechas de conversión colocadas por razón.** NAUT 66, STAT 76, KM 12,2 · U.S. GAL 11,67, LITERS 44,17,
  FUEL LBS 70 (6 lb/gal), METERS 15,24, FEET 50. Las posiciones reales de las marcas varían según el fabricante y la
  edición.
- **Rango de escalas simplificado.** Las escalas van de 10 a 100; la tarjeta del viento cubre 30–270 kt y ±45° de
  deriva; la ventana de TAS de 0 a 20 000 ft; la de DA de −2 000 a 20 000 ft. No se incluyen la ventana de
  altitud verdadera, la cara de alta velocidad (Mach) ni las correcciones fuera de ruta.
- **Lectura.** Un E6B real se lee con una precisión de aproximadamente el 1 %; el cursor y la lupa del
  simulador la mejoran, por eso las tolerancias son moderadas.
