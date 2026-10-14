import { useMatch } from "react-router-dom";

/** Base path for client pages: "" in the client environment, "/hibe/klant/:id" inside HIBE. */
export function useBase() {
  const m = useMatch("/hibe/klant/:id/*");
  return m ? `/hibe/klant/${m.params.id}` : "";
}
