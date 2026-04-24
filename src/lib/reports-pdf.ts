import PDFDocument from "pdfkit";

import { formatDistance, formatOdometerNumber, type Unit } from "@/lib/units";
import { localeTag, t, type Locale } from "@/lib/i18n";

export type ReportTrip = {
  date: Date;
  driverName: string;
  startOdometerKm: number;
  endOdometerKm: number;
  notes: string | null;
};

export type ReportVehicleSection = {
  vehicleName: string;
  licensePlate: string | null;
  trips: ReportTrip[];
};

export type MileageReportInput = {
  ownerName: string;
  ownerEmail: string;
  rangeFrom: Date;
  rangeTo: Date;
  generatedAt: Date;
  unit: Unit;
  locale: Locale;
  sections: ReportVehicleSection[];
};

/**
 * Render a mileage report as a PDF byte buffer.
 *
 * Layout:
 *   - Header: app name, report title, owner, date range, generation timestamp.
 *   - Per-vehicle section: vehicle heading + table of trips (Date, Driver,
 *     Start, End, Distance, Notes) + per-vehicle subtotal.
 *   - Grand total footer with combined trip count + distance.
 *
 * All distances are rendered in the owner's unit + locale so the export
 * matches the preference selected at the time of generation.
 */
export async function renderMileageReportPdf(
  input: MileageReportInput,
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: 56, bottom: 56, left: 56, right: 56 },
    info: {
      Title: "Mileage report",
      Author: input.ownerName,
      Creator: "Mileage Tracker",
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const tr = (key: string, vars?: Record<string, string | number>) =>
    t(input.locale, key, vars);
  const tag = localeTag(input.locale);
  const dateFmt = new Intl.DateTimeFormat(tag, { dateStyle: "medium" });
  const dtFmt = new Intl.DateTimeFormat(tag, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // -- Header ---------------------------------------------------------------
  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor("#111")
    .text(tr("reports.pdf.title"), { continued: false });
  doc.moveDown(0.2);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#444")
    .text(
      `${tr("reports.pdf.generatedOn")}: ${dtFmt.format(input.generatedAt)}`,
    );
  doc.moveDown(0.4);
  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor("#111")
    .text(
      `${tr("reports.pdf.driver")}: ${input.ownerName} <${input.ownerEmail}>`,
    );
  doc.text(
    `${tr("reports.pdf.range")}: ${dateFmt.format(input.rangeFrom)} — ${dateFmt.format(input.rangeTo)}`,
  );
  doc.moveDown(0.8);

  // -- Sections -------------------------------------------------------------
  const pageWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;
  // Column ratios (sum ≈ 1). Tweak to keep Notes legible while the odometer
  // columns stay right-aligned and narrow enough for 6-digit readings.
  const colRatios = {
    date: 0.12,
    driver: 0.17,
    start: 0.13,
    end: 0.13,
    distance: 0.13,
    notes: 0.32,
  };
  const colX: Record<keyof typeof colRatios, number> = {
    date: doc.page.margins.left,
    driver: 0,
    start: 0,
    end: 0,
    distance: 0,
    notes: 0,
  };
  let running = colX.date;
  const widths: Record<keyof typeof colRatios, number> = {
    date: pageWidth * colRatios.date,
    driver: pageWidth * colRatios.driver,
    start: pageWidth * colRatios.start,
    end: pageWidth * colRatios.end,
    distance: pageWidth * colRatios.distance,
    notes: pageWidth * colRatios.notes,
  };
  (Object.keys(widths) as (keyof typeof widths)[]).forEach((key, idx) => {
    if (idx === 0) {
      colX[key] = running;
    } else {
      colX[key] = running;
    }
    running += widths[key];
  });
  // Recompute so colX[key] is the left edge of that column.
  running = doc.page.margins.left;
  (Object.keys(widths) as (keyof typeof widths)[]).forEach((key) => {
    colX[key] = running;
    running += widths[key];
  });

  const rowPaddingY = 4;

  const drawHeaderRow = (startY: number): number => {
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#111");
    doc
      .rect(doc.page.margins.left, startY, pageWidth, 18)
      .fill("#F4F4F5");
    doc.fillColor("#111");
    const headers: Record<keyof typeof widths, string> = {
      date: tr("reports.pdf.col.date"),
      driver: tr("reports.pdf.col.driver"),
      start: tr("reports.pdf.col.start"),
      end: tr("reports.pdf.col.end"),
      distance: tr("reports.pdf.col.distance"),
      notes: tr("reports.pdf.col.notes"),
    };
    (Object.keys(headers) as (keyof typeof widths)[]).forEach((key) => {
      const align =
        key === "start" || key === "end" || key === "distance"
          ? "right"
          : "left";
      doc.text(headers[key], colX[key] + 4, startY + 5, {
        width: widths[key] - 8,
        align,
        lineBreak: false,
      });
    });
    return startY + 18;
  };

  const ensureSpace = (neededHeight: number) => {
    const bottomLimit = doc.page.height - doc.page.margins.bottom;
    if (doc.y + neededHeight > bottomLimit) {
      doc.addPage();
    }
  };

  const unit = input.unit;
  const locale = input.locale;
  // Vertical cursor. PDFKit's doc.y already tracks the current baseline, but
  // we use explicit y math for table rows to keep the columns aligned.
  for (const section of input.sections) {
    ensureSpace(100);
    doc.moveDown(0.5);
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#111")
      .text(
        section.licensePlate
          ? `${section.vehicleName} (${section.licensePlate})`
          : section.vehicleName,
        doc.page.margins.left,
        doc.y,
      );
    doc.moveDown(0.3);

    if (section.trips.length === 0) {
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#666")
        .text(tr("reports.pdf.emptySection"));
      doc.moveDown(0.5);
      continue;
    }

    let y = drawHeaderRow(doc.y);
    doc.font("Helvetica").fontSize(9).fillColor("#111");

    let sectionDistanceKm = 0;
    for (const trip of section.trips) {
      const distanceKm = trip.endOdometerKm - trip.startOdometerKm;
      sectionDistanceKm += distanceKm;

      const values = {
        date: dateFmt.format(trip.date),
        driver: trip.driverName,
        start: formatOdometerNumber(trip.startOdometerKm, unit, locale),
        end: formatOdometerNumber(trip.endOdometerKm, unit, locale),
        distance: formatOdometerNumber(distanceKm, unit, locale),
        notes: trip.notes ?? "",
      } as Record<keyof typeof widths, string>;

      // Pre-measure row height (notes can wrap).
      const rowHeights = (Object.keys(widths) as (keyof typeof widths)[]).map(
        (key) =>
          doc.heightOfString(values[key], {
            width: widths[key] - 8,
            align:
              key === "start" || key === "end" || key === "distance"
                ? "right"
                : "left",
          }),
      );
      const rowHeight = Math.max(...rowHeights) + rowPaddingY * 2;

      const bottomLimit = doc.page.height - doc.page.margins.bottom;
      if (y + rowHeight > bottomLimit) {
        doc.addPage();
        y = drawHeaderRow(doc.page.margins.top);
        doc.font("Helvetica").fontSize(9).fillColor("#111");
      }

      (Object.keys(values) as (keyof typeof widths)[]).forEach((key) => {
        const align =
          key === "start" || key === "end" || key === "distance"
            ? "right"
            : "left";
        doc.text(values[key], colX[key] + 4, y + rowPaddingY, {
          width: widths[key] - 8,
          align,
        });
      });
      doc
        .strokeColor("#E4E4E7")
        .lineWidth(0.5)
        .moveTo(doc.page.margins.left, y + rowHeight)
        .lineTo(doc.page.margins.left + pageWidth, y + rowHeight)
        .stroke();
      y += rowHeight;
    }

    // Section subtotal
    doc.y = y;
    doc.moveDown(0.3);
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#111")
      .text(
        `${tr("reports.pdf.subtotal", {
          count: section.trips.length,
          distance: formatDistance(sectionDistanceKm, unit, locale),
        })}`,
        doc.page.margins.left,
        doc.y,
        { align: "right", width: pageWidth },
      );
    doc.moveDown(0.8);
  }

  // -- Grand total ----------------------------------------------------------
  const totalTrips = input.sections.reduce(
    (sum, s) => sum + s.trips.length,
    0,
  );
  const totalDistanceKm = input.sections.reduce(
    (sum, s) =>
      sum +
      s.trips.reduce(
        (acc, trip) => acc + (trip.endOdometerKm - trip.startOdometerKm),
        0,
      ),
    0,
  );
  doc.moveDown(0.5);
  doc
    .strokeColor("#111")
    .lineWidth(1)
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.margins.left + pageWidth, doc.y)
    .stroke();
  doc.moveDown(0.3);
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor("#111")
    .text(
      tr("reports.pdf.grandTotal", {
        count: totalTrips,
        distance: formatDistance(totalDistanceKm, unit, locale),
      }),
      { align: "right" },
    );

  doc.end();
  return done;
}
