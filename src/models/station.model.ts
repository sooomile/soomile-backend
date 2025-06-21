import { Schema, model, Document } from 'mongoose';

export interface IStation extends Document {
  stationName: string;
  stationCode: number;
  address: string;
  latitude: number;
  longitude: number;
}

const StationSchema = new Schema<IStation>({
  stationName: { type: String, required: true },
  stationCode: { type: Number, required: true, unique: true },
  address: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
}, {
  timestamps: true,
  collection: 'stations'
});

export const Station = model<IStation>('Station', StationSchema); 