// Inicio de sesión de las clientas. Patrones:
// · Strategy: cada forma de entrar (formulario, Google, Facebook) es una estrategia con el mismo método
//   autenticar(datos) → { proveedor, proveedorId, nombre, correo, foto }. El controlador no sabe cuál usa.
// · Factory: crearEstrategia('google') entrega la estrategia correcta.
// Las contraseñas se guardan con scrypt + sal (nunca en texto plano).
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';

const error = (mensaje, status = 400) => Object.assign(new Error(mensaje), { status });

export const Contrasenas = {
  crear(texto) {
    const sal = randomBytes(16).toString('hex');
    return `${sal}:${scryptSync(texto, sal, 64).toString('hex')}`;
  },
  verificar(texto, guardado = '') {
    const [sal, hash] = guardado.split(':');
    if (!sal || !hash) return false;
    const a = Buffer.from(hash, 'hex');
    const b = scryptSync(texto, sal, 64);
    return a.length === b.length && timingSafeEqual(a, b);
  }
};
export const hashToken = (t) => createHash('sha256').update(t).digest('hex');
export const nuevoToken = () => randomBytes(32).toString('base64url');

class EstrategiaFormulario {
  nombre = 'formulario';
  disponible() { return true; }
  // La verificación de la contraseña la hace el controlador con el usuario guardado
  async autenticar({ correo, contrasena }) {
    if (!/^\S+@\S+\.\S+$/.test(correo || '')) throw error('Escribe un correo válido.');
    if (!contrasena) throw error('Escribe tu contraseña.');
    return { proveedor: 'formulario', correo: correo.trim().toLowerCase(), contrasena };
  }
}

class EstrategiaGoogle {
  nombre = 'google';
  clientId = process.env.GOOGLE_CLIENT_ID || null;
  disponible() { return Boolean(this.clientId); }
  // El navegador entrega el "credential" (un JWT firmado por Google); Google lo valida aquí
  async autenticar({ credential }) {
    if (!this.disponible()) throw error('El inicio con Google no está configurado (falta GOOGLE_CLIENT_ID).', 503);
    if (!credential) throw error('Falta la respuesta de Google.');
    const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    const d = await r.json();
    if (!r.ok || d.aud !== this.clientId) throw error('Google no pudo confirmar tu cuenta. Intenta de nuevo.', 401);
    if (d.email_verified !== 'true' && d.email_verified !== true) throw error('Tu correo de Google no está verificado.', 401);
    return { proveedor: 'google', proveedorId: d.sub, nombre: d.name || d.email, correo: d.email?.toLowerCase(), foto: d.picture || null };
  }
}

class EstrategiaFacebook {
  nombre = 'facebook';
  appId = process.env.FACEBOOK_APP_ID || null;
  secreto = process.env.FACEBOOK_APP_SECRET || null;
  disponible() { return Boolean(this.appId && this.secreto); }
  // El navegador entrega el accessToken; se confirma que sea de nuestra app y se piden nombre y correo
  async autenticar({ accessToken }) {
    if (!this.disponible()) throw error('El inicio con Facebook no está configurado (faltan FACEBOOK_APP_ID y FACEBOOK_APP_SECRET).', 503);
    if (!accessToken) throw error('Falta la respuesta de Facebook.');
    const app = `${this.appId}|${this.secreto}`;
    const v = await (await fetch(`https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(app)}`)).json();
    if (!v.data?.is_valid || v.data.app_id !== this.appId) throw error('Facebook no pudo confirmar tu cuenta. Intenta de nuevo.', 401);
    const yo = await (await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture.width(200)&access_token=${encodeURIComponent(accessToken)}`)).json();
    if (!yo.id) throw error('No pudimos leer tu perfil de Facebook.', 401);
    return { proveedor: 'facebook', proveedorId: yo.id, nombre: yo.name, correo: yo.email?.toLowerCase() || null, foto: yo.picture?.data?.url || null };
  }
}

const ESTRATEGIAS = { formulario: new EstrategiaFormulario(), google: new EstrategiaGoogle(), facebook: new EstrategiaFacebook() };
export function crearEstrategia(nombre) {
  const e = ESTRATEGIAS[nombre];
  if (!e) throw error('Forma de inicio de sesión desconocida.');
  return e;
}
export const configuracionPublica = () => ({
  google: ESTRATEGIAS.google.disponible() ? ESTRATEGIAS.google.clientId : null,
  facebook: ESTRATEGIAS.facebook.disponible() ? ESTRATEGIAS.facebook.appId : null
});
