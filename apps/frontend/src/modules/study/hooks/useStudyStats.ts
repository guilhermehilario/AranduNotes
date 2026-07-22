import { useQuery } from '@tanstack/react-query';
import studyService from '../services/studyService';
import type { StudyStats } from '../services/studyService';

export function useStudyStats() {
  const query = useQuery<StudyStats>({
    queryKey: ['study-stats'],
    queryFn: () => studyService.getStats(),
    staleTime: 1000 * 60 * 2, // 2 minutos
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  return {
    ...query,
    // Garantir que isLoading seja true apenas na primeira carga, não em refetches
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  };
}

export default useStudyStats;
