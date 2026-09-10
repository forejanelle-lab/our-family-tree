import { jsPDF } from "jspdf";
import { cardName, displayName, initials, lifespan } from "@/lib/format";
import {
  layoutFamilyTree,
  PERSON_NODE_HEIGHT,
  PERSON_NODE_WIDTH,
  UNION_SIZE,
} from "@/lib/tree-layout";
import type { Person, Relationship } from "@/lib/types";

function slug(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "family-tree"
  );
}

function pdfText(value: string) {
  return (value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function personLabel(person: Person) {
  return pdfText(cardName(person) || displayName(person) || "Family member") || "Family member";
}

function pageWindows(items: { start: number; size: number }[], pageSize: number) {
  const sorted = [...items].sort((a, b) => a.start - b.start);
  if (!sorted.length) return [{ start: 0, size: pageSize }];
  const windows: { start: number; size: number }[] = [];
  let index = 0;
  while (index < sorted.length) {
    const start = sorted[index].start;
    let next = index;
    while (next < sorted.length && sorted[next].start + sorted[next].size - start <= pageSize) {
      next += 1;
    }
    if (next === index) next = index + 1;
    windows.push({ start, size: pageSize });
    index = next;
  }
  return windows;
}

function overlaps(start: number, size: number, windowStart: number, windowSize: number) {
  return start < windowStart + windowSize && start + size > windowStart;
}

function triggerDownload(doc: jsPDF, filename: string) {
  try {
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch {
    doc.save(filename);
  }
}

export function buildTreePdf(
  treeName: string,
  people: Person[],
  relationships: Relationship[],
) {
  const layout = layoutFamilyTree(people, relationships);
  const byId = new Map(people.map((person) => [person.id, person]));
  const nodePos = new Map(layout.nodes.map((node) => [node.id, node]));

  const pageW = 841.89;
  const pageH = 595.28;
  const margin = 36;
  const headerH = 52;
  const innerW = pageW - margin * 2;
  const innerH = pageH - margin * 2 - headerH;

  const xWindows = pageWindows(
    layout.nodes.map((node) => ({
      start: node.x,
      size: node.type === "person" ? PERSON_NODE_WIDTH : UNION_SIZE,
    })),
    innerW,
  );
  const yWindows = pageWindows(
    layout.nodes.map((node) => ({
      start: node.y,
      size: node.type === "person" ? PERSON_NODE_HEIGHT : UNION_SIZE,
    })),
    innerH,
  );

  const treePages =
    layout.nodes.length === 0
      ? []
      : xWindows.flatMap((xWindow, col) => yWindows.map((yWindow, row) => ({ xWindow, yWindow, col, row })));

  const directory = [...people].sort((a, b) => personLabel(a).localeCompare(personLabel(b)));
  const rowsPerPage = 14;
  const directoryPages = Math.max(1, Math.ceil(directory.length / rowsPerPage));
  const total = Math.max(1, treePages.length + directoryPages);
  const title = pdfText(treeName) || "Family Tree";

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });

  function paintBackground() {
    doc.setFillColor(249, 247, 242);
    doc.rect(0, 0, pageW, pageH, "F");
  }

  function drawHeader(heading: string, subtitle: string) {
    paintBackground();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(33, 78, 52);
    doc.text(heading, margin, margin + 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(90, 108, 94);
    doc.text(subtitle, margin, margin + 34);
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(1.2);
    doc.line(margin, margin + headerH - 8, pageW - margin, margin + headerH - 8);
  }

  function drawDirectoryPage(pageIndex: number) {
    const start = pageIndex * rowsPerPage;
    const rows = directory.slice(start, start + rowsPerPage);
    let y = margin + headerH + 18;
    if (pageIndex === 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(33, 78, 52);
      doc.text(`${people.length} ${people.length === 1 ? "person" : "people"} in this tree`, margin, y);
      y += 28;
    }
    rows.forEach((person, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(255, 255, 255);
        doc.rect(margin, y - 16, innerW, 32, "F");
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(36, 40, 37);
      doc.text(personLabel(person), margin + 14, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(90, 108, 94);
      const detail = pdfText(lifespan(person) || person.birthPlace || person.occupation || "Family member");
      doc.text(detail, margin + 320, y);
      y += 34;
    });
    if (rows.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(90, 108, 94);
      doc.text("No people have been added to this tree yet.", margin, margin + headerH + 24);
    }
  }

  function drawTreePage(originX: number, originY: number, windowW: number, windowH: number) {
    const ox = margin - originX;
    const oy = margin + headerH - originY;

    for (const edge of layout.edges) {
      const from = nodePos.get(edge.source);
      const to = nodePos.get(edge.target);
      if (!from || !to) continue;
      const fromPerson = from.type === "person";
      const toPerson = to.type === "person";
      const x1 = ox + from.x + (fromPerson ? PERSON_NODE_WIDTH / 2 : UNION_SIZE / 2);
      const y1 =
        oy +
        from.y +
        (fromPerson ? (edge.type === "spouse" ? PERSON_NODE_HEIGHT / 2 : PERSON_NODE_HEIGHT) : UNION_SIZE / 2);
      const x2 = ox + to.x + (toPerson ? PERSON_NODE_WIDTH / 2 : UNION_SIZE / 2);
      const y2 =
        oy + to.y + (toPerson ? (edge.type === "spouse" ? PERSON_NODE_HEIGHT / 2 : 0) : UNION_SIZE / 2);
      doc.setDrawColor(33, 78, 52);
      doc.setLineWidth(edge.type === "spouse" ? 1.5 : 1.15);
      doc.line(x1, y1, x2, y2);
    }

    for (const node of layout.nodes) {
      const nodeW = node.type === "person" ? PERSON_NODE_WIDTH : UNION_SIZE;
      const nodeH = node.type === "person" ? PERSON_NODE_HEIGHT : UNION_SIZE;
      if (!overlaps(node.x, nodeW, originX, windowW) || !overlaps(node.y, nodeH, originY, windowH)) {
        continue;
      }
      if (node.type === "union") {
        const x = ox + node.x;
        const y = oy + node.y;
        doc.setFillColor(212, 175, 55);
        doc.circle(x + UNION_SIZE / 2, y + UNION_SIZE / 2, UNION_SIZE / 2, "F");
        continue;
      }
      const person = node.personId ? byId.get(node.personId) : undefined;
      if (!person) continue;
      const x = ox + node.x;
      const y = oy + node.y;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(160, 176, 162);
      doc.setLineWidth(1);
      doc.rect(x, y, PERSON_NODE_WIDTH, PERSON_NODE_HEIGHT, "FD");

      const cx = x + PERSON_NODE_WIDTH / 2;
      doc.setFillColor(215, 227, 216);
      doc.circle(cx, y + 48, 26, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(33, 78, 52);
      doc.text(pdfText(initials(person)) || ".", cx, y + 53, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(36, 40, 37);
      const nameLines = doc.splitTextToSize(personLabel(person), PERSON_NODE_WIDTH - 20);
      doc.text(nameLines, cx, y + PERSON_NODE_HEIGHT - 58, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(90, 108, 94);
      doc.text(pdfText(lifespan(person) || "Dates unknown"), cx, y + PERSON_NODE_HEIGHT - 24, {
        align: "center",
      });
    }
  }

  let pageIndex = 0;
  for (let i = 0; i < directoryPages; i += 1) {
    if (pageIndex > 0) doc.addPage("a4", "landscape");
    pageIndex += 1;
    drawHeader(
      title,
      `${people.length} ${people.length === 1 ? "person" : "people"}  ·  Page ${pageIndex} of ${total}  ·  People`,
    );
    drawDirectoryPage(i);
  }

  treePages.forEach((page) => {
    if (pageIndex > 0) doc.addPage("a4", "landscape");
    pageIndex += 1;
    drawHeader(
      title,
      `${people.length} ${people.length === 1 ? "person" : "people"}  ·  Page ${pageIndex} of ${total}  ·  Tree`,
    );
    drawTreePage(page.xWindow.start, page.yWindow.start, page.xWindow.size, page.yWindow.size);
  });

  return doc;
}

export function downloadTreePdf(
  treeName: string,
  people: Person[],
  relationships: Relationship[],
) {
  const doc = buildTreePdf(treeName, people, relationships);
  triggerDownload(doc, `${slug(treeName)}.pdf`);
}
