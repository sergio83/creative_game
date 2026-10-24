'use strict';

/*
 * Story: "Save Developer Day: The Odoo Loop".
 * Content only — world layout, cast, dialogue trees, scheduled events and endings.
 */
const Story = (() => {
  const E = Engine;
  const T = E.T;
  const say = (who, text) => E.say(who, text);
  const choose = (who, text, opts) => E.choose(who, text, opts);
  const flag = k => E.flag(k);
  const knows = k => E.knows(k);
  const loops = () => E.memory.loops;
  const $ = sel => document.querySelector(sel);

  // ---------------------------------------------------------------- the cast

  const cast = {
    // Pixel-art specs drawn by js/sprites.js, based on each person's photo.
    you: {
      name: 'Vos', role: 'Developer · atrapado en un loop',
      sprite: { skin: '#f0c09a', hair: '#3b2416', hairStyle: 'player', shirt: '#5b3f99', top: 'hoodie', pants: '#2a3550', headphones: true },
    },
    flor: {
      name: 'Flor', role: 'RRHH',
      sprite: { skin: '#f1c3a6', hair: '#6b3524', brow: '#4a2418', hairStyle: 'bangs', glasses: true, shirt: '#b04a6e', top: 'blouse', pants: '#2f3446', shoes: '#7a2e3a', sole: '#4a1820' },
    },
    alex: {
      name: 'Alex', role: 'CEO',
      sprite: { skin: '#e2a982', hair: '#1c1714', hairStyle: 'spiky', smile: true, shirt: '#a3a7ad', top: 'blazer', inner: '#a9c7f0', pants: '#2c3442' },
    },
    diego: {
      name: 'Diego', role: 'CTO · profe · runner',
      sprite: { skin: '#e6ae86', hair: '#4a3a30', hairStyle: 'bald', beard: 'short', beardColor: '#8a7462', smile: true, shirt: '#8b8e94', top: 'vneck', inner: '#f4f4f0', pants: '#39465a', shoes: '#f0f0f0', sole: '#ff5a5a' },
    },
    fede: {
      name: 'Fede', role: 'CGO · coleccionista de patos',
      sprite: { skin: '#f0c6a0', hair: '#5a3b26', brow: '#3b2a1e', hairStyle: 'receding', glasses: true, shirt: '#1f2a44', top: 'crew', sleeves: 'short', pants: '#343434' },
    },
    sergio: {
      name: 'Sergio', role: 'Integraciones · de vacaciones',
      sprite: { skin: '#eab995', hair: '#2b211c', hairStyle: 'messy', beard: 'goatee', beardColor: '#3b2c24', shirt: '#2e3036', top: 'collar', pants: '#2a2d35' },
    },
    dog: { name: 'El perro de Alex', role: 'Product Owner honorario', emoji: '🐶' },
    dev: { name: 'Dev de otro equipo', role: 'Especialista en workarounds', emoji: '🧔' },
    narrator: { name: '', role: '', emoji: '🕓' },
    system: { name: 'Sistema', role: '', emoji: '🖥️' },
  };

  // --------------------------------------------------------------- knowledge

  const knowledge = {
    restart: 'Reiniciar el backoffice no sirve: el backoffice está bien. Lo roto está entre nuestra API y Odoo.',
    quickfix: 'Subir el timeout solo hace que el error tarde más en aparecer.',
    logs: 'Los logs tienen 40.000 líneas de «Error al conectar con Odoo». Hay que filtrar.',
    note: 'Nota de Sergio: «revisar primero la autenticación; después, los cambios en la API».',
    diegoRepro: 'Diego no se mueve sin un caso mínimo reproducible: un error concreto de los logs.',
    authOk: 'La autenticación con Odoo anda bien. El problema está en otro lado: los cambios en la API.',
    authError: 'El error real: TODAS las llamadas a Odoo dan `400`. Ahora exige el header `X-Odoo-Company-Id` en cada request.',
    rootCause: 'Causa raíz (validada por Diego): la integración de nuestra API con Odoo (la que armó Sergio) no manda el header `X-Odoo-Company-Id`.',
    dependencies: 'Los patos de Fede: Timesheet y Backoffice → nuestra API → Odoo. Si cae Odoo, caen todos.',
    timesheet: 'Timesheet tampoco anda: las horas y las vacaciones pasan por nuestra API, y la API no puede hablar con Odoo.',
    vacation: 'Sergio no desapareció: está de vacaciones. El sistema no se enteró.',
    sameBug: 'Las vacaciones de Sergio y los recibos son el MISMO bug: se arregla y se verifica todo junto.',
    flow: 'Lo que necesita Flor: subir los recibos en el backoffice → nuestra API → Odoo → les llegan a los empleados para firmar. Ella verifica al final.',
    alexPriority: 'Con un diagnóstico en la mano, Alex prioriza el incidente y cancela la reunión.',
    dogKeyboard: 'A las 16:45 el perro de Alex pisa tu teclado y manda «LGTM 👍» a todo el equipo.',
    dogSchedule: 'A las 16:47 el perro se mete abajo del escritorio de Sergio. Algo olfateó.',
    sergioContact: 'Tenés el Discord personal de Sergio: `sergio_off`. «Solo si se prende fuego todo».',
    meeting: 'A las 16:48 Alex convoca una reunión de emergencia. Dura seis minutos y no decide nada.',
    diegoClass: 'Diego da clase por Zoom de 16:50 a 16:55. No se lo puede interrumpir.',
    trycatch: 'A las 16:56 alguien propone un `try/catch`. Spoiler: todo dice «enviado» y no le llega nada a nadie.',
    rewrite: 'Si le decís que sí a «reescribir todo», nadie arregla los recibos.',
    local: 'Arreglarlo solo en tu máquina = «en mi máquina anda». Hardcodeaste el company id de QA (1) y en producción es el 2: los recibos se fueron a QA. Necesitás que Diego lo valide.',
    hotfix: 'Deployar sin verificar dependencias rompe Timesheet: toda la empresa queda «de vacaciones».',
    timeout: 'A las 17:00 se termina todo. «Estamos investigando» no es un status.',
    secret: 'Sergio contestó desde la playa: «¿Probaron revisar la documentación?». La documentación está en su escritorio.',
  };

  const endingsCatalog = [
    { code: 'TIMEOUT_BUSINESS_HOURS_EXCEEDED', title: 'Estamos investigando' },
    { code: 'REGRESSION_DETECTED', title: 'El workaround definitivo' },
    { code: 'ENVIRONMENT_MISMATCH', title: 'Works on my machine' },
    { code: 'SCOPE_CREEP_DETECTED', title: 'Reescribimos todo' },
    { code: 'PRODUCTION_IS_NOW_A_FEATURE', title: 'Hotfix Friday' },
    { code: 'HUMAN_DEPENDENCY_DETECTED', title: 'Sergio no está', secret: true },
    { code: 'BUS_FACTOR > 1', title: 'No dependemos de un héroe' },
  ];

  // ------------------------------------------------------------------- world

  const X = {
    elevator: 135, flor: 540, sergioDesk: 800, frame: 975, myDesk: 1270, alex: 1700,
    whiteboard: 1180, diego: 2390, medals: 2440, sprint: 2610, coffee: 2800, ducks: 2930, fede: 3080, cooler: 3250,
  };

  const ZONES = [[0, 'Recepción'], [640, 'Open space'], [1560, 'Sala Ctrl+Z'], [2120, 'Rincón dev'], [2700, 'Cocina']];
  const zoneAt = x => ZONES.filter(([from]) => x >= from).pop()[1];

  function worldHTML() {
    const lights = [120, 470, 820, 1170, 1660, 1960, 2270, 2560, 2860, 3150];
    return `
      <div class="zone zone-beige" style="left:0;width:640px"></div>
      <div class="zone zone-green" style="left:640px;width:920px"></div>
      <div class="zone zone-navy" style="left:1560px;width:560px"></div>
      <div class="zone zone-beige" style="left:2120px;width:580px"></div>
      <div class="zone zone-tiles" style="left:2700px;width:600px"></div>
      ${[640, 1560, 2120, 2700].map(x => `<div class="pillar" style="left:${x}px"></div>`).join('')}
      <div class="ceiling"></div>
      ${lights.map(x => `<div class="ceiling-light" style="left:${x}px"></div>`).join('')}
      <div class="floor"></div>

      <!-- Recepción -->
      <div class="elevator spot" data-spot="door" style="left:70px"><div class="elevator-display">3</div></div>
      <div class="plant" style="left:240px"></div>
      <div class="window" style="left:330px;top:60px;width:270px;height:150px"></div>
      <div class="sign" style="left:300px;top:228px">RRHH · <em>Recibos: HOY</em></div>
      <div class="desk" style="left:330px">
        <div class="monitor is-error" id="flor-screen" style="left:24px">RECIBOS<br>✖ error al subir</div>
        <div class="mug red" style="left:150px"></div>
      </div>

      <!-- Open space -->
      <div class="poster" style="left:672px;top:84px;width:150px">NO TOCAR<br>PRODUCCIÓN<br>LOS VIERNES<small>(firmado: Sergio)</small></div>
      <div class="frame spot" data-spot="frame" style="left:910px;top:84px">
        <div data-face="sergio"></div>EMPLEADO<br>DEL MES<br><small>(todos los meses)</small>
      </div>
      <div class="chair" style="left:770px"></div>
      <div class="desk spot" data-spot="sergio-desk" style="left:700px">
        <div class="monitor" style="left:96px;font-size:13px">odoo_fix_<br>FINAL_v7_<br>ahora_si.py</div>
        <div class="postit" style="left:98px;bottom:118px;transform:rotate(-6deg)"></div>
        <div class="postit" style="left:162px;bottom:120px;transform:rotate(5deg)"></div>
      </div>
      <div class="board spot" data-spot="whiteboard" style="left:1060px;top:84px;width:240px">
        <b>ARQUITECTURA</b>RECIBOS → BACKOFFICE<br>→ API → ODOO<br><span class="red">y todo → Sergio</span>
      </div>
      <div class="poster" style="left:1340px;top:84px;width:170px;background:#4a1f1f">ODOO SE<br>ACTUALIZA<br>SOLO<small>(nadie nos preguntó)</small></div>
      <div class="desk spot" data-spot="my-desk" style="left:1170px">
        <div class="monitor is-error" id="my-screen" style="left:54px">BACKOFFICE<br>✖ Odoo</div>
        <div class="mug" style="left:166px"></div>
      </div>

      <!-- Sala Ctrl+Z -->
      <div class="sign boxed" style="left:1590px;top:110px">SALA<br>Ctrl+Z<small>(volver atrás)</small></div>
      <div class="logo-wall" style="left:1760px;top:80px">
        <canvas data-logo="34x31" style="width:170px;height:155px"></canvas>
        <img src="assets/cc-wordmark.svg" alt="Creative Coefficient">
      </div>
      <div class="tv" style="left:1990px;top:96px;width:110px;height:170px">
        <div class="tv-screen"><canvas data-logo="12x11"></canvas>
          <i style="left:12px;height:40px"></i><i style="left:42px;height:70px"></i><i style="left:72px;height:56px;background:#e2621b"></i>
        </div>
      </div>

      <!-- Rincón dev -->
      <div class="board navy small" style="left:2140px;top:96px;width:200px">
        <b>PATRONES DE DISEÑO II</b>- Singleton (como yo<br>&nbsp;&nbsp;en el running)<br>- Factory<br>- ¿Por qué todo es<br>&nbsp;&nbsp;un «Manager»?<br><span class="orange">Strava: 3.240 km</span>
      </div>
      <div class="desk" style="left:2180px">
        <div class="laptop" id="diego-screen" style="left:30px">{ arch }</div>
        <div class="mug" style="left:120px"></div>
      </div>
      <div class="medals spot" data-spot="medals" style="left:2365px;top:96px">
        <div class="medals-title">MEDALLERO</div>
        <div class="medals-bar"></div>
        <div class="medal-row">
          <i style="--rib:#e63946;--med:#f2c94c"><span>10K</span></i>
          <i style="--rib:#2d6fd6;--med:#cfd6de"><span>21K</span></i>
          <i style="--rib:#27ae60;--med:#f2c94c"><span>42K</span></i>
          <i style="--rib:#e2621b;--med:#c98a4b"><span>TREK</span></i>
        </div>
      </div>
      <div class="board spot small" data-spot="sprint" style="left:2535px;top:104px;width:150px">
        <b>OBJETIVO DEL SPRINT</b>✓ integrar Odoo<br>✓ celebrar<br>☐ tests
      </div>
      <div class="plant" style="left:2630px"></div>

      <!-- Cocina -->
      <div class="board navy" style="left:2730px;top:60px;width:230px">
        <b style="color:#1f3a8a">REGLAS DE COCINA</b>1. El viernes no<br>&nbsp;&nbsp;&nbsp;se deploya<br>2. No calentar<br>&nbsp;&nbsp;&nbsp;pescado<br>3. Lavá tu taza<br><span class="red">4. sudo no vale</span>
      </div>
      <div class="wall-text" style="left:2990px;top:84px">Hay 10 tipos de personas:<br>las que entienden binario<br>y las que no.</div>
      <div class="sign pink" style="left:3000px;top:188px">17:00 ¡DESENCHUFATE!</div>
      <div class="coffee spot" data-spot="coffee" style="left:2760px"></div>
      <div class="desk" style="left:2870px">
        <div class="ducks" id="ducks" style="left:12px">
          <div class="duck" data-duck></div><div class="duck" data-duck="#5ab1e8"></div><div class="duck" data-duck="#5fd07a"></div><div class="duck small" data-duck></div>
        </div>
        <div class="boardgame" style="left:118px"></div>
        <div class="rubik" style="left:170px"></div>
      </div>
      <div class="ducks-hit spot" data-spot="ducks" style="position:absolute;left:2870px;bottom:150px;width:150px;height:40px"></div>
      <div class="fridge" style="left:3110px"></div>
      <div class="cooler spot" data-spot="cooler" style="left:3226px"></div>
    `;
  }

  const inClass = () => E.time() >= T(50) && E.time() < T(55);

  function dogSpot() {
    const t = E.time();
    if (t < T(44)) return null;
    if (t < T(45)) return { x: 300, mode: '' };
    if (t < T(47)) return { x: X.myDesk - 50, mode: 'desk' };
    if (t < T(52)) return { x: 760, mode: 'under' };
    return { x: 2860, mode: '' };
  }

  function actors() {
    const dog = dogSpot();
    return [
      { id: 'flor', x: X.flor, bubble: flag('won') ? '✉️' : '📄' },
      { id: 'alex', x: flag('alex') ? 1860 : X.alex, bubble: E.time() >= T(58) && !flag('won') ? '¿Cuánto falta?' : '' },
      { id: 'diego', x: X.diego, bubble: inClass() ? '🎓 En clase' : '' },
      { id: 'fede', x: X.fede, bubble: '🦆' },
      {
        id: 'dog', x: dog ? dog.x : 60, gone: !dog, facing: 1,
        classes: [['is-on-desk', dog?.mode === 'desk'], ['is-under', dog?.mode === 'under']],
      },
    ];
  }

  function spots() {
    const list = [
      { id: 'door', x: X.elevator, label: 'Tomar el ascensor' },
      { id: 'flor', x: X.flor, label: 'Hablar con Flor' },
      { id: 'sergio-desk', x: X.sergioDesk, label: 'Revisar el escritorio de Sergio' },
      { id: 'frame', x: X.frame, label: 'Mirar el cuadro' },
      { id: 'my-desk', x: X.myDesk, label: 'Usar tu compu' },
      { id: 'alex', x: flag('alex') ? 1860 : X.alex, label: 'Hablar con Alex' },
      { id: 'coffee', x: X.coffee, label: 'Usar la cafetera' },
      { id: 'whiteboard', x: X.whiteboard, label: 'Leer la pizarra' },
      { id: 'diego', x: X.diego, label: inClass() ? 'Mirar a Diego (está en clase)' : 'Hablar con Diego' },
      { id: 'medals', x: X.medals, label: 'Mirar el medallero de Diego' },
      { id: 'sprint', x: X.sprint, label: 'Leer el objetivo del sprint' },
      { id: 'ducks', x: X.ducks, label: 'Mirar los patos de Fede' },
      { id: 'fede', x: X.fede, label: 'Hablar con Fede' },
      { id: 'cooler', x: X.cooler, label: 'Tomar agua' },
    ];
    const dog = dogSpot();
    if (dog) list.push({ id: 'dog', x: dog.x, label: dog.mode === 'under' ? 'Ver qué hace el perro' : 'Acariciar al perro' });
    return list;
  }

  function renderScene() {
    const screen = $('#my-screen');
    if (screen) {
      screen.className = 'monitor ' + (flag('won') ? 'is-ok' : 'is-error');
      screen.innerHTML = flag('won') ? 'BACKOFFICE<br>✔ 200 OK' : flag('terminal') ? '&gt;_ bash<br>LGTM 👍' : 'BACKOFFICE<br>✖ Odoo';
    }
    const flor = $('#flor-screen');
    if (flor) {
      flor.className = 'monitor ' + (flag('won') ? 'is-ok' : 'is-error');
      flor.innerHTML = flag('won') ? 'RECIBOS<br>✔ 45/45' : 'RECIBOS<br>✖ error al subir';
    }
    const diego = $('#diego-screen');
    if (diego) {
      diego.className = 'laptop' + (inClass() ? ' is-zoom' : '');
      diego.innerHTML = inClass() ? 'ZOOM' : '{ arch }';
    }
    const ducks = $('#ducks');
    if (ducks) {
      ducks.classList.toggle('is-fallen', flag('ducksFallen') && !flag('fede'));
      ducks.classList.toggle('is-ordered', flag('fede'));
    }
  }

  function banner() {
    const left = E.END - E.time();
    const head = flag('won')
      ? '<b>INCIDENTE:</b> resuelto. Los recibos salieron. Nadie lo puede creer.'
      : `<b>INCIDENTE:</b> Faltan ${left} min para mandar los recibos. Odoo se actualizó y Sergio no aparece.`;
    const forecast = [
      [T(45), 'dogKeyboard', 'el perro pisa tu teclado'],
      [T(47), 'dogSchedule', 'el perro va al escritorio de Sergio'],
      [T(48), 'meeting', 'reunión de emergencia'],
      [T(50), 'diegoClass', 'Diego entra a clase'],
      [T(56), 'trycatch', 'aparece el del try/catch'],
    ].find(([at, key]) => at >= E.time() && knows(key) && !flag('won'));
    return forecast ? `${head}<br><b>RECORDÁS:</b> ${E.fmt(forecast[0])} → ${forecast[2]}.` : head;
  }

  function objectives() {
    return [
      { label: 'Que Flor mande los recibos antes de las 17:00', done: flag('won'), visible: true },
      { label: 'Entender qué necesita Flor exactamente', done: flag('florScope'), visible: true },
      { label: 'Conseguir un error concreto en los logs', done: flag('repro'), visible: knows('diegoRepro') || knows('note') || knows('logs') },
      { label: 'Que Diego valide la causa raíz', done: flag('diego'), visible: knows('diegoRepro') || knows('authError') },
      { label: 'Confirmar con Fede que lo de Sergio es el mismo bug', done: flag('fede'), visible: (knows('vacation') && knows('timesheet')) || knows('hotfix') },
      { label: 'Que Alex priorice el incidente', done: flag('alex'), visible: knows('meeting') || knows('rewrite') || knows('rootCause') },
      { label: 'Deployar el fix validado desde tu compu', done: flag('won'), visible: knows('rootCause') || knows('local') },
    ];
  }

  // ----------------------------------------------------------------- helpers

  /* Generic conversation loop: options are { label, cost?, run, when?, done?, tone?, leave? }. */
  async function talk(name, options) {
    for (;;) {
      if (E.over()) return;
      const list = options().filter(o => o.when !== false);
      list.push({ label: 'Nada, después seguimos.', bye: true, tone: 'bye' });
      const pick = await choose('you', `¿Qué le decís a ${name}?`, list);
      if (!pick || pick.bye) return;
      await pick.run();
      if (E.over()) return;
      if (pick.cost) {
        const alive = await E.spend(pick.cost);
        if (!alive || E.interrupted()) return;
      }
      if (pick.leave) return;
    }
  }

  async function menu(prompt, options) {
    for (;;) {
      if (E.over()) return;
      const list = options().filter(o => o.when !== false);
      list.push({ label: 'Volver.', bye: true, tone: 'bye' });
      const pick = await choose('you', prompt, list);
      if (!pick || pick.bye) return;
      await pick.run();
      if (E.over()) return;
      if (pick.cost) {
        const alive = await E.spend(pick.cost);
        if (!alive || E.interrupted()) return;
      }
      if (pick.leave) return;
    }
  }

  // ------------------------------------------------------------------- intro

  async function intro() {
    const n = loops();
    if (n === 1) {
      await say('narrator', 'Viernes 23 de octubre. 16:42. Creative Coefficient.');
      await say('narrator', 'Odoo se actualiza solo, cuando quiere y sin pedir permiso. Hoy, viernes a las 3 AM, quiso.');
      await say('narrator', 'Faltan 18 minutos para que termine la jornada. Nada puede salir mal.');
      await say('flor', 'Che, ¿Sergio está?');
      await say('you', 'Hola Flor. Ehh… no lo vi. ¿Pasó algo?');
      await say('flor', 'Odoo se actualizó y el backoffice me da error. Tengo que mandar los recibos de sueldo antes de las 17:00.');
      await say('flor', '¿Le podés preguntar a Sergio? Esto Sergio lo arregla en cinco minutos.');
      await say('narrator', 'Caminá con ←/→ e interactuá con E. Las acciones importantes consumen minutos (⏱). Caminar es gratis. A las 17:00 se termina el día.');
      return;
    }
    await say('flor', 'Che, ¿Sergio está?');
    if (n === 2) {
      await say('you', '*(¿Otra vez? 16:42. Flor. Sergio. Los recibos… Yo ya viví esto.)*');
      await say('you', '*(Nadie más se acuerda. Solo yo. Bueno: ahora sé lo que va a pasar.)*');
      await say('narrator', 'Lo que aprendiste quedó en tu 📓 Cuaderno (tecla N). El día se reinicia; tu memoria, no.');
      return;
    }
    const pick = await choose('you', `*(Loop #${n}. Ya me sé este diálogo de memoria.)*`, [
      { label: 'Dejame adivinar: Odoo, los recibos y que le pregunte a Sergio.', id: 'smart' },
      { label: 'Hola Flor. ¿Qué pasó?', id: 'normal' },
    ]);
    if (pick?.id === 'smart') {
      await say('flor', '… ¿Cómo sabías?');
      await say('you', 'Intuición de developer.');
      if (n >= 5) await say('flor', 'Me das un poquito de miedo.');
    } else {
      await say('flor', 'Odoo se actualizó y el backoffice me da error. Tengo que mandar los recibos antes de las 17:00. Pero si ayer funcionaba.');
    }
  }

  // -------------------------------------------------------------------- Flor

  async function flor() {
    if (flag('won')) {
      await say('flor', '45 de 45. Y Sergio figura de vacaciones. Todo en orden. Me voy a tomar un café como si nada.');
      return;
    }
    const openers = ['Pero si ayer funcionaba.', '¿Le podés preguntar a Sergio?', 'No sé qué tocó la actualización. Yo solamente necesito mandar los recibos.'];
    await say('flor', openers[(E.count('flor') - 1) % openers.length]);
    await talk('Flor', () => [
      {
        label: '¿Qué necesitás exactamente que funcione?', cost: 1, done: flag('florScope'), tone: flag('florScope') ? '' : 'key',
        run: async () => {
          await say('flor', 'Yo subo los recibos en el backoffice. El backoffice se los pasa a nuestra API, la API los manda a Odoo, y Odoo se los envía a cada empleado para que los firme.');
          await say('flor', 'Sergio me lo dibujó una vez en una servilleta. Era lindo. Tenía flechitas. Hoy me da error al subir el primero.');
          await say('flor', 'Si se suben, yo verifico que les lleguen a todos para firmar. Eso sí lo sé hacer.');
          await say('you', '*(Ok: backoffice → nuestra API → Odoo → empleados. Y Flor es la que valida al final.)*');
          E.setFlag('florScope');
          E.learn('flow');
        },
      },
      {
        label: '¿Dónde está Sergio?',
        run: async () => {
          await say('flor', 'Ni idea. Siempre está. Es como el Wi-Fi: solo notás que existe cuando no anda.');
          if (loops() >= 2 || knows('timesheet')) {
            await say('flor', 'Ahora que lo pienso… el mes pasado me comentó algo de unas vacaciones.');
            await say('flor', '¡Pero en el sistema figura disponible! Así que no puede ser. El sistema no miente.');
            await say('you', '*(El sistema, justamente hoy, miente bastante.)*');
            E.learn('vacation');
          }
        },
      },
      {
        label: '¿No se pueden mandar los recibos a mano?',
        run: async () => {
          await say('flor', 'Son 45 recibos. Con Ctrl+C, Ctrl+V llego para el aguinaldo.');
          await say('flor', '¿Por fax? ¿Tenemos fax? Sergio seguro sabe si tenemos fax.');
        },
      },
      {
        label: 'Tranqui, ya lo resolvemos.',
        run: async () => {
          await say('flor', 'Eso dijo Sergio la última vez. Y lo resolvió.');
          await say('flor', 'Vos sos… ¿vos? Ok. Confío. Un poquito.');
        },
      },
    ]);
  }

  // -------------------------------------------------------------------- Alex

  async function scopeCreep() {
    await say('narrator', 'Alex abre un Miro. En treinta segundos hay un roadmap de tres trimestres.');
    await say('alex', '¡Kickoff ya! Proyecto «Backoffice 2.0: Phoenix». Microservicios, eventos, IA. Y un logo.');
    await say('narrator', 'Se convoca una reunión de kickoff. Se crea un canal. Se crea un logo. Se crea un canal para hablar del logo.');
    await say('flor', '¿Y los recibos?');
    await say('alex', 'Están en el roadmap. Q3.');
    await say('fede', 'Traje un pato nuevo. Este representa el presupuesto.');
    await say('narrator', 'El pato se cae de la mesa.');
    E.ending({
      code: 'SCOPE_CREEP_DETECTED', title: 'Final: Reescribimos todo', kind: 'bad', lesson: 'rewrite',
      text: ['El equipo decidió rehacer el backoffice para solucionar el problema «de raíz».', 'El sistema de recibos sigue roto. Pero el roadmap quedó hermoso.'],
    });
  }

  async function alexPriority() {
    await say('alex', '¿Me estás pidiendo que cancele la reunión de emergencia?');
    await say('you', 'Sí. Y que nadie deploye nada más hasta que esto esté resuelto. Ni la feature nueva del login.');
    await say('alex', '…');
    await say('alex', 'Está bien. Es la decisión más estratégica que tomé hoy. Prioridad uno: Odoo. Todo lo demás, congelado.');
    await say('alex', '¿Cuánto falta?');
    await say('you', 'Si nadie improvisa, diez minutos.');
    await say('alex', 'Me encanta.');
    E.setFlag('alex');
    E.learn('alexPriority');
  }

  async function alex() {
    if (flag('won')) {
      await say('alex', '¿Cuánto falta? … No, nada. Me salió de costumbre. Ya está todo. Qué raro se siente.');
      return;
    }
    if (E.count('alex') === 1) {
      await say('alex', '¿Cuánto falta?');
      await say('you', '¿Para qué?');
      await say('alex', 'Para lo que sea que esté roto. Siempre falta algo.');
    } else {
      await say('alex', flag('alex') ? 'Prioridad uno, todo lo demás congelado. ¿Cuánto falta?' : '¿Cuánto falta?');
    }
    await talk('Alex', () => [
      {
        label: '¿Sabés dónde está Sergio?',
        run: async () => {
          await say('alex', 'Debe estar ayudando a alguien. Un poquito acá, un poquito allá.');
          await say('alex', 'Sergio es nuestro microservicio más confiable. Nunca tuvo un downtime.');
          await say('you', '*(Hasta hoy.)*');
        },
      },
      {
        label: 'Se rompió la integración con Odoo.', when: !flag('alex'),
        run: async () => {
          await say('alex', '¿Esto nos puede pasar con otros clientes?');
          await say('you', 'Cada vez que Odoo se actualice solo… probablemente. Y no avisa.');
          await say('alex', '¡Entonces es una oportunidad! ¿Y si aprovechamos para modernizar toda la arquitectura? Microservicios, eventos, IA. Blockchain si sobra tiempo.');
          const pick = await choose('alex', '¿Qué decís? ¿Reescribimos todo?', [
            { label: '¡Sí! Reescribamos todo.', id: 'yes', tone: 'risky' },
            { label: knows('rewrite') ? '*(Ya sé cómo termina esto.)* Primero entendamos qué se rompió.' : 'Primero entendamos qué se rompió.', id: 'no' },
          ]);
          if (pick?.id === 'yes') return scopeCreep();
          await say('alex', 'Me gusta. Pensamiento estratégico. Te escucho cuando tengas algo. ¿Cuánto falta?');
        },
      },
      {
        label: 'Diego validó la causa. Necesito que priorices el incidente y congeles todo lo demás.',
        cost: 1, tone: 'key', when: flag('diego') && !flag('alex'),
        run: alexPriority,
      },
      {
        label: 'Ese «LGTM» de #general lo mandó tu perro.', when: flag('lgtm'),
        run: async () => {
          await say('alex', 'Bueno, es un perro muy senior. Tiene más contexto que la mitad del equipo.');
          await say('alex', 'Y nunca pidió un aumento.');
          E.egg('lgtm', 'el perro aprueba PRs');
        },
      },
    ]);
  }

  // ------------------------------------------------------------------- Diego

  async function diegoDiagnosis() {
    await say('diego', 'A ver… `POST /api/v2/payslips → 400 Bad Request: missing required header X-Odoo-Company-Id`.');
    await say('diego', 'Ahí está. Odoo se actualizó solo hoy a las 3 de la mañana y ahora exige un header nuevo en todas las llamadas: `X-Odoo-Company-Id`. Básicamente, Odoo nos pregunta «¿y vos de qué empresa sos?».');
    await say('diego', 'Nuestra API, la integración que armó Sergio, no lo manda. Odoo rechaza cada request. No es un endpoint: es todo.');
    await say('diego', 'Eso no es un síntoma: es la causa. Se agrega el header en la API, en un solo lugar, y se prueba el flujo completo: backoffice y Timesheet.');
    await say('diego', 'Lo hacemos en un branch, corremos el flujo completo en staging y recién ahí producción. Nada de try/catch mágicos.');
    await say('you', '*(Por fin alguien dijo «causa raíz» y no «Sergio».)*');
    E.setFlag('diego');
    E.learn('rootCause');
  }

  async function diego() {
    if (inClass()) {
      await say('narrator', 'Diego está dando clase por Zoom: «…y por eso, chicos, nunca dependan de una sola persona».');
      await say('narrator', 'Te hace señas: vuelve a las 16:55.');
      E.learn('diegoClass');
      return;
    }
    if (flag('won')) {
      await say('diego', 'Incidente documentado, test de contrato agregado. Me voy a correr. Literalmente.');
      return;
    }
    if (flag('diego')) {
      await say('diego', flag('alex') ? 'Cuando quieras deployamos desde tu compu. Flujo completo, nada de magia.' : '¿Ya hablaste con Alex? Sin prioridad, esto se pierde entre otras diez cosas.');
    } else if (E.time() >= T(55)) {
      await say('diego', 'Recién termino la clase. Tengo veinte minutos antes de salir a correr. ¿Qué pasa?');
    } else {
      await say('diego', 'Tengo unos minutos antes de dar clase y cuarenta antes de salir a correr. ¿Qué pasa?');
    }
    await talk('Diego', () => [
      {
        label: 'Odoo no anda. Ayudame.', cost: 1, when: !flag('repro') && !flag('diego'),
        run: async () => {
          await say('diego', '¿Cuál es el caso mínimo reproducible?');
          await say('you', 'Que… no anda.');
          await say('diego', 'Eso no explica el problema, explica un síntoma. Traeme un error concreto de los logs y lo vemos.');
          E.learn('diegoRepro');
        },
      },
      {
        label: 'Odoo ahora exige el header `X-Odoo-Company-Id` en todo. Confiá en mí.', when: knows('rootCause') && !flag('repro') && !flag('diego'),
        run: async () => {
          await say('diego', 'Puede ser. Mostrame el log.');
          await say('diego', 'Sin evidencia, es una opinión con buena autoestima.');
        },
      },
      {
        label: 'Mirá este error de los logs: `400`, falta el header `X-Odoo-Company-Id`.', cost: 2, tone: 'key', when: flag('repro') && !flag('diego'),
        run: diegoDiagnosis,
      },
      {
        label: '¿Y Sergio?',
        run: async () => {
          await say('diego', 'Seguro está investigando la actualización. Desaparece y vuelve con un script que se llama FINAL_v7.');
          if (knows('vacation')) {
            await say('you', 'Está de vacaciones.');
            await say('diego', '¿Y el sistema lo tiene como disponible? Interesante. Mismo síntoma: algo no está sincronizando.');
          }
        },
      },
      {
        label: '¿Y si le agregamos un workaround?',
        run: async () => {
          await say('diego', 'Si agregamos otro workaround, ¿cuál es la complejidad ciclomática de nuestra operación?');
          await say('you', '¿…Alta?');
          await say('diego', 'Exponencial.');
        },
      },
      {
        label: '¿Cómo hacés para dar clase, revisar arquitectura y entrenar?',
        run: async () => {
          await say('diego', 'Paralelismo.');
          await say('diego', 'Aunque a veces es concurrencia. Y se nota.');
        },
      },
    ]);
  }

  // ---------------------------------------------------------------- Fede

  async function ducksDemo() {
    await say('fede', 'Cada pato es un sistema. Este es Timesheet. Este, el backoffice. Este, nuestra API. Y este chiquito es Odoo: chiquito, pero todos dependen de él.');
    await say('fede', 'Mirá qué pasa si muevo el pato de Odoo.');
    E.setFlag('ducksFallen');
    E.sfx('fall');
    await say('narrator', 'Fede empuja el pato de Odoo. Cae la API. Caen el backoffice y Timesheet. El chiquito rueda hasta el piso.');
    await say('fede', '¿Ves? Nunca fue un problema de patos. Era un problema de dependencias.');
    await say('fede', 'Si Odoo cambió, nuestra API no puede hablar con él. Y si la API no habla, ni el backoffice sube recibos ni Timesheet registra quién trabaja… ni quién está de vacaciones.');
    E.learn('dependencies');
    E.learn('timesheet');
  }

  async function fedeBoard() {
    await say('fede', 'Juguemos. Tablero de dependencias.');
    await say('narrator', 'Fede pone los patos en fila sobre el tablero y les pega etiquetas: TIMESHEET, BACKOFFICE, API, ODOO.');
    await say('fede', 'Las vacaciones de Sergio quedaron pendientes porque Timesheet también pasa por nuestra API: mismo `400`, mismo `X-Odoo-Company-Id` faltante. Mismo bug, otro pato.');
    await say('fede', 'Ojo: cuando la API vuelva a hablar con Odoo, va a mandar de golpe toda la cola de Timesheet del día. Si nadie revisa cómo, un viernes, es un juego de mesa sin reglas.');
    await say('fede', 'Cuando deployes, verificamos los cuatro patos juntos. En orden.');
    await say('you', '*(Por primera vez en la historia, los patos tienen sentido.)*');
    E.setFlag('fede');
    E.learn('sameBug');
  }

  async function rubik() {
    const n = E.count('rubik');
    if (n === 1) await say('fede', '*(girando el cubo)* Un minuto cuarenta y dos. Lento. Estoy pensando en Odoo.');
    else if (n === 2) await say('fede', 'Cuarenta y ocho segundos. El cubo, a diferencia de Odoo, tiene solución documentada.');
    else if (n === 3) await say('fede', 'Doce segundos. ¿Viste? Cuando ya sabés lo que va a pasar, todo es más rápido.');
    else {
      await say('narrator', 'Fede resuelve el cubo mientras hace malabares con tres patos.');
      await say('fede', 'Tres segundos. No me aplaudas a mí. Aplaudí a los patos.');
      E.egg('rubik', 'Rubik con malabares');
    }
  }

  async function fede() {
    if (flag('won')) {
      await say('fede', 'Los cuatro patos en orden. Hoy ninguno se cayó. Lo voy a anotar en la historia de la empresa.');
      return;
    }
    const openers = ['¿Y si el bug es que estamos jugando al juego equivocado?', 'Un pato nunca falla. Como mucho, tiene un comportamiento no documentado.', 'Te falta información. Volvé a empezar.'];
    await say('fede', openers[(E.count('fede') - 1) % openers.length]);
    await talk('Fede', () => [
      { label: '¿Qué hacés con esos patos?', cost: 1, done: knows('dependencies'), run: ducksDemo },
      {
        label: 'Las vacaciones de Sergio y lo de Odoo… ¿son el mismo bug?', cost: 2, tone: 'key',
        when: knows('vacation') && knows('timesheet') && flag('repro') && !flag('fede'),
        run: fedeBoard,
      },
      {
        label: '¿Sabés dónde está Sergio?',
        run: async () => {
          await say('fede', 'Te falta información. Volvé a empezar.');
          await say('you', '¿Qué?');
          await say('fede', 'Digo, del cubo. Volvé a empezar el cubo.');
          if (loops() >= 2) {
            await say('fede', '… ¿Primera vez que vivís esta tarde?');
            await say('you', '… ¿Por qué preguntás?');
            await say('fede', 'Por nada. Los patos hablan.');
          }
        },
      },
      { label: 'Ese cubo… ¿cuánto tardás?', run: rubik },
      {
        label: '¿Cómo hacés malabares y explicás dependencias a la vez?',
        run: async () => {
          await say('fede', 'Es fácil. Cada pato tiene su propio estado.');
          E.sfx('fall');
          await say('narrator', 'Un pato cae al piso. Fede lo mira.');
          await say('fede', 'Bueno, casi siempre.');
          E.egg('juggling', 'estado compartido entre patos');
        },
      },
      {
        label: '¿Me enseñás a resolver el cubo?', when: E.memory.eggs.includes('rubik'),
        run: async () => {
          await say('fede', 'Primero tenemos que resolver Odoo. Después vemos si podemos resolver tu arquitectura cognitiva.');
        },
      },
    ]);
  }

  // ----------------------------------------------------------------- the dog

  async function dogPostit() {
    await say('narrator', 'Te agachás. El perro sale de abajo del escritorio de Sergio con un post-it babeado en la boca.');
    await say('system', 'Post-it: «Discord personal: `sergio_off` — SOLO si se prende fuego todo».');
    await say('you', '*(¿Esto cuenta como que se prende fuego todo? Esto cuenta.)*');
    E.setFlag('postit');
    E.learn('sergioContact');
  }

  async function dog() {
    const spot = dogSpot();
    if (!spot) return;
    if (spot.mode === 'under' && !flag('postit')) {
      await dogPostit();
      await E.spend(1);
      return;
    }
    if (spot.mode === 'desk') {
      await say('narrator', 'El perro está sentado sobre tu teclado. Ya escribió `ññññññññ` en la terminal. Mejor no lo muevas: parece que está deployando.');
      return;
    }
    if (E.time() >= T(52)) {
      await say('narrator', 'El perro persigue un pato de goma alrededor del escritorio de Fede. El pato, por primera vez, es más rápido que un deploy.');
      return;
    }
    await say('narrator', 'Le rascás la cabeza. El perro te mira con más empatía que cualquier sistema de tickets.');
  }

  // ------------------------------------------------------------ Sergio desk

  async function sergioDesk() {
    const dogUnder = dogSpot()?.mode === 'under' && !flag('postit');
    await menu('El escritorio de Sergio. La silla vacía. ¿Qué revisás?', () => [
      {
        label: 'Mirar el escritorio.',
        run: async () => {
          await say('narrator', 'Scripts impresos, un diagrama en una servilleta y una pestaña abierta: `odoo_fix_FINAL_v7_ahora_si.py`.');
          await say('narrator', 'La taza está seca. El estado del chat dice «disponible».');
          await say('you', '*(¿Sergio es un developer, un sistema de integración humano o un microservicio que adquirió conciencia?)*');
        },
      },
      {
        label: 'Leer los post-its del monitor.', cost: 1, done: knows('note'), tone: knows('note') ? '' : 'key',
        run: async () => {
          await say('system', '«Si alguna vez Odoo deja de funcionar, no fuimos nosotros: Odoo se actualiza solo. Revisar primero la autenticación. Si eso no funciona, revisar los cambios en la API. Y no deployar a las apuradas un viernes.»');
          await say('system', 'Debajo, otro post-it: «Odoo nunca avisa cuando se actualiza. Si estás leyendo esto, ya se actualizó.»');
          await say('you', '*(Gracias, Sergio del pasado. Autenticación primero, después la API. Eso se busca en los logs.)*');
          E.learn('note');
        },
      },
      {
        label: 'Mirar su timesheet.', cost: 1,
        run: async () => {
          await say('system', 'Timesheet de Sergio — esta semana:\n· `Documentar la integración con Odoo` — 0 h *(pendiente desde 2019)*\n· `Dejar todo listo para irme de vacaciones` — 8 h\n· `Dejar todo listo (ahora sí)` — 4 h\n· `Dejar todo listo (ahora sí que sí)` — 4 h\n· `🏖️` — Odoo dice: «disponible»');
          await say('system', 'Solicitud de licencia: Vacaciones 23/10 → 06/11 · Estado: `PENDIENTE DE SINCRONIZACIÓN CON ODOO`');
          await say('you', '… Sergio no desapareció. Está de vacaciones. Y Odoo no se enteró.');
          E.learn('vacation');
          E.learn('timesheet');
          E.egg('timesheet', 'el timesheet de Sergio');
        },
      },
      {
        label: 'Sentarse en su silla.',
        run: async () => {
          await say('narrator', 'Te sentás. Sentís el peso de la responsabilidad. Y un resorte.');
          await say('you', 'No. Esta silla no es para mí. Todavía.');
        },
      },
      {
        label: dogUnder ? 'Ver qué olfatea el perro abajo del escritorio.' : 'Buscar abajo del escritorio.',
        cost: dogUnder ? 1 : 0, leave: dogUnder,
        run: async () => {
          if (dogUnder) return dogPostit();
          await say('narrator', 'Pelusa, un cable HDMI de 2014 y un pato de goma que claramente se escapó del escritorio de Fede.');
        },
      },
    ]);
  }

  // ---------------------------------------------------------------- your PC

  function spamLines(n) {
    const lines = [];
    for (let i = 0; i < n; i++) lines.push({ cls: 'err', text: `[16:${String(30 + (i % 12)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}] Error al conectar con Odoo` });
    return lines;
  }

  function searchLogs(raw) {
    const q = raw.trim().toLowerCase();
    if (!q) return { lines: [...spamLines(14), { cls: 'dim', text: '… y 39.986 líneas más, exactamente iguales.' }] };
    if (/warn/.test(q)) {
      return {
        lines: [
          { cls: 'dim', text: '1 resultado.' },
          { cls: 'warn', text: '[09:00:00] WARNING: Sergio está de vacaciones' },
          { cls: 'me', text: '> —No puede ser tan fácil.' },
        ],
        effect: () => { E.learn('vacation'); E.egg('warning', 'el único WARNING'); },
      };
    }
    if (/auth|401|autent|login|token/.test(q)) {
      return {
        lines: [
          { cls: 'dim', text: '2 resultados.' },
          { cls: '', text: '[16:41:06] INFO odoo.auth POST /api/v2/auth → 200 OK (token válido hasta 2027)' },
          { cls: '', text: '[16:41:06] INFO api.odoo-integration (Sergio, 2019) — autenticado' },
          { cls: 'me', text: '> La autenticación anda. Siguiente post-it: los cambios en la API.' },
        ],
        effect: () => E.learn('authOk'),
      };
    }
    if (/api|header|company|400|x-odoo|empresa|payslip|recibo/.test(q)) {
      return {
        lines: [
          { cls: 'dim', text: '3 resultados.' },
          { cls: '', text: '[03:00:12] INFO odoo.cloud instancia actualizada automáticamente. Release notes: «all API requests now require the X-Odoo-Company-Id header».' },
          { cls: 'err', text: "[16:41:07] ERROR api → odoo POST /api/v2/payslips → 400 Bad Request: missing required header 'X-Odoo-Company-Id'" },
          { cls: 'err', text: '[16:41:07] ERROR api.odoo-integration origen=backoffice headers={ Authorization, Content-Type } (sin X-Odoo-Company-Id)' },
          { cls: 'me', text: '> Esto es un error concreto. Diego va a querer ver esto.' },
        ],
        effect: () => { E.setFlag('repro'); E.learn('authError'); },
      };
    }
    if (/timesheet|sync|vacac|licen/.test(q)) {
      return {
        lines: [
          { cls: 'dim', text: '2 resultados.' },
          { cls: 'err', text: "[16:40:00] ERROR api → odoo POST /api/v2/leaves (origen=timesheet) → 400: missing header 'X-Odoo-Company-Id' — último OK: jueves 22/10 23:58." },
          { cls: 'warn', text: '[16:40:00] WARN leave_request #4417 (Sergio, 23/10 → 06/11) PENDING — reintentando desde las 04:00 (sync nocturno).' },
        ],
        effect: () => { E.setFlag('repro'); E.learn('timesheet'); E.learn('vacation'); E.learn('authError'); },
      };
    }
    if (/sergio/.test(q)) {
      return {
        lines: [
          { cls: 'dim', text: '3 resultados.' },
          { cls: 'warn', text: '[09:00:00] WARNING: Sergio está de vacaciones' },
          { cls: 'warn', text: '[16:40:00] WARN leave_request #4417 (Sergio, 23/10 → 06/11) PENDING' },
          { cls: '', text: '[16:41:00] INFO presence.sergio = "available" (fuente: Odoo, desactualizado)' },
        ],
        effect: () => { E.learn('vacation'); E.learn('timesheet'); },
      };
    }
    if (/error/.test(q)) {
      return { lines: [{ cls: 'dim', text: '40.001 resultados.' }, ...spamLines(8), { cls: 'err', text: '[16:42:00] ERROR: demasiados errores para mostrar. Probá con algo más específico.' }] };
    }
    if (/odoo/.test(q)) return { lines: [{ cls: 'dim', text: '40.000 resultados. Todos dicen lo mismo. Odoo está en todos lados, como el aire.' }] };
    if (/fix|final/.test(q)) return { lines: [{ cls: '', text: '[16:20:00] INFO ejecutando odoo_fix_FINAL_v7_ahora_si.py … archivo no encontrado (¿FINAL_v8?)' }] };
    if (/pato|duck/.test(q)) return { lines: [{ cls: '', text: '[16:33:12] DEBUG 🦆 quack' }], effect: () => E.egg('quack', 'quack en los logs') };
    if (/lgtm|perro|dog/.test(q)) {
      return flag('lgtm')
        ? { lines: [{ cls: '', text: '[16:45:00] INFO aprobación recibida: «LGTM 👍» de usuario «alex-dog»' }] }
        : { lines: [{ cls: 'dim', text: '0 resultados. (Todavía.)' }] };
    }
    return { lines: [{ cls: 'dim', text: `0 resultados para «${raw.trim()}». Ni siquiera eso anda.` }] };
  }

  function renderLines(out, lines) {
    out.innerHTML = lines.map(l => `<div class="${l.cls}">${E.escapeHtml(l.text)}</div>`).join('');
    out.scrollTop = out.scrollHeight;
  }

  function openLogs() {
    E.learn('logs');
    const chips = ['ERROR', 'WARNING'];
    if (knows('note')) chips.push('auth', 'api');
    if (knows('dependencies') || knows('timesheet')) chips.push('timesheet');
    if (knows('vacation')) chips.push('sergio');
    return E.modal({
      className: 'term',
      html: `<h2>api.log — nuestro server</h2>
        <div class="dim">40.001 líneas · buscá algo (ej: ERROR). Leer es gratis: ya pagaste los minutos.</div>
        <div class="chips">${chips.map(c => `<button class="chip" type="button" data-q="${c}">${c}</button>`).join('')}</div>
        <div class="term-out"></div>
        <form class="term-line"><span>grep&gt;</span><input autocomplete="off" spellcheck="false" placeholder="palabra clave…"></form>`,
      onMount(wrap) {
        const out = wrap.querySelector('.term-out');
        const input = wrap.querySelector('input');
        const run = q => {
          const res = searchLogs(q);
          renderLines(out, res.lines);
          if (res.effect) res.effect();
        };
        run('');
        wrap.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => { input.value = c.dataset.q; run(c.dataset.q); }));
        wrap.querySelector('form').addEventListener('submit', e => { e.preventDefault(); run(input.value); });
        input.addEventListener('keydown', e => { if (e.key === 'Escape') wrap.close(); });
        setTimeout(() => input.focus(), 50);
      },
    });
  }

  function terminalCommand(raw) {
    const cmd = raw.trim().replace(/\s+/g, ' ').toLowerCase();
    if (!cmd) return [];
    if (cmd === 'help') return ['Comandos: help, ls, cat <archivo>, whoami, date, git blame, ping sergio, curl odoo, clear, exit', '(hay más. siempre hay más.)'];
    if (cmd === 'sudo find-sergio') { E.egg('find', 'sudo find-sergio'); return ['sergio: not found']; }
    if (cmd === 'sudo apt install sergio') { E.egg('apt', 'apt install sergio'); return ['Reading package lists... Done', "E: Package 'sergio' has no installation candidate"]; }
    if (cmd === 'docker compose up sergio') { E.egg('docker', 'docker compose up sergio'); return ['Error: service "sergio" not defined in compose.yaml', '(¿lo intentaste en serio? te quiero)']; }
    if (cmd === 'whoami') return ['un developer atrapado en un loop temporal. no le cuentes a nadie.'];
    if (cmd === 'ls') return ['odoo_fix_FINAL_v7_ahora_si.py  recibos/  NO_TOCAR_VIERNES.md  patos.json'];
    if (cmd === 'cat no_tocar_viernes.md') return ['Regla 1: no deployar un viernes.', 'Regla 2: Odoo no conoce la regla 1.'];
    if (cmd === 'cat odoo_fix_final_v7_ahora_si.py') return ['# TODO: documentar esto', '# (Sergio, 2023)', 'pass'];
    if (cmd === 'cat patos.json') return ['{ "timesheet": "🦆", "backoffice": "🦆", "api": "🦆", "odoo": "🦆", "sergio": null }'];
    if (cmd.startsWith('ls recibos')) return ['(vacío)'];
    if (cmd.startsWith('cat')) return ['cat: no existe. como la documentación.'];
    if (cmd === 'date') return [`Fri Oct 23 ${E.fmt(E.time())}:00 -03 2026   (otra vez)`];
    if (cmd.startsWith('git blame')) return ['Todas las líneas: Sergio. Todas.'];
    if (cmd.startsWith('git push')) return ['remote: viernes detectado. ¿Estás seguro? (no)'];
    if (cmd.startsWith('ping sergio')) return ['PING sergio (vacaciones.local): Request timeout', 'Request timeout', '--- 100% packet loss, 0% estrés ---'];
    if (cmd.startsWith('curl') && cmd.includes('odoo')) { E.setFlag('repro'); E.learn('authError'); return ['HTTP/1.1 400 Bad Request', '{"error": "missing required header: X-Odoo-Company-Id", "hint": "¿y vos de qué empresa sos?"}']; }
    if (cmd.startsWith('rm -rf')) return ['Buen intento. Es viernes, no somos animales.'];
    if (cmd.startsWith('sudo')) return ['[sudo] contraseña para vos: ******', 'Lo siento, intentá de nuevo. (La contraseña la tenía Sergio.)'];
    if (cmd === 'lgtm') return ['El perro aprueba este comando.'];
    return [`zsh: command not found: ${raw.trim().split(' ')[0]}`];
  }

  function openTerminal() {
    return E.modal({
      className: 'term',
      html: `<h2>bash — vos@cc-laptop</h2>
        <div class="term-out"><div class="dim">${flag('lgtm') ? 'Última línea escrita por: el perro. «ññññññññ»' : 'Escribí help.'}</div></div>
        <form class="term-line"><span>$</span><input autocomplete="off" spellcheck="false"></form>`,
      onMount(wrap, close) {
        const out = wrap.querySelector('.term-out');
        const input = wrap.querySelector('input');
        wrap.querySelector('form').addEventListener('submit', e => {
          e.preventDefault();
          const cmd = input.value;
          input.value = '';
          if (cmd.trim() === 'exit') { close(); return; }
          if (cmd.trim() === 'clear') { out.innerHTML = ''; return; }
          out.insertAdjacentHTML('beforeend', `<div class="me">$ ${E.escapeHtml(cmd)}</div>` +
            terminalCommand(cmd).map(l => `<div>${E.escapeHtml(l)}</div>`).join(''));
          out.scrollTop = out.scrollHeight;
        });
        input.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
        setTimeout(() => input.focus(), 50);
      },
    });
  }

  function openChat() {
    const msg = (who, text, at) => {
      const c = cast[who];
      const avatar = c?.img ? '<span data-avatar="' + who + '"></span>' : `<span class="avatar">${who === 'bot' ? '🤖' : '🐶'}</span>`;
      const name = c ? c.name : who === 'bot' ? 'Timesheet Bot' : 'alex-dog';
      return `<div class="chat-msg">${avatar}<div><b>${name}</b><small>${at}</small><br>${E.format(text)}</div></div>`;
    };
    const lines = [
      msg('flor', '¿Alguien vio a Sergio?', '16:40'),
      msg('alex', '¿Sergio? 🙏', '16:41'),
      msg('bot', 'Estado de Sergio: Disponible ✅ *(última sync: jueves 23:58)*', '16:41'),
      msg('fede', '🦆', '16:41'),
    ];
    if (flag('lgtm')) lines.push(msg('dog', 'LGTM 👍', '16:45'), msg('alex', '¡Grande! ¿Quién fue?', '16:45'));
    return E.modal({
      html: `<h2># general</h2><div class="chat">${lines.join('')}</div>`,
      onMount(wrap) {
        wrap.querySelectorAll('[data-avatar]').forEach(s => s.replaceWith(E.face(s.dataset.avatar)));
      },
    });
  }

  async function restartBackoffice() {
    await say('narrator', 'Apagás. Prendés. Barra de progreso. Más barra de progreso.');
    await say('system', '`Conectando con Odoo…` → `Error al conectar con Odoo`');
    await say('you', '*(Clásico. El backoffice está bien: el problema está entre nuestra API y Odoo.)*');
    E.learn('restart');
  }

  async function quickFix() {
    await say('narrator', 'Cambiás el timeout de 30 a 300 segundos. Guardás. Reiniciás.');
    await say('system', 'Ahora el error tarda cinco minutos en aparecer.');
    await say('you', 'Progreso. Más o menos.');
    E.learn('quickfix');
  }

  async function worksOnMyMachine() {
    E.setFlag('deploying');
    if (!(await E.spend(3))) return;
    await say('narrator', 'Te ponés los auriculares. Levantás la API en tu máquina, con tu `.env` de QA.');
    await say('narrator', 'Agregás el header a mano: `X-Odoo-Company-Id: 1`. Todo verde. Commit: «fix». Push. Deploy a producción.');
    await say('system', 'Producción: `200 OK — 45 recibos subidos a la compañía 1`');
    await say('flor', 'Dice que se subieron los 45… pero no le llegó ninguno a nadie.');
    await say('alex', '¿Por qué no funcionó el fix?');
    await say('diego', 'Porque no se probó el flujo completo. ¿Qué company id pusiste?');
    await say('you', 'El 1. El de mi `.env`.');
    await say('diego', 'La 1 es QA. Producción es la 2. Acabás de mandarle los 45 recibos de sueldo a «Usuario Prueba QA».');
    await say('narrator', 'En QA, «Usuario Prueba QA» tiene 45 recibos esperando su firma. El lunes alguien de QA va a tener una sorpresa.');
    await say('narrator', 'Mirás la pantalla.');
    await say('you', 'Pero en mi máquina funcionaba.');
    E.ending({
      code: 'ENVIRONMENT_MISMATCH', title: 'Final: Works on my machine', kind: 'bad', lesson: 'local',
      text: ['La solución parecía prometedora. En tu máquina. Con el company id de QA, deployado en producción.', 'Flor no pudo mandar los recibos.'],
    });
  }

  async function hotfixFriday() {
    E.setFlag('deploying');
    if (!(await E.spend(2))) return;
    await say('narrator', 'Agarrás el fix de Diego y lo deployás directo a producción. Sin revisar qué más depende de Odoo. Es viernes. ¿Qué podría salir mal?');
    await say('system', 'API → Odoo: `200 OK`');
    await say('flor', '¡Se están subiendo los recibos!');
    await say('alex', '¡Bien ahí, equipo!');
    await say('system', 'API: reenviando a Odoo toda la cola de Timesheet del día… `horas registradas → tipo: VACACIONES`');
    await say('narrator', 'En cinco minutos, toda la empresa figura de vacaciones.');
    await say('diego', 'Técnicamente, ahora nadie está trabajando.');
    await say('alex', 'Bueno, por lo menos tenemos un buen indicador de bienestar.');
    E.ending({
      code: 'PRODUCTION_IS_NOW_A_FEATURE', title: 'Final: Hotfix Friday', kind: 'bad', lesson: 'hotfix',
      text: ['El backoffice volvió. Timesheet decidió que todos se merecían vacaciones.', 'Recursos Humanos, legalmente, no sabe qué hacer.'],
    });
  }

  async function deploy() {
    if (!flag('fede')) {
      if (knows('hotfix')) {
        const pick = await choose('you', '*(La última vez que deployé sin chequear dependencias, toda la empresa quedó de vacaciones…)*', [
          { label: 'Deployar igual. Esta vez va a andar.', id: 'go', tone: 'risky' },
          { label: 'Mejor no. Primero hablo con Fede.', id: 'no' },
        ]);
        if (pick?.id !== 'go') return;
      }
      return hotfixFriday();
    }
    if (!flag('alex')) {
      await say('diego', 'Pará. Si deployamos sin que Alex priorice y congele los cambios, en paralelo alguien sube la feature nueva del login. Hablá con Alex.');
      return;
    }
    if (!flag('florScope')) {
      await say('you', '*(Esperá… ¿qué flujo tiene que verificar Flor después? Mejor le pregunto qué necesita exactamente antes de deployar.)*');
      return;
    }
    return happyEnding();
  }

  async function secretEnding() {
    await say('narrator', 'Abrís Discord. Buscás «sergio_off». Escribís: «Hola».');
    E.sfx('ping');
    await say('sergio', 'Estoy de vacaciones. ¿Pasó algo?');
    E.sfx('type');
    await say('you', 'Hola Sergio, perdón que te moleste, es que Odoo se actualizó y el backoffice me da error y Flor tiene que mandar los recibos antes de las cinco y Alex quiere reescribir todo y Diego pide un caso mínimo reproducible y Fede hace malabares con patos y el perro de Alex aprobó un PR y, bueno, también estoy atrapado en un loop temporal. ¿Vos sabés algo?');
    await say('narrator', 'Sergio está escribiendo…');
    E.sfx('ping');
    await say('sergio', '¿Probaron revisar la documentación?');
    await say('narrator', 'Te quedás inmóvil.');
    E.ending({
      code: 'HUMAN_DEPENDENCY_DETECTED', title: 'Final secreto: Sergio no está', kind: 'secret', lesson: 'secret',
      text: ['Pantalla negra. El sonido de una notificación de Discord.', 'El sistema más crítico de la empresa estaba en una playa, con el celular en modo avión.'],
    });
  }

  async function myDesk() {
    await menu(flag('terminal') ? 'Tu compu. El perro dejó una terminal abierta.' : 'Tu compu. El backoffice dice «Error al conectar con Odoo».', () => [
      {
        label: knows('restart') ? 'Reiniciar el backoffice *(spoiler: no sirve)*' : 'Reiniciar el backoffice.',
        cost: 3, when: !flag('won'), run: restartBackoffice,
      },
      {
        label: 'Revisar los logs.', cost: flag('logsOpened') ? 0 : 2, tone: !flag('repro') && knows('note') ? 'key' : '',
        run: async () => {
          E.setFlag('logsOpened');
          await openLogs();
        },
      },
      { label: 'Mirar #general en Discord.', run: openChat },
      { label: 'Abrir la terminal.', run: openTerminal },
      {
        label: 'Escribirle a Sergio por Discord (`sergio_off`).', cost: 0, when: knows('sergioContact') && !flag('won'), tone: 'risky',
        run: secretEnding,
      },
      { label: 'Subir el timeout y rezar.', cost: 2, when: !flag('diego') && !flag('won'), run: quickFix },
      {
        label: 'Arreglarlo yo solo, en local, y deployar.', when: !flag('diego') && !flag('won'), tone: 'risky',
        run: worksOnMyMachine,
      },
      { label: 'Deployar el fix validado por Diego.', when: flag('diego') && !flag('won'), tone: 'key', run: deploy },
    ]);
  }

  // -------------------------------------------------------- small props/gags

  const gags = {
    door: async () => {
      await say('you', '*(Podría irme. Pero a las 17:00 vuelvo a aparecer acá igual, con Flor preguntando por Sergio.)*');
      if (loops() >= 3) await say('you', '*(Ya lo probé mentalmente. No.)*');
    },
    frame: async () => {
      await say('narrator', 'Un cuadro: «EMPLEADO DEL MES». Es Sergio. Todos los meses desde 2019. Alguien le pegó un post-it: «bus factor = 1».');
    },
    coffee: async () => {
      await say('system', 'La cafetera muestra: `Error al conectar con Sergio`.');
      await say('you', '¿También la integró él?');
      E.egg('coffee', 'la cafetera integrada');
    },
    whiteboard: async () => {
      await say('narrator', 'La pizarra dice: «RECIBOS → BACKOFFICE → API → ODOO». Abajo, con otra letra: «y todo → Sergio».');
      await say('you', '*(El diagrama de arquitectura más honesto que vi en mi vida.)*');
    },
    sprint: async () => {
      await say('narrator', 'Objetivo del sprint: ✓ integrar Odoo. ✓ celebrar. ☐ tests.');
      await say('you', '*(Encontré la causa raíz organizacional.)*');
    },
    medals: async () => {
      await say('narrator', 'El medallero de Diego: 10K, 21K, 42K y una de trekking con barro todavía pegado.');
      await say('narrator', 'Colgada atrás, una medalla de cartón: «Deploy un viernes sin incidentes — 2019». Nadie recuerda haberla visto ganar.');
      await say('you', '*(Si arreglamos esto hoy, me hago una igual.)*');
      E.egg('medals', 'el medallero de Diego');
    },
    cooler: async () => {
      await say('narrator', 'Tomás agua. Estás hidratado y atrapado en un loop temporal. Una de dos.');
    },
  };

  async function ducks() {
    if (flag('won')) {
      await say('narrator', 'Cuatro patos en fila, perfectamente ordenados. Ninguno en el piso.');
      return;
    }
    await fede();
  }

  // ------------------------------------------------------------------ events

  const events = [
    {
      id: 'dog-enter', at: T(44),
      run: async () => {
        await say('narrator', knows('dogKeyboard') ? 'Entra el perro de Alex. Puntual, como siempre.' : 'Entra el perro de Alex. Mira la oficina como si fuera el Product Owner.');
      },
    },
    {
      id: 'dog-keyboard', at: T(45), when: () => !flag('deploying'),
      run: async () => {
        await say('narrator', 'El perro salta a tu escritorio y camina por el teclado.');
        await say('system', 'Mensaje enviado a #general: `LGTM 👍`');
        await say('alex', '*(desde la oficina)* ¡Alguien aprobó el fix! ¡Vamos, equipo!');
        await say('narrator', 'Además, quedó una terminal abierta en tu monitor. El perro te mira, orgulloso.');
        E.setFlag('lgtm');
        E.setFlag('terminal');
        E.learn('dogKeyboard');
      },
    },
    {
      id: 'dog-sergio', at: T(47), when: () => !flag('deploying'),
      run: async () => {
        await say('narrator', 'El perro baja de tu escritorio y se mete abajo del escritorio de Sergio. Olfatea algo con mucho interés.');
        E.learn('dogSchedule');
      },
    },
    {
      id: 'meeting', at: T(48), when: () => !flag('alex') && !flag('deploying'),
      run: async () => {
        await say('alex', '¡Reunión de emergencia! Todos a la sala. Son cinco minutos.');
        if (knows('meeting')) await say('you', '*(La reunión. Seis minutos de mi vida que no vuelven… salvo en este loop, que vuelven siempre.)*');
        const pick = await choose('you', '¿Qué hacés?', [
          { label: 'Ir a la reunión.', cost: 6, id: 'go' },
          { label: 'Esquivarla: «Voy al baño y vuelvo».', cost: 1, id: 'dodge' },
          { label: 'Tomar el control: «Ya tenemos la causa. No necesitamos una reunión: necesitamos prioridad».', cost: 1, id: 'lead', tone: 'key', when: flag('diego') },
        ]);
        if (pick?.id === 'lead') {
          await alexPriority();
          await E.spend(1);
          return;
        }
        if (pick?.id === 'dodge') {
          await say('alex', 'Dale, después te paso el resumen.');
          await say('you', '*(Nunca hubo resumen.)*');
          await E.spend(1);
          return;
        }
        await say('narrator', 'Sala de reuniones. Cinco personas, seis opiniones, cero decisiones.');
        await say('alex', 'Bueno, ¿cuál es el plan?');
        await say('diego', '¿Cuál es el caso mínimo reproducible?');
        await say('fede', '¿Y si convertimos el incidente en un juego de mesa? Cada jugador es un sistema. Yo pido ser el pato de Odoo.');
        await say('flor', '¿Se pueden mandar los recibos por email? ¿A mano? ¿Por fax?');
        await say('you', 'Hay una dependencia rota entre…');
        await say('alex', '¡Perfecto! ¿Y si aprovechamos para modernizar toda la arquitectura?');
        await say('narrator', 'Pasan diez minutos que, por la física del loop, duran seis.');
        await say('diego', 'Bueno, ¿y quién toma nota?');
        await say('narrator', 'Silencio absoluto.');
        await say('system', '`MEETING_STATUS: IN_PROGRESS`');
        E.learn('meeting');
        await E.spend(6);
      },
    },
    {
      id: 'diego-class', at: T(50), when: () => !flag('won') && !flag('deploying'),
      run: async () => {
        await say('narrator', knows('diegoClass') ? 'Diego entra a su clase por Zoom. Como siempre a las 16:50.' : 'Diego se pone los auriculares y abre Zoom: arranca su clase de la facultad. Vuelve a las 16:55.');
        E.learn('diegoClass');
      },
    },
    {
      id: 'diego-back', at: T(55), when: () => !flag('won') && !flag('deploying'),
      run: async () => {
        await say('narrator', 'Diego termina la clase: «…y por eso, chicos, nunca dependan de una sola persona». Se saca los auriculares.');
      },
    },
    {
      id: 'trycatch', at: T(56), when: () => !flag('won') && !flag('deploying'),
      run: async () => {
        await say('dev', '¡Ey! Vi que están con lo de Odoo. ¿Y si le metemos un `try/catch` y listo?');
        const pick = await choose('you', '¿Qué le contestás?', [
          { label: '¡Dale, mandale!', id: 'yes', tone: 'risky' },
          { label: knows('trycatch') ? '*(Ya vi cómo termina.)* No, gracias.' : 'Mmm… no, gracias.', id: 'no' },
        ]);
        if (pick?.id !== 'yes') {
          await say('dev', 'Bueno. Si cambiás de opinión, el try está. El catch también.');
          return;
        }
        await say('narrator', 'El dev escribe en la API `try { odoo.send(req) } catch (e) { return 200 }`. Push directo a main.');
        await say('system', 'Los errores desaparecen. Todos. Porque ahora se capturan y se ignoran.');
        await say('narrator', 'Cinco segundos después…');
        await say('alex', '¡Excelente! ¿Entonces ya está solucionado?');
        await say('system', 'El backoffice muestra un hermoso mensaje verde: `200 OK — 45 recibos enviados`');
        await say('flor', 'Dice que se enviaron los 45 recibos. No le llegó ninguno a nadie. Me están llamando cuarenta y cinco personas.');
        E.ending({
          code: 'REGRESSION_DETECTED', title: 'Final: El workaround definitivo', kind: 'bad', lesson: 'trycatch',
          text: ['El sistema dejó de mostrar errores porque ahora los captura y los ignora.', 'Nunca un 200 OK fue tan mentiroso.'],
        });
      },
    },
    {
      id: 'alex-eta', at: T(58), when: () => !flag('won') && !flag('deploying'),
      run: async () => {
        await say('alex', '*(asomándose)* ¿Cuánto falta?');
        await say('you', '*(Dos minutos para que se reinicie el universo.)*');
      },
    },
  ];

  async function timeout() {
    await say('narrator', '17:00.');
    await say('flor', 'Son las cinco. No pude mandar los recibos.');
    await say('alex', '¿Status?');
    await say('you', 'Estamos investigando.');
    E.ending({
      code: 'TIMEOUT_BUSINESS_HOURS_EXCEEDED', title: 'Final: Estamos investigando', kind: 'bad', lesson: 'timeout',
      text: ['La pantalla se congela.', 'Flor no pudo mandar los recibos. Sergio sigue sin aparecer. Y vos tenés una sensación rarísima de déjà vu.'],
    });
  }

  // ------------------------------------------------------------- happy path

  async function happyEnding() {
    E.setFlag('deploying');
    await say('narrator', 'Deploy controlado: nuestra API ahora manda `X-Odoo-Company-Id` en cada request, tomado de la config de cada entorno (1 en QA, 2 en producción). Primero QA, flujo completo: backoffice y Timesheet.');
    if (!(await E.spend(3))) return;
    await say('diego', inClass()
      ? '*(desde el Zoom, sin cortar la clase)* Chicos, esto es un deploy controlado en vivo. Tomen nota.'
      : 'Flujo completo en staging: verde. Ahora sí, producción.');
    await say('system', 'API → Odoo: `200 OK` (de verdad, esta vez).');
    await say('fede', 'Timesheet… backoffice… API… Odoo. Los patos están en orden. Por primera vez, ninguno se cae al piso.');
    E.setFlag('won');
    await say('system', 'Timesheet → API → Odoo: sincronizando la cola revisada… Vacaciones de Sergio: `SINCRONIZADAS ✅`');
    await say('flor', '¡Se subieron los recibos! 45 de 45, ya les llegaron a todos para firmar. Y mirá: Sergio figura de vacaciones. ¡Estaba de vacaciones!');
    await say('alex', 'Entonces… ¿cuánto falta?');
    await say('you', 'Nada, Alex. Ya está.');
    await say('alex', 'Es la mejor respuesta que escuché en toda mi carrera. Documentemos el incidente.');
    await say('diego', 'Y un test de contrato contra la API de Odoo, para que la próxima actualización nos avise antes que Flor. Ahora sí: me voy a correr.');
    await say('narrator', 'Por primera vez, la jornada termina sin un incidente nuevo.');
    E.sfx('ping');
    await say('sergio', 'Che, recién veo los mensajes. ¿Pasó algo con Odoo?');
    await say('you', '*(sonriendo)* Todo bien, Sergio. Disfrutá las vacaciones.');
    await say('narrator', 'Pasan dos segundos.');
    E.sfx('ping');
    await say('sergio', 'Genial. Una consulta rápida: ¿me pueden explicar cómo quedó la integración?');
    await say('narrator', 'Cerrás Discord.');
    E.ending({
      code: 'BUS_FACTOR > 1', title: 'ACHIEVEMENT UNLOCKED', kind: 'good',
      text: ['Sergio puede descansar. El sistema también.'],
      onContinue: credits,
    });
  }

  function credits() {
    const el = document.createElement('div');
    el.className = 'credits';
    const runner = (id, cls = '') => `<div class="runner ${cls}" data-runner="${id}"></div>`;
    el.innerHTML = `
      <button class="btn credits-skip" type="button">Saltar ▶▶</button>
      <div class="credits-roll">
        <h2>SAVE DEVELOPER DAY</h2><p>The Odoo Loop</p>
        <h2>Elenco</h2>
        <p>Flor <span class="role">— RRHH, que finalmente mandó los recibos</span></p>
        <p>Alex <span class="role">— CEO, que preguntó cuánto faltaba 37 veces</span></p>
        <p>Diego <span class="role">— CTO, que pidió el caso mínimo reproducible</span></p>
        <p>Fede <span class="role">— CGO, y sus patos de goma</span></p>
        <p>Sergio <span class="role">— de vacaciones (por fin, en el sistema también)</span></p>
        <p>El perro de Alex <span class="role">— aprobó el PR</span></p>
        <p>Vos <span class="role">— el único que se acuerda de todo</span></p>
        <h2>Agradecimientos</h2>
        <p>A la documentación, que siempre estuvo ahí.</p>
        <p>Al post-it «no tocar producción un viernes».</p>
        <p>A todos los que alguna vez dijeron «esto Sergio lo arregla en cinco minutos».</p>
        <h2>Moraleja</h2>
        <p>Los sistemas no deberían depender de que una sola persona esté siempre disponible.</p>
        <p>«Todo estaba funcionando. Hasta que se actualizó Odoo.»</p>
      </div>
      <div class="credits-lane">
        ${runner('dog')}${runner('duck', 'duck-run')}
        ${runner('diego', 'slow')}
        <div class="juggler" data-juggler></div>
      </div>
      <div class="credits-final">
        <div data-final-line>—Che, ¿alguien sabe por qué dejó de funcionar el login?</div>
        <div class="fin" hidden>FIN.</div>
        <div class="btn-row" hidden>
          <button class="btn" type="button" data-act="again">◀◀ Jugar otro loop</button>
          <button class="btn danger" type="button" data-act="reset">Empezar de cero</button>
        </div>
      </div>`;

    const dogEl = document.createElement('div');
    dogEl.className = 'dog';
    dogEl.style.backgroundImage = `url(${Sprites.dogSheet().url})`;
    el.querySelector('[data-runner="dog"]').appendChild(dogEl);
    el.querySelector('[data-runner="duck"]').innerHTML = '<div class="duck" data-duck style="margin-left:90px"></div>';
    el.querySelector('[data-runner="diego"]').appendChild(E.sprite('diego'));
    const juggler = el.querySelector('[data-juggler]');
    juggler.innerHTML = '<div class="duck" data-duck></div><div class="duck" data-duck="#5ab1e8"></div><div class="duck" data-duck="#5fd07a"></div>';
    juggler.appendChild(E.sprite('fede'));
    E.decorate(el);

    document.querySelector('#stage').appendChild(el);

    let finished = false;
    const finale = () => {
      if (finished) return;
      finished = true;
      const final = el.querySelector('.credits-final');
      final.classList.add('is-on');
      setTimeout(() => {
        document.querySelector('#stage').classList.add('is-frozen');
        E.stopMusic(); // the music cuts out with the final glitch gag
        E.sfx('fail');
        final.querySelector('[data-final-line]').style.animation = 'glitch .6s steps(1) 3';
      }, 2200);
      setTimeout(() => {
        final.querySelector('.fin').hidden = false;
        final.querySelector('.btn-row').hidden = false;
      }, 3400);
    };
    el.querySelector('.credits-skip').addEventListener('click', finale);
    el.querySelector('.credits-roll').addEventListener('animationend', finale);
    el.querySelector('[data-act="again"]').addEventListener('click', () => { el.remove(); E.rewind(); });
    el.querySelector('[data-act="reset"]').addEventListener('click', () => { E.resetMemory(); location.reload(); });
  }

  // -------------------------------------------------------------------- wire

  const handlers = {
    flor, alex, diego, fede, dog, ducks,
    'sergio-desk': sergioDesk,
    'my-desk': myDesk,
    ...gags,
  };

  return {
    cast, knowledge, endingsCatalog, events, handlers,
    worldWidth: 3300,
    playerStart: 620,
    zoneAt,
    onStage: ['flor', 'alex', 'diego', 'fede'],
    titleCast: ['flor', 'alex', 'diego', 'fede', 'sergio'],
    worldHTML, actors, spots, renderScene, banner, objectives, intro, timeout,
  };
})();

Engine.boot(Story);
