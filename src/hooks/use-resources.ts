import { useQuery } from "@tanstack/react-query";
import { loadResourcesAsync } from "../resources";

export function useResources() {
  const {
    data: resources,
    error,
    isFetching,
  } = useQuery({
    queryFn: () => loadResourcesAsync(),
    queryKey: ["init"],
  });

  return { resources, error, isFetching };
}
