import { queryOptions } from "@tanstack/react-query";
import { getStorms } from "./storms.functions";

export const stormsQueryOptions = queryOptions({
  queryKey: ["storms"],
  queryFn: () => getStorms(),
  refetchInterval: 5 * 60 * 1000,
  refetchOnWindowFocus: true,
  staleTime: 60 * 1000,
});
