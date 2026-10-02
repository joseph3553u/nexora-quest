import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = workerUrl;

export async function extractPdfText(file: File, maxChars = 100_000): Promise<string> {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Choose a PDF file.");
  }
  if (file.size > 20 * 1024 * 1024) throw new Error("PDFs must be 20 MB or smaller.");
  const pdf = await getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  if (pdf.numPages > 250) throw new Error("This PDF is over the 250-page limit.");
  const pages: string[] = [];
  let length = 0;
  for (let pageNo = 1; pageNo <= pdf.numPages && length < maxChars; pageNo += 1) {
    const page = await pdf.getPage(pageNo);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) {
      const remaining = Math.max(0, maxChars - length);
      pages.push(text.slice(0, remaining));
      length += text.length;
    }
  }
  const result = pages.join("\n\n").trim();
  if (result.length < 40)
    throw new Error("No readable text was found. This may be a scanned image-only PDF.");
  return result;
}
