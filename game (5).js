// ============================================================
// FLAPPY FOOD — v5.0 + CÉU ☁️  (arquivo único, patch integrado)
// ── Base: v4.2 (todos os bugfixes aplicados)
// ── Novidades v5.0:
//    NOVOS BIOMAS:
//    • Bioma 6: 🏜️ Deserto — Escorpião + Cactus Gigante
//    • Bioma 7: ❄️ Ártico  — Pinguim + Golem de Gelo
//    NOVAS SKINS (12):
//    • Kimchi, Tapioca, Brigadeiro, Caipirinha, Açaí, Pão de Queijo,
//      Mortadela, Guaraná, Sequilho, Cocada, Coxinha, Pastel

// ── EXPORTS GLOBAIS (linha 1 — function hoisting garante que existem) ──────
// Funções declaradas com `function` são hoisted para o topo do escopo,
// então esta atribuição é válida mesmo antes das definições abaixo.
window.showScreen         = showScreen;
window.startGame          = startGame;
window.togglePause        = togglePause;
window.useCheckpoint      = useCheckpoint;
window.clearCheckpoint    = clearCheckpoint;
window.claimMissionReward = claimMissionReward;
// ────────────────────────────────────────────────────────────────────────────
//    NOVOS POWER-UPS (3):
//    • ❄️ Congelamento — congela proj. e obstáculos por 5s
//    • 🦘 Salto Duplo  — permite 1 salto extra no ar
//    • 🔵 Mini Mode    — hitbox reduzido para 9px por 8s
//    NOVOS MECANISMOS:
//    • Player tilt — personagem inclina baseado na velocidade
//    • Boss Intro  — flash dramático ao chefe aparecer
//    • Boss Rage   — a 30% HP, chefe fica enraivecido (mais rápido)
//    • Gap dinâmico — abertura dos canos diminui com o score
//    • Checkpoint automático a cada 20 pts de bioma (fase)
//    • Milestone bonus — +200💎 a cada 100 pts de score
//    • Partículas coloridas por bioma
//    • Biome flash — flash suave ao mudar de bioma
//    NOVAS MISSÕES (8):
//    • IDs 27-34: metas de bioma, bosses, velocidade e mais
//    NOVOS BACKGROUNDS:
//    • drawBgDesert() — dunas animadas + tempestade de areia
//    • drawBgArctic() — flocos de neve + aurora boreal
//    POLIMENTO:
//    • Canos com visual aprimorado (gradiente por bioma)
//    • Scoreboard com medalhas 🥇🥈🥉
//    • Notificação de milestone centralizada
//    • Sons distintos por bioma de chefe
//    • HUD: exibe bioma atual no canto inferior
// ── Novidades Bioma Céu ☁️:
//    • Modo Flappy clássico: sem power-ups, sem bosses, sem buffs
//    • Fundo de céu dinâmico com paralaxe, sol, pássaros e nuvens
//    • Velocidade progressiva própria (mais agressiva)
//    • Gap dinâmico mais desafiador
//    • Barra de progresso vs recorde pessoal
//    • Tela de fim de jogo dedicada com botão "Jogar de Novo"
//    • HUD tag "☁️ MODO CÉU"
//    • Acessível pelo menu de Biomas (sempre disponível)
// ============================================================

// ============================================================
// 1. CONFIGURAÇÕES INICIAIS E ÁUDIO
// ============================================================
const canvas   = document.getElementById("gameCanvas");
const ctx      = canvas.getContext("2d");
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Canvas usa o tamanho definido no HTML — não redimensiona


const bgMusic = new Audio(
  "https://opengameart.org/sites/default/files/platformer_level03_loop.ogg"
);
bgMusic.loop   = true;
bgMusic.volume = 0.3;

// ============================================================
// OPÇÕES — persistidas no localStorage
// ============================================================
const OPTIONS = {
  musicOn:  (localStorage.getItem("ff_opt_music") ?? "1") === "1",
  musicVol:  parseFloat(localStorage.getItem("ff_opt_mvol")) || 0.3,
  sfxOn:    (localStorage.getItem("ff_opt_sfx")   ?? "1") === "1",
  sfxVol:    parseFloat(localStorage.getItem("ff_opt_svol")) || 0.05,
  particles: (localStorage.getItem("ff_opt_part") ?? "1") === "1",
  trail:     (localStorage.getItem("ff_opt_trail") ?? "1") === "1",
  shake:     (localStorage.getItem("ff_opt_shake") ?? "1") === "1"
};

function saveOptions() {
  localStorage.setItem("ff_opt_music", OPTIONS.musicOn  ? "1" : "0");
  localStorage.setItem("ff_opt_mvol",  OPTIONS.musicVol);
  localStorage.setItem("ff_opt_sfx",   OPTIONS.sfxOn    ? "1" : "0");
  localStorage.setItem("ff_opt_svol",  OPTIONS.sfxVol);
  localStorage.setItem("ff_opt_part",  OPTIONS.particles ? "1" : "0");
  localStorage.setItem("ff_opt_trail", OPTIONS.trail     ? "1" : "0");
  localStorage.setItem("ff_opt_shake", OPTIONS.shake     ? "1" : "0");
}

function applyOptions() {
  bgMusic.volume = OPTIONS.musicOn ? OPTIONS.musicVol : 0;
}

// ============================================================
// 2. CONSTANTES GLOBAIS
// ============================================================
const GAME_CONFIG = {
  pipeSpawnRate:  110,
  coinSpawnRate:  150,
  powerSpawnRate: 300,
  pipeSpeed:      4,     // atualizado a cada frame por getDifficultySpeed()
  trailFade:      0.04,
  particleFade:   0.05,
  trailSpawnRate: 5,
  coinRadius:     20,
  powerupRadius:  25,
  knifeRadius:    15
};

const BASE_PIPE_SPEED = 4;
const MAX_PIPE_SPEED  = 8.0;
let adminSpeedMult = 1.0;

function getDifficultySpeed() {
  const progressive = Math.min(
    BASE_PIPE_SPEED + Math.floor(state.score / 20) * 0.15,
    MAX_PIPE_SPEED
  );
  return progressive * adminSpeedMult;
}

// Cores dos canos por bioma
const PIPE_COLORS = [
  { a: "#2ecc71", b: "#1e8449", border: "#145a32", cap: "#27ae60" }, // 0 Campo
  { a: "#607d8b", b: "#37474f", border: "#263238", cap: "#546e7a" }, // 1 Cidade
  { a: "#388e3c", b: "#1b5e20", border: "#0a3a0a", cap: "#2e7d32" }, // 2 Floresta
  { a: "#c62828", b: "#7f0000", border: "#4a0000", cap: "#b71c1c" }, // 3 Vulcão
  { a: "#0097a7", b: "#006064", border: "#003d40", cap: "#00838f" }, // 4 Oceano
  { a: "#f9a825", b: "#e65100", border: "#bf360c", cap: "#ff8f00" }, // 5 Deserto
  { a: "#80deea", b: "#00acc1", border: "#006064", cap: "#4dd0e1" }, // 6 Ártico
  { a: "#7b1fa2", b: "#4a0072", border: "#2e0045", cap: "#6a1b9a" }  // 7 Espaço
];

// ============================================================
// BIOMAS — cada bioma tem 80 pontos (dia → pôr do sol → noite)
// ============================================================
const BIOMES = [
  {
    name: "🌾 Campo",
    bossA: { emoji: "🐔", size: "85px Arial",  x: 330, attackRate: 95,  attackX: 300, projectile: "egg",      drain: 0.05, reward: 200,  color: "#f9a825", maxY: 450, minY: 50, hp: 90,  speed: 2, desc: "Galinha Furiosa"     },
    bossB: { emoji: "🐂", size: "95px Arial",  x: 320, attackRate: 65,  attackX: 300, projectile: "charge",   drain: 0.04, reward: 800,  color: "#c62828", maxY: 500, minY: 50, hp: 140, speed: 3, desc: "Touro Bravo"         }
  },
  {
    name: "🏙️ Cidade",
    bossA: { emoji: "👨‍🍳", size: "90px Arial",  x: 330, attackRate: 100, attackX: 300, projectile: "knife",    drain: 0.05, reward: 250,  color: "#e74c3c", maxY: 450, minY: 50, hp: 100, speed: 2, desc: "Chef Raivoso"         },
    bossB: { emoji: "🍄",  size: "100px Arial", x: 320, attackRate: 80,  attackX: 300, projectile: "spore",    drain: 0.04, reward: 1000, color: "#9b59b6", maxY: 500, minY: 50, hp: 150, speed: 3, desc: "Fungo Gigante"        }
  },
  {
    name: "🌿 Floresta",
    bossA: { emoji: "🐺", size: "85px Arial",  x: 330, attackRate: 90,  attackX: 300, projectile: "acorn",    drain: 0.06, reward: 500,  color: "#795548", maxY: 450, minY: 50, hp: 130, speed: 3, desc: "Lobo Selvagem"        },
    bossB: { emoji: "🐻", size: "95px Arial",  x: 320, attackRate: 70,  attackX: 300, projectile: "honey",    drain: 0.05, reward: 1800, color: "#ff8f00", maxY: 500, minY: 50, hp: 190, speed: 2, desc: "Urso Mel"             }
  },
  {
    name: "🌋 Vulcão",
    bossA: { emoji: "🐉", size: "90px Arial",  x: 330, attackRate: 85,  attackX: 300, projectile: "fireball", drain: 0.07, reward: 800,  color: "#ff6d00", maxY: 450, minY: 50, hp: 160, speed: 4, desc: "Dragão de Fogo"      },
    bossB: { emoji: "😈", size: "100px Arial", x: 320, attackRate: 60,  attackX: 300, projectile: "wave",     drain: 0.06, reward: 2200, color: "#f44336", maxY: 500, minY: 50, hp: 210, speed: 5, desc: "Demônio"             }
  },
  {
    name: "🌊 Oceano",
    bossA: { emoji: "🐙", size: "90px Arial",  x: 330, attackRate: 90,  attackX: 300, projectile: "ink",      drain: 0.05, reward: 1100, color: "#1a237e", maxY: 450, minY: 50, hp: 180, speed: 2, desc: "Polvo das Trevas"    },
    bossB: { emoji: "🦈", size: "100px Arial", x: 320, attackRate: 55,  attackX: 300, projectile: "bubble",   drain: 0.04, reward: 2800, color: "#0288d1", maxY: 500, minY: 50, hp: 240, speed: 4, desc: "Tubarão Fantasma"    }
  },
  {
    name: "🏜️ Deserto",
    bossA: { emoji: "🦂", size: "85px Arial",  x: 330, attackRate: 70,  attackX: 300, projectile: "sting",    drain: 0.09, reward: 2200, color: "#ff6f00", maxY: 450, minY: 50, hp: 220, speed: 4, desc: "Escorpião do Deserto" },
    bossB: { emoji: "🌵", size: "100px Arial", x: 320, attackRate: 50,  attackX: 300, projectile: "thorn",    drain: 0.07, reward: 4000, color: "#8bc34a", maxY: 500, minY: 50, hp: 290, speed: 2, desc: "Cacto Gigante"       }
  },
  {
    name: "❄️ Ártico",
    bossA: { emoji: "🐧", size: "88px Arial",  x: 330, attackRate: 65,  attackX: 300, projectile: "snowball", drain: 0.09, reward: 2800, color: "#80deea", maxY: 450, minY: 50, hp: 245, speed: 3, desc: "Pinguim Guerreiro"   },
    bossB: { emoji: "🧊", size: "105px Arial", x: 320, attackRate: 40,  attackX: 300, projectile: "blizzard", drain: 0.07, reward: 5000, color: "#b3e5fc", maxY: 500, minY: 50, hp: 320, speed: 4, desc: "Golem de Gelo"       }
  },
  {
    name: "🌌 Espaço",
    bossA: { emoji: "👾", size: "85px Arial",  x: 330, attackRate: 75,  attackX: 300, projectile: "laser",    drain: 0.08, reward: 1600, color: "#76ff03", maxY: 450, minY: 50, hp: 200, speed: 3, desc: "Alien Invasor"       },
    bossB: { emoji: "🛸", size: "100px Arial", x: 320, attackRate: 45,  attackX: 300, projectile: "spiral",   drain: 0.06, reward: 3500, color: "#e040fb", maxY: 500, minY: 50, hp: 270, speed: 5, desc: "OVNI Final"          }
  }
];

// ============================================================
// 3. REFERÊNCIAS DA UI
// ============================================================
const UI = {
  overlay:    document.getElementById("screen-overlay"),
  hud:        document.getElementById("game-hud"),
  bossUI:     document.getElementById("boss-ui"),
  score:      document.getElementById("score"),
  best:       document.getElementById("best"),
  coins:      document.getElementById("coins"),
  shopCoins:  document.getElementById("shop-coins"),
  hpFill:     document.getElementById("hp-fill"),
  finalStats: document.getElementById("final-stats"),
  btnGod:     document.getElementById("btn-god")
};

// ============================================================
// 4. SKINS
// ============================================================
const SKINS = {
  // ── Básicas ──────────────────────────────────────────────
  Burger:     { emoji: "🍔", grav: 0.24, jump: 5.2, size: 45, price: 0     },
  Fries:      { emoji: "🍟", grav: 0.22, jump: 5.0, size: 45, price: 100   },
  Pizza:      { emoji: "🍕", grav: 0.18, jump: 4.8, size: 45, price: 200   },
  HotDog:     { emoji: "🌭", grav: 0.2,  jump: 5.0, size: 42, price: 250   },
  Donut:      { emoji: "🍩", grav: 0.2,  jump: 5.1, size: 45, price: 350   },
  Popcorn:    { emoji: "🍿", grav: 0.14, jump: 4.6, size: 40, price: 400   },
  Sandwich:   { emoji: "🥪", grav: 0.23, jump: 5.2, size: 44, price: 500   },
  Pretzel:    { emoji: "🥨", grav: 0.19, jump: 5.0, size: 40, price: 600   },
  Waffle:     { emoji: "🧇", grav: 0.21, jump: 5.1, size: 43, price: 700   },
  Sushi:      { emoji: "🍣", grav: 0.26, jump: 5.0, size: 38, price: 800   },
  Ramen:      { emoji: "🍜", grav: 0.17, jump: 4.9, size: 46, price: 900   },
  Taco:       { emoji: "🌮", grav: 0.3,  jump: 6.5, size: 45, price: 1200  },
  Burrito:    { emoji: "🌯", grav: 0.28, jump: 6.2, size: 44, price: 1300  },
  Dumpling:   { emoji: "🥟", grav: 0.22, jump: 5.4, size: 38, price: 1400  },
  Apple:      { emoji: "🍎", grav: 0.2,  jump: 5.8, size: 40, price: 1500  },
  Pancakes:   { emoji: "🥞", grav: 0.25, jump: 5.6, size: 46, price: 1600  },
  Peach:      { emoji: "🍑", grav: 0.19, jump: 5.3, size: 40, price: 1700  },
  Mango:      { emoji: "🥭", grav: 0.21, jump: 5.5, size: 42, price: 1800  },
  Lemon:      { emoji: "🍋", grav: 0.16, jump: 5.2, size: 38, price: 1900  },
  Mushroom:   { emoji: "🍄", grav: 0.18, jump: 5.0, size: 40, price: 2000  },
  Pineapple:  { emoji: "🍍", grav: 0.22, jump: 5.5, size: 45, price: 2000  },
  Grapes:     { emoji: "🍇", grav: 0.23, jump: 5.3, size: 42, price: 2200  },
  Strawberry: { emoji: "🍓", grav: 0.17, jump: 5.7, size: 36, price: 2300  },
  Blueberry:  { emoji: "🫐", grav: 0.15, jump: 5.9, size: 34, price: 2400  },
  Avocado:    { emoji: "🥑", grav: 0.25, jump: 6.0, size: 42, price: 2500  },
  Onigiri:    { emoji: "🍙", grav: 0.2,  jump: 5.4, size: 40, price: 2800  },
  Bento:      { emoji: "🍱", grav: 0.26, jump: 5.8, size: 46, price: 3000  },
  Watermelon: { emoji: "🍉", grav: 0.23, jump: 5.0, size: 48, price: 3200  },
  Cheese:     { emoji: "🧀", grav: 0.24, jump: 5.5, size: 42, price: 3400  },
  Egg:        { emoji: "🍳", grav: 0.19, jump: 5.3, size: 42, price: 3600  },
  IceCream:   { emoji: "🍦", grav: 0.16, jump: 5.6, size: 40, price: 3800  },
  Cake:       { emoji: "🎂", grav: 0.28, jump: 6.0, size: 46, price: 4000  },
  Broccoli:   { emoji: "🥦", grav: 0.15, jump: 4.5, size: 45, price: 4000  },
  Croissant:  { emoji: "🥐", grav: 0.2,  jump: 6.0, size: 40, price: 4500  },
  Chocolate:  { emoji: "🍫", grav: 0.27, jump: 5.9, size: 42, price: 4800  },
  Cookie:     { emoji: "🍪", grav: 0.28, jump: 6.2, size: 35, price: 5000  },
  Honey:      { emoji: "🍯", grav: 0.22, jump: 6.1, size: 40, price: 5500  },
  Sushi2:     { emoji: "🍤", grav: 0.32, jump: 6.8, size: 40, price: 6500  },
  Crab:       { emoji: "🦀", grav: 0.33, jump: 7.0, size: 46, price: 7000  },
  Oyster:     { emoji: "🦪", grav: 0.3,  jump: 6.6, size: 42, price: 7500  },
  Lobster:    { emoji: "🦞", grav: 0.35, jump: 7.5, size: 50, price: 8000  },
  Octopus:    { emoji: "🐙", grav: 0.38, jump: 7.8, size: 50, price: 9000  },
  TropFruit:  { emoji: "🍹", grav: 0.13, jump: 4.2, size: 44, price: 10000 },
  Baguette:   { emoji: "🥖", grav: 0.36, jump: 8.0, size: 50, price: 11000 },
  Dango:      { emoji: "🍡", grav: 0.12, jump: 4.0, size: 42, price: 12000 },
  Spaghetti:  { emoji: "🍝", grav: 0.14, jump: 4.4, size: 46, price: 13000 },
  Paella:     { emoji: "🥘", grav: 0.4,  jump: 8.5, size: 52, price: 15000 },
  HotPepper:  { emoji: "🌶️", grav: 0.1,  jump: 3.8, size: 36, price: 18000 },
  Unicorn:    { emoji: "🧁", grav: 0.08, jump: 3.5, size: 40, price: 25000 },
  // ── Skins brasileiras v5.0 ───────────────────────────────
  Kimchi:     { emoji: "🫙", grav: 0.21, jump: 5.3, size: 40, price: 1100  },
  Tapioca:    { emoji: "🥞", grav: 0.19, jump: 5.1, size: 44, price: 1500  },
  Brigadeiro: { emoji: "🍫", grav: 0.24, jump: 5.5, size: 38, price: 2200  },
  Caipirinha: { emoji: "🍹", grav: 0.14, jump: 4.6, size: 42, price: 2600  },
  Acai:       { emoji: "🫐", grav: 0.16, jump: 4.8, size: 36, price: 3200  },
  PaoQueijo:  { emoji: "🧆", grav: 0.20, jump: 5.0, size: 38, price: 3800  },
  Mortadela:  { emoji: "🥩", grav: 0.30, jump: 6.3, size: 44, price: 4600  },
  Guarana:    { emoji: "🥤", grav: 0.18, jump: 5.2, size: 42, price: 5200  },
  Sequilho:   { emoji: "🫘", grav: 0.22, jump: 5.6, size: 38, price: 6000  },
  Cocada:     { emoji: "🍮", grav: 0.26, jump: 5.8, size: 40, price: 7200  },
  Coxinha:    { emoji: "🍗", grav: 0.28, jump: 6.0, size: 44, price: 8500  },
  Pastel:     { emoji: "🥙", grav: 0.32, jump: 6.6, size: 46, price: 10500 },
  // ── Skins exclusivas de missão ───────────────────────────
  RainbowCake: { emoji: "🎆", grav: 0.1,  jump: 3.8, size: 44, price: -1, exclusive: true, exclusiveName: "Fogo de Artifício"     },
  CrownBurger: { emoji: "👑", grav: 0.15, jump: 4.2, size: 40, price: -1, exclusive: true, exclusiveName: "A Coroa"               },
  SkullCandy:  { emoji: "💀", grav: 0.2,  jump: 5.0, size: 38, price: -1, exclusive: true, exclusiveName: "Caveira"               },
  FireRamen:   { emoji: "🌋", grav: 0.12, jump: 4.0, size: 44, price: -1, exclusive: true, exclusiveName: "Vulcão Vivo"           },
  MoonMochi:   { emoji: "🌕", grav: 0.09, jump: 3.6, size: 42, price: -1, exclusive: true, exclusiveName: "Lua Cheia"             },
  ThunderEgg:  { emoji: "⚡", grav: 0.18, jump: 5.5, size: 36, price: -1, exclusive: true, exclusiveName: "Raio"                  },
  IceKing:     { emoji: "🧊", grav: 0.11, jump: 3.9, size: 42, price: -1, exclusive: true, exclusiveName: "Rei do Gelo"           },
  SandStorm:   { emoji: "🌪️", grav: 0.13, jump: 4.1, size: 44, price: -1, exclusive: true, exclusiveName: "Tempestade de Areia"  }
};

// ============================================================
// 5. MISSÕES
// ============================================================
// Lista master — fonte da verdade para todas as missões
const MISSIONS_MASTER = [
  { id: 1,  desc: "Junte 5.000 diamantes",        goal: 5000,   current: 0, reward: 2000,  type: "gems",       claimed: false },
  { id: 2,  desc: "Desbloqueie 5 skins",          goal: 5,      current: 0, reward: 1500,  type: "unlock",     claimed: false },
  { id: 3,  desc: "Passe por 150 canos",          goal: 150,    current: 0, reward: 3000,  type: "pipes",      claimed: false },
  { id: 4,  desc: "Vença o Fungo (Boss B)",       goal: 1,      current: 0, reward: 5000,  type: "boss2",      claimed: false },
  { id: 5,  desc: "Jogue 10 partidas",            goal: 10,     current: 0, reward: 500,   type: "games",      claimed: false },
  { id: 6,  desc: "Passe por 500 canos",          goal: 500,    current: 0, reward: 6000,  type: "pipes",      claimed: false },
  { id: 7,  desc: "Jogue 50 partidas",            goal: 50,     current: 0, reward: 3000,  type: "games",      claimed: false },
  { id: 8,  desc: "Junte 25.000 diamantes",       goal: 25000,  current: 0, reward: 8000,  type: "gems",       claimed: false },
  { id: 9,  desc: "Desbloqueie 15 skins",         goal: 15,     current: 0, reward: 5000,  type: "unlock",     claimed: false },
  { id: 10, desc: "Alcance combo ×10",            goal: 10,     current: 0, reward: 2500,  type: "combo",      claimed: false },
  { id: 11, desc: "Alcance combo ×25",            goal: 25,     current: 0, reward: 7000,  type: "combo",      claimed: false },
  { id: 12, desc: "Derrote 5 bosses (qualquer)",  goal: 5,      current: 0, reward: 4000,  type: "anyBoss",    claimed: false },
  { id: 13, desc: "Derrote 10 bosses",            goal: 10,     current: 0, reward: 9000,  type: "anyBoss",    claimed: false },
  { id: 14, desc: "Colete 50 power-ups",          goal: 50,     current: 0, reward: 3500,  type: "powerup",    claimed: false },
  { id: 15, desc: "Colete 200 power-ups",         goal: 200,    current: 0, reward: 10000, type: "powerup",    claimed: false },
  { id: 16, desc: "Sobreviva ao Vulcão completo", goal: 1,      current: 0, reward: 12000, type: "biome3",     claimed: false },
  { id: 17, desc: "Chegue ao Espaço",             goal: 1,      current: 0, reward: 15000, type: "biome7",     claimed: false },
  { id: 18, desc: "Passe 1.000 canos no total",   goal: 1000,   current: 0, reward: 20000, type: "pipes",      claimed: false },
  { id: 19, desc: "Jogue 100 partidas",           goal: 100,    current: 0, reward: 8000,  type: "games",      claimed: false },
  { id: 20, desc: "Desbloqueie todas as skins",   goal: 61,     current: 0, reward: 30000, type: "unlock",     claimed: false },
  { id: 21, desc: "Derrote 3 Boss B seguidos",    goal: 3,      current: 0, reward: 0,     type: "boss2",      claimed: false, skinReward: "CrownBurger", skinDesc: "👑 Skin A Coroa"            },
  { id: 22, desc: "Alcance combo ×50",            goal: 50,     current: 0, reward: 0,     type: "combo",      claimed: false, skinReward: "ThunderEgg",  skinDesc: "⚡ Skin Raio"               },
  { id: 23, desc: "Passe 2.000 canos",            goal: 2000,   current: 0, reward: 0,     type: "pipes",      claimed: false, skinReward: "RainbowCake", skinDesc: "🎆 Skin Fogo de Artifício"  },
  { id: 24, desc: "Derrote todos os Boss B",      goal: 5,      current: 0, reward: 0,     type: "biomesBeat", claimed: false, skinReward: "FireRamen",   skinDesc: "🌋 Skin Vulcão Vivo"        },
  { id: 25, desc: "Jogue 200 partidas",           goal: 200,    current: 0, reward: 0,     type: "games",      claimed: false, skinReward: "SkullCandy",  skinDesc: "💀 Skin Caveira"            },
  { id: 26, desc: "Junte 100.000 diamantes",      goal: 100000, current: 0, reward: 0,     type: "gems",       claimed: false, skinReward: "MoonMochi",   skinDesc: "🌕 Skin Lua Cheia"          },
  // ── Missões v5.0 ─────────────────────────────────────────
  { id: 27, desc: "Chegue ao Deserto",            goal: 1,      current: 0, reward: 18000, type: "biome5",     claimed: false },
  { id: 28, desc: "Chegue ao Ártico",             goal: 1,      current: 0, reward: 22000, type: "biome6",     claimed: false },
  { id: 29, desc: "Vença o Golem de Gelo",        goal: 1,      current: 0, reward: 0,     type: "boss2",      claimed: false, skinReward: "IceKing",     skinDesc: "🧊 Skin Rei do Gelo"        },
  { id: 30, desc: "Vença o Cacto Gigante",        goal: 1,      current: 0, reward: 0,     type: "boss2",      claimed: false, skinReward: "SandStorm",   skinDesc: "🌪️ Skin Tempestade de Areia" },
  { id: 31, desc: "Colete 500 power-ups",         goal: 500,    current: 0, reward: 25000, type: "powerup",    claimed: false },
  { id: 32, desc: "Derrote 30 bosses",            goal: 30,     current: 0, reward: 20000, type: "anyBoss",    claimed: false },
  { id: 33, desc: "Passe 5.000 canos no total",   goal: 5000,   current: 0, reward: 50000, type: "pipes",      claimed: false },
  { id: 34, desc: "Alcance combo ×100",           goal: 100,    current: 0, reward: 0,     type: "combo",      claimed: false, skinReward: "CrownBurger", skinDesc: "👑 Skin A Coroa (Lendário)" }
];

// Merge: preserva progresso/claimed das saves, injeta missões novas
function migrateMissions(saved) {
  return MISSIONS_MASTER.map((master) => {
    const old = (saved || []).find((s) => s.id === master.id);
    if (old) return Object.assign({}, master, { current: old.current, claimed: old.claimed });
    return Object.assign({}, master);
  });
}

// ============================================================
// 6. ESTADO DO JOGO
// ============================================================
let state = {
  game:           "MENU",
  score:          0,
  frames:         0,
  diamonds:       parseInt(localStorage.getItem("ff_gems"))   || 0,
  best:           parseInt(localStorage.getItem("ff_best"))   || 0,
  unlocked:       JSON.parse(localStorage.getItem("ff_unl"))  || ["Burger"],
  currentSkin:    "Burger",
  timeScale:      1,
  _startBiome:    parseInt(localStorage.getItem("ff_startbiome")) || 0,
  _skySelected:   !!localStorage.getItem("ff_skyselected"),
  unlockedBiomes: JSON.parse(localStorage.getItem("ff_biomes"))   || [0],
  // { biomeIdx: { a: bool, b: bool } } — bosses derrotados por bioma
  defeatedBosses: JSON.parse(localStorage.getItem("ff_defbosses")) || {},
  missions:       migrateMissions(JSON.parse(localStorage.getItem("ff_missions")))
};

// ============================================================
// 7. ESTATÍSTICAS GLOBAIS
// ============================================================
const STATS_KEY = "ff_stats";
function loadStats() {
  try { return JSON.parse(localStorage.getItem(STATS_KEY)) || {}; }
  catch (e) { return {}; }
}
let gameStats = Object.assign({
  totalGames: 0, totalPipes: 0, totalBossKills: 0, maxCombo: 0,
  totalDiamonds: 0, totalPlaySecs: 0, totalDeaths: 0, longestRun: 0
}, loadStats());
function saveStats() { localStorage.setItem(STATS_KEY, JSON.stringify(gameStats)); }
let _sessionStartTime = 0;

// ============================================================
// 8. SISTEMA DE CHECKPOINTS
// ============================================================
const CHECKPOINT_KEY = "ff_checkpoint";
let checkpoint = null;

function loadCheckpoint() {
  try { return JSON.parse(localStorage.getItem(CHECKPOINT_KEY)) || null; }
  catch (e) { return null; }
}

function saveCheckpoint(score, label) {
  const biomeIdx = getBiomeIndex();
  checkpoint = { score, label, biome: biomeIdx, biomeName: BIOMES[biomeIdx]?.name || "?", savedAt: Date.now() };
  localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(checkpoint));
}

function clearCheckpoint() {
  checkpoint = null;
  localStorage.removeItem(CHECKPOINT_KEY);
}
window.clearCheckpoint = clearCheckpoint;

function tryAutoCheckpoint() {
  const sp      = getScoreInBiome();
  const bi      = getBiomeIndex();
  const base    = bi * 80;
  const cpScore = checkpoint?.score || -1;
  let saved = false;
  if      (sp >= 60 && base + 60 > cpScore) { saveCheckpoint(base + 60, "🌌 Fase Livre"); saved = true; }
  else if (sp >= 40 && base + 40 > cpScore) { saveCheckpoint(base + 40, "🌙 Noite (Boss B)"); saved = true; }
  else if (sp >= 20 && base + 20 > cpScore) { saveCheckpoint(base + 20, "🌅 Pôr do Sol (Boss A)"); saved = true; }
  else if (sp === 0 && bi > 0 && base > cpScore) { saveCheckpoint(base, "🌍 " + (BIOMES[bi]?.name || "Novo Bioma")); saved = true; }
  // Notifica o jogador quando um novo checkpoint é salvo
  if (saved) showCenterNotif("💾 Checkpoint salvo: " + checkpoint.label, "#26c6da", 14, 100);
}

function useCheckpoint() {
  const cp = loadCheckpoint();
  if (!cp) return;
  window.skyMode        = false;
  state._skySelected    = false;
  localStorage.removeItem("ff_skyselected");
  state._startBiome = cp.biome;
  localStorage.setItem("ff_startbiome", cp.biome);
  _doStartGame();
  requestAnimationFrame(() => {
    state.score = cp.score;
    if (UI.score) UI.score.innerText = state.score;

    // Pré-resolve estado dos bosses com base no ponto do checkpoint
    // para não re-spawnar chefes que já foram derrotados nessa fase
    const sp = cp.score % 80;
    if (sp >= 40) {
      // Checkpoint na fase Noite ou Livre — Boss A e B já foram derrotados
      bossDefeated  = true;
      boss2Defeated = true;
      boss.active   = false;
      boss2.active  = false;
      hideBossUI();
    } else if (sp >= 20) {
      // Checkpoint na fase Pôr do Sol — Boss A já foi derrotado
      bossDefeated = true;
      boss.active  = false;
    }
  });
}
window.useCheckpoint = useCheckpoint;

// ============================================================
// 9. ESTADO DINÂMICO
// ============================================================
let player = {
  x: 80, y: 300, v: 0,
  shield: false, magnet: 0, turbo: 0, slow: 0, ghost: 0, star: 0,
  // v5.0
  freeze: 0, mini: 0, jumpsLeft: 1, doubleJumpReady: false,
  hitboxRadius: 18, tiltAngle: 0
};

let obstacles = [], coins = [], powerups = [], particles = [], trail = [], knives = [];
let boss  = { active: false, hp: 100, maxHp: 100, y: 200, dir: 1 };
let boss2 = { active: false, hp: 150, maxHp: 150, y: 300, dir: 1 };
let bossDefeated = false, boss2Defeated = false;
// Animação de morte
let deathAnim = { active: false, x: 0, y: 0, timer: 0, angle: 0, vy: 0, scale: 1 };
let gameLoopId  = null;
window.godMode  = localStorage.getItem("ff_godmode") === "1"; // persiste entre reloads
window.skyMode  = false;   // ☁️ flag do modo céu

let biomeNotif   = { text: "", timer: 0 };
let centerNotif  = { text: "", timer: 0, color: "#f1c40f", size: 20 };
let recordFlash  = { timer: 0 };
let comboDisplay = { value: 0, timer: 0 };
let combo        = 0;
let lastDiffLevel = 0;
// v5.0
let bossIntro   = { active: false, timer: 0, config: null, isBoss2: false };
let bossRage    = false;
let biomeFlash  = { timer: 0, color: "#fff" };
let lastMilestone = 0;
let prevBiome   = 0;

let isPaused = false;
function togglePause() {
  if (state.game !== "PLAYING") return;
  isPaused = !isPaused;
  if (!isPaused) {
    // ☁️ retorna ao loop correto dependendo do modo
    if (window.skyMode) skyGameLoop();
    else                gameLoop();
  }
}
window.togglePause = togglePause;

let screenShake = { x: 0, y: 0, timer: 0, intensity: 0 };
function triggerShake(intensity, duration) {
  if (!OPTIONS.shake) return;
  screenShake.intensity = intensity || 6;
  screenShake.timer     = duration  || 18;
}

function showCenterNotif(text, color, size, duration) {
  centerNotif = { text: text || "", color: color || "#f1c40f", size: size || 20, timer: duration || 80 };
}

// Reseta estado dos bosses sem duplicar código
function resetBossState() {
  boss.active  = false; boss2.active  = false;
  bossDefeated = false; boss2Defeated = false;
  knives = [];
  hideBossUI();
}

// ============================================================
// 10. TUTORIAL
// ============================================================
let tutorialSeen = localStorage.getItem("ff_tut") === "1";
let tutorialPage = 0;
const TUTORIAL_PAGES = [
  {
    title: "Como Jogar", icon: "🕹️",
    lines: [
      "🖱️  Clique / Toque — faz o personagem subir",
      "⌨️  Barra de Espaço — mesma função",
      "⏸  Tecla P — pausa o jogo a qualquer hora",
      "⚠️  Evite os canos e o chão!",
      "💎  Colete diamantes para comprar novas skins"
    ]
  },
  {
    title: "Power-ups", icon: "⚡",
    lines: [
      "🛡️  Escudo    — absorve 1 hit",
      "🧲  Ímã       — atrai diamantes",
      "🚀  Turbo     — velocidade ×1.8",
      "⏰  Câmera Lenta — respire fundo!",
      "👻  Fantasma  — atravessa canos",
      "⭐  Estrela   — pontos ×3 por cano",
      "💥  Bomba     — destroi todos os canos",
      "🍀  Trevo     — +50 gemas!",
      "❄️  Congelamento — para tudo por 5s!",
      "🦘  Salto Duplo — salte no ar!",
      "🔵  Mini Mode  — hitbox minúsculo"
    ]
  },
  {
    title: "Combo & Dificuldade", icon: "🔥",
    lines: [
      "Passe canos sem levar hit para acumular combo!",
      "A cada 5 canos consecutivos: +10 💎 de bônus",
      "A cada 20 pontos o jogo fica mais rápido 📈",
      "Velocidade máxima: ⚡ 8.0 — sobreviva!",
      "A barra inferior esquerda mostra a velocidade atual"
    ]
  },
  {
    title: "Biomas & Bosses", icon: "🗺️",
    lines: [
      "Cada 80 pontos = 1 bioma completo",
      "🌅  Score 20 do bioma → Boss A (pôr do sol)",
      "🌙  Score 40 do bioma → Boss B (noite)",
      "Derrote o Boss B para desbloquear o próximo bioma!",
      "☁️  Modo Céu: Flappy puro disponível no menu de Biomas!"
    ]
  }
];

// ============================================================
// 11. PLACAR LOCAL (TOP 10)
// ============================================================
const SCORES_KEY = "ff_scores";

function getScores() {
  try { return JSON.parse(localStorage.getItem(SCORES_KEY)) || []; }
  catch (e) { return []; }
}

function saveHighScore(name, score) {
  let scores = getScores();
  scores.push({
    name:  (name || "Anônimo").slice(0, 16),
    score,
    // ☁️ usa label especial no modo céu
    biome: window.skyMode ? "☁️ Céu" : (BIOMES[getBiomeIndex()]?.name || "?"),
    date:  new Date().toLocaleDateString("pt-BR")
  });
  scores.sort((a, b) => b.score - a.score);
  scores = scores.slice(0, 10);
  localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
}

function renderScoreboard(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const scores = getScores();
  if (!scores.length) {
    el.innerHTML = "<p style='color:#aaa;text-align:center;font-family:Arial;padding:12px'>Nenhum recorde ainda. Seja o primeiro! 🏅</p>";
    return;
  }
  const medals  = ["🥇", "🥈", "🥉"];
  const rankBgs = ["rgba(255,215,0,.18)", "rgba(192,192,192,.12)", "rgba(205,127,50,.12)"];
  const rankBrd = ["#ffd700", "#c0c0c0", "#cd7f32"];
  el.innerHTML = scores.map((s, i) => `
    <div style="display:flex;justify-content:space-between;align-items:center;
                background:${rankBgs[i] || "rgba(255,255,255,.05)"};
                border-radius:10px;padding:10px 14px;margin:5px 0;
                border-left:4px solid ${rankBrd[i] || "#555"};
                box-shadow:${i < 3 ? "0 2px 8px rgba(0,0,0,.3)" : "none"}">
      <span style="font-size:22px;min-width:36px;line-height:1">${medals[i] || "<span style='color:#aaa;font-family:Arial;font-size:13px'>#" + (i + 1) + "</span>"}</span>
      <span style="color:white;font-weight:bold;flex:1;text-align:left;padding:0 10px;
                   font-family:'Fredoka One',Arial;font-size:${i < 3 ? 15 : 13}px;
                   text-shadow:${i === 0 ? "0 0 8px rgba(255,215,0,.5)" : "none"}">${s.name}</span>
      <span style="color:${rankBrd[i] || "#f1c40f"};font-weight:bold;font-family:'Fredoka One',Arial;
                   font-size:${i < 3 ? 16 : 13}px;min-width:52px;text-align:right">${s.score}</span>
      <span style="color:rgba(255,255,255,.4);font-size:10px;font-family:Arial;min-width:56px;text-align:right;margin-left:6px">${s.date}</span>
    </div>`).join("");
}

// ============================================================
// 12. UTILITÁRIOS
// ============================================================
function playNote(freq, type, duration, vol) {
  if (!OPTIONS.sfxOn) return;
  vol = (vol || 0.05) * (OPTIONS.sfxVol / 0.05);
  try {
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

function save() {
  localStorage.setItem("ff_gems",        state.diamonds);
  localStorage.setItem("ff_best",        state.best);
  localStorage.setItem("ff_unl",         JSON.stringify(state.unlocked));
  localStorage.setItem("ff_missions",    JSON.stringify(state.missions));
  localStorage.setItem("ff_biomes",      JSON.stringify(state.unlockedBiomes));
  localStorage.setItem("ff_startbiome",  state._startBiome);
  localStorage.setItem("ff_defbosses",   JSON.stringify(state.defeatedBosses));
}

function circleCollision(x1, y1, r1, x2, y2, r2) {
  return Math.hypot(x1 - x2, y1 - y2) < r1 + r2;
}

// FIX v4.2: garante que y retornado seja sempre válido
function getSafeY(spawnX) {
  const margin   = 50;
  const topLimit = margin;
  const botLimit = canvas.height - 28 - margin;
  const nearPipe = obstacles.find((o) => Math.abs(o.x - spawnX) < 200);
  if (nearPipe) {
    const gapTop = nearPipe.h + 20, gapBot = nearPipe.h + nearPipe.gap - 20;
    const safeTop = Math.max(gapTop, topLimit), safeBot = Math.min(gapBot, botLimit);
    if (safeBot - safeTop < 30) return null;
    return safeTop + Math.random() * (safeBot - safeTop);
  }
  return topLimit + Math.random() * (botLimit - topLimit);
}

// ============================================================
// 13. TELAS E UI
// ============================================================
function showScreen(id) {
  document.querySelectorAll(".menu-screen").forEach((s) => (s.style.display = "none"));
  const screen = document.getElementById(id);
  if (screen) screen.style.display = "block";

  const fullScreens = ["options-screen", "stats-screen"];
  if (UI.overlay) {
    if (id === "admin-screen") {
      UI.overlay.style.display = "none";
      // Abre na aba Info por padrão e atualiza dados
      requestAnimationFrame(() => { if(window.admTab) { admTab("info"); _admRefresh(); } });
    } else if (id === "game-screen") {
      UI.overlay.style.display  = "none";
      UI.overlay.style.overflow = "hidden";
    } else if (fullScreens.includes(id)) {
      UI.overlay.style.display   = "block";
      UI.overlay.style.overflowY = "hidden";
      UI.overlay.style.padding   = "0";
    } else {
      UI.overlay.style.display   = "flex";
      UI.overlay.style.overflowY = "";
      UI.overlay.style.padding   = "";
    }
  }
  // Esconde qualquer scrollbar do body durante o jogo
  const isGame = (id === "game-screen");
  document.body.style.overflow = isGame ? "hidden" : "";
  document.body.classList.toggle("ff-playing", isGame);

  // Remove overlay de game over injetado ao voltar ao menu
  if (id === "main-menu") {
    const goOverlay = document.getElementById("ff-gameover-overlay");
    if (goOverlay) goOverlay.remove();
    // Atualiza skin visível no menu
    const skinTag = document.getElementById("ff-menu-skin");
    if (skinTag) {
      const s = SKINS[state.currentSkin] || SKINS["Burger"];
      skinTag.textContent = s.emoji + " " + state.currentSkin;
    } else {
      // Injeta a tag de skin uma vez
      const playBtn = document.querySelector("#main-menu .play-btn, #main-menu button");
      if (playBtn && playBtn.parentElement) {
        const tag = document.createElement("div");
        tag.id = "ff-menu-skin";
        tag.style.cssText = `
          text-align:center; font-size:13px; color:rgba(255,255,255,0.65);
          font-family:'Fredoka One',Arial; margin-bottom:6px; letter-spacing:0.5px;
        `;
        const s = SKINS[state.currentSkin] || SKINS["Burger"];
        tag.textContent = s.emoji + " " + state.currentSkin;
        playBtn.parentElement.insertBefore(tag, playBtn);
      }
    }
  }

  if (id === "shop-screen")     renderShop();
  if (id === "missions-screen") renderMissions();
  if (id === "biomes-screen")   renderBiomes();
  if (id === "scores-screen")   renderScoreboard("scores-list");
  if (id === "options-screen")  renderOptions();
  if (id === "stats-screen")    renderStatsScreen();

  if (screen)     screen.scrollTop     = 0;
  if (UI.overlay) UI.overlay.scrollTop = 0;
}
window.showScreen = showScreen; // expõe imediatamente para onclick inline
function injectStatsScreen() {
  if (document.getElementById("stats-screen")) return;
  const div = document.createElement("div");
  div.id        = "stats-screen";
  div.className = "menu-screen";
  div.style.cssText = "display:none;padding:0;width:100%;height:100%;overflow-y:auto;-webkit-overflow-scrolling:touch;";
  div.innerHTML = `
    <div style="background:linear-gradient(160deg,#0f2027 0%,#203a43 50%,#2c5364 100%);
                min-height:100%;padding:20px 18px 28px;box-sizing:border-box;
                font-family:'Fredoka One',Arial,sans-serif;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;
                  position:sticky;top:0;background:linear-gradient(160deg,#0f2027,#203a43);
                  padding:4px 0 12px;z-index:10;border-bottom:1px solid rgba(255,255,255,.08)">
        <button onclick="showScreen('main-menu')"
          style="background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.2);border-radius:8px;
                 color:white;font-size:18px;padding:8px 16px;cursor:pointer;font-family:'Fredoka One',Arial">← Voltar</button>
        <h2 style="margin:0;color:#f1c40f;font-size:20px">📊 Estatísticas</h2>
        <div style="width:80px"></div>
      </div>
      <div id="stats-content"></div>
      <div style="text-align:center;margin-top:16px;display:flex;flex-direction:column;gap:8px">
        <button onclick="confirmResetStats()"
          style="background:rgba(231,76,60,.2);border:1px solid rgba(231,76,60,.4);
                 border-radius:8px;color:rgba(231,76,60,.8);font-size:12px;padding:7px 16px;
                 cursor:pointer;font-family:'Fredoka One',Arial">🗑️ Zerar estatísticas</button>
        <button onclick="confirmResetAll()"
          style="background:rgba(231,76,60,.35);border:2px solid rgba(231,76,60,.7);
                 border-radius:8px;color:#ff6b6b;font-size:13px;padding:9px 16px;
                 cursor:pointer;font-family:'Fredoka One',Arial">⚠️ Resetar jogo completo</button>
      </div>
    </div>`;
  (document.getElementById("screen-overlay") || document.body).appendChild(div);
}

function renderStatsScreen() {
  const el = document.getElementById("stats-content");
  if (!el) return;
  const s    = gameStats;
  const hrs  = Math.floor(s.totalPlaySecs / 3600);
  const mins = Math.floor((s.totalPlaySecs % 3600) / 60);
  const secs = s.totalPlaySecs % 60;
  const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  const cards = [
    { icon: "🎮", label: "Partidas jogadas",    value: s.totalGames.toLocaleString("pt-BR"),     color: "#42a5f5" },
    { icon: "💀", label: "Total de mortes",      value: s.totalDeaths.toLocaleString("pt-BR"),    color: "#ef5350" },
    { icon: "🏆", label: "Maior pontuação",      value: s.longestRun.toLocaleString("pt-BR"),     color: "#ffd700" },
    { icon: "🚩", label: "Canos passados",       value: s.totalPipes.toLocaleString("pt-BR"),     color: "#66bb6a" },
    { icon: "☠️", label: "Bosses derrotados",    value: s.totalBossKills.toLocaleString("pt-BR"), color: "#ab47bc" },
    { icon: "🔥", label: "Maior combo",          value: "×" + s.maxCombo,                         color: "#ff7043" },
    { icon: "💎", label: "Diamantes totais",     value: s.totalDiamonds.toLocaleString("pt-BR"),  color: "#26c6da" },
    { icon: "⏱️", label: "Tempo de jogo",        value: timeStr || "0s",                           color: "#ffca28" },
    { icon: "🎨", label: "Skins desbloqueadas",  value: state.unlocked.length + " / " + Object.keys(SKINS).length, color: "#ec407a" },
    { icon: "🌍", label: "Biomas desbloqueados", value: state.unlockedBiomes.length + " / " + BIOMES.length,       color: "#26a69a" }
  ];
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      ${cards.map((c) => `
        <div style="background:rgba(255,255,255,.07);border-radius:12px;padding:14px 12px;
                    border-left:3px solid ${c.color};display:flex;flex-direction:column;gap:4px">
          <div style="font-size:20px">${c.icon}</div>
          <div style="color:${c.color};font-size:20px;font-weight:bold;line-height:1">${c.value}</div>
          <div style="color:rgba(255,255,255,.5);font-size:10px;font-family:Arial">${c.label}</div>
        </div>`).join("")}
    </div>
    ${s.totalGames > 0 ? `
    <div style="background:rgba(255,255,255,.05);border-radius:12px;padding:14px;margin-top:12px;
                border:1px solid rgba(255,255,255,.08)">
      <div style="color:#f1c40f;font-size:13px;margin-bottom:8px">📈 Médias</div>
      <div style="display:flex;justify-content:space-around;text-align:center">
        <div>
          <div style="color:white;font-size:16px;font-weight:bold">${Math.floor(s.totalPipes / s.totalGames)}</div>
          <div style="color:rgba(255,255,255,.45);font-size:10px;font-family:Arial">canos/partida</div>
        </div>
        <div>
          <div style="color:white;font-size:16px;font-weight:bold">${Math.floor(s.totalPlaySecs / s.totalGames)}s</div>
          <div style="color:rgba(255,255,255,.45);font-size:10px;font-family:Arial">tempo/partida</div>
        </div>
        <div>
          <div style="color:white;font-size:16px;font-weight:bold">${Math.floor(s.totalDiamonds / Math.max(s.totalGames, 1))}</div>
          <div style="color:rgba(255,255,255,.45);font-size:10px;font-family:Arial">💎/partida</div>
        </div>
      </div>
    </div>` : ""}`;
}

// ── Tela de Opções ───────────────────────────────────────────
function injectOptionsScreen() {
  if (document.getElementById("options-screen")) return;
  const div = document.createElement("div");
  div.id        = "options-screen";
  div.className = "menu-screen";
  div.style.cssText = "display:none;padding:0;width:100%;height:100%;overflow-y:auto;-webkit-overflow-scrolling:touch;";
  div.innerHTML = `
    <div style="background:linear-gradient(160deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);
                min-height:100%;padding:20px 18px 24px;box-sizing:border-box;
                font-family:'Fredoka One',Arial,sans-serif;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;
                  position:sticky;top:0;background:linear-gradient(160deg,#1a1a2e,#16213e);
                  padding:4px 0 12px;z-index:10;border-bottom:1px solid rgba(255,255,255,.08)">
        <button onclick="showScreen('main-menu')"
          style="background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.2);border-radius:8px;
                 color:white;font-size:18px;padding:8px 16px;cursor:pointer;line-height:1;
                 font-family:'Fredoka One',Arial">← Voltar</button>
        <h2 style="margin:0;color:#f1c40f;font-size:20px;letter-spacing:.5px">⚙️ Opções</h2>
        <div style="width:80px"></div>
      </div>

      <div class="opt-section">
        <div class="opt-section-title">🎵 Áudio</div>
        <div class="opt-row">
          <span class="opt-label">🎶 Música</span>
          <label class="opt-toggle">
            <input type="checkbox" id="opt-music-on" onchange="optMusicToggle(this.checked)">
            <span class="opt-slider"></span>
          </label>
        </div>
        <div class="opt-row opt-sub" id="opt-music-vol-row">
          <span class="opt-label" style="font-size:12px;opacity:.8">Volume da música</span>
          <div style="display:flex;align-items:center;gap:8px">
            <input type="range" id="opt-music-vol" min="0" max="100" step="5"
              oninput="optMusicVol(this.value)" style="width:110px;accent-color:#f1c40f">
            <span id="opt-music-vol-label" style="color:#f1c40f;font-size:13px;min-width:30px;text-align:right"></span>
          </div>
        </div>
        <div class="opt-row" style="margin-top:10px">
          <span class="opt-label">🔊 Efeitos sonoros</span>
          <label class="opt-toggle">
            <input type="checkbox" id="opt-sfx-on" onchange="optSfxToggle(this.checked)">
            <span class="opt-slider"></span>
          </label>
        </div>
        <div class="opt-row opt-sub" id="opt-sfx-vol-row">
          <span class="opt-label" style="font-size:12px;opacity:.8">Volume dos efeitos</span>
          <div style="display:flex;align-items:center;gap:8px">
            <input type="range" id="opt-sfx-vol" min="0" max="100" step="5"
              oninput="optSfxVol(this.value)" style="width:110px;accent-color:#f1c40f">
            <span id="opt-sfx-vol-label" style="color:#f1c40f;font-size:13px;min-width:30px;text-align:right"></span>
          </div>
        </div>
      </div>

      <div class="opt-section">
        <div class="opt-section-title">✨ Visual</div>
        <div class="opt-row">
          <div>
            <span class="opt-label">💥 Partículas &amp; Explosões</span>
            <div class="opt-desc">Efeitos visuais ao colidir e pegar itens</div>
          </div>
          <label class="opt-toggle">
            <input type="checkbox" id="opt-particles" onchange="optToggle('particles',this.checked)">
            <span class="opt-slider"></span>
          </label>
        </div>
        <div class="opt-row">
          <div>
            <span class="opt-label">🌟 Trilha do personagem</span>
            <div class="opt-desc">Rastro branco deixado ao voar</div>
          </div>
          <label class="opt-toggle">
            <input type="checkbox" id="opt-trail" onchange="optToggle('trail',this.checked)">
            <span class="opt-slider"></span>
          </label>
        </div>
        <div class="opt-row">
          <div>
            <span class="opt-label">📳 Vibração de tela</span>
            <div class="opt-desc">Tremor ao tomar dano ou matar boss</div>
          </div>
          <label class="opt-toggle">
            <input type="checkbox" id="opt-shake" onchange="optToggle('shake',this.checked)">
            <span class="opt-slider"></span>
          </label>
        </div>
      </div>

      <div class="opt-section">
        <div class="opt-section-title">💾 Dados do jogo</div>
        <div class="opt-row" style="flex-direction:column;gap:8px;align-items:stretch">
          <div style="color:rgba(255,255,255,.6);font-size:12px;text-align:center">
            💎 <span id="opt-diamonds-count"></span> diamantes &nbsp;|&nbsp;
            🏆 Recorde: <span id="opt-best-count"></span> &nbsp;|&nbsp;
            🎮 <span id="opt-skins-count"></span> skins
          </div>
          <button onclick="optResetSave()"
            style="background:rgba(231,76,60,.25);border:1px solid #e74c3c;border-radius:8px;
                   color:#e74c3c;font-size:13px;padding:9px;cursor:pointer;font-family:'Fredoka One',Arial">
            🗑️ Apagar progresso
          </button>
          <button onclick="optResetTutorial(event)"
            style="background:rgba(52,152,219,.2);border:1px solid #3498db;border-radius:8px;
                   color:#3498db;font-size:13px;padding:9px;cursor:pointer;font-family:'Fredoka One',Arial">
            📖 Ver tutorial novamente
          </button>
          <button onclick="optClearCheckpoint(event)"
            style="background:rgba(241,196,15,.1);border:1px solid rgba(241,196,15,.4);border-radius:8px;
                   color:#f1c40f;font-size:13px;padding:9px;cursor:pointer;font-family:'Fredoka One',Arial">
            💾 Apagar checkpoint salvo
          </button>
        </div>
      </div>

      <div style="text-align:center;color:rgba(255,255,255,.25);font-size:11px;margin-top:14px">
        Flappy Food v5.0 + Céu ☁️ · feito com ❤️
      </div>
    </div>

    <style>
      .opt-section { background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:14px 16px;margin-bottom:14px; }
      .opt-section-title { color:#f1c40f;font-family:'Fredoka One',Arial,sans-serif;font-size:14px;letter-spacing:.4px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,.08); }
      .opt-row   { display:flex;justify-content:space-between;align-items:center;padding:6px 0; }
      .opt-sub   { padding:4px 0 4px 12px;border-left:2px solid rgba(241,196,15,.2);margin:4px 0 6px 4px; }
      .opt-label { color:white;font-family:'Fredoka One',Arial,sans-serif;font-size:14px; }
      .opt-desc  { color:rgba(255,255,255,.45);font-size:11px;margin-top:2px;font-family:Arial,sans-serif; }
      .opt-toggle { position:relative;display:inline-block;width:44px;height:24px;flex-shrink:0; }
      .opt-toggle input { opacity:0;width:0;height:0; }
      .opt-slider { position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:#555;border-radius:24px;transition:.3s; }
      .opt-slider:before { position:absolute;content:"";height:18px;width:18px;left:3px;bottom:3px;background:white;border-radius:50%;transition:.3s; }
      .opt-toggle input:checked + .opt-slider { background:#2ecc71; }
      .opt-toggle input:checked + .opt-slider:before { transform:translateX(20px); }
    </style>`;
  (document.getElementById("screen-overlay") || document.body).appendChild(div);
}

function renderOptions() {
  const _s = (id, val) => { const el = document.getElementById(id); if (el) el[typeof val === "boolean" ? "checked" : "value"] = val; };
  const _t = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
  _s("opt-music-on",  OPTIONS.musicOn);
  _s("opt-sfx-on",    OPTIONS.sfxOn);
  _s("opt-particles", OPTIONS.particles);
  _s("opt-trail",     OPTIONS.trail);
  _s("opt-shake",     OPTIONS.shake);
  _s("opt-music-vol", Math.round(OPTIONS.musicVol * 100));
  _s("opt-sfx-vol",   Math.round(OPTIONS.sfxVol   * 100));
  _t("opt-music-vol-label", Math.round(OPTIONS.musicVol * 100) + "%");
  _t("opt-sfx-vol-label",   Math.round(OPTIONS.sfxVol   * 100) + "%");
  const mRow = document.getElementById("opt-music-vol-row");
  const sRow = document.getElementById("opt-sfx-vol-row");
  if (mRow) mRow.style.opacity = OPTIONS.musicOn ? "1" : "0.35";
  if (sRow) sRow.style.opacity = OPTIONS.sfxOn   ? "1" : "0.35";
  _t("opt-diamonds-count", state.diamonds.toLocaleString("pt-BR"));
  _t("opt-best-count",     state.best);
  _t("opt-skins-count",    state.unlocked.length + "/" + Object.keys(SKINS).length);
}

// ── Menu de Biomas — inclui card ☁️ Modo Céu ────────────────
function renderBiomes() {
  const grid = document.getElementById("biomes-grid");
  if (!grid) return;
  grid.innerHTML = "";
  // Mata qualquer scrollbar no grid e nos pais
  grid.style.overflowX = "hidden";
  if (grid.parentElement) {
    grid.parentElement.style.overflowX = "hidden";
  }

  // Biomas normais
  BIOMES.forEach((biome, idx) => {
    const unlocked = state.unlockedBiomes.includes(idx);
    const selected = state._startBiome === idx;
    const div      = document.createElement("div");
    div.className  = "biome-item" + (selected ? " biome-active" : "") + (unlocked ? "" : " biome-locked");
    const [biomeEmoji, ...biomeName] = biome.name.split(" ");
    const db   = state.defeatedBosses[idx] || {};
    div.innerHTML = `
      <div class="biome-icon">${unlocked ? biomeEmoji : "🔒"}</div>
      <div class="biome-name">${unlocked ? biomeName.join(" ") : "???"}</div>
      <div class="biome-bosses">${unlocked
        ? `${db.a ? "✅" : ""}${biome.bossA.emoji} ${db.b ? "✅" : ""}${biome.bossB.emoji}`
        : "Derrote o Boss B do bioma anterior"
      }</div>
      ${selected ? '<div class="biome-selected-tag">SELECIONADO</div>' : ""}`;
    if (unlocked) {
      div.onclick = () => {
        state._startBiome  = idx;
        state._skySelected = false;
        localStorage.setItem("ff_startbiome", idx);
        localStorage.removeItem("ff_skyselected");
        renderBiomes();
        playNote(500, "sine", 0.15);
      };
    }
    grid.appendChild(div);
  });

  // ☁️ Card Modo Céu — sempre disponível no final do grid
  const skySelected = !!state._skySelected;
  const skyCard = document.createElement("div");
  skyCard.id        = "sky-biome-card";
  skyCard.className = "biome-item" + (skySelected ? " biome-active" : "");
  skyCard.style.cssText = `
    background: linear-gradient(135deg, rgba(41,182,246,${skySelected ? ".45" : ".25"}) 0%, rgba(1,87,155,${skySelected ? ".5" : ".3"}) 100%);
    ${skySelected ? "" : "border: 2px solid rgba(129,212,250,.5);"}
    box-shadow: 0 4px 18px rgba(41,182,246,${skySelected ? ".5" : ".3"});
    cursor: pointer;
    position: relative;
    overflow: hidden;
    grid-column: 1 / -1;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 16px;
    padding: 16px 22px;
    text-align: left;
  `;
  skyCard.innerHTML = `
    <div class="biome-icon" style="font-size:48px;line-height:1;flex-shrink:0">☁️</div>
    <div style="flex:1">
      <div class="biome-name" style="color:#81d4fa;font-size:18px">Modo Céu</div>
      <div class="biome-bosses" style="color:rgba(255,255,255,.55);font-size:12px;margin:3px 0">
        Flappy clássico · sem power-ups · sem bosses
      </div>
      <div style="margin-top:6px;background:rgba(41,182,246,.35);border-radius:6px;
                  padding:3px 10px;font-size:11px;color:#b3e5fc;
                  font-family:'Fredoka One',Arial;display:inline-block">
        SEMPRE DISPONÍVEL
      </div>
    </div>
    ${skySelected ? '<div class="biome-selected-tag">SELECIONADO</div>' : ""}
  `;
  skyCard.onclick = () => {
    // Apenas seleciona — igual aos outros biomas
    state._skySelected = true;
    state._startBiome  = 0; // sky sempre começa do zero
    localStorage.setItem("ff_skyselected", "1");
    playNote(660, "triangle", 0.15);
    renderBiomes();
  };
  grid.appendChild(skyCard);
}


// ============================================================
// 14. ANIMAÇÃO DE DESBLOQUEIO DE SKIN
// ============================================================
function playSkinUnlockAnimation(skinKey) {
  const item = SKINS[skinKey];
  if (!item) return;
  let rarity, color1, color2;
  if      (item.price >= 8000) { rarity = "LENDÁRIO!";     color1 = "#ffd700"; color2 = "#ff8c00"; }
  else if (item.price >= 4000) { rarity = "ÉPICO!";         color1 = "#ce93d8"; color2 = "#9c27b0"; }
  else if (item.price >= 2000) { rarity = "MÉDIO!";         color1 = "#42a5f5"; color2 = "#1565c0"; }
  else                          { rarity = "DESBLOQUEADO!"; color1 = "#4caf50"; color2 = "#1b5e20"; }
  if (item.price === 0)         { rarity = "GRÁTIS!";       color1 = "#4caf50"; color2 = "#1b5e20"; }

  const old = document.getElementById("unlock-overlay");
  if (old) old.remove();
  const overlay = document.createElement("div");
  overlay.id = "unlock-overlay";
  overlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    background:rgba(0,0,0,0);pointer-events:none;transition:background .25s ease;`;
  overlay.innerHTML = `
    <style>
      @keyframes unlockPop  { 0%{transform:scale(.2) rotate(-20deg);opacity:0} 60%{transform:scale(1.25) rotate(5deg);opacity:1} 80%{transform:scale(.92) rotate(-2deg)} 100%{transform:scale(1) rotate(0)} }
      @keyframes unlockGlow { 0%,100%{box-shadow:0 0 40px 10px ${color1}} 50%{box-shadow:0 0 80px 30px ${color2}} }
      @keyframes unlockText { 0%{transform:translateY(30px);opacity:0} 100%{transform:translateY(0);opacity:1} }
      @keyframes unlockStar { 0%{transform:scale(0) rotate(0);opacity:1} 100%{transform:scale(1.5) rotate(360deg);opacity:0} }
      @keyframes unlockFadeOut { 0%{opacity:1} 100%{opacity:0} }
      .unlock-card { display:flex;flex-direction:column;align-items:center;justify-content:center;
        background:linear-gradient(160deg,rgba(0,0,0,.9),rgba(20,10,40,.95));
        border:3px solid ${color1};border-radius:24px;padding:40px 50px;position:relative;overflow:hidden;
        animation:unlockGlow 1.2s ease infinite; }
      .unlock-emoji  { font-size:90px;line-height:1;animation:unlockPop .6s cubic-bezier(.34,1.56,.64,1) forwards;filter:drop-shadow(0 0 20px ${color1}); }
      .unlock-rarity { font-family:'Fredoka One',Arial,sans-serif;font-size:22px;font-weight:bold;color:${color1};margin-top:16px;animation:unlockText .4s .5s ease both;letter-spacing:1px;text-shadow:0 0 12px ${color1}; }
      .unlock-name   { font-family:'Fredoka One',Arial,sans-serif;font-size:15px;color:rgba(255,255,255,.7);margin-top:6px;animation:unlockText .4s .65s ease both; }
      .unlock-star   { position:absolute;font-size:28px;animation:unlockStar .9s ease-out forwards; }
      .unlock-bg-ring { position:absolute;border-radius:50%;border:2px solid ${color1};animation:unlockStar 1.1s .1s ease-out forwards;width:120px;height:120px;opacity:.4; }
    </style>
    <div class="unlock-card" id="unlock-card">
      <div class="unlock-bg-ring"></div>
      <div class="unlock-emoji">${item.emoji}</div>
      <div class="unlock-rarity">${rarity}</div>
      <div class="unlock-name">${skinKey}</div>
      <div class="unlock-star" style="top:15%;left:15%;animation-delay:.1s">✨</div>
      <div class="unlock-star" style="top:10%;right:20%;animation-delay:.25s">⭐</div>
      <div class="unlock-star" style="bottom:20%;left:10%;animation-delay:.15s">💫</div>
      <div class="unlock-star" style="bottom:15%;right:15%;animation-delay:.3s">✨</div>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => { overlay.style.background = "rgba(0,0,0,0.82)"; });
  setTimeout(() => playNote(600,  "sine",   0.12, 0.08), 50);
  setTimeout(() => playNote(750,  "sine",   0.12, 0.08), 180);
  setTimeout(() => playNote(900,  "sine",   0.15, 0.1),  310);
  setTimeout(() => playNote(1100, "square", 0.2,  0.08), 450);
  setTimeout(() => {
    const card = document.getElementById("unlock-card");
    if (card) card.style.cssText += ";animation:unlockFadeOut .4s ease forwards;";
    overlay.style.transition = "background .4s ease";
    overlay.style.background = "rgba(0,0,0,0)";
    setTimeout(() => { overlay.remove(); renderShop(); }, 420);
  }, 2400);
}

// ============================================================
// 15. LOJA
// ============================================================
function renderShop() {
  const grid = document.getElementById("shop-grid");
  if (!grid) return;
  if (UI.shopCoins) UI.shopCoins.innerText = state.diamonds;
  grid.innerHTML = "";

  // Ordena por preço crescente (exclusivas no final)
  const sortedKeys = Object.keys(SKINS).sort((a, b) => {
    const ia = SKINS[a], ib = SKINS[b];
    if (ia.exclusive && !ib.exclusive) return 1;
    if (!ia.exclusive && ib.exclusive) return -1;
    return (ia.price || 0) - (ib.price || 0);
  });

  for (const key of sortedKeys) {
    const item      = SKINS[key];
    const owned     = state.unlocked.includes(key);
    const equipped  = state.currentSkin === key;
    const isExclusive = !!item.exclusive;

    // FIX v4.2: era `return` — interrompia o loop; trocado por `continue`
    if (isExclusive && !owned) continue;

    const div = document.createElement("div");
    let rarity, rarityColor, rarityClass;
    if      (isExclusive)        { rarity = "EXCLUSIVA"; rarityColor = "#ff6d00"; rarityClass = "legendary"; }
    else if (item.price >= 8000) { rarity = "LENDÁRIO";  rarityColor = "#ffd700"; rarityClass = "legendary"; }
    else if (item.price >= 4000) { rarity = "ÉPICO";     rarityColor = "#ce93d8"; rarityClass = "epic"; }
    else if (item.price >= 2000) { rarity = "MÉDIO";     rarityColor = "#42a5f5"; rarityClass = "medium"; }
    else                          { rarity = "COMUM";     rarityColor = "#9e9e9e"; rarityClass = "common"; }
    if (item.price === 0) rarity = "GRÁTIS";

    div.className = ["shop-item", equipped ? "active" : "", owned ? "owned" : "", rarityClass].filter(Boolean).join(" ");
    const statusLine = owned
      ? equipped ? `<small class="status-equipped">EQUIPADO</small>` : ""
      : `<small class="status-price">💎 ${item.price.toLocaleString()}</small>`;
    div.innerHTML = `<div style="font-size:30px;line-height:1">${item.emoji}</div>
      <small class="rarity-label" style="color:${rarityColor}">${rarity}</small>${statusLine}`;
    div.onclick = () => {
      if (owned) {
        state.currentSkin = key;
      } else if (state.diamonds >= item.price) {
        state.diamonds -= item.price;
        state.unlocked.push(key);
        state.currentSkin = key;
        save();
        playSkinUnlockAnimation(key);
        return;
      }
      // Atualiza tag de skin no menu principal se já estiver injetada
      const skinTag = document.getElementById("ff-menu-skin");
      if (skinTag) {
        const s = SKINS[state.currentSkin] || SKINS["Burger"];
        skinTag.textContent = s.emoji + " " + state.currentSkin;
      }
      renderShop();
    };
    grid.appendChild(div);
  }
}

// ============================================================
// 16. MISSÕES
// ============================================================
function renderMissions() {
  const list = document.getElementById("missions-list");
  if (!list) return;
  list.innerHTML = "";
  // FIX v4.2: sincroniza valores antes de renderizar
  updateMission("gems",   state.diamonds,        true);
  updateMission("unlock", state.unlocked.length, true);

  const active = state.missions.filter((m) => !m.claimed && m.current < m.goal);
  const ready  = state.missions.filter((m) => !m.claimed && m.current >= m.goal);
  const done   = state.missions.filter((m) => m.claimed);

  function renderGroup(title, missions, color) {
    if (!missions.length) return;
    const hdr = document.createElement("div");
    hdr.style.cssText = `color:${color};font-size:12px;font-weight:bold;margin:12px 0 4px;text-transform:uppercase;letter-spacing:.5px;`;
    hdr.innerText = `${title} (${missions.length})`;
    list.appendChild(hdr);
    missions.forEach((m) => {
      const pct      = Math.min((m.current / m.goal) * 100, 100);
      const isReady  = m.current >= m.goal;
      const isSkin   = !!m.skinReward;
      const div      = document.createElement("div");
      div.style.cssText = `background:${isSkin ? "rgba(206,147,216,.1)" : "#34495e"};margin:6px 0;padding:10px;
        border-radius:8px;text-align:left;
        border-left:5px solid ${isReady ? (isSkin ? "#ce93d8" : "#2ecc71") : m.claimed ? "#555" : "#e74c3c"};
        opacity:${m.claimed ? ".5" : "1"}`;
      const rewardBadge = isSkin
        ? `<span style="color:#ce93d8;font-size:12px;font-weight:bold">${m.skinDesc}</span>`
        : `<span style="color:#f1c40f">💎 ${m.reward.toLocaleString("pt-BR")}</span>`;
      const actionBtn = isReady && !m.claimed
        ? `<button onclick="claimMissionReward(${m.id})"
             style="background:${isSkin ? "#9c27b0" : "#f1c40f"};border:none;padding:3px 12px;
                    border-radius:4px;cursor:pointer;font-weight:bold;color:white;font-size:12px">
             ${isSkin ? "🎁 RESGATAR" : "COLETAR"}</button>`
        : m.claimed
          ? `<span style="color:#2ecc71;font-size:12px">✅ CONCLUÍDO</span>`
          : `<span style="color:rgba(255,255,255,.4);font-size:11px">EM ANDAMENTO</span>`;
      div.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;color:white;gap:8px">
          <span style="font-size:13px;font-weight:bold;flex:1">${m.desc}</span>${rewardBadge}
        </div>
        <div style="background:#2c3e50;height:8px;border-radius:4px;margin:6px 0">
          <div style="background:${isSkin ? "#ce93d8" : "#2ecc71"};width:${pct}%;height:100%;border-radius:4px;transition:width .3s"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12px;color:rgba(255,255,255,.7)">
          <span>${m.current.toLocaleString("pt-BR")} / ${m.goal.toLocaleString("pt-BR")}</span>
          ${actionBtn}
        </div>`;
      list.appendChild(div);
    });
  }

  if (ready.length)  renderGroup("✅ Prontas para coletar", ready,  "#2ecc71");
  if (active.length) renderGroup("⏳ Em andamento",          active, "rgba(255,255,255,.5)");
  if (done.length)   renderGroup("🏁 Concluídas",            done,   "rgba(255,255,255,.25)");
}

function updateMission(type, amount, isAbsolute = false) {
  state.missions.forEach((m) => {
    if (m.type === type && !m.claimed) {
      m.current = isAbsolute ? amount : m.current + amount;
      if (m.current > m.goal) m.current = m.goal;
    }
  });
}

function claimMissionReward(id) {
  const m = state.missions.find((m) => m.id === id);
  if (!m || m.current < m.goal || m.claimed) return;
  m.claimed = true;
  if (m.skinReward) {
    if (!state.unlocked.includes(m.skinReward)) {
      state.unlocked.push(m.skinReward);
      state.currentSkin = m.skinReward;
      save();
      playSkinUnlockAnimation(m.skinReward);
    }
  } else {
    state.diamonds += m.reward;
    if (UI.coins) UI.coins.innerText = state.diamonds;
  }
  save();
  renderMissions();
  playNote(800, "square", 0.3);
}

// ============================================================
// 17. PARTÍCULAS / EXPLOSÕES
// ============================================================
function createExplosion(x, y, color, count = 15) {
  if (!OPTIONS.particles) return;
  for (let i = 0; i < count; i++) {
    const speed = 4 + Math.random() * 8;
    const angle = Math.random() * Math.PI * 2;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - Math.random() * 3,
      life: 0.7 + Math.random() * 0.5,
      color,
      size: 2 + Math.random() * 4
    });
  }
}

function createBiomeExplosion(x, y, count = 20) {
  const pc = PIPE_COLORS[getBiomeIndex()] || PIPE_COLORS[0];
  createExplosion(x, y, pc.a,   count / 2);
  createExplosion(x, y, pc.cap, count / 2);
}


// ============================================================
// 18. INÍCIO DO JOGO
// ============================================================
function getBiomeIndex() {
  return Math.min(Math.floor(state.score / 80), BIOMES.length - 1);
}

function getScoreInBiome() {
  return state.score % 80;
}

function startGame() {
  // Exige login antes de jogar
  if (!window._gUser) {
    window._gLoginThenPlay = true;
    showLoginScreen();
    return;
  }
  if (state._skySelected) {
    startSkyMode();
    return;
  }
  if (!tutorialSeen) {
    tutorialPage = 0;
    startTutorial();
    return;
  }
  _doStartGame();
}
window.startGame = startGame;

function _doStartGame() {
  // ☁️ só desativa modo céu se for um início de jogo normal
  // (startSkyMode seta window.skyMode=true ANTES de chamar _doStartGame)
  if (!window.skyMode) {
    _skyHideModeTag();
  }

  state.game  = "PLAYING";
  state.score = window.skyMode ? 0 : state._startBiome * 80;
  state.frames = 0;

  isPaused     = false;
  obstacles    = [];
  coins        = [];
  powerups     = [];
  particles    = [];
  trail        = [];
  knives       = [];
  combo        = 0;
  deathAnim    = { active: false, x: 0, y: 0, timer: 0, angle: 0, vy: 0, scale: 1 };
  // Reseta checkpoint na memória para que os thresholds possam re-triggar nesta run
  // (o localStorage mantém o último checkpoint disponível para usar no game over)
  checkpoint   = null;
  lastDiffLevel = 0;
  lastMilestone = Math.floor(state.score / 100);
  prevBiome     = getBiomeIndex();
  bossIntro     = { active: false, timer: 0, config: null, isBoss2: false };
  bossRage      = false;
  biomeFlash    = { timer: 0, color: "#fff" };

  player = {
    x: 80, y: 300, v: 0,
    shield: false, magnet: 0, turbo: 0, slow: 0, ghost: 0, star: 0,
    freeze: 0, mini: 0, jumpsLeft: 1, doubleJumpReady: false,
    hitboxRadius: 18, tiltAngle: 0
  };

  resetBossState();

  const skin = SKINS[state.currentSkin] || SKINS["Burger"];
  player.gravity = skin.grav;
  player.jumpForce = skin.jump;

  _sessionStartTime = Date.now();
  gameStats.totalGames++;
  updateMission("games", 1);

  showScreen("game-screen");
  if (UI.overlay) UI.overlay.style.display = "none";
  if (UI.hud)     UI.hud.style.display = "flex";
  if (UI.bossUI)  UI.bossUI.style.display = "none";
  if (UI.score)   UI.score.innerText = state.score;
  if (UI.best)    UI.best.innerText  = state.best;
  if (UI.coins)   UI.coins.innerText = state.diamonds;

  if (OPTIONS.musicOn) { bgMusic.currentTime = 0; bgMusic.play().catch(() => {}); }

  checkpoint = loadCheckpoint();
  cancelAnimationFrame(gameLoopId);
  // ☁️ usa o loop correto
  if (window.skyMode) skyGameLoop();
  else gameLoop();
}

// ============================================================
// 19. TUTORIAL
// ============================================================
function startTutorial() {
  tutorialPage = 0;
  state.game = "TUTORIAL";
  showScreen("game-screen");
  if (UI.overlay) UI.overlay.style.display = "none";
  if (UI.hud)     UI.hud.style.display = "none";
  gameLoop();
}

function drawTutorial() {
  ctx.fillStyle = "rgba(0,0,0,0.92)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const page  = TUTORIAL_PAGES[tutorialPage];
  const cx    = canvas.width  / 2;
  const cy    = canvas.height / 2;
  const boxW  = Math.min(canvas.width - 40, 420);
  const lineH = 26;
  const boxH  = 100 + page.lines.length * lineH + 80; // dinâmico
  const bx    = cx - boxW / 2;
  const by    = cy - boxH / 2;

  // Fundo
  ctx.save();
  const grad = ctx.createLinearGradient(bx, by, bx, by + boxH);
  grad.addColorStop(0, "rgba(20,30,60,0.97)");
  grad.addColorStop(1, "rgba(10,20,45,0.97)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(bx, by, boxW, boxH, 18);
  ctx.fill();
  ctx.strokeStyle = "rgba(241,196,15,0.7)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // Ícone e título
  ctx.textAlign = "center";
  ctx.font      = "38px Arial";
  ctx.fillText(page.icon, cx, by + 50);
  ctx.font      = "bold 20px 'Fredoka One', Arial";
  ctx.fillStyle = "#f1c40f";
  ctx.fillText(page.title, cx, by + 82);

  // Linhas
  ctx.font      = "13px Arial";
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  page.lines.forEach((line, i) => {
    ctx.fillText(line, cx, by + 112 + i * 28);
  });

  // Indicador de página
  for (let i = 0; i < TUTORIAL_PAGES.length; i++) {
    ctx.beginPath();
    ctx.arc(cx + (i - (TUTORIAL_PAGES.length - 1) / 2) * 18, by + boxH - 30, 4, 0, Math.PI * 2);
    ctx.fillStyle = i === tutorialPage ? "#f1c40f" : "rgba(255,255,255,0.3)";
    ctx.fill();
  }

  // Botão
  const btnW = 160, btnH = 38;
  const btnX = cx - btnW / 2, btnY = by + boxH - 60;
  const grad2 = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
  grad2.addColorStop(0, "#f39c12"); grad2.addColorStop(1, "#e67e22");
  ctx.fillStyle = grad2;
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, 10);
  ctx.fill();
  ctx.font      = "bold 14px 'Fredoka One', Arial";
  ctx.fillStyle = "white";
  ctx.fillText(tutorialPage < TUTORIAL_PAGES.length - 1 ? "Próximo →" : "🚀 Jogar!", cx, btnY + 25);
}

function handleTutorialClick(x, y) {
  const cx   = canvas.width  / 2;
  const cy   = canvas.height / 2;
  const page = TUTORIAL_PAGES[tutorialPage];
  const lineH = 26;
  const boxH = 100 + page.lines.length * lineH + 80;
  const by   = cy - boxH / 2;
  const btnY = by + boxH - 60, btnH = 38;
  const btnW = 160, btnX = cx - btnW / 2;

  if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
    if (tutorialPage < TUTORIAL_PAGES.length - 1) {
      tutorialPage++;
      playNote(480, "sine", 0.1);
    } else {
      tutorialSeen = true;
      localStorage.setItem("ff_tut", "1");
      playNote(900, "square", 0.15);
      _doStartGame();
    }
  }
}

// ============================================================
// 20. BOSS SYSTEM
// ============================================================
function spawnProjectile(bossConfig, bossY) {
  const types = { egg: "🥚", knife: "🔪", fireball: "🔥", acorn: "🌰", honey: "🍯",
                  ink: "🖤", laser: "💫", spore: "🍄", charge: "⚡",
                  bubble: "🫧", spiral: "🌀", sting: "💉", thorn: "🌵",
                  snowball: "❄️", blizzard: "🌨️", wave: "😈" };
  const emoji = types[bossConfig.projectile] || "💢";
  const rage  = bossRage ? 1.5 : 1;

  // 😈 Demônio — ataque "wave": triple spread em leque
  if (bossConfig.projectile === "wave") {
    const offsets = [-55, 0, 55]; // três projéteis espalhados verticalmente
    offsets.forEach((oy) => {
      knives.push({
        x:     bossConfig.attackX,
        y:     bossY + oy,
        speed: (2.8 + Math.random() * 0.8) * rage,
        emoji: "🔥", // chamas do inferno
        vy:    oy * 0.018 // leve desvio vertical para abrir o leque
      });
    });
    playNote(250, "sawtooth", 0.08, 0.04);
    return;
  }

  knives.push({
    x:     bossConfig.attackX,
    y:     bossY + 20,
    speed: (2.5 + Math.random() * 1.5) * rage,
    emoji
  });
  playNote(400, "sawtooth", 0.05, 0.03);
}

function hideBossUI() {
  if (UI.bossUI) UI.bossUI.style.display = "none";
}

function updateBoss(biomeConfig, bossRef, isDefeated, onDefeat) {
  if (!bossRef.active || isDefeated) return;
  const cfg = biomeConfig;

  bossRef.y += bossRef.dir * (cfg.speed + (bossRage ? 1.5 : 0));
  if (bossRef.y > cfg.maxY || bossRef.y < cfg.minY) bossRef.dir *= -1;

  bossRef.attackTimer = (bossRef.attackTimer || 0) + 1;
  const rate = bossRage ? Math.floor(cfg.attackRate * 0.6) : cfg.attackRate;
  if (bossRef.attackTimer >= rate) {
    bossRef.attackTimer = 0;
    if (player.freeze <= 0) spawnProjectile(cfg, bossRef.y);
  }

  // Colisão com player
  if (!window.godMode && !player.ghost) {
    const dist = Math.hypot(player.x - cfg.x, player.y - bossRef.y);
    if (dist < 50) {
      if (player.shield) {
        player.shield = false;
        showCenterNotif("🛡️ Escudo Quebrado!", "#3498db", 18, 60);
        triggerShake(4, 10);
      } else {
        triggerShake(8, 20);
        endGame();
        return;
      }
    }
  }

  // HP drain
  bossRef.hp -= cfg.drain;
  if (bossRef.hp < 0) bossRef.hp = 0;
  if (!bossRage && bossRef.hp <= bossRef.maxHp * 0.3) {
    bossRage = true;
    showCenterNotif("😡 CHEFE ENRAIVECIDO!", "#ff0000", 22, 90);
    triggerShake(8, 20);
  }

  const hpPct = bossRef.hp / bossRef.maxHp;
  if (UI.hpFill) UI.hpFill.style.width = (hpPct * 100) + "%";

  if (bossRef.hp <= 0) onDefeat();
}

function updateBosses() {
  const bi    = getBiomeIndex();
  const biome = BIOMES[bi];
  if (!biome) return;
  const sp = getScoreInBiome();

  // Trigger Boss A @ score 20 do bioma
  if (sp >= 20 && !boss.active && !bossDefeated) {
    boss.active       = true;
    boss.hp           = biome.bossA.hp;
    boss.maxHp        = biome.bossA.hp;
    boss.y            = 200;
    boss.dir          = 1;
    boss.attackTimer  = 0;
    bossRage          = false;
    bossIntro         = { active: true, timer: 60, config: biome.bossA, isBoss2: false };
    if (UI.bossUI) UI.bossUI.style.display = "block";
    const nameEl = document.getElementById("boss-name");
    if (nameEl) nameEl.innerText = biome.bossA.desc + " " + biome.bossA.emoji;
    playNote(280, "sawtooth", 0.3, 0.05);
  }

  // Trigger Boss B @ score 40 do bioma — só depois do Boss A derrotado
  if (sp >= 40 && !boss2.active && !boss2Defeated && bossDefeated) {
    boss2.active       = true;
    boss2.hp           = biome.bossB.hp;
    boss2.maxHp        = biome.bossB.hp;
    boss2.y            = 300;
    boss2.dir          = 1;
    boss2.attackTimer  = 0;
    bossRage           = false;
    bossIntro          = { active: true, timer: 60, config: biome.bossB, isBoss2: true };
    if (UI.bossUI) UI.bossUI.style.display = "block";
    const nameEl = document.getElementById("boss-name");
    if (nameEl) nameEl.innerText = biome.bossB.desc + " " + biome.bossB.emoji;
    playNote(130, "sawtooth", 0.4, 0.06);
  }

  // Atualiza boss A
  if (boss.active && !bossDefeated) {
    updateBoss(biome.bossA, boss, bossDefeated, () => {
      bossDefeated = true;
      boss.active  = false;
      state.diamonds += biome.bossA.reward;
      gameStats.totalBossKills++;
      updateMission("anyBoss", 1);
      if (!state.defeatedBosses[bi]) state.defeatedBosses[bi] = {};
      state.defeatedBosses[bi].a = true;
      save();
      hideBossUI();
      triggerShake(10, 25);
      createExplosion(biome.bossA.x, boss.y, biome.bossA.color, 30);
      showCenterNotif("⚔️ Boss A Derrotado! +" + biome.bossA.reward + "💎", "#ffd700", 20, 80);
      playNote(1000, "square", 0.2);
    });
  }

  // Atualiza boss B
  if (boss2.active && !boss2Defeated) {
    updateBoss(biome.bossB, boss2, boss2Defeated, () => {
      boss2Defeated = true;
      boss2.active  = false;
      state.diamonds += biome.bossB.reward;
      gameStats.totalBossKills++;
      updateMission("anyBoss", 1);
      updateMission("boss2",   1);
      if (!state.defeatedBosses[bi]) state.defeatedBosses[bi] = {};
      state.defeatedBosses[bi].b = true;
      updateMission("biomesBeat", 1);
      // Desbloqueia próximo bioma
      const nextBiome = bi + 1;
      if (nextBiome < BIOMES.length && !state.unlockedBiomes.includes(nextBiome)) {
        state.unlockedBiomes.push(nextBiome);
        showCenterNotif("🌍 " + BIOMES[nextBiome].name + " DESBLOQUEADO!", "#00e5ff", 18, 100);
      }
      save();
      hideBossUI();
      triggerShake(12, 30);
      createExplosion(biome.bossB.x, boss2.y, biome.bossB.color, 40);
      showCenterNotif("🏆 Boss B Derrotado! +" + biome.bossB.reward + "💎", "#ff6d00", 22, 90);
      playNote(1200, "square", 0.25);
    });
  }
}

// ============================================================
// 21. UPDATE — HELPERS
// ============================================================
function updateTimers() {
  state.frames++;
  if (player.magnet  > 0) player.magnet--;
  if (player.turbo   > 0) player.turbo--;
  if (player.slow    > 0) player.slow--;
  if (player.ghost   > 0) player.ghost--;
  if (player.star    > 0) player.star--;
  if (player.freeze  > 0) player.freeze--;
  if (player.mini    > 0) player.mini--;
  else player.hitboxRadius = 18;
}

function updatePlayer() {
  const skin = SKINS[state.currentSkin] || SKINS["Burger"];
  const ts   = player.slow > 0 ? 0.4 : (player.turbo > 0 ? 1.6 : state.timeScale);
  player.v += skin.grav * ts;
  player.y += player.v  * ts;
  player.hitboxRadius = player.mini > 0 ? 9 : 18;

  // Tilt
  player.tiltAngle = Math.max(-0.6, Math.min(0.5, player.v * 0.08));

  if (player.y < 0) { player.y = 0; player.v = 0; }
  if (player.y > canvas.height - 28) {
    if (!window.godMode) { endGame(); return; }
    else { player.y = canvas.height - 28; player.v = 0; }
  }
  if (player.mini <= 0) player.hitboxRadius = 18;
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x    += p.vx;
    p.y    += p.vy;
    p.vy   += 0.15;
    p.life -= GAME_CONFIG.particleFade;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function updateClouds() { /* clouds are purely decorative, drawn per frame */ }

function updateTrail() {
  if (!OPTIONS.trail) { trail = []; return; }
  if (state.frames % GAME_CONFIG.trailSpawnRate === 0) {
    trail.push({ x: player.x, y: player.y, life: 1.0 });
  }
  for (let i = trail.length - 1; i >= 0; i--) {
    trail[i].life -= GAME_CONFIG.trailFade;
    if (trail[i].life <= 0) trail.splice(i, 1);
  }
}

function updateObstacles() {
  if (player.freeze > 0) return;
  const pipeSpeed = getDifficultySpeed() * (player.turbo > 0 ? 1.8 : 1) * (player.slow > 0 ? 0.4 : 1);

  if (state.frames % GAME_CONFIG.pipeSpawnRate === 0) {
    const bi     = getBiomeIndex();
    // Gap dinâmico: diminui com score
    const gap    = Math.max(120, 200 - Math.floor(state.score / 40) * 8);
    const topH   = 60 + Math.random() * (canvas.height - gap - 100);
    obstacles.push({ x: canvas.width + 10, h: topH, gap, passed: false, biome: bi });
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= pipeSpeed;

    if (!o.passed && o.x + 26 < player.x - player.hitboxRadius) {
      o.passed = true;
      state.score++;
      combo++;
      gameStats.totalPipes++;
      updateMission("pipes", 1);

      const comboBonus = Math.floor(combo / 5) * 10;
      if (comboBonus > 0 && combo % 5 === 0) {
        state.diamonds += comboBonus;
        showCenterNotif("🔥 Combo ×" + combo + "! +" + comboBonus + "💎", "#ff9800", 16, 50);
        playNote(760, "sine", 0.12);
      }
      if (player.star > 0) state.score += 2;
      if (UI.score) UI.score.innerText = state.score;
      if (UI.best)  UI.best.innerText  = state.best;

      // Milestone +200💎 a cada 100 pts
      const currentMilestone = Math.floor(state.score / 100);
      if (currentMilestone > lastMilestone) {
        lastMilestone = currentMilestone;
        state.diamonds += 200;
        showCenterNotif("💎 +200 Bônus de Marco! (" + state.score + " pts)", "#00e5ff", 18, 80);
        playNote(1050, "triangle", 0.18);
        triggerShake(4, 10);
      }

      // Biome change flash
      const newBiome = getBiomeIndex();
      if (newBiome !== prevBiome) {
        prevBiome    = newBiome;
        biomeFlash   = { timer: 20, color: PIPE_COLORS[newBiome]?.a || "#fff" };
        biomeNotif   = { text: "✨ " + BIOMES[newBiome]?.name, timer: 80 };
        resetBossState();
        updateMission("biome" + newBiome, 1);
        showCenterNotif("🌍 " + BIOMES[newBiome]?.name, "#00e5ff", 20, 70);
        playNote(440, "sine", 0.15);
      }

      // Combo display
      comboDisplay = { value: combo, timer: 60 };
      if (combo > gameStats.maxCombo) gameStats.maxCombo = combo;

      // Checkpoint automático
      tryAutoCheckpoint();

      // Record flash
      if (state.score > state.best) {
        state.best = state.score;
        localStorage.setItem("ff_best", state.best);
        recordFlash = { timer: 40 };
        if (UI.best) UI.best.innerText = state.best;
      }
    }

    if (o.x < -60) { obstacles.splice(i, 1); continue; }

    // Colisão com cano
    if (!window.godMode && !player.ghost) {
      const pHR = player.hitboxRadius;
      const px  = player.x, py = player.y;
      if (px + pHR > o.x - 26 && px - pHR < o.x + 26) {
        if (py - pHR < o.h || py + pHR > o.h + o.gap) {
          if (player.shield) {
            player.shield = false;
            obstacles.splice(i, 1);
            combo = 0;
            showCenterNotif("🛡️ Escudo Quebrado!", "#3498db", 18, 60);
            triggerShake(4, 10);
            continue;
          }
          endGame(); return;
        }
      }
    }
  }
}

function updateCoins() {
  if (player.freeze > 0) return;
  if (state.frames % GAME_CONFIG.coinSpawnRate === 0) {
    const sy = getSafeY(canvas.width + 30);
    if (sy !== null) coins.push({ x: canvas.width + 30, y: sy, collected: false, pulse: 0 });
  }
  const pHR    = player.hitboxRadius;
  const magnet = player.magnet > 0 ? 200 : 0;
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    c.x -= getDifficultySpeed();
    c.pulse = (c.pulse || 0) + 0.1;
    if (magnet > 0 && Math.hypot(player.x - c.x, player.y - c.y) < magnet) {
      const ang = Math.atan2(player.y - c.y, player.x - c.x);
      c.x += Math.cos(ang) * 6;
      c.y += Math.sin(ang) * 6;
    }
    if (!c.collected && circleCollision(player.x, player.y, pHR, c.x, c.y, GAME_CONFIG.coinRadius)) {
      c.collected = true;
      const gain = 5 + (player.star > 0 ? 5 : 0);
      state.diamonds += gain;
      gameStats.totalDiamonds += gain;
      updateMission("gems", state.diamonds, true);
      if (UI.coins) UI.coins.innerText = state.diamonds;
      createExplosion(c.x, c.y, "#f1c40f", 8);
      playNote(880, "sine", 0.06, OPTIONS.sfxVol * 0.5);
    }
    if (c.collected || c.x < -40) coins.splice(i, 1);
  }
}

// Power-ups disponíveis
const POWERUP_TABLE = [
  { emoji: "🛡️",  type: "shield",  weight: 10 },
  { emoji: "🧲",  type: "magnet",  weight: 12 },
  { emoji: "🚀",  type: "turbo",   weight: 9  },
  { emoji: "⏰",  type: "slow",    weight: 9  },
  { emoji: "👻",  type: "ghost",   weight: 7  },
  { emoji: "⭐",  type: "star",    weight: 8  },
  { emoji: "💥",  type: "bomb",    weight: 5  },
  { emoji: "🍀",  type: "clover",  weight: 6  },
  { emoji: "❄️",  type: "freeze",  weight: 8  },
  { emoji: "🦘",  type: "djump",   weight: 8  },
  { emoji: "🔵",  type: "mini",    weight: 7  }
];

function randomPowerup() {
  const total = POWERUP_TABLE.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const p of POWERUP_TABLE) { r -= p.weight; if (r <= 0) return p; }
  return POWERUP_TABLE[0];
}

function updatePowerups() {
  if (player.freeze > 0) return;
  if (state.frames % GAME_CONFIG.powerSpawnRate === 0) {
    const pw = randomPowerup();
    const sy = getSafeY(canvas.width + 30);
    if (sy !== null) powerups.push({ x: canvas.width + 30, y: sy, ...pw, pulse: 0 });
  }
  const pHR = player.hitboxRadius;
  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    p.x -= getDifficultySpeed();
    p.pulse = (p.pulse || 0) + 0.08;
    if (circleCollision(player.x, player.y, pHR, p.x, p.y, GAME_CONFIG.powerupRadius)) {
      applyPowerup(p);
      powerups.splice(i, 1);
      continue;
    }
    if (p.x < -50) powerups.splice(i, 1);
  }
}

function applyPowerup(p) {
  updateMission("powerup", 1);
  switch (p.type) {
    case "shield": player.shield = true;  break;
    case "magnet": player.magnet = 300;   break;
    case "turbo":  player.turbo  = 300;   break;
    case "slow":   player.slow   = 300;   break;
    case "ghost":  player.ghost  = 300;   break;
    case "star":   player.star   = 300;   break;
    case "freeze": player.freeze = 300;   break;
    case "mini":   player.mini   = 480;   break;
    case "djump":
      player.jumpsLeft       = 2;
      player.doubleJumpReady = true;
      break;
    case "bomb":
      obstacles = [];
      createExplosion(canvas.width / 2, canvas.height / 2, "#ff6d00", 40);
      triggerShake(6, 15);
      showCenterNotif("💥 BOOM! Canos destruídos!", "#ff6d00", 20, 70);
      break;
    case "clover":
      state.diamonds += 50;
      if (UI.coins) UI.coins.innerText = state.diamonds;
      showCenterNotif("🍀 +50 Diamantes!", "#2ecc71", 18, 60);
      break;
  }
  createExplosion(p.x, p.y, "#fff", 12);
  playNote(560, "triangle", 0.1);
}

function updateKnives() {
  if (player.freeze > 0) return;
  const pHR = player.hitboxRadius;
  for (let i = knives.length - 1; i >= 0; i--) {
    const k = knives[i];
    k.x -= k.speed;
    if (k.vy) k.y += k.vy; // desvio vertical do leque do Demônio
    if (k.x < -40) { knives.splice(i, 1); continue; }
    if (!window.godMode && circleCollision(player.x, player.y, pHR, k.x, k.y, GAME_CONFIG.knifeRadius)) {
      if (player.shield) {
        player.shield = false;
        knives.splice(i, 1);
        showCenterNotif("🛡️ Escudo Quebrado!", "#3498db", 18, 60);
        triggerShake(4, 10);
        continue;
      }
      endGame(); return;
    }
  }
}

// ============================================================
// 22. UPDATE — PRINCIPAL
// ============================================================
function update() {
  updateTimers();
  updatePlayer();
  if (OPTIONS.particles) updateParticles();
  if (OPTIONS.trail)     updateTrail();
  updateObstacles();
  updateCoins();
  updatePowerups();
  updateKnives();
  updateBosses();

  // Biome flash decay
  if (biomeFlash.timer > 0) biomeFlash.timer--;
  // Center notif decay
  if (centerNotif.timer  > 0) centerNotif.timer--;
  if (recordFlash.timer  > 0) recordFlash.timer--;
  if (comboDisplay.timer > 0) comboDisplay.timer--;
  if (biomeNotif.timer   > 0) biomeNotif.timer--;
  // Boss intro decay
  if (bossIntro.active) { bossIntro.timer--; if (bossIntro.timer <= 0) bossIntro.active = false; }

  // Salva stats de tempo periodicamente
  if (state.frames % 300 === 0) {
    gameStats.totalPlaySecs = Math.floor((Date.now() - _sessionStartTime) / 1000) + (loadStats().totalPlaySecs || 0);
    saveStats();
  }
}

// ============================================================
// 23. SCREEN SHAKE
// ============================================================
function updateScreenShake() {
  if (screenShake.timer > 0) {
    screenShake.timer--;
    screenShake.x = (Math.random() - 0.5) * screenShake.intensity;
    screenShake.y = (Math.random() - 0.5) * screenShake.intensity;
  } else {
    screenShake.x = 0; screenShake.y = 0;
  }
}


// ============================================================
// 24. DRAW — BACKGROUNDS POR BIOMA
// ============================================================
function drawBgCampo(t) {
  // Céu
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#87ceeb"); grad.addColorStop(1, "#d4f1f4");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Sol
  ctx.save();
  ctx.shadowBlur = 30; ctx.shadowColor = "rgba(255,230,100,0.7)";
  ctx.fillStyle  = "#ffe066"; ctx.beginPath();
  ctx.arc(canvas.width - 70, 60, 34, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // Nuvens
  [[100, 70, 0.8], [280, 50, 0.6], [450, 80, 0.9]].forEach(([cx, cy, s]) => {
    ctx.save(); ctx.globalAlpha = 0.85;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    [[0,0,30],[30,0,25],[-28,0,22],[12,-16,22],[-14,-14,18]].forEach(([ox, oy, r]) => {
      ctx.beginPath(); ctx.arc(cx + ox + Math.sin(t * 0.2 + s) * 2, cy + oy, r * s, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  });
  // Chão
  ctx.fillStyle = "#5d8a3c";
  ctx.fillRect(0, canvas.height - 28, canvas.width, 28);
  ctx.fillStyle = "#7bc44f";
  ctx.fillRect(0, canvas.height - 28, canvas.width, 6);
}

function drawBgCidade(t) {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#1a1a2e"); grad.addColorStop(1, "#2d2d44");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Lua
  ctx.save();
  ctx.shadowBlur = 30; ctx.shadowColor = "rgba(200,220,255,0.6)";
  ctx.fillStyle  = "#d0e8ff"; ctx.beginPath();
  ctx.arc(60, 50, 24, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // Estrelas
  for (let i = 0; i < 40; i++) {
    const sx = (i * 137 + 40) % canvas.width;
    const sy = (i * 97 + 20)  % (canvas.height - 80);
    const alpha = 0.4 + 0.5 * Math.abs(Math.sin(t * 0.04 + i));
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.fillStyle = "white"; ctx.beginPath();
    ctx.arc(sx, sy, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // Prédios
  const buildings = [[50,200,70,120,"#22304a"],[140,180,80,100,"#1e2a40"],[240,210,65,130,"#1a263a"],
                     [320,190,75,110,"#203040"],[410,200,85,140,"#1c2c3c"],[480,170,70,120,"#22304a"]];
  buildings.forEach(([bx, by, bw, bh, col]) => {
    ctx.fillStyle = col; ctx.fillRect(bx, by, bw, canvas.height - by);
    // Janelas
    ctx.fillStyle = "rgba(255,220,100,0.6)";
    for (let wi = 0; wi < Math.floor(bw / 14); wi++) {
      for (let wj = 0; wj < 5; wj++) {
        if (Math.sin(wi * 7 + wj * 13 + t * 0.05) > 0) {
          ctx.fillRect(bx + 6 + wi * 14, by + 10 + wj * 18, 8, 10);
        }
      }
    }
  });
  ctx.fillStyle = "#111"; ctx.fillRect(0, canvas.height - 28, canvas.width, 28);
}

function drawBgFloresta(t) {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#1b3a1a"); grad.addColorStop(1, "#2d5c2d");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Raios de sol
  ctx.save(); ctx.globalAlpha = 0.07;
  for (let i = 0; i < 8; i++) {
    ctx.save(); ctx.translate(canvas.width / 2, 0);
    ctx.rotate(-0.5 + i * 0.14 + Math.sin(t * 0.01) * 0.05);
    ctx.fillStyle = "#ffe066";
    ctx.fillRect(-8, 0, 16, canvas.height); ctx.restore();
  }
  ctx.restore();
  // Árvores de fundo
  [[80,400],[200,380],[350,410],[470,390],[600,400]].forEach(([tx, ty]) => {
    ctx.fillStyle = "#1a3a19"; ctx.beginPath();
    ctx.moveTo(tx, ty); ctx.lineTo(tx - 40, canvas.height);
    ctx.lineTo(tx + 40, canvas.height); ctx.fill();
    ctx.fillStyle = "#2d5c2d"; ctx.beginPath();
    ctx.moveTo(tx, ty - 60); ctx.lineTo(tx - 55, ty + 20);
    ctx.lineTo(tx + 55, ty + 20); ctx.fill();
    ctx.fillStyle = "#3a7a38"; ctx.beginPath();
    ctx.moveTo(tx, ty - 120); ctx.lineTo(tx - 40, ty - 20);
    ctx.lineTo(tx + 40, ty - 20); ctx.fill();
  });
  ctx.fillStyle = "#1a3f1a"; ctx.fillRect(0, canvas.height - 28, canvas.width, 28);
}

function drawBgVulcao(t) {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#2a0a00"); grad.addColorStop(0.5, "#4a1a00"); grad.addColorStop(1, "#1a0800");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Lava no fundo
  ctx.save();
  const lavaGrad = ctx.createLinearGradient(0, canvas.height - 40, 0, canvas.height);
  lavaGrad.addColorStop(0, "#ff4500"); lavaGrad.addColorStop(1, "#ff6d00");
  ctx.fillStyle = lavaGrad;
  const lavaY = canvas.height - 28 + Math.sin(t * 0.05) * 3;
  ctx.fillRect(0, lavaY, canvas.width, canvas.height - lavaY);
  ctx.restore();
  // Embers
  for (let i = 0; i < 15; i++) {
    const ex = (i * 89 + t * 0.8) % canvas.width;
    const ey = canvas.height - 40 - ((t * 0.5 + i * 30) % (canvas.height - 60));
    const ea = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.1 + i));
    ctx.save(); ctx.globalAlpha = ea;
    ctx.fillStyle = i % 3 === 0 ? "#ff4500" : "#ff8c00";
    ctx.beginPath(); ctx.arc(ex, ey, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = "#1a0800"; ctx.fillRect(0, canvas.height - 28, canvas.width, 28);
}

function drawBgOceano(t) {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#001f3f"); grad.addColorStop(1, "#003366");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Bolhas
  for (let i = 0; i < 20; i++) {
    const bx = (i * 113 + t * 0.3) % canvas.width;
    const by = canvas.height - ((t * 0.4 + i * 25) % canvas.height);
    const br = 3 + (i % 4);
    ctx.save(); ctx.globalAlpha = 0.3;
    ctx.strokeStyle = "#80deea"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  // Ondas no fundo
  ctx.save(); ctx.globalAlpha = 0.15;
  for (let w = 0; w < 3; w++) {
    ctx.strokeStyle = "#00bcd4"; ctx.lineWidth = 2; ctx.beginPath();
    for (let wx = 0; wx <= canvas.width; wx += 4) {
      const wy = canvas.height - 40 - w * 18 + Math.sin((wx + t * 1.5) * 0.04) * 10;
      wx === 0 ? ctx.moveTo(wx, wy) : ctx.lineTo(wx, wy);
    }
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = "#002244"; ctx.fillRect(0, canvas.height - 28, canvas.width, 28);
}

function drawBgEspaco(t) {
  ctx.fillStyle = "#050510"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Estrelas
  for (let i = 0; i < 80; i++) {
    const sx    = (i * 137.5 + 20) % canvas.width;
    const sy    = (i * 97.3  + 15) % (canvas.height - 30);
    const alpha = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.02 + i * 0.5));
    const size  = i % 5 === 0 ? 2.5 : 1.2;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.fillStyle = i % 7 === 0 ? "#fffacd" : "white";
    ctx.beginPath(); ctx.arc(sx, sy, size, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // Nebulosa
  ctx.save(); ctx.globalAlpha = 0.04;
  [[180,150,"#9c27b0"],[380,280,"#1a237e"],[500,100,"#880e4f"]].forEach(([nx, ny, nc]) => {
    const gn = ctx.createRadialGradient(nx, ny, 0, nx, ny, 120);
    gn.addColorStop(0, nc); gn.addColorStop(1, "transparent");
    ctx.fillStyle = gn; ctx.fillRect(0, 0, canvas.width, canvas.height);
  });
  ctx.restore();
  ctx.fillStyle = "#030308"; ctx.fillRect(0, canvas.height - 28, canvas.width, 28);
}

function drawBgDesert(t) {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#e65100"); grad.addColorStop(0.5, "#f9a825"); grad.addColorStop(1, "#ffd54f");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Sol imenso
  ctx.save();
  ctx.shadowBlur = 60; ctx.shadowColor = "rgba(255,200,0,0.5)";
  ctx.fillStyle  = "#fff176"; ctx.beginPath();
  ctx.arc(canvas.width - 80, 60, 50, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // Dunas
  ctx.save(); ctx.fillStyle = "#f57f17";
  ctx.beginPath(); ctx.moveTo(0, canvas.height);
  for (let dx = 0; dx <= canvas.width; dx += 20) {
    const dy = canvas.height - 40 - Math.sin((dx + t * 0.3) * 0.02) * 30;
    ctx.lineTo(dx, dy);
  }
  ctx.lineTo(canvas.width, canvas.height); ctx.closePath(); ctx.fill();
  // Areia animada
  ctx.globalAlpha = 0.3;
  for (let si = 0; si < 12; si++) {
    const sx = ((si * 97 + t * 1.2) % canvas.width);
    const sy = 80 + (si * 53) % (canvas.height - 120);
    ctx.fillStyle = "rgba(255,200,50,0.5)";
    ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = "#e65100"; ctx.fillRect(0, canvas.height - 28, canvas.width, 28);
  ctx.fillStyle = "#f57f17"; ctx.fillRect(0, canvas.height - 28, canvas.width, 6);
}

function drawBgArctic(t) {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#0d47a1"); grad.addColorStop(0.4, "#1565c0"); grad.addColorStop(1, "#bbdefb");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Aurora boreal
  ctx.save(); ctx.globalAlpha = 0.12;
  ["#00e676","#00bcd4","#7c4dff"].forEach((ac, ai) => {
    for (let ax = 0; ax <= canvas.width; ax += 8) {
      const ay = 80 + Math.sin((ax * 0.025 + t * 0.02) + ai * 1.5) * 50 + ai * 40;
      ctx.fillStyle = ac; ctx.fillRect(ax, ay, 6, 40 + ai * 15);
    }
  });
  ctx.restore();
  // Flocos de neve
  for (let i = 0; i < 30; i++) {
    const sx    = (i * 113 + t * 0.6) % canvas.width;
    const sy    = (t * 0.5 + i * 40)  % canvas.height;
    const alpha = 0.4 + 0.4 * Math.sin(t * 0.05 + i);
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.fillStyle = "white"; ctx.beginPath();
    ctx.arc(sx, sy, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // Chão nevado
  ctx.fillStyle = "white";
  ctx.fillRect(0, canvas.height - 28, canvas.width, 28);
  ctx.fillStyle = "#b3e5fc";
  ctx.fillRect(0, canvas.height - 28, canvas.width, 6);
}

function drawBackground(t) {
  const bi = getBiomeIndex();
  switch (bi) {
    case 0: drawBgCampo(t);   break;
    case 1: drawBgCidade(t);  break;
    case 2: drawBgFloresta(t); break;
    case 3: drawBgVulcao(t);  break;
    case 4: drawBgOceano(t);  break;
    case 5: drawBgDesert(t);  break;
    case 6: drawBgArctic(t);  break;
    case 7: drawBgEspaco(t);  break;
    default: drawBgCampo(t);
  }
  // Biome flash overlay
  if (biomeFlash.timer > 0) {
    ctx.save();
    ctx.globalAlpha = (biomeFlash.timer / 20) * 0.25;
    ctx.fillStyle   = biomeFlash.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
}


// ============================================================
// 25. DRAW — ELEMENTOS DO JOGO
// ============================================================
function drawParticles() {
  particles.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawTrail() {
  trail.forEach((t) => {
    ctx.save();
    ctx.globalAlpha = t.life * 0.45;
    ctx.fillStyle   = (t.sky || window.skyMode) ? "rgba(129,212,250,0.9)" : "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.arc(t.x, t.y, 5 * t.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawPlayer() {
  const skin = SKINS[state.currentSkin] || SKINS["Burger"];
  const size = player.mini > 0 ? Math.floor(skin.size * 0.55) : skin.size;

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.tiltAngle);

  // Aura de power-up ativo
  if (player.star   > 0) { ctx.shadowBlur = 22; ctx.shadowColor = "#ffd700"; }
  if (player.ghost  > 0) { ctx.globalAlpha = 0.45; ctx.shadowBlur = 18; ctx.shadowColor = "#9b59b6"; }
  if (player.shield)     { ctx.shadowBlur = 20; ctx.shadowColor = "#3498db"; }
  if (player.freeze > 0) { ctx.shadowBlur = 18; ctx.shadowColor = "#80deea"; }
  if (player.mini   > 0) { ctx.shadowBlur = 16; ctx.shadowColor = "#7c4dff"; }

  ctx.font      = size + "px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(skin.emoji, 0, 0);

  // Escudo visual
  if (player.shield) {
    ctx.restore(); ctx.save();
    ctx.translate(player.x, player.y);
    ctx.strokeStyle = "rgba(52,152,219,0.85)";
    ctx.lineWidth   = 3.5;
    ctx.shadowBlur  = 16;
    ctx.shadowColor = "#3498db";
    ctx.globalAlpha = 0.8 + 0.2 * Math.sin(state.frames * 0.15);
    ctx.beginPath();
    ctx.arc(0, 0, (size / 2) + 16, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawObstacles() {
  obstacles.forEach((o) => {
    const pc = PIPE_COLORS[o.biome] || PIPE_COLORS[0];

    function drawPipe(x, topY, botY, height, capAtTop) {
      // Corpo do cano
      const gTop = ctx.createLinearGradient(x - 26, 0, x + 26, 0);
      gTop.addColorStop(0, pc.b); gTop.addColorStop(0.35, pc.a); gTop.addColorStop(1, pc.b);
      ctx.fillStyle = gTop;
      ctx.fillRect(x - 26, topY, 52, height);
      // Borda
      ctx.strokeStyle = pc.border; ctx.lineWidth = 2;
      ctx.strokeRect(x - 26, topY, 52, height);
      // Cap — no topo do cano inferior, na base do cano superior
      const capY = capAtTop ? topY : topY + height - 16;
      ctx.fillStyle   = pc.cap;
      ctx.fillRect(x - 30, capY, 60, 16);
      ctx.strokeStyle = pc.border; ctx.lineWidth = 1.5;
      ctx.strokeRect(x - 30, capY, 60, 16);
      // Brilho
      ctx.save(); ctx.globalAlpha = 0.18;
      ctx.fillStyle = "white"; ctx.fillRect(x - 22, topY, 10, height);
      ctx.restore();
    }

    // Cano superior — cap na base (virado para o gap)
    drawPipe(o.x, 0, o.h - 16, o.h, false);
    // Cano inferior — cap no topo (virado para o gap)
    const botY = o.h + o.gap;
    drawPipe(o.x, botY, botY, canvas.height - botY, true);
  });
}

function drawCoins() {
  coins.forEach((c) => {
    const pulse = 1 + 0.08 * Math.sin(c.pulse);
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(pulse, pulse);
    ctx.shadowBlur  = 12;
    ctx.shadowColor = "#ffd700";
    ctx.font        = "22px Arial";
    ctx.textAlign   = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("💎", 0, 0);
    ctx.restore();
  });
}

function drawPowerups() {
  powerups.forEach((p) => {
    const pulse = 1 + 0.12 * Math.sin(p.pulse);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(pulse, pulse);
    ctx.shadowBlur  = 24;
    ctx.shadowColor = "rgba(255,255,100,0.9)";
    ctx.font        = "40px Arial";
    ctx.textAlign   = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(p.emoji, 0, 0);
    ctx.restore();
  });
}

function drawKnives() {
  knives.forEach((k) => {
    ctx.save();
    ctx.font      = "22px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(k.emoji, k.x, k.y);
    ctx.restore();
  });
}

function drawBosses() {
  const bi    = getBiomeIndex();
  const biome = BIOMES[bi];
  if (!biome) return;

  function drawBoss(cfg, bossRef) {
    if (!bossRef.active) return;
    ctx.save();
    ctx.font      = cfg.size;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (bossRage) {
      ctx.shadowBlur  = 30;
      ctx.shadowColor = "#ff0000";
      ctx.globalAlpha = 0.85 + 0.15 * Math.sin(state.frames * 0.3);
    }
    ctx.fillText(cfg.emoji, cfg.x, bossRef.y);
    // Barra de HP acima do chefe
    const barW = 80, barH = 8;
    const bx   = cfg.x - barW / 2, by = bossRef.y - 60;
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "#333"; ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = bossRage ? "#ff0000" : cfg.color;
    ctx.fillRect(bx, by, barW * (bossRef.hp / bossRef.maxHp), barH);
    ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, barW, barH);
    ctx.restore();
  }

  drawBoss(biome.bossA, boss);
  drawBoss(biome.bossB, boss2);
}

function drawPowerupBars() {
  const bars = [
    { label: "🧲", active: player.magnet > 0, val: player.magnet,  max: 300,  color: "#42a5f5" },
    { label: "🚀", active: player.turbo  > 0, val: player.turbo,   max: 300,  color: "#ff7043" },
    { label: "⏰", active: player.slow   > 0, val: player.slow,    max: 300,  color: "#ab47bc" },
    { label: "👻", active: player.ghost  > 0, val: player.ghost,   max: 300,  color: "#9c27b0" },
    { label: "⭐", active: player.star   > 0, val: player.star,    max: 300,  color: "#ffd700" },
    { label: "❄️", active: player.freeze > 0, val: player.freeze,  max: 300,  color: "#80deea" },
    { label: "🔵", active: player.mini   > 0, val: player.mini,    max: 480,  color: "#7c4dff" },
    { label: "🦘", active: player.doubleJumpReady,  val: player.jumpsLeft > 1 ? 1 : 0, max: 1, color: "#4caf50" }
  ];
  let yOff = 10;
  bars.forEach((b) => {
    if (!b.active) return;
    const x = canvas.width - 115, w = 100, h = 14;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath(); ctx.roundRect(x - 24, yOff, w + 28, h + 4, 6); ctx.fill();
    ctx.fillStyle = "#333";
    ctx.fillRect(x, yOff + 2, w, h);
    const pct = b.val / b.max;
    ctx.fillStyle = b.color;
    ctx.fillRect(x, yOff + 2, w * pct, h);
    ctx.font      = "14px Arial"; ctx.textBaseline = "middle"; ctx.textAlign = "right";
    ctx.fillText(b.label, x - 4, yOff + 2 + h / 2);
    ctx.restore();
    yOff += 22;
  });
}

function drawCenterNotif() {
  if (centerNotif.timer <= 0) return;
  const alpha = Math.min(1, centerNotif.timer / 20);
  const y     = canvas.height / 2 - 60 + (1 - alpha) * 20;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font        = "bold " + (centerNotif.size || 20) + "px 'Fredoka One', Arial";
  ctx.textAlign   = "center";
  ctx.textBaseline = "middle";
  ctx.shadowBlur  = 14;
  ctx.shadowColor = centerNotif.color;
  ctx.fillStyle   = centerNotif.color;
  ctx.fillText(centerNotif.text, canvas.width / 2, y);
  ctx.restore();
}

function drawRecordFlash() {
  if (recordFlash.timer <= 0) return;
  ctx.save();
  ctx.globalAlpha = recordFlash.timer / 40;
  ctx.fillStyle   = "rgba(255,215,0,0.18)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font        = "bold 22px 'Fredoka One', Arial";
  ctx.textAlign   = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle   = "#ffd700";
  ctx.shadowBlur  = 18; ctx.shadowColor = "#ffd700";
  ctx.fillText("🏆 NOVO RECORDE!", canvas.width / 2, 60);
  ctx.restore();
}

function drawComboDisplay() {
  if (comboDisplay.timer <= 0 || comboDisplay.value < 5) return;
  const alpha = comboDisplay.timer / 60;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font        = "bold 18px 'Fredoka One', Arial";
  ctx.textAlign   = "left";
  ctx.fillStyle   = "#ff9800";
  ctx.shadowBlur  = 12; ctx.shadowColor = "#ff9800";
  ctx.fillText("🔥 ×" + comboDisplay.value, 14, canvas.height - 55);
  ctx.restore();
}

function drawPauseOverlay() {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.62)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font      = "bold 36px 'Fredoka One', Arial";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.shadowBlur = 20; ctx.shadowColor = "rgba(255,255,255,0.4)";
  ctx.fillText("⏸ PAUSADO", canvas.width / 2, canvas.height / 2 - 20);
  ctx.font      = "16px Arial"; ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText("Pressione P para continuar", canvas.width / 2, canvas.height / 2 + 20);
  ctx.restore();
}

function drawBiomeProgressBar() {
  const sp   = getScoreInBiome();
  const bi   = getBiomeIndex();
  const pct  = sp / 80;
  const barW = 120, barH = 8;
  const bx   = 14, by = canvas.height - 44;

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.beginPath(); ctx.roundRect(bx, by, barW, barH, 4); ctx.fill();

  const pc = PIPE_COLORS[bi] || PIPE_COLORS[0];
  const gradB = ctx.createLinearGradient(bx, 0, bx + barW, 0);
  gradB.addColorStop(0, pc.a); gradB.addColorStop(1, pc.cap);
  ctx.fillStyle = gradB;
  ctx.beginPath(); ctx.roundRect(bx, by, barW * pct, barH, 4); ctx.fill();

  ctx.font      = "10px Arial";
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText(BIOMES[bi]?.name || "?", bx, by - 4);

  // Speed indicator
  const speedPct = (getDifficultySpeed() - BASE_PIPE_SPEED) / (MAX_PIPE_SPEED - BASE_PIPE_SPEED);
  const speedW   = 60, speedBx = bx + barW + 10;
  ctx.fillStyle  = "rgba(0,0,0,0.5)";
  ctx.beginPath(); ctx.roundRect(speedBx, by, speedW, barH, 4); ctx.fill();
  const gradS = ctx.createLinearGradient(speedBx, 0, speedBx + speedW, 0);
  gradS.addColorStop(0, "#4caf50"); gradS.addColorStop(0.5, "#ff9800"); gradS.addColorStop(1, "#f44336");
  ctx.fillStyle = gradS;
  ctx.beginPath(); ctx.roundRect(speedBx, by, speedW * Math.max(0, Math.min(1, speedPct)), barH, 4); ctx.fill();
  ctx.font      = "9px Arial";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText("⚡ Velocidade", speedBx, by - 4);
  ctx.restore();
}

function drawBossIntro() {
  if (!bossIntro.active) return;
  const alpha = Math.min(1, bossIntro.timer / 20);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle   = "rgba(180,0,0,0.22)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font        = "bold 24px 'Fredoka One', Arial";
  ctx.textAlign   = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle   = "#ff1744";
  ctx.shadowBlur  = 30; ctx.shadowColor = "#ff1744";
  const cfg   = bossIntro.config;
  const label = bossIntro.isBoss2 ? "⚠️ BOSS FINAL: " : "⚔️ BOSS: ";
  ctx.fillText(label + cfg.desc + " " + cfg.emoji, canvas.width / 2, canvas.height / 2);
  ctx.restore();
}

// ── DRAW PRINCIPAL ───────────────────────────────────────────
function draw() {
  ctx.save();
  ctx.translate(screenShake.x, screenShake.y);

  drawBackground(state.frames);
  drawTrail();
  drawObstacles();
  drawCoins();
  drawPowerups();
  drawKnives();
  drawBosses();
  drawPlayer();
  if (OPTIONS.particles) drawParticles();

  drawBiomeProgressBar();
  // Notificação de troca de bioma (estava declarada mas nunca desenhada)
  if (biomeNotif.timer > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, biomeNotif.timer / 20);
    ctx.font = "bold 16px 'Fredoka One', Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#00e5ff";
    ctx.shadowBlur = 10; ctx.shadowColor = "#00e5ff";
    ctx.fillText(biomeNotif.text, canvas.width / 2, 36);
    ctx.restore();
  }
  drawPowerupBars();
  drawCenterNotif();
  drawRecordFlash();
  drawComboDisplay();
  drawBossIntro();
  if (isPaused) drawPauseOverlay();

  ctx.restore();
}

// ============================================================
// 26. GAME LOOP & END GAME
// ============================================================
function gameLoop() {
  if (state.game !== "PLAYING" && state.game !== "TUTORIAL") return;
  if (isPaused) return;

  updateScreenShake();

  if (state.game === "TUTORIAL") {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground(state.frames);
    drawTutorial();
    state.frames++; // tutorial não chama update(), incrementa aqui
    gameLoopId = requestAnimationFrame(gameLoop);
    return;
  }

  update();
  // Para imediatamente se endGame() foi chamado dentro do update
  if (state.game !== "PLAYING") return;
  draw();
  gameLoopId = requestAnimationFrame(gameLoop);
}

// ── Tela de Game Over injetada via JS (não depende do HTML) ──
function _showGameOverScreen(opts = {}) {
  // Remove instância anterior se existir
  const old = document.getElementById("ff-gameover-overlay");
  if (old) old.remove();

  const isSky      = !!opts.isSky;
  const finalScore = opts.score  ?? state.score;
  const isRecord   = opts.isRecord ?? false;
  const bi         = getBiomeIndex();
  const biomeName  = isSky ? "☁️ Modo Céu" : (BIOMES[bi]?.name || "?");
  const savedName  = localStorage.getItem("ff_name") || "Anônimo";
  const cp         = loadCheckpoint();

  // Placar top-5 inline
  const scores   = getScores().slice(0, 5);
  const medals   = ["🥇","🥈","🥉","4","5"];
  const scoreRows = scores.map((s, i) =>
    `<div style="display:flex;justify-content:space-between;align-items:center;
                 padding:5px 10px;background:rgba(255,255,255,${i===0?".1":".05"});
                 border-radius:7px;margin:3px 0;font-size:13px">
       <span>${medals[i]}</span>
       <span style="flex:1;text-align:left;padding:0 8px;color:white;
                    font-family:'Fredoka One',Arial">${s.name}</span>
       <span style="color:#f1c40f;font-family:'Fredoka One',Arial">${s.score}</span>
       <span style="color:rgba(255,255,255,.35);font-size:10px;margin-left:8px">${s.biome||""}</span>
     </div>`
  ).join("") || `<div style="color:rgba(255,255,255,.4);text-align:center;padding:10px;font-size:12px">Nenhum recorde ainda</div>`;

  const overlay = document.createElement("div");
  overlay.id    = "ff-gameover-overlay";
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    z-index: 9999;
    background: rgba(0,0,0,0.88);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Fredoka One', Arial, sans-serif;
    overflow-y: auto; -webkit-overflow-scrolling: touch;
  `;

  overlay.innerHTML = `
    <div style="
      background: linear-gradient(160deg, #1a0a2e 0%, #0d1b3e 60%, #0a2a1a 100%);
      border: 2px solid rgba(241,196,15,.4);
      border-radius: 20px;
      padding: 24px 20px 20px;
      width: min(400px, 92vw);
      max-height: 92vh;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      box-shadow: 0 8px 40px rgba(0,0,0,.7);
      text-align: center;
      position: relative;
    ">
      <!-- Emoji + título -->
      <div style="font-size:52px;line-height:1;margin-bottom:6px">
        ${SKINS[state.currentSkin]?.emoji || "🍔"}
      </div>
      <div style="font-size:14px;color:rgba(255,255,255,.5);margin-bottom:2px">${biomeName}</div>
      <div style="font-size:36px;font-weight:bold;color:#f1c40f">${finalScore}</div>
      <div style="font-size:13px;color:rgba(255,255,255,.4);margin-bottom:2px">pontos</div>
      ${isRecord
        ? `<div style="color:#ffd700;font-size:15px;margin:4px 0">🏆 NOVO RECORDE!</div>`
        : `<div style="color:rgba(255,255,255,.4);font-size:12px">Recorde: ${state.best}</div>`
      }

      <!-- Nome -->
      <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin:14px 0 10px">
        <input id="ff-go-name" type="text" maxlength="16" value="${savedName}"
          placeholder="Seu nome"
          style="background:rgba(255,255,255,.1);border:1.5px solid rgba(255,255,255,.25);
                 border-radius:8px;color:white;font-family:'Fredoka One',Arial;
                 font-size:14px;padding:7px 12px;width:140px;outline:none;text-align:center;
                 -webkit-appearance:none"/>
        <button id="ff-go-save-btn"
          style="background:#f1c40f;border:none;border-radius:8px;color:#222;
                 font-size:13px;padding:8px 14px;cursor:pointer;font-family:'Fredoka One',Arial">
          💾
        </button>
      </div>

      <!-- Botões de ação -->
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px">
        <button id="ff-go-play-again"
          style="background:linear-gradient(135deg,#27ae60,#1a6b3a);border:1px solid #2ecc71;
                 border-radius:10px;color:white;font-size:15px;padding:11px;cursor:pointer;
                 font-family:'Fredoka One',Arial;box-shadow:0 3px 10px rgba(46,204,113,.25)">
          🔄 Jogar Novamente
        </button>
        ${cp ? `<button id="ff-go-checkpoint"
                  style="background:linear-gradient(135deg,#f39c12,#d68910);
                         border:1px solid #f1c40f;
                         border-radius:10px;color:#fff;font-size:14px;padding:11px;cursor:pointer;
                         font-family:'Fredoka One',Arial;box-shadow:0 3px 10px rgba(241,196,15,.3)">
                  💾 Continuar do Checkpoint — ${cp.label} (${cp.score} pts)
                </button>` : ""}
        <button id="ff-go-menu"
          style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);
                 border-radius:10px;color:rgba(255,255,255,.8);font-size:14px;padding:9px;
                 cursor:pointer;font-family:'Fredoka One',Arial">
          🏠 Menu Principal
        </button>
      </div>

      <!-- Placar inline -->
      <div style="background:rgba(0,0,0,.3);border-radius:12px;padding:12px;
                  border:1px solid rgba(255,255,255,.08)">
        <div style="color:#f1c40f;font-size:12px;margin-bottom:8px;text-align:left">
          🏆 Top 5
        </div>
        ${scoreRows}
      </div>
    </div>`;

  document.body.appendChild(overlay);

  // ── Event listeners ─────────────────────────────────────
  // Salvar nome
  const saveBtn  = document.getElementById("ff-go-save-btn");
  const nameInpt = document.getElementById("ff-go-name");
  function _saveName() {
    const n = (nameInpt?.value || "").trim().slice(0, 16) || "Anônimo";
    localStorage.setItem("ff_name", n);
    const sc = getScores();
    if (sc.length) { sc[0].name = n; localStorage.setItem(SCORES_KEY, JSON.stringify(sc)); }
    if (saveBtn) { saveBtn.textContent = "✅"; setTimeout(() => { if (saveBtn) saveBtn.textContent = "💾"; }, 900); }
  }
  if (saveBtn)  saveBtn.addEventListener("click", _saveName);
  if (nameInpt) nameInpt.addEventListener("keydown", (e) => { if (e.key === "Enter") _saveName(); });


  // 🔄 Jogar Novamente — dois pulsos graves→agudo
  const playBtn = document.getElementById("ff-go-play-again");
  if (playBtn) playBtn.addEventListener("click", () => {
    playNote(380, "square", 0.07);
    setTimeout(() => playNote(560, "square", 0.09), 100);
    overlay.remove(); _doStartGame();
  });

  // Checkpoint anterior
  const cpBtn = document.getElementById("ff-go-checkpoint");
  if (cpBtn) cpBtn.addEventListener("click", () => {
    playNote(500, "sine", 0.08);
    setTimeout(() => playNote(650, "sine", 0.07), 90);
    overlay.remove(); useCheckpoint();
  });

  // Menu principal
  const menuBtn = document.getElementById("ff-go-menu");
  if (menuBtn) menuBtn.addEventListener("click", () => {
    playNote(350, "sine", 0.07);
    overlay.remove();
    state.game = "MENU";
    // Limpa seleção do modo céu ao voltar ao menu — permite trocar bioma normalmente
    window.skyMode = false;
    state._skySelected = false;
    localStorage.removeItem("ff_skyselected");
    if (UI.hud)    UI.hud.style.display    = "none";
    if (UI.bossUI) UI.bossUI.style.display = "none";
    showScreen("main-menu");
    if (UI.overlay) UI.overlay.style.display = "flex";
  });
}

function endGame() {
  if (state.game !== "PLAYING") return;
  state.game = "GAME_OVER";
  cancelAnimationFrame(gameLoopId);
  try { bgMusic.pause(); } catch (e) {}

  combo = 0;
  gameStats.totalDeaths++;
  if (state.score > gameStats.longestRun) gameStats.longestRun = state.score;
  const elapsed = Math.floor((Date.now() - _sessionStartTime) / 1000);
  gameStats.totalPlaySecs += elapsed;
  saveStats();

  // Lança animação de morte — spin + queda antes de mostrar game over
  deathAnim = { active: true, x: player.x, y: player.y, timer: 0, angle: 0, vy: -3, scale: 1 };
  triggerShake(12, 30);
  playNote(180, "sawtooth", 0.4, 0.06);

  const playerName = (localStorage.getItem("ff_name") || "Anônimo").slice(0, 16);
  const isRecord   = state.score >= state.best;
  if (isRecord && state.score > 0) {
    state.best = state.score;
    localStorage.setItem("ff_best", state.best);
  }
  saveHighScore(playerName, state.score);
  if (window._gUser) globalSaveScore(state.score); // ranking global
  save();

  if (UI.hud)    UI.hud.style.display    = "none";
  if (UI.bossUI) UI.bossUI.style.display = "none";

  // Roda a animação de morte por 900ms antes de mostrar a tela
  _runDeathAnim(isRecord);
}

function _runDeathAnim(isRecord) {
  const skin   = SKINS[state.currentSkin] || SKINS["Burger"];
  const totalFrames = 54; // ~900ms a 60fps

  function step() {
    deathAnim.timer++;
    deathAnim.angle += 0.25;
    deathAnim.vy    += 0.22;
    deathAnim.y     += deathAnim.vy;
    deathAnim.scale  = Math.max(0, 1 - deathAnim.timer / totalFrames);

    // Redesenha só o fundo + player morto
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw(); // frame congelado do background

    ctx.save();
    ctx.globalAlpha = deathAnim.scale;
    ctx.translate(deathAnim.x, deathAnim.y);
    ctx.rotate(deathAnim.angle);
    ctx.scale(deathAnim.scale, deathAnim.scale);
    ctx.font = skin.size + "px Arial";
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(skin.emoji, 0, 0);
    ctx.restore();

    if (deathAnim.timer < totalFrames) {
      requestAnimationFrame(step);
    } else {
      deathAnim.active = false;
      _showGameOverScreen({ score: state.score, isRecord, isSky: false });
    }
  }
  requestAnimationFrame(step);
}

window.submitHighScore = function () {
  const name = (document.getElementById("player-name")?.value || "").trim() || "Anônimo";
  saveHighScore(name, state.score);
};


// ============================================================
// 27. CONTROLES
// ============================================================
function doJump() {
  if (audioCtx.state === "suspended") audioCtx.resume();

  if (state.game === "TUTORIAL") return;

  if (state.game === "MENU") {
    startGame();
    return;
  }

  if (window.skyMode && state.game === "PLAYING") {
    player.v = -(SKINS[state.currentSkin]?.jump || 5.2);
    createExplosion(player.x, player.y, "#81d4fa", 5);
    playNote(520, "triangle", 0.06, OPTIONS.sfxVol * 0.6);
    return;
  }

  if (state.game === "PLAYING" && !isPaused) {
    if (player.doubleJumpReady && player.jumpsLeft > 0) {
      player.v = -(SKINS[state.currentSkin]?.jump || 5.2);
      player.jumpsLeft--;
      if (player.jumpsLeft <= 0) player.doubleJumpReady = false;
      createExplosion(player.x, player.y, "#4caf50", 8);
      playNote(680, "sine", 0.08, OPTIONS.sfxVol * 0.5);
    } else if (!player.doubleJumpReady) {
      player.v = -(SKINS[state.currentSkin]?.jump || 5.2);
      createExplosion(player.x, player.y, "rgba(255,255,255,0.6)", 4);
      playNote(460, "sine", 0.07, OPTIONS.sfxVol * 0.5);
    }
    return;
  }
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault();
    doJump();
  }
  if (e.code === "KeyP") togglePause();
});

document.addEventListener("touchstart", (e) => {
  // Previne zoom com dois dedos durante o jogo
  if (e.touches.length > 1) { e.preventDefault(); return; }
  e.preventDefault();
  const touch = e.touches[0];
  if (state.game === "TUTORIAL") {
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    handleTutorialClick((touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY);
    return;
  }
  doJump();
}, { passive: false });

document.addEventListener("touchmove", (e) => {
  // Bloqueia scroll durante o jogo
  if (state.game === "PLAYING") e.preventDefault();
}, { passive: false });

document.addEventListener("click", (e) => {
  if (state.game === "TUTORIAL") {
    const rect    = canvas.getBoundingClientRect();
    // Corrige escala CSS vs tamanho interno do canvas
    const scaleX  = canvas.width  / rect.width;
    const scaleY  = canvas.height / rect.height;
    handleTutorialClick((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
    return;
  }
  if (e.target === canvas) doJump();
});

// ============================================================
// 28. INICIALIZAÇÃO DO DOM
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  // Elimina scrollbars horizontais indesejadas + CSS mobile
  const noScrollStyle = document.createElement("style");
  noScrollStyle.textContent = `
    html, body { overflow-x: hidden !important; max-width: 100vw; }
    #screen-overlay, #game-hud, #gameCanvas { overflow-x: hidden !important; }
    #biomes-grid, #biomes-screen { overflow-x: hidden !important; overflow-y: auto; }
    ::-webkit-scrollbar:horizontal { display: none !important; height: 0 !important; }
    #main-menu .menu-btn-row + .menu-btn-row { margin-top: 12px !important; }
    #main-menu .btn-row ~ .btn-row           { margin-top: 12px !important; }
    #main-menu .menu-row ~ .menu-row         { margin-top: 12px !important; }
    #main-menu div[style*="flex"] ~ div[style*="flex"]   { margin-top: 12px !important; }
    #main-menu div[style*="grid"] ~ div[style*="grid"]   { margin-top: 12px !important; }

    /* Canvas */
    #gameCanvas { touch-action: none; user-select: none; -webkit-user-select: none; }

    /* ── Mobile extra ── */
    @media (max-width: 600px) {
      .menu-screen { font-size: 15px !important; }
      .biome-name  { font-size: 13px !important; }
      #ff-gameover-overlay > div {
        width: 94vw !important;
        max-height: 90vh !important;
        font-size: 13px !important;
      }
      #ff-go-play-again, #ff-go-menu, #ff-go-checkpoint {
        padding: 14px !important;
        font-size: 16px !important;
      }
    }
  `;
  document.head.appendChild(noScrollStyle);

  // ── Botão de pulo visível para mobile ────────────────────────
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth <= 600;
  if (isMobile) {
    const jumpBtn = document.createElement("div");
    jumpBtn.id = "ff-mobile-jump";
    jumpBtn.style.cssText = `
      position: fixed;
      bottom: 30px;
      right: 24px;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(255,255,255,0.18);
      border: 3px solid rgba(255,255,255,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      z-index: 500;
      cursor: pointer;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      transition: transform 0.08s, background 0.08s;
      user-select: none;
      -webkit-user-select: none;
    `;
    jumpBtn.textContent = "👆";
    document.body.appendChild(jumpBtn);

    // Mostra/esconde conforme o estado do jogo
    function _updateJumpBtn() {
      const show = state.game === "PLAYING";
      jumpBtn.style.display = show ? "flex" : "none";
    }
    setInterval(_updateJumpBtn, 200);

    jumpBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      e.stopPropagation();
      jumpBtn.style.transform  = "scale(0.88)";
      jumpBtn.style.background = "rgba(255,255,255,0.32)";
      doJump();
    }, { passive: false });
    jumpBtn.addEventListener("touchend", () => {
      jumpBtn.style.transform  = "scale(1)";
      jumpBtn.style.background = "rgba(255,255,255,0.18)";
    });

    // Botão de pause mobile (canto superior esquerdo)
    const pauseBtn = document.createElement("div");
    pauseBtn.id = "ff-mobile-pause";
    pauseBtn.style.cssText = `
      position: fixed;
      top: 14px;
      left: 14px;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(0,0,0,0.4);
      border: 2px solid rgba(255,255,255,0.25);
      display: none;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      z-index: 500;
      cursor: pointer;
      user-select: none;
      -webkit-user-select: none;
    `;
    pauseBtn.textContent = "⏸";
    document.body.appendChild(pauseBtn);

    function _updatePauseBtn() {
      const show = state.game === "PLAYING";
      pauseBtn.style.display = show ? "flex" : "none";
      pauseBtn.textContent   = isPaused ? "▶" : "⏸";
    }
    setInterval(_updatePauseBtn, 200);

    pauseBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      e.stopPropagation();
      togglePause();
    }, { passive: false });
  }

  injectOptionsScreen();
  injectStatsScreen();
  applyOptions();
  renderShop();

  checkpoint = loadCheckpoint();
  if (checkpoint) {
    const cpBanner = document.getElementById("checkpoint-banner");
    if (cpBanner) {
      cpBanner.style.display = "block";
      cpBanner.innerHTML     = `💾 Checkpoint: ${checkpoint.label} — Score ${checkpoint.score} &nbsp;
        <button onclick="useCheckpoint()" style="background:#f1c40f;border:none;border-radius:6px;
          padding:4px 12px;cursor:pointer;font-family:'Fredoka One',Arial;font-size:13px;color:#222">Continuar</button>
        <button onclick="clearCheckpoint();this.parentElement.style.display='none'"
          style="background:rgba(255,255,255,.2);border:none;border-radius:6px;padding:4px 8px;
          cursor:pointer;color:white;font-size:13px;margin-left:4px">✕</button>`;
    }
  }

  // Popula select de bioma inicial
  const biomeSelect = document.getElementById("start-biome-select");
  if (biomeSelect) {
    state.unlockedBiomes.forEach((bi) => {
      const opt = document.createElement("option");
      opt.value       = bi;
      opt.textContent = BIOMES[bi]?.name || "Bioma " + bi;
      if (bi === state._startBiome) opt.selected = true;
      biomeSelect.appendChild(opt);
    });
    biomeSelect.onchange = () => {
      state._startBiome = parseInt(biomeSelect.value);
      localStorage.setItem("ff_startbiome", state._startBiome);
    };
  }

  showScreen("main-menu");
  _gInit(); // sistema global
});

// ============================================================
// 29. FUNÇÕES GLOBAIS / WINDOW EXPORTS
// ============================================================

// Reinicia o jogo completamente sem location.reload() (bloqueado no CodePen)
function _softReset() {
  state.diamonds       = 0;
  state.best           = 0;
  state.unlocked       = ["Burger"];
  state.currentSkin    = "Burger";
  state.unlockedBiomes = [0];
  state.defeatedBosses = {};
  state._startBiome    = 0;
  state._skySelected   = false;
  state.missions       = migrateMissions(null);
  gameStats = { totalGames: 0, totalPipes: 0, totalBossKills: 0, maxCombo: 0,
                totalDiamonds: 0, totalPlaySecs: 0, totalDeaths: 0, longestRun: 0 };
  saveStats();
  checkpoint   = null;
  tutorialSeen = false;
  state.game   = "MENU";
  cancelAnimationFrame(gameLoopId);
  try { bgMusic.pause(); } catch (_) {}
  if (UI.hud)    UI.hud.style.display    = "none";
  if (UI.bossUI) UI.bossUI.style.display = "none";
  const goOverlay = document.getElementById("ff-gameover-overlay");
  if (goOverlay) goOverlay.remove();
  showScreen("main-menu");
  if (UI.overlay) UI.overlay.style.display = "flex";
  alert("✅ Jogo resetado! Boa sorte do zero 🍔");
}
// Exporta imediatamente para window — necessário para onclick inline no HTML
window.startGame          = startGame;
window.showScreen         = showScreen;
window.togglePause        = togglePause;
window.useCheckpoint      = useCheckpoint;
window.clearCheckpoint    = clearCheckpoint;
window.claimMissionReward = claimMissionReward;
window.renderShop         = renderShop;
window.renderBiomes       = renderBiomes;
window.confirmResetStats = function () {
  if (confirm("Zerar todas as estatísticas? Isso não afeta diamantes ou skins.")) {
    gameStats = { totalGames: 0, totalPipes: 0, totalBossKills: 0, maxCombo: 0,
                  totalDiamonds: 0, totalPlaySecs: 0, totalDeaths: 0, longestRun: 0 };
    saveStats();
    renderStatsScreen();
  }
};

window.confirmResetAll = function () {
  if (confirm("⚠️ RESETAR TUDO?\n\nIsso vai apagar:\n- Diamantes\n- Skins desbloqueadas\n- Biomas desbloqueados\n- Recorde e placar\n- Checkpoints\n- Missões\n- Estatísticas\n\nEssa ação não pode ser desfeita!")) {
    const keys = ["ff_gems","ff_best","ff_unl","ff_missions","ff_biomes","ff_startbiome",
                  "ff_defbosses","ff_skyselected","ff_name",CHECKPOINT_KEY,SCORES_KEY,STATS_KEY];
    keys.forEach(k => localStorage.removeItem(k));
    _softReset();
  }
};

// ── Handlers de Opções ───────────────────────────────────────
window.optMusicToggle = function (v) {
  OPTIONS.musicOn = v;
  applyOptions();
  saveOptions();
  const row = document.getElementById("opt-music-vol-row");
  if (row) row.style.opacity = v ? "1" : "0.35";
};
window.optMusicVol = function (v) {
  OPTIONS.musicVol = parseInt(v) / 100;
  applyOptions();
  saveOptions();
  const lbl = document.getElementById("opt-music-vol-label");
  if (lbl) lbl.innerText = v + "%";
};
window.optSfxToggle = function (v) {
  OPTIONS.sfxOn = v;
  saveOptions();
  const row = document.getElementById("opt-sfx-vol-row");
  if (row) row.style.opacity = v ? "1" : "0.35";
};
window.optSfxVol = function (v) {
  OPTIONS.sfxVol = parseInt(v) / 100;
  saveOptions();
  const lbl = document.getElementById("opt-sfx-vol-label");
  if (lbl) lbl.innerText = v + "%";
};
window.optToggle = function (key, v) {
  OPTIONS[key] = v;
  saveOptions();
};
window.optResetSave = function () {
  if (!confirm("⚠️ Isso apagará TODO o seu progresso (diamantes, skins, missões). Tem certeza?")) return;
  ["ff_gems","ff_best","ff_unl","ff_missions","ff_biomes","ff_startbiome",
   "ff_name","ff_tut","ff_checkpoint"].forEach((k) => localStorage.removeItem(k));
  _softReset();
};
window.optResetTutorial = function (e) {
  e.preventDefault();
  tutorialSeen = false;
  localStorage.removeItem("ff_tut");
  showScreen("main-menu");
  alert("Tutorial resetado! Aparecerá na próxima partida.");
};
window.optClearCheckpoint = function (e) {
  e.preventDefault();
  clearCheckpoint();
  alert("Checkpoint apagado.");
  renderOptions();
};


// ============================================================
// 30. ☁️ MODO CÉU — BIOMA ESPECIAL (patch integrado)
// ============================================================

// Nuvens e pássaros decorativos do modo céu
const SKY_CLOUDS = [
  // Camada fundo — lentas e pequenas
  { x:  60, y:  90, speed: 0.25, scale: 0.55, alpha: 0.55 },
  { x: 200, y: 165, speed: 0.20, scale: 0.50, alpha: 0.45 },
  { x: 375, y: 200, speed: 0.22, scale: 0.60, alpha: 0.50 },
  { x: 530, y: 130, speed: 0.18, scale: 0.45, alpha: 0.40 },
  // Camada do meio
  { x:  95, y:  55, speed: 0.45, scale: 0.80, alpha: 0.75 },
  { x: 270, y:  75, speed: 0.50, scale: 0.90, alpha: 0.80 },
  { x: 460, y:  42, speed: 0.42, scale: 0.75, alpha: 0.70 },
  { x: 620, y: 115, speed: 0.48, scale: 0.85, alpha: 0.72 },
  // Camada frontal — grandes e rápidas
  { x: 140, y: 300, speed: 0.90, scale: 1.10, alpha: 0.88 },
  { x: 340, y: 340, speed: 1.00, scale: 1.20, alpha: 0.90 },
  { x: 520, y: 270, speed: 0.85, scale: 1.00, alpha: 0.85 },
  // Nuvens baixas
  { x: 110, y: 450, speed: 0.70, scale: 0.95, alpha: 0.60 },
  { x: 320, y: 490, speed: 0.60, scale: 0.80, alpha: 0.50 },
  { x: 560, y: 420, speed: 0.75, scale: 1.05, alpha: 0.65 },
];
const SKY_BIRDS = [
  { x: 120, y: 100, speed: 1.2, flap: 0 },
  { x: 320, y: 65,  speed: 0.9, flap: 15},
  { x: 500, y: 130, speed: 1.4, flap: 7 }
];

// Inicia o modo céu a partir do menu de Biomas
window.startSkyMode = function () {
  window.skyMode    = true;
  state._startBiome = 0;
  _skyShowModeTag();
  _doStartGame();
};

// Mostra a tag "☁️ MODO CÉU" no HUD
function _skyShowModeTag() {
  let tag = document.getElementById("sky-mode-tag");
  if (!tag) {
    tag      = document.createElement("div");
    tag.id   = "sky-mode-tag";
    tag.style.cssText = `
      position:fixed; top:10px; left:50%; transform:translateX(-50%);
      background:rgba(1,87,155,0.82); color:#81d4fa;
      font-family:'Fredoka One',Arial,sans-serif; font-size:14px;
      padding:5px 16px; border-radius:20px;
      border:1px solid rgba(129,212,250,0.55);
      z-index:1000; pointer-events:none;
      box-shadow:0 2px 12px rgba(41,182,246,0.3);
    `;
    tag.textContent = "☁️ MODO CÉU";
    document.body.appendChild(tag);
  }
  tag.style.display = "block";
}

// Oculta a tag do modo céu
function _skyHideModeTag() {
  const tag = document.getElementById("sky-mode-tag");
  if (tag) tag.style.display = "none";
}

// Loop do modo céu — separado do gameLoop normal
function skyGameLoop() {
  if (!window.skyMode || state.game !== "PLAYING") return;
  if (isPaused) return;

  updateScreenShake();
  skyUpdate();
  skyDraw();

  gameLoopId = requestAnimationFrame(skyGameLoop);
}

// Update simplificado para o modo céu (sem power-ups, sem bosses, sem buffs)
function skyUpdate() {
  state.frames++;

  // Física do jogador
  const skin = SKINS[state.currentSkin] || SKINS["Burger"];
  player.v  += skin.grav;
  player.y  += player.v;
  player.tiltAngle = Math.max(-0.6, Math.min(0.5, player.v * 0.08));

  // Limite superior
  if (player.y < 0) { player.y = 0; player.v = 0; }
  // Sem chão — cai nas nuvens = morte (limite é a borda inferior do canvas)
  if (player.y > canvas.height) {
    if (!window.godMode) { skyEndGame(); return; }
    else { player.y = canvas.height - 10; player.v = 0; }
  }

  // Velocidade progressiva — mais gentil nos primeiros 20 pontos
  const earlyFactor = Math.min(state.score / 20, 1); // 0→1 nos primeiros 20pts
  const skySpeed = Math.min(
    BASE_PIPE_SPEED + earlyFactor * Math.floor(state.score / 10) * 0.2,
    MAX_PIPE_SPEED + 2
  );
  // Gap mais generoso no início, aperta depois de 20 pontos
  const skyGap = Math.max(130, 220 - earlyFactor * Math.floor(state.score / 20) * 8);

  // Spawn de canos
  if (state.frames % GAME_CONFIG.pipeSpawnRate === 0) {
    const topH = 60 + Math.random() * (canvas.height - skyGap - 100);
    obstacles.push({ x: canvas.width + 10, h: topH, gap: skyGap, passed: false, biome: 0 });
  }

  // Move canos
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= skySpeed;

    if (!o.passed && o.x + 26 < player.x - 18) {
      o.passed = true;
      state.score++;
      combo++;
      if (UI.score) UI.score.innerText = state.score;
      if (state.score > state.best) {
        state.best = state.score;
        localStorage.setItem("ff_best", state.best);
        recordFlash = { timer: 40 };
        if (UI.best) UI.best.innerText = state.best;
      }
      comboDisplay = { value: combo, timer: 60 };
      playNote(720, "sine", 0.06, OPTIONS.sfxVol * 0.4);
    }

    if (o.x < -60) { obstacles.splice(i, 1); continue; }

    // Colisão
    if (!window.godMode) {
      if (player.x + 18 > o.x - 26 && player.x - 18 < o.x + 26) {
        if (player.y - 18 < o.h || player.y + 18 > o.h + o.gap) {
          skyEndGame(); return;
        }
      }
    }
  }

  // Nuvens decorativas
  SKY_CLOUDS.forEach((c) => {
    c.x -= c.speed;
    if (c.x < -150) c.x = canvas.width + 100;
  });
  SKY_BIRDS.forEach((b) => {
    b.x    -= b.speed;
    b.flap  = (b.flap + 1) % 20;
    if (b.x < -40) b.x = canvas.width + 40;
  });

  // Trilha azul clara (rastro do personagem no céu)
  if (OPTIONS.trail && state.frames % GAME_CONFIG.trailSpawnRate === 0) {
    trail.push({ x: player.x, y: player.y, life: 1.0, sky: true });
  }
  // Atualiza trail e partículas normalmente
  for (let i = trail.length - 1; i >= 0; i--) {
    trail[i].life -= GAME_CONFIG.trailFade;
    if (trail[i].life <= 0) trail.splice(i, 1);
  }
  if (OPTIONS.particles) updateParticles();

  if (recordFlash.timer  > 0) recordFlash.timer--;
  if (comboDisplay.timer > 0) comboDisplay.timer--;
  if (centerNotif.timer  > 0) centerNotif.timer--;
}

// Draw do modo céu
function skyDraw() {
  ctx.save();
  ctx.translate(screenShake.x, screenShake.y);

  drawSkyBackground();
  drawTrail();
  drawSkyObstacles();
  drawPlayer();
  if (OPTIONS.particles) drawParticles();

  drawComboDisplay();
  drawRecordFlash();
  drawCenterNotif();
  if (isPaused) drawPauseOverlay();

  ctx.restore();
}

// Fundo do modo céu com paralaxe, sol, nuvens animadas e pássaros
function drawSkyBackground() {
  // Gradiente de céu
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0,   "#0d47a1");
  grad.addColorStop(0.4, "#1976d2");
  grad.addColorStop(0.8, "#64b5f6");
  grad.addColorStop(1,   "#bbdefb");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Sol com halo
  ctx.save();
  const sunX = canvas.width - 65, sunY = 60;
  const halo = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, 80);
  halo.addColorStop(0,   "rgba(255,249,196,0.55)");
  halo.addColorStop(1,   "rgba(255,249,196,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(sunX - 80, sunY - 80, 160, 160);
  ctx.shadowBlur  = 50;
  ctx.shadowColor = "rgba(255,238,88,0.7)";
  ctx.fillStyle   = "#fff9c4";
  ctx.beginPath();
  ctx.arc(sunX, sunY, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Nuvens com paralaxe e alpha por camada
  SKY_CLOUDS.forEach((c) => {
    ctx.save();
    ctx.globalAlpha = c.alpha ?? 0.88;
    ctx.translate(c.x, c.y);
    ctx.scale(c.scale, c.scale);
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    [[0,0,30],[28,0,24],[-26,0,20],[10,-14,20],[-12,-12,16],[-2,10,14]].forEach(([ox, oy, r]) => {
      ctx.beginPath(); ctx.arc(ox, oy, r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  });

  // Pássaros
  SKY_BIRDS.forEach((b) => {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.font = b.flap < 10 ? "16px Arial" : "14px Arial";
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🐦", 0, 0);
    ctx.restore();
  });

  // Névoa na base (substitui o chão — sensação de altitude infinita)
  const mist = ctx.createLinearGradient(0, canvas.height - 80, 0, canvas.height);
  mist.addColorStop(0, "rgba(187,222,251,0)");
  mist.addColorStop(1, "rgba(227,242,253,0.75)");
  ctx.fillStyle = mist;
  ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
}

// Canos verdes clássicos do modo céu
function drawSkyObstacles() {
  const pc = PIPE_COLORS[0]; // Verde clássico
  obstacles.forEach((o) => {
    function drawPipe(x, topY, height, capAtTop) {
      const gPipe = ctx.createLinearGradient(x - 26, 0, x + 26, 0);
      gPipe.addColorStop(0, pc.b); gPipe.addColorStop(0.35, pc.a); gPipe.addColorStop(1, pc.b);
      ctx.fillStyle = gPipe;
      ctx.fillRect(x - 26, topY, 52, height);
      ctx.strokeStyle = pc.border; ctx.lineWidth = 2;
      ctx.strokeRect(x - 26, topY, 52, height);
      const capY = capAtTop ? topY : topY + height - 16;
      ctx.fillStyle = pc.cap;
      ctx.fillRect(x - 30, capY, 60, 16);
      ctx.save(); ctx.globalAlpha = 0.18;
      ctx.fillStyle = "white"; ctx.fillRect(x - 22, topY, 10, height);
      ctx.restore();
    }
    drawPipe(o.x, 0, o.h, false);
    drawPipe(o.x, o.h + o.gap, canvas.height - (o.h + o.gap), true);
  });
}

// Barra de progresso vs recorde no modo céu
function drawSkyProgressBar() {
  const barW = 160, barH = 10;
  const bx   = canvas.width / 2 - barW / 2;
  const by   = canvas.height - 50;

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath(); ctx.roundRect(bx, by, barW, barH, 5); ctx.fill();

  if (state.best > 0) {
    const pct = Math.min(state.score / state.best, 1);
    const gradR = ctx.createLinearGradient(bx, 0, bx + barW, 0);
    gradR.addColorStop(0, "#29b6f6"); gradR.addColorStop(1, "#0288d1");
    ctx.fillStyle = gradR;
    ctx.beginPath(); ctx.roundRect(bx, by, barW * pct, barH, 5); ctx.fill();
  }

  ctx.font      = "11px 'Fredoka One', Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("☁️ " + state.score + " / recorde " + state.best, canvas.width / 2, by - 5);
  ctx.restore();
}

// Tela de fim de jogo exclusiva do modo céu
function skyEndGame() {
  if (state.game !== "PLAYING") return;
  state.game = "GAME_OVER";
  cancelAnimationFrame(gameLoopId);
  try { bgMusic.pause(); } catch (e) {}

  const finalScore = state.score;
  const isRecord   = finalScore > state.best;
  if (isRecord && finalScore > 0) { state.best = finalScore; localStorage.setItem("ff_best", state.best); }

  gameStats.totalDeaths++;
  gameStats.totalPlaySecs += Math.floor((Date.now() - _sessionStartTime) / 1000);
  if (finalScore > gameStats.longestRun) gameStats.longestRun = finalScore;
  saveStats();

  const playerName = (localStorage.getItem("ff_name") || "Anônimo").slice(0, 16);
  saveHighScore(playerName, finalScore);
  if (window._gUser) globalSaveScore(finalScore); // ranking global
  save();

  if (UI.hud)    UI.hud.style.display    = "none";
  if (UI.bossUI) UI.bossUI.style.display = "none";

  deathAnim = { active: true, x: player.x, y: player.y, timer: 0, angle: 0, vy: -3, scale: 1 };
  triggerShake(10, 25);
  playNote(160, "sawtooth", 0.35, 0.06);

  const skin = SKINS[state.currentSkin] || SKINS["Burger"];
  const totalFrames = 54;
  function step() {
    deathAnim.timer++;
    deathAnim.angle += 0.25;
    deathAnim.vy    += 0.22;
    deathAnim.y     += deathAnim.vy;
    deathAnim.scale  = Math.max(0, 1 - deathAnim.timer / totalFrames);

    // Redesenha só o fundo estático (sem chamar skyDraw completo com state=GAME_OVER)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSkyBackground();
    drawSkyObstacles();

    ctx.save();
    ctx.globalAlpha = deathAnim.scale;
    ctx.translate(deathAnim.x, deathAnim.y);
    ctx.rotate(deathAnim.angle);
    ctx.scale(deathAnim.scale, deathAnim.scale);
    ctx.font = skin.size + "px Arial";
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(skin.emoji, 0, 0);
    ctx.restore();

    if (deathAnim.timer < totalFrames) {
      requestAnimationFrame(step);
    } else {
      deathAnim.active = false;
      _showGameOverScreen({ score: finalScore, isRecord, isSky: true });
    }
  }
  requestAnimationFrame(step);
}

// ============================================================
// 31. PAINEL ADMIN (ADM) — v2.0
// ============================================================

// ── God Mode ─────────────────────────────────────────────────
window.adminToggleGod = window.adminToggleGodMode = function () {
  window.godMode = !window.godMode;
  localStorage.setItem("ff_godmode", window.godMode ? "1" : "0");
  const btn = document.getElementById("btn-god");
  if (btn) {
    btn.textContent  = "🛡️ GOD: " + (window.godMode ? "ON" : "OFF");
    btn.style.background = window.godMode ? "#27ae60" : "#e74c3c";
  }
  _admRefresh();
};

// ── Ir para Bioma ─────────────────────────────────────────────
window.adminGoBiome = function (biomeIdx) {
  if (state.game !== "PLAYING") { alert("⚠️ Inicie uma partida primeiro!"); return; }
  state.score = biomeIdx * 80;
  if (UI.score) UI.score.innerText = state.score;
  prevBiome = biomeIdx;
  resetBossState();
  obstacles = [];
  bossRage  = false;
  _admRefresh();
};

// ── Ir para Fase ─────────────────────────────────────────────
// 0=Dia  1=Boss A (20)  2=Boss B (40)  3=Livre (60)
window.adminGoPhase = function (phase) {
  if (state.game !== "PLAYING") { alert("⚠️ Inicie uma partida primeiro!"); return; }
  const base    = getBiomeIndex() * 80;
  const offsets = [0, 20, 40, 60];
  state.score   = base + (offsets[phase] || 0);
  if (UI.score) UI.score.innerText = state.score;
  resetBossState();
  obstacles = [];
  bossRage  = false;
  // Pré-resolve bosses já derrotados para o ponto escolhido
  if (phase >= 2) { bossDefeated = true;  boss.active  = false; }  // fase Boss B ou Livre
  if (phase >= 3) { boss2Defeated = true; boss2.active = false; }  // fase Livre
  _admRefresh();
};

// ── Setar Score manualmente ───────────────────────────────────
window.adminSetScore = function () {
  if (state.game !== "PLAYING") { alert("⚠️ Inicie uma partida primeiro!"); return; }
  const inp = document.getElementById("adm-score-input");
  const val = parseInt(inp?.value);
  if (isNaN(val) || val < 0) { alert("Score inválido!"); return; }
  state.score = val;
  if (UI.score) UI.score.innerText = state.score;
  prevBiome = getBiomeIndex();
  resetBossState();
  obstacles = [];
  bossRage  = false;
  // Pré-resolve estado dos bosses com base no sp — mesmo critério do adminGoPhase
  const sp = val % 80;
  if (sp >= 40) { bossDefeated = true;  boss.active  = false; }
  if (sp >= 60) { boss2Defeated = true; boss2.active = false; }
  hideBossUI();
  _admRefresh();
};

// ── Matar Boss ativo ─────────────────────────────────────────
window.adminKillBoss = function () {
  let killed = false;
  if (boss.active  && !bossDefeated)  { boss.hp  = 0; killed = true; }
  if (boss2.active && !boss2Defeated) { boss2.hp = 0; killed = true; }
  if (!killed) alert("Nenhum boss ativo no momento.");
};

// ── Forçar spawn de Boss A ou B ──────────────────────────────
window.adminSpawnBoss = function (which) {
  if (state.game !== "PLAYING") { alert("⚠️ Inicie uma partida primeiro!"); return; }
  const bi    = getBiomeIndex();
  const biome = BIOMES[bi];
  if (!biome) return;
  if (which === "A") {
    if (boss.active) { alert("Boss A já está ativo!"); return; }
    boss.active = true; boss.hp = biome.bossA.hp; boss.maxHp = biome.bossA.hp;
    boss.y = 200; boss.dir = 1; boss.attackTimer = 0;
    bossDefeated = false; bossRage = false;
    bossIntro = { active: true, timer: 60, config: biome.bossA, isBoss2: false };
    if (UI.bossUI) UI.bossUI.style.display = "block";
    const nameEl = document.getElementById("boss-name");
    if (nameEl) nameEl.innerText = biome.bossA.desc + " " + biome.bossA.emoji;
  } else {
    if (boss2.active) { alert("Boss B já está ativo!"); return; }
    boss2.active = true; boss2.hp = biome.bossB.hp; boss2.maxHp = biome.bossB.hp;
    boss2.y = 300; boss2.dir = 1; boss2.attackTimer = 0;
    boss2Defeated = false; bossRage = false;
    bossIntro = { active: true, timer: 60, config: biome.bossB, isBoss2: true };
    if (UI.bossUI) UI.bossUI.style.display = "block";
    const nameEl = document.getElementById("boss-name");
    if (nameEl) nameEl.innerText = biome.bossB.desc + " " + biome.bossB.emoji;
  }
  _admRefresh();
};

// ── Spawnar Power-up específico ───────────────────────────────
window.adminSpawnPowerup = function (emoji) {
  if (state.game !== "PLAYING") { alert("⚠️ Inicie uma partida primeiro!"); return; }
  const match = POWERUP_TABLE.find(p => p.emoji === emoji);
  if (!match) return;
  powerups.push({ x: player.x + 80, y: player.y, ...match, pulse: 0 });
};

// ── Aplicar power-up direto no player ────────────────────────
window.adminApplyBuff = function (type) {
  if (state.game !== "PLAYING") { alert("⚠️ Inicie uma partida primeiro!"); return; }
  const duration = 600; // 10s a 60fps
  switch (type) {
    case "shield": player.shield = true;  break;
    case "magnet": player.magnet = duration; break;
    case "turbo":  player.turbo  = duration; break;
    case "slow":   player.slow   = duration; break;
    case "ghost":  player.ghost  = duration; break;
    case "star":   player.star   = duration; break;
    case "freeze": player.freeze = duration; break;
    case "mini":   player.mini   = duration; break;
    case "djump":  player.jumpsLeft = 2; player.doubleJumpReady = true; break;
    case "allbuffs":
      player.shield = true; player.magnet = duration; player.turbo = duration;
      player.ghost  = duration; player.star  = duration; player.freeze = duration;
      break;
  }
  showCenterNotif("🛠️ Buff aplicado: " + type, "#f1c40f", 16, 60);
};

// ── Adicionar Gemas ───────────────────────────────────────────
window.adminAddGems = function (amount) {
  let n;
  if (amount !== undefined) {
    n = parseInt(amount);
  } else {
    const inp = document.getElementById("adm-gems-input");
    n = parseInt(inp?.value);
    if (inp) inp.value = "";
  }
  if (isNaN(n) || n <= 0) { alert("Quantidade inválida!"); return; }
  state.diamonds += n;
  if (UI.coins) UI.coins.innerText = state.diamonds;
  save();
  showCenterNotif("💎 +" + n.toLocaleString("pt-BR") + " gemas!", "#2ecc71", 16, 60);
  _admRefresh();
};

// ── Desbloquear Tudo ──────────────────────────────────────────
window.adminUnlockAll = function () {
  state.unlocked       = Object.keys(SKINS);
  state.unlockedBiomes = BIOMES.map((_, i) => i);
  save();
  showCenterNotif("🔓 Tudo desbloqueado!", "#2ecc71", 18, 80);
  _admRefresh();
};

// ── Definir Velocidade ────────────────────────────────────────
window.adminSetSpeed = function (mult) {
  adminSpeedMult = parseFloat(mult) || 1.0;
  const lbl = document.getElementById("adm-speed-label");
  if (lbl) lbl.textContent = adminSpeedMult + "x";
};

// ── Reset Save ────────────────────────────────────────────────
window.adminResetSave = window.adminResetAll = function () {
  if (!confirm("⚠️ Reset TOTAL do save? Isso apaga tudo.")) return;
  ["ff_gems","ff_best","ff_unl","ff_missions","ff_biomes","ff_startbiome",
   "ff_name","ff_tut","ff_checkpoint","ff_stats"].forEach(k => localStorage.removeItem(k));
  _softReset();
};

// ── Trocar aba do painel ADM ──────────────────────────────────
window.admTab = function (tab) {
  document.querySelectorAll(".adm-tab-content").forEach(el => el.style.display = "none");
  document.querySelectorAll(".adm-tab-btn").forEach(el => {
    el.style.background    = "rgba(255,255,255,0.07)";
    el.style.color         = "rgba(255,255,255,0.55)";
    el.style.borderBottom  = "2px solid transparent";
  });
  const content = document.getElementById("adm-tab-" + tab);
  const btn     = document.getElementById("adm-tbtn-" + tab);
  if (content) content.style.display = "block";
  if (btn)     { btn.style.background = "rgba(241,196,15,0.15)"; btn.style.color = "#f1c40f"; btn.style.borderBottom = "2px solid #f1c40f"; }
};

// ── Atualiza painel de info ───────────────────────────────────
function _admRefresh() {
  const bi  = getBiomeIndex();
  const sp  = getScoreInBiome();
  const spd = getDifficultySpeed().toFixed(2);

  // Info bar compacta no topo
  const infoEl = document.getElementById("adm-info");
  if (infoEl) {
    infoEl.innerHTML =
      `<span style="color:#f1c40f">⭐ ${state.score}</span> &nbsp;
       <span style="color:#81d4fa">${BIOMES[bi]?.name || "?"}</span> &nbsp;
       <span style="color:rgba(255,255,255,.5)">+${sp}pts</span> &nbsp;|&nbsp;
       <span style="color:#2ecc71">💎 ${state.diamonds.toLocaleString("pt-BR")}</span> &nbsp;|&nbsp;
       <span style="color:${window.godMode ? "#2ecc71" : "#e74c3c"}">${window.godMode ? "🛡️GOD" : "mortal"}</span> &nbsp;|&nbsp;
       <span style="color:#ff9800">⚡${spd}x</span>`;
  }

  // Aba info detalhada
  const detailEl = document.getElementById("adm-detail-info");
  if (detailEl) {
    const bAhp  = boss.active  ? `<span style="color:#ef5350">${Math.round(boss.hp)}/${boss.maxHp}</span>` : `<span style="color:#555">—</span>`;
    const bBhp  = boss2.active ? `<span style="color:#ef5350">${Math.round(boss2.hp)}/${boss2.maxHp}</span>` : `<span style="color:#555">—</span>`;
    detailEl.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px">
        <div style="background:rgba(255,255,255,.06);border-radius:8px;padding:8px">
          <div style="color:rgba(255,255,255,.4);font-size:9px;margin-bottom:4px">JOGO</div>
          <div>Score: <b style="color:#f1c40f">${state.score}</b></div>
          <div>Recorde: <b style="color:#ffd700">${state.best}</b></div>
          <div>Bioma: <b style="color:#81d4fa">${BIOMES[bi]?.name || "?"}</b></div>
          <div>Fase: <b style="color:white">+${sp} pts</b></div>
          <div>Sky: <b style="color:#81d4fa">${window.skyMode ? "☁️ SIM" : "NÃO"}</b></div>
        </div>
        <div style="background:rgba(255,255,255,.06);border-radius:8px;padding:8px">
          <div style="color:rgba(255,255,255,.4);font-size:9px;margin-bottom:4px">ESTADO</div>
          <div>God: <b style="color:${window.godMode?"#2ecc71":"#e74c3c"}">${window.godMode?"✅ ON":"❌ OFF"}</b></div>
          <div>Vel: <b style="color:#ff9800">${spd}×</b></div>
          <div>Boss A: ${bAhp}</div>
          <div>Boss B: ${bBhp}</div>
          <div>Rage: <b style="color:${bossRage?"#ff1744":"#555"}">${bossRage?"😡 SIM":"NÃO"}</b></div>
        </div>
        <div style="background:rgba(255,255,255,.06);border-radius:8px;padding:8px">
          <div style="color:rgba(255,255,255,.4);font-size:9px;margin-bottom:4px">PLAYER</div>
          <div>Shield: <b style="color:${player.shield?"#3498db":"#555"}">${player.shield?"✅":"—"}</b></div>
          <div>Turbo: <b style="color:${player.turbo>0?"#ff7043":"#555"}">${player.turbo>0?player.turbo:"—"}</b></div>
          <div>Ghost: <b style="color:${player.ghost>0?"#9b59b6":"#555"}">${player.ghost>0?player.ghost:"—"}</b></div>
          <div>Freeze: <b style="color:${player.freeze>0?"#80deea":"#555"}">${player.freeze>0?player.freeze:"—"}</b></div>
        </div>
        <div style="background:rgba(255,255,255,.06);border-radius:8px;padding:8px">
          <div style="color:rgba(255,255,255,.4);font-size:9px;margin-bottom:4px">PROGRESSO</div>
          <div>💎 ${state.diamonds.toLocaleString("pt-BR")}</div>
          <div>🎮 ${gameStats.totalGames} partidas</div>
          <div>☠️ ${gameStats.totalBossKills} bosses</div>
          <div>🎨 ${state.unlocked.length}/${Object.keys(SKINS).length} skins</div>
        </div>
      </div>`;
  }

  // Atualiza botão God no topo
  const godBtn = document.getElementById("adm-god-btn");
  if (godBtn) {
    godBtn.textContent   = "🛡️ GOD: " + (window.godMode ? "ON" : "OFF");
    godBtn.style.background = window.godMode
      ? "linear-gradient(135deg,#27ae60,#1e8449)"
      : "linear-gradient(135deg,#e74c3c,#c0392b)";
  }

  // Atualiza o btn-god legado (HUD)
  const btnGod = document.getElementById("btn-god");
  if (btnGod) {
    btnGod.textContent   = "🛡️ GOD: " + (window.godMode ? "ON" : "OFF");
    btnGod.style.background = window.godMode ? "#27ae60" : "#e74c3c";
  }
}

// Refresh automático a cada 500ms enquanto o painel estiver aberto
setInterval(() => {
  const adminPanel = document.getElementById("admin-screen");
  if (!adminPanel || adminPanel.style.display === "none") return;
  _admRefresh();
}, 500);

// ============================================================
// 32. SISTEMA GLOBAL — Ranking, Login, Amigos
// ============================================================
//
//  CONFIGURAÇÃO (obrigatória para o ranking funcionar):
//  1. Acesse https://console.firebase.google.com
//  2. Crie um projeto (nome livre)
//  3. Vá em "Realtime Database" > "Criar banco de dados" > modo teste
//  4. Em "Regras", cole: {"rules":{".read":true,".write":true}}
//  5. Copie a URL do banco (ex: https://meu-jogo-abc12-default-rtdb.firebaseio.com)
//  6. Cole abaixo substituindo o valor de FIREBASE_URL
//
const FIREBASE_URL = "https://SEU-PROJETO-default-rtdb.firebaseio.com";
const _GDB = "ff1"; // versão do banco — mude para resetar

// ── Estado global ─────────────────────────────────────────────
window._gUser   = null;
window._gOnline = false;

// ── Utilitários ───────────────────────────────────────────────
function _gHash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

async function _fb(path, method = "GET", data) {
  try {
    const r = await fetch(`${FIREBASE_URL}/${_GDB}/${path}.json`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: data !== undefined ? JSON.stringify(data) : undefined
    });
    return r.ok ? r.json() : null;
  } catch { return null; }
}

function _gDiff(score) {
  if (score >= 400) return { label: "Impossível", emoji: "👻", color: "#e040fb" };
  if (score >= 240) return { label: "Difícil",    emoji: "💀", color: "#ef5350" };
  if (score >= 80)  return { label: "Médio",      emoji: "😤", color: "#ff9800" };
  return                   { label: "Fácil",      emoji: "😊", color: "#66bb6a" };
}

// ── Init — restaura sessão salva ──────────────────────────────
function _gInit() {
  // Carrega fonte pixel
  if (!document.getElementById("g-font")) {
    const l = document.createElement("link");
    l.id   = "g-font"; l.rel  = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";
    document.head.appendChild(l);
  }
  try {
    const s = JSON.parse(localStorage.getItem("ff_gsession") || "null");
    if (s?.username) { window._gUser = s; window._gOnline = true; }
  } catch {}
  _gUpdateMenu();
}

// ── Atualiza botões do menu ───────────────────────────────────
function _gUpdateMenu() {
  const loginBtn  = document.getElementById("g-btn-login");
  const friendBtn = document.getElementById("g-btn-friends");
  const userTag   = document.getElementById("g-user-tag");

  if (window._gUser) {
    if (loginBtn)  loginBtn.style.display  = "none";
    if (friendBtn) friendBtn.style.display = "flex";
    if (userTag) {
      userTag.style.display  = "block";
      userTag.textContent    = "👤 " + window._gUser.username;
    }
  } else {
    if (loginBtn)  loginBtn.style.display  = "flex";
    if (friendBtn) friendBtn.style.display = "none";
    if (userTag)   userTag.style.display   = "none";
  }
}

// ── Login / Registro ──────────────────────────────────────────
async function globalLogin(username, password) {
  username = (username || "").trim();
  if (username.length < 2 || username.length > 20)
    return { ok: false, msg: "Nome: 2-20 caracteres." };
  if (!/^[a-zA-Z0-9_]+$/.test(username))
    return { ok: false, msg: "Use letras, números e _ apenas." };
  if ((password || "").length < 4)
    return { ok: false, msg: "Senha: mínimo 4 caracteres." };

  const hash     = _gHash(password);
  const existing = await _fb("users/" + username);

  if (existing === null) {
    // Novo usuário
    const user = {
      username, password: hash, score: 0,
      skin: "Burger", biome: "🌾 Campo", difficulty: "Fácil",
      friends: [], createdAt: Date.now()
    };
    const res = await _fb("users/" + username, "PUT", user);
    if (res === null) return { ok: false, msg: "Sem conexão. Verifique o Firebase." };
    window._gUser = user;
    window._gOnline = true;
    localStorage.setItem("ff_gsession", JSON.stringify(window._gUser));
    _gUpdateMenu();
    return { ok: true, isNew: true };
  } else {
    if (existing.password !== hash) return { ok: false, msg: "Senha incorreta." };
    window._gUser = { ...existing, username };
    window._gOnline = true;
    localStorage.setItem("ff_gsession", JSON.stringify(window._gUser));
    _gUpdateMenu();
    return { ok: true, isNew: false };
  }
}
window.globalLogin = globalLogin;

function globalLogout() {
  window._gUser = null; window._gOnline = false;
  localStorage.removeItem("ff_gsession");
  _gUpdateMenu();
  const fs = document.getElementById("g-friends-screen");
  if (fs) fs.style.display = "none";
  showCenterNotif("👤 Desconectado", "#aaa", 14, 60);
}
window.globalLogout = globalLogout;

// ── Salvar score global ───────────────────────────────────────
async function globalSaveScore(score) {
  if (!window._gUser || !window._gOnline || score <= 0) return;
  if (score <= (window._gUser.score || 0)) return;

  const bi   = getBiomeIndex();
  const diff = _gDiff(score);
  const data = {
    name: window._gUser.username, score,
    skin: state.currentSkin || "Burger",
    biome: BIOMES[bi]?.name || "?",
    difficulty: diff.label,
    updatedAt: Date.now()
  };

  await Promise.all([
    _fb("scores/" + window._gUser.username, "PUT", data),
    _fb("users/" + window._gUser.username + "/score",      "PUT", score),
    _fb("users/" + window._gUser.username + "/skin",       "PUT", data.skin),
    _fb("users/" + window._gUser.username + "/biome",      "PUT", data.biome),
    _fb("users/" + window._gUser.username + "/difficulty", "PUT", diff.label)
  ]);

  window._gUser.score = score;
  localStorage.setItem("ff_gsession", JSON.stringify(window._gUser));
}
window.globalSaveScore = globalSaveScore;

// ── Buscar ranking ────────────────────────────────────────────
async function _gGetRanking(filter = "Todos") {
  const data = await _fb("scores");
  if (!data) return null;
  let list = Object.values(data).sort((a, b) => b.score - a.score);
  if (filter !== "Todos") list = list.filter(s => s.difficulty === filter);
  return list.slice(0, 100);
}

// ── Amigos ────────────────────────────────────────────────────
async function _gAddFriend(fname) {
  fname = (fname || "").trim();
  if (!window._gUser)        return { ok: false, msg: "Faça login primeiro." };
  if (fname.length < 2)      return { ok: false, msg: "Nome inválido." };
  if (fname === window._gUser.username) return { ok: false, msg: "Você não pode se adicionar." };

  const exists = await _fb("users/" + fname);
  if (!exists) return { ok: false, msg: "Usuário não encontrado." };

  const user    = await _fb("users/" + window._gUser.username);
  const rawF    = user?.friends || [];
  const friends = Array.isArray(rawF) ? rawF : Object.values(rawF);
  if (friends.includes(fname)) return { ok: false, msg: "Já é seu amigo!" };

  const updated = [...friends, fname];
  await _fb("users/" + window._gUser.username + "/friends", "PUT", updated);
  window._gUser.friends = updated;
  localStorage.setItem("ff_gsession", JSON.stringify(window._gUser));
  return { ok: true };
}

async function _gGetFriends() {
  if (!window._gUser) return [];
  const user = await _fb("users/" + window._gUser.username);
  const rawF = user?.friends;
  if (!rawF) return [];
  const names = Array.isArray(rawF) ? rawF : Object.values(rawF);

  const list = await Promise.all(names.map(async n => {
    const s = await _fb("scores/" + n);
    return {
      name: n, score: s?.score || 0, skin: s?.skin || "Burger",
      difficulty: s?.difficulty || "—", biome: s?.biome || "—"
    };
  }));
  return list.sort((a, b) => b.score - a.score);
}

// ── Tela de Login ─────────────────────────────────────────────
function showLoginScreen() {
  let el = document.getElementById("g-login-screen");
  if (!el) {
    el = document.createElement("div");
    el.id = "g-login-screen";
    el.style.cssText = `
      position:fixed;inset:0;z-index:9000;
      background:rgba(0,0,0,0.93);
      display:flex;align-items:center;justify-content:center;
      font-family:'Press Start 2P',monospace,Arial;
    `;
    document.body.appendChild(el);
    el.addEventListener("keydown", e => {
      if (e.key === "Enter") _gDoLogin();
    });
  }
  el.style.display = "flex";
  el.innerHTML = `
    <div style="
      background:#111;border-radius:16px;padding:28px 22px 22px;
      width:min(340px,88vw);text-align:center;position:relative;
      border:2px solid #222;box-shadow:0 10px 40px rgba(0,0,0,.9);
    ">
      <button onclick="document.getElementById('g-login-screen').style.display='none'"
        style="position:absolute;top:10px;left:12px;background:none;border:none;
               color:rgba(255,255,255,.4);font-size:20px;cursor:pointer;line-height:1">✕</button>
      <div style="font-size:10px;color:rgba(255,255,255,.55);margin-bottom:22px;
                  line-height:1.9;padding:0 8px">
        Crie sua conta ou entre para jogar!
      </div>
      <input id="g-li-user" type="text" maxlength="20"
        placeholder="Seu nome (2-20 car"
        autocomplete="off"
        style="width:100%;box-sizing:border-box;background:#1a1a1a;border:none;
               border-radius:10px;color:white;caret-color:#d946a8;outline:none;
               font-family:'Press Start 2P',monospace;font-size:8px;
               padding:15px 14px;margin-bottom:10px"/>
      <input id="g-li-pass" type="password" maxlength="32"
        placeholder="Senha (mín. 4 char"
        style="width:100%;box-sizing:border-box;background:#1a1a1a;border:none;
               border-radius:10px;color:white;caret-color:#d946a8;outline:none;
               font-family:'Press Start 2P',monospace;font-size:8px;
               padding:15px 14px;margin-bottom:18px"/>
      <button id="g-li-btn" onclick="_gDoLogin()"
        style="width:100%;background:#d946a8;border:none;border-radius:10px;
               color:white;font-family:'Press Start 2P',monospace;font-size:11px;
               padding:16px;cursor:pointer;letter-spacing:1px;
               box-shadow:0 4px 0 #9d1d76;transition:filter .1s">
        ENTRAR
      </button>
      <div id="g-li-msg"
        style="margin-top:12px;font-size:7px;color:rgba(255,255,255,.35);
               line-height:2;padding:0 4px">
        Nome novo cria conta. O nome existente exige uma senha.
      </div>
    </div>`;
}
window.showLoginScreen = showLoginScreen;

async function _gDoLogin() {
  const btn  = document.getElementById("g-li-btn");
  const msg  = document.getElementById("g-li-msg");
  const user = document.getElementById("g-li-user")?.value;
  const pass = document.getElementById("g-li-pass")?.value;

  if (btn) { btn.textContent = "..."; btn.disabled = true; }

  const res = await globalLogin(user, pass);

  if (btn) { btn.textContent = "ENTRAR"; btn.disabled = false; }

  if (!res.ok) {
    if (msg) { msg.style.color = "#ef5350"; msg.textContent = res.msg; }
    return;
  }

  document.getElementById("g-login-screen").style.display = "none";
  showCenterNotif(
    (res.isNew ? "✅ Conta criada! Olá, " : "👤 Bem-vindo, ") + window._gUser.username + "!",
    "#d946a8", 14, 120
  );
  playNote(700, "sine", 0.15);
  _gUpdateMenu();
  // Se o login foi aberto ao tentar jogar, inicia o jogo agora
  if (window._gLoginThenPlay) {
    window._gLoginThenPlay = false;
    setTimeout(() => startGame(), 300);
  }
}
window._gDoLogin = _gDoLogin;

// ── Tela de Ranking Global ────────────────────────────────────
const _FILTERS   = ["Todos","Fácil","Médio","Difícil","Impossível"];
const _DEMOJI    = { "Fácil":"😊","Médio":"😤","Difícil":"💀","Impossível":"👻" };
const _DCOLOR    = { "Fácil":"#66bb6a","Médio":"#ff9800","Difícil":"#ef5350","Impossível":"#e040fb" };
let   _rankTab   = "Todos";

async function showRankingScreen() {
  let el = document.getElementById("g-rank-screen");
  if (!el) {
    el = document.createElement("div");
    el.id = "g-rank-screen";
    el.style.cssText = `
      position:fixed;inset:0;z-index:9000;background:#0d0d0d;
      display:flex;flex-direction:column;overflow:hidden;
      font-family:'Press Start 2P',monospace,Arial;
    `;
    document.body.appendChild(el);
  }
  _rankTab = "Todos";
  el.style.display = "flex";
  _gRenderRanking(el);
}
window.showRankingScreen = showRankingScreen;

async function _gRenderRanking(el) {
  const tabs = _FILTERS.map(f => `
    <button onclick="window._gRankTab('${f}')" id="rtab-${f}"
      style="padding:7px 8px;border:none;border-radius:8px;cursor:pointer;white-space:nowrap;
             font-family:'Press Start 2P',monospace;font-size:6px;letter-spacing:.3px;
             background:${_rankTab===f?"#d946a8":"rgba(255,255,255,.08)"};
             color:${_rankTab===f?"white":"rgba(255,255,255,.45)"};transition:all .15s">
      ${f==="Todos"?f:(_DEMOJI[f]||"")+" "+f}
    </button>`).join("");

  el.innerHTML = `
    <div style="display:flex;align-items:center;padding:14px 14px 10px;flex-shrink:0;
                border-bottom:1px solid rgba(255,255,255,.07);background:#0d0d0d">
      <button onclick="document.getElementById('g-rank-screen').style.display='none'"
        style="background:rgba(255,255,255,.1);border:none;border-radius:8px;
               color:white;font-size:16px;padding:8px 12px;cursor:pointer;margin-right:12px">✕</button>
      <span style="color:white;font-size:10px;letter-spacing:1px">⊕ RANKING GLOBAL</span>
    </div>
    <div style="display:flex;gap:5px;padding:8px 12px;flex-shrink:0;flex-wrap:wrap;
                border-bottom:1px solid rgba(255,255,255,.05)">${tabs}</div>
    <div id="g-rank-list" style="flex:1;overflow-y:auto;padding:8px 10px">
      <div style="text-align:center;padding:40px;color:rgba(255,255,255,.3);font-size:8px">
        Carregando...
      </div>
    </div>`;

  window._gRankTab = async f => {
    _rankTab = f;
    _FILTERS.forEach(tab => {
      const b = document.getElementById("rtab-" + tab);
      if (b) { b.style.background = tab===f?"#d946a8":"rgba(255,255,255,.08)";
               b.style.color      = tab===f?"white":"rgba(255,255,255,.45)"; }
    });
    const list = document.getElementById("g-rank-list");
    if (list) list.innerHTML = `<div style="text-align:center;padding:40px;color:rgba(255,255,255,.3);font-size:8px">Carregando...</div>`;
    _gFillRankList(await _gGetRanking(f));
  };

  _gFillRankList(await _gGetRanking("Todos"));
}

function _gFillRankList(scores) {
  const el = document.getElementById("g-rank-list");
  if (!el) return;
  if (scores === null) {
    el.innerHTML = `<div style="text-align:center;padding:40px;color:#ef5350;font-size:8px;line-height:2.5">
      Sem conexão.<br><span style="color:rgba(255,255,255,.25)">Configure o FIREBASE_URL no game.js</span></div>`;
    return;
  }
  if (!scores.length) {
    el.innerHTML = `<div style="text-align:center;padding:40px;color:rgba(255,255,255,.3);font-size:8px">Nenhum resultado.</div>`;
    return;
  }
  const medals = ["🥇","🥈","🥉"];
  el.innerHTML = scores.map((s, i) => {
    const isMe = window._gUser && s.name === window._gUser.username;
    const dc   = _DCOLOR[s.difficulty] || "#aaa";
    const de   = _DEMOJI[s.difficulty] || "•";
    const skin = SKINS[s.skin]?.emoji || "🍔";
    const rank = i < 3
      ? `<span style="font-size:18px">${medals[i]}</span>`
      : `<span style="font-size:8px;color:rgba(255,255,255,.35)">#${i+1}</span>`;
    return `
      <div style="display:flex;align-items:center;gap:10px;
                  padding:10px 12px;border-radius:10px;margin-bottom:4px;
                  background:${isMe?"rgba(217,70,168,.18)":"rgba(255,255,255,.04)"};
                  border:1px solid ${isMe?"rgba(217,70,168,.5)":"rgba(255,255,255,.06)"}">
        <div style="min-width:28px;text-align:center">${rank}</div>
        <span style="font-size:20px">${skin}</span>
        <div style="flex:1;min-width:0">
          <div style="color:${isMe?"#d946a8":"white"};font-size:8px;
                      overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${s.name}${isMe?" (você)":""}
          </div>
          <div style="color:${dc};font-size:6px;margin-top:4px">${de} ${s.difficulty}</div>
        </div>
        <span style="color:#f1c40f;font-size:10px;flex-shrink:0">${s.score}</span>
      </div>`;
  }).join("");
}

// ── Tela de Amigos ────────────────────────────────────────────
async function showFriendsScreen() {
  if (!window._gUser) { showLoginScreen(); return; }

  let el = document.getElementById("g-friends-screen");
  if (!el) {
    el = document.createElement("div");
    el.id = "g-friends-screen";
    el.style.cssText = `
      position:fixed;inset:0;z-index:9000;background:#0d0d0d;
      display:flex;flex-direction:column;overflow:hidden;
      font-family:'Press Start 2P',monospace,Arial;
    `;
    document.body.appendChild(el);
  }
  el.style.display = "flex";
  _gRenderFriends(el);
}
window.showFriendsScreen = showFriendsScreen;

async function _gRenderFriends(el) {
  el.innerHTML = `
    <div style="display:flex;align-items:center;padding:14px 14px 10px;flex-shrink:0;
                border-bottom:1px solid rgba(255,255,255,.07);background:#0d0d0d">
      <button onclick="document.getElementById('g-friends-screen').style.display='none'"
        style="background:rgba(255,255,255,.1);border:none;border-radius:8px;
               color:white;font-size:16px;padding:8px 12px;cursor:pointer;margin-right:12px">✕</button>
      <div>
        <div style="color:white;font-size:10px;letter-spacing:1px">👤 AMIGOS</div>
        <div style="color:rgba(255,255,255,.35);font-size:6px;margin-top:5px">
          Seu nome: ${window._gUser.username}
        </div>
      </div>
      <button onclick="globalLogout()"
        style="margin-left:auto;background:rgba(255,255,255,.07);
               border:1px solid rgba(255,255,255,.12);border-radius:8px;
               color:rgba(255,255,255,.45);font-family:'Press Start 2P',monospace;
               font-size:6px;padding:8px 10px;cursor:pointer">
        SAIR
      </button>
    </div>
    <div style="display:flex;gap:8px;padding:10px 12px;flex-shrink:0;
                border-bottom:1px solid rgba(255,255,255,.05)">
      <input id="g-fr-inp" type="text" maxlength="20" placeholder="Nome do amigo..."
        autocomplete="off"
        style="flex:1;background:rgba(255,255,255,.08);border:none;border-radius:10px;
               color:white;font-family:'Press Start 2P',monospace;font-size:7px;
               padding:12px 14px;outline:none;caret-color:#d946a8"/>
      <button id="g-fr-btn" onclick="window._gDoAddFriend()"
        style="background:#d946a8;border:none;border-radius:10px;
               color:white;font-size:20px;padding:8px 14px;cursor:pointer;
               box-shadow:0 3px 0 #9d1d76">
        👤+
      </button>
    </div>
    <div id="g-fr-msg" style="padding:5px 14px;font-size:6px;color:transparent;min-height:18px"></div>
    <div id="g-fr-list" style="flex:1;overflow-y:auto;padding:4px 10px">
      <div style="text-align:center;padding:30px;color:rgba(255,255,255,.3);font-size:8px">
        Carregando...
      </div>
    </div>`;

  document.getElementById("g-fr-inp")?.addEventListener("keydown", e => {
    if (e.key === "Enter") window._gDoAddFriend();
  });

  window._gDoAddFriend = async () => {
    const inp = document.getElementById("g-fr-inp");
    const msg = document.getElementById("g-fr-msg");
    const btn = document.getElementById("g-fr-btn");
    if (btn) btn.textContent = "...";
    const res = await _gAddFriend(inp?.value);
    if (btn) btn.textContent = "👤+";
    if (!res.ok) {
      if (msg) { msg.style.color = "#ef5350"; msg.textContent = res.msg; }
      return;
    }
    if (inp) inp.value = "";
    if (msg) { msg.style.color = "#66bb6a"; msg.textContent = "✓ Adicionado!"; }
    _gLoadFriends();
  };

  _gLoadFriends();
}

async function _gLoadFriends() {
  const el = document.getElementById("g-fr-list");
  if (!el) return;
  const friends = await _gGetFriends();

  if (!friends.length) {
    el.innerHTML = `
      <div style="text-align:center;padding:30px;
                  color:rgba(255,255,255,.25);font-size:7px;line-height:2.5">
        Sem amigos ainda.<br>Busque pelo nome acima!
      </div>`;
    return;
  }

  el.innerHTML = friends.map(f => {
    const skin = SKINS[f.skin]?.emoji || "🍔";
    const dc   = _DCOLOR[f.difficulty] || "rgba(255,255,255,.35)";
    const de   = _DEMOJI[f.difficulty] || "";
    return `
      <div style="display:flex;align-items:center;gap:12px;
                  padding:12px 14px;border-radius:12px;margin-bottom:6px;
                  background:rgba(255,255,255,.05);
                  border:1px solid rgba(255,255,255,.07)">
        <div style="width:44px;height:44px;border-radius:50%;flex-shrink:0;
                    background:rgba(255,255,255,.08);
                    display:flex;align-items:center;justify-content:center;font-size:22px">
          ${skin}
        </div>
        <div style="flex:1;min-width:0">
          <div style="color:white;font-size:8px;overflow:hidden;
                      text-overflow:ellipsis;white-space:nowrap">${f.name}</div>
          <div style="color:${dc};font-size:6px;margin-top:4px">${de} ${f.difficulty}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="color:#f1c40f;font-size:10px">${f.score}</div>
          <div style="color:rgba(255,255,255,.3);font-size:6px;margin-top:2px">pts</div>
        </div>
      </div>`;
  }).join("");
}

// ============================================================
// FIM — Flappy Food v5.0 + Céu ☁️
// ============================================================
