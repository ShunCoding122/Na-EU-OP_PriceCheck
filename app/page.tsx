import { redirect } from "next/navigation";
import { isSignedIn } from "../lib/auth";
import MarketCompare from "./market-compare";

export default async function Home() {
  if (!(await isSignedIn())) redirect("/login");
  return <MarketCompare />;
}
