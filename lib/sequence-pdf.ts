import { parseSequenceItems, type SequenceCard, type TextItem } from "./sequence-card";

export async function readSequencePdf(data: Uint8Array): Promise<SequenceCard | null> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs
    .getDocument({ data, disableWorker: true, isEvalSupported: false } as never)
    .promise;
  const page = await doc.getPage(1);
  const content = await page.getTextContent();
  const items: TextItem[] = [];
  for (const item of content.items) {
    if (!("str" in item) || !item.str.trim()) continue;
    items.push({ x: item.transform[4], y: item.transform[5], text: item.str });
  }
  return parseSequenceItems(items);
}
