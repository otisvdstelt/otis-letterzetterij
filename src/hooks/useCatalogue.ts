import { queryOptions, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { parseCatalogue, type Catalogue } from '../lib/type/catalogue'
import type { Specimen } from '../lib/type/metrics'
import { store } from '../lib/store'

const local = (path: string) => `${import.meta.env.BASE_URL}${path}`

async function fetchCatalogue(): Promise<Catalogue> {
  const response = await fetch(local('data/fonts.json'))
  if (!response.ok) throw new Error(`De kast kwam niet (${response.status}).`)
  return parseCatalogue(await response.json())
}

/** De kast. Hij komt mee met de site, van dezelfde plek, dus hij wordt één keer opgehaald en bewaard */
export const catalogueQuery = queryOptions({
  queryKey: ['kast'],
  queryFn: fetchCatalogue,
  staleTime: Infinity,
  gcTime: Infinity,
  retry: 1,
})

/** Haal de kast op en zet hem in de store zodra hij er is */
export function useCatalogue() {
  const query = useQuery(catalogueQuery)
  useEffect(() => {
    if (query.data) store.setCatalogue(query.data.fonts)
  }, [query.data])
  return query
}

/** "Aa" van elke letter als pad, zodat de kast voorbeelden laat zien zonder 144 fonts te laden */
export const specimensQuery = queryOptions({
  queryKey: ['specimens'],
  queryFn: async (): Promise<Record<string, Specimen>> => {
    const response = await fetch(local('data/specimens.json'))
    if (!response.ok) throw new Error(`De voorbeelden kwamen niet (${response.status}).`)
    return response.json()
  },
  staleTime: Infinity,
  gcTime: Infinity,
  retry: 1,
})

export const useSpecimens = () => useQuery(specimensQuery)
