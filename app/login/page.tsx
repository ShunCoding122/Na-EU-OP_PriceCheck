import { redirect } from "next/navigation";
import { isSignedIn } from "../../lib/auth";
import LoginForm from "./login-form";

export default async function LoginPage() {
  if (await isSignedIn()) redirect("/");
  return <main className="login-shell"><section className="login-card"><p className="eyebrow">PRIVATE TOOL</p><h1>OP Market Compare</h1><p>North America × Europe price intelligence for One Piece Card Game.</p><LoginForm /></section></main>;
}
