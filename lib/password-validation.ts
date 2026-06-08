export const PASSWORD_REQUIREMENTS_MESSAGE =
  "La contraseña debe tener mínimo 8 caracteres, una letra mayúscula y un carácter especial.";

export function validatePasswordStrength(password: string): boolean {
  if (!password) return false;
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}
