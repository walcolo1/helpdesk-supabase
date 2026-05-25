import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
// Evitar error en tiempo de construcción/arranque si falta la API key
const resend = apiKey ? new Resend(apiKey) : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  agent: "Agente de Soporte",
  user: "Usuario Final",
};

export async function sendWelcomeEmail({
  name,
  email,
  role,
  temporaryPassword,
}: {
  name: string;
  email: string;
  role: string;
  temporaryPassword: string;
}) {
  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`⚠️ [Email] RESEND_API_KEY no configurada. Simulación de correo enviado a ${email}`);
      return;
    }
    throw new Error("La configuración de correo (RESEND_API_KEY) no está disponible en producción.");
  }

  const roleLabel = roleLabels[role] ?? role;
  const loginUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/login`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Bienvenido al Help Desk</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                🎫 ITSM Help Desk
              </h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">
                Sistema de Gestión de Soporte Técnico
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:600;">
                Bienvenido, ${name} 👋
              </h2>
              <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
                Se ha creado una cuenta en el sistema para ti. A continuación encontrarás tus datos de acceso.
              </p>

              <!-- Credentials box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;">
                      Datos de Acceso
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:13px;width:130px;">Correo:</td>
                        <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;">${email}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:13px;">Contraseña temporal:</td>
                        <td style="padding:6px 0;">
                          <code style="background:#ede9fe;color:#7c3aed;padding:2px 8px;border-radius:4px;font-size:14px;font-weight:700;letter-spacing:0.05em;">${temporaryPassword}</code>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:13px;">Rol asignado:</td>
                        <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;">${roleLabel}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Warning -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0;color:#92400e;font-size:13px;line-height:1.5;">
                      ⚠️ <strong>Importante:</strong> Al iniciar sesión por primera vez, se te pedirá que establezcas una nueva contraseña de forma obligatoria. Esta contraseña temporal es de un solo uso.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 32px;border-radius:8px;">
                      Iniciar Sesión →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">
                Si no esperabas este correo, ignóralo o contacta a tu administrador de sistemas.<br/>
                Este es un correo automatizado, por favor no respondas a este mensaje.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Bienvenido al Help Desk — Tus credenciales de acceso`,
    html,
  });

  if (error) {
    // Lanzamos para que el caller lo maneje, pero no exponemos la contraseña
    throw new Error(`Error al enviar correo de bienvenida: ${error.message}`);
  }
}
