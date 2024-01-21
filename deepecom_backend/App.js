const xlsx = require('xlsx');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const outputDirectory = path.join(__dirname, 'output');

// output directory
if (!fs.existsSync(outputDirectory)) {
  fs.mkdirSync(outputDirectory);
}

const downloadInvoices = async (invoiceLinks) => {
  const downloadedInvoices = [];
  for (const link of invoiceLinks) {
    try {
      const response = await axios.get(link, { responseType: 'arraybuffer' });
      const fileName = path.join(outputDirectory, `invoice_${downloadedInvoices.length + 1}.pdf`);
      fs.writeFileSync(fileName, response.data);
      downloadedInvoices.push(fileName);
      console.log(`Invoice downloaded: ${fileName}`);
    } catch (error) {
      console.error(`Error downloading invoice from ${link}:`, error.message);
    }
  }
  return downloadedInvoices;
};

const extractDataAndAddCategory = (sheet) => {
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

const createCsvFile = (invoices) => {
  const csvWriter = createCsvWriter({
    path: path.join(outputDirectory, 'extracted_data.csv'),
    header: [
      { id: 'Order Number', title: 'Order Number' },
      { id: 'Invoice Number', title: 'Invoice Number' },
      { id: 'Buyer Name', title: 'Buyer Name' },
      { id: 'Buyer address', title: 'Buyer address' },
      { id: 'Invoice Date', title: 'Invoice Date' },
      { id: 'Order Date', title: 'Order Date' },
      { id: 'Product title', title: 'Product title' },
      { id: 'HSN', title: 'HSN' },
      { id: 'Taxable value', title: 'Taxable value' },
      { id: 'Discount', title: 'Discount' },
      { id: 'Tax Rate and category', title: 'Tax Rate and category' },
    ],
  });

  csvWriter.writeRecords(invoices)
    .then(() => console.log('CSV file written successfully'))
    .catch((error) => console.error('Error writing CSV file:', error.message));
};

const getTaxRateCategory = (invoiceData) => {
  const {
    'GST% on Product Price and Delivery': gstProductDelivery,
    'Supplier State': supplierState,
    'TCS (IGST)': tcsIgst,
  } = invoiceData;

  // logic
  if (gstProductDelivery >= 10 && supplierState === 'Delhi' && tcsIgst > 5) {
    return 'IGST_Category_A';
  } else if (gstProductDelivery >= 5 && supplierState === 'Kerala') {
    return 'IGST_Category_B';
  } else {
    
    return 'IGST_Category_Default';
  }
};


const invoiceLinks = [
  'https://s3-ap-southeast-1.amazonaws.com/meesho-supply-v2/invoices/supplierToReseller/79680d66843595689ee236af431084e20ba6e424.pdf',
  'https://s3-ap-southeast-1.amazonaws.com/meesho-supply-v2/invoices/supplierToReseller/dd887580ee6aacd9db94475997b3e2d2ceda0857.pdf',
  'https://s3-ap-southeast-1.amazonaws.com/meesho-supply-v2/invoices/supplierToReseller/a1ee39e758d5372c135b844d13e64689c79ca5ea.pdf',
  'https://s3-ap-southeast-1.amazonaws.com/meesho-supply-v2/invoices/supplierToReseller/dc4eb4a16947b518bca856337a3a4e887b153fee.pdf',
  'https://s3-ap-southeast-1.amazonaws.com/meesho-supply-v2/invoices/supplierToReseller/09ad122f555f81f6f53b6cc164165a01d541e561.pdf',
  'https://s3-ap-southeast-1.amazonaws.com/meesho-supply-v2/invoices/supplierToReseller/67a2920cce0e2ad53bc124ac5f262ac53900edf5.pdf',
  'https://s3-ap-southeast-1.amazonaws.com/meesho-supply-v2/invoices/supplierToReseller/0799127f5a121963ad9111164d922b87bd3bca8d.pdf',
  'https://s3-ap-southeast-1.amazonaws.com/meesho-supply-v2/invoices/supplierToReseller/02a6927e5375d83063d5c23ed4c14474c12ad209.pdf',
];

downloadInvoices(invoiceLinks)
  .then((downloadedInvoices) => {
    console.log('Invoices downloaded:', downloadedInvoices);
    // function to get the sheet from - CSV file
    const sheet = getSheetFromCSV(path.join(__dirname, 'DeepEcom_assignment.xlsx'));
    const extractedData = extractDataAndAddCategory(sheet);
    createCsvFile(extractedData);
  })
  .catch((error) => console.error('Error:', error));

// function to get sheet 
const getSheetFromCSV = (csvFileName) => {
  const workbook = xlsx.readFile(csvFileName);
 
  const sheetName = workbook.SheetNames[0];
  return workbook.Sheets[sheetName];
};

