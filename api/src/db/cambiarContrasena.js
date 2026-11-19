// Pone una contraseña nueva a una cuenta de clienta (cuando se le olvidó).
// Uso, dentro de la carpeta api:
//   npm run cambiar-contrasena -- correo@ejemplo.com NuevaClave123
// La contraseña nueva se guarda cifrada (scrypt con sal), igual que al crear la cuenta.
import { getDb } from './conexion.js';
import { Contrasenas } from '../patrones/estrategiaAutenticacion.js';
import { UsuarioModel } from '../models/UsuarioModel.js';

const [correo, nuevaContrasena] = process.argv.slice(2);

// Nombre: cambiarContrasena
// Descripción: Busca la cuenta por correo y le guarda la contraseña nueva cifrada.
// Entrada: El correo y la contraseña nueva (de la línea de comandos).
// Salida: Nada (escribe en la consola qué pasó).
// Objetivo: Recuperar una cuenta cuando se olvidó la contraseña.
function cambiarContrasena() {
  if (!correo || !nuevaContrasena) {
    console.log('Escribe el correo y la contraseña nueva:  npm run cambiar-contrasena -- correo@ejemplo.com NuevaClave123');
    return;
  }
  const cuenta = UsuarioModel.buscarPorCorreo(correo);
  if (!cuenta) {
    const correos = getDb().prepare("SELECT correo FROM usuarios WHERE proveedor = 'formulario' ORDER BY id DESC LIMIT 10").all().map((fila) => fila.correo);
    console.log(`No hay ninguna cuenta con el correo ${correo}.`);
    if (correos.length) console.log(`Cuentas creadas con correo: ${correos.join(', ')}`);
    return;
  }
  if (nuevaContrasena.length < 8 || !/\d/.test(nuevaContrasena) || !/[a-záéíóúñ]/i.test(nuevaContrasena)) {
    console.log('La contraseña debe tener al menos 8 caracteres, con letras y números.');
    return;
  }
  getDb().prepare("UPDATE usuarios SET contrasena_hash = ?, proveedor = 'formulario' WHERE id = ?").run(Contrasenas.crear(nuevaContrasena), cuenta.id);
  console.log(`Listo: ${cuenta.nombre} (${cuenta.correo}) ya puede entrar con la contraseña nueva.`);
}

cambiarContrasena();
