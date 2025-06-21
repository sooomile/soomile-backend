import fs from 'fs';
import path from 'path';
import connectDB from '../src/config/db';
import { Daycare, IDaycare } from '../src/models/daycare.model';
import dotenv from 'dotenv';

dotenv.config();

const seedDaycares = async () => {
  await connectDB();

  try {
    // 1. Clear existing data
    await Daycare.deleteMany({});
    console.log('Previous daycare data cleared.');

    // 2. Read the CSV file
    const csvPath = path.join(__dirname, '../tmp.csv');
    const csvData = fs.readFileSync(csvPath, 'utf-8');
    const rows = csvData.split('\n').slice(1); //
    
    const daycaresToSave: Partial<IDaycare>[] = [];

    // 3. Parse CSV rows
    for (const row of rows) {
      if (!row) continue; // Skip empty rows

      // Split by comma, but handle commas within quotes
      const columns = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
      if (!columns || columns.length < 7) continue;

      const [
        sigungu,
        daycareName,
        address,
        latitude,
        longitude,
        stationName,
        distanceToStation
      ] = columns.map(col => col.replace(/"/g, '').trim());

      // 4. Create daycare object
      if (daycareName && address && latitude && longitude && stationName && distanceToStation) {
          daycaresToSave.push({
            daycareName,
            address,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            stationName,
            distanceToStation: parseFloat(distanceToStation),
          });
      }
    }

    // 5. Insert new data
    if (daycaresToSave.length > 0) {
      await Daycare.insertMany(daycaresToSave);
      console.log(`${daycaresToSave.length} daycare records have been inserted successfully.`);
    } else {
      console.log('No valid daycare records found in CSV to insert.');
    }

  } catch (error) {
    console.error('Error seeding daycare data:', error);
  } finally {
    // 6. Close the connection
    await require('mongoose').connection.close();
    console.log('MongoDB connection closed.');
  }
};

seedDaycares(); 