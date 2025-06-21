import { Schema, model, Document } from 'mongoose';

export interface IDaycare extends Document {
  daycareName: string;
  address: string;
  latitude: number;
  longitude: number;
  stationName: string;
  distanceToStation: number;
}

const DaycareSchema = new Schema<IDaycare>({
  daycareName: { type: String, required: true },
  address: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  stationName: { type: String, required: true },
  distanceToStation: { type: Number, required: true },
}, {
  timestamps: true,
  collection: 'daycares'
});

export const Daycare = model<IDaycare>('Daycare', DaycareSchema); 