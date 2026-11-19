// Campanita de avisos del panel: muestra un número con lo que espera a la administradora
// y, al tocarla, una lista corta. Los días libres se aprueban o no desde aquí mismo.
import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import Foto from '../../components/Foto.jsx';
import { fechaLarga } from './piezasPanel.jsx';

const TIPO = { libre: 'día libre', vacaciones: 'vacaciones', incapacidad: 'incapacidad', permiso: 'permiso' };
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];
// Nombre: corta
// Descripción: Escribe una fecha corta (5 may).
// Entrada: La fecha.
// Salida: El texto.
// Objetivo: Avisos cortos.
const corta = (fecha) => `${Number(fecha.slice(8))} ${MESES[Number(fecha.slice(5, 7)) - 1]}`;

// Nombre: Campanita
// Descripción: Muestra la campanita de avisos.
// Entrada: Sección y cómo ir.
// Salida: La campanita.
// Objetivo: Ver pendientes sin estorbar.
export default function Campanita({ seccion, onIr }) {
  const [avisos, setAvisos] = useState(null);
  const [abierta, setAbierta] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const caja = useRef(null);
  // Nombre: cargar
  // Descripción: Carga los avisos.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Tener avisos al día.
  const cargar = () => api.admin.avisos().then(setAvisos).catch(() => {});

  useEffect(() => { cargar(); const intervalo = setInterval(cargar, 60000); return () => clearInterval(intervalo); }, []);
  useEffect(() => { cargar(); }, [seccion]);
  useEffect(() => {
    // Nombre: fuera
    // Descripción: Cierra al tocar afuera.
    // Entrada: El clic.
    // Salida: Nada.
    // Objetivo: No estorbar.
    const fuera = (evento) => { if (caja.current && !caja.current.contains(evento.target)) setAbierta(false); };
    // Nombre: esc
    // Descripción: Cierra con Escape.
    // Entrada: La tecla.
    // Salida: Nada.
    // Objetivo: Usar con teclado.
    const esc = (evento) => { if (evento.key === 'Escape') setAbierta(false); };
    document.addEventListener('pointerdown', fuera); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', fuera); document.removeEventListener('keydown', esc); };
  }, []);

  if (!avisos) return null;
  const total = avisos.solicitudes.length + (avisos.pedidosNuevos ? 1 : 0) + (avisos.citasSinMarcar ? 1 : 0) + (avisos.citasPorConfirmar ? 1 : 0);

  // Nombre: resolver
  // Descripción: Aprueba o rechaza un libre.
  // Entrada: El aviso y la respuesta.
  // Salida: Nada.
  // Objetivo: Responder rápido.
  const resolver = async (x, aprobar) => {
    const respuesta = aprobar ? '' : window.prompt(`¿Quieres decirle algo a ${x.nombre}? (opcional)`, 'Ese día tenemos mucha agenda, ¿podemos buscar otro?');
    if (respuesta === null) return;
    try {
      const resultado = await api.admin.resolverSolicitud(x.id, { aprobar, respuesta });
      setMensaje(aprobar ? `Aprobado: ${x.nombre} no trabaja esos días.${resultado.citasAfectadas ? ` Tenía ${resultado.citasAfectadas} ${resultado.citasAfectadas === 1 ? 'cita' : 'citas'}; avísales desde Agenda.` : ''}` : `Le respondiste a ${x.nombre} que no.`);
      cargar();
    } catch (error) { setMensaje(error.message); }
  };
  // Nombre: ir
  // Descripción: Va a una sección del panel.
  // Entrada: La sección.
  // Salida: Nada.
  // Objetivo: Atender el aviso.
  const ir = (s) => { setAbierta(false); onIr(s); };

  return (
    <div className="campanita" ref={caja}>
      <button type="button" className={`campanita__boton ${total ? 'campanita__boton--avisos' : ''}`} onClick={() => { setAbierta(!abierta); setMensaje(''); }} aria-expanded={abierta} aria-label={total ? `Avisos: ${total} pendientes` : 'Avisos: todo al día'}>
        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2.2 2.2 0 0 0 4 0" /></svg>
        {total > 0 && <span className="campanita__numero">{total}</span>}
      </button>

      {abierta && (
        <div className="campanita__panel" role="dialog" aria-label="Avisos">
          <p className="campanita__titulo">Avisos</p>
          {mensaje && <p className="aviso-ok campanita__mensaje" role="status">{mensaje}</p>}
          {total === 0 && <p className="campanita__vacio">Todo al día. No hay nada pendiente.</p>}

          {avisos.solicitudes.length > 0 && (
            <div className="campanita__grupo">
              <p className="campanita__subtitulo">Días libres por responder</p>
              <ul>
                {avisos.solicitudes.map((solicitud) => (
                  <li key={solicitud.id} className="campanita__solicitud">
                    <span className="campanita__foto">{solicitud.foto ? <Foto archivo={solicitud.foto} alt="" /> : solicitud.nombre[0]}</span>
                    <div>
                      <p><b>{solicitud.nombre}</b> pide {TIPO[solicitud.tipo] || solicitud.tipo}</p>
                      <p className="tenue">{solicitud.desde === solicitud.hasta ? fechaLarga(solicitud.desde) : `${corta(solicitud.desde)} al ${corta(solicitud.hasta)}`}{solicitud.citas ? ` · tiene ${solicitud.citas} ${solicitud.citas === 1 ? 'cita' : 'citas'}` : ''}</p>
                      {solicitud.motivo && <p className="campanita__motivo">«{solicitud.motivo}»</p>}
                      <div className="campanita__botones">
                        <button type="button" className="boton boton--chico" onClick={() => resolver(solicitud, true)}>Aprobar</button>
                        <button type="button" className="boton boton--chico boton--contorno" onClick={() => resolver(solicitud, false)}>No aprobar</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(avisos.pedidosNuevos > 0 || avisos.citasSinMarcar > 0 || avisos.citasPorConfirmar > 0) && (
            <div className="campanita__grupo">
              <p className="campanita__subtitulo">Para revisar</p>
              <ul className="campanita__enlaces">
                {avisos.pedidosNuevos > 0 && <li><button type="button" onClick={() => ir('pedidos')}><b>{avisos.pedidosNuevos}</b> {avisos.pedidosNuevos === 1 ? 'pedido nuevo por preparar' : 'pedidos nuevos por preparar'}<span>Ver pedidos ›</span></button></li>}
                {avisos.citasPorConfirmar > 0 && <li><button type="button" onClick={() => ir('agenda')}><b>{avisos.citasPorConfirmar}</b> {avisos.citasPorConfirmar === 1 ? 'cita por confirmar' : 'citas por confirmar'}<span>Ver agenda ›</span></button></li>}
                {avisos.citasSinMarcar > 0 && <li><button type="button" onClick={() => ir('pagos')}><b>{avisos.citasSinMarcar}</b> {avisos.citasSinMarcar === 1 ? 'cita de un día pasado sin marcar como atendida' : 'citas de días pasados sin marcar como atendidas'}<span>Revisar ›</span></button></li>}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
