"use client";
import { FormEvent, useState } from "react";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/login", { method: "POST", body: JSON.stringify({ password: form.get("password") }), headers: { "Content-Type": "application/json" } });
    if (response.ok) window.location.assign("/"); else { setError("Incorrect password."); setLoading(false); }
  }
  return <form onSubmit={submit}><label>Password<input name="password" type="password" autoFocus required /></label>{error && <p className="error">{error}</p>}<button disabled={loading}>{loading ? "Unlocking…" : "Enter workspace"}</button></form>;
}
