import { useMatch } from "react-router-dom";

/** Base path for client pages: "" in the client environment, "/hibe/klant/:id" inside HIBE, "/hibe/als/:id" when viewing as a client. */
export function useBase() {
  const m = useMatch("/hibe/klant/:id/*");
  const v = useMatch("/hibe/als/:id/*");
  return m ? `/hibe/klant/${m.params.id}` : v ? `/hibe/als/${v.params.id}` : "";
}
