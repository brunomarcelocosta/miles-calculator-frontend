/**
 * Quais destinos já têm foto em `public/destinations`.
 *
 * O catalogo de dominio declara o caminho do arquivo de todos os 31 destinos,
 * mas as fotos entram em lotes. Sem esta lista, o card tentaria carregar as que
 * ainda nao existem e cada resultado renderia um punhado de 404 no console — o
 * tipo de ruido que esconde erro de verdade.
 *
 * Ao adicionar um lote de fotos, inclua os ids aqui. O `id` e a mesma chave do
 * catalogo, e o nome do arquivo sai de `destination.image`.
 */
const IDS_WITH_PHOTO = [
  // Lote 1
  'rio-de-janeiro',
  'foz-do-iguacu',
  'gramado',
  'maceio',
  'jericoacoara',
  'porto-de-galinhas',
  'buenos-aires',
  'montevideu',
  'fernando-de-noronha',
  'santiago',
  // Lote 2
  'cusco',
  'bariloche',
  'cartagena',
  'cancun',
  'ushuaia',
  'punta-cana',
  'aruba',
  // Lote 3
  'miami',
  'orlando',
  'lisboa',
  'nova-york',
  'toronto',
  'madri',
  'barcelona',
  'amsterda',
  'aspen',
  'paris',
  'roma',
  'whistler',
  'atenas',
  'zermatt',
] as const

const PHOTO_SET: ReadonlySet<string> = new Set(IDS_WITH_PHOTO)

export function hasDestinationPhoto(destinationId: string): boolean {
  return PHOTO_SET.has(destinationId)
}
