import ExcelJS from "exceljs";

const INDIGO = "4F46E5";
const INDIGO_LIGHT = "EEF2FF";
const GRAY_BORDER = "D1D5DB";
const WHITE = "FFFFFF";

function styleHeaderRow(sheet: ExcelJS.Worksheet) {
  const headerRow = sheet.getRow(1);
  headerRow.height = 36;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: WHITE }, size: 11, name: "Calibri" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: INDIGO } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      bottom: { style: "thin", color: { argb: GRAY_BORDER } },
    };
  });
}

function styleDataRows(sheet: ExcelJS.Worksheet) {
  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    row.height = 28;
    const isEven = i % 2 === 0;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { size: 10, name: "Calibri", color: { argb: "1E293B" } };
      cell.alignment = { vertical: "middle", wrapText: true };
      if (isEven) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: INDIGO_LIGHT } };
      } else {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } };
      }
      cell.border = {
        bottom: { style: "hair", color: { argb: GRAY_BORDER } },
      };
    });
  }
}

export function finalizeSheet(sheet: ExcelJS.Worksheet) {
  styleHeaderRow(sheet);
  styleDataRows(sheet);
  sheet.views = [{ state: "frozen", ySplit: 1, xSplit: 0 }];
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: sheet.columnCount },
  };
}

export async function workbookToBuffer(workbook: ExcelJS.Workbook): Promise<Uint8Array> {
  const buf = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buf);
}

export { ExcelJS };
