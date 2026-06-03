import { notFound } from "next/navigation";

const CatchAll = (): never => {
  notFound();
};

export default CatchAll;
