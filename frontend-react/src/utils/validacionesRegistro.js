
const dominiosPermitidos =
  /^[^\s@]+@(duoc\.cl|profesor\.duoc\.cl|gmail\.com)$/i

const soloTelefono =
  /^[0-9+\s-]{8,15}$/

const formatoRun =
  /^\d{6,8}-[\dK]$/

const runSinFormato =
  /^\d{6,8}[\dK]$/

export function formatearRunEntrada(valor) {
  const texto = String(valor ?? '')
    .toUpperCase()
    .replace(/[.\s]/g, '')
    .replace(/[^0-9K-]/g, '')

  const posicionGuion = texto.indexOf('-')

  if (posicionGuion === -1) {
    return texto
      .replace(/\D/g, '')
      .slice(0, 8)
  }

  const numero = texto
    .slice(0, posicionGuion)
    .replace(/\D/g, '')
    .slice(0, 8)

  const dv = texto
    .slice(posicionGuion + 1)
    .replace(/[^0-9K]/g, '')
    .slice(0, 1)

  return `${numero}-${dv}`
}

export function normalizarRun(run) {
  return String(run ?? '')
    .replace(/[.\-\s]/g, '')
    .toUpperCase()
}

export function calcularDvRun(numeroRun) {
  const numero = String(numeroRun ?? '')

  if (!/^\d{6,8}$/.test(numero)) {
    return null
  }

  let suma = 0
  let multiplo = 2

  for (let i = numero.length - 1; i >= 0; i--) {
    suma += Number(numero[i]) * multiplo

    multiplo =
      multiplo === 7 ? 2 : multiplo + 1
  }

  const resultado = 11 - (suma % 11)

  if (resultado === 11) return '0'
  if (resultado === 10) return 'K'

  return String(resultado)
}

export function runValido(run) {
  const limpio = normalizarRun(run)

  if (!runSinFormato.test(limpio)) {
    return false
  }

  const numero = limpio.slice(0, -1)
  const dvIngresado = limpio.slice(-1)

  return calcularDvRun(numero) === dvIngresado
}

export function validarRun(run) {
  const valor = String(run ?? '').trim().toUpperCase()

  if (valor === '') {
    return 'Ingrese su RUN o RUT'
  }

  if (!formatoRun.test(valor)) {
    return 'Ingrese el RUN sin puntos y con guion (ej.: 12345678-5)'
  }

  if (!runValido(valor)) {
    return 'RUN inválido: revise el dígito verificador'
  }

  return ''
}

export function validarNombreRegistro(nombre) {
  const valor = nombre.trim()

  if (valor === '') {
    return 'Ingrese su nombre'
  }

  if (valor.length > 50) {
    return 'El nombre no puede superar los 50 caracteres'
  }

  return ''
}

export function validarApellidos(apellidos) {
  const valor = apellidos.trim()

  if (valor === '') {
    return 'Ingrese sus apellidos'
  }

  if (valor.length > 100) {
    return 'Los apellidos no pueden superar los 100 caracteres'
  }

  return ''
}

export function validarCorreoRegistro(correo) {
  const valor = correo.trim()

  if (valor === '') {
    return 'Ingrese su correo'
  }

  if (valor.length > 100) {
    return 'El correo no puede superar los 100 caracteres'
  }

  if (!dominiosPermitidos.test(valor)) {
    return 'Solo dominios: @duoc.cl, @profesor.duoc.cl o @gmail.com'
  }

  return ''
}

export function validarContrasena(contrasena) {
  if (contrasena === '') {
    return 'Ingrese una contraseña'
  }

  if (
    contrasena.length < 6 ||
    contrasena.length > 20
  ) {
    return 'La contraseña debe tener entre 6 y 20 caracteres'
  }

  return ''
}

export function validarConfirmarContrasena(
  contrasena,
  confirmar
) {
  if (confirmar === '') {
    return 'Confirme su contraseña'
  }

  if (confirmar !== contrasena) {
    return 'Las contraseñas no coinciden'
  }

  return ''
}

export function validarTelefonoRegistro(telefono) {
  const valor = telefono.trim()

  if (
    valor !== '' &&
    !soloTelefono.test(valor)
  ) {
    return 'Ingrese un teléfono válido'
  }

  return ''
}

export function validarFechaNacimiento(fecha) {
  if (fecha === '') {
    return ''
  }

  const ingresada = new Date(`${fecha}T00:00:00`)

  if (Number.isNaN(ingresada.getTime())) {
    return 'Fecha de nacimiento inválida'
  }

  if (ingresada > new Date()) {
    return 'La fecha de nacimiento no puede ser futura'
  }

  return ''
}

export function validarRegion(region) {
  if (region === '') {
    return 'Seleccione una región'
  }

  return ''
}

export function validarComuna(comuna) {
  if (comuna === '') {
    return 'Seleccione una comuna'
  }

  return ''
}

export function validarDireccion(direccion) {
  const valor = direccion.trim()

  if (valor === '') {
    return 'Ingrese su dirección'
  }

  if (valor.length > 300) {
    return 'La dirección no puede superar los 300 caracteres'
  }

  return ''
}
