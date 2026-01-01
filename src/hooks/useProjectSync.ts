import { useEffect } from 'react';
import { useFetchProjects } from '@/hooks/api/useProjects';
import { useProjectsActions } from '@/stores/projectsStore';


export function useProjectsSync() {
  const { data, isLoading, error } = useFetchProjects();
  const { setProjects, setIsLoading, setError } = useProjectsActions();
  
  useEffect(() => {
    if (error) {
      setError(error);
    } else if (!isLoading && data) {
      setProjects(data);
    } else if (isLoading) {
      setIsLoading(true);
    }
  }, [data, isLoading, error, setProjects, setIsLoading, setError]);
  
  // This hook doesn't return anything - it just syncs
  return null;
}