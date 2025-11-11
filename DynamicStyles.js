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
