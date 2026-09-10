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

export function downloadTreePdf(
  treeName: string,
  people: Person[],
  relationships: Relationship[],
) {
  const layout = layoutFamilyTree(people, relationships);
  const byId = new Map(people.map((person) => [person.id, person]));
  const margin = 48;
  const titleH = 52;
  const rawW = Math.max(layout.width, PERSON_NODE_WIDTH);
  const rawH = Math.max(layout.height, PERSON_NODE_HEIGHT);
  const maxInner = 1400;
  const scale = Math.min(1, maxInner / rawW, maxInner / rawH);
  const pageW = rawW * scale + margin * 2;
  const pageH = rawH * scale + margin * 2 + titleH;

  const doc = new jsPDF({
    orientation: pageW >= pageH ? "landscape" : "portrait",
    unit: "pt",
    format: [pageW, pageH],
  });

  doc.setFillColor(249, 247, 242);
  doc.rect(0, 0, pageW, pageH, "F");
  doc.setFont("times", "bold");
  doc.setFontSize(22);
  doc.setTextColor(33, 78, 52);
  doc.text(treeName || "Family Tree", margin, margin + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(106, 122, 111);
  doc.text(
    `${people.length} ${people.length === 1 ? "person" : "people"}`,
    margin,
    margin + 26,
  );

  const ox = margin;
  const oy = margin + titleH;

  const nodePos = new Map(layout.nodes.map((node) => [node.id, node]));

  for (const edge of layout.edges) {
    const from = nodePos.get(edge.source);
    const to = nodePos.get(edge.target);
    if (!from || !to) continue;
    const fromPerson = from.type === "person";
    const toPerson = to.type === "person";
    const x1 = ox + (from.x + (fromPerson ? PERSON_NODE_WIDTH / 2 : UNION_SIZE / 2)) * scale;
    const y1 =
      oy +
      (from.y + (fromPerson ? (edge.type === "spouse" ? PERSON_NODE_HEIGHT / 2 : PERSON_NODE_HEIGHT) : UNION_SIZE / 2)) *
        scale;
    const x2 = ox + (to.x + (toPerson ? PERSON_NODE_WIDTH / 2 : UNION_SIZE / 2)) * scale;
    const y2 =
      oy +
      (to.y + (toPerson ? (edge.type === "spouse" ? PERSON_NODE_HEIGHT / 2 : 0) : UNION_SIZE / 2)) * scale;
    doc.setDrawColor(33, 78, 52);
    doc.setLineWidth(edge.type === "spouse" ? 1.1 : 0.9);
    doc.setLineCap("round");
    doc.line(x1, y1, x2, y2);
  }

  for (const node of layout.nodes) {
    if (node.type === "union") {
      const x = ox + node.x * scale;
      const y = oy + node.y * scale;
      const size = Math.max(6, UNION_SIZE * scale);
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
    const r = Math.min(16, 12 * scale);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(215, 227, 216);
    doc.setLineWidth(0.8);
    doc.roundedRect(x, y, w, h, r, r, "FD");

    const cx = x + w / 2;
    const avatarR = Math.max(14, 22 * scale);
    doc.setFillColor(215, 227, 216);
    doc.circle(cx, y + 18 * scale + avatarR, avatarR, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(Math.max(8, 11 * scale));
    doc.setTextColor(33, 78, 52);
    doc.text(initials(person) || "·", cx, y + 18 * scale + avatarR + 3, { align: "center" });

    doc.setFont("times", "bold");
    doc.setFontSize(Math.max(9, 12 * scale));
    doc.setTextColor(36, 40, 37);
    const name = doc.splitTextToSize(cardName(person) || "Unknown", w - 16 * scale);
    doc.text(name, cx, y + h - 36 * scale, { align: "center" });
    const years = lifespan(person);
    if (years) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(Math.max(7, 9 * scale));
      doc.setTextColor(106, 122, 111);
      doc.text(years, cx, y + h - 16 * scale, { align: "center" });
    }
  }

  doc.save(`${slug(treeName)}.pdf`);
}
