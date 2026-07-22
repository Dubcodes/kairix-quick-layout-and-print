import type { PageModel } from '../../models/types';

export function referencedSourceIds(historyPages: PageModel[]): Set<string> {
  return new Set(historyPages.flatMap((page) => page.images.map((image) => image.sourceId)));
}
