const baseUrl = new URL(import.meta.env.VITE_SERVER_BASE_URI + "/api/");

type GetPokemonParams = {
  offset?: number;
  limit?: number;
  types?: string[];
  abilities?: string[];
  moves?: string[];
};

export type Pokemon = {
  id: number;
  name: string;
  types: string[];
  abilities: string[];
  moves: string[];
  imageURL: string | null;
  smallImageURL: string | null;
};

export type FilteredPokemonResponse = {
  count: number;
  hasMore: boolean;
  pokemon: Pokemon[];
};

export async function getPokemon({
  offset = 0,
  limit = 10,
  types,
  abilities,
  moves,
}: GetPokemonParams = {}) {
  const pokemonURL = new URL("pokemon", baseUrl);

  pokemonURL.searchParams.append("offset", offset.toString());
  pokemonURL.searchParams.append("limit", limit.toString());

  types?.forEach((t) => pokemonURL.searchParams.append("types", t));
  abilities?.forEach((a) => pokemonURL.searchParams.append("abilities", a));
  moves?.forEach((m) => pokemonURL.searchParams.append("moves", m));

  return fetch(pokemonURL).then(
    (resp) => resp.json() as Promise<FilteredPokemonResponse>
  );
}
