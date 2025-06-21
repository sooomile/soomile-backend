import { Request, Response } from 'express';
import * as daycareService from '../services/daycare.service';
import { StatusCodes } from 'http-status-codes';

export const searchDaycares = async (req: Request, res: any) => {
  try {
    const { name } = req.query;

    if (!name || typeof name !== 'string') {
      return res.sendError(StatusCodes.BAD_REQUEST, 'A search term "name" is required.');
    }

    const searchResults = await daycareService.searchDaycaresByName(name);
    
    if (searchResults.length === 0) {
      return res.sendSuccess(StatusCodes.OK, 'No daycare centers found matching the search term.', []);
    }

    res.sendSuccess(StatusCodes.OK, 'Successfully retrieved daycare centers.', searchResults);
  } catch (error: any) {
    res.sendError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
}; 