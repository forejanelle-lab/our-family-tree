import { jsPDF } from "jspdf";
import { cardName, initials, lifespan } from "@/lib/format";
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

export function downloadTreePdf(
  treeName: string,
  people: Person[],
  relationships: Relationship[],
) {
  const layout = layoutFamilyTree(people, relationships);
  const byId = new Map(people.map((person) => [person.id, person]));
  const nodePos = new Map(layout.nodes.map((node) => [node.id, node]));

  const pageW = 842;
  const pageH = 595;
  const margin = 36;
  const headerH = 48;
  const innerW = pageW - margin * 2;
  const innerH = pageH - margin * 2 - headerH;
  const scale = 1;

  const xWindows = pageWindows(
    layout.nodes.map((node) => ({
      start: node.x,
      size: node.type === "person" ? PERSON_NODE_WIDTH : UNION_SIZE,
    })),
    innerW / scale,
  );
  const yWindows = pageWindows(
    layout.nodes.map((node) => ({
      start: node.y,
      size: node.type === "person" ? PERSON_NODE_HEIGHT : UNION_SIZE,
    })),
    innerH / scale,
  );

  const pages = xWindows.flatMap((xWindow, col) =>
    yWindows.map((yWindow, row) => ({ xWindow, yWindow, col, row })),
  );
  const total = Math.max(1, pages.length);

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });

  function drawHeader(pageIndex: number, col: number, row: number) {
    doc.setFillColor(249, 247, 242);
    doc.rect(0, 0, pageW, pageH, "F");
    doc.setFont("times", "bold");
    doc.setFontSize(18);
    doc.setTextColor(33, 78, 52);
    doc.text(treeName || "Family Tree", margin, margin + 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(106, 122, 111);
    const parts = [
      `${people.length} ${people.length === 1 ? "person" : "people"}`,
      `Page ${pageIndex} of ${total}`,
    ];
    if (total > 1) parts.push(`section ${col + 1},${row + 1}`);
    doc.text(parts.join("  ·  "), margin, margin + 32);
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(1);
    doc.line(margin, margin + headerH - 10, pageW - margin, margin + headerH - 10);
  }

  function drawTree(originX: number, originY: number) {
    const ox = margin - originX * scale;
    const oy = margin + headerH - originY * scale;

    for (const edge of layout.edges) {
      const from = nodePos.get(edge.source);
      const to = nodePos.get(edge.target);
      if (!from || !to) continue;
      const fromPerson = from.type === "person";
      const toPerson = to.type === "person";
      const x1 = ox + (from.x + (fromPerson ? PERSON_NODE_WIDTH / 2 : UNION_SIZE / 2)) * scale;
      const y1 =
        oy +
        (from.y +
          (fromPerson ? (edge.type === "spouse" ? PERSON_NODE_HEIGHT / 2 : PERSON_NODE_HEIGHT) : UNION_SIZE / 2)) *
          scale;
      const x2 = ox + (to.x + (toPerson ? PERSON_NODE_WIDTH / 2 : UNION_SIZE / 2)) * scale;
      const y2 =
        oy + (to.y + (toPerson ? (edge.type === "spouse" ? PERSON_NODE_HEIGHT / 2 : 0) : UNION_SIZE / 2)) * scale;
      doc.setDrawColor(33, 78, 52);
      doc.setLineWidth(edge.type === "spouse" ? 1.4 : 1.1);
      doc.setLineCap("round");
      doc.line(x1, y1, x2, y2);
    }

    for (const node of layout.nodes) {
      if (node.type === "union") {
        const x = ox + node.x * scale;
        const y = oy + node.y * scale;
        const size = UNION_SIZE * scale;
        doc.setFillColor(212, 175, 55);
        doc.circle(x + size / 2, y + size / 2, size / 2, "F");
        continue;
      }
      const person = node.personId ? byId.get(node.personId) : undefined;
      if (!person) continue;
      const x = ox + node.x * scale;
      const y = oy + node.y * scale;
      const w = PERSON_NODE_WIDTH * scale;
      const h = PERSON_NODE_HEIGHT * scale;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(180, 196, 181);
      doc.setLineWidth(1);
      doc.roundedRect(x, y, w, h, 14, 14, "FD");

      const cx = x + w / 2;
      const avatarR = 24;
      doc.setFillColor(215, 227, 216);
      doc.circle(cx, y + 44, avatarR, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(33, 78, 52);
      doc.text(initials(person) || "·", cx, y + 48, { align: "center" });

      doc.setFont("times", "bold");
      doc.setFontSize(14);
      doc.setTextColor(36, 40, 37);
      const nameLines = doc.splitTextToSize(cardName(person) || "Unknown", w - 24);
      doc.text(nameLines, cx, y + h - 52, { align: "center" });
      const years = lifespan(person);
      if (years) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(106, 122, 111);
        doc.text(years, cx, y + h - 22, { align: "center" });
      }
    }
  }

  pages.forEach((page, index) => {
    if (index > 0) doc.addPage("a4", "landscape");
    drawHeader(index + 1, page.col, page.row);
    doc.saveGraphicsState();
    doc.rect(margin, margin + headerH - 8, innerW, innerH + 8);
    doc.clip();
    drawTree(page.xWindow.start, page.yWindow.start);
    doc.restoreGraphicsState();
  });

  doc.save(`${slug(treeName)}.pdf`);
}
