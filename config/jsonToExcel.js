const ExcelJS = require("exceljs");

const headerStyle = {
  fill: {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFB3E5FC" }, // Pale blue background color
  },
  font: { bold: true },
  border: {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  },
};

const cellBorder = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

// Helper function to style headers
function styleHeaders(sheet) {
  sheet.getRow(1).eachCell((cell) => {
    cell.style = headerStyle;
  });
}

// Helper function to add data with borders
function addDataWithBorders(sheet, data) {
  data.forEach((item) => {
    sheet.addRow(item).eachCell((cell) => {
      cell.border = cellBorder;
    });
  });
}

// Auto-fit column width based on the content
// function autoFitColumns(sheet) {
//   sheet.columns.forEach((column) => {
//     let maxLength = 0;
//     column.eachCell({ includeEmpty: true }, (cell) => {
//       const length = cell.value ? cell.value.toString().length : 10;
//       if (length > maxLength) maxLength = length;
//     });
//     column.width = maxLength < 10 ? 10 : maxLength;
//   });
// }

function autoFitColumns(sheet) {
  sheet.columns.forEach((column) => {
    column.width = 10; // Set fixed width for all columns
  });
}

// Function to add and format sheets
function addSheet(workbook, sheetName, columns, data) {
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns;
  styleHeaders(sheet);
  addDataWithBorders(sheet, data);
  autoFitColumns(sheet); // Apply auto-fit to columns
}

// Main function to create Excel file with multiple sheets
exports.createExcelFile = async (filePath, sheetsData) => {
  const workbook = new ExcelJS.Workbook();

  // Add each sheet to the workbook
  sheetsData.forEach((sheetData) => {
    const { sheetName, columns, data } = sheetData;
    addSheet(workbook, sheetName, columns, data);
  });

  await workbook.xlsx.writeFile(filePath);
  console.log(`Excel file saved at: ${filePath}`);
  return filePath;
};
