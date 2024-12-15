const ExcelJS = require("exceljs");

exports.readExcelToJSON = async (filePath, headersMapping, sheetName) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sheet = workbook.getWorksheet(sheetName);
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found in the Excel file.`);
  }

  // Function to map headers to keys
  const getMappedKey = (header) => {
    const column = headersMapping.find((col) => col.header === header);
    if (!column) {
      throw new Error(`Unexpected header found: "${header}"`);
    }
    return column.key;
  };

  // Validate headers
  const headers = [];
  sheet.getRow(1).eachCell((cell) => {
    headers.push(cell.value);
  });

  const definedHeaders = headersMapping.map((col) => col.header);
  headers.forEach((header) => {
    if (!definedHeaders.includes(header)) {
      throw new Error(`Unexpected header in Excel: "${header}"`);
    }
  });

  if (headers.length !== definedHeaders.length) {
    throw new Error(
      `Excel headers do not match expected headers. Expected: ${definedHeaders.join(
        ", "
      )}`
    );
  }

  // Extract data from the sheet
  const jsonData = [];
  sheet.eachRow((row, rowIndex) => {
    if (rowIndex > 1) {
      const rowData = {};
      row.eachCell((cell, colIndex) => {
        const header = sheet.getRow(1).getCell(colIndex).value;
        const mappedKey = getMappedKey(header);
        rowData[mappedKey] = cell.value;
      });
      jsonData.push(rowData);
    }
  });

  return jsonData;
};
