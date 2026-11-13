// On Vercel, falls back to the project's own address until NEXT_PUBLIC_SITE_URL is set.
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || (vercelHost ? `https://${vercelHost}` : "http://localhost:3000")).replace(/\/$/, "");
export const SITE_NAME = "Victor Simz | Take Command";
export const TAGLINE = "Think clearer. Lead better. Take command.";
export const CONTACT_EMAIL = "vsimukonda@gmail.com";

export const SERIES = [
  { title: "Command of Self", text: "Before you can lead others, you must learn to lead yourself." },
  { title: "The Mind Is the Battlefield", text: "Your thinking, beliefs and decisions shape the direction of your life." },
  { title: "Transformational Leadership", text: "Leadership is not position. It is influence, responsibility and transformation." },
  { title: "Commander's Journal", text: "Reflections, frameworks and exercises for intentional living and leadership." },
];
