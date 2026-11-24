import { GoogleLogin } from '@react-oauth/google'

function BotonGoogle({ onExito, onError }) {
  return (
    <GoogleLogin
      onSuccess={respuesta => {
        if (!respuesta.credential) {
          onError?.('Google no devolvió una credencial válida')
          return
        }

        onExito?.(respuesta.credential)
      }}
      onError={() => {
        onError?.('No se pudo iniciar sesión con Google')
      }}
      text="continue_with"
      locale="es"
    />
  )
}

export default BotonGoogle