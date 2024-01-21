const xlsx = require('xlsx');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');

const outputDirectory = path.join(__dirname, '..', 'output');

// Create the output directory
if (!fs.existsSync(outputDirectory)) {
  fs.mkdirSync(outputDirectory);
}
// extracting  data from the Excel sheet
exports.extractDataFromSheet = (sheet) => {
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  const headers = data[0];

  const invoices = [];

  for (let i = 1; i < data.length; i++) {
    const invoiceData = {};
    for (let j = 0; j < headers.length; j++) {
      invoiceData[headers[j]] = data[i][j];
    }

    
    const taxRateCategory = getTaxRateCategory(invoiceData);
    invoiceData['TaxRateCategory'] = taxRateCategory;

    invoices.push(invoiceData);
  }

  return invoices;
};

// Function to create a new CSV file 
exports.createCsvFile = (invoices) => {
  const csvWriter = createCsvWriter({
    path: './output/extracted_data.csv',
    header: [
      { id: 'OrderNumber', title: 'Order Number' },
      { id: 'InvoiceNumber', title: 'Invoice Number' },
      { id: 'BuyerName', title: 'Buyer Name' },
      { id: 'BuyerAddress', title: 'Buyer Address' },
      { id: 'InvoiceDate', title: 'Invoice Date' },
      { id: 'OrderDate', title: 'Order Date' },
      { id: 'ProductTitle', title: 'Product Title' },
      { id: 'HSN', title: 'HSN' },
      { id: 'TaxableValue', title: 'Taxable Value' },
      { id: 'Discount', title: 'Discount' },
      { id: 'TaxRateCategory', title: 'Tax Rate and Category' },
    ],
  });

  csvWriter.writeRecords(invoices)
    .then(() => console.log('CSV file written successfully'));
};


function getTaxRateCategory(invoiceData) {
  
  return 'IGST';
}
