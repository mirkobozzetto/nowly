import { redirect } from "next/navigation";

const Page = (): never => {
  redirect("/docs/changelog");
};

export default Page;