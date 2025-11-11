<<<<<<< HEAD
import { StyleSheet, Platform } from "react-native";
import { Parser } from "expr-eval"; // npm install expr-eval
import tinycolor from "tinycolor2"; // npm install tinycolor2

// === 🔧 Utilidades básicas ===
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

const darken = (color, amount = 0.1) =>
  tinycolor(color).darken(amount * 100).toHexString();

const lighten = (color, amount = 0.1) =>
  tinycolor(color).lighten(amount * 100).toHexString();

const opacity = (color, alpha = 1) =>
  tinycolor(color).setAlpha(alpha).toRgbString();

// === 🧮 Evaluador seguro de expresiones ===
const safeEval = (expr) => {
  try {
    return Parser.evaluate(expr);
  } catch {
    return expr;
  }
};

// === 🧠 Resolver de contexto ===
export function resolveContext(path, ctx) {
  if (typeof path !== "string") return path;
  const parts = path.split(".");
  return parts.reduce((acc, key) => (acc && key in acc ? acc[key] : undefined), ctx);
}

// === 🧩 Parser de argumentos ===
function parseArgs(argString) {
  if (!argString) return [];
  try {
    // Divide por comas que no estén dentro de paréntesis
    return argString
      .split(/,(?![^(]*\))/)
      .map((a) => a.trim())
      .filter(Boolean);
  } catch {
    return [argString];
  }
}

// === 🧬 Resolvers por defecto ===
export const defaultResolvers = {
  if: (ctx, cond, thenVal, elseVal) =>
    resolveDynamic(cond, ctx) ? parseValue(thenVal, ctx) : parseValue(elseVal, ctx),

  not: (ctx, val) => !resolveDynamic(val, ctx),

  exists: (ctx, path, thenVal, elseVal) =>
    resolveContext(path, ctx) !== undefined
      ? parseValue(thenVal, ctx)
      : parseValue(elseVal, ctx),

  calc: (ctx, expr) => safeEval(expr),

  darken: (ctx, color, amt) =>
    darken(resolveDynamic(color, ctx), parseFloat(amt)),

  lighten: (ctx, color, amt) =>
    lighten(resolveDynamic(color, ctx), parseFloat(amt)),

  opacity: (ctx, color, alpha) =>
    opacity(resolveDynamic(color, ctx), parseFloat(alpha)),

  clamp: (ctx, min, val, max) =>
    clamp(resolveDynamic(val, ctx), parseFloat(min), parseFloat(max)),

  var: (ctx, key) => resolveContext(`vars.${key}`, ctx),

  env: (ctx, name) => process.env?.[name],

  rand: (ctx, min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + parseFloat(min),

  percent: (ctx, val, total) =>
    (parseFloat(val) / 100) * parseFloat(total),

  concat: (ctx, ...args) =>
    args.map((a) => resolveDynamic(a, ctx)).join(""),

  json: (ctx, str) => {
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  },

  platform: (ctx, iosVal, androidVal) =>
    Platform.OS === "ios" ? iosVal : androidVal,
};

// === 🧩 Motor de parseo dinámico ===
export function resolveDynamic(value, ctx, resolvers = defaultResolvers) {
  if (typeof value !== "string") return value;

  // Coincide con @func(args) o @obj.prop
  const match = value.match(/^@([a-zA-Z0-9_]+)(\((.*)\)|\.([a-zA-Z0-9_]+))$/);
  if (!match) return value;

  const [, name, , funcArgs, prop] = match;

  // Caso: variable / propiedad
  if (prop) {
    const fullPath = `${name}.${prop}`;
    return resolveContext(fullPath, ctx);
  }

  // Caso: función
  if (funcArgs !== undefined) {
    const args = parseArgs(funcArgs);
    const resolvedArgs = args.map((a) => parseValue(a, ctx, resolvers));

    if (resolvers[name]) {
      return resolvers[name](ctx, ...resolvedArgs);
    } else {
      console.warn(`⚠️ Resolver '${name}' no encontrado`);
      return value;
    }
  }

  return value;
}

// === 🔍 Parser general ===
export function parseValue(value, ctx, resolvers = defaultResolvers) {
  if (Array.isArray(value)) {
    return value.map((v) => parseValue(v, ctx, resolvers));
  }
  if (value && typeof value === "object") {
    const result = {};
    for (const k in value) {
      result[k] = parseValue(value[k], ctx, resolvers);
    }
    return result;
  }
  return resolveDynamic(value, ctx, resolvers);
}


// === 🧩 Merge profundo (para herencia) ===
function mergeDeep(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (
      source[key] instanceof Object &&
      !(source[key] instanceof Array) &&
      key in target
    ) {
      result[key] = mergeDeep(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// === 🎨 Creación de StyleSheet dinámico con caché ===
const styleCache = new WeakMap();

export function createDynamicStyleSheet(
  styleJSON,
  context = {},
  resolvers = defaultResolvers
) {
  if (styleCache.has(styleJSON)) return styleCache.get(styleJSON);

  const evaluatedStyles = {};

  for (const key in styleJSON) {
    const styleObj = styleJSON[key];

    // Herencia
    let baseStyle = {};
    if (styleObj["@extends"]) {
      const baseKey = styleObj["@extends"];
      if (styleJSON[baseKey]) baseStyle = styleJSON[baseKey];
    }

    evaluatedStyles[key] = {};
    for (const prop in styleObj) {
      if (prop === "@extends") continue;
      const rawValue = styleObj[prop];
      evaluatedStyles[key][prop] = parseValue(rawValue, context, resolvers);
    }

    evaluatedStyles[key] = mergeDeep(baseStyle, evaluatedStyles[key]);
  }

  const sheet = StyleSheet.create(evaluatedStyles);
  styleCache.set(styleJSON, sheet);
  return sheet;
}

// === 🧠 Registro dinámico de resolvers ===
export function registerResolver(name, fn) {
  defaultResolvers[name] = fn;
}
=======
import { StyleSheet, Platform } from "react-native";
import { evaluate } from "mathjs";
import tinycolor from "tinycolor2"; // npm install tinycolor2

// === 🔧 Utilidades básicas ===
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

const darken = (color, amount = 0.1) =>
  tinycolor(color).darken(amount * 100).toHexString();

const lighten = (color, amount = 0.1) =>
  tinycolor(color).lighten(amount * 100).toHexString();

const opacity = (color, alpha = 1) =>
  tinycolor(color).setAlpha(alpha).toRgbString();

// === 🧮 Evaluador seguro de expresiones ===
const safeEval = (expr) => {
  try {
    return evaluate(expr);
  } catch {
    return expr;
  }
};

// === 🧠 Resolver de contexto ===
export function resolveContext(path, ctx) {
  if (typeof path !== "string") return path;
  const parts = path.split(".");
  return parts.reduce((acc, key) => (acc && key in acc ? acc[key] : undefined), ctx);
}

// === 🧩 Parser de argumentos ===
function parseArgs(argString) {
  if (!argString) return [];
  try {
    // Divide por comas que no estén dentro de paréntesis
    return argString
      .split(/,(?![^(]*\))/)
      .map((a) => a.trim())
      .filter(Boolean);
  } catch {
    return [argString];
  }
}

// === 🧬 Resolvers por defecto ===
export const defaultResolvers = {
  // === 🔹 Lógicos y condicionales ===
  if: (ctx, cond, thenVal, elseVal) =>
    resolveDynamic(cond, ctx) ? parseValue(thenVal, ctx) : parseValue(elseVal, ctx),

  not: (ctx, val) => !resolveDynamic(val, ctx),

  exists: (ctx, path, thenVal, elseVal) =>
    resolveContext(path, ctx) !== undefined
      ? parseValue(thenVal, ctx)
      : parseValue(elseVal, ctx),

  // === 🔹 Matemáticos / numéricos ===
  calc: (ctx, expr) => safeEval(expr),

  clamp: (ctx, min, val, max) =>
    clamp(resolveDynamic(val, ctx), parseFloat(min), parseFloat(max)),

  rand: (ctx, min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + parseFloat(min),

  percent: (ctx, val, total) =>
    (parseFloat(val) / 100) * parseFloat(total),

  add: (ctx, ...args) =>
    args.map(a => parseFloat(resolveDynamic(a, ctx)) || 0).reduce((a, b) => a + b, 0),

  sub: (ctx, a, b) =>
    parseFloat(resolveDynamic(a, ctx)) - parseFloat(resolveDynamic(b, ctx)),

  mul: (ctx, a, b) =>
    parseFloat(resolveDynamic(a, ctx)) * parseFloat(resolveDynamic(b, ctx)),

  div: (ctx, a, b) =>
    parseFloat(resolveDynamic(a, ctx)) / parseFloat(resolveDynamic(b, ctx)),

  round: (ctx, val, decimals = 0) => {
    const num = parseFloat(resolveDynamic(val, ctx));
    const pow = Math.pow(10, parseInt(decimals));
    return Math.round(num * pow) / pow;
  },

  // === 🎨 Colores ===
  darken: (ctx, color, amt) =>
    darken(resolveDynamic(color, ctx), parseFloat(amt)),

  lighten: (ctx, color, amt) =>
    lighten(resolveDynamic(color, ctx), parseFloat(amt)),

  opacity: (ctx, color, alpha) =>
    opacity(resolveDynamic(color, ctx), parseFloat(alpha)),

  mix: (ctx, c1, c2, ratio = 0.5) => {
    const color1 = tinycolor(resolveDynamic(c1, ctx));
    const color2 = tinycolor(resolveDynamic(c2, ctx));
    return tinycolor.mix(color1, color2, ratio * 100).toHexString();
  },

  // === 🧠 Variables, entorno y contexto ===
  var: (ctx, key) => resolveContext(`${key}`, ctx),

  env: (ctx, name) => process.env?.[name],

  json: (ctx, str) => {
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  },

  // === 💬 Strings ===
  concat: (ctx, ...args) =>
    args.map(a => resolveDynamic(a, ctx)).join(""),

  uppercase: (ctx, val) =>
    String(resolveDynamic(val, ctx)).toUpperCase(),

  lowercase: (ctx, val) =>
    String(resolveDynamic(val, ctx)).toLowerCase(),

  replace: (ctx, str, search, replaceVal) =>
    String(resolveDynamic(str, ctx)).replaceAll(
      resolveDynamic(search, ctx),
      resolveDynamic(replaceVal, ctx)
    ),

  // === 🖥️ Plataforma y entorno ===
  platform: (ctx, iosVal, androidVal, otherVal) => {
    if (Platform.OS === "ios") return parseValue(iosVal, ctx);
    if (Platform.OS === "android") return parseValue(androidVal, ctx);
    return parseValue(otherVal, ctx);
  },

  device: (ctx) => Platform.OS,

  // === 🧩 Comparaciones y lógica avanzada ===
  eq: (ctx, a, b) => resolveDynamic(a, ctx) == resolveDynamic(b, ctx),
  neq: (ctx, a, b) => resolveDynamic(a, ctx) != resolveDynamic(b, ctx),
  gt: (ctx, a, b) => parseFloat(resolveDynamic(a, ctx)) > parseFloat(resolveDynamic(b, ctx)),
  lt: (ctx, a, b) => parseFloat(resolveDynamic(a, ctx)) < parseFloat(resolveDynamic(b, ctx)),
  gte: (ctx, a, b) => parseFloat(resolveDynamic(a, ctx)) >= parseFloat(resolveDynamic(b, ctx)),
  lte: (ctx, a, b) => parseFloat(resolveDynamic(a, ctx)) <= parseFloat(resolveDynamic(b, ctx)),

  // === 🌓 Tema (light/dark) ===
  theme: (ctx, key, fallback) => {
    const val = resolveContext(`theme.${key}`, ctx);
    return val !== undefined ? val : fallback;
  },

  prefersDark: (ctx, darkVal, lightVal) => {
    const mode = resolveContext("theme.mode", ctx);
    return mode === "dark"
      ? parseValue(darkVal, ctx)
      : parseValue(lightVal, ctx);
  },

  // === ⏱️ Tiempo / fechas ===
  now: () => Date.now(),
  date: (ctx, format) => {
    const d = new Date();
    if (!format) return d.toISOString();
    return format
      .replace("YYYY", d.getFullYear())
      .replace("MM", String(d.getMonth() + 1).padStart(2, "0"))
      .replace("DD", String(d.getDate()).padStart(2, "0"));
  },
};


// === 🧩 Motor de parseo dinámico ===
export function resolveDynamic(value, ctx, resolvers = defaultResolvers) {
  if (typeof value !== "string") return value;

  // Coincide con @func(args) o @obj.prop
  const match = value.match(/^@([a-zA-Z0-9_]+)(\((.*)\)|\.([a-zA-Z0-9_]+)|)$/);
  if (!match) return value;

  const [, name, , funcArgs, prop] = match;
  // Caso: variable / propiedad
  if (prop) {
    const fullPath = `${name}.${prop}`;
    return resolveContext(fullPath, ctx);
  }

  // Caso: función
  if (funcArgs !== undefined) {
    const args = parseArgs(funcArgs);
    const resolvedArgs = args.map((a) => parseValue(a, ctx, resolvers));

    if (resolvers[name]) {
      return resolvers[name](ctx, ...resolvedArgs);
    } else {
      console.warn(`⚠️ Resolver '${name}' no encontrado`);
      return value;
    }
  }

  return resolvers["var"](ctx, name);
}

// === 🔍 Parser general ===
export function parseValue(value, ctx, resolvers = defaultResolvers) {
  if (Array.isArray(value)) {
    return value.map((v) => parseValue(v, ctx, resolvers));
  }
  if (value && typeof value === "object") {
    const result = {};
    for (const k in value) {
      result[k] = parseValue(value[k], ctx, resolvers);
    }
    return result;
  }
  return resolveDynamic(value, ctx, resolvers);
}


// === 🧩 Merge profundo (para herencia) ===
function mergeDeep(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (
      source[key] instanceof Object &&
      !(source[key] instanceof Array) &&
      key in target
    ) {
      result[key] = mergeDeep(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// === 🎨 Creación de StyleSheet dinámico ===
export function createDynamicStyleSheet(styleJSON, context) {
  const evaluatedStyles = {};
  for (const key in styleJSON) {
    const styleObj = styleJSON[key];
    let baseStyle = {};
    if (styleObj["@extends"]) {
      const baseKey = styleObj["@extends"];
      if (styleJSON[baseKey]) baseStyle = styleJSON[baseKey];
    }
    evaluatedStyles[key] = {};
    for (const prop in styleObj) {
      if (prop === "@extends") continue;
      evaluatedStyles[key][prop] = parseValue(styleObj[prop], context);
    }
    evaluatedStyles[key] = mergeDeep(baseStyle, evaluatedStyles[key]);
  }
  return StyleSheet.create(evaluatedStyles);
}


// === 🧠 Registro dinámico de resolvers ===
export function registerResolver(name, fn) {
  defaultResolvers[name] = fn;
}
>>>>>>> 06b7202 (First Commit)
