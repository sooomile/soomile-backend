import { Request, Response } from 'express';
import mongoose from 'mongoose';
import * as nearbyService from '../services/nearby.service';
import { StatusCodes } from 'http-status-codes';

export const getNearbyStations = async (req: Request, res: any) => {
  try {
    const { daycareId } = req.params;

    // Validate the provided ID
    if (!mongoose.Types.ObjectId.isValid(daycareId)) {
      return res.sendError(StatusCodes.BAD_REQUEST, 'Invalid daycare ID format.');
    }

    const nearbyStations = await nearbyService.findNearbyStations(daycareId);

    res.sendSuccess(StatusCodes.OK, 'Successfully retrieved nearby stations.', nearbyStations);
  } catch (error: any) {
    if (error.message === 'Daycare not found') {
      return res.sendError(StatusCodes.NOT_FOUND, error.message);
    }
    res.sendError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};
 