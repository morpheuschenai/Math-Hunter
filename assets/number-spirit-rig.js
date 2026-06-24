(function () {
  const NS = "http://www.w3.org/2000/svg";

  const PALETTE = {
    odd: { main: "#ff9b3d", deep: "#d76519", light: "#ffd36a", ink: "#171416" },
    even: { main: "#4f8df7", deep: "#235bc4", light: "#a8d8ff", ink: "#171416" },
    prime: { main: "#ad6cff", deep: "#6d37c9", light: "#ffd84d", ink: "#171416" },
    multi: { main: "#35bf6b", deep: "#1e7f47", light: "#beef69", ink: "#171416" },
    divide: { main: "#2bc7d9", deep: "#177b96", light: "#d2fbff", ink: "#171416" },
    chaos: { main: "#e83b6f", deep: "#6e1536", light: "#ffb1c9", ink: "#171416" }
  };

  const RIGS = {
    kiki: {
      name: "奇奇",
      role: "odd",
      bodyShape: "verticalBlob",
      face: "single",
      accessory: "sparkStem",
      motion: "hop",
      personality: "curious"
    },
    oo: {
      name: "偶偶",
      role: "even",
      bodyShape: "doubleOrb",
      face: "pair",
      accessory: "twinDots",
      motion: "wobble",
      personality: "calm"
    },
    prima: {
      name: "質寶",
      role: "prime",
      bodyShape: "starGem",
      face: "pair",
      accessory: "orbit",
      motion: "float",
      personality: "clever"
    },
    swapy: {
      name: "換換",
      role: "divide",
      bodyShape: "capsule",
      face: "pair",
      accessory: "arrows",
      motion: "tilt",
      personality: "mischief"
    },
    dubdragon: {
      name: "倍倍龍",
      role: "multi",
      bodyShape: "dragonBlob",
      face: "pair",
      accessory: "horns",
      motion: "spring",
      personality: "bold"
    },
    chaos: {
      name: "亂數魔王",
      role: "chaos",
      bodyShape: "block",
      face: "pair",
      accessory: "glitchCrown",
      motion: "shake",
      personality: "boss"
    }
  };

  const EXPRESSIONS = {
    idle: { brow: "soft", mouth: "smile", eye: "open", pupil: [0, 0] },
    think: { brow: "pinch", mouth: "smallO", eye: "side", pupil: [3, -1] },
    happy: { brow: "up", mouth: "laugh", eye: "happy", pupil: [0, 0] },
    attack: { brow: "focus", mouth: "shout", eye: "wide", pupil: [2, 0] },
    hurt: { brow: "sad", mouth: "wobble", eye: "squint", pupil: [-1, 1] },
    miss: { brow: "flat", mouth: "flat", eye: "side", pupil: [-3, 0] },
    surprise: { brow: "up", mouth: "bigO", eye: "wide", pupil: [0, 0] },
    enraged: { brow: "anger", mouth: "fang", eye: "wide", pupil: [0, 1] }
  };

  function el(name, attrs = {}, parent) {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    if (parent) parent.appendChild(node);
    return node;
  }

  function addPath(parent, d, attrs) {
    return el("path", { d, ...attrs }, parent);
  }

  function bodyPath(shape) {
    if (shape === "verticalBlob") return "M50 16 C70 16 80 36 74 59 C70 80 62 91 50 91 C38 91 30 80 26 59 C20 36 30 16 50 16 Z";
    if (shape === "doubleOrb") return "M26 48 C26 31 38 21 50 31 C62 21 74 31 74 48 C74 72 62 87 50 80 C38 87 26 72 26 48 Z";
    if (shape === "starGem") return "M50 10 L61 35 L88 38 L67 56 L73 85 L50 70 L27 85 L33 56 L12 38 L39 35 Z";
    if (shape === "capsule") return "M34 18 H66 C75 18 80 25 80 34 V72 C80 84 71 91 58 91 H42 C29 91 20 84 20 72 V34 C20 25 25 18 34 18 Z";
    if (shape === "dragonBlob") return "M25 54 C20 33 34 20 52 24 C72 20 84 36 77 58 C85 67 79 82 63 84 C53 96 34 89 32 74 C22 71 18 62 25 54 Z";
    return "M20 20 H80 V80 C80 87 73 91 63 88 L50 84 L37 88 C27 91 20 87 20 80 Z";
  }

  function addAccessory(g, rig, colors) {
    if (rig.accessory === "sparkStem") {
      addPath(g, "M50 18 C47 7 58 4 60 12", { class: "part accessory", fill: "none", stroke: colors.deep, "stroke-width": 6, "stroke-linecap": "round" });
      el("circle", { class: "part accessory", cx: 60, cy: 12, r: 6, fill: colors.light }, g);
    } else if (rig.accessory === "twinDots") {
      el("circle", { class: "part accessory", cx: 36, cy: 20, r: 5, fill: colors.light }, g);
      el("circle", { class: "part accessory", cx: 64, cy: 20, r: 5, fill: colors.light }, g);
    } else if (rig.accessory === "orbit") {
      el("ellipse", { class: "part accessory orbit", cx: 50, cy: 50, rx: 44, ry: 17, fill: "none", stroke: colors.light, "stroke-width": 4, opacity: .7 }, g);
    } else if (rig.accessory === "arrows") {
      addPath(g, "M22 52 L32 43 V49 H44 V55 H32 V61 Z M78 52 L68 43 V49 H56 V55 H68 V61 Z", { class: "part accessory", fill: colors.light, opacity: .9 });
    } else if (rig.accessory === "horns") {
      addPath(g, "M30 28 L22 9 L42 24 M70 28 L78 9 L58 24", { class: "part accessory", fill: "none", stroke: colors.deep, "stroke-width": 7, "stroke-linecap": "round", "stroke-linejoin": "round" });
    } else if (rig.accessory === "glitchCrown") {
      addPath(g, "M28 24 L36 8 L46 22 L55 6 L64 22 L74 8 L80 24", { class: "part accessory", fill: "none", stroke: colors.light, "stroke-width": 5, "stroke-linejoin": "round" });
    }
  }

  function addArms(g, colors) {
    addPath(g, "M28 58 C15 58 13 70 19 76", { class: "part arm arm-left", fill: "none", stroke: colors.deep, "stroke-width": 7, "stroke-linecap": "round" });
    addPath(g, "M72 58 C85 58 87 70 81 76", { class: "part arm arm-right", fill: "none", stroke: colors.deep, "stroke-width": 7, "stroke-linecap": "round" });
  }

  function addFace(g, rig, expr, colors) {
    const e = EXPRESSIONS[expr] || EXPRESSIONS.idle;
    const face = el("g", { class: `part face expr-${expr}` }, g);
    const eyeY = rig.face === "single" ? 48 : 46;
    const eyeR = e.eye === "wide" ? 13 : e.eye === "squint" ? 8 : 11;
    const eyeScaleY = e.eye === "happy" ? .32 : e.eye === "squint" ? .45 : 1;
    const eyes = rig.face === "single" ? [50] : [39, 61];

    eyes.forEach((x) => {
      el("ellipse", { class: "eye-white", cx: x, cy: eyeY, rx: eyeR, ry: eyeR * eyeScaleY, fill: "#fff" }, face);
      el("circle", { class: "pupil", cx: x + e.pupil[0], cy: eyeY + e.pupil[1], r: Math.max(3.8, eyeR * .42), fill: colors.ink }, face);
    });

    const browD = browPath(rig.face, e.brow);
    addPath(face, browD, { class: "brow", fill: "none", stroke: colors.ink, "stroke-width": 6.5, "stroke-linecap": "round" });

    const mouthAttrs = { class: "mouth", fill: "none", stroke: colors.ink, "stroke-width": 4.5, "stroke-linecap": "round", "stroke-linejoin": "round" };
    if (e.mouth === "smile") addPath(face, "M38 64 Q50 75 62 64", mouthAttrs);
    else if (e.mouth === "laugh") addPath(face, "M35 62 Q50 82 65 62 Q60 76 50 77 Q40 76 35 62 Z", { class: "mouth", fill: colors.ink });
    else if (e.mouth === "smallO") el("ellipse", { class: "mouth", cx: 50, cy: 66, rx: 5, ry: 7, fill: colors.ink }, face);
    else if (e.mouth === "bigO") el("ellipse", { class: "mouth", cx: 50, cy: 67, rx: 10, ry: 13, fill: colors.ink }, face);
    else if (e.mouth === "shout") addPath(face, "M36 63 H64 Q59 77 50 78 Q41 77 36 63 Z", { class: "mouth", fill: colors.ink });
    else if (e.mouth === "wobble") addPath(face, "M37 70 C43 63 48 76 54 68 C58 63 62 68 65 71", mouthAttrs);
    else if (e.mouth === "fang") addPath(face, "M34 62 Q50 75 66 62 L58 63 L55 72 L49 64 L43 72 L40 63 Z", { class: "mouth", fill: colors.ink });
    else addPath(face, "M38 68 H62", mouthAttrs);
  }

  function browPath(face, type) {
    if (face === "single") {
      if (type === "anger") return "M37 31 L63 38";
      if (type === "pinch") return "M38 35 C45 30 55 30 62 35";
      if (type === "up") return "M38 31 C45 25 55 25 62 31";
      if (type === "sad") return "M38 39 C45 32 55 32 62 39";
      return "M37 33 H63";
    }
    if (type === "anger") return "M28 33 L47 39 M72 33 L53 39";
    if (type === "focus") return "M29 36 L47 33 M71 36 L53 33";
    if (type === "pinch") return "M30 34 L46 36 M70 34 L54 36";
    if (type === "sad") return "M30 39 L46 34 M70 39 L54 34";
    if (type === "up") return "M30 31 L46 28 M70 31 L54 28";
    return "M30 33 H46 M54 33 H70";
  }

  function renderCharacter(container, options = {}) {
    const rig = RIGS[options.id] || RIGS.kiki;
    const expr = options.expression || "idle";
    const state = options.state || "normal";
    const colors = PALETTE[rig.role] || PALETTE.odd;
    const svg = el("svg", {
      viewBox: "0 0 100 100",
      role: "img",
      "aria-label": rig.name,
      class: `spirit-svg motion-${options.motion || rig.motion} state-${state} expr-${expr}`
    });
    const root = el("g", { class: "rig-root" }, svg);
    const shadow = el("ellipse", { class: "ground-shadow", cx: 50, cy: 91, rx: 25, ry: 5, fill: "#000", opacity: .12 }, root);
    const body = el("g", { class: "part body-group" }, root);
    addAccessory(body, rig, colors);
    addPath(body, bodyPath(rig.bodyShape), { class: "part body", fill: colors.main, stroke: colors.deep, "stroke-width": state === "normal" ? 0 : 3 });
    addArms(body, colors);
    addFace(body, rig, expr, colors);
    if (options.crowned) {
      addPath(body, "M32 20 L39 8 L48 18 L55 6 L63 18 L72 8 L78 20 Q55 28 32 20 Z", { class: "part crown", fill: "#ffd84d", stroke: "#be8d14", "stroke-width": 2, "stroke-linejoin": "round" });
    }
    if (container) {
      container.innerHTML = "";
      container.appendChild(svg);
    }
    return svg;
  }

  function renderLineup(container, options = {}) {
    container.innerHTML = "";
    Object.keys(RIGS).forEach((id) => {
      const card = document.createElement("button");
      card.className = "spirit-card";
      card.type = "button";
      card.dataset.id = id;
      const art = document.createElement("div");
      art.className = "spirit-art";
      renderCharacter(art, { id, expression: options.expression || "idle", state: options.state || "normal", motion: options.motion });
      const label = document.createElement("span");
      label.textContent = RIGS[id].name;
      card.append(art, label);
      container.appendChild(card);
    });
  }

  window.NumberSpiritRig = { RIGS, EXPRESSIONS, PALETTE, renderCharacter, renderLineup };
})();
